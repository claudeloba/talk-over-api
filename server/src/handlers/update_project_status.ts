
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type UpdateProjectStatus, type VideoProject } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProjectStatus = async (input: UpdateProjectStatus): Promise<VideoProject> => {
  try {
    // Build update values
    const updateValues: any = {
      status: input.status,
      updated_at: new Date(),
    };

    // Add error_message if provided
    if (input.error_message !== undefined) {
      updateValues.error_message = input.error_message;
    }

    // Update project record
    const result = await db.update(videoProjectsTable)
      .set(updateValues)
      .where(eq(videoProjectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Project status update failed:', error);
    throw error;
  }
};
