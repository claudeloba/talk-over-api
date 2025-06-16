
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Clock, Volume2, Palette } from 'lucide-react';
import { useState } from 'react';
import type { CreateVideoRequest } from '../../../server/src/schema';

interface CreateVideoFormProps {
  onSubmit: (data: CreateVideoRequest) => Promise<void>;
  isLoading?: boolean;
}

export function CreateVideoForm({ onSubmit, isLoading = false }: CreateVideoFormProps) {
  const [formData, setFormData] = useState<CreateVideoRequest>({
    topic: '',
    duration_preference: undefined,
    voice_preference: undefined,
    visual_style: 'mixed'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      topic: '',
      duration_preference: undefined,
      voice_preference: undefined,
      visual_style: 'mixed'
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <CardTitle className="text-2xl">Create Educational Video</CardTitle>
        </div>
        <CardDescription>
          Enter your topic and preferences to generate an AI-powered educational video
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-base font-medium">
              📚 Educational Topic *
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., 'Photosynthesis in plants', 'The water cycle', 'Introduction to machine learning'..."
              value={formData.topic}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateVideoRequest) => ({ ...prev, topic: e.target.value }))
              }
              className="h-20 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration
              </Label>
              <Select
                value={formData.duration_preference || 'default'}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateVideoRequest) => ({ 
                    ...prev, 
                    duration_preference: value === 'default' ? undefined : value as 'short' | 'medium' | 'long'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="short">🚀 Short (30s)</SelectItem>
                  <SelectItem value="medium">⚡ Medium (60s)</SelectItem>
                  <SelectItem value="long">📖 Long (120s)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Style
              </Label>
              <Select
                value={formData.voice_preference || 'default'}
                onValueChange={(value: string) =>
                  setFormData((prev: CreateVideoRequest) => ({ 
                    ...prev, 
                    voice_preference: value === 'default' ? undefined : value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Default voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="educational">🎓 Educational</SelectItem>
                  <SelectItem value="friendly">😊 Friendly</SelectItem>
                  <SelectItem value="professional">💼 Professional</SelectItem>
                  <SelectItem value="enthusiastic">🔥 Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Visual Style
              </Label>
              <Select
                value={formData.visual_style}
                onValueChange={(value: 'images' | 'videos' | 'mixed') =>
                  setFormData((prev: CreateVideoRequest) => ({ ...prev, visual_style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="images">🖼️ Images Only</SelectItem>
                  <SelectItem value="videos">🎥 Videos Only</SelectItem>
                  <SelectItem value="mixed">✨ Mixed Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !formData.topic.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg"
          >
            {isLoading ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Creating Your Video...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Educational Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
