
import { type GiphyGif } from '../schema';

const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs/search';

export async function sourceGifsFromGiphy(keywords: string[]): Promise<GiphyGif[]> {
  const GIPHY_API_KEY = process.env['GIPHY_API_KEY'];
  
  if (!GIPHY_API_KEY) {
    throw new Error('GIPHY_API_KEY environment variable is required');
  }

  if (keywords.length === 0) {
    return [];
  }

  try {
    const allGifs: GiphyGif[] = [];

    // Fetch GIFs for each keyword
    for (const keyword of keywords) {
      const searchQuery = encodeURIComponent(keyword.trim());
      const url = `${GIPHY_BASE_URL}?api_key=${GIPHY_API_KEY}&q=${searchQuery}&limit=5&rating=g`;

      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch GIFs for keyword "${keyword}": ${response.status} ${response.statusText}`);
        continue;
      }

      const data = await response.json() as any;
      
      if (data.data && Array.isArray(data.data)) {
        const keywordGifs = data.data.map((gif: any) => ({
          id: gif.id,
          url: gif.url,
          title: gif.title || '',
          images: {
            original: {
              url: gif.images.original.url,
              width: gif.images.original.width,
              height: gif.images.original.height,
            },
            downsized: {
              url: gif.images.downsized.url,
              width: gif.images.downsized.width,
              height: gif.images.downsized.height,
            },
          },
        }));

        allGifs.push(...keywordGifs);
      }
    }

    // Remove duplicates based on ID
    const uniqueGifs = allGifs.filter((gif, index, self) => 
      index === self.findIndex(g => g.id === gif.id)
    );

    return uniqueGifs;
  } catch (error) {
    console.error('Failed to source GIFs from Giphy:', error);
    throw error;
  }
}
