import { api } from '../lib/api';
import type { ContentItem } from '../components/content/ContentCard';

export interface CreateContentPayload {
  title: string;
  link: string;
  type: string;
  description?: string;
  tags?: string[];
}

export const contentService = {
  getAllContent: async (): Promise<{ content: ContentItem[] } | ContentItem[]> => {
    const response = await api.get('/content');
    return response.data;
  },

  createContent: async (data: CreateContentPayload) => {
    const response = await api.post('/content', data);
    return response.data;
  },

  deleteContent: async (id: string) => {
    const response = await api.delete(`/content/${id}`);
    return response.data;
  },
};
