import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, SignalHigh } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950 text-slate-200 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs font-semibold select-none z-30 shrink-0 border-b border-slate-800/40">
      {/* Time */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] tracking-tight font-mono">{time || '09:41'}</span>
        {/* Subtle dot for notification */}
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Front camera punch hole cutout for Pixel 8 style */}
      <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shrink-0" />

      {/* Status icons: 5G, WiFi, Battery */}
      <div className="flex items-center gap-2 text-[10px] text-slate-300">
        <span className="font-mono text-[9px] font-bold text-slate-400">5G</span>
        <SignalHigh className="w-3 h-3 text-slate-300" />
        <Wifi className="w-3 h-3 text-slate-300" />
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-mono">98%</span>
          <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};

export default AndroidStatusBar;
