
import { z } from 'zod';

// Video generation request schema
export const createVideoRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  duration_preference: z.enum(['short', 'medium', 'long']).optional(), // 30s, 60s, 120s
  voice_preference: z.string().optional(), // ElevenLabs voice ID
  visual_style: z.enum(['images', 'videos', 'mixed']).default('mixed'),
});

export type CreateVideoRequest = z.infer<typeof createVideoRequestSchema>;

// Video project schema
export const videoProjectSchema = z.object({
  id: z.number(),
  topic: z.string(),
  status: z.enum(['pending', 'script_generation', 'tts_generation', 'media_sourcing', 'media_evaluation', 'video_assembly', 'completed', 'failed']),
  duration_preference: z.enum(['short', 'medium', 'long']).nullable(),
  voice_preference: z.string().nullable(),
  visual_style: z.enum(['images', 'videos', 'mixed']),
  script_content: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
  audio_url: z.string().nullable(),
  video_url: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type VideoProject = z.infer<typeof videoProjectSchema>;

// Script generation schema
export const scriptGenerationSchema = z.object({
  content: z.string(),
  keywords: z.array(z.string()),
  estimated_duration: z.number(), // in seconds
});

export type ScriptGeneration = z.infer<typeof scriptGenerationSchema>;

// Media item schema
export const mediaItemSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  type: z.enum(['image', 'video', 'gif']),
  source: z.enum(['pexels', 'giphy']),
  source_id: z.string(),
  url: z.string(),
  thumbnail_url: z.string().nullable(),
  keyword: z.string(),
  suitability_score: z.number().nullable(), // 0-100, evaluated by vision LLM
  suitability_reason: z.string().nullable(),
  is_selected: z.boolean().default(false),
  created_at: z.coerce.date(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;

// Media evaluation schema
export const mediaEvaluationSchema = z.object({
  media_id: z.number(),
  suitability_score: z.number().min(0).max(100),
  suitability_reason: z.string(),
});

export type MediaEvaluation = z.infer<typeof mediaEvaluationSchema>;

// Video assembly configuration schema
export const videoAssemblyConfigSchema = z.object({
  project_id: z.number(),
  selected_media_ids: z.array(z.number()),
  transition_style: z.enum(['fade', 'slide', 'cut']).default('fade'),
  background_music: z.boolean().default(false),
});

export type VideoAssemblyConfig = z.infer<typeof videoAssemblyConfigSchema>;

// Update project status schema
export const updateProjectStatusSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'script_generation', 'tts_generation', 'media_sourcing', 'media_evaluation', 'video_assembly', 'completed', 'failed']),
  error_message: z.string().nullable().optional(),
});

export type UpdateProjectStatus = z.infer<typeof updateProjectStatusSchema>;

// External API response schemas
export const pexelsImageSchema = z.object({
  id: z.number(),
  url: z.string(),
  photographer: z.string(),
  src: z.object({
    original: z.string(),
    large2x: z.string(),
    large: z.string(),
    medium: z.string(),
    small: z.string(),
  }),
});

export type PexelsImage = z.infer<typeof pexelsImageSchema>;

export const pexelsVideoSchema = z.object({
  id: z.number(),
  url: z.string(),
  duration: z.number(),
  user: z.object({
    name: z.string(),
  }),
  video_files: z.array(z.object({
    id: z.number(),
    quality: z.string(),
    file_type: z.string(),
    width: z.number(),
    height: z.number(),
    link: z.string(),
  })),
});

export type PexelsVideo = z.infer<typeof pexelsVideoSchema>;

export const giphyGifSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  images: z.object({
    original: z.object({
      url: z.string(),
      width: z.string(),
      height: z.string(),
    }),
    downsized: z.object({
      url: z.string(),
      width: z.string(),
      height: z.string(),
    }),
  }),
});

export type GiphyGif = z.infer<typeof giphyGifSchema>;
