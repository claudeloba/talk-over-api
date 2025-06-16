
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Image, Zap } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { VideoProject, CreateVideoRequest, MediaItem } from '../../server/src/schema';
import { VideoProjectCard } from '@/components/VideoProjectCard';
import { MediaGallery } from '@/components/MediaGallery';
import { CreateVideoForm } from '@/components/CreateVideoForm';

function App() {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [projectMedia, setProjectMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      const result = await trpc.getVideoProjects.query();
      setProjects(result);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  // Load media for selected project
  const loadProjectMedia = useCallback(async (projectId: number) => {
    try {
      const media = await trpc.getProjectMedia.query({ projectId });
      setProjectMedia(media);
    } catch (error) {
      console.error('Failed to load project media:', error);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectMedia(selectedProject.id);
    }
  }, [selectedProject, loadProjectMedia]);

  const handleCreateVideo = async (formData: CreateVideoRequest) => {
    setIsLoading(true);
    try {
      const newProject = await trpc.createVideoProject.mutate(formData);
      setProjects((prev: VideoProject[]) => [newProject, ...prev]);
      setActiveTab('projects');
    } catch (error) {
      console.error('Failed to create video project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: VideoProject['status']) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      script_generation: 'bg-blue-100 text-blue-800',
      tts_generation: 'bg-purple-100 text-purple-800',
      media_sourcing: 'bg-orange-100 text-orange-800',
      media_evaluation: 'bg-yellow-100 text-yellow-800',
      video_assembly: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getStatusProgress = (status: VideoProject['status']) => {
    const progress = {
      pending: 10,
      script_generation: 20,
      tts_generation: 40,
      media_sourcing: 60,
      media_evaluation: 70,
      video_assembly: 90,
      completed: 100,
      failed: 0
    };
    return progress[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
              <Video className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EduVideo AI 🎬
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate educational talk-over videos with AI-powered scripts, professional voice-overs, and curated visuals
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Create Video
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              My Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Media Gallery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreateVideoForm onSubmit={handleCreateVideo} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              {projects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-4">Create your first AI-generated educational video!</p>
                    <Button onClick={() => setActiveTab('create')} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {projects.map((project: VideoProject) => (
                    <VideoProjectCard
                      key={project.id}
                      project={project}
                      onSelect={() => {
                        setSelectedProject(project);
                        setActiveTab('media');
                      }}
                      getStatusColor={getStatusColor}
                      getStatusProgress={getStatusProgress}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="media">
            {selectedProject ? (
              <MediaGallery
                project={selectedProject}
                media={projectMedia}
                onBack={() => setActiveTab('projects')}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a project</h3>
                  <p className="text-gray-500 mb-4">Choose a project from the Projects tab to view its media</p>
                  <Button onClick={() => setActiveTab('projects')} variant="outline">
                    View Projects
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
