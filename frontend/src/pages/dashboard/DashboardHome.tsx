import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Tag as TagIcon,
  Loader2,
  AlertCircle,
  Inbox,
  Plus,
  Check,
  X
} from 'lucide-react';
import { contentService } from '../../services/content.service';
import { tagService } from '../../services/tag.service';
import { ContentCard } from '../../components/content/ContentCard';
import type { ContentItem } from '../../components/content/ContentCard';
import { AddContentModal } from '../../components/content/AddContentModal';
import { SourceDetailModal } from '../../components/content/SourceDetailModal';

interface DashboardHomeProps {
  filterType?: string;
  pageTitle?: string;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  filterType,
  pageTitle = 'All Notes'
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ContentItem | null>(null);

  const { data: content, isLoading, isError, error } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      return await contentService.getAllContent();
    },
  });

  const { data: userTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      return await tagService.getAllTags();
    },
  });

  const rawItems: ContentItem[] = content || [];

  // Keep selected detail item live-synced with react-query cache updates
  const activeDetailItem = useMemo(() => {
    if (!selectedDetailItem) return null;
    return rawItems.find((i) => i._id === selectedDetailItem._id) || selectedDetailItem;
  }, [rawItems, selectedDetailItem]);

  // Scope items by route filterType (youtube, web, twitter, google_docs)
  const scopedItems = useMemo(() => {
    if (!filterType) return rawItems;
    return rawItems.filter((item) => {
      const itemType = (item.sourceType || item.type || 'web').toLowerCase();
      if (filterType === 'youtube' && itemType !== 'youtube' && itemType !== 'video') return false;
      if (filterType === 'twitter' && itemType !== 'twitter' && itemType !== 'tweet') return false;
      if (filterType === 'google_docs' && itemType !== 'google_docs' && itemType !== 'document') return false;
      if (filterType === 'web' && itemType !== 'web' && itemType !== 'article' && itemType !== 'link' && itemType !== 'bookmark') return false;
      return true;
    });
  }, [rawItems, filterType]);

  // Extract all tags available in the current scoped items and user tags with counts
  const availableTags = useMemo(() => {
    const countsMap = new Map<string, number>();

    // Count tags across scoped items
    scopedItems.forEach((item) => {
      const itemTags = (item.tags || []).map((t) =>
        typeof t === 'string' ? t.replace(/^#/, '').toLowerCase() : t.title?.replace(/^#/, '').toLowerCase()
      ).filter(Boolean);

      const uniqueInItem = new Set(itemTags);
      uniqueInItem.forEach((tag) => {
        if (tag) {
          countsMap.set(tag, (countsMap.get(tag) || 0) + 1);
        }
      });
    });

    // Also include user tags that might have 0 notes in this specific view
    (userTags || []).forEach((t) => {
      const clean = t.title?.replace(/^#/, '').toLowerCase();
      if (clean && !countsMap.has(clean)) {
        countsMap.set(clean, 0);
      }
    });

    // Return sorted by count descending, then alphabetical
    return Array.from(countsMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  }, [scopedItems, userTags]);

  // Filter items matching selected tags
  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) {
      return scopedItems;
    }

    return scopedItems.filter((item) => {
      const itemTags = (item.tags || []).map((t) =>
        typeof t === 'string' ? t.replace(/^#/, '').toLowerCase() : t.title?.replace(/^#/, '').toLowerCase()
      );
      // Matches if note contains any of the selected tags
      return selectedTags.some((selected) => itemTags.includes(selected.toLowerCase()));
    });
  }, [scopedItems, selectedTags]);

  const handleToggleTag = (tagTitle: string) => {
    const clean = tagTitle.toLowerCase();
    setSelectedTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-outline gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="font-headline font-medium text-xs text-on-surface-variant">Loading your knowledge sanctuary...</span>
      </div>
    );
  }

  if (isError) {
    const backendMessage = (error as any)?.response?.data?.meta?.message;
    return (
      <div className="w-full p-6 rounded-2xl bg-[#fee4e2] border border-[#f0c3c1] flex items-start gap-4">
        <AlertCircle className="text-[#d92d20] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-headline font-bold text-[#b42318] text-sm">Failed to load content</h3>
          <p className="text-sm text-[#d92d20] mt-1">{backendMessage || error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header Row with Title and Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-charcoal-text tracking-tight">
            {pageTitle}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#c4ebd9]/70 text-spruce text-xs font-semibold">
            {filteredItems.length} items
          </span>
        </div>
      </div>

      {/* Modern Tag Filter Bar */}
      {availableTags.length > 0 && (
        <div className="bg-white border border-stone-border rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
              <TagIcon size={15} className="text-primary" />
              <span>Filter by Tags</span>
              {selectedTags.length > 0 && (
                <span className="text-[11px] font-normal text-on-surface-variant">
                  ({selectedTags.length} active)
                </span>
              )}
            </div>

            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs text-primary hover:text-[#2d473d] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <X size={12} />
                <span>Reset filter</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* 'All' Chip */}
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${selectedTags.length === 0
                ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                : 'bg-surface-container-low text-on-surface-variant hover:text-charcoal border-stone-border hover:bg-surface-container'
                }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedTags.length === 0
                ? 'bg-white/25 text-white font-bold'
                : 'bg-white text-outline border border-stone-border'
                }`}>
                {scopedItems.length}
              </span>
            </button>

            {/* Individual Tag Chips */}
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.title);
              return (
                <button
                  key={tag.title}
                  type="button"
                  onClick={() => handleToggleTag(tag.title)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${isSelected
                    ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-charcoal border-stone-border hover:bg-surface-container'
                    }`}
                >
                  <span className="flex items-center gap-1">
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                    <span>#{tag.title}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected
                    ? 'bg-white/25 text-white font-bold'
                    : 'bg-white text-outline border border-stone-border'
                    }`}>
                    {tag.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="w-full h-80 flex flex-col items-center justify-center text-center border-2 border-dashed border-warm-stone rounded-2xl bg-surface-container-lowest/50 p-8">
          <div className="w-14 h-14 rounded-2xl bg-[#edf3f0] text-primary flex items-center justify-center mb-3">
            <Inbox size={28} />
          </div>
          <h3 className="font-headline font-bold text-lg text-charcoal">
            {selectedTags.length > 0 ? 'No notes match the selected tags' : 'Your stack is empty'}
          </h3>
          <p className="text-on-surface-variant text-xs mt-1 max-w-sm leading-relaxed">
            {selectedTags.length > 0
              ? `None of your notes match the tags: ${selectedTags.map(t => '#' + t).join(', ')}.`
              : 'Start building your digital sanctuary by saving articles, tweets, videos, and research notes.'}
          </p>
          {selectedTags.length > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="mt-4 px-4 py-2 bg-[#edf3f0] hover:bg-[#dfebe4] text-primary rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              <span>Reset Tag Filter</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-primary hover:bg-[#345246] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>Add First Note</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {filteredItems.map((item) => (
            <ContentCard
              key={item._id}
              content={item}
              onOpenDetail={(target) => setSelectedDetailItem(target)}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {filteredItems.length > 0 && (
        <div className="pt-3 pb-8 flex items-center justify-between text-outline text-xs border-t border-stone-border/70 mt-2">
          <span>Showing {filteredItems.length} of {scopedItems.length} items</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded-lg bg-white border border-stone-border text-outline/50 cursor-not-allowed text-xs font-medium"
            >
              Previous
            </button>
            <button
              type="button"
              disabled
              className="px-3 py-1 rounded-lg bg-white border border-stone-border text-outline/50 cursor-not-allowed text-xs font-medium"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Source Detail Modal / Reader Drawer */}
      <SourceDetailModal
        item={activeDetailItem}
        isOpen={Boolean(activeDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        onDeleted={() => setSelectedDetailItem(null)}
      />
    </div>
  );
};
