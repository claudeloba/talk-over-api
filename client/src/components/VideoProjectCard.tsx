
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Play, Download, Eye, Clock, Video, Volume2 } from 'lucide-react';
import type { VideoProject } from '../../../server/src/schema';

interface VideoProjectCardProps {
  project: VideoProject;
  onSelect: () => void;
  getStatusColor: (status: VideoProject['status']) => string;
  getStatusProgress: (status: VideoProject['status']) => number;
}

export function VideoProjectCard({ project, onSelect, getStatusColor, getStatusProgress }: VideoProjectCardProps) {
  const formatDuration = (preference: string | null) => {
    if (!preference) return 'Default';
    const durations = { short: '30s', medium: '60s', long: '120s' };
    return durations[preference as keyof typeof durations] || preference;
  };

  const formatVisualStyle = (style: string) => {
    const styles = { 
      images: '🖼️ Images', 
      videos: '🎥 Videos', 
      mixed: '✨ Mixed' 
    };
    return styles[style as keyof typeof styles] || style;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 line-clamp-2">{project.topic}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(project.duration_preference)}
              </span>
              <span className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                {formatVisualStyle(project.visual_style)}
              </span>
              {project.voice_preference && (
                <span className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4" />
                  {project.voice_preference}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-3">
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
              <div className="flex-1 max-w-xs">
                <Progress value={getStatusProgress(project.status)} className="h-2" />
              </div>
              <span className="text-sm text-gray-500">
                {getStatusProgress(project.status)}%
              </span>
            </div>
          </div>
        </div>

        {project.error_message && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{project.error_message}</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Created: {project.created_at.toLocaleDateString()}
            {project.updated_at.getTime() !== project.created_at.getTime() && (
              <span className="ml-2">
                • Updated: {project.updated_at.toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSelect}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View Details
            </Button>
            
            {project.status === 'completed' && project.video_url && (
              <>
                <Button 
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  onClick={() => window.open(project.video_url!, '_blank')}
                >
                  <Play className="h-4 w-4" />
                  Watch
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = project.video_url!;
                    a.download = `${project.topic.slice(0, 30)}.mp4`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
