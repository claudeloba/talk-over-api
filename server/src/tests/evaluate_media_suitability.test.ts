
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { type CreateVideoRequest } from '../schema';
import { evaluateMediaSuitability } from '../handlers/evaluate_media_suitability';
import { eq } from 'drizzle-orm';

// Test data
const testProject: CreateVideoRequest = {
  topic: 'Cooking Pasta',
  duration_preference: 'short',
  voice_preference: 'test-voice-id',
  visual_style: 'mixed',
};

const testScriptContent = 'Learn how to cook delicious pasta with tomatoes and herbs. This recipe will show you the perfect technique for cooking pasta al dente.';

describe('evaluateMediaSuitability', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should evaluate media suitability and update database', async () => {
    // Create a video project first
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: testProject.topic,
        duration_preference: testProject.duration_preference,
        voice_preference: testProject.voice_preference,
        visual_style: testProject.visual_style,
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create a media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'image',
        source: 'pexels',
        source_id: 'test-123',
        url: 'https://example.com/pasta-image.jpg',
        thumbnail_url: 'https://example.com/pasta-thumb.jpg',
        keyword: 'pasta',
      })
      .returning()
      .execute();

    const mediaItem = mediaResult[0];

    // Evaluate the media suitability
    const result = await evaluateMediaSuitability(
      mediaItem.url,
      testScriptContent,
      'pasta'
    );

    // Verify the result
    expect(result.media_id).toEqual(mediaItem.id);
    expect(result.suitability_score).toBeGreaterThan(0);
    expect(result.suitability_score).toBeLessThanOrEqual(100);
    expect(result.suitability_reason).toBeDefined();
    expect(typeof result.suitability_reason).toBe('string');
  });

  it('should give higher score for relevant keywords', async () => {
    // Create a video project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Cooking Tutorial',
        visual_style: 'images',
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create a media item with relevant keyword
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'video',
        source: 'pexels',
        source_id: 'test-456',
        url: 'https://example.com/cooking-video.mp4',
        keyword: 'cooking',
      })
      .returning()
      .execute();

    const mediaItem = mediaResult[0];

    // Evaluate with script that contains the keyword
    const relevantScript = 'This cooking tutorial will teach you essential techniques for the kitchen.';
    const result = await evaluateMediaSuitability(
      mediaItem.url,
      relevantScript,
      'cooking'
    );

    // Should get a good score for keyword match + video type + pexels source
    expect(result.suitability_score).toBeGreaterThan(70);
    expect(result.suitability_reason).toContain('cooking');
  });

  it('should update media item in database with evaluation', async () => {
    // Create a video project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Nature Documentary',
        visual_style: 'videos',
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create a media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'gif',
        source: 'giphy',
        source_id: 'test-789',
        url: 'https://example.com/nature.gif',
        keyword: 'forest',
      })
      .returning()
      .execute();

    const mediaItem = mediaResult[0];

    // Evaluate the media
    const result = await evaluateMediaSuitability(
      mediaItem.url,
      'Explore the beautiful forest landscapes and wildlife.',
      'forest'
    );

    // Verify the database was updated
    const updatedMedia = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.id, mediaItem.id))
      .execute();

    expect(updatedMedia).toHaveLength(1);
    expect(updatedMedia[0].suitability_score).toEqual(result.suitability_score);
    expect(updatedMedia[0].suitability_reason).toEqual(result.suitability_reason);
  });

  it('should throw error for non-existent media item', async () => {
    await expect(
      evaluateMediaSuitability(
        'https://example.com/non-existent.jpg',
        'Some script content',
        'test'
      )
    ).rejects.toThrow(/Media item not found/i);
  });

  it('should handle different media types correctly', async () => {
    // Create a video project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Project',
        visual_style: 'mixed',
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create media items of different types
    const imageResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'image',
        source: 'pexels',
        source_id: 'img-1',
        url: 'https://example.com/image.jpg',
        keyword: 'test',
      })
      .returning()
      .execute();

    const videoResult = await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'video',
        source: 'pexels',
        source_id: 'vid-1',
        url: 'https://example.com/video.mp4',
        keyword: 'test',
      })
      .returning()
      .execute();

    // Evaluate both
    const imageEval = await evaluateMediaSuitability(
      imageResult[0].url,
      'This is a test script.',
      'test'
    );

    const videoEval = await evaluateMediaSuitability(
      videoResult[0].url,
      'This is a test script.',
      'test'
    );

    // Video should get higher score due to type bonus
    expect(videoEval.suitability_score).toBeGreaterThan(imageEval.suitability_score);
  });
});
