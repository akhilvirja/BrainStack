import { api } from '../lib/api';

export interface AICitation {
  title: string;
  sourceUrl: string;
  sourceType: string;
  startTime?: number;
  author?: string;
}

export interface AskBrainResult {
  answer: string;
  citations: AICitation[];
  chunksFound: number;
}

export const aiService = {
  ask: async (question: string): Promise<AskBrainResult> => {
    const response = await api.post('/ai/ask', { question });
    return response.data?.data;
  },

  syncLibrary: async (): Promise<{ sourcesIndexed: number; totalChunks: number }> => {
    const response = await api.post('/ai/sync');
    return response.data?.data;
  },
};
