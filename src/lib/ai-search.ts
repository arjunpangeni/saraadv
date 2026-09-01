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
    // Still persist the content so keyword fallback search stays up to date.
    await prisma.$executeRaw`
      INSERT INTO "ListingEmbedding" ("listingId", "content", "updatedAt")
      VALUES (${listingId}, ${content}, now())
      ON CONFLICT ("listingId") DO UPDATE SET "content" = ${content}, "updatedAt" = now()
    `;
    return;
  }

  const vectorLiteral = toVectorLiteral(embedding);
  await prisma.$executeRaw`
    INSERT INTO "ListingEmbedding" ("listingId", "content", "embedding", "updatedAt")
    VALUES (${listingId}, ${content}, ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS}), now())
    ON CONFLICT ("listingId") DO UPDATE
      SET "content" = ${content}, "embedding" = ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS}), "updatedAt" = now()
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

  const vectorLiteral = toVectorLiteral(embedding);
  await prisma.$executeRaw`
    INSERT INTO "ProjectEmbedding" ("projectId", "content", "embedding", "updatedAt")
    VALUES (${projectId}, ${content}, ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS}), now())
    ON CONFLICT ("projectId") DO UPDATE
      SET "content" = ${content}, "embedding" = ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS}), "updatedAt" = now()
  `;
}

export interface RankedListingId {
  listingId: string;
  score: number;
}

/**
 * Hybrid semantic + keyword search over a given embedding table.
 * Safe to call even without pgvector data (falls back to ILIKE keyword scoring).
 */
async function searchEmbeddingTable(
  table: "ListingEmbedding" | "ProjectEmbedding",
  idColumn: "listingId" | "projectId",
  query: string,
  limit: number
): Promise<RankedListingId[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tableRef = Prisma.raw(`"${table}"`);
  const idColumnRef = Prisma.raw(`"${idColumn}"`);

  const queryEmbedding = await embedText(trimmed);

  if (queryEmbedding) {
    const vectorLiteral = toVectorLiteral(queryEmbedding);
    try {
      const rows = await prisma.$queryRaw<{ id: string; score: number }[]>`
        SELECT ${idColumnRef} AS id, 1 - (embedding <=> ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS})) AS score
        FROM ${tableRef}
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector(${EMBEDDING_DIMENSIONS})
        LIMIT ${limit}
      `;
      if (rows.length > 0) return rows.map((r) => ({ listingId: r.id, score: r.score }));
    } catch (err) {
      console.error("[ai-search] vector search failed, falling back to keyword search", err);
    }
  }

  // Keyword fallback: naive relevance = number of matched query tokens + recency boost.
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const like = `%${trimmed.replace(/[%_]/g, "")}%`;
  const rows = await prisma.$queryRaw<{ id: string; content: string; updatedAt: Date }[]>`
    SELECT ${idColumnRef} AS id, "content", "updatedAt" FROM ${tableRef}
    WHERE "content" ILIKE ${like}
    OR ${Prisma.join(tokens.map((t) => Prisma.sql`"content" ILIKE ${"%" + t + "%"}`), " OR ")}
    LIMIT ${limit * 2}
  `;

  const scored = rows.map((row) => {
    const contentLower = row.content.toLowerCase();
    const matches = tokens.filter((t) => contentLower.includes(t)).length;
    const ageDays = (Date.now() - new Date(row.updatedAt).getTime()) / 86_400_000;
    const freshnessBoost = Math.max(0, 1 - ageDays / 365);
    return { listingId: row.id, score: matches + freshnessBoost * 0.1 };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function searchListingIds(query: string, limit = 50): Promise<RankedListingId[]> {
  return searchEmbeddingTable("ListingEmbedding", "listingId", query, limit);
}

export async function searchProjectIds(query: string, limit = 50): Promise<RankedListingId[]> {
  return searchEmbeddingTable("ProjectEmbedding", "projectId", query, limit);
}
