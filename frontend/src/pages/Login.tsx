import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    useGSAP(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });

        tl.from('.login-card', {
            scale: 0.95,
            y: 30,
            duration: 1.2,
            ease: 'expo.out'
        })
            .from('.login-element', {
                y: 15,
                stagger: 0.08,
                ease: 'power3.out'
            }, '-=0.6');
    }, { scope: container });

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
        <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-start pt-10 pb-20 p-4 relative overflow-hidden" ref={container}>
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-brand-blue/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-brand-red/5 rounded-full blur-[150px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.02] rounded-full animate-spin-slow" />
            </div>

            <div className="absolute top-10 left-10 hidden lg:block">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors uppercase tracking-widest font-bold text-xs login-element group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Stadium
                </Link>
            </div>

            <div className="w-full max-w-md relative z-10 login-card">
                {/* Animated glow border */}
                <div className="absolute -inset-[1px] bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-red/30 rounded-2xl blur-sm opacity-60 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}></div>

                <Card className="relative bg-black/70 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden group">
                    {/* Top shimmer line */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent"></div>
                    <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-red/30 to-transparent"></div>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_6s_infinite]" />
                    </div>

                    <CardHeader className="space-y-1 text-center pb-8 pt-10 border-b border-white/[0.04] relative z-10 login-element">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-blue/10 blur-3xl rounded-full"></div>
                        <div className="mb-4 sm:mb-6 flex flex-col items-center relative z-10">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue/20 to-brand-red/10 rounded-2xl flex items-center justify-center mb-4 border border-white/[0.06]">
                                <Shield className="w-6 h-6 text-brand-blue" />
                            </div>
                            <span className="text-brand-yellow font-heading text-xs sm:text-lg tracking-[0.4em] drop-shadow-[0_0_15px_rgba(255,214,10,0.5)]">ICE CRICKET</span>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-white font-heading text-3xl sm:text-5xl tracking-[0.1em] uppercase leading-none">MANIA</span>
                                <div className="bg-gradient-to-br from-brand-red to-red-700 text-white text-xs sm:text-sm font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg italic shadow-[0_0_20px_rgba(255,59,48,0.5)] -rotate-12 -translate-y-2">S2</div>
                            </div>
                        </div>
                        <CardDescription className="text-brand-blue/60 text-[10px] tracking-[0.5em] uppercase font-black">
                            Secure Access Portal
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-6 sm:pt-8 px-6 sm:px-8 relative z-10">
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            <div className="space-y-1.5 sm:space-y-2 relative login-element">
                                <Label htmlFor="email" className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">Email</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3 h-5 w-5 text-brand-blue/30 group-focus-within:text-brand-blue transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="player@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-10 sm:h-12 bg-white/[0.02] border-white/[0.08] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 text-white rounded-xl placeholder:text-gray-600 transition-all shadow-inner text-sm focus:bg-white/[0.04]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2 relative login-element">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-[10px] sm:text-xs uppercase tracking-widest text-gray-400 font-bold">Password</Label>
                                    <Link to="/forgot-password" className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-brand-red/60 hover:text-brand-red transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-brand-red/30 group-focus-within:text-brand-red transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-10 sm:h-12 bg-white/[0.02] border-white/[0.08] focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 text-white rounded-xl placeholder:text-gray-600 transition-all shadow-inner tracking-widest text-sm focus:bg-white/[0.04]"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="login-element w-full h-10 sm:h-12 mt-2 sm:mt-4 bg-gradient-to-r from-brand-blue to-brand-cyan text-white font-bold tracking-[0.2em] relative overflow-hidden group shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:shadow-[0_0_30px_rgba(56,189,248,0.3)] transition-all rounded-xl transform active:scale-95 text-sm" isLoading={loading}>
                                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" /> SECURE LOGIN
                                </span>
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 border-t border-white/[0.04] text-center relative z-10 bg-white/[0.01] login-element">
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
            </div>
        </div>
    );
}
