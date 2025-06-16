
import { type PexelsImage, type PexelsVideo } from '../schema';

const PEXELS_BASE_URL = 'https://api.pexels.com/v1';
const PEXELS_VIDEOS_URL = 'https://api.pexels.com/videos';

export async function sourceImagesFromPexels(keywords: string[]): Promise<PexelsImage[]> {
  const PEXELS_API_KEY = process.env['PEXELS_API_KEY'];

  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable is required');
  }

  if (!keywords || keywords.length === 0) {
    return [];
  }

  try {
    const allImages: PexelsImage[] = [];

    for (const keyword of keywords) {
      const response = await fetch(
        `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(keyword)}&per_page=5&page=1`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch images for keyword "${keyword}": ${response.status}`);
        continue;
      }

      const data = await response.json() as any;
      
      if (data.photos && Array.isArray(data.photos)) {
        const images = data.photos.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          photographer: photo.photographer,
          src: {
            original: photo.src.original,
            large2x: photo.src.large2x,
            large: photo.src.large,
            medium: photo.src.medium,
            small: photo.src.small,
          },
        }));

        allImages.push(...images);
      }
    }

    return allImages;
  } catch (error) {
    console.error('Error sourcing images from Pexels:', error);
    throw error;
  }
}

export async function sourceVideosFromPexels(keywords: string[]): Promise<PexelsVideo[]> {
  const PEXELS_API_KEY = process.env['PEXELS_API_KEY'];

  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable is required');
  }

  if (!keywords || keywords.length === 0) {
    return [];
  }

  try {
    const allVideos: PexelsVideo[] = [];

    for (const keyword of keywords) {
      const response = await fetch(
        `${PEXELS_VIDEOS_URL}/search?query=${encodeURIComponent(keyword)}&per_page=5&page=1`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch videos for keyword "${keyword}": ${response.status}`);
        continue;
      }

      const data = await response.json() as any;
      
      if (data.videos && Array.isArray(data.videos)) {
        const videos = data.videos.map((video: any) => ({
          id: video.id,
          url: video.url,
          duration: video.duration,
          user: {
            name: video.user.name,
          },
          video_files: video.video_files.map((file: any) => ({
            id: file.id,
            quality: file.quality,
            file_type: file.file_type,
            width: file.width,
            height: file.height,
            link: file.link,
          })),
        }));

        allVideos.push(...videos);
      }
    }

    return allVideos;
  } catch (error) {
    console.error('Error sourcing videos from Pexels:', error);
    throw error;
  }
}
