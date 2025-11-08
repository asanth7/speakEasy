'use client';

import { useState } from 'react';
import { Header } from '../../components/Header';
import { SpeechTypeSelector } from '../../components/SpeechTypeSelector';
import { RecordingControls } from '../../components/RecordingControls';
import { TranscriptDisplay } from '../../components/TranscriptDisplay';
import { FeedbackPanel } from '../../components/FeedbackPanel';
import { CameraFeed } from '../../components/CameraFeed';
import { AudioPlayback } from '../../components/AudioPlayback';
import type { SpeechType, Session } from '../../types';

export default function Dashboard() {
  const [speechType, setSpeechType] = useState<SpeechType>('presentation');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<Session['feedback']>(null);
  const [improvedDraft, setImprovedDraft] = useState('');
  const [visualFeedback, setVisualFeedback] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Speech Type Selection */}
          <div className="lg:col-span-3">
            <SpeechTypeSelector 
              selectedType={speechType}
              onTypeChange={setSpeechType}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-6 space-y-6">
            <RecordingControls
              isRecording={isRecording}
              onRecordingChange={setIsRecording}
              onTranscriptUpdate={setTranscript}
              onFeedbackUpdate={setFeedback}
              onImprovedDraftUpdate={setImprovedDraft}
              onAudioUrlUpdate={setAudioUrl}
              speechType={speechType}
              showCamera={showCamera}
              onCameraToggle={() => setShowCamera(!showCamera)}
            />

            <TranscriptDisplay 
              transcript={transcript}
              isRecording={isRecording}
            />

            {improvedDraft && (
              <AudioPlayback 
                audioUrl={audioUrl}
                improvedDraft={improvedDraft}
              />
            )}
          </div>

          {/* Right Sidebar - Feedback */}
          <div className="lg:col-span-3">
            <FeedbackPanel 
              feedback={feedback}
              visualFeedback={visualFeedback}
            />
          </div>
        </div>

        {/* Camera Feed - Bottom Section */}
        {showCamera && (
          <div className="mt-6">
            <CameraFeed 
              isActive={showCamera}
              onVisualFeedbackUpdate={setVisualFeedback}
            />
          </div>
        )}
      </div>
    </div>
  );
}

