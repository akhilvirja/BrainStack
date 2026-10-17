import { useState } from 'react';
import { Share, Plus, Atom, Sparkles } from 'lucide-react';
import { AddContentModal } from '../content/AddContentModal';
import { AskBrainDrawer } from '../ai/AskBrainDrawer';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';

export const TopBar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAskBrainOpen, setIsAskBrainOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Workspace link copied to clipboard!');
    } else {
      toast.success('Stack shared!');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-warm-stone z-30 flex items-center justify-between px-8">
        {/* Workspace Title & Icon */}
        <div className="flex items-center gap-2.5">
          <div className="text-primary flex items-center justify-center">
            <Atom size={20} className="text-primary" />
          </div>
          <span className="font-headline font-semibold text-sm text-charcoal">Brain Stack Workspace</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAskBrainOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#c4ebd9]/70 hover:bg-[#b2e4cc] border border-[#9fd5be] text-spruce font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-spruce" />
            <span>Ask Brain</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-surface-container-low border border-stone-border text-on-surface-variant hover:text-charcoal font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Share size={15} className="text-primary" />
            <span>Share Stack</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-[#345246] text-white font-semibold text-xs rounded-lg shadow-sm shadow-[#3f6355]/20 transition-all group cursor-pointer"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform" />
            <span>Add Content</span>
          </button>

          {/* User Avatar Circle */}
          <div className="w-8 h-8 rounded-full bg-[#edf3f0] border border-[#d6e5de] text-primary flex items-center justify-center font-bold text-xs uppercase ml-1">
            {user?.username?.substring(0, 2) || 'U'}
          </div>
        </div>
      </header>

      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AskBrainDrawer
        isOpen={isAskBrainOpen}
        onClose={() => setIsAskBrainOpen(false)}
      />
    </>
  );
};
