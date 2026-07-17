import { pgTable, uuid, text, timestamp, jsonb, integer, numeric, boolean, vector, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Extends Neon Canonical Memory (ai.*, billing.*, events.*) — additive only
// Assumes schemas already exist from Brain/create_schemas.sql + neon-migration.sql

export const agentTemplates = pgTable('agent_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sourceConversationIds: text('source_conversation_ids').array().default([]),
  atoms: jsonb('atoms').$type<Array<{
    problem: string;
    solution: string;
    codeSnippets: string[];
    moatIdeas: string[];
    metrics: Record<string, unknown>;
  }>>().notNull().default([]),
  scaffold: jsonb('scaffold').$type<{
    packageJson: Record<string, unknown>;
    files: Array<{ path: string; content: string }>;
    cdkStack?: string;
  }>(),
  status: text('status').notNull().default('draft'), // draft | published | evolving | archived
  qualityScore: numeric('quality_score', { precision: 5, scale: 4 }),
  usageCount: integer('usage_count').default(0),
  revenueCents: integer('revenue_cents').default(0),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  statusIdx: index('idx_agent_templates_status').on(t.status),
  qualityIdx: index('idx_agent_templates_quality').on(t.qualityScore),
}));

export const agentDeployments = pgTable('agent_deployments', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => agentTemplates.id),
  repoUrl: text('repo_url').notNull(),
  deployUrl: text('deploy_url'),
  vercelProjectId: text('vercel_project_id'),
  status: text('status').notNull().default('pending'), // pending | live | failed | evolving
  outcomeMetrics: jsonb('outcome_metrics').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentUsage = pgTable('agent_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => agentTemplates.id),
  deploymentId: uuid('deployment_id').references(() => agentDeployments.id),
  tenantId: text('tenant_id').notNull(),
  metric: text('metric').notNull(), // invocations | tokens | outcomes
  quantity: numeric('quantity').notNull().default('0'),
  qualityDelta: numeric('quality_delta', { precision: 5, scale: 4 }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  templateMetricIdx: index('idx_agent_usage_template_metric').on(t.templateId, t.metric, t.recordedAt),
}));

// Relations for Drizzle queries
export const agentTemplatesRelations = relations(agentTemplates, ({ many }) => ({
  deployments: many(agentDeployments),
  usages: many(agentUsage),
}));
