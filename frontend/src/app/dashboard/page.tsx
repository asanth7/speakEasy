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
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Dashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
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
        console.log('Recording stopped. Audio blob size:', audioBlob.size);
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
    <div className="min-h-screen bg-[#FAF9F5] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#FAF9F5] border-r border-[#E5E4E2] flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-[#E5E4E2]">
          <Link href="/" className="text-xl font-semibold text-[#101010] hover:opacity-80 transition-opacity">
            Speakeasy
          </Link>
        </div>

        {/* Primary Navigation */}
        <div className="p-4 space-y-2">
          <Button className="w-full justify-start bg-[#E05038] hover:bg-[#C07050] text-white">
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
                className="block px-3 py-2 text-sm text-[#101010] hover:bg-[#FAF9F5] rounded-lg transition-colors truncate"
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
              <AvatarFallback className="bg-[#FAF9F5] text-[#101010]">
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          {/* Greeting */}
          <div className="w-full max-w-3xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#E05038]" />
              <h1 className="text-4xl font-semibold text-[#101010]">
                Good afternoon, Zhiyuan
              </h1>
            </div>

            {/* Recording Button (replaces text input) */}
            <div className="relative mb-6">
              <div className="bg-[#FAF9F5] rounded-xl shadow-sm border border-[#E5E4E2] p-4">
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
                      className="bg-[#FAF9F5] rounded-xl p-6 border border-[#E5E4E2] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
      </main>
    </div>
  );
}
