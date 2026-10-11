import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  RotateCw,
  Copy,
  Check,
  Trash2,
  Video,
  Hash,
  Globe,
  FileCode,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  BookOpen,
  Code,
  FileText,
  Heart,
  Repeat,
  MessageSquare,
  Plus,
  Play
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../../services/content.service';
import type { ContentItem } from './ContentCard';
import { toast } from 'react-hot-toast';

interface SourceDetailModalProps {
  item: ContentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

const formatSeconds = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Recently';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return 'Recently';
  }
};

export const SourceDetailModal: React.FC<SourceDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'content' | 'rawText' | 'metadata'>('content');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [seekTime, setSeekTime] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Retry mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => contentService.retryExtraction(id),
    onSuccess: () => {
      toast.success('Extraction re-triggered successfully');
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to retry extraction');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentService.deleteContent(id),
    onSuccess: () => {
      toast.success('Source deleted');
      queryClient.invalidateQueries({ queryKey: ['content'] });
      if (item && onDeleted) onDeleted(item._id);
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to delete');
    },
  });

  // Tag mutation (add/remove tag)
  const tagMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      contentService.updateContent(id, { tags }),
    onSuccess: () => {
      toast.success('Tags updated');
      queryClient.invalidateQueries({ queryKey: ['content'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsAddingTag(false);
      setNewTagInput('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.meta?.message || err.message;
      toast.error(msg || 'Failed to update tags');
    },
  });

  if (!isOpen || !item) return null;

  const resolvedType = (item.sourceType || item.type || 'web').toLowerCase();
  const isYoutube = resolvedType === 'youtube' || resolvedType === 'video';
  const isTwitter = resolvedType === 'twitter' || resolvedType === 'tweet';
  const isGoogleDocs = resolvedType === 'google_docs' || resolvedType === 'document';
  const isWeb = !isYoutube && !isTwitter && !isGoogleDocs;

  const effectiveLink = item.sourceUrl || item.link || '';
  const status = item.status || 'completed';
  const metadata = item.metadata || {};

  // Extract clean domain
  let domain = '';
  if (effectiveLink) {
    try {
      const parsed = new URL(effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = effectiveLink;
    }
  }

  // Tags list
  const currentTags: string[] = (item.tags || []).map((t) => {
    if (typeof t === 'string') return t.replace(/^#/, '');
    return t.title?.replace(/^#/, '') || '';
  }).filter(Boolean);

  const handleAddTag = () => {
    const clean = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    if (currentTags.includes(clean)) {
      toast('Tag already attached', { icon: 'ℹ️' });
      setIsAddingTag(false);
      setNewTagInput('');
      return;
    }
    tagMutation.mutate({
      id: item._id,
      tags: [...currentTags, clean],
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    tagMutation.mutate({
      id: item._id,
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && effectiveLink) {
      navigator.clipboard.writeText(effectiveLink);
      setCopiedLink(true);
      toast.success('Source link copied');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyText = () => {
    const textToCopy = item.extractedText || item.description || item.title;
    if (navigator.clipboard && textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      toast.success('Extracted text copied');
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(item._id);
    }
  };

  // Video ID for YouTube
  const videoId = metadata.videoId || (() => {
    if (!isYoutube || !effectiveLink) return null;
    const match = effectiveLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
  })();

  // Filtered transcript
  const transcriptSegments: Array<{ text: string; start: number; duration: number }> =
    Array.isArray(metadata.transcript) ? metadata.transcript : [];

  const filteredTranscript = transcriptSegments.filter((seg) =>
    seg.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-surface-container-lowest h-full shadow-2xl flex flex-col border-l border-stone-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP HEADER */}
        <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between gap-4 bg-surface-container-low/40">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Source Type Badge */}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#edf3f0] text-primary border border-[#d6e5de]">
              {isYoutube && <Video size={14} />}
              {isTwitter && <Hash size={14} />}
              {isGoogleDocs && <FileCode size={14} />}
              {isWeb && <Globe size={14} />}
              <span className="capitalize">{resolvedType.replace('_', ' ')}</span>
            </span>

            {/* Processing Status Badge */}
            {status === 'completed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#eaf7ee] text-[#1c7a38] border border-[#c3ebcb]">
                <CheckCircle2 size={12} />
                <span>Extracted</span>
              </span>
            )}
            {(status === 'pending' || status === 'processing') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ebf3fc] text-[#1e60b5] border border-[#c6defb]">
                <Loader2 size={12} className="animate-spin" />
                <span>Processing</span>
              </span>
            )}
            {status === 'failed' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#fde8e8] text-[#c81e1e] border border-[#f8b4b4]">
                <AlertCircle size={12} />
                <span>Extraction Failed</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {effectiveLink && (
              <a
                href={effectiveLink.startsWith('http') ? effectiveLink : `https://${effectiveLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-charcoal hover:text-primary hover:bg-surface-container transition-colors border border-stone-border"
                title="Open original webpage"
              >
                <span>Visit Source</span>
                <ExternalLink size={13} />
              </a>
            )}

            <button
              type="button"
              onClick={() => retryMutation.mutate(item._id)}
              disabled={retryMutation.isPending}
              className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors border border-transparent hover:border-stone-border"
              title="Re-extract content from source"
            >
              <RotateCw size={15} className={retryMutation.isPending ? 'animate-spin text-primary' : ''} />
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors border border-transparent hover:border-stone-border"
              title="Copy source URL"
            >
              {copiedLink ? <Check size={15} className="text-primary" /> : <Copy size={15} />}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
              title="Delete source"
            >
              <Trash2 size={15} />
            </button>

            <div className="w-[1px] h-5 bg-stone-border mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-outline hover:text-charcoal hover:bg-surface-container transition-colors"
              title="Close drawer (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FAILED STATE ALERT BANNER */}
        {status === 'failed' && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-[#fff5f5] border border-[#fed7d7] flex items-center justify-between gap-3 text-xs text-[#9b2c2c]">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-[#e53e3e] shrink-0" />
              <span>
                <strong>Extraction failed:</strong> {item.errorMessage || 'Could not extract clean text from this URL.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => retryMutation.mutate(item._id)}
              disabled={retryMutation.isPending}
              className="px-3 py-1 bg-white hover:bg-red-50 text-[#e53e3e] border border-[#feb2b2] font-semibold rounded-lg shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCw size={12} className={retryMutation.isPending ? 'animate-spin' : ''} />
              <span>Retry Now</span>
            </button>
          </div>
        )}

        {/* TITLE & METADATA BAR */}
        <div className="px-6 pt-5 pb-3">
          <h1 className="font-headline font-bold text-xl text-charcoal tracking-tight leading-snug">
            {item.title}
          </h1>

          {/* Metadata badges strip */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-outline">
            {domain && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-primary">
                <Globe size={13} />
                <span>{domain}</span>
              </span>
            )}
            {(metadata.channelTitle || metadata.author || metadata.authorName) && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <User size={13} />
                <span>{metadata.channelTitle || metadata.author || metadata.authorName}</span>
              </span>
            )}
            {metadata.wordCount && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <FileText size={13} />
                <span>{metadata.wordCount.toLocaleString()} words</span>
              </span>
            )}
            {metadata.duration && (
              <span className="flex items-center gap-1 text-on-surface-variant">
                <Clock size={13} />
                <span>{formatSeconds(metadata.duration)}</span>
              </span>
            )}
            {item.createdAt && (
              <span className="flex items-center gap-1 text-outline">
                <Calendar size={13} />
                <span>Added {formatDate(item.createdAt)}</span>
              </span>
            )}
          </div>

          {/* TAGS ROW */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3.5 pt-3 border-t border-stone-border/60">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f1f1ec] text-charcoal border border-[#deded5]"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-error text-outline transition-colors"
                  title="Remove tag"
                >
                  <X size={11} />
                </button>
              </span>
            ))}

            {isAddingTag ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setIsAddingTag(false);
                  }}
                  autoFocus
                  placeholder="tag name..."
                  className="px-2 py-0.5 text-xs rounded-lg border border-primary bg-white text-charcoal focus:outline-none w-24"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="text-xs text-outline hover:text-charcoal"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-outline hover:text-primary hover:bg-[#edf3f0] border border-dashed border-stone-border transition-colors cursor-pointer"
              >
                <Plus size={11} />
                <span>Add tag</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-6 border-b border-stone-border flex items-center gap-6 text-xs font-semibold bg-surface-container-low/20">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'content'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-charcoal'
            }`}
          >
            <BookOpen size={14} />
            <span>Interactive View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rawText')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'rawText'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-charcoal'
            }`}
          >
            <FileText size={14} />
            <span>Extracted Text</span>
            {item.extractedText && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-stone-border text-on-surface-variant font-mono">
                {item.extractedText.length.toLocaleString()} chars
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-primary text-primary'
                : 'border-transparent text-outline hover:text-charcoal'
            }`}
          >
            <Code size={14} />
            <span>Metadata & Technical Info</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: INTERACTIVE VIEW */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-6">
              {/* YOUTUBE VIEW */}
              {isYoutube && (
                <div className="flex flex-col gap-5">
                  {videoId ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-md border border-stone-border">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?start=${seekTime}&autoplay=${seekTime > 0 ? 1 : 0}`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-surface-container text-center text-outline text-xs">
                      Could not resolve YouTube video ID for embedded player.
                    </div>
                  )}

                  {/* TRANSCRIPT EXPLORER */}
                  <div className="border border-stone-border rounded-xl bg-white overflow-hidden shadow-xs">
                    <div className="p-3.5 border-b border-stone-border bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-primary" />
                        <span className="font-headline font-semibold text-xs text-charcoal">
                          Interactive Transcript
                        </span>
                        {transcriptSegments.length > 0 && (
                          <span className="text-[11px] text-outline font-medium">
                            ({transcriptSegments.length} segments)
                          </span>
                        )}
                      </div>

                      {transcriptSegments.length > 0 && (
                        <div className="relative w-full sm:w-64">
                          <Search size={13} className="absolute left-2.5 top-2.5 text-outline" />
                          <input
                            type="text"
                            value={transcriptSearch}
                            onChange={(e) => setTranscriptSearch(e.target.value)}
                            placeholder="Filter transcript lines..."
                            className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-stone-border bg-white text-charcoal placeholder:text-outline focus:outline-none focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    {transcriptSegments.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto divide-y divide-stone-border/50 text-xs">
                        {filteredTranscript.length === 0 ? (
                          <div className="p-6 text-center text-outline">
                            No transcript segments matching &ldquo;{transcriptSearch}&rdquo;.
                          </div>
                        ) : (
                          filteredTranscript.map((seg, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSeekTime(seg.start)}
                              className="p-3 hover:bg-[#f6f9f7] transition-colors flex items-start gap-3 cursor-pointer group"
                            >
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary px-2 py-0.5 rounded bg-[#edf3f0] border border-[#d6e5de] group-hover:bg-primary group-hover:text-white transition-colors shrink-0"
                              >
                                <Play size={10} className="fill-current" />
                                <span>{formatSeconds(seg.start)}</span>
                              </button>
                              <p className="text-charcoal leading-relaxed text-xs pt-0.5">
                                {seg.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-outline text-xs">
                        <p className="font-medium text-charcoal">
                          Captions were not provided or were disabled for this video.
                        </p>
                        <p className="mt-1 text-on-surface-variant">
                          The player embed above is fully functional, and you can still save personal tags and notes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* X / TWITTER VIEW */}
              {isTwitter && (
                <div className="max-w-xl mx-auto w-full">
                  <div className="bg-white border border-stone-border rounded-2xl p-5 shadow-xs flex flex-col gap-3.5">
                    {/* Tweet Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {metadata.profileImageUrl ? (
                          <img
                            src={metadata.profileImageUrl}
                            alt={metadata.authorName || 'Author'}
                            className="w-10 h-10 rounded-full object-cover border border-stone-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm">
                            {(metadata.authorName || 'X').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-charcoal leading-tight">
                            {metadata.authorName || 'X Creator'}
                          </h4>
                          <p className="text-xs text-outline">
                            @{metadata.authorHandle || 'user'}
                          </p>
                        </div>
                      </div>
                      <Hash size={18} className="text-outline" />
                    </div>

                    {/* Tweet Body Text */}
                    <div className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap font-sans">
                      {item.extractedText || item.description || 'Tweet content'}
                    </div>

                    {/* Attached Photos */}
                    {Array.isArray(metadata.photos) && metadata.photos.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl overflow-hidden mt-1">
                        {metadata.photos.map((photoUrl: string, idx: number) => (
                          <img
                            key={idx}
                            src={photoUrl}
                            alt={`Tweet media ${idx + 1}`}
                            className="w-full h-48 object-cover rounded-lg border border-stone-border"
                          />
                        ))}
                      </div>
                    )}

                    {/* Tweet Engagement Metrics */}
                    <div className="flex items-center gap-6 pt-3 mt-1 border-t border-stone-border text-xs text-outline font-medium">
                      <span className="flex items-center gap-1.5">
                        <Heart size={14} className="text-[#e0245e]" />
                        <span>{(metadata.likes || 0).toLocaleString()} likes</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Repeat size={14} className="text-[#17bf63]" />
                        <span>{(metadata.retweets || 0).toLocaleString()} reposts</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-[#1da1f2]" />
                        <span>{(metadata.replies || 0).toLocaleString()} replies</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* WEB ARTICLE READER VIEW */}
              {isWeb && (
                <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                  {metadata.leadImageUrl && (
                    <div className="w-full h-64 rounded-xl overflow-hidden border border-stone-border shadow-xs bg-surface-container">
                      <img
                        src={metadata.leadImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {metadata.excerpt && (
                    <blockquote className="border-l-3 border-primary pl-4 py-1 italic text-on-surface-variant text-sm bg-surface-container-low/40 rounded-r-lg">
                      {metadata.excerpt}
                    </blockquote>
                  )}

                  {/* Clean Article Typography */}
                  <article className="prose prose-stone max-w-none text-charcoal text-sm leading-relaxed space-y-4">
                    {(item.extractedText || item.description || '')
                      .split('\n\n')
                      .filter((p) => p.trim().length > 0)
                      .map((paragraph, idx) => (
                        <p key={idx} className="leading-7 text-[13.5px]">
                          {paragraph.trim()}
                        </p>
                      ))}
                  </article>
                </div>
              )}

              {/* GOOGLE DOCS VIEW */}
              {isGoogleDocs && (
                <div className="max-w-2xl mx-auto w-full">
                  <div className="bg-white border border-stone-border rounded-xl shadow-xs p-8 flex flex-col gap-4 min-h-[400px]">
                    <div className="flex items-center justify-between border-b border-stone-border pb-4">
                      <div className="flex items-center gap-2">
                        <FileCode size={20} className="text-primary" />
                        <span className="font-headline font-bold text-sm text-charcoal">
                          Published Google Document
                        </span>
                      </div>
                      {effectiveLink && (
                        <a
                          href={effectiveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          <span>Open in Docs</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div className="prose prose-stone max-w-none text-charcoal text-sm leading-relaxed space-y-4 pt-2">
                      {(item.extractedText || item.description || '')
                        .split('\n\n')
                        .filter((p) => p.trim().length > 0)
                        .map((para, idx) => (
                          <p key={idx} className="leading-7 text-[13.5px]">
                            {para.trim()}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXTRACTED RAW TEXT */}
          {activeTab === 'rawText' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-outline font-medium">
                  Normalized plain text preserved for search & vector embeddings
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-border hover:bg-surface-container text-charcoal transition-colors cursor-pointer shadow-xs"
                >
                  {copiedText ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
                  <span>{copiedText ? 'Copied' : 'Copy All Text'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-stone-border font-mono text-xs text-charcoal leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                {item.extractedText || item.description || 'No extracted text available.'}
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL METADATA */}
          {activeTab === 'metadata' && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface-container-low border border-stone-border">
                  <span className="text-outline text-[11px] block">Source Type</span>
                  <span className="font-semibold text-charcoal uppercase tracking-wider font-mono">
                    {resolvedType}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low border border-stone-border">
                  <span className="text-outline text-[11px] block">Processing Status</span>
                  <span className="font-semibold text-charcoal font-mono">{status}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low border border-stone-border col-span-full">
                  <span className="text-outline text-[11px] block">Canonical URL</span>
                  <span className="font-mono text-charcoal break-all">
                    {item.canonicalUrl || effectiveLink || 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low border border-stone-border col-span-full">
                  <span className="text-outline text-[11px] block">Raw Source URL</span>
                  <span className="font-mono text-charcoal break-all">{effectiveLink || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-outline text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                  Metadata JSON Payload
                </span>
                <pre className="p-4 rounded-xl bg-surface-container-low border border-stone-border font-mono text-[11px] text-charcoal overflow-x-auto">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
