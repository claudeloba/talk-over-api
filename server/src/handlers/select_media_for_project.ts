
import { db } from '../db';
import { mediaItemsTable } from '../db/schema';
import { type MediaItem } from '../schema';
import { inArray } from 'drizzle-orm';

export const selectMediaForProject = async (mediaIds: number[]): Promise<MediaItem[]> => {
  try {
    if (mediaIds.length === 0) {
      return [];
    }

    // Fetch media items by IDs
    const results = await db.select()
      .from(mediaItemsTable)
      .where(inArray(mediaItemsTable.id, mediaIds))
      .execute();

    // Convert to MediaItem schema format
    return results.map(item => ({
      id: item.id,
      project_id: item.project_id,
      type: item.type,
      source: item.source,
      source_id: item.source_id,
      url: item.url,
      thumbnail_url: item.thumbnail_url,
      keyword: item.keyword,
      suitability_score: item.suitability_score,
      suitability_reason: item.suitability_reason,
      is_selected: item.is_selected,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error('Media selection failed:', error);
    throw error;
  }
};
