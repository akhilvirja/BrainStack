import { api } from '../lib/api';
import type { ContentItem } from '../components/content/ContentCard';

export interface CreateContentPayload {
  title: string;
  link?: string;
  sourceUrl?: string;
  type?: string;
  sourceType?: string;
  canonicalUrl?: string;
  description?: string;
  tags?: string[];
  metadata?: any;
  extractedText?: string;
}

export const contentService = {
  getAllContent: async (params?: { sourceType?: string; type?: string; q?: string; tag?: string }): Promise<ContentItem[]> => {
    const response = await api.get('/content', { params });
    const result = response.data;
    if (Array.isArray(result?.data?.contents)) return result.data.contents;
    return [];
  },

  getContentById: async (id: string): Promise<ContentItem | null> => {
    const response = await api.get(`/content/${id}`);
    return response.data?.data || null;
  },

  createContent: async (data: CreateContentPayload) => {
    const response = await api.post('/content', data);
    return response.data;
  },

  updateContent: async (id: string, data: Partial<CreateContentPayload>) => {
    const response = await api.patch(`/content/${id}`, data);
    return response.data;
  },

  retryExtraction: async (id: string) => {
    const response = await api.post(`/content/${id}/retry`);
    return response.data;
  },

  deleteContent: async (id: string) => {
    const response = await api.delete(`/content/${id}`);
    return response.data;
  },
};
