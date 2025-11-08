import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, Loader2 } from 'lucide-react';

interface CameraFeedProps {
  isActive: boolean;
  onVisualFeedbackUpdate: (feedback: string[]) => void;
}

export function CameraFeed({ isActive, onVisualFeedbackUpdate }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsLoading(false);

        // Simulate visual feedback analysis
        setTimeout(() => {
          onVisualFeedbackUpdate([
            'Maintaining good eye contact',
            'Confident posture detected',
            'Consider using more hand gestures',
            'Facial expressions are engaging',
            'Body language appears relaxed'
          ]);
        }, 3000);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please grant permission and try again.');
        setIsLoading(false);
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, onVisualFeedbackUpdate]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            <h3 className="text-slate-900">Visual Analysis</h3>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Eye className="w-4 h-4" />
            <span>Live monitoring</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <div>
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-300">{error}</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-white">Analyzing body language</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3 text-center">
          AI is monitoring your posture, gestures, facial expressions, and eye contact
        </p>
      </div>
    </div>
  );
}
