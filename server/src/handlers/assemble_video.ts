
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { type VideoAssemblyConfig } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';

export const assembleVideo = async (config: VideoAssemblyConfig): Promise<string> => {
  try {
    // Verify project exists
    const projects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, config.project_id))
      .execute();

    if (projects.length === 0) {
      throw new Error(`Project with id ${config.project_id} not found`);
    }

    const project = projects[0];

    // Verify selected media items exist and belong to the project
    if (config.selected_media_ids.length === 0) {
      throw new Error('At least one media item must be selected for video assembly');
    }

    const mediaItems = await db.select()
      .from(mediaItemsTable)
      .where(
        and(
          eq(mediaItemsTable.project_id, config.project_id),
          inArray(mediaItemsTable.id, config.selected_media_ids)
        )
      )
      .execute();

    if (mediaItems.length !== config.selected_media_ids.length) {
      const foundIds = mediaItems.map(item => item.id);
      const missingIds = config.selected_media_ids.filter(id => !foundIds.includes(id));
      throw new Error(`Media items not found or don't belong to project: ${missingIds.join(', ')}`);
    }

    // Mark selected media items as selected
    await db.update(mediaItemsTable)
      .set({ is_selected: true })
      .where(inArray(mediaItemsTable.id, config.selected_media_ids))
      .execute();

    // Simulate video assembly process
    // In a real implementation, this would:
    // 1. Download audio file from project.audio_url
    // 2. Download media files from mediaItems
    // 3. Use video editing library (e.g., FFmpeg) to combine them
    // 4. Apply transitions based on config.transition_style
    // 5. Add background music if config.background_music is true
    // 6. Upload final video to storage
    // 7. Return the video URL

    // For now, return a mock video URL based on project data
    const videoUrl = `https://storage.example.com/videos/project_${config.project_id}_${Date.now()}.mp4`;

    // Update project with video URL and status
    await db.update(videoProjectsTable)
      .set({
        video_url: videoUrl,
        status: 'completed',
        updated_at: new Date()
      })
      .where(eq(videoProjectsTable.id, config.project_id))
      .execute();

    return videoUrl;
  } catch (error) {
    console.error('Video assembly failed:', error);
    
    // Update project status to failed on error
    await db.update(videoProjectsTable)
      .set({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error during video assembly',
        updated_at: new Date()
      })
      .where(eq(videoProjectsTable.id, config.project_id))
      .execute();

    throw error;
  }
};
