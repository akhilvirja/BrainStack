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
  getAllContent: async (): Promise<ContentItem[]> => {
    const response = await api.get('/content');
    const result = response.data;
    if (Array.isArray(result?.data?.contents)) return result.data.contents;
    return [];
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
