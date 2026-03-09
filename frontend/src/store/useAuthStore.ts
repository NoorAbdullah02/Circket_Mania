import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'player';
}

interface AuthState {
    user: User | null;
    player: any | null; // Player data if user is a player
    accessToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    setAuth: (user: User, player: any | null, token: string) => void;
    setToken: (token: string) => void;
    setInitialized: (val: boolean) => void;
    logout: (silent?: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            player: null,
            accessToken: null,
            isAuthenticated: false,
            isInitialized: false,
            setAuth: (user, player, token) =>
                set({ user, player, accessToken: token, isAuthenticated: true, isInitialized: true }),
            setToken: (token) => set({ accessToken: token, isAuthenticated: true }),
            setInitialized: (val) => set({ isInitialized: val }),
            logout: () => set({ user: null, player: null, accessToken: null, isAuthenticated: false }),
        }),
        {
            name: 'cricket-mania-auth',
            partialize: (state) => ({ user: state.user, player: state.player, isAuthenticated: state.isAuthenticated }),
        }
    )
);
