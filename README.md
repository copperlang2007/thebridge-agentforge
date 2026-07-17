# thebridge-agentforge

**Self-evolving agent marketplace** powered by Neon Bridge Brain (canonical memory).

## Unique Gap Filled
- grok-conv-forge / contextforge extract & store
- AgentForge turns atoms into **billable, deployable agents** with usage tracking → quality_score → dynamic pricing
- Outcomes write back to `agent_usage` + `events.events` + embeddings → continuous self-improvement
- No duplicate: pure monetization + marketplace layer on top of existing extraction/flywheel IP

## Stack
TypeScript / Express / Drizzle / Neon / React (UI TBD) / AWS CDK (infra TBD) / Temporal (orchestration TBD)

## Schema
Additive tables on existing Neon Canonical Memory:
- `agent_templates` (atoms, scaffold, quality_score)
- `agent_deployments`
- `agent_usage` (feeds billing.usage_records pattern)

## Quickstart
```bash
pnpm i
export NEON_DATABASE_URL=...
export OPENAI_API_KEY=...
pnpm db:generate && pnpm db:migrate
pnpm dev
```

POST /extract {"conversationId": "..."}
GET /marketplace
POST /usage {"templateId": "...", "tenantId": "...", "metric": "invocations", "quantity": 1, "qualityDelta": 0.1}

## Moat
Proprietary outcome dataset (quality_score trajectories per agent) compounds. Self-evolution via Temporal workflows (next). Deploy to Vercel + GH via connected tools.

## theBRIDGE Alignment
Plan → Build → Ship → Observe (usage) → Remember (Neon) → Improve (quality_score EMA) → Document IP → Engineer Moats → Grow Master Data Flywheel.
