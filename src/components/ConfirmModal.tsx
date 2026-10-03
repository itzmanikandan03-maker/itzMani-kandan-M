import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  const haptics = useHaptics();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-100 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDestructive
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={() => {
              haptics.light();
              onCancel();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 my-3 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => {
              haptics.light();
              onCancel();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              haptics.warning();
              onConfirm();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
