import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-slate-500 py-8">
      <Loader2 className={`${sizeMap[size]} animate-spin text-emerald-600`} />
      {message && <p className="text-xs font-medium text-slate-600 tracking-wide">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl border border-slate-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
