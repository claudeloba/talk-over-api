
import { type MediaItem } from '../schema';

interface SaveMediaItemInput {
  project_id: number;
  type: 'image' | 'video' | 'gif';
  source: 'pexels' | 'giphy';
  source_id: string;
  url: string;
  thumbnail_url?: string;
  keyword: string;
}

export declare function saveMediaItems(mediaItems: SaveMediaItemInput[]): Promise<MediaItem[]>;
