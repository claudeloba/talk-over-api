
import { serial, text, pgTable, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const projectStatusEnum = pgEnum('project_status', [
  'pending', 
  'script_generation', 
  'tts_generation', 
  'media_sourcing', 
  'media_evaluation', 
  'video_assembly', 
  'completed', 
  'failed'
]);

export const durationPreferenceEnum = pgEnum('duration_preference', ['short', 'medium', 'long']);
export const visualStyleEnum = pgEnum('visual_style', ['images', 'videos', 'mixed']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'gif']);
export const mediaSourceEnum = pgEnum('media_source', ['pexels', 'giphy']);

// Video projects table
export const videoProjectsTable = pgTable('video_projects', {
  id: serial('id').primaryKey(),
  topic: text('topic').notNull(),
  status: projectStatusEnum('status').notNull().default('pending'),
  duration_preference: durationPreferenceEnum('duration_preference'),
  voice_preference: text('voice_preference'),
  visual_style: visualStyleEnum('visual_style').notNull().default('mixed'),
  script_content: text('script_content'),
  keywords: jsonb('keywords').$type<string[]>(),
  audio_url: text('audio_url'),
  video_url: text('video_url'),
  error_message: text('error_message'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Media items table
export const mediaItemsTable = pgTable('media_items', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull().references(() => videoProjectsTable.id, { onDelete: 'cascade' }),
  type: mediaTypeEnum('type').notNull(),
  source: mediaSourceEnum('source').notNull(),
  source_id: text('source_id').notNull(),
  url: text('url').notNull(),
  thumbnail_url: text('thumbnail_url'),
  keyword: text('keyword').notNull(),
  suitability_score: integer('suitability_score'), // 0-100
  suitability_reason: text('suitability_reason'),
  is_selected: boolean('is_selected').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const videoProjectsRelations = relations(videoProjectsTable, ({ many }) => ({
  mediaItems: many(mediaItemsTable),
}));

export const mediaItemsRelations = relations(mediaItemsTable, ({ one }) => ({
  project: one(videoProjectsTable, {
    fields: [mediaItemsTable.project_id],
    references: [videoProjectsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type VideoProject = typeof videoProjectsTable.$inferSelect;
export type NewVideoProject = typeof videoProjectsTable.$inferInsert;
export type MediaItem = typeof mediaItemsTable.$inferSelect;
export type NewMediaItem = typeof mediaItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  videoProjects: videoProjectsTable, 
  mediaItems: mediaItemsTable 
};

export const tableRelations = {
  videoProjectsRelations,
  mediaItemsRelations,
};
