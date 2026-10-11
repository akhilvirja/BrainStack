import { api } from '../lib/api';

export interface TagItem {
  _id: string;
  title: string;
  count?: number;
  createdAt?: string;
}

export const tagService = {
  getAllTags: async (): Promise<TagItem[]> => {
    const response = await api.get('/tags');
    const result = response.data;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data?.tags)) return result.data.tags;
    if (Array.isArray(result?.tags)) return result.tags;
    return [];
  },

  createTag: async (title: string): Promise<TagItem> => {
    const response = await api.post('/tags', { title });
    return response.data?.data || response.data;
  },

  deleteTag: async (id: string) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  },
};
