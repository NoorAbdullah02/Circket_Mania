import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    withCredentials: true, // For refresh token cookies
});

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

api.interceptors.response.use(
    (response) => {
        const newAccessToken = response.headers['x-new-access-token'];
        if (newAccessToken) {
            useAuthStore.getState().setToken(newAccessToken);
        }
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout(true);
        }
        return Promise.reject(error);
    }
);

export default api;
