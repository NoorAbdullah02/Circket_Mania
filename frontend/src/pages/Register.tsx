import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, User, Phone, CheckCircle, Loader2, Camera, ArrowLeft, Sparkles } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import confetti from 'canvas-confetti';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        batch: '21st',
        role: 'Batsman',
        profileImage: '',
    });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    const navigate = useNavigate();

    useGSAP(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1 } });
        tl.from('.reg-card', { y: 40, scale: 0.95, duration: 1.2 })
            .from('.reg-element', { y: 15, stagger: 0.05, ease: 'power3.out' }, '-=0.8');
    }, { scope: container });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const { data } = await api.post('/upload/public?folder=players', uploadData);
            setFormData(prev => ({ ...prev, profileImage: data.url }));
            toast.success('Photo uploaded!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Photo upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.batch || !formData.role) {
            toast.error('Name, email, batch, and role are required');
            return;
        }

        if (!formData.profileImage) {
            toast.error('Please upload a profile photo');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post('/auth/register', formData);
            toast.success(data.message || 'Registration successful');

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0A84FF', '#FF3B30', '#FFD60A']
            });

            setRegistered(true);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="glass-card text-center max-w-lg p-8 border-brand-yellow/20 bg-black/60 backdrop-blur-2xl">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-yellow/20">
                            <CheckCircle className="w-10 h-10 text-brand-yellow drop-shadow-[0_0_15px_rgba(255,214,10,0.5)]" />
                        </div>
                        <CardTitle className="neon-text-yellow text-4xl mb-4 font-heading tracking-widest uppercase">Successfully Drafted!</CardTitle>
                        <CardDescription className="text-lg text-gray-300 font-light leading-relaxed">
                            Your identity has been digitized and entered into the <span className="text-white font-bold uppercase tracking-widest text-sm">ICE Cricket Mania – Season Two</span> drafting pool.
                        </CardDescription>
                        <p className="mt-8 text-gray-400 text-sm leading-relaxed border-t border-white/[0.04] pt-8">
                            When an admin selects you for a franchise, you will receive an activation link via email to create your password and set up your profile.
                        </p>
                        <Button variant="outline" className="mt-10 w-full h-12 uppercase tracking-widest font-bold border-white/[0.08] hover:bg-white/5 hover:border-brand-yellow transition-all rounded-xl" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] px-4 flex flex-col items-center justify-start pt-10 pb-20 relative" ref={container}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand-red/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-brand-yellow/5 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] border border-white/[0.02] rounded-full animate-spin-slow hidden lg:block" />
            </div>

            <div className="absolute top-10 left-10 hidden lg:block">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-brand-red transition-colors uppercase tracking-widest font-bold text-xs reg-element group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cancel Entry
                </Link>
            </div>

            <div className="w-full max-w-lg relative z-10 reg-card">
                <div className="absolute -inset-[1px] bg-gradient-to-br from-brand-red/30 via-transparent to-brand-yellow/30 rounded-2xl blur-sm opacity-60 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }}></div>

                <Card className="relative bg-black/70 backdrop-blur-3xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden group">
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-red/40 to-transparent"></div>
                    <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-yellow/30 to-transparent"></div>

                    {/* Shimmer */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full animate-[shimmer_6s_infinite]" />
                    </div>

                    <CardHeader className="text-center pb-8 pt-10 border-b border-white/[0.04] relative z-10 reg-element">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-3xl rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-yellow/10 blur-3xl rounded-full"></div>
                        <div className="mb-4 flex flex-col items-center">
                            <span className="text-brand-blue font-heading text-xs tracking-[0.5em] mb-2">ICE CRICKET MANIA</span>
                        </div>
                        <CardTitle className="text-4xl font-heading tracking-[0.2em] text-white uppercase relative">
                            <span className="text-brand-red font-black">DRAFT</span> POOL
                        </CardTitle>
                        <CardDescription className="text-brand-yellow/70 text-xs tracking-[0.35em] uppercase mt-3 relative font-black">Season Two Edition</CardDescription>
                    </CardHeader>

                    <CardContent className="pt-8 px-6 sm:px-8 relative z-10 space-y-4">
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-8 relative reg-element">
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 group/photo">
                                <div className="absolute -inset-2 bg-gradient-to-tr from-brand-blue to-brand-red rounded-full blur opacity-30 group-hover/photo:opacity-60 group-hover/photo:scale-105 transition duration-500"></div>
                                <div className="relative w-full h-full rounded-full bg-black/80 border-2 border-white/[0.08] flex items-center justify-center overflow-hidden backdrop-blur-sm z-10 shadow-inner">
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-500 group-hover/photo:text-brand-blue transition-colors" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/photo:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : <Camera className="w-8 h-8 text-white scale-90 group-hover/photo:scale-100 transition-transform" />}
                                        <span className="text-[10px] text-white uppercase font-bold mt-2 tracking-widest leading-tight">Upload<br />Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-[0.2em] font-bold">Profile Picture Required</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2 relative reg-element">
                                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">Full Name</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3 h-5 w-5 text-gray-500/50 group-focus-within:text-brand-blue transition-colors" />
                                    <Input
                                        id="name"
                                        placeholder="Your Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-12 h-12 w-full bg-white/[0.02] border-white/[0.08] focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/30 text-white rounded-xl placeholder:text-gray-600 shadow-inner transition-all focus:bg-white/[0.04]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative reg-element">
                                <Label htmlFor="email" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3 h-5 w-5 text-gray-500/50 group-focus-within:text-brand-red transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="player@university.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-12 h-12 w-full bg-white/[0.02] border-white/[0.08] focus:border-brand-red focus:ring-1 focus:ring-brand-red/30 text-white rounded-xl placeholder:text-gray-600 shadow-inner transition-all focus:bg-white/[0.04]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 reg-element">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="batch" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1 hover:text-brand-yellow transition-colors">Batch / Class</Label>
                                    <select
                                        id="batch"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-white focus-visible:outline-none focus:border-brand-yellow focus-visible:ring-1 focus-visible:ring-brand-yellow/30 shadow-inner transition-all appearance-none uppercase tracking-wider focus:bg-white/[0.04]"
                                    >
                                        {['ICE', 'ICT', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th'].map(b => (
                                            <option key={b} value={b} className="bg-[#111827] text-white py-2 uppercase">
                                                {['ICE', 'ICT'].includes(b) ? b : `${b} Batch`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="role" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1 hover:text-brand-blue transition-colors">Playing Role</Label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-white focus-visible:outline-none focus:border-brand-blue focus-visible:ring-1 focus-visible:ring-brand-blue/30 shadow-inner transition-all appearance-none uppercase tracking-wider focus:bg-white/[0.04]"
                                    >
                                        {['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map(r => (
                                            <option key={r} value={r} className="bg-[#111827] text-white py-2 uppercase">{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 relative reg-element">
                                <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-gray-400 font-bold ml-1">Phone (Optional)</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-3 h-5 w-5 text-gray-500/50 group-focus-within:text-brand-yellow transition-colors" />
                                    <Input
                                        id="phone"
                                        placeholder="01712345678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-12 h-12 w-full bg-white/[0.02] border-white/[0.08] focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow/30 text-white rounded-xl placeholder:text-gray-600 shadow-inner transition-all tracking-widest focus:bg-white/[0.04]"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="reg-element w-full text-sm font-bold h-14 mt-6 uppercase tracking-[0.2em] bg-gradient-to-r from-brand-red to-orange-500 hover:from-red-600 hover:to-orange-600 text-white relative overflow-hidden group shadow-[0_0_20px_rgba(255,59,48,0.15)] hover:shadow-[0_0_30px_rgba(255,59,48,0.3)] transition-all rounded-xl transform active:scale-95" isLoading={loading}>
                                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                                <span className="relative flex items-center justify-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Enter the Draft Pool
                                </span>
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 border-t border-white/[0.04] text-center bg-white/[0.01] reg-element">
                        <div className="text-xs tracking-wider uppercase text-gray-500 font-bold">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-blue hover:text-white transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
