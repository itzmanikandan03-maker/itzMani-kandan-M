import React from 'react';
import { useAndroid } from '../context/AndroidContext';
import AndroidStatusBar from './AndroidStatusBar';
import AndroidSystemBar from './AndroidSystemBar';
import { Smartphone, Monitor } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({ children }) => {
  const { deviceFrameEnabled, setDeviceFrameEnabled, openInstallModal } = useAndroid();
  const haptics = useHaptics();

  // If frame is disabled, render standard layout directly
  if (!deviceFrameEnabled) {
    return (
      <div className="relative w-full h-full min-h-screen flex flex-col bg-slate-900 text-slate-100">
        {/* Top desktop Android Mode Banner */}
        <div className="hidden lg:flex items-center justify-between px-4 py-1.5 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">PocketSmart Android Edition</span>
            <span className="text-slate-500">|</span>
            <span>PWA & Native APK Ready</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                haptics.light();
                openInstallModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install Android App</span>
            </button>

            <button
              onClick={() => {
                haptics.medium();
                setDeviceFrameEnabled(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Android Phone Simulator</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 w-full">
          {children}
        </div>
      </div>
    );
  }

  // Device Frame View: Google Pixel 8 Pro mockup centered on screen
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-6 text-slate-100 select-none overflow-hidden relative">
      {/* Background glow ambient effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Frame Top Controls */}
      <header className="w-full max-w-md flex items-center justify-between mb-3 px-2 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-white">Google Pixel 8 — Android 14</h1>
            <p className="text-[10px] text-slate-400">PocketSmart AI Native Standalone</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              haptics.light();
              openInstallModal();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium shadow-sm transition"
          >
            <span>Install APK</span>
          </button>

          <button
            onClick={() => {
              haptics.medium();
              setDeviceFrameEnabled(false);
            }}
            title="Switch to Fullscreen Responsive View"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
          >
            <Monitor className="w-3 h-3" />
            <span className="hidden sm:inline">Desktop View</span>
          </button>
        </div>
      </header>

      {/* Android Device Outer Chassis */}
      <div className="relative w-full max-w-[412px] h-[860px] max-h-[92vh] bg-slate-900 border-8 border-slate-800 rounded-[48px] shadow-2xl shadow-black/80 flex flex-col overflow-hidden ring-1 ring-white/10 z-10">
        {/* Speaker ear piece */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 rounded-full z-40" />

        {/* Status Bar */}
        <AndroidStatusBar />

        {/* Screen Viewport with inner app content */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden relative">
          {children}
        </div>

        {/* Android 3-Button Navigation Bar */}
        <AndroidSystemBar />
      </div>
    </div>
  );
};

export default AndroidDeviceFrame;
