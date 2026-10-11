import React, { useState } from 'react';
import {
  Video,
  Hash,
  Play,
  ExternalLink,
  Trash2,
  Globe,
  Bookmark,
  Share2,
  Heart,
  Repeat,
  MessageSquare,
  FileCode,
  RotateCw,
  AlertCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../../services/content.service';
import { toast } from 'react-hot-toast';

export interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  link?: string;
  sourceUrl?: string;
  canonicalUrl?: string;
  type?: string;
  sourceType?: 'youtube' | 'web' | 'twitter' | 'google_docs' | string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | string;
  errorMessage?: string | null;
  extractedText?: string;
  metadata?: any;
  tags?: Array<{ _id?: string; title: string } | string>;
  createdAt?: string;
  updatedAt?: string;
}

interface ContentCardProps {
  content: ContentItem;
  onOpenDetail?: (item: ContentItem) => void;
}

const formatSeconds = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  } catch {
    return 'Recently';
  }
};

export const ContentCard: React.FC<ContentCardProps> = ({ content, onOpenDetail }) => {
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentService.deleteContent(id),
    onSuccess: () => {
      toast.success('Removed from your stack');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to delete');
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => contentService.retryExtraction(id),
    onSuccess: () => {
      toast.success('Re-extracting content...');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to retry extraction');
    },
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${content.title}"?`)) {
      deleteMutation.mutate(content._id);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    retryMutation.mutate(content._id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetLink = content.sourceUrl || content.link || window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetLink);
      toast.success('Link copied to clipboard');
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Resolve to one of the 4 strict V1 source types
  const resolvedType = (content.sourceType || content.type || 'web').toLowerCase();
  const isYoutube = resolvedType === 'youtube' || resolvedType === 'video';
  const isTwitter = resolvedType === 'twitter' || resolvedType === 'tweet';
  const isGoogleDocs = resolvedType === 'google_docs' || resolvedType === 'document';
  const isWeb = !isYoutube && !isTwitter && !isGoogleDocs;

  const effectiveLink = content.sourceUrl || content.link || '';
  const status = content.status || 'completed';
  const metadata = content.metadata || {};

  // Extract clean domain if link exists
  let domain = '';
  if (effectiveLink) {
    try {
      const url = new URL(effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = effectiveLink;
    }
  }

  // Normalize tags
  const tagsList: string[] = (content.tags || []).map((t) => {
    if (typeof t === 'string') return t.replace(/^#/, '');
    return t.title?.replace(/^#/, '') || '';
  }).filter(Boolean);

  // Render Category Label & Icon
  const getCategoryConfig = () => {
    if (isYoutube) {
      return { icon: <Video size={14} />, label: 'YouTube Video' };
    }
    if (isTwitter) {
      return { icon: <Hash size={14} />, label: 'X / Twitter' };
    }
    if (isGoogleDocs) {
      return { icon: <FileCode size={14} />, label: 'Google Doc' };
    }
    return { icon: <Globe size={14} />, label: 'Web Article' };
  };

  const { icon, label } = getCategoryConfig();

  // YouTube Video ID and Thumbnail
  const videoId = metadata.videoId || (() => {
    if (!isYoutube || !effectiveLink) return null;
    const match = effectiveLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
  })();

  const youtubeThumbnail = metadata.thumbnailUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(content)}
      className="group bg-white border border-stone-border hover:border-primary/40 rounded-xl p-5 shadow-xs hover:shadow-md hover:shadow-primary/5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden h-full cursor-pointer"
    >
      <div className="flex flex-col gap-3.5">
        {/* Card Header: Category, Status & Action Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#edf3f0] border border-[#d6e5de] text-primary">
              {icon}
            </span>
            <span className="text-xs font-semibold text-[#474c47]">{label}</span>

            {/* Status indicator */}
            {(status === 'pending' || status === 'processing') && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <Loader2 size={10} className="animate-spin" />
                <span>Extracting</span>
              </span>
            )}
            {status === 'failed' && (
              <div className="flex items-center gap-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  <AlertCircle size={10} />
                  <span>Failed</span>
                </span>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retryMutation.isPending}
                  className="p-1 text-primary hover:text-[#2d4d40] hover:bg-[#edf3f0] rounded transition-colors"
                  title="Retry extraction"
                >
                  <RotateCw size={11} className={retryMutation.isPending ? 'animate-spin' : ''} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              className={`p-1 rounded-md transition-colors ${isBookmarked
                ? 'text-primary bg-primary/10'
                : 'text-outline hover:text-on-surface hover:bg-surface-container-low'
                }`}
              title="Bookmark"
            >
              <Bookmark size={15} className={isBookmarked ? 'fill-primary' : ''} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-1 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
              title="Share link"
            >
              <Share2 size={15} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded-md text-outline hover:text-error hover:bg-red-50 transition-colors"
              title="Delete source"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Card Content based on source type */}
        <div>
          {/* TITLE */}
          <h2 className="font-headline font-semibold text-sm text-charcoal-text tracking-tight mb-2 flex items-start justify-between gap-1.5 group-hover:text-primary transition-colors">
            <span className="line-clamp-2">{content.title}</span>
            {effectiveLink && (
              <a
                href={effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalLink}
                className="text-outline shrink-0 mt-0.5 hover:text-primary transition-colors"
                title="Open original webpage"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </h2>

          {/* YOUTUBE VARIANT */}
          {isYoutube && (
            <div className="flex flex-col gap-2">
              <div className="relative w-full h-36 rounded-lg overflow-hidden group/vid mb-1 bg-[#1f2522] border border-warm-stone flex items-center justify-center">
                {youtubeThumbnail ? (
                  <img
                    src={youtubeThumbnail}
                    alt={content.title}
                    className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300"
                  />
                ) : null}
                <div className="absolute inset-0 bg-on-surface/30 flex items-center justify-center group-hover/vid:bg-on-surface/20 transition-all">
                  <span className="w-10 h-10 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-md group-hover/vid:scale-110 transition-transform">
                    <Play size={18} className="fill-primary ml-0.5" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] px-2 py-1 rounded bg-[#1f2522]/85 backdrop-blur-sm border border-white/10 font-medium">
                  <span className="truncate max-w-35">{metadata.channelTitle || domain || 'YouTube'}</span>
                  {metadata.duration ? (
                    <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-mono flex items-center gap-0.5">
                      <Clock size={10} />
                      {formatSeconds(metadata.duration)}
                    </span>
                  ) : (
                    <span className="bg-white/20 px-1 rounded text-[10px]">Watch</span>
                  )}
                </div>
              </div>
              {content.description && (
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>
          )}

          {/* X / TWITTER VARIANT */}
          {isTwitter && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                {metadata.profileImageUrl ? (
                  <img
                    src={metadata.profileImageUrl}
                    alt={metadata.authorName || 'Author'}
                    className="w-7 h-7 rounded-full object-cover border border-stone-border"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-surface-container border border-stone-border flex items-center justify-center text-xs font-bold text-primary">
                    {(metadata.authorName || content.title).substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight truncate">
                  <p className="text-xs text-charcoal-text font-semibold truncate">
                    {metadata.authorName || content.title}
                  </p>
                  <p className="text-[10px] text-outline truncate">
                    @{metadata.authorHandle || domain.replace(/^twitter\.com|^x\.com/, 'user')}
                  </p>
                </div>
              </div>

              {content.description && (
                <blockquote className="text-xs text-on-surface-variant bg-surface-container-low border border-[#deded5] p-3 rounded-lg leading-relaxed relative line-clamp-3">
                  <span className="text-primary-fixed font-serif text-lg absolute top-0.5 left-2 select-none">“</span>
                  <p className="relative z-10 pl-2">{content.description}</p>
                </blockquote>
              )}

              <div className="flex items-center gap-3.5 text-outline text-[11px] mt-1 px-1 font-medium">
                <span className="flex items-center gap-1 hover:text-[#c46860] transition-colors">
                  <Heart size={13} className="text-[#e0245e]" /> {(metadata.likes || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Repeat size={13} className="text-[#17bf63]" /> {(metadata.retweets || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 hover:text-primary transition-colors">
                  <MessageSquare size={13} /> {(metadata.replies || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* PUBLISHED GOOGLE DOCS VARIANT */}
          {isGoogleDocs && (
            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-[#edf3f0] via-surface-container-low to-[#f3f4ef] border border-[#dce6e0] p-3.5 mb-1 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary font-bold tracking-wider uppercase font-mono">
                  docs.google.com
                </span>
                <FileCode size={14} className="text-primary" />
              </div>
              <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                {content.description || 'Published document source. Click to open and read full contents.'}
              </p>
            </div>
          )}

          {/* PUBLIC WEB ARTICLE VARIANT */}
          {isWeb && (
            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-[#edf3f0] via-surface-container-low to-[#f3f4ef] border border-[#dce6e0] p-3 mb-1 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary font-bold tracking-wider uppercase font-mono">
                  {metadata.siteName || domain || 'WEB ARTICLE'}
                </span>
                <Globe size={13} className="text-primary" />
              </div>
              {content.description && (
                <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* TAG PILLS */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagsList.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f1f1ec] text-on-surface-variant text-[11px] font-medium border border-transparent"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CARD FOOTER */}
      <div className="pt-3 mt-3 border-t border-[#f0f0ea] flex items-center justify-between text-outline text-[11px]">
        <span>Added {formatDate(content.createdAt)}</span>

        <span className="text-primary font-medium text-xs flex items-center gap-1 group-hover:underline">
          <span>Read & View</span>
          <ExternalLink size={12} />
        </span>
      </div>
    </div>
  );
};
