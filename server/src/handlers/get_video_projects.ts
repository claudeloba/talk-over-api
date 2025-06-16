
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type VideoProject } from '../schema';
import { desc } from 'drizzle-orm';

export const getVideoProjects = async (): Promise<VideoProject[]> => {
  try {
    const results = await db.select()
      .from(videoProjectsTable)
      .orderBy(desc(videoProjectsTable.created_at))
      .execute();

    return results.map(project => ({
      ...project,
      keywords: project.keywords || null, // Ensure null handling for jsonb field
    }));
  } catch (error) {
    console.error('Failed to get video projects:', error);
    throw error;
  }
};
