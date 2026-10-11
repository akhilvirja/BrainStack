import React, { useState } from 'react';
import {
  FolderOpen,
  Video,
  Hash,
  Link2,
  Code,
  Play,
  ExternalLink,
  Trash2,
  Copy,
  Globe,
  Bookmark,
  Share2,
  Heart,
  Repeat,
  MessageSquare
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../../services/content.service';
import { toast } from 'react-hot-toast';

export interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  link?: string;
  type?: 'image' | 'video' | 'article' | 'audio' | 'tweet' | 'link' | 'document' | 'note' | 'bookmark' | string;
  tags?: Array<{ _id?: string; title: string } | string>;
  createdAt?: string;
  updatedAt?: string;
}

interface ContentCardProps {
  content: ContentItem;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export const ContentCard: React.FC<ContentCardProps> = ({ content }) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete "${content.title}"?`)) {
      deleteMutation.mutate(content._id);
    }
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content.link || window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const type = (content.type || 'note').toLowerCase();

  // Extract clean domain if link exists
  let domain = '';
  if (content.link) {
    try {
      const url = new URL(content.link.startsWith('http') ? content.link : `https://${content.link}`);
      domain = url.hostname.replace('www.', '');
    } catch {
      domain = content.link;
    }
  }

  // Normalize tags
  const tagsList: string[] = (content.tags || []).map((t) => {
    if (typeof t === 'string') return t.replace(/^#/, '');
    return t.title?.replace(/^#/, '') || '';
  }).filter(Boolean);

  // Render Category Label & Icon
  const getCategoryConfig = () => {
    switch (type) {
      case 'video':
        return { icon: <Video size={15} />, label: 'Videos' };
      case 'tweet':
        return { icon: <Hash size={15} />, label: 'Productivity Tip' };
      case 'link':
      case 'bookmark':
        return { icon: <Link2 size={15} />, label: 'Links' };
      case 'document':
        return { icon: <Code size={15} />, label: 'Documents' };
      case 'note':
      case 'article':
      default:
        return { icon: <FolderOpen size={15} />, label: 'Project Ideas' };
    }
  };

  const { icon, label } = getCategoryConfig();

  return (
    <div className="group bg-white border border-stone-border hover:border-[#ccd4cf] rounded-xl p-5 shadow-xs hover:shadow-md hover:shadow-black/3 transition-all duration-200 flex flex-col justify-between relative overflow-hidden h-full">
      <div className="flex flex-col gap-3.5">
        {/* Card Header: Category & Hover Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#edf3f0] border border-[#d6e5de] text-primary">
              {icon}
            </span>
            <span className="text-xs font-semibold text-[#474c47]">{label}</span>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
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
              title="Share"
            >
              <Share2 size={15} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1 rounded-md text-outline hover:text-error hover:bg-error-container/40 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Card Content based on type */}
        <div>
          {/* TITLE */}
          <h2 className="font-headline font-semibold text-sm text-charcoal-text tracking-tight mb-2 flex items-start justify-between gap-1.5">
            <span>{content.title}</span>
            {content.link && (type === 'link' || type === 'bookmark') && (
              <ExternalLink size={14} className="text-outline shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
            )}
          </h2>

          {/* VIDEO VARIANT */}
          {type === 'video' && (
            <div className="flex flex-col gap-2">
              <div
                onClick={() => content.link && window.open(content.link, '_blank')}
                className="relative w-full h-36 rounded-lg overflow-hidden group/vid cursor-pointer mb-1 bg-[#1f2522] border border-warm-stone flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-on-surface/30 flex items-center justify-center group-hover/vid:bg-on-surface/20 transition-all">
                  <span className="w-10 h-10 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-md group-hover/vid:scale-110 transition-transform">
                    <Play size={18} className="fill-primary ml-0.5" />
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] px-2 py-1 rounded bg-[#1f2522]/80 backdrop-blur-sm border border-white/10 font-medium">
                  <span className="truncate max-w-35">{domain || 'Video Stream'}</span>
                  <span className="bg-white/20 px-1 rounded text-[10px]">Play</span>
                </div>
              </div>
              {content.description && (
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {content.description}
                </p>
              )}
            </div>
          )}

          {/* TWEET VARIANT */}
          {type === 'tweet' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-surface-container border border-stone-border flex items-center justify-center text-xs font-bold text-primary">
                  {content.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="leading-tight">
                  <p className="text-xs text-charcoal-text font-semibold">{content.title}</p>
                  <p className="text-[10px] text-outline">@{content.title.toLowerCase().replace(/\s+/g, '')}</p>
                </div>
              </div>

              {content.description && (
                <blockquote className="text-xs text-on-surface-variant bg-surface-container-low border border-[#deded5] p-3 rounded-lg leading-relaxed relative">
                  <span className="text-primary-fixed font-serif text-lg absolute top-0.5 left-2 select-none">“</span>
                  <p className="relative z-10 pl-2">{content.description}</p>
                </blockquote>
              )}

              <div className="flex items-center gap-3.5 text-outline text-[11px] mt-1 px-1 font-medium">
                <span className="flex items-center gap-1 hover:text-[#c46860] cursor-pointer transition-colors">
                  <Heart size={13} /> 1.2k
                </span>
                <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                  <Repeat size={13} /> 342
                </span>
                <span className="flex items-center gap-1 hover:text-primary cursor-pointer transition-colors">
                  <MessageSquare size={13} /> 89
                </span>
              </div>
            </div>
          )}

          {/* LINK VARIANT */}
          {(type === 'link' || type === 'bookmark') && (
            <div
              onClick={() => content.link && window.open(content.link, '_blank')}
              className="rounded-lg overflow-hidden bg-gradient-to-br from-[#edf3f0] via-surface-container-low to-[#f3f4ef] border border-[#dce6e0] p-3 mb-1 flex flex-col justify-between gap-1.5 cursor-pointer hover:border-[#a8cfbd] transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary font-bold tracking-wider uppercase font-mono">
                  {domain || 'EXTERNAL SOURCE'}
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

          {/* DOCUMENT / CODE VARIANT */}
          {type === 'document' && (
            <div className="flex flex-col gap-1.5">
              <div className="bg-[#242926] border border-[#343b37] rounded-lg p-3 font-mono text-[11px] leading-5 text-[#d8ded9] overflow-x-auto select-all">
                <div className="text-[#7c8880] font-semibold mb-1 select-none text-[10px]"># code snippet</div>
                <p className="text-[#bdeddd] break-words whitespace-pre-wrap">
                  {content.description || content.link || '// No source provided'}
                </p>
              </div>
            </div>
          )}

          {/* NOTE / ARTICLE DEFAULT VARIANT */}
          {(type === 'note' || type === 'article') && (
            <div className="flex flex-col gap-2">
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
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f1f1ec] hover:bg-[#e7ece8] text-on-surface-variant hover:text-primary text-[11px] font-medium cursor-pointer transition-colors border border-transparent hover:border-[#ccd4cf]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* CARD FOOTER */}
      <div className="pt-3 mt-3 border-t border-[#f0f0ea] flex items-center justify-between text-outline text-[11px]">
        <span>Added on {formatDate(content.createdAt)}</span>

        {type === 'document' ? (
          <button
            type="button"
            onClick={(e) => handleCopy(e, content.description || content.title)}
            className="flex items-center gap-1 text-primary hover:text-[#2d4d40] font-medium text-xs transition-colors cursor-pointer"
          >
            <Copy size={13} />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        ) : content.link ? (
          <a
            href={content.link.startsWith('http') ? content.link : `https://${content.link}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium text-xs hover:underline flex items-center gap-1"
          >
            <span>Visit page</span>
            <ExternalLink size={12} />
          </a>
        ) : (
          <span className="flex items-center gap-1.5 font-medium text-[#5c645e]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block animate-pulse"></span>
            Synced
          </span>
        )}
      </div>
    </div>
  );
};
