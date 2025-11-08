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

        {/* Transparent Clickable Button - Covers entire monitor screen */}
        <Link 
          href="/dashboard"
          className="absolute z-10 cursor-pointer"
          style={{
            bottom: '35%',
            left: 'calc(50% - 250px)',
            width: '400px',
            height: '300px',
            perspective: '600px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              transform: 'perspective(600px) rotateX(25deg)',
              transformStyle: 'preserve-3d',
              width: '100%',
              height: '100%',
            }}
          >
            <div
              className="w-full h-full bg-transparent"
              style={{
                transform: 'skew(-2deg,-4deg)',
                transformOrigin: 'center center',
                clipPath: 'url(#barrel-curve)',
              }}
            />
          </div>
        </Link>

        {/* Text Element - Absolutely positioned, separate from button */}
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            bottom: '36.5%',
            left: 'calc(50% - 268px)',
            perspective: '600px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            style={{
              transform: 'perspective(600px) rotateX(20deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <clipPath id="barrel-curve" clipPathUnits="objectBoundingBox">
                  <path d="M 0.08 0.18 
                           C 0.08 0.18, 0.25 0.12, 0.5 0.06
                           C 0.75 0.12, 0.92 0.18, 0.92 0.18
                           L 0.92 0.82
                           C 0.92 0.82, 0.75 0.88, 0.5 0.94
                           C 0.25 0.88, 0.08 0.82, 0.08 0.82
                           Z" />
                </clipPath>
              </defs>
            </svg>
            <div
              className="text-2xl font-semibold flex items-center justify-center [font-family:var(--font-geist-mono),monospace]"
              style={{
                width: '400px',
                height: '300px',
                transform: 'skew(-2deg,-4deg)',
                transformOrigin: 'center center',
                clipPath: 'url(#barrel-curve)',
                color: 'rgba(251, 225, 203, 0.7)', // Transparent warm yellowish-orange
                textShadow: `
                  0 0 10px rgba(251, 225, 203, 0.5),
                  0 0 20px rgba(251, 225, 203, 0.3),
                  0 2px 4px rgba(0, 0, 0, 0.3),
                  0 0 0 1px rgba(251, 225, 203, 0.2)
                `,
                backdropFilter: 'blur(1px)',
                WebkitBackdropFilter: 'blur(1px)',
              }}
            >
              Get Started
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}



