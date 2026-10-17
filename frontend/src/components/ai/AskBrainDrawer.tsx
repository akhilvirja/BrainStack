import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
  Video,
  Globe,
  Hash,
  FileText,
  RefreshCw,
  Trash2,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { aiService, type AICitation } from '../../services/ai.service';
import { contentService } from '../../services/content.service';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: AICitation[];
  timestamp: string;
}

interface AskBrainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  'Summarize the key ideas from my saved articles',
  'What YouTube videos do I have and what are they about?',
  'What are the main takeaways from my saved tweets?',
  'Find any notes related to software architecture or coding',
];

export const AskBrainDrawer: React.FC<AskBrainDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: content = [] } = useQuery({
    queryKey: ['content'],
    queryFn: () => contentService.getAllContent(),
    refetchInterval: (query) => {
      const items = query.state.data;
      if (Array.isArray(items) && items.some((i: any) => i.status === 'processing')) {
        return 2500;
      }
      return false;
    },
  });

  const processingSources = content.filter((item) => item.status === 'processing');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const question = (queryText || input).trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await aiService.ask(question);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: result?.answer || 'I could not synthesize an answer from your saved sources.',
        citations: result?.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.meta?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to query Second Brain AI';

      const errorAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ Error: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await aiService.syncLibrary();
      toast.success(
        `Synchronized ${res.sourcesIndexed} sources into ${res.totalChunks} searchable vector chunks!`
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.meta?.message || 'Failed to sync library vectors');
    } finally {
      setIsSyncing(false);
    }
  };

  const renderCitationIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'youtube':
        return <Video size={13} className="text-[#ff0000] shrink-0" />;
      case 'twitter':
        return <Hash size={13} className="text-[#1da1f2] shrink-0" />;
      case 'google_docs':
        return <FileText size={13} className="text-[#4285f4] shrink-0" />;
      default:
        return <Globe size={13} className="text-primary shrink-0" />;
    }
  };

  const formatTimestamp = (sec?: number) => {
    if (sec === undefined || sec === null) return '';
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <aside className="relative z-10 w-full max-w-xl bg-surface border-l border-stone-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-stone-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-bold text-base text-charcoal">Ask Your Brain</h2>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Answers synthesized strictly from your saved knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Re-index and vectorize all saved sources"
              className="p-2 text-on-surface-variant hover:text-charcoal hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin text-primary' : ''} />
            </button>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear chat history"
                className="p-2 text-on-surface-variant hover:text-[#d92d20] hover:bg-[#fee4e2]/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:text-charcoal hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* In-Progress Indexing Notice Banner */}
        {processingSources.length > 0 && (
          <div className="bg-[#fff9e6] border-b border-[#f0de9e] px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#946c00] shrink-0">
            <Loader2 size={15} className="animate-spin text-[#b28400] shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-bold">Content in progress: </span>
              <span>
                {processingSources.length} source{processingSources.length > 1 ? 's' : ''} (
                {processingSources.map((s) => `"${s.title}"`).slice(0, 2).join(', ')}
                {processingSources.length > 2 ? '...' : ''}
                ) currently transcribing & indexing. You can ask questions once ready!
              </span>
            </div>
          </div>
        )}

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-4">
                <Bot size={32} />
              </div>
              <h3 className="font-headline font-bold text-lg text-charcoal">
                Your Knowledge AI Assistant
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1.5 leading-relaxed">
                Ask questions about your saved articles, YouTube transcripts, tweets, and Google Docs.
                I will synthesize answers and cite the exact sources.
              </p>

              <div className="w-full mt-6 space-y-2 text-left">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-outline px-1">
                  Suggested Prompts
                </span>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="w-full p-2.5 rounded-xl border border-stone-border bg-white hover:bg-surface-container-low text-xs text-charcoal font-medium text-left transition-colors flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <span>{prompt}</span>
                      <Sparkles
                        size={13}
                        className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={16} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-charcoal text-white rounded-tr-xs'
                      : 'bg-white border border-stone-border text-charcoal shadow-xs rounded-tl-xs'
                  }`}
                >
                  {/* Message Body */}
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-wrap font-body">{msg.text}</div>
                  ) : (
                    <div className="markdown-content font-body text-charcoal">
                      <ReactMarkdown
                        components={{
                          h1: ({ ...props }) => (
                            <h1 className="font-headline text-sm font-bold text-charcoal mt-3 mb-1.5 border-b border-stone-border/60 pb-1" {...props} />
                          ),
                          h2: ({ ...props }) => (
                            <h2 className="font-headline text-xs font-bold text-spruce uppercase tracking-wider mt-3 mb-1.5" {...props} />
                          ),
                          h3: ({ ...props }) => (
                            <h3 className="font-headline text-xs font-bold text-charcoal mt-2.5 mb-1" {...props} />
                          ),
                          p: ({ ...props }) => (
                            <p className="text-xs leading-relaxed text-charcoal/90 mb-2.5 last:mb-0" {...props} />
                          ),
                          ul: ({ ...props }) => (
                            <ul className="list-disc list-outside pl-4 space-y-1.5 mb-2.5 text-xs text-charcoal/90" {...props} />
                          ),
                          ol: ({ ...props }) => (
                            <ol className="list-decimal list-outside pl-4 space-y-1.5 mb-2.5 text-xs text-charcoal/90" {...props} />
                          ),
                          li: ({ ...props }) => (
                            <li className="text-xs leading-relaxed" {...props} />
                          ),
                          strong: ({ ...props }) => (
                            <strong className="font-bold text-charcoal" {...props} />
                          ),
                          a: ({ href, children, ...props }) => {
                            const linkText = String(children || '');
                            const isTimestamp = linkText.includes('@') || /@\s*\d+/.test(linkText);
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px] transition-colors my-0.5 align-middle ${
                                  isTimestamp
                                    ? 'bg-[#fee4e2] text-[#d92d20] hover:bg-[#fdd0cc]'
                                    : 'bg-primary/10 text-spruce hover:bg-primary/20 hover:underline'
                                }`}
                                {...props}
                              >
                                <span>{children}</span>
                                <ExternalLink size={10} className="shrink-0 opacity-70" />
                              </a>
                            );
                          },
                          code: ({ inline, ...props }: any) => {
                            return inline ? (
                              <code className="bg-surface-container-low border border-stone-border px-1.5 py-0.5 rounded text-[11px] font-mono text-spruce font-medium" {...props} />
                            ) : (
                              <code className="block bg-surface-container-lowest border border-stone-border p-3 rounded-xl overflow-x-auto my-2 text-[11px] font-mono text-charcoal leading-relaxed" {...props} />
                            );
                          },
                          blockquote: ({ ...props }) => (
                            <blockquote className="border-l-2 border-primary/50 pl-3 italic text-on-surface-variant my-2 text-xs" {...props} />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Sources Cited Tray */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-stone-border/60">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-outline mb-1.5 flex items-center gap-1">
                        <span>Sources Cited</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-spruce font-semibold">
                          {msg.citations.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {msg.citations.map((cite, idx) => {
                          const timeStr = formatTimestamp(cite.startTime);
                          const destUrl =
                            cite.sourceType === 'youtube' && cite.startTime
                              ? `${cite.sourceUrl}&t=${Math.floor(cite.startTime)}s`
                              : cite.sourceUrl;

                          return (
                            <a
                              key={idx}
                              href={destUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-stone-border text-[11px] font-medium text-charcoal transition-colors group"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {renderCitationIcon(cite.sourceType)}
                                <span className="truncate">{cite.title}</span>
                                {timeStr && (
                                  <span className="px-1.5 py-0.2 bg-[#fee4e2] text-[#d92d20] rounded-md font-bold text-[10px] shrink-0">
                                    @{timeStr}
                                  </span>
                                )}
                              </div>
                              <ExternalLink
                                size={12}
                                className="text-outline group-hover:text-primary shrink-0 transition-colors"
                              />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      msg.sender === 'user' ? 'text-white/60' : 'text-outline'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-charcoal text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    <UserIcon size={16} />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 items-start animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div className="bg-white border border-stone-border rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2.5 text-xs text-on-surface-variant">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Searching your Second Brain & synthesizing answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <footer className="p-3.5 sm:p-4 bg-white border-t border-stone-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your saved knowledge..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-surface rounded-xl border border-stone-border text-xs text-charcoal placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 bg-primary hover:bg-[#345246] disabled:bg-stone-border disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </footer>
      </aside>
    </div>
  );
};
