import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast.error('Token is missing');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.post('/auth/reset-password', { token, password });
            toast.success(data.message);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <Card className="glass-card text-center py-12 max-w-md w-full">
                    <CardHeader>
                        <AlertCircle className="mx-auto h-12 w-12 text-brand-red mb-4" />
                        <CardTitle className="text-2xl text-white">Invalid Request</CardTitle>
                        <CardDescription className="text-gray-400">
                            The reset token is missing or invalid. Please request a new link.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Link to="/forgot-password">
                            <Button>Request New Link</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card className="glass-card text-center py-12">
                        <CardHeader>
                            <CheckCircle2 className="mx-auto w-16 h-16 text-brand-green mb-4" />
                            <CardTitle className="text-2xl text-white">Password Updated!</CardTitle>
                            <CardDescription className="text-gray-400">
                                Your password has been successfully reset. <br />
                                You will be redirected to login shortly...
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center">
                            <Link to="/login">
                                <Button className="w-full">LOG IN NOW</Button>
                            </Link>
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
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-purple-600 rounded-xl blur opacity-25"></div>
                <Card className="relative glass-card border border-white/20">
                    <CardHeader className="space-y-1 text-center pb-8 border-b border-white/10">
                        <CardTitle className="text-3xl font-heading tracking-widest text-white uppercase neon-text-red">New Credentials</CardTitle>
                        <CardDescription className="text-gray-400">Set a secure password for your account</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 h-10 bg-black/50 border-white/10 text-white"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 h-10 bg-black/50 border-white/10 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" isLoading={loading}>
                                UPDATE PASSWORD
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
