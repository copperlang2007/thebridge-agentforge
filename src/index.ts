import express from 'express';
import { extractAtomsFromConversation, listPublishedTemplates } from './services/extractor.js';
import { db } from './db/client.js';
import { agentUsage, agentTemplates } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';

const app = express();
app.use(express.json());

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'agentforge' }));

// Extract from conversation (feeds flywheel)
app.post('/extract', async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const template = await extractAtomsFromConversation(conversationId);
    res.json({ template });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Marketplace list (sorted by quality_score from outcomes)
app.get('/marketplace', async (_req, res) => {
  const templates = await listPublishedTemplates();
  res.json({ templates });
});

// Record usage + update quality (core of data flywheel + dynamic pricing)
app.post('/usage', async (req, res) => {
  try {
    const { templateId, tenantId, metric, quantity, qualityDelta } = req.body;
    await db.insert(agentUsage).values({
      templateId,
      tenantId,
      metric,
      quantity: String(quantity ?? 1),
      qualityDelta: qualityDelta != null ? String(qualityDelta) : null,
    });

    // Update aggregate quality_score (simple EMA)
    if (qualityDelta != null) {
      await db.execute(sql`
        UPDATE agent_templates
        SET quality_score = LEAST(1.0, GREATEST(0.0,
          COALESCE(quality_score, 0.5) * 0.9 + ${qualityDelta} * 0.1
        )),
        usage_count = usage_count + 1,
        updated_at = NOW()
        WHERE id = ${templateId}
      `);
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3100;
app.listen(port, () => console.log(`AgentForge listening on :${port}`));
