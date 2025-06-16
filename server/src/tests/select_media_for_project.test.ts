
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { selectMediaForProject } from '../handlers/select_media_for_project';

describe('selectMediaForProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for empty media IDs', async () => {
    const result = await selectMediaForProject([]);
    expect(result).toEqual([]);
  });

  it('should select media items by IDs', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'pending',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create test media items
    const mediaResult = await db.insert(mediaItemsTable)
      .values([
        {
          project_id: projectId,
          type: 'image',
          source: 'pexels',
          source_id: '123',
          url: 'https://example.com/image1.jpg',
          keyword: 'nature',
          suitability_score: 85,
          suitability_reason: 'Good quality nature image',
          is_selected: false
        },
        {
          project_id: projectId,
          type: 'video',
          source: 'pexels',
          source_id: '456',
          url: 'https://example.com/video1.mp4',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          keyword: 'landscape',
          suitability_score: 92,
          suitability_reason: 'Excellent landscape video',
          is_selected: true
        },
        {
          project_id: projectId,
          type: 'gif',
          source: 'giphy',
          source_id: '789',
          url: 'https://example.com/gif1.gif',
          keyword: 'animation',
          is_selected: false
        }
      ])
      .returning()
      .execute();

    const mediaIds = [mediaResult[0].id, mediaResult[1].id];

    // Select specific media items
    const result = await selectMediaForProject(mediaIds);

    expect(result).toHaveLength(2);
    
    // Verify first media item
    const firstItem = result.find(item => item.id === mediaResult[0].id);
    expect(firstItem).toBeDefined();
    expect(firstItem!.type).toEqual('image');
    expect(firstItem!.source).toEqual('pexels');
    expect(firstItem!.source_id).toEqual('123');
    expect(firstItem!.url).toEqual('https://example.com/image1.jpg');
    expect(firstItem!.keyword).toEqual('nature');
    expect(firstItem!.suitability_score).toEqual(85);
    expect(firstItem!.suitability_reason).toEqual('Good quality nature image');
    expect(firstItem!.is_selected).toEqual(false);
    expect(firstItem!.created_at).toBeInstanceOf(Date);

    // Verify second media item
    const secondItem = result.find(item => item.id === mediaResult[1].id);
    expect(secondItem).toBeDefined();
    expect(secondItem!.type).toEqual('video');
    expect(secondItem!.source).toEqual('pexels');
    expect(secondItem!.thumbnail_url).toEqual('https://example.com/thumb1.jpg');
    expect(secondItem!.keyword).toEqual('landscape');
    expect(secondItem!.suitability_score).toEqual(92);
    expect(secondItem!.is_selected).toEqual(true);
  });

  it('should return empty array when no media items match IDs', async () => {
    const result = await selectMediaForProject([999, 888]);
    expect(result).toEqual([]);
  });

  it('should handle media items with null optional fields', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'pending',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create media item with minimal data
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectId,
        type: 'image',
        source: 'pexels',
        source_id: '123',
        url: 'https://example.com/image.jpg',
        keyword: 'test',
        // Leaving optional fields as null/undefined
      })
      .returning()
      .execute();

    const result = await selectMediaForProject([mediaResult[0].id]);

    expect(result).toHaveLength(1);
    expect(result[0].thumbnail_url).toBeNull();
    expect(result[0].suitability_score).toBeNull();
    expect(result[0].suitability_reason).toBeNull();
    expect(result[0].is_selected).toEqual(false); // Default value
  });

  it('should handle partial matches when some IDs do not exist', async () => {
    // Create test project
    const projectResult = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'pending',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    const projectId = projectResult[0].id;

    // Create one media item
    const mediaResult = await db.insert(mediaItemsTable)
      .values({
        project_id: projectId,
        type: 'image',
        source: 'pexels',
        source_id: '123',
        url: 'https://example.com/image.jpg',
        keyword: 'test'
      })
      .returning()
      .execute();

    // Request existing and non-existing IDs
    const result = await selectMediaForProject([mediaResult[0].id, 999, 888]);

    // Should return only the existing media item
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(mediaResult[0].id);
    expect(result[0].keyword).toEqual('test');
  });
});
