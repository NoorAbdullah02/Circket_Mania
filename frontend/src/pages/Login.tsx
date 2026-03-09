import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post('/auth/login', { email, password });

            setAuth(data.user, data.player, data.accessToken);
            toast.success(data.message);

            if (data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-red rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative glass-card border border-white/20">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-white/10">
                        <CardTitle className="text-3xl font-heading tracking-widest text-white uppercase neon-text-blue">Access Portal</CardTitle>
                        <CardDescription className="text-gray-400">Enter your credentials to continue</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="player@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-10 bg-black/50 border-white/10 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 text-white rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link to="/forgot-password" size="sm" className="text-sm text-brand-blue hover:text-brand-blue/80 hover:underline">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-10 bg-black/50 border-white/10 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 text-white rounded-md"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'SECURE LOGIN'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-white/10 pb-6 text-center">
                        <div className="text-sm text-gray-400">
                            Not drafted yet?{' '}
                            <Link to="/register" className="text-brand-yellow hover:text-brand-yellow/80 hover:underline">
                                Register as Player
                            </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                            Have an activation link? Check your email to set a password.
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
