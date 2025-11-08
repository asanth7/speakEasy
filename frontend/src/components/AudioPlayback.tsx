import { Play, Pause, Volume2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AudioPlaybackProps {
  audioUrl: string;
  improvedDraft: string;
}

export function AudioPlayback({ audioUrl, improvedDraft }: AudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('professional');

  const voices = [
    { id: 'professional', name: 'Professional', description: 'Clear and authoritative' },
    { id: 'motivational', name: 'Motivational', description: 'Inspiring and energetic' },
    { id: 'academic', name: 'Academic', description: 'Thoughtful and measured' },
    { id: 'conversational', name: 'Conversational', description: 'Warm and friendly' }
  ];

  const handlePlayPause = () => {
    // In a real implementation, this would control TTS playback
    setIsPlaying(!isPlaying);
    
    // Simulate playback
    if (!isPlaying) {
      setTimeout(() => {
        setIsPlaying(false);
      }, 5000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-green-600" />
          <h3 className="text-slate-900">AI-Enhanced Version</h3>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-700 leading-relaxed">
            {improvedDraft}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  <div>
                    <div>{voice.name}</div>
                    <div className="text-xs text-slate-500">{voice.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handlePlayPause}
            variant="outline"
            className="flex-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play Enhanced Speech
              </>
            )}
          </Button>

          <Button variant="outline" size="icon">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Listen to your speech enhanced with AI suggestions and delivered in your chosen voice style
        </p>
      </div>
    </div>
  );
}
