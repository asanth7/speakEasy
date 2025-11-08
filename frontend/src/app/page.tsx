import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      {/* Background Image - Full Screen */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/computer-bg.jpeg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-white/10"></div>
      </div>

      {/* Navigation - Overlaid on Image */}
      <nav className="absolute top-0 left-0 w-full z-20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Brand */}
            <div className="flex items-center">
              <span className="text-2xl font-semibold text-white">SpeakEasy</span>
            </div>
            
            {/* Center: Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-white hover:text-gray-200 transition-colors">
                Product
              </Link>
              <Link href="/dashboard" className="text-white hover:text-gray-200 transition-colors">
                Solutions
              </Link>
              <Link href="/dashboard" className="text-white hover:text-gray-200 transition-colors">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-white hover:text-gray-200 transition-colors">
                Resources
              </Link>
            </div>
            
            {/* Right: Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="text-white border-white hover:bg-white/20 bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <div className="relative flex items-start justify-center min-h-screen pt-32 pb-20">

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Find Your Calm in the{' '}
              <span className="italic">Complexity</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              Our platform handles the intricate data and workflows so you can stop firefighting and start focusing on what matters.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-slate-900 text-white hover:bg-slate-800 text-base px-8 py-6 rounded-lg min-w-[200px]"
                >
                  Book a Free Demo
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/90 border-slate-300 text-slate-900 hover:bg-white text-base px-8 py-6 rounded-lg min-w-[200px]"
                >
                  Watch Overview
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm border-t border-slate-200 py-12">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-600 text-sm font-medium mb-8">
            Trusted By Teams At
          </p>
          
          {/* Company Logos - Using placeholder text for now */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="text-slate-400 font-semibold text-lg">Loom</div>
            <div className="text-slate-400 font-semibold text-lg">Segment</div>
            <div className="text-slate-400 font-semibold text-lg">Notion</div>
            <div className="text-slate-400 font-semibold text-lg">Stripe</div>
            <div className="text-slate-400 font-semibold text-lg">Discord</div>
          </div>
        </div>
      </div>
    </div>
  );
}
