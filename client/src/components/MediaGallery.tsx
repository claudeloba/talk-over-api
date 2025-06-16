
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Image, Video, Zap, Eye, Star, CheckCircle, Volume2 } from 'lucide-react';
import type { VideoProject, MediaItem } from '../../../server/src/schema';

interface MediaGalleryProps {
  project: VideoProject;
  media: MediaItem[];
  onBack: () => void;
}

export function MediaGallery({ project, media, onBack }: MediaGalleryProps) {
  const getMediaIcon = (type: MediaItem['type']) => {
    const icons = {
      image: <Image className="h-4 w-4" />,
      video: <Video className="h-4 w-4" />,
      gif: <Zap className="h-4 w-4" />
    };
    return icons[type];
  };

  const getMediaTypeColor = (type: MediaItem['type']) => {
    const colors = {
      image: 'bg-blue-100 text-blue-800',
      video: 'bg-purple-100 text-purple-800',
      gif: 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const getSuitabilityColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getSuitabilityText = (score: number | null) => {
    if (score === null) return 'Not evaluated';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Poor';
  };

  const groupedMedia = media.reduce((acc, item) => {
    if (!acc[item.keyword]) {
      acc[item.keyword] = [];
    }
    acc[item.keyword].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{project.topic}</h2>
          <p className="text-gray-600">
            {media.length} media items • {Object.keys(groupedMedia).length} keywords
          </p>
        </div>
      </div>

      {project.script_content && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📝 Generated Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {project.script_content}
            </p>
            {project.audio_url && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Generated Audio</span>
                </div>
                <audio controls className="w-full">
                  <source src={project.audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {Object.keys(groupedMedia).length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No media yet</h3>
            <p className="text-gray-500">Media will appear here as the project progresses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedMedia).map(([keyword, items]) => (
            <div key={keyword}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">🔍 {keyword}</h3>
                <Badge variant="outline">{items.length} items</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item: MediaItem) => (
                  <Card key={item.id} className={`hover:shadow-md transition-shadow ${item.is_selected ? 'ring-2 ring-green-500' : ''}`}>
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {item.type === 'video' ? (
                          <video 
                            src={item.url} 
                            className="w-full h-full object-cover"
                            muted
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          />
                        ) : (
                          <img 
                            src={item.thumbnail_url || item.url} 
                            alt={item.keyword}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className={getMediaTypeColor(item.type)}>
                            {getMediaIcon(item.type)}
                            <span className="ml-1 capitalize">{item.type}</span>
                          </Badge>
                          {item.is_selected && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                          {item.suitability_score !== null && (
                            <Badge className={getSuitabilityColor(item.suitability_score)}>
                              <Star className="h-3 w-3 mr-1" />
                              {getSuitabilityText(item.suitability_score)}
                            </Badge>
                          )}
                        </div>
                        
                        {item.suitability_reason && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {item.suitability_reason}
                          </p>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(item.url, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Full
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
