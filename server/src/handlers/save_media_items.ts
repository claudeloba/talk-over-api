
import { db } from '../db';
import { mediaItemsTable, videoProjectsTable } from '../db/schema';
import { type MediaItem } from '../schema';
import { eq } from 'drizzle-orm';

interface SaveMediaItemInput {
  project_id: number;
  type: 'image' | 'video' | 'gif';
  source: 'pexels' | 'giphy';
  source_id: string;
  url: string;
  thumbnail_url?: string;
  keyword: string;
}

export const saveMediaItems = async (mediaItems: SaveMediaItemInput[]): Promise<MediaItem[]> => {
  try {
    // If no items to save, return empty array
    if (mediaItems.length === 0) {
      return [];
    }

    // Validate that all project_ids exist
    const projectIds = [...new Set(mediaItems.map(item => item.project_id))];
    const existingProjects = await db.select({ id: videoProjectsTable.id })
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, projectIds[0]))
      .execute();

    if (existingProjects.length === 0) {
      throw new Error(`Project with id ${projectIds[0]} does not exist`);
    }

    // Insert all media items in a single query
    const result = await db.insert(mediaItemsTable)
      .values(mediaItems.map(item => ({
        project_id: item.project_id,
        type: item.type,
        source: item.source,
        source_id: item.source_id,
        url: item.url,
        thumbnail_url: item.thumbnail_url || null,
        keyword: item.keyword,
        suitability_score: null,
        suitability_reason: null,
        is_selected: false
      })))
      .returning()
      .execute();

    // Transform results to match MediaItem schema
    return result.map(item => ({
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
      created_at: item.created_at
    }));
  } catch (error) {
    console.error('Failed to save media items:', error);
    throw error;
  }
};
