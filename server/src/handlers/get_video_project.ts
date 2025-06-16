
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type VideoProject } from '../schema';
import { eq } from 'drizzle-orm';

export const getVideoProject = async (id: number): Promise<VideoProject | null> => {
  try {
    const results = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const project = results[0];
    return {
      ...project,
      // Convert timestamps to dates and handle nulls properly
      created_at: project.created_at,
      updated_at: project.updated_at,
      // Ensure keywords array is properly typed
      keywords: project.keywords as string[] | null,
    };
  } catch (error) {
    console.error('Failed to get video project:', error);
    throw error;
  }
};
