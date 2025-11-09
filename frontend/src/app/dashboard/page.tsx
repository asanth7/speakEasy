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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [selectedSpeech, setSelectedSpeech] = useState<string | null>(null);
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
          
          // Create URL for playback immediately
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
          
          // Show dashboard immediately with audio playback
          setHasRecording(true);
          
          // Send to backend API for saving and transcription
          setIsTranscribing(true);
          const formData = new FormData();
          formData.append('audio', wavBlob, 'recording.wav');
          
          try {
            const response = await fetch('http://localhost:5000/api/upload-audio', {
              method: 'POST',
              body: formData,
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('WAV file saved:', result.message);
              
              // Update filename, transcript, and feedback
              setAudioFilename(result.filename);
              setTranscript(result.transcript || null);
              setFeedback(result.feedback || null);
              
              // Show transcription status
              setIsTranscribing(false);
              if (result.feedback) {
                console.log('Feedback received');
              } else if (result.transcript) {
                console.log('Transcript received:', result.transcript);
              } else {
                console.log('No transcript or feedback available');
              }
            } else {
              setIsTranscribing(false);
              const error = await response.json();
              console.error('Error uploading audio:', error);
              // Don't show alert, just log the error - dashboard is already shown
            }
          } catch (fetchError) {
            setIsTranscribing(false);
            console.error('Error uploading audio:', fetchError);
            // Don't show alert, just log the error - dashboard is already shown
          }
        } catch (error) {
          console.error('Error converting to WAV:', error);
          // Even if conversion fails, show dashboard with error message
          setHasRecording(true);
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
    setFeedback(null);
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
      title: 'Public forum',
      description: 'Accessible debate format focusing on current events'
    },
    {
      icon: FileText,
      title: 'Policy debate',
      description: 'In-depth analysis of policy proposals'
    },
    {
      icon: Search,
      title: 'Lincoln-Douglas',
      description: 'One-on-one value-based philosophical debate'
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
              <button
                key={index}
                onClick={() => setSelectedSpeech(speech)}
                className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                  selectedSpeech === speech
                    ? 'bg-[#FFE5E0] text-[#E05038] font-medium'
                    : 'text-[#101010] hover:bg-[#FFFBF0]'
                }`}
              >
                {speech}
              </button>
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
        {selectedSpeech === "Climate change speech" ? (
          /* Climate Change Speech Dashboard */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#101010]">Climate change speech</h1>
                <Button
                  onClick={() => setSelectedSpeech(null)}
                  variant="outline"
                  className="text-[#4A4A4A]"
                >
                  Back
                </Button>
              </div>

              {/* Speech Text */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Speech</h2>
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Climate change is a serious issue that needs to be addressed. We need to take action now, by encouraging our politicians to pursue policies that reduce greenhouse gas emissions and promote sustainable practices.
                </p>
              </div>

              {/* Assessment */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Assessment</h2>
                <div className="space-y-3 text-sm text-[#4A4A4A]">
                  <div>
                    <span className="font-medium text-green-700">Strong:</span> Clear urgency and call to action ("Climate change is a serious issue…We need to take action now"). Good ethos and moral framing.
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Weak:</span> Far too general for policy debate—no plan text, no evidence, no mechanism, no impacts, no solvency, no weighing, no structure.
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Content</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p><span className="font-medium">Claims:</span> Present, but generic ("policies that reduce greenhouse gas emissions and promote sustainable practices").</p>
                  <p><span className="font-medium">Missing:</span> Specific policy mechanism, actor, enforcement, funding; quantified harms/impacts; solvency warrants; inherency/uniqueness (why status quo fails); impact calculus (magnitude/probability/timeframe/reversibility).</p>
                </div>
              </div>

              {/* Structure */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Structure</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p>Lacks signposting and flowable components. No Plan → Advantages → Solvency → Impacts.</p>
                  <p>No internal links from policy mechanism to outcomes.</p>
                  <p className="font-medium">Suggest:</p>
                  <ol className="list-decimal list-inside ml-4 space-y-1">
                    <li>Framing/Harms</li>
                    <li>Plan text</li>
                    <li>Advantage 1 (Climate/Health)</li>
                    <li>Advantage 2 (Economy/Security)</li>
                    <li>Solvency</li>
                    <li>Impact calculus</li>
                    <li>Brief answers to likely DAs</li>
                  </ol>
                </div>
              </div>

              {/* Argumentation */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Argumentation</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p>Unsupported assertions. No evidence or quantification.</p>
                  <p>No comparative claims against alternatives (adaptation, geoengineering, incrementalism).</p>
                  <p>Add warrants (how/why), numbers (GHG cuts, health co-benefits), and credible citations.</p>
                </div>
              </div>

              {/* Grammar & Style */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Grammar & Style</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p>Grammatically correct and concise, but abstract and cliché-heavy.</p>
                  <p>Improve with concrete verbs, signposts, and vivid, specific numbers. Example: Replace "pursue policies that reduce emissions" with "enact an economy-wide carbon fee starting at $50/ton with a border adjustment to cut emissions 40% by 2035."</p>
                </div>
              </div>

              {/* Tight upgrade */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Tight upgrade (affirmative skeleton, flowable)</h2>
                <div className="space-y-4 text-sm text-[#4A4A4A]">
                  <div>
                    <p className="font-medium mb-2">Resolutional framing:</p>
                    <p>The USFG should adopt an economy-wide carbon price to rapidly reduce GHG emissions.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Plan (example):</p>
                    <p>The United States federal government should enact a carbon fee starting at $50 per metric ton of CO2e in 2026, increasing $10 annually, paired with a border carbon adjustment. 70% of revenue is rebated per capita; 30% funds transmission, storage, industrial decarbonization, and methane abatement. Implementation by Treasury and EPA; enforcement via IRS and Customs.</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Advantage 1—Climate + Health</p>
                    <p className="ml-4"><span className="font-medium">Tag:</span> Prevents catastrophic warming and saves lives. IPCC AR6 (2023) finds deep cuts this decade are required for 1.5–2°C; NCA5 (2023) projects escalating US damages without faster mitigation. Health co-benefits from PM2.5 reductions avert tens of thousands of US deaths annually (Shindell et al., PNAS 2018).</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Advantage 2—Competitiveness + Energy Security</p>
                    <p className="ml-4"><span className="font-medium">Tag:</span> Carbon price + border adjustment spurs clean tech, protects industry, and reduces import emissions leakage (Nordhaus, PNAS 2015; Bayer & Aklin, PNAS 2020 on policy-driven EU ETS cuts).</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Solvency</p>
                    <p className="ml-4"><span className="font-medium">Tag:</span> Carbon pricing works. Cross-national analyses show carbon pricing reduces CO2 1–2% per year on average (Rafaty, Dolphin & Pretis, Nat. Clim. Change 2020). British Columbia's tax cut fuel use and emissions with limited GDP impact (Murray & Rivers, Energy Policy 2015). EU ETS cut covered emissions and drove low-carbon innovation (Calel & Dechezleprêtre, Rev. Econ. Stat. 2016; Bayer & Aklin, PNAS 2020).</p>
                  </div>
                  <div>
                    <p className="font-medium mb-2">Impact calculus</p>
                    <ul className="ml-4 space-y-1 list-disc list-inside">
                      <li><span className="font-medium">Magnitude:</span> Trillions in damages (Hsiang et al., Science 2017). Mortality effects substantial (Carleton et al., QJE 2020).</li>
                      <li><span className="font-medium">Probability:</span> High per IPCC AR6; near-term methane cuts amplify benefits (Ocko et al., ERL 2021).</li>
                      <li><span className="font-medium">Timeframe:</span> Early action avoids lock-in; co-benefits immediate via cleaner air.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* What to say in the round */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">What to say in the round (concise script)</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p><span className="font-medium">Harms:</span> "US on track to miss 1.5–2°C pathways; rising extremes, mortality, and GDP losses are already observed."</p>
                  <p><span className="font-medium">Plan:</span> "Pass a rising carbon fee with border adjustment; rebate most revenue; invest rest in grid and industry."</p>
                  <p><span className="font-medium">Solvency:</span> "Pricing changes behavior and investment; robust empirical record."</p>
                  <p><span className="font-medium">Impacts:</span> "Cuts emissions fast, saves lives now via cleaner air, and secures US competitiveness."</p>
                  <p><span className="font-medium">Weigh:</span> "High magnitude, high probability, irreversible tipping risks—prefer mitigation now."</p>
                </div>
              </div>

              {/* Likely negative hits */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Likely negative hits and quick answers</h2>
                <div className="space-y-3 text-sm text-[#4A4A4A]">
                  <div>
                    <p className="font-medium">Topicality/Vagueness:</p>
                    <p className="ml-4">"Original speech lacked a plan." <span className="font-medium">Answer:</span> Present the precise plan text above; clarify agent, enforcement, funding.</p>
                  </div>
                  <div>
                    <p className="font-medium">Solvency deficit:</p>
                    <p className="ml-4">"Carbon pricing too weak/slow." <span className="font-medium">Answer:</span> Rising price + BCA + investment tranche; cite cross-national reductions and EU ETS results; permutation with sectoral rules if needed.</p>
                  </div>
                  <div>
                    <p className="font-medium">Econ/Jobs DA:</p>
                    <p className="ml-4">"Costs, recession, regressive." <span className="font-medium">Answer:</span> Dividend offsets regressivity; macro effects modest; clean-tech job growth; SCC ~ $185/ton (Rennert et al., Nature 2022) shows benefits exceed costs.</p>
                  </div>
                  <div>
                    <p className="font-medium">Leakage/Free rider:</p>
                    <p className="ml-4">"US action futile." <span className="font-medium">Answer:</span> Border adjustment internalizes imports; climate clubs raise global coverage (Nordhaus 2015).</p>
                  </div>
                  <div>
                    <p className="font-medium">Reliability/Blackouts:</p>
                    <p className="ml-4">"Clean transition threatens grid." <span className="font-medium">Answer:</span> Revenue funds transmission and storage; NREL studies show reliable high-renewable grids with adequate transmission/storage and firm low-carbon resources.</p>
                  </div>
                  <div>
                    <p className="font-medium">Politics DA:</p>
                    <p className="ml-4">"Unpopular; midterms risk." <span className="font-medium">Answer:</span> Broad voter support for rebates and domestic industry protection; divided-government politics DA is low uniqueness/low link—plus bipartisan interest in BCAs.</p>
                  </div>
                  <div>
                    <p className="font-medium">Adaptation CP:</p>
                    <p className="ml-4">"Adapt instead." <span className="font-medium">Answer:</span> Mitigation reduces need and cost of adaptation; adaptation alone can't manage tail risks or ocean acidification.</p>
                  </div>
                  <div>
                    <p className="font-medium">EJ critique:</p>
                    <p className="ml-4">"Pricing can create hotspots." <span className="font-medium">Answer:</span> Include co-pollutant monitoring, targeted investments in fence-line communities, and methane rules; evidence of health co-benefits concentrated in high-exposure areas.</p>
                  </div>
                </div>
              </div>

              {/* Concrete stylistic tweaks */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Concrete stylistic tweaks</h2>
                <ul className="space-y-1 text-sm text-[#4A4A4A] list-disc list-inside ml-4">
                  <li>Add signposting ("Contention 1: Harms… Contention 2: Plan…").</li>
                  <li>Use numbers and citations in taglines.</li>
                  <li>End with a clear voting issue: "Vote aff to prevent irreversible harms and secure immediate health and economic benefits."</li>
                </ul>
              </div>

              {/* Potential alternative plan options */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">Potential alternative plan options (pick one and build evidence)</h2>
                <div className="space-y-2 text-sm text-[#4A4A4A]">
                  <p><span className="font-medium">Clean Electricity Standard:</span> 80–100% clean power by 2035 with credits for firm low-carbon (nuclear, CCS). Pair with transmission permitting and capacity markets.</p>
                  <p><span className="font-medium">Methane package:</span> Rapid oil/gas methane controls + LDAR + plugging orphan wells for near-term warming benefits.</p>
                </div>
              </div>

              {/* High-quality sources */}
              <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-[#101010] mb-4">High-quality sources to strengthen the case</h2>
                <ul className="space-y-1 text-sm text-[#4A4A4A] list-disc list-inside ml-4">
                  <li>IPCC AR6 Synthesis Report (2023) — State of climate risks and mitigation pathways.</li>
                  <li>US Fifth National Climate Assessment (2023) — US-specific impacts and sectoral risks.</li>
                  <li>Global Carbon Budget (Global Carbon Project, 2023) — Emissions trends and remaining carbon budget.</li>
                  <li>National Academies: Accelerating Decarbonization in the U.S. Energy System (2021) and subsequent 2023 research agenda — Feasible pathways, policy toolkit.</li>
                  <li>Rafaty, Dolphin & Pretis (2020), Nature Climate Change — Empirical evidence that carbon pricing cuts emissions.</li>
                  <li>Murray & Rivers (2015), Energy Policy — British Columbia carbon tax outcomes and design.</li>
                  <li>Bayer & Aklin (2020), PNAS — EU ETS reduced emissions despite low prices.</li>
                  <li>Calel & Dechezleprêtre (2016), Review of Economics and Statistics — EU ETS induced low-carbon innovation.</li>
                  <li>Hsiang et al. (2017), Science — US economic damages from warming.</li>
                  <li>Carleton et al. (2020), QJE — Global mortality consequences of climate change.</li>
                  <li>Rennert et al. (2022), Nature — Updated, higher social cost of carbon (~$185/ton).</li>
                  <li>Ocko et al. (2021), Environmental Research Letters — Near-term climate payoff of methane and co-pollutant cuts.</li>
                  <li>NREL Storage Futures Study (2021) and high-renewables reliability studies (2021–2023) — Grid reliability with high clean shares.</li>
                  <li>DOE National Transmission Needs Study (2023) — Transmission expansion imperative.</li>
                  <li>Cushing et al. (2018), PNAS — Equity concerns in cap-and-trade; use to preempt EJ critiques and justify safeguards.</li>
                  <li>Nordhaus (2015), PNAS — Climate clubs and border adjustments to overcome free-riding.</li>
                </ul>
              </div>
            </div>
          </div>
        ) : hasRecording ? (
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

                {/* Feedback Widget */}
                <div className="bg-[#FFFBF0] rounded-xl border border-[#E5E4E2] shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-[#101010] mb-4">Feedback</h2>
                  {isTranscribing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#E05038] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-[#4A4A4A]">Analyzing speech and generating feedback...</p>
                    </div>
                  ) : feedback ? (
                    <div className="space-y-2">
                      <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                        {feedback}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#4A4A4A]">Feedback will appear here...</p>
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
                  Choose your debate format
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {projectCards.map((card, index) => {
                    const Icon = card.icon;
                    const isSelected = selectedFormat === card.title;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedFormat(card.title)}
                        className={`bg-[#FFFBF0] rounded-xl p-6 border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#E05038] shadow-md bg-[#FFF8F0]'
                            : 'border-[#E5E4E2] shadow-sm hover:shadow-md hover:border-[#D5D4D2]'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center mb-4 transition-colors ${
                          isSelected
                            ? 'border-[#E05038] bg-[#FFE5E0]'
                            : 'border-[#E5E4E2] bg-transparent'
                        }`}>
                          <Icon className={`w-6 h-6 transition-colors ${
                            isSelected ? 'text-[#E05038]' : 'text-[#4A4A4A]'
                          }`} />
                        </div>
                        <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                          isSelected ? 'text-[#E05038]' : 'text-[#101010]'
                        }`}>{card.title}</h3>
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
