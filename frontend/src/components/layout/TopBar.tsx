import { useState } from 'react';
import { Button } from '../ui/Button';
import { Share, Plus, BrainCircuit } from 'lucide-react';
import { AddContentModal } from '../content/AddContentModal';

export const TopBar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-md border-b border-warm-stone z-30 flex items-center justify-between px-8">
        {/* Title Area */}
        <div className="flex items-center gap-2.5">
          <BrainCircuit size={20} className="text-sage-dark" />
          <span className="font-headline font-semibold text-base text-charcoal">Workspace</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Share size={16} />}
          >
            Share Stack
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={<Plus size={16} strokeWidth={2.5} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Content
          </Button>
        </div>
      </header>

      <AddContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};
