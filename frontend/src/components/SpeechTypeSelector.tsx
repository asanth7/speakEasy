import { Users, Scale, BookOpen, Trophy, Presentation } from 'lucide-react';
import { SpeechType } from '../App';

interface SpeechTypeSelectorProps {
  selectedType: SpeechType;
  onTypeChange: (type: SpeechType) => void;
}

const speechTypes = [
  {
    id: 'public-forum' as SpeechType,
    label: 'Public Forum Debate',
    icon: Users,
    description: 'Accessible debate format focusing on current events'
  },
  {
    id: 'policy-debate' as SpeechType,
    label: 'Policy Debate',
    icon: Scale,
    description: 'In-depth analysis of policy proposals'
  },
  {
    id: 'presentation' as SpeechType,
    label: 'Class Presentation',
    icon: BookOpen,
    description: 'Educational presentations and lectures'
  },
  {
    id: 'ceremony' as SpeechType,
    label: 'Ceremony Speech',
    icon: Trophy,
    description: 'Formal speeches for special occasions'
  },
  {
    id: 'ted-talk' as SpeechType,
    label: 'TED Talk Style',
    icon: Presentation,
    description: 'Engaging, story-driven presentations'
  }
];

export function SpeechTypeSelector({ selectedType, onTypeChange }: SpeechTypeSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h2 className="text-slate-900 mb-4">Speech Type</h2>
      
      <div className="space-y-2">
        {speechTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500'
                  : 'bg-slate-50 border-2 border-transparent hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-blue-500' : 'bg-slate-200'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${
                    isSelected ? 'text-blue-900' : 'text-slate-900'
                  }`}>
                    {type.label}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
