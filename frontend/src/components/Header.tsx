import { Mic, MessageSquare, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-slate-900">Public Speaking Assistant</h1>
              <p className="text-sm text-slate-500">Perfect your presentation with AI-powered feedback</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-600">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI Enhancement</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
