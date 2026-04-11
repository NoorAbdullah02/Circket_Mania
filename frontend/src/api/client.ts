import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
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
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Avoid infinite loops if refresh fails
            if (originalRequest.url?.includes('/auth/refresh')) {
                useAuthStore.getState().logout(true);
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Request a new access token
                const { data } = await axios.post(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                if (data.accessToken) {
                    useAuthStore.getState().setToken(data.accessToken);
                    // Update header and retry
                    originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout
                useAuthStore.getState().logout(true);
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
