
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { type VideoAssemblyConfig } from '../schema';
import { assembleVideo } from '../handlers/assemble_video';
import { eq } from 'drizzle-orm';

describe('assembleVideo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should assemble video successfully with valid config', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video',
        status: 'media_evaluation',
        visual_style: 'mixed',
        script_content: 'Test script content',
        keywords: ['test', 'video'],
        audio_url: 'https://example.com/audio.mp3'
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create test media items
    const mediaResult = await db.insert(mediaItemsTable)
      .values([
        {
          project_id: project.id,
          type: 'image',
          source: 'pexels',
          source_id: '123',
          url: 'https://example.com/image1.jpg',
          keyword: 'test',
          suitability_score: 85
        },
        {
          project_id: project.id,
          type: 'video',
          source: 'pexels',
          source_id: '456',
          url: 'https://example.com/video1.mp4',
          keyword: 'video',
          suitability_score: 90
        }
      ])
      .returning()
      .execute();

    const testConfig: VideoAssemblyConfig = {
      project_id: project.id,
      selected_media_ids: [mediaResult[0].id, mediaResult[1].id],
      transition_style: 'fade',
      background_music: true
    };

    const videoUrl = await assembleVideo(testConfig);

    // Verify video URL is returned
    expect(videoUrl).toMatch(/^https:\/\/storage\.example\.com\/videos\/project_\d+_\d+\.mp4$/);

    // Verify project status is updated
    const updatedProjects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, project.id))
      .execute();

    const updatedProject = updatedProjects[0];
    expect(updatedProject.status).toEqual('completed');
    expect(updatedProject.video_url).toEqual(videoUrl);
    expect(updatedProject.updated_at).toBeInstanceOf(Date);

    // Verify media items are marked as selected
    const updatedMedia = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.project_id, project.id))
      .execute();

    expect(updatedMedia.every(item => item.is_selected)).toBe(true);
  });

  it('should throw error when project does not exist', async () => {
    const testConfig: VideoAssemblyConfig = {
      project_id: 999,
      selected_media_ids: [1, 2],
      transition_style: 'cut',
      background_music: false
    };

    await expect(assembleVideo(testConfig)).rejects.toThrow(/Project with id 999 not found/i);
  });

  it('should throw error when no media items are selected', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video',
        status: 'media_evaluation',
        visual_style: 'images'
      })
      .returning()
      .execute();

    const testConfig: VideoAssemblyConfig = {
      project_id: projectResult[0].id,
      selected_media_ids: [],
      transition_style: 'slide',
      background_music: false
    };

    await expect(assembleVideo(testConfig)).rejects.toThrow(/At least one media item must be selected/i);
  });

  it('should throw error when media items do not exist or belong to different project', async () => {
    // Create two test projects
    const project1Result = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video 1',
        status: 'media_evaluation',
        visual_style: 'images'
      })
      .returning()
      .execute();

    const project2Result = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video 2',
        status: 'media_evaluation',
        visual_style: 'videos'
      })
      .returning()
      .execute();

    // Create media item for project 2
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project2Result[0].id,
        type: 'image',
        source: 'pexels',
        source_id: '123',
        url: 'https://example.com/image1.jpg',
        keyword: 'test'
      })
      .returning()
      .execute();

    const testConfig: VideoAssemblyConfig = {
      project_id: project1Result[0].id,
      selected_media_ids: [mediaResult[0].id, 999], // One exists but belongs to different project, one doesn't exist
      transition_style: 'fade',
      background_music: true
    };

    await expect(assembleVideo(testConfig)).rejects.toThrow(/Media items not found or don't belong to project/i);
  });

  it('should update project status to failed on error', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video',
        status: 'media_evaluation',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    const testConfig: VideoAssemblyConfig = {
      project_id: projectResult[0].id,
      selected_media_ids: [], // This will cause an error
      transition_style: 'cut',
      background_music: false
    };

    await expect(assembleVideo(testConfig)).rejects.toThrow();

    // Verify project status is updated to failed
    const updatedProjects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, projectResult[0].id))
      .execute();

    const updatedProject = updatedProjects[0];
    expect(updatedProject.status).toEqual('failed');
    expect(updatedProject.error_message).toMatch(/At least one media item must be selected/i);
    expect(updatedProject.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different transition styles and background music options', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Video',
        status: 'media_evaluation',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    // Create test media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectResult[0].id,
        type: 'gif',
        source: 'giphy',
        source_id: '789',
        url: 'https://example.com/gif1.gif',
        keyword: 'animation'
      })
      .returning()
      .execute();

    const testConfig: VideoAssemblyConfig = {
      project_id: projectResult[0].id,
      selected_media_ids: [mediaResult[0].id],
      transition_style: 'slide',
      background_music: false
    };

    const videoUrl = await assembleVideo(testConfig);

    expect(videoUrl).toMatch(/^https:\/\/storage\.example\.com\/videos\/project_\d+_\d+\.mp4$/);

    // Verify project is completed
    const updatedProjects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, projectResult[0].id))
      .execute();

    expect(updatedProjects[0].status).toEqual('completed');
    expect(updatedProjects[0].video_url).toEqual(videoUrl);
  });
});
