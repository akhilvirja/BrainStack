import React, { useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, Loader2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#fee4e2] border border-[#fecdca] text-[#d92d20] flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#fff8e6] border border-[#f5e1a4] text-[#b28400] flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-[#c4ebd9]/60 border border-[#a3d9c1] text-spruce flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#d92d20] hover:bg-[#b42318] text-white shadow-xs focus:ring-[#d92d20]/20';
      case 'warning':
        return 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-xs focus:ring-[#d97706]/20';
      default:
        return 'bg-primary hover:bg-[#345246] text-white shadow-xs focus:ring-primary/20';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-md bg-white border border-stone-border rounded-2xl shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          {renderIcon()}

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 id="confirm-modal-title" className="font-headline font-bold text-base text-charcoal">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="text-outline hover:text-charcoal p-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white hover:bg-surface-container-low border border-stone-border text-charcoal text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${getConfirmButtonClass()}`}
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
