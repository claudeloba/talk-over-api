
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createVideoRequestSchema, 
  updateProjectStatusSchema,
  mediaEvaluationSchema,
  videoAssemblyConfigSchema
} from './schema';

// Handler imports
import { createVideoProject } from './handlers/create_video_project';
import { getVideoProject } from './handlers/get_video_project';
import { getVideoProjects } from './handlers/get_video_projects';
import { generateScript } from './handlers/generate_script';
import { generateTTSAudio } from './handlers/generate_tts_audio';
import { sourceImagesFromPexels, sourceVideosFromPexels } from './handlers/source_media_from_pexels';
import { sourceGifsFromGiphy } from './handlers/source_media_from_giphy';
import { evaluateMediaSuitability } from './handlers/evaluate_media_suitability';
import { updateProjectStatus } from './handlers/update_project_status';
import { updateMediaEvaluation } from './handlers/update_media_evaluation';
import { assembleVideo } from './handlers/assemble_video';
import { getProjectMedia } from './handlers/get_project_media';
import { selectMediaForProject } from './handlers/select_media_for_project';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Video project management
  createVideoProject: publicProcedure
    .input(createVideoRequestSchema)
    .mutation(({ input }) => createVideoProject(input)),

  getVideoProject: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getVideoProject(input.id)),

  getVideoProjects: publicProcedure
    .query(() => getVideoProjects()),

  updateProjectStatus: publicProcedure
    .input(updateProjectStatusSchema)
    .mutation(({ input }) => updateProjectStatus(input)),

  // Content generation
  generateScript: publicProcedure
    .input(z.object({ 
      topic: z.string(),
      durationPreference: z.enum(['short', 'medium', 'long']).optional()
    }))
    .mutation(({ input }) => generateScript(input.topic, input.durationPreference)),

  generateTTSAudio: publicProcedure
    .input(z.object({ 
      scriptContent: z.string(),
      voiceId: z.string().optional()
    }))
    .mutation(({ input }) => generateTTSAudio(input.scriptContent, input.voiceId)),

  // Media sourcing
  sourceImagesFromPexels: publicProcedure
    .input(z.object({ keywords: z.array(z.string()) }))
    .mutation(({ input }) => sourceImagesFromPexels(input.keywords)),

  sourceVideosFromPexels: publicProcedure
    .input(z.object({ keywords: z.array(z.string()) }))
    .mutation(({ input }) => sourceVideosFromPexels(input.keywords)),

  sourceGifsFromGiphy: publicProcedure
    .input(z.object({ keywords: z.array(z.string()) }))
    .mutation(({ input }) => sourceGifsFromGiphy(input.keywords)),

  // Media evaluation and selection
  evaluateMediaSuitability: publicProcedure
    .input(z.object({ 
      mediaUrl: z.string(),
      scriptContent: z.string(),
      keyword: z.string()
    }))
    .mutation(({ input }) => evaluateMediaSuitability(input.mediaUrl, input.scriptContent, input.keyword)),

  updateMediaEvaluation: publicProcedure
    .input(mediaEvaluationSchema)
    .mutation(({ input }) => updateMediaEvaluation(input)),

  getProjectMedia: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectMedia(input.projectId)),

  selectMediaForProject: publicProcedure
    .input(z.object({ mediaIds: z.array(z.number()) }))
    .mutation(({ input }) => selectMediaForProject(input.mediaIds)),

  // Video assembly
  assembleVideo: publicProcedure
    .input(videoAssemblyConfigSchema)
    .mutation(({ input }) => assembleVideo(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
