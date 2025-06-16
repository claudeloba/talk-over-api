
import { type PexelsImage, type PexelsVideo } from '../schema';

export declare function sourceImagesFromPexels(keywords: string[]): Promise<PexelsImage[]>;
export declare function sourceVideosFromPexels(keywords: string[]): Promise<PexelsVideo[]>;
