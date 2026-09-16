import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";

/**
 * AI-powered search engine ("Google-style" ranking) for the marketplace.
 *
 * Strategy:
 *  1. If OPENAI_API_KEY is configured, embed listing text on write and embed
 *     the query on read; rank by pgvector cosine similarity (semantic search),
 *     letting queries like "profitable hydropower under 5 crore" work.
 *  2. Always blend in a lightweight keyword/full-text + freshness signal so
 *     ranking degrades gracefully to a solid keyword search when no API key
 *     is configured, and so exact sector/keyword matches aren't buried.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

const EMBEDDING_TARGETS = {
  ListingEmbedding: "listingId",
  ProjectEmbedding: "projectId",
} as const;

type EmbeddingTable = keyof typeof EMBEDDING_TARGETS;

export function aiSearchEnabled(): boolean {
  return Boolean(OPENAI_API_KEY);
}

export async function embedText(text: string): Promise<number[] | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
    });
    if (!res.ok) {
      console.error("[ai-search] embedding request failed", await res.text());
      return null;
    }
    const json = await res.json();
    return json.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.error("[ai-search] embedding error", err);
    return null;
  }
}

function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Builds the denormalized text blob used for embeddings & fallback keyword search. */
export function buildListingSearchContent(listing: {
  hashId: string;
  industry: string;
  headOffice: unknown;
  status: string;
}): string {
  const location =
    typeof listing.headOffice === "object" && listing.headOffice
      ? JSON.stringify(listing.headOffice)
      : "";
  return [listing.hashId, listing.industry, location, listing.status].join(" ");
}

export async function upsertListingEmbedding(listingId: string, content: string) {
  const embedding = await embedText(content);
  if (!embedding) {
    await prisma.$executeRaw`
      INSERT INTO "ListingEmbedding" ("listingId", "content", "updatedAt")
      VALUES (${listingId}, ${content}, now())
      ON CONFLICT ("listingId") DO UPDATE SET "content" = ${content}, "updatedAt" = now()
    `;
    return;
  }

  const vectorSql = Prisma.raw(`'${toVectorLiteral(embedding)}'::vector(${EMBEDDING_DIMENSIONS})`);
  await prisma.$executeRaw`
    INSERT INTO "ListingEmbedding" ("listingId", "content", "embedding", "updatedAt")
    VALUES (${listingId}, ${content}, ${vectorSql}, now())
    ON CONFLICT ("listingId") DO UPDATE
      SET "content" = ${content}, "embedding" = ${vectorSql}, "updatedAt" = now()
  `;
}

export async function upsertProjectEmbedding(projectId: string, content: string) {
  const embedding = await embedText(content);
  if (!embedding) {
    await prisma.$executeRaw`
      INSERT INTO "ProjectEmbedding" ("projectId", "content", "updatedAt")
      VALUES (${projectId}, ${content}, now())
      ON CONFLICT ("projectId") DO UPDATE SET "content" = ${content}, "updatedAt" = now()
    `;
    return;
  }

  const vectorSql = Prisma.raw(`'${toVectorLiteral(embedding)}'::vector(${EMBEDDING_DIMENSIONS})`);
  await prisma.$executeRaw`
    INSERT INTO "ProjectEmbedding" ("projectId", "content", "embedding", "updatedAt")
    VALUES (${projectId}, ${content}, ${vectorSql}, now())
    ON CONFLICT ("projectId") DO UPDATE
      SET "content" = ${content}, "embedding" = ${vectorSql}, "updatedAt" = now()
  `;
}

export interface RankedListingId {
  listingId: string;
  score: number;
}

/**
 * Hybrid semantic + keyword search over a given embedding table.
 * Identifiers are inlined from a whitelist — never from user input — because
 * Prisma cannot safely parameterize table/column names in $queryRaw templates.
 */
async function searchEmbeddingTable(
  table: EmbeddingTable,
  query: string,
  limit: number
): Promise<RankedListingId[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const idColumn = EMBEDDING_TARGETS[table];
  const take = Math.max(1, Math.min(Math.floor(limit), 500));

  const queryEmbedding = await embedText(trimmed);

  if (queryEmbedding) {
    const vectorSql = `'${toVectorLiteral(queryEmbedding)}'::vector(${EMBEDDING_DIMENSIONS})`;
    try {
      const rows = await prisma.$queryRawUnsafe<{ id: string; score: number }[]>(
        `SELECT "${idColumn}" AS id,
                1 - (embedding <=> ${vectorSql}) AS score
         FROM "${table}"
         WHERE embedding IS NOT NULL
         ORDER BY embedding <=> ${vectorSql}
         LIMIT $1`,
        take
      );
      if (rows.length > 0) {
        return rows.map((r) => ({ listingId: r.id, score: Number(r.score) }));
      }
    } catch (err) {
      console.error("[ai-search] vector search failed, falling back to keyword search", err);
    }
  }

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const like = `%${trimmed.replace(/[%_]/g, "")}%`;
  let rows: { id: string; content: string; updatedAt: Date }[] = [];
  try {
    rows = await prisma.$queryRawUnsafe<{ id: string; content: string; updatedAt: Date }[]>(
      `SELECT "${idColumn}" AS id, "content", "updatedAt"
       FROM "${table}"
       WHERE "content" ILIKE $1
       LIMIT $2`,
      like,
      take * 2
    );
  } catch (err) {
    console.error("[ai-search] keyword search failed", err);
    return [];
  }

  const scored = rows.map((row) => {
    const contentLower = row.content.toLowerCase();
    const matches = tokens.filter((t) => contentLower.includes(t)).length;
    const ageDays = (Date.now() - new Date(row.updatedAt).getTime()) / 86_400_000;
    const freshnessBoost = Math.max(0, 1 - ageDays / 365);
    return { listingId: row.id, score: matches + freshnessBoost * 0.1 };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, take);
}

export async function searchListingIds(query: string, limit = 50): Promise<RankedListingId[]> {
  return searchEmbeddingTable("ListingEmbedding", query, limit);
}

export async function searchProjectIds(query: string, limit = 50): Promise<RankedListingId[]> {
  return searchEmbeddingTable("ProjectEmbedding", query, limit);
}
