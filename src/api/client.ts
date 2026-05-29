import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // Dynamically get Metro host IP (e.g. 192.168.1.9) to support both physical devices and emulators
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  // Fallback to loopbacks if hostUri is not available
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
};

const BASE_URL = getBaseUrl();
console.log('Resolved Backend API URL:', BASE_URL);

export const getImageUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const hostRoot = BASE_URL.replace('/api', '');
  return `${hostRoot}${path}`;
};

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
    // Bypass SecureStore lookup for public auth endpoints to avoid potential hangs
    if (config.url && (config.url.startsWith('/auth/') || config.url.includes('login') || config.url.includes('register'))) {
      return config;
    }
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
