
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable } from '../db/schema';
import { type CreateVideoRequest } from '../schema';
import { createVideoProject } from '../handlers/create_video_project';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateVideoRequest = {
  topic: 'How to Build a React App',
  duration_preference: 'medium',
  voice_preference: 'voice-123',
  visual_style: 'mixed'
};

// Minimal test input (only required fields)
const minimalInput: CreateVideoRequest = {
  topic: 'JavaScript Basics',
  visual_style: 'mixed'
};

describe('createVideoProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a video project with all fields', async () => {
    const result = await createVideoProject(testInput);

    // Basic field validation
    expect(result.topic).toEqual('How to Build a React App');
    expect(result.duration_preference).toEqual('medium');
    expect(result.voice_preference).toEqual('voice-123');
    expect(result.visual_style).toEqual('mixed');
    expect(result.status).toEqual('pending'); // Default status
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.script_content).toBeNull();
    expect(result.keywords).toBeNull();
    expect(result.audio_url).toBeNull();
    expect(result.video_url).toBeNull();
    expect(result.error_message).toBeNull();
  });

  it('should create a video project with minimal input', async () => {
    const result = await createVideoProject(minimalInput);

    expect(result.topic).toEqual('JavaScript Basics');
    expect(result.duration_preference).toBeNull();
    expect(result.voice_preference).toBeNull();
    expect(result.visual_style).toEqual('mixed');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save video project to database', async () => {
    const result = await createVideoProject(testInput);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(videoProjectsTable)
      .where(eq(videoProjectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].topic).toEqual('How to Build a React App');
    expect(projects[0].duration_preference).toEqual('medium');
    expect(projects[0].voice_preference).toEqual('voice-123');
    expect(projects[0].visual_style).toEqual('mixed');
    expect(projects[0].status).toEqual('pending');
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different visual style options', async () => {
    const imageInput: CreateVideoRequest = {
      topic: 'Test Images',
      visual_style: 'images'
    };

    const videoInput: CreateVideoRequest = {
      topic: 'Test Videos',
      visual_style: 'videos'
    };

    const imageResult = await createVideoProject(imageInput);
    const videoResult = await createVideoProject(videoInput);

    expect(imageResult.visual_style).toEqual('images');
    expect(videoResult.visual_style).toEqual('videos');
  });

  it('should handle different duration preferences', async () => {
    const shortInput: CreateVideoRequest = {
      topic: 'Short Video',
      duration_preference: 'short',
      visual_style: 'mixed'
    };

    const longInput: CreateVideoRequest = {
      topic: 'Long Video',
      duration_preference: 'long',
      visual_style: 'mixed'
    };

    const shortResult = await createVideoProject(shortInput);
    const longResult = await createVideoProject(longInput);

    expect(shortResult.duration_preference).toEqual('short');
    expect(longResult.duration_preference).toEqual('long');
  });
});
