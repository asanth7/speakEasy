import { FileText, Loader2 } from 'lucide-react';

interface TranscriptDisplayProps {
  transcript: string;
  isRecording: boolean;
}

export function TranscriptDisplay({ transcript, isRecording }: TranscriptDisplayProps) {
  if (!transcript && !isRecording) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-slate-900 mb-2">No Transcript Yet</h3>
          <p className="text-sm text-slate-500 max-w-md">
            Start recording to see your speech transcribed in real-time. 
            The AI will analyze your content and provide feedback.
          </p>
        </div>
      </div>
    );
  }

  const wordCount = transcript.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedTime = Math.ceil(wordCount / 130); // 130 words per minute average

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h3 className="text-slate-900">Live Transcript</h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="text-slate-600">
              <span className="text-slate-900">{wordCount}</span> words
            </div>
            <div className="text-slate-600">
              ~<span className="text-slate-900">{estimatedTime}</span> min
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {transcript}
            {isRecording && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
