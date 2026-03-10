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
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-br from-brand-blue via-transparent to-brand-red rounded-2xl blur-xl opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                
                <Card className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent"></div>
                    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-red/50 to-transparent"></div>
                    
                    <CardHeader className="space-y-1 text-center pb-8 pt-10 border-b border-white/5 relative z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-blue/20 blur-3xl rounded-full"></div>
                        <CardTitle className="text-4xl font-heading tracking-[0.2em] text-white uppercase neon-text-blue relative">
                            Access Portal
                        </CardTitle>
                        <CardDescription className="text-brand-blue/70 text-sm tracking-widest uppercase mt-4">
                            Enter your credentials to continue
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-8 px-8 relative z-10">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative group-focus-within:neon-text-blue transition-colors duration-300">
                                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3 h-5 w-5 text-brand-blue/50 transition-colors group-focus-within:text-brand-blue" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="player@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-12 bg-black/40 border-white/10 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50 text-white rounded-xl placeholder:text-gray-600 transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative group-focus-within:neon-text-red transition-colors duration-300">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-xs uppercase tracking-widest text-gray-400 font-bold">Password</Label>
                                    <Link to="/forgot-password" size="sm" className="text-[10px] uppercase font-bold tracking-wider text-brand-red/80 hover:text-brand-red transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3 h-5 w-5 text-brand-red/50 transition-colors group-focus-within:text-brand-red" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-12 bg-black/40 border-white/10 focus:border-brand-red focus:ring-1 focus:ring-brand-red/50 text-white rounded-xl placeholder:text-gray-600 transition-all shadow-inner tracking-widest"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 mt-4 bg-gradient-to-r from-brand-blue to-accent hover:from-brand-blue hover:to-blue-500 text-white font-bold tracking-[0.2em] relative overflow-hidden group shadow-[0_0_20px_rgba(56,189,248,0.2)] hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all rounded-xl" disabled={loading}>
                                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                                <span className="relative flex items-center justify-center">
                                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'SECURE LOGIN'}
                                </span>
                            </Button>
                        </form>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 border-t border-white/5 text-center relative z-10 bg-black/20">
                        <div className="text-xs tracking-wider uppercase text-gray-500 font-bold">
                            Not drafted yet?{' '}
                            <Link to="/register" className="text-brand-yellow hover:text-white transition-colors">
                                Register as Player
                            </Link>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-600">
                            Check email for activation link
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
