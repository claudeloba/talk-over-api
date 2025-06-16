
import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { sourceImagesFromPexels, sourceVideosFromPexels } from '../handlers/source_media_from_pexels';

// Mock Pexels API responses
const mockImageResponse = {
  photos: [
    {
      id: 123456,
      url: 'https://www.pexels.com/photo/123456/',
      photographer: 'Test Photographer',
      src: {
        original: 'https://images.pexels.com/photos/123456/photo-123456.jpeg',
        large2x: 'https://images.pexels.com/photos/123456/photo-123456.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
        large: 'https://images.pexels.com/photos/123456/photo-123456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
        medium: 'https://images.pexels.com/photos/123456/photo-123456.jpeg?auto=compress&cs=tinysrgb&h=350',
        small: 'https://images.pexels.com/photos/123456/photo-123456.jpeg?auto=compress&cs=tinysrgb&h=130',
      },
    },
  ],
};

const mockVideoResponse = {
  videos: [
    {
      id: 789012,
      url: 'https://www.pexels.com/video/789012/',
      duration: 30,
      user: {
        name: 'Test Videographer',
      },
      video_files: [
        {
          id: 111222,
          quality: 'hd',
          file_type: 'video/mp4',
          width: 1920,
          height: 1080,
          link: 'https://vod-progressive.akamaized.net/exp=1234567890/video.mp4',
        },
      ],
    },
  ],
};

// Mock fetch function type
type MockFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

// Store original fetch and create mock
const originalFetch = globalThis.fetch;
let mockFetch: MockFetch;

describe('sourceImagesFromPexels', () => {
  beforeEach(() => {
    // Set up environment variable for each test
    process.env['PEXELS_API_KEY'] = 'test-api-key';
  });

  afterEach(() => {
    // Restore original fetch and clean up
    globalThis.fetch = originalFetch;
    delete process.env['PEXELS_API_KEY'];
  });

  it('should return empty array when no keywords provided', async () => {
    const result = await sourceImagesFromPexels([]);
    expect(result).toEqual([]);
  });

  it('should throw error when API key is missing', async () => {
    delete process.env['PEXELS_API_KEY'];
    
    expect(async () => {
      await sourceImagesFromPexels(['nature']);
    }).toThrow('PEXELS_API_KEY environment variable is required');
  });

  it('should fetch images for given keywords', async () => {
    // Mock successful API response
    mockFetch = async () => {
      return new Response(JSON.stringify(mockImageResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceImagesFromPexels(['nature']);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(123456);
    expect(result[0].photographer).toBe('Test Photographer');
    expect(result[0].src.original).toBe('https://images.pexels.com/photos/123456/photo-123456.jpeg');
    expect(result[0].src.medium).toBe('https://images.pexels.com/photos/123456/photo-123456.jpeg?auto=compress&cs=tinysrgb&h=350');
  });

  it('should handle multiple keywords', async () => {
    mockFetch = async () => {
      return new Response(JSON.stringify(mockImageResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceImagesFromPexels(['nature', 'forest']);

    // Should get results for both keywords
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(123456);
    expect(result[1].id).toBe(123456);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch = async () => {
      return new Response('Not Found', { status: 404 });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceImagesFromPexels(['invalid']);

    // Should return empty array when API fails
    expect(result).toEqual([]);
  });
});

describe('sourceVideosFromPexels', () => {
  beforeEach(() => {
    process.env['PEXELS_API_KEY'] = 'test-api-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env['PEXELS_API_KEY'];
  });

  it('should return empty array when no keywords provided', async () => {
    const result = await sourceVideosFromPexels([]);
    expect(result).toEqual([]);
  });

  it('should throw error when API key is missing', async () => {
    delete process.env['PEXELS_API_KEY'];
    
    expect(async () => {
      await sourceVideosFromPexels(['nature']);
    }).toThrow('PEXELS_API_KEY environment variable is required');
  });

  it('should fetch videos for given keywords', async () => {
    mockFetch = async () => {
      return new Response(JSON.stringify(mockVideoResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceVideosFromPexels(['nature']);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(789012);
    expect(result[0].duration).toBe(30);
    expect(result[0].user.name).toBe('Test Videographer');
    expect(result[0].video_files).toHaveLength(1);
    expect(result[0].video_files[0].quality).toBe('hd');
    expect(result[0].video_files[0].file_type).toBe('video/mp4');
    expect(result[0].video_files[0].width).toBe(1920);
    expect(result[0].video_files[0].height).toBe(1080);
  });

  it('should handle multiple keywords', async () => {
    mockFetch = async () => {
      return new Response(JSON.stringify(mockVideoResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceVideosFromPexels(['nature', 'ocean']);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(789012);
    expect(result[1].id).toBe(789012);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch = async () => {
      return new Response('Server Error', { status: 500 });
    };
    globalThis.fetch = mockFetch as any;

    const result = await sourceVideosFromPexels(['invalid']);

    expect(result).toEqual([]);
  });
});
