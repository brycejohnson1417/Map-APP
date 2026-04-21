export const architecturePrinciples = [
  {
    title: "Postgres-first runtime",
    body: "The app should read from local Postgres views and tables. Notion is an integration, not the thing powering live user screens.",
  },
  {
    title: "Deterministic identity",
    body: "Licensed Location ID and Retailer ID anchor account matching. Notion page IDs and aliases hang off the same internal account graph.",
  },
  {
    title: "Incremental sync only",
    body: "Every external integration should mark small deltas dirty and update only the affected local records. No full refreshes on normal UI reads.",
  },
  {
    title: "Purpose-built read models",
    body: "Map pins, account detail, filters, calendar events, and vendor day operations each deserve their own read shape instead of one giant do-everything endpoint.",
  },
];

export const buildPhases = [
  {
    name: "Phase 1 — Runtime foundation",
    status: "active",
    summary: "Supabase schema, v2 API surfaces, environment contract, and platform docs.",
  },
  {
    name: "Phase 2 — Identity and ingestion",
    status: "queued",
    summary: "Bring in Nabis and Notion through deterministic account identities and sync cursors.",
  },
  {
    name: "Phase 3 — Territory cutover",
    status: "queued",
    summary: "Move map pins, layers, and markers onto the new local-first runtime views.",
  },
  {
    name: "Phase 4 — Unified operations",
    status: "queued",
    summary: "Calendar, vendor day dispatch, check-ins, and activity all sit on the same shared account graph.",
  },
];

export const platformCapabilities = [
  {
    title: "Territory operations",
    body: "Shared boundaries, rep-home markers, lassoable account selection, and smaller pin payloads that won’t punish the database.",
  },
  {
    title: "CRM integrity",
    body: "Referrals, sample history, order history, and rep assignment should all resolve from one account identity model.",
  },
  {
    title: "Order intelligence",
    body: "Nabis orders become the authoritative local input for customer state, samples, reorders, and revenue rollups.",
  },
  {
    title: "Collaborative updates",
    body: "Admin-only structural edits, team-visible shared state, and explicit audit trails instead of hidden client-side drift.",
  },
  {
    title: "Observability",
    body: "Runtime health, sync cursors, stale indicators, and event logs are first-class, not something bolted on after it starts failing.",
  },
  {
    title: "Enterprise readiness",
    body: "Smaller APIs, clearer domain boundaries, better migration paths, and cleaner docs make this easier to explain and defend in interviews.",
  },
];

export const syncPipelines = [
  {
    title: "Notion → dirty queue → runtime account",
    body: "Webhooks only mark changed records and write retryable work. Workers resolve those page IDs into local account rows and read-model updates.",
  },
  {
    title: "Nabis → normalized retailer/order tables",
    body: "Retailers and orders are ingested raw, normalized once, and then aggregated locally for filters, samples, customer state, and ROI inputs.",
  },
  {
    title: "Runtime account → map/account/calendar views",
    body: "User-facing surfaces never re-query Notion for correctness. They read specialized local views with explicit freshness metadata.",
  },
  {
    title: "Runtime mutations → audit + outbound sync",
    body: "Comments, assignments, and shared layer changes write to local state first, then fan out to Notion or other systems asynchronously.",
  },
];
