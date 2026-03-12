import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Trophy, Lock, Calendar, MapPin, Clock, Crown, Flame, Sparkles, Users } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function FinalMatch() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [formData, setFormData] = useState({ date: '', time: '', venue: '' });
    const [passwordError, setPasswordError] = useState('');
    const queryClient = useQueryClient();

    const { data: finalMatch, isLoading } = useQuery({
        queryKey: ['final-match'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/matches/final');
                return data;
            } catch {
                return null;
            }
        },
        refetchInterval: 10000,
    });

    const createFinalMatchMutation = useMutation({
        mutationFn: async (data: any) => api.post('/matches/final/create', data),
        onSuccess: (res) => {
            toast.success('🏆 Final Match Created Successfully!');
            setShowCreateForm(false);
            setShowPasswordConfirm(false);
            setPassword('');
            setFormData({ date: '', time: '', venue: '' });
            queryClient.invalidateQueries({ queryKey: ['final-match'] });
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data?.error || 'Failed to create final match';
            toast.error(errorMsg);
        }
    });

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setPasswordError('Password is required');
            return;
        }
        createFinalMatchMutation.mutate(formData);
    };

    const isTournamentComplete = finalMatch?.isTournamentComplete;
    const winnerTeam = finalMatch?.winner;
    const teams = finalMatch ? [finalMatch.teamA, finalMatch.teamB] : [];

    return (
        <div className="space-y-8">
            {/* Tournament Winner Display */}
            {isTournamentComplete && winnerTeam && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative overflow-hidden rounded-3xl border-2 border-brand-yellow bg-gradient-to-br from-brand-yellow/10 via-black to-brand-red/10 p-8 shadow-2xl"
                >
                    {/* Animated background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-gradient-to-bl from-brand-yellow/20 to-transparent"
                        ></motion.div>
                    </div>

                    <div className="relative z-10 text-center">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mb-4 flex justify-center"
                        >
                            <Trophy className="h-20 w-20 text-brand-yellow drop-shadow-lg filter" />
                        </motion.div>

                        <h2 className="mb-2 font-heading text-4xl tracking-widest text-brand-yellow uppercase drop-shadow-lg">
                            🏆 Tournament Champion 🏆
                        </h2>

                        <div className="mt-6 flex items-center justify-center gap-6 md:gap-12">
                            {winnerTeam.logo && (
                                <motion.img
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    src={winnerTeam.logo}
                                    alt={winnerTeam.name}
                                    className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-brand-yellow object-cover drop-shadow-2xl"
                                />
                            )}
                            <div>
                                <h3 className="font-heading text-3xl md:text-5xl tracking-widest text-white uppercase drop-shadow-lg">
                                    {winnerTeam.name}
                                </h3>
                                <p className="mt-2 text-brand-yellow font-bold tracking-wider">CHAMPIONS</p>
                            </div>
                        </div>

                        {/* Confetti effect */}
                        <div className="mt-8 flex justify-center gap-2">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -30, -60],
                                        opacity: [1, 1, 0],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                    className={`h-2 w-2 rounded-full ${['bg-brand-yellow', 'bg-brand-red', 'bg-brand-blue'][i % 3]
                                        }`}
                                ></motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Final Match Card */}
            <Card className="glass-card border-2 border-brand-yellow/50">
                <CardHeader className="border-b border-brand-yellow/20 pb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <Crown className="h-8 w-8 text-brand-yellow" />
                            <CardTitle className="font-heading text-3xl tracking-widest uppercase text-brand-yellow">
                                Final Match
                            </CardTitle>
                        </div>
                        {!finalMatch?.match && (
                            <Button
                                onClick={() => setShowCreateForm(!showCreateForm)}
                                className="bg-gradient-to-r from-brand-yellow to-orange-500 hover:from-orange-500 hover:to-brand-red text-black font-bold uppercase tracking-wider"
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                Create Final Match
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-6">
                    {/* Create Form */}
                    {showCreateForm && !finalMatch?.match && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 space-y-6 rounded-2xl border border-brand-yellow/30 bg-black/40 p-6 backdrop-blur-xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="mt-2 bg-black/60 border-white/10 text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Time</Label>
                                    <Input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="mt-2 bg-black/60 border-white/10 text-white"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-bold text-gray-300 uppercase tracking-wider">Venue</Label>
                                <Input
                                    type="text"
                                    placeholder="Enter venue"
                                    value={formData.venue}
                                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                    className="mt-2 bg-black/60 border-white/10 text-white"
                                    required
                                />
                            </div>

                            {!showPasswordConfirm && (
                                <Button
                                    onClick={() => setShowPasswordConfirm(true)}
                                    className="w-full bg-gradient-to-r from-brand-red to-orange-500 hover:from-orange-500 hover:to-brand-red font-bold uppercase tracking-wider"
                                >
                                    <Lock className="mr-2 h-4 w-4" />
                                    Confirm with Password
                                </Button>
                            )}

                            {showPasswordConfirm && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 rounded-xl border border-brand-red/30 bg-brand-red/10 p-4"
                                >
                                    <div>
                                        <Label className="text-sm font-bold text-brand-red uppercase tracking-wider">
                                            Admin Password
                                        </Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setPasswordError('');
                                            }}
                                            className="mt-2 bg-black/60 border-brand-red/50 text-white"
                                        />
                                        {passwordError && (
                                            <p className="mt-2 text-xs text-brand-red font-bold">{passwordError}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleCreateSubmit}
                                            disabled={createFinalMatchMutation.isPending}
                                            className="flex-1 bg-gradient-to-r from-brand-yellow to-orange-500 text-black font-bold uppercase tracking-wider hover:from-orange-500 hover:to-brand-red"
                                        >
                                            {createFinalMatchMutation.isPending ? 'Creating...' : 'Create Final Match'}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowPasswordConfirm(false);
                                                setPassword('');
                                                setPasswordError('');
                                            }}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Final Match Display */}
                    {finalMatch?.match && (
                        <div className="space-y-6">
                            {/* Teams */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                {/* Team A */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
                                >
                                    {finalMatch.teamA?.logo && (
                                        <img
                                            src={finalMatch.teamA.logo}
                                            alt={finalMatch.teamA.name}
                                            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
                                        />
                                    )}
                                    <h3 className="font-heading text-xl tracking-widest text-white uppercase">
                                        {finalMatch.teamA?.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-400 font-bold">🏆 {finalMatch.teamA?.points || 0} Points</p>
                                </motion.div>

                                {/* VS */}
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="flex items-center justify-center"
                                >
                                    <div className="rounded-2xl bg-gradient-to-r from-brand-red to-orange-500 px-6 py-4">
                                        <p className="font-heading text-2xl tracking-widest text-white uppercase">VS</p>
                                    </div>
                                </motion.div>

                                {/* Team B */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center"
                                >
                                    {finalMatch.teamB?.logo && (
                                        <img
                                            src={finalMatch.teamB.logo}
                                            alt={finalMatch.teamB.name}
                                            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
                                        />
                                    )}
                                    <h3 className="font-heading text-xl tracking-widest text-white uppercase">
                                        {finalMatch.teamB?.name}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-400 font-bold">🏆 {finalMatch.teamB?.points || 0} Points</p>
                                </motion.div>
                            </div>

                            {/* Match Details */}
                            <div className="rounded-2xl border border-brand-yellow/20 bg-black/40 p-6">
                                <h4 className="mb-4 font-heading text-lg tracking-widest text-brand-yellow uppercase">Match Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-brand-yellow" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Date</p>
                                            <p className="font-bold text-white">{finalMatch.match?.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-brand-yellow" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Time</p>
                                            <p className="font-bold text-white">{finalMatch.match?.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-brand-yellow" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">Venue</p>
                                            <p className="font-bold text-white">{finalMatch.match?.venue}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Match Status */}
                            <div className="rounded-2xl bg-gradient-to-r from-brand-yellow/20 to-orange-500/20 border border-brand-yellow/30 p-6 text-center">
                                <div className="inline-block rounded-full bg-brand-yellow/20 px-4 py-2">
                                    <p className="font-bold text-brand-yellow uppercase tracking-wider">
                                        Status: <span className="text-white">{finalMatch.match?.status.toUpperCase()}</span>
                                    </p>
                                </div>
                                {finalMatch.match?.status === 'completed' && finalMatch.winner && (
                                    <p className="mt-4 font-heading text-2xl text-brand-yellow uppercase tracking-widest">
                                        🎉 {finalMatch.winner.name} Won The Tournament! 🎉
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* No Final Match Yet */}
                    {!finalMatch?.match && !showCreateForm && (
                        <div className="py-12 text-center">
                            <Flame className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-wider">Final Match Not Created Yet</p>
                            <p className="text-sm text-gray-500 mt-2">Click "Create Final Match" to begin the grand finale!</p>
                        </div>
                    )}

                    {isLoading && !finalMatch && (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 rounded-full border-4 border-gray-600 border-t-brand-yellow animate-spin"></div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
