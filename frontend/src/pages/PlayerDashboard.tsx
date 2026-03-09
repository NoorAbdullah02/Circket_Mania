import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Camera, User, Phone, MapPin, Shield, Edit, Check, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function PlayerDashboard() {
    const { user, player } = useAuthStore();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: '',
        role: player?.role || 'Batsman',
        battingStyle: player?.battingStyle || 'Right-hand bat',
        bowlingStyle: player?.bowlingStyle || 'Right-arm offbreak',
        jerseyNumber: player?.jerseyNumber?.toString() || '',
        bio: player?.bio || '',
    });

    const [uploading, setUploading] = useState(false);

    const { data: teamInfo, isLoading: loadingTeam } = useQuery({
        queryKey: ['team', player?.teamId],
        queryFn: async () => {
            if (!player?.teamId) return null;
            const { data } = await api.get(`/teams/${player.teamId}`);
            return data;
        },
        enabled: !!player?.teamId,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.put('/players/profile', data);
        },
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        },
        onError: (error: any) => toast.error(error.response?.data?.error || 'Update failed')
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/upload?folder=players', formData);

            updateProfileMutation.mutate({ profileImage: data.url });
        } catch (error) {
            toast.error('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate({
            ...formData,
            jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null,
        });
    };

    const [token, setToken] = useState('');
    const [verifying, setVerifying] = useState(false);

    const verifyTokenMutation = useMutation({
        mutationFn: async (token: string) => api.post('/players/verify-token', { token }),
        onSuccess: (res) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed')
    });

    if (!user || !player) return null;

    if (player.status !== 'activated') {
        return (
            <div className="max-w-md mx-auto px-4 py-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border-brand-yellow/30">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="w-8 h-8 text-brand-yellow" />
                        </div>
                        <h2 className="text-2xl font-heading tracking-widest text-white uppercase">Profile Locked</h2>
                        <p className="text-gray-400 text-sm mt-2">Enter the verification token sent to your email to unlock your player profile.</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); verifyTokenMutation.mutate(token); }} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="token" className="text-xs uppercase tracking-widest text-brand-blue">Verification Token</Label>
                            <Input
                                id="token"
                                placeholder="Enter 6-digit token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="text-center text-2xl tracking-[1em] font-bold h-14 bg-black/50 border-white/10"
                                maxLength={6}
                                required
                            />
                        </div>
                        <Button className="w-full h-12 bg-brand-yellow text-black hover:bg-yellow-500 font-bold uppercase tracking-widest" disabled={verifyTokenMutation.isPending}>
                            {verifyTokenMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UNLOCK PROFILE'}
                        </Button>
                        <p className="text-[10px] text-gray-500 text-center uppercase tracking-tighter">
                            Token was sent when you were assigned to <span className="text-brand-blue">{teamInfo?.name || 'your team'}</span>
                        </p>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-heading tracking-widest text-white uppercase neon-text-blue">Player Dashboard</h1>
                <div className="glass-panel px-6 py-2 rounded-full inline-flex border border-emerald-500/30 items-center justify-center text-emerald-400 font-bold tracking-wider hover:bg-emerald-500/10 transition-colors uppercase">
                    <Check className="w-4 h-4 mr-2" /> Profile Verified
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="glass-card text-center overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-blue/40 to-brand-bg opacity-30 z-0" />
                        <CardContent className="pt-8 relative z-10">
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                <img
                                    src={player.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover border-4 border-brand-bg relative z-10 glass-panel"
                                />
                                <label className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : <Camera className="w-8 h-8 text-white mb-1" />}
                                    <span className="text-xs font-bold text-white uppercase tracking-widest">Upload photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <h2 className="text-2xl font-heading tracking-widest text-white">{user.name}</h2>
                            <p className="text-brand-blue">{player.batch} Batch</p>

                            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 uppercase text-[10px] tracking-widest">Team</span>
                                    <span className="font-bold text-white uppercase">
                                        {loadingTeam ? <Loader2 className="w-4 h-4 animate-spin" /> : (teamInfo?.name || 'Undrafted')}
                                    </span>
                                </div>
                                {player.isCaptain && (
                                    <div className="bg-brand-yellow/10 text-brand-yellow px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-center border border-brand-yellow/20">
                                        Team Captain
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/10">
                            <CardTitle className="text-xs font-heading tracking-widest uppercase text-gray-400">Career Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-white">{player.totalRuns}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Runs</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-brand-red">{player.totalWickets}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Wickets</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-brand-blue">{player.matchesPlayed}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Matches</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-bold text-brand-yellow">{player.totalSixes}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Sixes</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card className="glass-card">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="font-heading tracking-widest text-xl uppercase">Edit Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs uppercase tracking-widest">Display Name</Label>
                                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-xs uppercase tracking-widest">Playing Role</Label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                                        >
                                            <option className="bg-[#111827]">Batsman</option>
                                            <option className="bg-[#111827]">Bowler</option>
                                            <option className="bg-[#111827]">All-rounder</option>
                                            <option className="bg-[#111827]">Wicket-keeper</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="jerseyNumber" className="text-xs uppercase tracking-widest">Jersey Number</Label>
                                        <Input
                                            id="jerseyNumber"
                                            type="number"
                                            value={formData.jerseyNumber}
                                            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="battingStyle" className="text-xs uppercase tracking-widest">Batting Style</Label>
                                        <Input id="battingStyle" value={formData.battingStyle} onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bowlingStyle" className="text-xs uppercase tracking-widest">Bowling Style</Label>
                                        <Input id="bowlingStyle" value={formData.bowlingStyle} onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2 mt-6">
                                    <Label htmlFor="bio" className="text-xs uppercase tracking-widest">Player Bio</Label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="flex w-full rounded-md border border-white/20 bg-black/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue resize-none"
                                        placeholder="Tell us about your cricketing journey..."
                                    />
                                </div>

                                <Button type="submit" className="w-full mt-4 bg-brand-blue hover:bg-blue-600 font-bold uppercase tracking-widest h-12" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'SAVE PROFILE UPDATES'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Captain Team Edit Section */}
                    {player.isCaptain && teamInfo && (
                        <div className="mt-8">
                            <CaptainTeamEditor team={teamInfo} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CaptainTeamEditor({ team }: { team: any }) {
    const queryClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [teamData, setTeamData] = useState({
        name: team.name || '',
        logo: team.logo || '',
        color: team.color || '#0A84FF',
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const updateTeamMutation = useMutation({
        mutationFn: async (data: any) => api.put(`/teams/${team.id}`, data),
        onSuccess: () => {
            toast.success('Team updated successfully!');
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ['team', team.id] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingLogo(true);
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/upload?folder=teams', formData);
            setTeamData(prev => ({ ...prev, logo: data.url }));
            toast.success('Logo uploaded!');
        } catch (error) {
            toast.error('Logo upload failed');
        } finally {
            setUploadingLogo(false);
        }
    };

    return (
        <Card className="glass-card mt-6">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                <CardTitle className="font-heading tracking-widest text-sm uppercase text-brand-yellow">
                    <Shield className="w-4 h-4 inline mr-2" />Team Management
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" onClick={() => setEditing(!editing)}>
                    <Edit className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                {!editing ? (
                    <div className="text-center">
                        <img
                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                            alt={team.name}
                            className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-white/20"
                        />
                        <h3 className="text-lg font-heading text-white tracking-widest mt-3">{team.name}</h3>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                            <span className="text-xs text-gray-500">{team.color}</span>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); updateTeamMutation.mutate(teamData); }} className="space-y-4">
                        <div className="flex flex-col items-center">
                            <div className="relative w-20 h-20 group">
                                <div className="relative w-full h-full rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                                    {teamData.logo ? (
                                        <img src={teamData.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-8 h-8 text-gray-500" />
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                                        {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400 uppercase text-xs tracking-widest">Team Name</Label>
                            <Input value={teamData.name} onChange={(e) => setTeamData({ ...teamData, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-400 uppercase text-xs tracking-widest">Color</Label>
                            <div className="flex gap-2">
                                <Input type="color" className="w-10 h-10 p-1" value={teamData.color} onChange={(e) => setTeamData({ ...teamData, color: e.target.value })} />
                                <Input value={teamData.color} onChange={(e) => setTeamData({ ...teamData, color: e.target.value })} className="text-xs" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-brand-yellow text-black hover:bg-yellow-500" disabled={updateTeamMutation.isPending}>
                            {updateTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
