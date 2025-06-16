
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type CreateVideoRequest } from '../schema';
import { getVideoProjects } from '../handlers/get_video_projects';

// Test data
const testProject1: CreateVideoRequest = {
  topic: 'Artificial Intelligence Basics',
  duration_preference: 'medium',
  voice_preference: 'voice123',
  visual_style: 'mixed'
};

const testProject2: CreateVideoRequest = {
  topic: 'Machine Learning Tutorial',
  duration_preference: 'long',
  visual_style: 'videos'
};

describe('getVideoProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no projects exist', async () => {
    const result = await getVideoProjects();
    
    expect(result).toEqual([]);
  });

  it('should return all video projects ordered by created_at desc', async () => {
    // Create test projects with slight delay to ensure different timestamps
    await db.insert(videoProjectsTable)
      .values({
        topic: testProject1.topic,
        duration_preference: testProject1.duration_preference,
        voice_preference: testProject1.voice_preference,
        visual_style: testProject1.visual_style,
        status: 'pending'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(videoProjectsTable)
      .values({
        topic: testProject2.topic,
        duration_preference: testProject2.duration_preference,
        voice_preference: testProject2.voice_preference,
        visual_style: testProject2.visual_style,
        status: 'script_generation'
      })
      .execute();

    const result = await getVideoProjects();

    expect(result).toHaveLength(2);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].topic).toEqual('Machine Learning Tutorial');
    expect(result[1].topic).toEqual('Artificial Intelligence Basics');
    
    // Verify all fields are present
    result.forEach(project => {
      expect(project.id).toBeDefined();
      expect(project.topic).toBeDefined();
      expect(project.status).toBeDefined();
      expect(project.visual_style).toBeDefined();
      expect(project.created_at).toBeInstanceOf(Date);
      expect(project.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle projects with different statuses and nullable fields', async () => {
    await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Project',
        status: 'completed',
        visual_style: 'images',
        script_content: 'Generated script content',
        keywords: ['AI', 'technology', 'tutorial'],
        audio_url: 'https://example.com/audio.mp3',
        video_url: 'https://example.com/video.mp4'
      })
      .execute();

    const result = await getVideoProjects();

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('completed');
    expect(result[0].script_content).toEqual('Generated script content');
    expect(result[0].keywords).toEqual(['AI', 'technology', 'tutorial']);
    expect(result[0].audio_url).toEqual('https://example.com/audio.mp3');
    expect(result[0].video_url).toEqual('https://example.com/video.mp4');
  });

  it('should handle projects with null keywords correctly', async () => {
    await db.insert(videoProjectsTable)
      .values({
        topic: 'Project with null keywords',
        status: 'pending',
        visual_style: 'mixed',
        keywords: null
      })
      .execute();

    const result = await getVideoProjects();

    expect(result).toHaveLength(1);
    expect(result[0].keywords).toBeNull();
  });
});
