import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  Loader2,
  Inbox,
  Check,
  X,
  Filter,
  FileText,
  Video,
  FileCode,
  Link2,
  Hash
} from 'lucide-react';
import { tagService } from '../../services/tag.service';
import type { TagItem } from '../../services/tag.service';
import { contentService } from '../../services/content.service';
import { ContentCard } from '../../components/content/ContentCard';
import type { ContentItem } from '../../components/content/ContentCard';
import { toast } from 'react-hot-toast';

type ContentTypeFilter = 'all' | 'article' | 'video' | 'document' | 'link' | 'tweet';

export const TagsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [newTagTitle, setNewTagTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ContentTypeFilter>('all');

  // Fetch all user tags
  const { data: tags = [], isLoading: isLoadingTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      return await tagService.getAllTags();
    },
  });

  // Fetch all content
  const { data: content = [], isLoading: isLoadingContent } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      return await contentService.getAllContent();
    },
  });

  // Create Tag Mutation
  const createTagMutation = useMutation({
    mutationFn: (title: string) => tagService.createTag(title),
    onSuccess: (newTag) => {
      toast.success(`Tag #${newTag.title} created!`);
      setNewTagTitle('');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      // auto-select new tag
      if (newTag?.title && !selectedTags.includes(newTag.title.toLowerCase())) {
        setSelectedTags((prev) => [...prev, newTag.title.toLowerCase()]);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to create tag');
    },
  });

  // Delete Tag Mutation
  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => tagService.deleteTag(id),
    onSuccess: () => {
      toast.success('Tag deleted');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to delete tag');
    },
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagTitle.replace(/^#/, '').trim();
    if (!clean) {
      toast.error('Please enter a tag name');
      return;
    }
    createTagMutation.mutate(clean);
  };

  const handleToggleSelectTag = (tagTitle: string) => {
    const clean = tagTitle.toLowerCase();
    setSelectedTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]
    );
  };

  const handleDeleteTag = (e: React.MouseEvent, tag: TagItem) => {
    e.stopPropagation();
    if (confirm(`Delete tag #${tag.title}? This will also un-tag associated notes.`)) {
      deleteTagMutation.mutate(tag._id);
      setSelectedTags((prev) => prev.filter((t) => t !== tag.title.toLowerCase()));
    }
  };

  // Filter content matching selected tags
  const taggedContent = useMemo(() => {
    if (selectedTags.length === 0) {
      return content;
    }

    return content.filter((item: ContentItem) => {
      const itemTagTitles = (item.tags || []).map((t) =>
        (typeof t === 'string' ? t.replace(/^#/, '') : t.title?.replace(/^#/, ''))?.toLowerCase()
      );
      // Item matches if it has at least one of the selected tags
      return selectedTags.some((selected) => itemTagTitles.includes(selected));
    });
  }, [content, selectedTags]);

  // Tab counts based on taggedContent
  const tabCounts = useMemo(() => {
    return {
      all: taggedContent.length,
      article: taggedContent.filter((i) => (i.type || 'note') === 'article' || (i.type || 'note') === 'note').length,
      video: taggedContent.filter((i) => i.type === 'video').length,
      document: taggedContent.filter((i) => i.type === 'document').length,
      link: taggedContent.filter((i) => i.type === 'link' || i.type === 'bookmark').length,
      tweet: taggedContent.filter((i) => i.type === 'tweet').length,
    };
  }, [taggedContent]);

  // Content filtered by active tab
  const displayContent = useMemo(() => {
    if (activeTab === 'all') return taggedContent;
    return taggedContent.filter((item) => {
      const itemType = (item.type || 'note').toLowerCase();
      if (activeTab === 'article') return itemType === 'article' || itemType === 'note';
      if (activeTab === 'video') return itemType === 'video';
      if (activeTab === 'document') return itemType === 'document';
      if (activeTab === 'link') return itemType === 'link' || itemType === 'bookmark';
      if (activeTab === 'tweet') return itemType === 'tweet';
      return true;
    });
  }, [taggedContent, activeTab]);

  const tabsConfig = [
    { id: 'all', label: 'All Types', icon: <TagIcon size={14} />, count: tabCounts.all },
    { id: 'article', label: 'Notes', icon: <FileText size={14} />, count: tabCounts.article },
    { id: 'video', label: 'Videos', icon: <Video size={14} />, count: tabCounts.video },
    { id: 'document', label: 'Documents', icon: <FileCode size={14} />, count: tabCounts.document },
    { id: 'link', label: 'Links', icon: <Link2 size={14} />, count: tabCounts.link },
    { id: 'tweet', label: 'Tweets', icon: <Hash size={14} />, count: tabCounts.tweet },
  ] as const;

  const isLoading = isLoadingTags || isLoadingContent;

  if (isLoading) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center text-outline gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <span className="font-headline font-medium text-xs text-on-surface-variant">Loading tags and taxonomy...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-2xl lg:text-3xl font-bold text-charcoal-text tracking-tight">
            Tags & Taxonomy
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed/70 text-spruce text-xs font-semibold">
            {tags.length} tags
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-1">
          Manage your knowledge tags, select tags to see associated content, or create new tags below.
        </p>
      </div>

      {/* Add New Tag Card */}
      <div className="bg-white border border-stone-border rounded-2xl p-4 sm:p-5 shadow-xs">
        <form onSubmit={handleCreateTag} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3 text-outline text-sm font-semibold pointer-events-none">#</span>
            <input
              type="text"
              value={newTagTitle}
              onChange={(e) => setNewTagTitle(e.target.value)}
              placeholder="Create tag (e.g. system-design, research, startup)..."
              className="w-full bg-surface-container-low focus:bg-white text-on-surface text-xs pl-8 pr-4 py-2.5 rounded-xl border border-stone-border focus:border-[#a8cfbd] focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all text-on-surface"
            />
          </div>
          <button
            type="submit"
            disabled={createTagMutation.isPending}
            className="px-4 py-2.5 bg-primary hover:bg-[#345246] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {createTagMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            <span>Add Tag</span>
          </button>
        </form>

        {/* Tag Cloud Selector */}
        <div className="mt-4 pt-4 border-t border-warm-stone flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={13} className="text-primary" />
              <span>Select tags to filter associated content ({selectedTags.length} active)</span>
            </span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <X size={12} />
                <span>Clear Selection</span>
              </button>
            )}
          </div>

          {tags.length === 0 ? (
            <p className="text-xs text-outline italic py-2">
              No tags created yet. Use the input above to create your first tag!
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.title.toLowerCase());
                return (
                  <div
                    key={tag._id}
                    onClick={() => handleToggleSelectTag(tag.title)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border group ${isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-charcoal border-stone-border hover:bg-surface-container'
                      }`}
                  >
                    <span className="flex items-center gap-1">
                      {isSelected && <Check size={12} className="stroke-3" />}
                      <span>#{tag.title}</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-white border border-stone-border text-outline'
                      }`}>
                      {tag.count ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTag(e, tag)}
                      title="Delete tag"
                      className={`opacity-0 group-hover:opacity-100 hover:text-error transition-all p-0.5 rounded cursor-pointer ${isSelected ? 'hover:bg-white/20' : 'hover:bg-error-container/40'
                        }`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabs and Associated Content Section */}
      <div className="flex flex-col gap-4">
        {/* Module Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-warm-stone">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as ContentTypeFilter)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'bg-white hover:bg-surface-container-low text-on-surface-variant border border-stone-border'
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-surface-container text-outline'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-on-surface-variant font-medium shrink-0 self-end sm:self-auto">
            {displayContent.length} notes shown
          </span>
        </div>

        {/* Section title & context info */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-sm text-charcoal flex items-center gap-2">
            <TagIcon size={15} className="text-primary" />
            <span>
              {selectedTags.length > 0
                ? `Tagged with: ${selectedTags.map(t => '#' + t).join(', ')}`
                : 'All Associated Content'}
            </span>
          </h2>
        </div>

        {/* Content Grid */}
        {displayContent.length === 0 ? (
          <div className="w-full h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-warm-stone rounded-2xl bg-surface-container-lowest/50 p-6">
            <div className="w-12 h-12 rounded-xl bg-[#edf3f0] text-primary flex items-center justify-center mb-3">
              <Inbox size={24} />
            </div>
            <h3 className="font-headline font-bold text-sm text-charcoal">No content found</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
              {selectedTags.length > 0
                ? 'None of your notes with the selected tags match the current filter.'
                : 'No notes available. You can add content using the Add Content button at the top.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {displayContent.map((item: ContentItem) => (
              <ContentCard key={item._id} content={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
