export type SpeechType = 'public-forum' | 'policy-debate' | 'presentation' | 'ceremony' | 'ted-talk';

export interface Session {
  id: string;
  speechType: SpeechType;
  transcript: string;
  feedback: {
    clarity: number;
    structure: number;
    fillerWords: string[];
    suggestions: string[];
  } | null;
  improvedDraft: string;
  visualFeedback: string[];
  timestamp: Date;
  duration: number;
  wordCount: number;
}

