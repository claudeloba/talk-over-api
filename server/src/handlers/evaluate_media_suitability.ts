
import { type MediaEvaluation } from '../schema';

export declare function evaluateMediaSuitability(mediaUrl: string, scriptContent: string, keyword: string): Promise<MediaEvaluation>;
