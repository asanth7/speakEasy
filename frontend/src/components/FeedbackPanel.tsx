import { TrendingUp, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { Session } from '../App';
import { Progress } from './ui/progress';

interface FeedbackPanelProps {
  feedback: Session['feedback'];
  visualFeedback: string[];
}

export function FeedbackPanel({ feedback, visualFeedback }: FeedbackPanelProps) {
  if (!feedback) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          <h3 className="text-slate-900">AI Feedback</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="bg-slate-100 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">
            Complete a recording to receive detailed feedback on your speech
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          <h3 className="text-slate-900">Performance</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Clarity</span>
              <span className="text-slate-900">{feedback.clarity}%</span>
            </div>
            <Progress value={feedback.clarity} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Structure</span>
              <span className="text-slate-900">{feedback.structure}%</span>
            </div>
            <Progress value={feedback.structure} className="h-2" />
          </div>
        </div>

        {feedback.fillerWords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Filler Words Detected:</p>
            <div className="flex flex-wrap gap-2">
              {feedback.fillerWords.map((word, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded"
                >
                  "{word}"
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h3 className="text-slate-900">Suggestions</h3>
        </div>

        <ul className="space-y-3">
          {feedback.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-slate-700">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual Feedback */}
      {visualFeedback.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-purple-600" />
            <h3 className="text-slate-900">Visual Feedback</h3>
          </div>

          <ul className="space-y-3">
            {visualFeedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
