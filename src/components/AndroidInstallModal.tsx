import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, ExternalLink, X, Shield, Zap, Sparkles, Terminal } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const haptics = useHaptics();
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'capacitor'>('pwa');
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    haptics.medium();
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      haptics.success();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                PocketSmart for Android
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Native PWA
                </span>
              </h3>
              <p className="text-xs text-slate-400">Install directly onto your Android device</p>
            </div>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-800/80 rounded-xl my-4 text-xs font-medium">
          <button
            onClick={() => {
              haptics.light();
              setActiveTab('pwa');
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Direct Install (WebAPK)
          </button>
          <button
            onClick={() => {
              haptics.light();
              setActiveTab('apk');
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'apk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chrome Manual Steps
          </button>
          <button
            onClick={() => {
              haptics.light();
              setActiveTab('capacitor');
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              activeTab === 'capacitor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            APK Build / Capacitor
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700/60">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center p-2 shrink-0">
                    <img src="/pwa-192x192.png" alt="PocketSmart" className="w-full h-full object-contain rounded-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">PocketSmart AI — Android App</h4>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Fast, lightweight (under 2 MB), works 100% offline, and seamlessly integrates with Android system navigation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700/60 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Instant Launch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Secure JWT & Local Vault</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Haptic Vibration Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Standalone Fullscreen</span>
                  </div>
                </div>
              </div>

              {isInstalled || installSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-medium text-white">App is already installed!</p>
                    <p className="text-xs text-emerald-400/80">
                      You can launch PocketSmart directly from your Android Home Screen or App Drawer.
                    </p>
                  </div>
                </div>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-sm transition transform active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  Install PocketSmart on this Device
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-slate-300 space-y-2">
                  <p className="font-medium text-white flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    How to install on Android Chrome:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-xs">
                    <li>Open this URL in Google Chrome on your Android phone.</li>
                    <li>Tap the Chrome menu button (three vertical dots ⋮ in top-right).</li>
                    <li>Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</li>
                    <li>Confirm the prompt. Android creates a native WebAPK with home screen icon!</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-semibold text-white text-xs block mb-1">Method 1: Android Chrome Browser</span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  1. Tap the three dots (⋮) in the top-right corner of Google Chrome.<br />
                  2. Select <strong className="text-emerald-400">Install app</strong> or <strong className="text-emerald-400">Add to Home screen</strong>.<br />
                  3. Android's package manager creates a native WebAPK icon that launches in full-screen standalone mode.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-semibold text-white text-xs block mb-1">Method 2: Samsung Internet Browser</span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  1. Tap the download icon in the URL bar, or open the bottom menu (☰).<br />
                  2. Tap <strong className="text-emerald-400">+ Add page to</strong> &gt; <strong className="text-emerald-400">App screen</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="font-semibold text-white text-xs block mb-1">Method 3: Firefox for Android</span>
                <p className="text-slate-400 text-xs leading-relaxed">
                  1. Tap the three dots (⋮) menu.<br />
                  2. Tap <strong className="text-emerald-400">Install</strong> to add PocketSmart to your home screen.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="text-slate-300 text-xs font-medium mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Build Standalone Android APK (.apk / .aab)
                </p>
                <p className="text-slate-400 text-[11px] mb-2">
                  PocketSmart includes a pre-configured <code className="text-emerald-400">capacitor.config.json</code>. You can generate a native Android Studio project and release APK using:
                </p>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 space-y-1">
                  <div>npm run build</div>
                  <div>npx @capacitor/cli add android</div>
                  <div>npx @capacitor/cli open android</div>
                </div>
                <p className="text-slate-400 text-[11px] mt-2">
                  In Android Studio, click <strong className="text-white">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> to generate <code className="text-emerald-400">app-release.apk</code> for sideloading or Google Play Store submission!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Target: Android 8.0+ (API 26+)</span>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidInstallModal;
