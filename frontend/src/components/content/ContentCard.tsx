import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Tag } from '../ui/Tag';
import { Image, Video, FileText, Music, ExternalLink, MoreVertical } from 'lucide-react';

export interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  link: string;
  type: 'image' | 'video' | 'article' | 'audio';
  tags: { _id: string; title: string }[];
  createdAt: string;
}

interface ContentCardProps {
  content: ContentItem;
}

const getTypeConfig = (type: ContentItem['type']) => {
  switch (type) {
    case 'video':
      return { icon: <Video size={16} />, label: 'Video', color: 'text-[#e63946]', bg: 'bg-[#e63946]/10' };
    case 'article':
      return { icon: <FileText size={16} />, label: 'Article', color: 'text-sage-dark', bg: 'bg-sage-light' };
    case 'image':
      return { icon: <Image size={16} />, label: 'Image', color: 'text-[#023e8a]', bg: 'bg-[#023e8a]/10' };
    case 'audio':
      return { icon: <Music size={16} />, label: 'Audio', color: 'text-[#fb8500]', bg: 'bg-[#fb8500]/10' };
    default:
      return { icon: <FileText size={16} />, label: 'Note', color: 'text-outline', bg: 'bg-surface-container' };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
};

export const ContentCard: React.FC<ContentCardProps> = ({ content }) => {
  const config = getTypeConfig(content.type);

  return (
    <Card hoverable className="group h-full justify-between">
      <div className="flex flex-col gap-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
              {config.icon}
            </div>
            <span className="text-xs font-semibold text-outline tracking-wide">{config.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-outline font-medium">{formatDate(content.createdAt)}</span>
            <button className="text-outline hover:text-charcoal transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </CardHeader>
        
        <div>
          <CardTitle className="mb-1.5 line-clamp-2 leading-snug">{content.title}</CardTitle>
          {content.description && (
            <p className="text-sm text-on-surface-variant line-clamp-3 leading-relaxed">
              {content.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.tags.map((tag) => (
              <Tag key={tag._id} variant="stone" interactive>#{tag.title}</Tag>
            ))}
          </div>
        )}
        
        <div className="pt-3 border-t border-warm-stone/60">
          <a 
            href={content.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-sage hover:text-sage-dark transition-colors"
          >
            <ExternalLink size={14} />
            View Source
          </a>
        </div>
      </div>
    </Card>
  );
};
