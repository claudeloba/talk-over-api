
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type CreateVideoRequest } from '../schema';
import { getVideoProject } from '../handlers/get_video_project';

// Test input for creating a video project
const testInput: CreateVideoRequest = {
  topic: 'Test Video Topic',
  duration_preference: 'medium',
  voice_preference: 'test-voice-id',
  visual_style: 'mixed'
};

describe('getVideoProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return video project by id', async () => {
    // Create a test project first
    const insertResult = await db.insert(videoProjectsTable)
      .values({
        topic: testInput.topic,
        duration_preference: testInput.duration_preference,
        voice_preference: testInput.voice_preference,
        visual_style: testInput.visual_style,
        status: 'pending',
        keywords: ['test', 'video', 'generation']
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];

    // Get the project using the handler
    const result = await getVideoProject(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdProject.id);
    expect(result!.topic).toEqual('Test Video Topic');
    expect(result!.duration_preference).toEqual('medium');
    expect(result!.voice_preference).toEqual('test-voice-id');
    expect(result!.visual_style).toEqual('mixed');
    expect(result!.status).toEqual('pending');
    expect(result!.keywords).toEqual(['test', 'video', 'generation']);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.script_content).toBeNull();
    expect(result!.audio_url).toBeNull();
    expect(result!.video_url).toBeNull();
    expect(result!.error_message).toBeNull();
  });

  it('should return null for non-existent project', async () => {
    const result = await getVideoProject(999);
    
    expect(result).toBeNull();
  });

  it('should handle project with all fields populated', async () => {
    // Create a fully populated project
    const insertResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Complete Test Project',
        status: 'completed',
        duration_preference: 'long',
        voice_preference: 'complete-voice-id',
        visual_style: 'videos',
        script_content: 'This is a test script content',
        keywords: ['complete', 'test', 'project'],
        audio_url: 'https://example.com/audio.mp3',
        video_url: 'https://example.com/video.mp4',
        error_message: null
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];
    const result = await getVideoProject(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.topic).toEqual('Complete Test Project');
    expect(result!.status).toEqual('completed');
    expect(result!.duration_preference).toEqual('long');
    expect(result!.visual_style).toEqual('videos');
    expect(result!.script_content).toEqual('This is a test script content');
    expect(result!.keywords).toEqual(['complete', 'test', 'project']);
    expect(result!.audio_url).toEqual('https://example.com/audio.mp3');
    expect(result!.video_url).toEqual('https://example.com/video.mp4');
    expect(result!.error_message).toBeNull();
  });

  it('should handle project with error status', async () => {
    // Create a project with failed status and error message
    const insertResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Failed Test Project',
        status: 'failed',
        visual_style: 'images',
        error_message: 'Script generation failed due to API timeout'
      })
      .returning()
      .execute();

    const createdProject = insertResult[0];
    const result = await getVideoProject(createdProject.id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('failed');
    expect(result!.error_message).toEqual('Script generation failed due to API timeout');
    expect(result!.duration_preference).toBeNull();
    expect(result!.voice_preference).toBeNull();
  });
});
