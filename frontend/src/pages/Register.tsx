import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, User, Phone, CheckCircle, Loader2, Camera } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

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

    const navigate = useNavigate();

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
                    <Card className="glass-card text-center max-w-lg p-8">
                        <CheckCircle className="w-20 h-20 text-brand-yellow mx-auto mb-6" />
                        <CardTitle className="neon-text-yellow text-3xl mb-4 font-heading">Successfully Drafted!</CardTitle>
                        <CardDescription className="text-lg text-gray-300">
                            Your details have successfully entered the ICE Cricket Mania – Season 2 drafting pool.
                        </CardDescription>
                        <p className="mt-6 text-gray-400">
                            When an admin selects you for a franchise, you will receive an activation link via email to create your password and set up your profile.
                        </p>
                        <Button variant="outline" className="mt-8" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 px-4 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-brand-yellow rounded-xl blur opacity-25"></div>
                <Card className="relative glass-card border border-white/20">
                    <CardHeader className="text-center pb-8 border-b border-white/10">
                        <CardTitle className="text-3xl font-heading tracking-widest text-white uppercase neon-text-red">Tournament Draft</CardTitle>
                        <CardDescription className="text-gray-400">Register in the drafting pool</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-4">
                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative w-32 h-32 group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-brand-red rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
                                <div className="relative w-full h-full rounded-full bg-black border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                    {formData.profileImage ? (
                                        <img src={formData.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-8 h-8 text-white" />}
                                        <span className="text-[10px] text-white uppercase font-bold mt-1">Upload Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3 uppercase tracking-widest font-bold">Profile Picture Required</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="name"
                                        placeholder="Sultan Ahmed"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-10 h-10 w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="player@university.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10 h-10 w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 relative">
                                    <Label htmlFor="batch">Batch / Class</Label>
                                    <select
                                        id="batch"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        {['13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th'].map(b => (
                                            <option key={b} value={b} className="bg-[#111827] text-white py-2">{b} Batch</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2 relative">
                                    <Label htmlFor="role">Playing Role</Label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                    >
                                        {['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'].map(r => (
                                            <option key={r} value={r} className="bg-[#111827] text-white py-2">{r}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="phone">Phone (Optional)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="phone"
                                        placeholder="01712345678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-10 h-10 w-full"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full text-lg h-12 mt-6 uppercase" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enter the Draft pool'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-white/10 pb-6 text-center">
                        <div className="text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brand-blue hover:text-brand-blue/80 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
