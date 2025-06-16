
import { type ScriptGeneration } from '../schema';

export declare function generateScript(topic: string, durationPreference?: 'short' | 'medium' | 'long'): Promise<ScriptGeneration>;
