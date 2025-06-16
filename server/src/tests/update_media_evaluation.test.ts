
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { type MediaEvaluation } from '../schema';
import { updateMediaEvaluation } from '../handlers/update_media_evaluation';
import { eq } from 'drizzle-orm';

describe('updateMediaEvaluation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update media evaluation successfully', async () => {
    // Create prerequisite project first
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'media_evaluation',
        visual_style: 'mixed',
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create a media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectId,
        type: 'image',
        source: 'pexels',
        source_id: '12345',
        url: 'https://example.com/image.jpg',
        keyword: 'nature',
        suitability_score: null,
        suitability_reason: null,
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    const evaluationInput: MediaEvaluation = {
      media_id: mediaId,
      suitability_score: 85,
      suitability_reason: 'High quality image with good composition',
    };

    const result = await updateMediaEvaluation(evaluationInput);

    // Verify the update was successful
    expect(result.id).toEqual(mediaId);
    expect(result.suitability_score).toEqual(85);
    expect(result.suitability_reason).toEqual('High quality image with good composition');
    expect(result.project_id).toEqual(projectId);
    expect(result.type).toEqual('image');
    expect(result.source).toEqual('pexels');
    expect(result.keyword).toEqual('nature');
  });

  it('should save evaluation to database', async () => {
    // Create prerequisite project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'media_evaluation',
        visual_style: 'mixed',
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create a media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectId,
        type: 'video',
        source: 'pexels',
        source_id: '67890',
        url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/thumb.jpg',
        keyword: 'ocean',
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    const evaluationInput: MediaEvaluation = {
      media_id: mediaId,
      suitability_score: 92,
      suitability_reason: 'Perfect match for ocean theme with excellent visual quality',
    };

    await updateMediaEvaluation(evaluationInput);

    // Query database to verify the data was saved
    const savedMedia = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.id, mediaId))
      .execute();

    expect(savedMedia).toHaveLength(1);
    expect(savedMedia[0].suitability_score).toEqual(92);
    expect(savedMedia[0].suitability_reason).toEqual('Perfect match for ocean theme with excellent visual quality');
    expect(savedMedia[0].type).toEqual('video');
    expect(savedMedia[0].keyword).toEqual('ocean');
  });

  it('should throw error for non-existent media item', async () => {
    const evaluationInput: MediaEvaluation = {
      media_id: 99999, // Non-existent ID
      suitability_score: 75,
      suitability_reason: 'Good quality',
    };

    await expect(updateMediaEvaluation(evaluationInput))
      .rejects.toThrow(/Media item with id 99999 not found/i);
  });

  it('should handle edge case evaluation scores', async () => {
    // Create prerequisite project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'media_evaluation',
        visual_style: 'images',
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create a media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectId,
        type: 'gif',
        source: 'giphy',
        source_id: 'abc123',
        url: 'https://example.com/animation.gif',
        keyword: 'funny',
      })
      .returning()
      .execute();

    const mediaId = mediaResult[0].id;

    // Test minimum score (0)
    const minScoreInput: MediaEvaluation = {
      media_id: mediaId,
      suitability_score: 0,
      suitability_reason: 'Completely unsuitable content',
    };

    const minResult = await updateMediaEvaluation(minScoreInput);
    expect(minResult.suitability_score).toEqual(0);

    // Test maximum score (100)
    const maxScoreInput: MediaEvaluation = {
      media_id: mediaId,
      suitability_score: 100,
      suitability_reason: 'Perfect match, excellent quality',
    };

    const maxResult = await updateMediaEvaluation(maxScoreInput);
    expect(maxResult.suitability_score).toEqual(100);
    expect(maxResult.suitability_reason).toEqual('Perfect match, excellent quality');
  });
});
