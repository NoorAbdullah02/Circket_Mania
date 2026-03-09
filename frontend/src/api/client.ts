import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create base instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true, // For refresh token cookies
});

// Request interceptor: add access token if available
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: check for new access token in headers and handle 401s
api.interceptors.response.use(
    (response) => {
        // If the backend sent a new access token via the custom header (due to auto-refresh)
        const newAccessToken = response.headers['x-new-access-token'];
        if (newAccessToken) {
            useAuthStore.getState().setToken(newAccessToken);
        }
        return response;
    },
    async (error) => {
        // If we still get a 401 even after the backend tried to auto-refresh
        if (error.response?.status === 401) {
            // Clear local state if completely unauthorized
            useAuthStore.getState().logout(true);
        }
        return Promise.reject(error);
    }
);

export default api;
