import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Video, VideoOff, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import type { SpeechType, Session } from '../types';

interface RecordingControlsProps {
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onFeedbackUpdate: (feedback: Session['feedback']) => void;
  onImprovedDraftUpdate: (draft: string) => void;
  onAudioUrlUpdate: (url: string) => void;
  speechType: SpeechType;
  showCamera: boolean;
  onCameraToggle: () => void;
}

export function RecordingControls({
  isRecording,
  onRecordingChange,
  onTranscriptUpdate,
  onFeedbackUpdate,
  onImprovedDraftUpdate,
  onAudioUrlUpdate,
  speechType,
  showCamera,
  onCameraToggle
}: RecordingControlsProps) {
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processRecording(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      onRecordingChange(true);
      setDuration(0);

      // Simulate real-time transcription
      simulateTranscription();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      onRecordingChange(false);
    }
  };

  const simulateTranscription = () => {
    // Simulate real-time transcription for demo
    const sampleTexts = [
      "Hello everyone, thank you for joining me today.",
      " I'm excited to share my thoughts on this important topic.",
      " The research shows that effective communication is crucial for success.",
      " Let me break this down into three main points.",
      " First, we need to consider the audience's perspective.",
      " Second, clarity is more important than complexity.",
      " And finally, practice makes perfect."
    ];

    let currentText = '';
    let index = 0;

    const transcriptInterval = setInterval(() => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        clearInterval(transcriptInterval);
        return;
      }

      if (index < sampleTexts.length) {
        currentText += sampleTexts[index];
        onTranscriptUpdate(currentText);
        index++;
      } else {
        clearInterval(transcriptInterval);
      }
    }, 2000);
  };

  const processRecording = async (audioBlob: Blob) => {
    setIsProcessing(true);

    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock feedback based on speech type
    const mockFeedback = generateMockFeedback(speechType);
    onFeedbackUpdate(mockFeedback);

    // Mock improved draft
    const mockImprovedDraft = generateImprovedDraft(speechType);
    onImprovedDraftUpdate(mockImprovedDraft);

    // Mock TTS audio URL
    onAudioUrlUpdate('mock-audio-url');

    setIsProcessing(false);
  };

  const generateMockFeedback = (type: SpeechType): Session['feedback'] => {
    return {
      clarity: Math.floor(Math.random() * 20) + 80,
      structure: Math.floor(Math.random() * 15) + 85,
      fillerWords: ['um', 'uh', 'like'],
      suggestions: [
        'Strong opening that captures attention',
        'Consider adding more concrete examples',
        'Pace could be slightly slower for emphasis',
        'Excellent use of rhetorical questions'
      ]
    };
  };

  const generateImprovedDraft = (type: SpeechType): string => {
    const drafts = {
      'public-forum': 'Ladies and gentlemen, the evidence clearly demonstrates that our position offers the most viable solution. Consider the empirical data: studies consistently show measurable improvements across all key metrics.',
      'policy-debate': 'The resolution requires careful examination of both immediate and long-term impacts. Our framework establishes three critical advantages that uniquely solve for the harms identified in the status quo.',
      'presentation': "Today, I'll walk you through three key concepts that will transform your understanding of this subject. Let's start with the fundamental principles and build from there.",
      'ceremony': 'It is an honor and a privilege to stand before you today. This moment represents not just an achievement, but a testament to dedication, perseverance, and the unwavering support of those who believed in this vision.',
      'ted-talk': "Imagine a world where this challenge no longer exists. That's not a distant dream—it's within our reach. Let me share a story that changed my perspective forever."
    };

    return drafts[type] || drafts.presentation;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900">Recording Studio</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isRecording ? 'Recording in progress...' : 'Ready to start your practice session'}
          </p>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-slate-900 tabular-nums">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}

        <Button
          onClick={onCameraToggle}
          variant={showCamera ? "default" : "outline"}
          size="icon"
        >
          {showCamera ? (
            <Video className="w-4 h-4" />
          ) : (
            <VideoOff className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Processing your speech...</span>
        </div>
      )}
    </div>
  );
}
