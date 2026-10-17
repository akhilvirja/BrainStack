import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  X,
  Video,
  Globe,
  Hash,
  FileCode,
  Link as LinkIcon,
  Plus,
  Check,
  Loader2,
  Tags,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { contentService } from '../../services/content.service';
import type { CreateContentPayload } from '../../services/content.service';
import { tagService } from '../../services/tag.service';

export type SourceType = 'web' | 'youtube' | 'twitter' | 'google_docs';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState<SourceType>('web');

  // form state
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    description: '',
  });

  // Selected tags array (stored as lowercase strings without #)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Input for adding new tag inline
  const [newTagInput, setNewTagInput] = useState('');

  // Fetch all user tags
  const { data: userTags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagService.getAllTags(),
    enabled: isOpen,
  });

  // Create Tag Mutation
  const createTagMutation = useMutation({
    mutationFn: (title: string) => tagService.createTag(title),
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      const clean = newTag.title.replace(/^#/, '').trim().toLowerCase();
      if (!selectedTags.includes(clean)) {
        setSelectedTags((prev) => [...prev, clean]);
      }
      setNewTagInput('');
      toast.success(`Tag #${clean} added!`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to create tag');
    },
  });

  // Create Content Mutation
  const contentMutation = useMutation({
    mutationFn: (data: CreateContentPayload) => contentService.createContent(data),
    onSuccess: (res: any) => {
      const msg = res?.meta?.message || 'Added to workspace! Extraction & AI indexing in progress...';
      toast.success(msg, { duration: 4500 });
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      handleClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.response?.data?.message || err.message;
      toast.error(msg || 'Failed to save source');
    },
  });

  const handleToggleTag = (tagTitle: string) => {
    const clean = tagTitle.replace(/^#/, '').trim().toLowerCase();
    setSelectedTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]
    );
  };

  const handleAddNewTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;

    // Check if tag already exists in userTags
    const existing = userTags.find((t) => t.title.toLowerCase() === clean);
    if (existing) {
      if (!selectedTags.includes(clean)) {
        setSelectedTags((prev) => [...prev, clean]);
      }
      setNewTagInput('');
      return;
    }

    createTagMutation.mutate(clean);
  };

  // URL auto-detection for source type
  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, link: val }));

    const lower = val.toLowerCase().trim();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
      setType('youtube');
    } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
      setType('twitter');
    } else if (lower.includes('docs.google.com')) {
      setType('google_docs');
    } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
      setType('web');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    contentMutation.mutate({
      title: formData.title,
      link: formData.link,
      sourceUrl: formData.link,
      sourceType: type,
      type,
      description: formData.description,
      tags: selectedTags,
    });
  };

  const handleClose = () => {
    setFormData({ title: '', link: '', description: '' });
    setSelectedTags([]);
    setNewTagInput('');
    setType('web');
    onClose();
  };

  if (!isOpen) return null;

  const typeOptions = [
    { id: 'web', label: 'Web Article', icon: <Globe size={15} /> },
    { id: 'youtube', label: 'YouTube', icon: <Video size={15} /> },
    { id: 'twitter', label: 'X / Twitter', icon: <Hash size={15} /> },
    { id: 'google_docs', label: 'Google Doc', icon: <FileCode size={15} /> },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-xl border border-warm-stone overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-stone shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#edf3f0] text-primary flex items-center justify-center">
              <Sparkles size={16} />
            </span>
            <h2 className="font-headline font-bold text-lg text-charcoal">Add Source to Stack</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-outline hover:text-charcoal hover:bg-surface-container rounded-md transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">

          {/* Source Type Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              Source Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-surface-container-low rounded-xl border border-stone-border">
              {typeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`py-1.5 px-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${type === opt.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-charcoal'
                    }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Source URL"
            placeholder="https://..."
            icon={<LinkIcon size={16} />}
            value={formData.link}
            onChange={handleLinkChange}
            required
            autoFocus
          />

          <Input
            label="Title"
            placeholder="e.g., Designing Scalable Multi-Tenant Architectures"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="font-headline text-xs font-semibold text-on-surface">Personal Synthesis or Notes (optional)</label>
            <textarea
              className="w-full p-3 rounded-xl bg-linen border border-stone-border text-charcoal text-sm focus:bg-white focus:outline-none focus:border-[#a8cfbd] focus:ring-1 focus:ring-[#3f6355] resize-none"
              rows={2}
              placeholder="Key insights, quotes, or takeaways from this source..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Tags Section */}
          <div className="flex flex-col gap-2 pt-1 border-t border-warm-stone">
            <div className="flex items-center justify-between">
              <label className="font-headline text-xs font-semibold text-on-surface flex items-center gap-1.5">
                <Tags size={14} className="text-primary" />
                <span>Tags & Taxonomy</span>
              </label>
              <span className="text-[11px] font-medium text-on-surface-variant">
                {selectedTags.length > 0 ? (
                  <span className="text-primary font-semibold">{selectedTags.length} selected</span>
                ) : (
                  'Select or create tags'
                )}
              </span>
            </div>

            {/* Inline create tag form */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <span className="absolute left-2.5 text-outline text-xs font-semibold pointer-events-none">#</span>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                  placeholder="Create or add tag..."
                  className="w-full bg-surface-container-low focus:bg-white text-xs pl-6 pr-3 py-1.5 rounded-lg border border-stone-border focus:border-[#a8cfbd] focus:outline-none focus:ring-1 focus:ring-[#3f6355] transition-all placeholder:text-outline"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddNewTag()}
                disabled={!newTagInput.trim() || createTagMutation.isPending}
                className="px-2.5 py-1.5 bg-[#edf3f0] hover:bg-[#dfebe4] text-primary rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {createTagMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
                <span>Add</span>
              </button>
            </div>

            {/* User Tags Selector Cloud */}
            <div className="bg-surface-container-lowest/60 border border-stone-border/80 rounded-xl p-2.5 max-h-36 overflow-y-auto">
              {isLoadingTags ? (
                <div className="flex items-center justify-center py-3 text-outline gap-1.5 text-xs">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>Loading tags...</span>
                </div>
              ) : userTags.length === 0 ? (
                <p className="text-[11px] text-outline italic text-center py-2">
                  No tags yet. Type a name above and click Add to create one!
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {userTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.title.toLowerCase());
                    return (
                      <button
                        key={tag._id}
                        type="button"
                        onClick={() => handleToggleTag(tag.title)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${isSelected
                          ? 'bg-primary text-white border-primary shadow-2xs font-semibold'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-charcoal border-stone-border hover:bg-surface-container'
                          }`}
                      >
                        {isSelected ? (
                          <Check size={11} className="stroke-3" />
                        ) : (
                          <span className="text-outline">#</span>
                        )}
                        <span>{tag.title}</span>
                        {typeof tag.count === 'number' && tag.count > 0 && (
                          <span className={`text-[10px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-white text-outline border border-stone-border'
                            }`}>
                            {tag.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Tags Preview Pill List */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-semibold text-outline mr-1">Attached:</span>
                {selectedTags.map((tagTitle) => (
                  <span
                    key={tagTitle}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-fixed/60 text-spruce text-[11px] font-semibold"
                  >
                    <span>#{tagTitle}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTag(tagTitle)}
                      className="hover:text-error cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              disabled={contentMutation.isPending}
            >
              {contentMutation.isPending ? 'Saving to Stack...' : 'Save Source to Stack'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
