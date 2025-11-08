'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mic, 
  Square, 
  Plus, 
  ChevronDown,
  Brain,
  FileText,
  Search,
  User,
  Sparkles,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
        }
      };
    }
  }, [audioUrl]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * numChannels * bytesPerSample);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numChannels * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * numChannels * bytesPerSample, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
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
        
        // Convert WebM to WAV
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          
          // Send to backend API
          setIsTranscribing(true);
          const formData = new FormData();
          formData.append('audio', wavBlob, 'recording.wav');
          
          const response = await fetch('http://localhost:5000/api/upload-audio', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('WAV file saved:', result.message);
            
            // Create URL for playback
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
            setAudioFilename(result.filename);
            setTranscript(result.transcript || null);
            setHasRecording(true);
            
            // Show transcription status
            setIsTranscribing(false);
            if (result.transcript) {
              console.log('Transcript received:', result.transcript);
            } else {
              console.log('No transcript available');
            }
          } else {
            setIsTranscribing(false);
            const error = await response.json();
            console.error('Error uploading audio:', error);
            alert(`Error saving audio: ${error.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error converting to WAV:', error);
          alert('Error converting audio to WAV format');
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewSpeech = () => {
    setHasRecording(false);
    setAudioUrl(null);
    setAudioFilename(null);
    setTranscript(null);
    setIsTranscribing(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const recentSpeeches = [
    "Climate change speech",
    "Artificial intelligence speech",
    "Leadership speech",
    "Education reform speech",
    "Entrepreneurship speech",
    "Mental health speech",
    "Innovation speech",
    "Diversity speech"
  ];

  const projectCards = [
    {
      icon: Brain,
      title: 'Study project',
      description: 'Learn and master any subject'
    },
    {
      icon: FileText,
      title: 'Career project',
      description: 'Find the next step for your career'
    },
    {
      icon: Search,
      title: 'Research project',
      description: 'Analyze and organize research'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF0] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#FFFBF0] border-r border-[#E5E4E2] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#E5E4E2]">
          <Link href="/" className="text-xl font-semibold text-[#101010] hover:opacity-80 transition-opacity">
            Speakeasy
          </Link>
        </div>

        {/* Primary Navigation */}
        <div className="p-4 space-y-2">
          <Button 
            onClick={handleNewSpeech}
            className="w-full justify-start bg-[#E05038] hover:bg-[#C07050] text-white"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mr-2">
              <Plus className="w-4 h-4" />
            </div>
            New Speech
          </Button>
        </div>

        {/* Recent Speeches Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-[#101010] mb-3">Recent Speeches</h3>
          <div className="space-y-1">
            {recentSpeeches.map((speech, index) => (
              <a
                key={index}
                href="#"
                className="block px-3 py-2 text-sm text-[#101010] hover:bg-[#FFFBF0] rounded-lg transition-colors truncate"
              >
                {speech}
              </a>
            ))}
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[#E5E4E2]">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-[#FFFBF0] text-[#101010]">
                ZG
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#101010] truncate">Zhiyuan Guo</p>
              <p className="text-xs text-[#4A4A4A]">Pro plan</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#4A4A4A]" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {hasRecording ? (
          /* Dashboard View */
          <div className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E05038]" />
                  <h1 className="text-2xl font-semibold text-[#101010]">
                    Recording Dashboard
                  </h1>
                </div>
                <Button
                  onClick={handleNewSpeech}
                  className="bg-[#E05038] hover:bg-[#C07050] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Speech
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Audio Playback Widget */}
                <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Volume2 className="w-5 h-5 text-[#E05038]" />
                    <h2 className="text-lg font-semibold text-[#101010]">Audio Playback</h2>
                  </div>
                  
                  {audioUrl && (
                    <>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={togglePlayback}
                            className="w-12 h-12 rounded-full bg-[#E05038] hover:bg-[#C07050] text-white"
                            size="icon"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </Button>
                          
                          <div className="flex-1">
                            <div className="w-full bg-[#E5E4E2] rounded-full h-2 mb-2">
                              <div
                                className="bg-[#E05038] h-2 rounded-full transition-all"
                                style={{
                                  width: audioDuration > 0 ? `${(currentTime / audioDuration) * 100}%` : '0%'
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-[#4A4A4A]">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(audioDuration)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-[#4A4A4A]">
                          <p className="font-medium">File: {audioFilename}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Transcript Widget */}
                <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#101010] mb-4">Transcript</h2>
                  {isTranscribing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#E05038] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#4A4A4A]">Transcribing audio...</p>
                    </div>
                  ) : transcript ? (
                    <div className="space-y-2">
                      <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                        {transcript}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4A4A4A]">Transcription will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Recording View */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-3xl mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#E05038]" />
                <h1 className="text-4xl font-semibold text-[#101010]">
                  Good afternoon, Zhiyuan
                </h1>
              </div>

              {/* Recording Button */}
              <div className="relative mb-6">
                <div className="bg-[#FFFBF0] rounded-xl shadow-sm border border-[#E5E4E2] p-4">
                  <div className="flex items-center justify-center min-h-[60px]">
                    {!isRecording ? (
                      <Button
                        onClick={startRecording}
                        className="w-16 h-16 rounded-full bg-[#E05038] hover:bg-[#C07050] text-white shadow-md hover:shadow-lg transition-all"
                        size="icon"
                      >
                        <Mic className="w-6 h-6" />
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Button
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all"
                          size="icon"
                        >
                          <Square className="w-6 h-6" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-sm text-[#4A4A4A] font-mono">{formatDuration(duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Setup Section */}
              <div className="mt-12">
                <h2 className="text-xl font-semibold text-[#101010] mb-6">
                  Set up Speakeasy for your classes, career, and research
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={index}
                        className="bg-[#FFFBF0] rounded-xl p-6 border border-[#E5E4E2] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-lg border-2 border-[#E5E4E2] flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-[#4A4A4A]" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#101010] mb-2">{card.title}</h3>
                        <p className="text-sm text-[#4A4A4A]">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
