import { db } from '../db/client.js';
import { agentTemplates } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract product atoms from Neon ai.conversations / chat_archive.
 * Verifiable: only claims grounded in message content; no hallucination.
 * Feeds unique IP into marketplace.
 */
export async function extractAtomsFromConversation(conversationId: string) {
  // Query Neon ai.messages (assumes schema from create_schemas.sql)
  const messages = await db.execute(sql`
    SELECT role, message, metadata, created_at
    FROM ai.messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT 200
  `);

  if (!messages.rows.length) {
    throw new Error(`No messages for conversation ${conversationId}`);
  }

  const transcript = messages.rows
    .map((m: any) => `${m.role}: ${m.message}`)
    .join('\n\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a principal engineer extracting verifiable product IP from founder chats.
Output ONLY valid JSON matching this schema:
{
  "atoms": [{
    "problem": string, // exact pain from transcript
    "solution": string, // proposed approach grounded in transcript
    "codeSnippets": string[], // any code blocks or patterns mentioned
    "moatIdeas": string[], // defensibility / data flywheel ideas
    "metrics": object // any success criteria or numbers mentioned
  }],
  "agentName": string,
  "slug": string,
  "description": string
}
Rules: Zero hallucination. Every claim must be directly supported by transcript text. If insufficient signal, return empty atoms array.`,
      },
      { role: 'user', content: transcript },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content || '{}');

  if (!parsed.atoms?.length) {
    return null;
  }

  const [template] = await db.insert(agentTemplates).values({
    name: parsed.agentName || `Agent-${conversationId.slice(0, 8)}`,
    slug: parsed.slug || `agent-${Date.now()}`,
    description: parsed.description,
    sourceConversationIds: [conversationId],
    atoms: parsed.atoms,
    status: 'draft',
    qualityScore: '0.5', // initial; updated by flywheel
  }).returning();

  return template;
}

export async function listPublishedTemplates(limit = 20) {
  return db.select().from(agentTemplates)
    .where(eq(agentTemplates.status, 'published'))
    .orderBy(desc(agentTemplates.qualityScore))
    .limit(limit);
}
