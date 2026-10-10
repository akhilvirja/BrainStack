import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Video, FileText, FileBox, Music, Link as LinkIcon, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { contentService } from '../../services/content.service';
import type { CreateContentPayload } from '../../services/content.service';

type ContentType = 'article' | 'video' | 'image' | 'audio';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContentModal = ({ isOpen, onClose }: AddContentModalProps) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<ContentType>('article');
  
  // simple form state
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
    tags: '', // stored as comma-separated string for now
  });

  const mutation = useMutation({
    mutationFn: (data: CreateContentPayload) => contentService.createContent(data),
    onSuccess: () => {
      toast.success('Added to your stack!');
      // refresh the dashboard instantly
      queryClient.invalidateQueries({ queryKey: ['content'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save content');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // clean up tags, ignoring empty strings
    const parsedTags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    mutation.mutate({
      title: formData.title,
      link: formData.link,
      description: formData.description,
      type,
      tags: [], 
    });
  };

  const handleClose = () => {
    setFormData({ title: '', link: '', description: '', tags: '' });
    setType('article');
    onClose();
  };

  if (!isOpen) return null;

  const typeOptions = [
    { id: 'article', label: 'Note', icon: <FileText size={16} /> },
    { id: 'video', label: 'Video', icon: <Video size={16} /> },
    { id: 'image', label: 'Image', icon: <FileBox size={16} /> },
    { id: 'audio', label: 'Audio', icon: <Music size={16} /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl border border-warm-stone overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-stone">
          <h2 className="font-headline font-bold text-lg text-charcoal">Add Content</h2>
          <button 
            onClick={handleClose}
            className="p-1 text-outline hover:text-charcoal hover:bg-surface-container rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          
          {/* type selector */}
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl border border-stone-border">
            {typeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${
                  type === opt.id 
                    ? 'bg-white text-sage-dark shadow-sm' 
                    : 'text-on-surface-variant hover:text-charcoal'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>

          <Input
            label="Title"
            placeholder="e.g., React Server Components Guide"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
            autoFocus
          />

          <Input
            label="URL Link"
            placeholder="https://..."
            icon={<LinkIcon size={16} />}
            value={formData.link}
            onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-headline text-xs font-semibold text-on-surface">Description (optional)</label>
            <textarea
              className="w-full p-3 rounded-xl bg-linen border border-stone-border text-charcoal text-sm focus:bg-white focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage resize-none"
              rows={3}
              placeholder="Brief summary or personal notes..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <Input
            label="Tags (optional)"
            placeholder="ux, react, design"
            icon={<Hash size={16} />}
            hint="Comma separated"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          />

          <div className="pt-2">
            <Button 
              type="submit" 
              fullWidth 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save to Stack'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
