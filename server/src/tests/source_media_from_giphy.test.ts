
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { sourceGifsFromGiphy } from '../handlers/source_media_from_giphy';

// Mock fetch for testing
const originalFetch = global.fetch;
const mockFetch = (url: string) => {
  const searchParams = new URLSearchParams(url.split('?')[1]);
  const query = searchParams.get('q');
  
  if (query === 'cats') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            id: 'cat_gif_1',
            url: 'https://giphy.com/gifs/cat_gif_1',
            title: 'Funny Cat',
            images: {
              original: {
                url: 'https://media.giphy.com/cat_original.gif',
                width: '400',
                height: '300',
              },
              downsized: {
                url: 'https://media.giphy.com/cat_downsized.gif',
                width: '200',
                height: '150',
              },
            },
          },
          {
            id: 'cat_gif_2',
            url: 'https://giphy.com/gifs/cat_gif_2',
            title: 'Sleepy Cat',
            images: {
              original: {
                url: 'https://media.giphy.com/cat2_original.gif',
                width: '480',
                height: '360',
              },
              downsized: {
                url: 'https://media.giphy.com/cat2_downsized.gif',
                width: '240',
                height: '180',
              },
            },
          },
        ],
      }),
    } as Response);
  }
  
  if (query === 'dogs') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            id: 'dog_gif_1',
            url: 'https://giphy.com/gifs/dog_gif_1',
            title: 'Happy Dog',
            images: {
              original: {
                url: 'https://media.giphy.com/dog_original.gif',
                width: '500',
                height: '400',
              },
              downsized: {
                url: 'https://media.giphy.com/dog_downsized.gif',
                width: '250',
                height: '200',
              },
            },
          },
        ],
      }),
    } as Response);
  }

  if (query === 'duplicate') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        data: [
          {
            id: 'same_gif_id',
            url: 'https://giphy.com/gifs/same_gif',
            title: 'Same GIF',
            images: {
              original: {
                url: 'https://media.giphy.com/same_original.gif',
                width: '300',
                height: '300',
              },
              downsized: {
                url: 'https://media.giphy.com/same_downsized.gif',
                width: '150',
                height: '150',
              },
            },
          },
        ],
      }),
    } as Response);
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    statusText: 'Not Found',
  } as Response);
};

describe('sourceGifsFromGiphy', () => {
  beforeEach(() => {
    global.fetch = mockFetch as any;
    process.env['GIPHY_API_KEY'] = 'test_api_key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env['GIPHY_API_KEY'];
  });

  it('should return empty array for empty keywords', async () => {
    const result = await sourceGifsFromGiphy([]);
    expect(result).toEqual([]);
  });

  it('should fetch GIFs for single keyword', async () => {
    const result = await sourceGifsFromGiphy(['cats']);
    
    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('cat_gif_1');
    expect(result[0].url).toEqual('https://giphy.com/gifs/cat_gif_1');
    expect(result[0].title).toEqual('Funny Cat');
    expect(result[0].images.original.url).toEqual('https://media.giphy.com/cat_original.gif');
    expect(result[0].images.original.width).toEqual('400');
    expect(result[0].images.original.height).toEqual('300');
    expect(result[0].images.downsized.url).toEqual('https://media.giphy.com/cat_downsized.gif');
    expect(result[0].images.downsized.width).toEqual('200');
    expect(result[0].images.downsized.height).toEqual('150');
  });

  it('should fetch GIFs for multiple keywords', async () => {
    const result = await sourceGifsFromGiphy(['cats', 'dogs']);
    
    expect(result).toHaveLength(3);
    
    // Check cat GIFs
    const catGifs = result.filter(gif => gif.title.includes('Cat'));
    expect(catGifs).toHaveLength(2);
    
    // Check dog GIFs
    const dogGifs = result.filter(gif => gif.title.includes('Dog'));
    expect(dogGifs).toHaveLength(1);
    expect(dogGifs[0].id).toEqual('dog_gif_1');
    expect(dogGifs[0].title).toEqual('Happy Dog');
  });

  it('should remove duplicate GIFs by ID', async () => {
    const result = await sourceGifsFromGiphy(['duplicate', 'duplicate']);
    
    // Should only have one GIF even though we searched the same keyword twice
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('same_gif_id');
    expect(result[0].title).toEqual('Same GIF');
  });

  it('should handle API errors gracefully', async () => {
    const result = await sourceGifsFromGiphy(['nonexistent_keyword']);
    
    // Should return empty array when API returns error
    expect(result).toEqual([]);
  });

  it('should throw error when API key is missing', async () => {
    delete process.env['GIPHY_API_KEY'];
    
    await expect(sourceGifsFromGiphy(['cats'])).rejects.toThrow(/GIPHY_API_KEY environment variable is required/i);
  });

  it('should handle keywords with spaces', async () => {
    const result = await sourceGifsFromGiphy(['  cats  ']);
    
    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Funny Cat');
  });
});
