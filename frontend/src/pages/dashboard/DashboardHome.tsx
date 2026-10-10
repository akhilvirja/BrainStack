import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Inbox } from 'lucide-react';
import { contentService } from '../../services/content.service';
import { ContentCard } from '../../components/content/ContentCard';
import type { ContentItem } from '../../components/content/ContentCard';

export const DashboardHome: React.FC = () => {
  const { data: content, isLoading, isError, error } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      return await contentService.getAllContent();
    },
  });

  if (isLoading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-outline gap-3">
        <Loader2 size={32} className="animate-spin text-sage" />
        <span className="font-headline font-medium text-sm">Loading your stack...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-6 rounded-2xl bg-[#fee4e2] border border-[#f0c3c1] flex items-start gap-4">
        <AlertCircle className="text-[#d92d20] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-headline font-bold text-[#b42318] text-sm">Failed to load content</h3>
          <p className="text-sm text-[#d92d20] mt-1">{(error as any)?.response?.data?.message || error.message}</p>
        </div>
      </div>
    );
  }

  const items: ContentItem[] = Array.isArray(content) ? content : content?.content || [];

  if (items.length === 0) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-center border-2 border-dashed border-warm-stone rounded-3xl bg-surface-container-lowest/50">
        <div className="w-16 h-16 rounded-2xl bg-sage-light text-sage flex items-center justify-center mb-4">
          <Inbox size={32} />
        </div>
        <h3 className="font-headline font-bold text-xl text-charcoal">Your stack is empty</h3>
        <p className="text-on-surface-variant text-sm mt-2 max-w-md">
          Start building your knowledge base by saving links, tweets, videos, and articles to your Brain Stack.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="font-headline text-2xl font-bold text-charcoal tracking-tight">All Notes</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your complete curated knowledge base.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <ContentCard key={item._id} content={item} />
        ))}
      </div>
    </div>
  );
};
