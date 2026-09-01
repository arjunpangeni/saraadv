# SARA Advisors Platform

Full-stack platform for SARA Advisors covering all five strategic pillars - **Start a Business**,
**Buy/Sell (M&A)**, **Asset Management**, **Project Bank**, and **Carbon Finance** - anchored by an
anonymized M&A marketplace with an NDA-gated deal room, AI-ranked search, SEO-optimized marketing
pages, and product analytics.

## Tech Stack

- **Framework:** Next.js 16 (App Router), TypeScript, Server Actions + Route Handlers
- **Database:** PostgreSQL + Prisma ORM 6, with the `pgvector` extension for AI search
- **Auth:** Auth.js (NextAuth v5) with Credentials provider, JWT sessions, and a custom RBAC layer
- **Storage:** Cloudinary (images, PDFs, Excel), with a local-disk fallback for dev
- **UI:** Tailwind CSS v4, custom design system components, React Hook Form-free controlled forms, Zod validation
- **Data fetching:** TanStack Query (client), Server Components (server)
- **AI Search:** OpenAI embeddings + `pgvector` cosine similarity, with a keyword/ILIKE fallback when no API key is set
- **PDF:** `pdf-lib` for the automated Investment Teaser generator
- **Analytics:** First-party event log (`Event` table) + Recharts funnel dashboard
- **Testing:** Vitest (unit tests for financial calculations and the compliance rules engine)

## Getting Started

### 1. Start the database

```bash
docker compose up -d
```

This starts a `pgvector/pgvector:pg16` Postgres container (see `docker-compose.yml`).

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` (defaults match `docker-compose.yml`), `AUTH_SECRET` (generate with
`npx auth secret`), and optionally `OPENAI_API_KEY` (enables semantic AI search and richer
embeddings; without it, search gracefully falls back to keyword matching) and Cloudinary
credentials (without them, uploaded files are stored on local disk and served via
`/api/storage/[...key]`).

### 3. Install dependencies, migrate, and seed

```bash
npm install
npx prisma migrate dev
npm run db:seed
```

Seeding loads the "Start a Business" regulatory rule set, the IEE/EIA threshold table, the FDI
Negative List, and demo accounts (password for all: `Password123!`):

| Email                        | Role         |
| ----------------------------- | ------------ |
| admin@saraadvisors.com       | ADMIN        |
| advisor@saraadvisors.com     | ADVISOR      |
| seller@example.com           | SELLER       |
| entrepreneur@example.com     | ENTREPRENEUR |
| investor@example.com         | INVESTOR     |

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## Key Flows

- **Sell a business:** `/sell/new` runs the seller ingestion wizard (Modules A-F) with live
  Gross Profit / EBITDA / NPAT calculations, then submits for advisor review.
- **Browse the marketplace:** `/marketplace` lists anonymized opportunities with sector, deal-value,
  and profitability filters, plus AI-ranked natural-language search (e.g. *"profitable hydropower
  under 5 crore"*).
- **NDA gate:** `/marketplace/[hashId]/unlock` executes a digital NDA, then lets buyers request the
  full profile and quote SARA advisory add-ons - this creates a priority `CrmTicket` for the advisor
  desk (`/advisor/crm`).
- **Start a Business:** `/start-a-business/wizard` runs the compliance rules engine
  (`src/lib/rules/startABusiness.ts`) against FDI Negative List, shareholder, and capital rules, and
  generates a registration/licensing checklist.
- **Project Bank:** `/project-bank/discover` shows the investor discovery grid; `/project-bank/new`
  lets entrepreneurs submit a teaser; lead capture creates a priority CRM ticket.
- **Carbon Finance:** `/dashboard/carbon` lets users register and track carbon credit projects.
- **Analytics:** `/admin/analytics` visualizes the Buy/Sell monetization funnel
  (`listing_view -> request_scrutiny -> nda_signed -> unlock_request -> crm_ticket_created`).

## Project Structure

```
app/
  prisma/
    schema.prisma        # Full data model across all 5 pillars
    data/                 # Seed data: regulatory rules, IEE/EIA table, FDI negative list
    seed.ts
  src/
    app/                  # Next.js App Router routes (pages + API route handlers)
    components/           # UI primitives, marketing, marketplace, wizard, analytics components
    lib/                   # Business logic: auth, rbac, calc, ai-search, listings, storage, rules/
    types/                 # Shared Zod schemas
  tests/                   # Vitest unit tests
```

## Testing

```bash
npm test
```

## Notes & Known Limitations

- The IEE/EIA threshold table (`prisma/data/ieeEiaCriteria.json`) contains a representative subset of
  Nepal's official ~292-row screening schedule across all sectors. Before production legal use,
  reconcile this table against the authoritative government schedule.
- The seller wizard, business-setup intake, and other forms use lightweight controlled-input state
  rather than a form library, to keep the nested Modules A-F structure easy to follow; consider
  migrating to React Hook Form field arrays if the forms grow further.
- Local file storage (`.storage/`) is a development-only fallback; configure Cloudinary credentials
  (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) before deploying to production.
