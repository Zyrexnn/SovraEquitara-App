import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true, // initial state before checking secure store

  login: async (token: string, user: UserProfile) => {
    await SecureStore.setItemAsync('jwt_token', token);
    set({ user, token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    set({ user: null, token: null });
  },

  fetchProfile: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      
      const response = await apiClient.get('/profile');
      if (response.data?.data) {
        set({ user: response.data.data, token, isLoading: false });
      } else {
        await SecureStore.deleteItemAsync('jwt_token');
        set({ user: null, token: null, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      await SecureStore.deleteItemAsync('jwt_token');
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
