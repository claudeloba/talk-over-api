
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { videoProjectsTable, mediaItemsTable } from '../db/schema';
import { getProjectMedia } from '../handlers/get_project_media';

describe('getProjectMedia', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for project with no media', async () => {
    // Create a project without media
    const [project] = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    const result = await getProjectMedia(project.id);

    expect(result).toEqual([]);
  });

  it('should return media items for a project', async () => {
    // Create a project
    const [project] = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    // Create media items for the project
    await db.insert(mediaItemsTable)
      .values([
        {
          project_id: project.id,
          type: 'image',
          source: 'pexels',
          source_id: '123',
          url: 'https://example.com/image1.jpg',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          keyword: 'nature',
          suitability_score: 85,
          suitability_reason: 'High quality nature image',
          is_selected: true
        },
        {
          project_id: project.id,
          type: 'video',
          source: 'pexels',
          source_id: '456',
          url: 'https://example.com/video1.mp4',
          keyword: 'ocean',
          suitability_score: 92,
          suitability_reason: 'Perfect ocean footage',
          is_selected: false
        }
      ])
      .execute();

    const result = await getProjectMedia(project.id);

    expect(result).toHaveLength(2);
    
    // Check first media item
    const imageItem = result.find(item => item.type === 'image');
    expect(imageItem).toBeDefined();
    expect(imageItem!.source).toEqual('pexels');
    expect(imageItem!.source_id).toEqual('123');
    expect(imageItem!.url).toEqual('https://example.com/image1.jpg');
    expect(imageItem!.thumbnail_url).toEqual('https://example.com/thumb1.jpg');
    expect(imageItem!.keyword).toEqual('nature');
    expect(imageItem!.suitability_score).toEqual(85);
    expect(imageItem!.suitability_reason).toEqual('High quality nature image');
    expect(imageItem!.is_selected).toBe(true);
    expect(imageItem!.created_at).toBeInstanceOf(Date);

    // Check second media item
    const videoItem = result.find(item => item.type === 'video');
    expect(videoItem).toBeDefined();
    expect(videoItem!.source).toEqual('pexels');
    expect(videoItem!.source_id).toEqual('456');
    expect(videoItem!.url).toEqual('https://example.com/video1.mp4');
    expect(videoItem!.thumbnail_url).toBeNull();
    expect(videoItem!.keyword).toEqual('ocean');
    expect(videoItem!.suitability_score).toEqual(92);
    expect(videoItem!.suitability_reason).toEqual('Perfect ocean footage');
    expect(videoItem!.is_selected).toBe(false);
  });

  it('should only return media for the specified project', async () => {
    // Create two projects
    const [project1] = await db.insert(videoProjectsTable)
      .values({
        topic: 'Project 1',
        visual_style: 'images'
      })
      .returning()
      .execute();

    const [project2] = await db.insert(videoProjectsTable)
      .values({
        topic: 'Project 2',
        visual_style: 'videos'
      })
      .returning()
      .execute();

    // Create media for both projects
    await db.insert(mediaItemsTable)
      .values([
        {
          project_id: project1.id,
          type: 'image',
          source: 'pexels',
          source_id: '111',
          url: 'https://example.com/project1.jpg',
          keyword: 'forest'
        },
        {
          project_id: project2.id,
          type: 'video',
          source: 'pexels',
          source_id: '222',
          url: 'https://example.com/project2.mp4',
          keyword: 'city'
        }
      ])
      .execute();

    const result = await getProjectMedia(project1.id);

    expect(result).toHaveLength(1);
    expect(result[0].project_id).toEqual(project1.id);
    expect(result[0].keyword).toEqual('forest');
    expect(result[0].url).toEqual('https://example.com/project1.jpg');
  });

  it('should return media items with all fields populated correctly', async () => {
    // Create a project
    const [project] = await db.insert(videoProjectsTable)
      .values({
        topic: 'Test Topic',
        visual_style: 'mixed'
      })
      .returning()
      .execute();

    // Create a media item with all optional fields
    await db.insert(mediaItemsTable)
      .values({
        project_id: project.id,
        type: 'gif',
        source: 'giphy',
        source_id: 'abc123',
        url: 'https://giphy.com/test.gif',
        thumbnail_url: 'https://giphy.com/thumb.jpg',
        keyword: 'funny',
        suitability_score: 75,
        suitability_reason: 'Moderately suitable content',
        is_selected: true
      })
      .execute();

    const result = await getProjectMedia(project.id);

    expect(result).toHaveLength(1);
    const mediaItem = result[0];
    
    expect(mediaItem.id).toBeDefined();
    expect(mediaItem.project_id).toEqual(project.id);
    expect(mediaItem.type).toEqual('gif');
    expect(mediaItem.source).toEqual('giphy');
    expect(mediaItem.source_id).toEqual('abc123');
    expect(mediaItem.url).toEqual('https://giphy.com/test.gif');
    expect(mediaItem.thumbnail_url).toEqual('https://giphy.com/thumb.jpg');
    expect(mediaItem.keyword).toEqual('funny');
    expect(mediaItem.suitability_score).toEqual(75);
    expect(mediaItem.suitability_reason).toEqual('Moderately suitable content');
    expect(mediaItem.is_selected).toBe(true);
    expect(mediaItem.created_at).toBeInstanceOf(Date);
  });
});
