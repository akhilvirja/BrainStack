import { api } from '../lib/api';

export interface LoginPayload {
  email?: string;
  password?: string;
  username?: string;
}

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await api.post('/auth/signin', {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  register: async (data: LoginPayload) => {
    const response = await api.post('/auth/register', {
      username: data.username,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};
