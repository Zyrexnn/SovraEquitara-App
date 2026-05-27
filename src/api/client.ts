import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Assuming local testing with Android Emulator or iOS Simulator
// Use your local IP if testing on a physical device.
const BASE_URL = 'http://10.0.2.2:3000/api'; 
// Note: 10.0.2.2 is the alias to the host loopback interface in Android Emulator. 
// For iOS Simulator, use 'http://localhost:3000/api'.

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  async (config) => {
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
