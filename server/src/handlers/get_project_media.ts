
import { db } from '../db';
import { mediaItemsTable } from '../db/schema';
import { type MediaItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectMedia = async (projectId: number): Promise<MediaItem[]> => {
  try {
    const results = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.project_id, projectId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get project media:', error);
    throw error;
  }
};
