import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Circle, Square } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

export const AndroidSystemBar: React.FC = () => {
  const navigate = useNavigate();
  const haptics = useHaptics();

  return (
    <div className="w-full bg-slate-950 py-1.5 px-10 flex items-center justify-around border-t border-slate-900 shrink-0 text-slate-500">
      {/* Back button */}
      <button
        onClick={() => {
          haptics.light();
          navigate(-1);
        }}
        aria-label="Back"
        className="p-1 hover:text-slate-300 active:scale-90 transition"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2]" />
      </button>

      {/* Home button */}
      <button
        onClick={() => {
          haptics.light();
          navigate('/dashboard');
        }}
        aria-label="Home"
        className="p-1 hover:text-slate-300 active:scale-90 transition"
      >
        <Circle className="w-4 h-4 stroke-[2]" />
      </button>

      {/* Recents button */}
      <button
        onClick={() => {
          haptics.light();
        }}
        aria-label="Recent apps"
        className="p-1 hover:text-slate-300 active:scale-90 transition"
      >
        <Square className="w-3.5 h-3.5 stroke-[2]" />
      </button>
    </div>
  );
};

export default AndroidSystemBar;
