import React, { useState, useRef } from 'react';
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
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function PlayerDashboard() {
    const { user, player, setPlayer } = useAuthStore();
    const queryClient = useQueryClient();
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

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

    useGSAP(() => {
        if (player?.status === 'activated' && !hasAnimated.current) {
            hasAnimated.current = true;
            const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
            tl.from('.dashboard-header', { y: -20, opacity: 0 })
                .from('.dashboard-card', { y: 30, opacity: 0, stagger: 0.15 }, '-=0.6');
        }
    }, { dependencies: [player?.status], scope: container });

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

    const verifyTokenMutation = useMutation({
        mutationFn: async (token: string) => api.post('/players/verify-token', { token }),
        onSuccess: (res) => {
            toast.success(res.data.message || 'Profile Unlocked! 🚀');
            if (res.data.player) {
                setPlayer(res.data.player);
            }
            queryClient.invalidateQueries({ queryKey: ['auth-me'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed')
    });

    if (!user || !player) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
        </div>
    );

    if (player.status !== 'activated') {
        return (
            <div className="max-w-md mx-auto px-4 py-20">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 border-brand-yellow/30 bg-black/40 backdrop-blur-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-yellow/20">
                            <Shield className="w-8 h-8 text-brand-yellow" />
                        </div>
                        <h2 className="text-2xl font-heading tracking-widest text-white uppercase neon-text-yellow">Profile Locked</h2>
                        <p className="text-gray-400 text-sm mt-3 leading-relaxed">Enter the verification token sent to your email to unlock your player profile.</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); verifyTokenMutation.mutate(token); }} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="token" className="text-xs uppercase tracking-widest text-brand-blue font-bold ml-1">Verification Token</Label>
                            <Input
                                id="token"
                                placeholder="••••••"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="text-center text-xl sm:text-2xl tracking-[0.5em] sm:tracking-[1em] font-bold h-14 bg-black/50 border-white/10 focus:border-brand-yellow transition-all"
                                maxLength={6}
                                required
                            />
                        </div>
                        <Button className="w-full h-14 bg-brand-yellow text-black hover:bg-yellow-500 font-bold uppercase tracking-[0.2em] transform active:scale-95 transition-all rounded-xl" disabled={verifyTokenMutation.isPending}>
                            {verifyTokenMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UNLOCK PROFILE'}
                        </Button>
                        <p className="text-[11px] text-gray-500 text-center uppercase tracking-widest leading-relaxed">
                            Token was sent when you were assigned to <br /> <span className="text-brand-blue font-bold">{teamInfo?.name || 'your team'}</span>
                        </p>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" ref={container}>
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 dashboard-header">
                <h1 className="text-4xl md:text-5xl font-heading tracking-widest text-white uppercase neon-text-blue">Player Dashboard</h1>
                <div className="glass-panel px-6 py-2 rounded-full inline-flex border border-emerald-500/30 items-center justify-center text-emerald-400 font-bold tracking-wider hover:bg-emerald-500/10 transition-colors uppercase text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Profile Verified
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-6">
                    <Card className="glass-card text-center overflow-hidden relative dashboard-card">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-blue/40 to-brand-bg opacity-30 z-0" />
                        <CardContent className="pt-8 relative z-10 font-sans">
                            <div className="relative w-32 h-32 mx-auto mb-4 group">
                                <img
                                    src={player.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover border-4 border-brand-bg relative z-10 glass-panel group-hover:scale-105 transition-transform duration-500"
                                />
                                <label className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity backdrop-blur-sm">
                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : <Camera className="w-8 h-8 text-white mb-1" />}
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Update Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <h2 className="text-2xl font-heading tracking-widest text-white uppercase">{user.name}</h2>
                            <p className="text-brand-blue font-bold tracking-widest uppercase text-xs mt-1">{player.batch} Batch</p>

                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 uppercase text-[10px] tracking-widest font-bold">Current Team</span>
                                    <span className="font-bold text-white uppercase tracking-wider">
                                        {loadingTeam ? <Loader2 className="w-4 h-4 animate-spin text-brand-blue" /> : (teamInfo?.name || 'Undrafted')}
                                    </span>
                                </div>
                                {player.isCaptain && (
                                    <div className="bg-brand-yellow/10 text-brand-yellow px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-center border border-brand-yellow/20 shadow-[0_0_15px_rgba(255,214,10,0.1)]">
                                        Team Captain
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card overflow-hidden dashboard-card">
                        <CardHeader className="bg-white/[0.02] border-b border-white/5 py-4">
                            <CardTitle className="text-[10px] font-heading tracking-[0.2em] uppercase text-gray-500 text-center">Live Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
                                <div className="p-5 text-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="text-2xl font-bold text-white font-heading">{player.totalRuns}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Total Runs</div>
                                </div>
                                <div className="p-5 text-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="text-2xl font-bold text-brand-red font-heading">{player.totalWickets}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Total Wickets</div>
                                </div>
                                <div className="p-5 text-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="text-2xl font-bold text-brand-blue font-heading">{player.matchesPlayed}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Matches</div>
                                </div>
                                <div className="p-5 text-center group hover:bg-white/[0.02] transition-colors">
                                    <div className="text-2xl font-bold text-brand-yellow font-heading">{player.totalFours}</div>
                                    <div className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">Total Fours</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-8">
                    <Card className="glass-card dashboard-card">
                        <CardHeader className="border-b border-white/5 py-6">
                            <CardTitle className="font-heading tracking-[0.2em] text-xl uppercase text-white">Identity Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <form onSubmit={handleSave} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Display Name</Label>
                                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-brand-blue transition-all" />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="role" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Playing Role</Label>
                                        <select
                                            id="role"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-all appearance-none"
                                        >
                                            <option className="bg-[#0b0f1a]">Batsman</option>
                                            <option className="bg-[#0b0f1a]">Bowler</option>
                                            <option className="bg-[#0b0f1a]">All-rounder</option>
                                            <option className="bg-[#0b0f1a]">Wicket-keeper</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="jerseyNumber" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Jersey Number</Label>
                                        <Input
                                            id="jerseyNumber"
                                            type="number"
                                            placeholder="e.g. 07"
                                            value={formData.jerseyNumber}
                                            onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                                            className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-brand-yellow font-bold tracking-widest transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="battingStyle" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Batting Style</Label>
                                        <Input id="battingStyle" placeholder="Right-hand bat" value={formData.battingStyle} onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-brand-blue transition-all" />
                                    </div>

                                    <div className="space-y-3 col-span-full">
                                        <Label htmlFor="bowlingStyle" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Bowling Style</Label>
                                        <Input id="bowlingStyle" placeholder="Right-arm fast" value={formData.bowlingStyle} onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl focus:border-brand-red transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="bio" className="text-[10px] uppercase tracking-widest font-bold text-gray-400 ml-1">Player Biography</Label>
                                    <textarea
                                        id="bio"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="flex w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-blue transition-all resize-none placeholder:text-gray-600"
                                        placeholder="Describe your style, favorite shots, and cricketing philosophy..."
                                    />
                                </div>

                                <Button type="submit" className="w-full text-xs font-bold h-14 mt-4 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white uppercase tracking-[0.2em] transform active:scale-[0.98] transition-all rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.2)]" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'SECURE PROFILE UPDATES'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Team Squad Section for Captain */}
                    {player.isCaptain && teamInfo?.players && (
                        <Card className="glass-card dashboard-card">
                            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-6">
                                <CardTitle className="font-heading tracking-[0.2em] text-xl uppercase text-white">Squad Manifest</CardTitle>
                                <div className="text-[9px] bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full border border-brand-blue/20 font-bold uppercase tracking-widest shadow-sm">
                                    {teamInfo.players.length} Active Elements
                                </div>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {teamInfo.players.map((p: any) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-brand-blue/30 transition-all group cursor-default"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={p.profileImage || `https://ui-avatars.com/api/?name=${p.name}&background=random`}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white/5 group-hover:border-brand-blue/40 transition-all duration-500"
                                                    alt={p.name}
                                                />
                                                {p.isCaptain && (
                                                    <div className="absolute -top-1 -right-1 bg-brand-yellow text-black rounded-full p-1 border-2 border-black shadow-lg">
                                                        <Shield className="w-2.5 h-2.5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-white text-sm group-hover:text-brand-blue transition-colors truncate uppercase tracking-wider">
                                                    {p.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{p.role || 'Player'}</span>
                                                    {p.jerseyNumber && (
                                                        <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/5 font-mono">#{p.jerseyNumber}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Captain Team Edit Section */}
                    {player.isCaptain && teamInfo && (
                        <div className="dashboard-card pt-4">
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
        coverPhoto: team.coverPhoto || '',
        color: team.color || '#38BDF8',
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingCover(true);
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/upload?folder=teams', formData);
            setTeamData(prev => ({ ...prev, coverPhoto: data.url }));
            toast.success('Cover photo uploaded!');
        } catch (error) {
            toast.error('Cover upload failed');
        } finally {
            setUploadingCover(false);
        }
    };

    return (
        <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                <CardTitle className="font-heading tracking-[0.2em] text-sm uppercase text-brand-yellow flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Team Franchise Ops
                </CardTitle>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 uppercase text-[10px] font-bold tracking-widest px-4 rounded-xl" onClick={() => setEditing(!editing)}>
                    {editing ? 'Cancel' : <><Edit className="w-3 h-3 mr-2" /> Modify</>}
                </Button>
            </CardHeader>
            <CardContent className="pt-8">
                <AnimatePresence mode="wait">
                    {!editing ? (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center relative rounded-2xl overflow-hidden pt-12 pb-8 border border-white/5 shadow-2xl"
                            style={{
                                backgroundImage: team.coverPhoto ? `url(${team.coverPhoto})` : `linear-gradient(to bottom right, ${team.color}20, transparent)`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-0"></div>
                            <div className="relative z-10">
                                <img
                                    src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                    alt={team.name}
                                    className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-black/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] bg-black"
                                />
                                <h3 className="text-3xl font-heading text-white tracking-[0.2em] uppercase mt-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{team.name}</h3>
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-md">
                                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: team.color, color: team.color }} />
                                    <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-300">Franchise Color</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="edit"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onSubmit={(e) => { e.preventDefault(); updateTeamMutation.mutate(teamData); }}
                            className="space-y-6"
                        >
                            <div className="flex flex-col sm:flex-row gap-8 items-start justify-center px-2">
                                <div className="relative w-32 h-32 group shrink-0">
                                    <div className="relative w-full h-full rounded-full bg-black border-[4px] border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                                        {teamData.logo ? (
                                            <img src={teamData.logo} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Shield className="w-10 h-10 text-gray-500" />
                                        )}
                                        <label className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 rounded-full backdrop-blur-sm">
                                            {uploadingLogo ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6 text-white mb-2" />}
                                            <span className="text-[8px] uppercase font-bold tracking-widest text-white">Logo</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                </div>

                                <div className="relative h-32 w-full group rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                                    {teamData.coverPhoto ? (
                                        <img src={teamData.coverPhoto} alt="Cover" className="w-full h-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                                            <span className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">Base Cover Texture</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 backdrop-blur-sm">
                                        {uploadingCover ? <Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /> : <Camera className="w-8 h-8 text-white mb-2" />}
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-brand-yellow">Franchise Banner</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-gray-500 uppercase text-[10px] tracking-widest font-bold ml-1">Franchise Designation</Label>
                                    <Input value={teamData.name} onChange={(e) => setTeamData({ ...teamData, name: e.target.value })} className="h-12 bg-black/40 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-gray-500 uppercase text-[10px] tracking-widest font-bold ml-1">Brand Signature Color</Label>
                                    <div className="flex h-12 w-full rounded-xl border border-white/10 bg-black/40 px-4 items-center gap-4">
                                        <input type="color" className="w-8 h-8 bg-transparent border-0 cursor-pointer rounded-lg" value={teamData.color} onChange={(e) => setTeamData({ ...teamData, color: e.target.value })} />
                                        <span className="text-xs font-mono text-gray-400 font-bold uppercase">{teamData.color}</span>
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 bg-brand-yellow text-black hover:bg-yellow-500 font-bold uppercase tracking-[0.2em] transform active:scale-[0.98] transition-all rounded-xl shadow-[0_0_20px_rgba(255,214,10,0.2)]" disabled={updateTeamMutation.isPending}>
                                {updateTeamMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'COMMIT FRANCHISE CHANGES'}
                            </Button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card >
    );
}

