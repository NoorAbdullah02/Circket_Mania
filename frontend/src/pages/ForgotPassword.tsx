import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post('/auth/forgot-password', { email });
            toast.success(data.message);
            setSubmitted(true);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="glass-card text-center py-12">
                        <CardHeader>
                            <div className="mx-auto w-16 h-16 bg-brand-blue/20 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-brand-blue" />
                            </div>
                            <CardTitle className="text-2xl text-white">Check your email</CardTitle>
                            <CardDescription className="text-gray-400">
                                We've sent a password reset link to <br />
                                <span className="text-white font-medium">{email}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center flex-col space-y-4">
                            <Link to="/login">
                                <Button variant="outline">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back to Login
                                </Button>
                            </Link>
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                Didn't receive the email? Try again
                            </button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-purple-600 rounded-xl blur opacity-25"></div>
                <Card className="relative glass-card border border-white/20">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-white/10">
                        <CardTitle className="text-3xl font-heading tracking-widest text-white uppercase neon-text-blue">Recover Access</CardTitle>
                        <CardDescription className="text-gray-400">Enter your email for reset instructions</CardDescription>
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
                                        className="pl-10 h-10 bg-black/50 border-white/10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'SEND RESET LINK'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-4 border-t border-white/10 pb-6 text-center">
                        <Link to="/login" className="text-sm text-gray-400 hover:text-white flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Return to Login
                        </Link>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
