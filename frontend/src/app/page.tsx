import Link from 'next/link';
import { Mic, Sparkles, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">SpeakEasy</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI-Powered Public Speaking Assistant
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Perfect Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Presentation</span>
            <br />
            with AI Feedback
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get real-time analysis, personalized feedback, and AI-powered enhancements 
            to elevate your public speaking skills. Practice makes perfect, and we make practice perfect.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Real-time Analysis</h3>
              <p className="text-slate-600">
                Get instant feedback on your speech clarity, structure, and delivery as you practice.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">AI Enhancement</h3>
              <p className="text-slate-600">
                Receive AI-powered suggestions to improve your speech and get an enhanced draft.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Multiple Formats</h3>
              <p className="text-slate-600">
                Practice for presentations, debates, ceremonies, TED talks, and more.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 pt-16 border-t border-slate-200">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">100%</div>
                <div className="text-slate-600">AI-Powered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">Real-time</div>
                <div className="text-slate-600">Feedback</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">Free</div>
                <div className="text-slate-600">To Use</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t border-slate-200">
        <div className="text-center text-slate-600">
          <p>© 2024 SpeakEasy. Perfect your public speaking with AI.</p>
        </div>
      </footer>
    </div>
  );
}
