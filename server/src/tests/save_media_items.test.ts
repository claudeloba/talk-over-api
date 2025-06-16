
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { saveMediaItems } from '../handlers/save_media_items';
import { eq } from 'drizzle-orm';

describe('saveMediaItems', () => {
  let testProjectId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test project
    const project = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        status: 'pending',
        visual_style: 'mixed'
      })
      .returning()
      .execute();
    
    testProjectId = project[0].id;
  });

  afterEach(resetDB);

  it('should save single media item', async () => {
    const mediaItems = [{
      project_id: testProjectId,
      type: 'image' as const,
      source: 'pexels' as const,
      source_id: '12345',
      url: 'https://example.com/image.jpg',
      thumbnail_url: 'https://example.com/thumb.jpg',
      keyword: 'sunset'
    }];

    const result = await saveMediaItems(mediaItems);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(testProjectId);
    expect(result[0].type).toEqual('image');
    expect(result[0].source).toEqual('pexels');
    expect(result[0].source_id).toEqual('12345');
    expect(result[0].url).toEqual('https://example.com/image.jpg');
    expect(result[0].thumbnail_url).toEqual('https://example.com/thumb.jpg');
    expect(result[0].keyword).toEqual('sunset');
    expect(result[0].suitability_score).toBeNull();
    expect(result[0].suitability_reason).toBeNull();
    expect(result[0].is_selected).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should save multiple media items in batch', async () => {
    const mediaItems = [
      {
        project_id: testProjectId,
        type: 'image' as const,
        source: 'pexels' as const,
        source_id: '12345',
        url: 'https://example.com/image1.jpg',
        keyword: 'sunset'
      },
      {
        project_id: testProjectId,
        type: 'video' as const,
        source: 'pexels' as const,
        source_id: '67890',
        url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/video-thumb.jpg',
        keyword: 'ocean'
      },
      {
        project_id: testProjectId,
        type: 'gif' as const,
        source: 'giphy' as const,
        source_id: 'abc123',
        url: 'https://giphy.com/gif.gif',
        keyword: 'celebration'
      }
    ];

    const result = await saveMediaItems(mediaItems);

    expect(result).toHaveLength(3);
    
    // Check first item
    expect(result[0].type).toEqual('image');
    expect(result[0].source).toEqual('pexels');
    expect(result[0].keyword).toEqual('sunset');
    
    // Check second item
    expect(result[1].type).toEqual('video');
    expect(result[1].thumbnail_url).toEqual('https://example.com/video-thumb.jpg');
    expect(result[1].keyword).toEqual('ocean');
    
    // Check third item
    expect(result[2].type).toEqual('gif');
    expect(result[2].source).toEqual('giphy');
    expect(result[2].keyword).toEqual('celebration');
  });

  it('should handle media items without thumbnail_url', async () => {
    const mediaItems = [{
      project_id: testProjectId,
      type: 'image' as const,
      source: 'pexels' as const,
      source_id: '12345',
      url: 'https://example.com/image.jpg',
      keyword: 'sunset'
    }];

    const result = await saveMediaItems(mediaItems);

    expect(result).toHaveLength(1);
    expect(result[0].thumbnail_url).toBeNull();
  });

  it('should save media items to database correctly', async () => {
    const mediaItems = [{
      project_id: testProjectId,
      type: 'image' as const,
      source: 'pexels' as const,
      source_id: '12345',
      url: 'https://example.com/image.jpg',
      keyword: 'sunset'
    }];

    const result = await saveMediaItems(mediaItems);

    // Verify in database
    const savedItems = await db.select()
      .from(mediaItemsTable)
      .where(eq(mediaItemsTable.project_id, testProjectId))
      .execute();

    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].id).toEqual(result[0].id);
    expect(savedItems[0].type).toEqual('image');
    expect(savedItems[0].source).toEqual('pexels');
    expect(savedItems[0].url).toEqual('https://example.com/image.jpg');
    expect(savedItems[0].is_selected).toEqual(false);
  });

  it('should return empty array for empty input', async () => {
    const result = await saveMediaItems([]);
    expect(result).toHaveLength(0);
  });

  it('should throw error for non-existent project', async () => {
    const mediaItems = [{
      project_id: 99999,
      type: 'image' as const,
      source: 'pexels' as const,
      source_id: '12345',
      url: 'https://example.com/image.jpg',
      keyword: 'sunset'
    }];

    await expect(saveMediaItems(mediaItems)).rejects.toThrow(/Project with id 99999 does not exist/);
  });
});
