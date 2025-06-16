
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type CreateVideoRequest, type VideoProject } from '../schema';

export const createVideoProject = async (input: CreateVideoRequest): Promise<VideoProject> => {
  try {
    // Insert video project record
    const result = await db.insert(videoProjectsTable)
      .values({
        topic: input.topic,
        duration_preference: input.duration_preference || null,
        voice_preference: input.voice_preference || null,
        visual_style: input.visual_style, // Has default 'mixed' from Zod schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Video project creation failed:', error);
    throw error;
  }
};
