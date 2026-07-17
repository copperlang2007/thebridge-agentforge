# Lessons Logged to Nerd Neon (2026-07-17)

## Deep Dive Summary
Neon Canonical Memory schema (identity/events/ai/workflow/billing/analytics) + ai_interactions vector table confirmed via local SQL artifacts. Strong flywheel foundation: conversations → embeddings → tasks → usage_records.

## Gap Closed
Extraction (grok-conv-forge, contextforge) existed. Monetized self-evolving marketplace with quality_score EMA pricing + usage writeback did not. AgentForge fills it without duplication.

## Implementation Notes
- Additive tables only — zero risk to existing Neon schemas.
- Quality update is EMA (0.9/0.1) — tunable; risk of oscillation if qualityDelta noisy → add confidence weighting later.
- OPENAI extraction gated by strict "zero hallucination" system prompt; still requires human review gate before publish (safety-rail).
- Temporal stub ready for durable evolve loop.

## Next (if approved)
1. Wire real Temporal worker + github___push_files for scaffold deploy.
2. React marketplace UI (Vite) with quality-sorted cards.
3. CDK stack for multi-tenant isolation.
4. Backfill extract from top 50 high-signal conversations in ai.conversations.
5. Emit outcome events to events.events for full flywheel observability.

## Defensibility
Proprietary quality trajectories + usage graphs become training data for better extractors. Compounds across every deployed agent.
