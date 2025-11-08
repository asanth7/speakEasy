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
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-slate-900 mb-6 leading-tight tracking-tight [font-family:var(--font-playfair),serif]">
              Find Your Calm in the{' '}
              <span className="italic">Complexity</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              Our platform handles the intricate data and workflows so you can stop firefighting and start focusing on what matters.
            </p>
          </div>
        </div>

        {/* CTA Button - Positioned inside the monitor screen with curvature warp */}
        <div className="absolute z-10 bottom-[48%] left-1/2 -translate-x-1/2">
          <Link href="/dashboard">
            <div
              style={{
                transform: 'perspective(400px) rotateX(20deg)',
                transformStyle: 'preserve-3d',
                clipPath: 'ellipse(90% 75% at 50% 50%)',
              }}
            >
              <Button 
                size="lg" 
                className="bg-slate-900 text-white hover:bg-slate-800 text-base px-8 py-6 rounded-lg min-w-[200px] shadow-2xl"
                style={{
                  transform: 'scaleY(0.75) scaleX(0.92)',
                  transformOrigin: 'center center',
                  filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5))',
                  borderRadius: '12px',
                }}
              >
                Get Started
              </Button>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
}



