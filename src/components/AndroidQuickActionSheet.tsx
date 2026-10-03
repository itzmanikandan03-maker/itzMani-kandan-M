import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, ArrowDownLeft, Bot, Camera, Share2, X, Sparkles } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface AndroidQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddExpense: () => void;
  onOpenAddIncome: () => void;
}

export const AndroidQuickActionSheet: React.FC<AndroidQuickActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenAddExpense,
  onOpenAddIncome,
}) => {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReceiptScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      haptics.success();
      onClose();
      // Open add expense with image file info
      onOpenAddExpense();
    }
  };

  const handleShareApp = async () => {
    haptics.medium();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PocketSmart AI — Personal Budget Assistant',
          text: 'Manage income, track expenses, smart budgeting, and get AI financial advice on PocketSmart AI!',
          url: window.location.origin,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard?.writeText(window.location.origin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-xs md:hidden animate-fade-in">
      <div
        className="fixed inset-0"
        onClick={() => {
          haptics.light();
          onClose();
        }}
      />
      <div className="relative w-full max-w-md bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 text-slate-100 shadow-2xl z-10 animate-slide-up pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {/* Android bottom sheet pull handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white tracking-wide">Quick Action</span>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Add Expense */}
          <button
            onClick={() => {
              haptics.medium();
              onClose();
              onOpenAddExpense();
            }}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-97 transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-semibold text-xs text-white">Add Expense</span>
            <span className="text-[10px] text-slate-400">Record a spend or bill</span>
          </button>

          {/* Add Income */}
          <button
            onClick={() => {
              haptics.medium();
              onClose();
              onOpenAddIncome();
            }}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-97 transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="font-semibold text-xs text-white">Add Income</span>
            <span className="text-[10px] text-slate-400">Salary, deposit or bonus</span>
          </button>

          {/* Ask AI Assistant */}
          <button
            onClick={() => {
              haptics.medium();
              onClose();
              navigate('/assistant');
            }}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-97 transition text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-2">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold text-xs text-white">Ask PocketSmart AI</span>
            <span className="text-[10px] text-slate-400">Personal finance advice</span>
          </button>

          {/* Camera Receipt Attachment */}
          <button
            onClick={() => {
              haptics.medium();
              fileInputRef.current?.click();
            }}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-97 transition text-left relative"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-semibold text-xs text-white">Camera Receipt</span>
            <span className="text-[10px] text-slate-400">Snap photo to log expense</span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleReceiptScan}
            />
          </button>
        </div>

        {/* Native Android Share */}
        <button
          onClick={handleShareApp}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-xs font-medium text-slate-300 flex items-center justify-center gap-2 active:scale-98 transition"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          Share PocketSmart via Android Share Sheet
        </button>
      </div>
    </div>
  );
};

export default AndroidQuickActionSheet;
