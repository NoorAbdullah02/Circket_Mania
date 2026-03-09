import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import { useAuthStore } from './store/useAuthStore';
import api from './api/client';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ActivateAccount from './pages/ActivateAccount';
import PlayerDashboard from './pages/PlayerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PointsTable from './pages/PointsTable';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import TeamDetails from './pages/TeamDetails';
import PlayerProfile from './pages/PlayerProfile';

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: 'admin' | 'player' }) {
    const { isAuthenticated, user, isInitialized } = useAuthStore();

    if (!isInitialized) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-red animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (role && user?.role !== role) {
        return <Navigate to="/" />; // Redirect to home if unauthorized role
    }

    return <>{children}</>;
}

function App() {
    const { setToken, setInitialized, logout } = useAuthStore();

    React.useEffect(() => {
        const initAuth = async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                setToken(data.accessToken);
            } catch (error) {
                // If refresh fails, we might still have a persisted user but no token
                // We should probably logout if we can't refresh
                logout(true);
            } finally {
                setInitialized(true);
            }
        };

        initAuth();
    }, [setToken, setInitialized, logout]);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/activate" element={<ActivateAccount />} />
                            <Route path="/points-table" element={<PointsTable />} />
                            <Route path="/matches" element={<Matches />} />
                            <Route path="/matches/:id" element={<MatchDetails />} />
                            <Route path="/team/:id" element={<TeamDetails />} />
                            <Route path="/player/:id" element={<PlayerProfile />} />

                            {/* Player Dashboard */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute role="player">
                                        <PlayerDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin Dashboard */}
                            <Route
                                path="/admin/*"
                                element={
                                    <ProtectedRoute role="admin">
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </main>
                </div>
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(0, 0, 0, 0.8)',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                        },
                        success: {
                            iconTheme: { primary: '#22c55e', secondary: '#000' }
                        },
                        error: {
                            iconTheme: { primary: '#FF3B30', secondary: '#000' }
                        }
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
