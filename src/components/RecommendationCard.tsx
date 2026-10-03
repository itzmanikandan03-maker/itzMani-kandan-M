import React from 'react';
import { AlertCircle, AlertTriangle, Check, Info, Sparkles } from 'lucide-react';
import { RecommendationItem } from '../services/recommendationService';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  onMarkRead?: (id: number) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onMarkRead }) => {
  const isHigh = recommendation.priority === 'high';
  const isMedium = recommendation.priority === 'medium';

  const badgeStyles = isHigh
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : isMedium
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  const PriorityIcon = isHigh ? AlertCircle : isMedium ? AlertTriangle : recommendation.type === 'positive_behavior' ? Sparkles : Info;

  return (
    <div className={`p-4 rounded-lg border transition-all ${
      recommendation.is_read
        ? 'bg-slate-50/60 border-slate-200 text-slate-600'
        : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={`p-1.5 rounded mt-0.5 border ${badgeStyles}`}>
            <PriorityIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`text-xs font-semibold ${recommendation.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                {recommendation.title}
              </h4>
              <span className="text-[10px] text-slate-400 capitalize">
                · {recommendation.priority} priority
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{recommendation.message}</p>
          </div>
        </div>

        {!recommendation.is_read && onMarkRead && (
          <button
            onClick={() => onMarkRead(recommendation.id)}
            className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;
