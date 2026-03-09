import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Calendar, Loader2, Database, Plus, Search, Edit, Trash2, Camera, Activity, Crown, Check, X, Star, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const PIE_COLORS = ['#0A84FF', '#FFD60A', '#FF3B30', '#22C55E', '#A855F7', '#EC4899'];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data } = await api.get('/matches/dashboard-stats');
            return data;
        },
        refetchInterval: 30000,
    });

    const { data: teams, isLoading: loadingTeams } = useQuery({
        queryKey: ['admin-teams'],
        queryFn: async () => {
            const { data } = await api.get('/teams');
            return data;
        },
    });

    const { data: matches, isLoading: loadingMatches } = useQuery({
        queryKey: ['admin-matches'],
        queryFn: async () => {
            const { data } = await api.get('/matches');
            return data;
        },
    });

    const { data: players, isLoading: loadingPlayers } = useQuery({
        queryKey: ['admin-players'],
        queryFn: async () => {
            const { data } = await api.get('/players?limit=100');
            return data;
        },
    });

    const filteredPlayers = players?.filter((player: any) => {
        const query = searchQuery.toLowerCase();
        return player.name?.toLowerCase().includes(query) || player.batch?.toLowerCase().includes(query);
    });

    const generateMatchesMutation = useMutation({
        mutationFn: async (data: any) => api.post('/matches/auto-generate', data),
        onSuccess: (res) => {
            toast.success(res.data.message);
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to generate matches')
    });

    const handleGenerateMatches = () => {
        if (confirm('Are you sure you want to auto-generate league matches?')) {
            generateMatchesMutation.mutate({
                matchesPerTeam: 3,
                defaultOvers: 10,
                venue: 'University Central Ground',
                startDate: new Date().toISOString().split('T')[0],
                startTime: '10:00',
            });
        }
    };

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [assigningPlayer, setAssigningPlayer] = useState<any>(null);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [showMatchForm, setShowMatchForm] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', shortName: '', color: '#0A84FF', logo: '' });
    const [newMatch, setNewMatch] = useState({
        teamAId: '', teamBId: '', date: '', time: '',
        venue: 'University Central Ground', overs: 10, matchType: 'league'
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingScoreboard, setUploadingScoreboard] = useState(false);

    // Scoring states
    const [scoringMatch, setScoringMatch] = useState<any>(null);
    const [matchPlayerStatsData, setMatchPlayerStatsData] = useState<any[]>([]);
    const [scoreUpdates, setScoreUpdates] = useState({
        teamARuns: 0, teamAWickets: 0, teamAOversPlayed: 0,
        teamBRuns: 0, teamBWickets: 0, teamBOversPlayed: 0,
        currentInnings: 1
    });

    const createTeamMutation = useMutation({
        mutationFn: async (data: any) => api.post('/teams', data),
        onSuccess: () => {
            toast.success('Team created successfully');
            setShowCreateForm(false);
            setNewTeam({ name: '', shortName: '', color: '#0A84FF', logo: '' });
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create team')
    });

    const updateTeamMutation = useMutation({
        mutationFn: async (data: any) => api.put(`/teams/${data.id}`, data),
        onSuccess: () => {
            toast.success('Team updated successfully');
            setEditingTeam(null);
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update team')
    });

    const deleteTeamMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/teams/${id}`),
        onSuccess: () => {
            toast.success('Team deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete team')
    });

    const assignPlayerMutation = useMutation({
        mutationFn: async ({ playerId, teamId }: { playerId: string, teamId: string }) =>
            api.post('/teams/assign-players', { playerIds: [playerId], teamId }),
        onSuccess: () => {
            toast.success('Player assigned and activation email sent!');
            setAssigningPlayer(null);
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to assign player')
    });

    const updatePlayerMutation = useMutation({
        mutationFn: async (data: any) => api.put(`/players/${data.id}`, data),
        onSuccess: () => {
            toast.success('Player details updated successfully!');
            setEditingPlayer(null);
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update player')
    });

    const deletePlayerMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/players/${id}`),
        onSuccess: () => {
            toast.success('Player deleted successfully!');
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete player')
    });

    const updateMatchStatsMutation = useMutation({
        mutationFn: async ({ matchId, stats }: { matchId: string, stats: any[] }) =>
            api.put(`/matches/${matchId}/player-stats`, { stats }),
        onSuccess: () => {
            toast.success('Match player stats updated!');
            queryClient.invalidateQueries({ queryKey: ['match'] });
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update player stats')
    });

    const updateMatchScoreMutation = useMutation({
        mutationFn: async ({ matchId, score }: { matchId: string, score: any }) =>
            api.put(`/matches/${matchId}/score`, score),
        onSuccess: () => {
            toast.success('Match score updated!');
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update score')
    });

    const completeMatchMutation = useMutation({
        mutationFn: async ({ matchId, data }: { matchId: string, data: any }) =>
            api.put(`/matches/${matchId}/complete`, data),
        onSuccess: () => {
            toast.success('Match completed and points updated!');
            setScoringMatch(null);
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to complete match')
    });

    const createMatchMutation = useMutation({
        mutationFn: async (data: any) => api.post('/matches', data),
        onSuccess: () => {
            toast.success('Match created and notifications sent! ✔️');
            setShowMatchForm(false);
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create match')
    });

    const updateMatchMutation = useMutation({
        mutationFn: async (data: any) => api.put(`/matches/${data.id}`, data),
        onSuccess: () => {
            toast.success('Match updated and notifications sent! ✔️');
            setEditingMatch(null);
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update match')
    });

    const deleteMatchMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/matches/${id}`),
        onSuccess: () => {
            toast.success('Match deleted! ✔️');
            queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete match')
    });

    const handleScoreboardUpload = async (e: React.ChangeEvent<HTMLInputElement>, match: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingScoreboard(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const { data } = await api.post('/upload?folder=matches', uploadData);

            await api.put(`/matches/${match.id}`, { scoreboardImage: data.url });
            setScoringMatch({ ...match, scoreboardImage: data.url });
            toast.success('Scoreboard uploaded! 📸');
        } catch (error) {
            toast.error('Scoreboard upload failed');
        } finally {
            setUploadingScoreboard(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingLogo(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const { data } = await api.post('/upload?folder=teams', uploadData);

            if (isEditing) {
                setEditingTeam({ ...editingTeam, logo: data.url });
            } else {
                setNewTeam({ ...newTeam, logo: data.url });
            }
            toast.success('Logo uploaded!');
        } catch (error) {
            toast.error('Logo upload failed');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault();
        createTeamMutation.mutate(newTeam);
    };

    const startScoring = async (match: any) => {
        try {
            setScoringMatch(match);

            // 1. Fetch current scoreboard
            const { data: scoreData } = await api.get(`/matches/${match.id}`);
            if (scoreData.score) {
                setScoreUpdates({
                    teamARuns: scoreData.score.teamARuns || 0,
                    teamAWickets: scoreData.score.teamAWickets || 0,
                    teamAOversPlayed: scoreData.score.teamAOversPlayed || 0,
                    teamBRuns: scoreData.score.teamBRuns || 0,
                    teamBWickets: scoreData.score.teamBWickets || 0,
                    teamBOversPlayed: scoreData.score.teamBOversPlayed || 0,
                    currentInnings: scoreData.score.currentInnings || 1
                });
            }

            // 2. Fetch existing player-match stats
            const { data: playerStats } = await api.get(`/matches/${match.id}/player-stats`);

            if (playerStats && playerStats.length > 0) {
                setMatchPlayerStatsData(playerStats);
            } else {
                // Initialize with players from both teams
                const { data: teamA } = await api.get(`/teams/${match.teamAId}`);
                const { data: teamB } = await api.get(`/teams/${match.teamBId}`);

                const initialStats: any[] = [];
                [...(teamA.players || []), ...(teamB.players || [])].forEach((p: any) => {
                    initialStats.push({
                        playerId: p.id,
                        playerName: p.name || p.user?.name,
                        teamId: p.teamId,
                        runsScored: 0,
                        ballsFaced: 0,
                        fours: 0,
                        sixes: 0,
                        wickets: 0,
                        runsConceded: 0,
                        ballsBowled: 0,
                        catches: 0
                    });
                });
                setMatchPlayerStatsData(initialStats);
            }
        } catch (error) {
            toast.error('Failed to initialize scoring data');
        }
    };

    const handlePlayerStatChange = (playerId: string, field: string, value: number) => {
        setMatchPlayerStatsData(prev => prev.map(p =>
            p.playerId === playerId ? { ...p, [field]: value } : p
        ));
    };

    const saveScoring = async () => {
        try {
            // Update score
            await updateMatchScoreMutation.mutateAsync({ matchId: scoringMatch.id, score: scoreUpdates });
            // Update player stats
            await updateMatchStatsMutation.mutateAsync({ matchId: scoringMatch.id, stats: matchPlayerStatsData });
        } catch (error) { }
    };

    const finalizeMatch = async (winnerTeamId: string, manOfTheMatchId: string) => {
        if (!winnerTeamId) return toast.error('Please select a winner');
        completeMatchMutation.mutate({
            matchId: scoringMatch.id,
            data: { winnerTeamId, manOfTheMatch: manOfTheMatchId, status: 'completed' }
        });
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Database className="w-4 h-4" /> },
        { id: 'teams', label: 'Franchises', icon: <Shield className="w-4 h-4" /> },
        { id: 'players', label: 'Draft Pool', icon: <Users className="w-4 h-4" /> },
        { id: 'matches', label: 'Match Settings', icon: <Calendar className="w-4 h-4" /> },
        { id: 'history', label: 'Tournament History', icon: <History className="w-4 h-4" /> },
    ];

    // Prepare chart data
    const pieData = stats?.batchDistribution ? Object.keys(stats.batchDistribution).map(key => ({
        name: `${key} Batch`,
        value: stats.batchDistribution[key]
    })) : [];

    const lineData = stats?.teamPerformance ? stats.teamPerformance.map((t: any) => ({
        name: t.team.substring(0, 3).toUpperCase(),
        points: t.points,
        NRR: t.nrr
    })) : [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl md:text-5xl font-heading tracking-widest text-white uppercase neon-text-red">Admin Control</h1>
                    <p className="text-gray-400 mt-2">Manage tournament parameters and drafting</p>
                </div>

                <div className="flex gap-2 bg-black/50 p-1.5 rounded-lg border border-white/10 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-heading tracking-wider transition-all duration-300 text-sm whitespace-nowrap
                ${activeTab === tab.id
                                    ? 'bg-brand-red text-white shadow-[0_0_15px_rgba(255,59,48,0.3)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {loadingStats ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Total Franchises', value: stats?.totalTeams, color: 'text-brand-blue' },
                                            { label: 'Registered Players', value: stats?.totalPlayers, color: 'text-brand-yellow' },
                                            { label: 'Drafted/Selected', value: stats?.selectedPlayers, color: 'text-emerald-400' },
                                            { label: 'Matches Scheduled', value: stats?.totalMatches, color: 'text-brand-red' },
                                        ].map((stat, i) => (
                                            <Card key={i} className="glass-card hover:border-brand-blue/30 transition-all border-white/10">
                                                <CardContent className="p-6">
                                                    <p className="text-gray-400 text-sm font-heading tracking-widest uppercase">{stat.label}</p>
                                                    <p className={`text-5xl font-bold font-heading mt-2 ${stat.color}`}>{stat.value}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                        <Card className="glass-card">
                                            <CardHeader>
                                                <CardTitle className="font-heading tracking-widest">Player Distribution</CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64">
                                                {pieData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={pieData}
                                                                innerRadius={60}
                                                                outerRadius={80}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {pieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="glass-card">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="font-heading tracking-widest">Team Performance Points</CardTitle>
                                            </CardHeader>
                                            <CardContent className="h-64">
                                                {lineData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <LineChart data={lineData}>
                                                            <XAxis dataKey="name" stroke="#666" />
                                                            <YAxis stroke="#666" />
                                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                            <Line type="monotone" dataKey="points" stroke="#0A84FF" strokeWidth={3} dot={{ r: 5 }} />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-gray-500">No data available</div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card className="glass-card lg:col-span-2">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="font-heading tracking-widest">Auto Schedule Mechanism</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
                                                <p className="text-center text-gray-400 text-sm max-w-sm">
                                                    Generate a full round-robin tournament schedule based on current tournament settings.
                                                </p>
                                                <Button onClick={handleGenerateMatches} disabled={generateMatchesMutation.isPending} className="bg-brand-red hover:bg-red-700 mx-auto w-full max-w-xs h-12">
                                                    {generateMatchesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                                                    GENERATE SCHEDULE
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'teams' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-black/40 p-4 border border-white/10 rounded-xl backdrop-blur-md">
                                <h2 className="text-xl font-heading tracking-widest text-white">Registered Franchises</h2>
                                <Button
                                    variant="outline"
                                    className="border-brand-blue text-brand-blue hover:bg-brand-blue/20 gap-2"
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                >
                                    <Plus className="w-4 h-4" /> {showCreateForm ? 'Cancel' : 'Create Team'}
                                </Button>
                            </div>

                            <AnimatePresence>
                                {showCreateForm && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="glass-card mb-8 border-brand-blue/30">
                                            <CardContent className="p-6">
                                                <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative w-20 h-20 group">
                                                            <div className="relative w-full h-full rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                                                                {newTeam.logo ? (
                                                                    <img src={newTeam.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Shield className="w-8 h-8 text-gray-500" />
                                                                )}
                                                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 uppercase mt-1">Team Logo</span>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Team Name</Label>
                                                        <Input
                                                            placeholder="e.g. Dhaka Gladiators"
                                                            value={newTeam.name}
                                                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Short Name</Label>
                                                        <Input
                                                            placeholder="DGL"
                                                            maxLength={3}
                                                            value={newTeam.shortName}
                                                            onChange={(e) => setNewTeam({ ...newTeam, shortName: e.target.value.toUpperCase() })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Color</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="color"
                                                                className="w-10 h-10 p-1 bg-black/40 border-white/20"
                                                                value={newTeam.color}
                                                                onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                                                            />
                                                            <Input
                                                                value={newTeam.color}
                                                                onChange={(e) => setNewTeam({ ...newTeam, color: e.target.value })}
                                                                className="text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="bg-brand-blue hover:bg-blue-600 h-10 uppercase tracking-widest text-xs" disabled={createTeamMutation.isPending}>
                                                        {createTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                                    </Button>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}

                                {editingTeam && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="glass-card mb-8 border-brand-yellow/30">
                                            <CardContent className="p-6">
                                                <form onSubmit={(e) => { e.preventDefault(); updateTeamMutation.mutate(editingTeam); }} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative w-20 h-20 group">
                                                            <div className="relative w-full h-full rounded-full bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                                                                {editingTeam.logo ? (
                                                                    <img src={editingTeam.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Shield className="w-8 h-8 text-gray-500" />
                                                                )}
                                                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 uppercase mt-1">Update Logo</span>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Team Name</Label>
                                                        <Input
                                                            value={editingTeam.name}
                                                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Short Name</Label>
                                                        <Input
                                                            maxLength={3}
                                                            value={editingTeam.shortName}
                                                            onChange={(e) => setEditingTeam({ ...editingTeam, shortName: e.target.value.toUpperCase() })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Color</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                type="color"
                                                                value={editingTeam.color}
                                                                onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                                                            />
                                                            <Input
                                                                value={editingTeam.color}
                                                                onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                                                                className="text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="submit" className="bg-brand-yellow text-black hover:bg-yellow-500 h-10 flex-1" disabled={updateTeamMutation.isPending}>
                                                            {updateTeamMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        </Button>
                                                        <Button type="button" variant="ghost" className="h-10 border border-white/10" onClick={() => setEditingTeam(null)}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {loadingTeams ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {teams?.map((team: any) => (
                                        <Card key={team.id} className="glass-card group overflow-hidden">
                                            <div className="h-24 relative overflow-hidden">
                                                <div
                                                    className="absolute inset-0 opacity-40"
                                                    style={{ backgroundColor: team.color || '#0A84FF' }}
                                                />
                                                <div className="absolute top-2 right-2 flex gap-1 z-20">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-black/40 hover:bg-brand-yellow hover:text-black" onClick={() => setEditingTeam(team)}>
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-black/40 hover:bg-brand-red text-white" onClick={() => { if (confirm('Delete team?')) deleteTeamMutation.mutate(team.id); }}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="px-6 pb-6 relative pt-0">
                                                <img
                                                    src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                                    alt={team.name}
                                                    className="w-20 h-20 rounded-full bg-black border-4 border-black -mt-10 mx-auto object-cover relative z-10 glass-panel shadow-xl group-hover:shadow-[0_0_20px_rgba(10,132,255,0.4)] transition-all"
                                                />
                                                <div className="text-center mt-4">
                                                    <h3 className="text-2xl font-heading tracking-widest text-white">{team.name}</h3>
                                                    <p className="text-brand-yellow font-bold tracking-widest uppercase">{team.shortName}</p>
                                                    <div className="mt-4 flex flex-col items-center gap-2 text-xs text-gray-500 uppercase tracking-tighter">
                                                        <span>Players: {team.players?.length || 0}</span>
                                                        <span className="w-16 h-1 rounded-full opacity-70" style={{ backgroundColor: team.color }}></span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'players' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-black/40 p-4 border border-white/10 rounded-xl backdrop-blur-md flex-col sm:flex-row gap-4">
                                <h2 className="text-xl font-heading tracking-widest text-white">Draft Pool</h2>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:flex-none">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <Input
                                            placeholder="Search name or batch..."
                                            className="pl-9 bg-black/50 border-white/20 text-white w-full sm:w-64 focus-visible:ring-brand-yellow"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="glass-panel px-4 py-1.5 rounded-md text-brand-yellow text-sm font-bold tracking-wider whitespace-nowrap">
                                        Pool: {players?.length || 0}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {assigningPlayer && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                                    >
                                        <Card className="glass-card w-full max-w-md border-brand-blue/30 p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-heading tracking-widest text-white uppercase">Assign to Franchise</h3>
                                                <Button variant="ghost" size="sm" onClick={() => setAssigningPlayer(null)}><X /></Button>
                                            </div>
                                            <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-xl">
                                                <img src={assigningPlayer.profileImage || `https://ui-avatars.com/api/?name=${assigningPlayer.name}`} className="w-12 h-12 rounded-full border border-white/20" />
                                                <div>
                                                    <div className="text-white font-bold">{assigningPlayer.name}</div>
                                                    <div className="text-xs text-brand-blue font-bold uppercase">{assigningPlayer.role}</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {teams?.map((team: any) => (
                                                    <Button
                                                        key={team.id}
                                                        variant="outline"
                                                        className="justify-start gap-4 hover:border-brand-blue group h-14"
                                                        onClick={() => assignPlayerMutation.mutate({ playerId: assigningPlayer.id, teamId: team.id })}
                                                        disabled={assignPlayerMutation.isPending}
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center overflow-hidden">
                                                            <img src={team.logo || `https://ui-avatars.com/api/?name=${team.name}`} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <div className="text-sm font-bold text-white uppercase">{team.name}</div>
                                                            <div className="text-[10px] text-gray-500">{team.players?.length || 0} Slots Filled</div>
                                                        </div>
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                                                    </Button>
                                                ))}
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {loadingPlayers ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
                            ) : (
                                <div className="overflow-x-auto glass-card rounded-xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/60 border-b border-white/10 uppercase text-xs tracking-widest font-heading text-gray-400">
                                                <th className="px-6 py-4">Player</th>
                                                <th className="px-6 py-4">Batch</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredPlayers?.map((player: any) => (
                                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white font-heading overflow-hidden">
                                                                {player.profileImage ? <img src={player.profileImage} className="w-full h-full object-cover" /> : player.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-medium flex items-center gap-2">
                                                                    {player.name}
                                                                    {player.userRole === 'admin' && <Crown className="w-3 h-3 text-brand-yellow" />}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{player.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-brand-blue text-sm">{player.batch}</td>
                                                    <td className="px-6 py-4 text-gray-300 text-sm">{player.role || 'Undecided'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest ${player.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                            {player.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        {player.status === 'pending' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-brand-blue text-brand-blue hover:bg-brand-blue/20 gap-2 text-xs uppercase font-bold"
                                                                onClick={() => setAssigningPlayer(player)}
                                                            >
                                                                Select / Assign
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/20 gap-2 text-xs uppercase font-bold"
                                                                onClick={() => {
                                                                    if (confirm(`Are you sure you want to unassign ${player.name} from their team?`)) {
                                                                        updatePlayerMutation.mutate({ ...player, teamId: null, status: 'pending' });
                                                                    }
                                                                }}
                                                            >
                                                                Unassign
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setEditingPlayer(player)}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => {
                                                            if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                                                                deletePlayerMutation.mutate(player.id);
                                                            }
                                                        }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredPlayers?.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-gray-500">No players found matching your search.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-black/40 p-4 border border-white/10 rounded-xl backdrop-blur-md flex-col sm:flex-row gap-4">
                                <h2 className="text-xl font-heading tracking-widest text-white">Match Fixtures</h2>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/20 gap-2"
                                        onClick={() => setShowMatchForm(!showMatchForm)}
                                    >
                                        <Plus className="w-4 h-4" /> {showMatchForm ? 'Cancel' : 'Create Match'}
                                    </Button>
                                    <Button
                                        className="bg-brand-red text-white hover:bg-red-700 gap-2"
                                        onClick={handleGenerateMatches}
                                        disabled={generateMatchesMutation.isPending}
                                    >
                                        <Calendar className="w-4 h-4" /> Auto-Generate
                                    </Button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showMatchForm && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <Card className="glass-card mb-6 border-brand-yellow/30">
                                            <CardContent className="p-6">
                                                <form onSubmit={(e) => { e.preventDefault(); createMatchMutation.mutate(newMatch); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Team A</Label>
                                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={newMatch.teamAId} onChange={(e) => setNewMatch({ ...newMatch, teamAId: e.target.value })} required>
                                                            <option value="">Select Team A</option>
                                                            {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Team B</Label>
                                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={newMatch.teamBId} onChange={(e) => setNewMatch({ ...newMatch, teamBId: e.target.value })} required>
                                                            <option value="">Select Team B</option>
                                                            {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date</Label>
                                                        <Input type="date" value={newMatch.date} onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Time</Label>
                                                        <Input type="time" value={newMatch.time} onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Venue</Label>
                                                        <Input value={newMatch.venue} onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Overs</Label>
                                                        <Input type="number" value={newMatch.overs} onChange={(e) => setNewMatch({ ...newMatch, overs: parseInt(e.target.value) })} required />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Type</Label>
                                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={newMatch.matchType} onChange={(e) => setNewMatch({ ...newMatch, matchType: e.target.value })}>
                                                            <option value="league">League</option>
                                                            <option value="semi-final">Semi-Final</option>
                                                            <option value="final">Final</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-end">
                                                        <Button type="submit" className="w-full bg-brand-yellow text-black hover:bg-yellow-500 font-bold" disabled={createMatchMutation.isPending}>
                                                            {createMatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SCHEDULE MATCH'}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {loadingMatches ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-red" /></div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {matches?.filter((m: any) => m.status !== 'completed').map((match: any) => (
                                        <div key={match.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-blue/40 transition-all group">
                                            <div className="flex items-center gap-8 flex-1">
                                                <div className="text-center w-24">
                                                    <div className="text-xs text-gray-500 font-heading uppercase tracking-tighter">{match.date}</div>
                                                    <div className="text-brand-blue text-lg font-bold font-heading">{match.time}</div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="text-right flex-1">
                                                        <div className="text-white font-heading tracking-widest uppercase text-sm">{match.teamA?.name}</div>
                                                        <div className="text-brand-yellow font-bold">{match.score?.teamARuns}/{match.score?.teamAWickets}</div>
                                                    </div>
                                                    <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400">VS</div>
                                                    <div className="text-left flex-1">
                                                        <div className="text-white font-heading tracking-widest uppercase text-sm">{match.teamB?.name}</div>
                                                        <div className="text-brand-yellow font-bold">{match.score?.teamBRuns}/{match.score?.teamBWickets}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${match.status === 'live' ? 'bg-brand-red/20 text-brand-red' : 'bg-brand-blue/20 text-brand-blue'}`}>
                                                    {match.status}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-white/10 text-white hover:bg-brand-blue hover:text-white"
                                                    onClick={() => startScoring(match)}
                                                >
                                                    <Activity className="w-3 h-3 mr-2" /> {match.status === 'live' ? 'Live Score' : 'Start Scoring'}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-white"
                                                    onClick={() => setEditingMatch(match)}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() => { if (confirm('Delete match?')) deleteMatchMutation.mutate(match.id); }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {matches?.filter((m: any) => m.status !== 'completed').length === 0 && (
                                        <div className="text-center py-20 bg-black/40 rounded-xl border border-dashed border-white/10">
                                            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4 opacity-30" />
                                            <p className="text-gray-500">No scheduled matches. Check history for results.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-black/40 p-4 border border-white/10 rounded-xl backdrop-blur-md">
                                <h2 className="text-xl font-heading tracking-widest text-white">Tournament History</h2>
                                <div className="text-xs text-gray-500 uppercase font-heading">{matches?.filter((m: any) => m.status === 'completed').length || 0} Matches Concluded</div>
                            </div>

                            {loadingMatches ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-blue" /></div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {matches?.filter((m: any) => m.status === 'completed').map((match: any) => (
                                        <div key={match.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-8 flex-1">
                                                <div className="text-center w-24">
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{match.date}</div>
                                                    <div className="text-gray-400 text-sm font-bold uppercase">{match.matchType}</div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`text-right flex-1 ${match.winnerTeamId === match.teamAId ? 'scale-105' : 'opacity-60'}`}>
                                                        <div className={`text-sm font-heading tracking-widest uppercase ${match.winnerTeamId === match.teamAId ? 'text-brand-yellow' : 'text-white'}`}>{match.teamA?.shortName}</div>
                                                        <div className="text-xl font-bold font-heading">{match.score?.teamARuns}/{match.score?.teamAWickets}</div>
                                                        <div className="text-[10px] text-gray-500">({match.score?.teamAOversPlayed} ov)</div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-white/5">VS</div>
                                                        {match.winnerTeamId && <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Done</div>}
                                                    </div>
                                                    <div className={`text-left flex-1 ${match.winnerTeamId === match.teamBId ? 'scale-105' : 'opacity-60'}`}>
                                                        <div className={`text-sm font-heading tracking-widest uppercase ${match.winnerTeamId === match.teamBId ? 'text-brand-yellow' : 'text-white'}`}>{match.teamB?.shortName}</div>
                                                        <div className="text-xl font-bold font-heading">{match.score?.teamBRuns}/{match.score?.teamBWickets}</div>
                                                        <div className="text-[10px] text-gray-500">({match.score?.teamBOversPlayed} ov)</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black gap-2 text-xs uppercase font-bold"
                                                    onClick={() => startScoring(match)}
                                                >
                                                    <Database className="w-3 h-3" /> Edit Score
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-white"
                                                    onClick={() => setEditingMatch(match)}
                                                >
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-400/50"
                                                    onClick={() => { if (confirm('Delete match from history?')) deleteMatchMutation.mutate(match.id); }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {matches?.filter((m: any) => m.status === 'completed').length === 0 && (
                                        <div className="text-center py-20 bg-black/40 rounded-xl border border-dashed border-white/10">
                                            <History className="w-12 h-12 mx-auto text-gray-600 mb-4 opacity-30" />
                                            <p className="text-gray-500">No match history available yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            {/* Player Edit Modal */}
            <AnimatePresence>
                {editingPlayer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-brand-bg border border-white/10 p-6 rounded-2xl w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
                        >
                            <h3 className="text-2xl font-heading text-white tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-brand-yellow" />
                                Edit Player: {editingPlayer.name}
                            </h3>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updatePlayerMutation.mutate({ ...editingPlayer, isAdmin: editingPlayer.userRole === 'admin' });
                            }} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 lg:col-span-2">
                                        <Label>Full Name</Label>
                                        <Input type="text" className="bg-black/50" value={editingPlayer.name || ''} onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>User System Role</Label>
                                        <select
                                            className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-md text-white text-sm"
                                            value={editingPlayer.userRole || 'player'}
                                            onChange={(e) => setEditingPlayer({ ...editingPlayer, userRole: e.target.value })}
                                        >
                                            <option value="player">Standard Player</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Player Role</Label>
                                        <select
                                            className="w-full h-10 px-3 bg-black/50 border border-white/10 rounded-md text-white text-sm"
                                            value={editingPlayer.role || 'Undecided'}
                                            onChange={(e) => setEditingPlayer({ ...editingPlayer, role: e.target.value })}
                                        >
                                            <option value="Undecided">Undecided</option>
                                            <option value="Batsman">Batsman</option>
                                            <option value="Bowler">Bowler</option>
                                            <option value="All-Rounder">All-Rounder</option>
                                            <option value="Wicket-Keeper">Wicket-Keeper</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2 bg-black/40 p-4 rounded-xl border border-white/5">
                                        <input
                                            type="checkbox"
                                            id="isCaptain"
                                            className="w-5 h-5 rounded border-white/10 bg-black/50 text-brand-yellow focus:ring-brand-yellow"
                                            checked={editingPlayer.isCaptain || false}
                                            onChange={(e) => setEditingPlayer({ ...editingPlayer, isCaptain: e.target.checked })}
                                        />
                                        <Label htmlFor="isCaptain" className="text-white font-bold cursor-pointer">Team Captain</Label>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-black/40 p-4 rounded-xl border border-white/5">
                                        <input
                                            type="checkbox"
                                            id="isAdmin"
                                            className="w-5 h-5 rounded border-white/10 bg-black/50 text-brand-yellow focus:ring-brand-yellow"
                                            checked={editingPlayer.userRole === 'admin'}
                                            onChange={(e) => setEditingPlayer({ ...editingPlayer, userRole: e.target.checked ? 'admin' : 'player' })}
                                        />
                                        <Label htmlFor="isAdmin" className="text-white font-bold cursor-pointer">Make System Admin</Label>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/10">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingPlayer(null)}>Cancel</Button>
                                    <Button type="submit" className="flex-1" disabled={updatePlayerMutation.isPending}>
                                        {updatePlayerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Details'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Match Scoring Modal */}
            <AnimatePresence>
                {scoringMatch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-brand-bg border border-white/10 p-6 rounded-2xl w-full max-w-6xl shadow-2xl overflow-y-auto max-h-[95vh] custom-scrollbar"
                        >
                            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-red/10 rounded-xl text-brand-red">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-heading text-white tracking-widest uppercase">Match Scoring Center</h3>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest">{scoringMatch.teamA?.name} VS {scoringMatch.teamB?.name}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setScoringMatch(null)}><X className="w-6 h-6" /></Button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Summary Section */}
                                <div className="space-y-6">
                                    <Card className="glass-card">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-heading tracking-widest text-brand-blue uppercase">Team Totals</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <Label className="text-brand-yellow font-bold text-[10px] uppercase mb-2 block">{scoringMatch.teamA?.name}</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Runs</span>
                                                            <Input type="number" value={scoreUpdates.teamARuns} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamARuns: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Wkts</span>
                                                            <Input type="number" value={scoreUpdates.teamAWickets} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamAWickets: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Overs</span>
                                                            <Input type="number" step="0.1" value={scoreUpdates.teamAOversPlayed} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamAOversPlayed: parseFloat(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                    <Label className="text-brand-blue font-bold text-[10px] uppercase mb-2 block">{scoringMatch.teamB?.name}</Label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Runs</span>
                                                            <Input type="number" value={scoreUpdates.teamBRuns} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamBRuns: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Wkts</span>
                                                            <Input type="number" value={scoreUpdates.teamBWickets} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamBWickets: parseInt(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] text-gray-500 uppercase">Overs</span>
                                                            <Input type="number" step="0.1" value={scoreUpdates.teamBOversPlayed} onChange={(e) => setScoreUpdates({ ...scoreUpdates, teamBOversPlayed: parseFloat(e.target.value) || 0 })} className="h-8 text-sm bg-black/50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-xs text-gray-400 uppercase font-heading">Current Innings</span>
                                                    <select
                                                        className="bg-black/50 border border-white/10 rounded h-8 px-2 text-xs text-white"
                                                        value={scoreUpdates.currentInnings}
                                                        onChange={(e) => setScoreUpdates({ ...scoreUpdates, currentInnings: parseInt(e.target.value) })}
                                                    >
                                                        <option value={1}>1st Innings</option>
                                                        <option value={2}>2nd Innings</option>
                                                    </select>
                                                </div>
                                                <Button className="w-full bg-brand-blue hover:bg-blue-600 h-10 gap-2" onClick={saveScoring} disabled={updateMatchScoreMutation.isPending || updateMatchStatsMutation.isPending}>
                                                    {(updateMatchScoreMutation.isPending || updateMatchStatsMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                                                    SAVE LIVE SCOREBOARD
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border-brand-blue/30 mt-6">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-brand-blue" />
                                                <CardTitle className="text-sm font-heading tracking-widest text-brand-blue uppercase">Official Scoreboard</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="relative aspect-video rounded-xl bg-black/50 border border-white/10 flex items-center justify-center overflow-hidden group">
                                                {scoringMatch?.scoreboardImage ? (
                                                    <img src={scoringMatch.scoreboardImage} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">No scoreboard uploaded</p>
                                                    </div>
                                                )}
                                                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                                                    {uploadingScoreboard ? <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" /> : <Plus className="w-8 h-8 text-white mb-2" />}
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Upload Scoreboard</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleScoreboardUpload(e, scoringMatch)} />
                                                </label>
                                            </div>
                                            <p className="text-[9px] text-gray-500 italic text-center uppercase tracking-tighter">Upload a photo of the manual scoreboard or official sheet</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border-emerald-500/30">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-emerald-500/10 rounded-md text-emerald-500"><Check className="w-4 h-4" /></div>
                                                <CardTitle className="text-sm font-heading tracking-widest text-emerald-400 uppercase">Match Completion</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-gray-400 uppercase">Winner Team</Label>
                                                <select
                                                    id="winner-select"
                                                    className="w-full bg-black/50 border border-white/10 rounded h-10 px-3 text-sm text-white focus:border-emerald-500"
                                                >
                                                    <option value="">Select Winner</option>
                                                    <option value={scoringMatch.teamAId}>{scoringMatch.teamA?.name}</option>
                                                    <option value={scoringMatch.teamBId}>{scoringMatch.teamB?.name}</option>
                                                    <option value="no_result">No Result / Draw</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-gray-400 uppercase">Man of the Match</Label>
                                                <select
                                                    id="motm-select"
                                                    className="w-full bg-black/50 border border-white/10 rounded h-10 px-3 text-sm text-white focus:border-brand-yellow"
                                                >
                                                    <option value="">Select MVP</option>
                                                    {matchPlayerStatsData.map(p => (
                                                        <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button
                                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-12 gap-2 mt-4"
                                                onClick={() => {
                                                    const winnerId = (document.getElementById('winner-select') as HTMLSelectElement).value;
                                                    const motmId = (document.getElementById('motm-select') as HTMLSelectElement).value;
                                                    finalizeMatch(winnerId, motmId);
                                                }}
                                                disabled={completeMatchMutation.isPending}
                                            >
                                                {completeMatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                                                FINALIZE MATCH RESULT
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Player Stats Detailed Sheet */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-black/40 p-1.5 rounded-lg border border-white/10 flex gap-1 mb-4">
                                        <button
                                            className="flex-1 py-2 text-xs font-heading tracking-widest uppercase rounded-md bg-brand-yellow text-black"
                                        >
                                            Individual Player Stats
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-white/10 custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-black/60 border-b border-white/10 text-[10px] uppercase font-heading text-gray-500 tracking-tighter">
                                                    <th className="px-4 py-3 min-w-[150px]">Player</th>
                                                    <th className="px-2 py-3">Runs</th>
                                                    <th className="px-2 py-3">Balls</th>
                                                    <th className="px-2 py-3">4s</th>
                                                    <th className="px-2 py-3">6s</th>
                                                    <th className="px-2 py-3 bg-brand-red/10">Wkts</th>
                                                    <th className="px-2 py-3">Conc.</th>
                                                    <th className="px-2 py-3">Bowled</th>
                                                    <th className="px-2 py-3">Ctch</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {matchPlayerStatsData.map((player) => (
                                                    <tr key={player.playerId} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${player.teamId === scoringMatch.teamAId ? 'bg-brand-yellow' : 'bg-brand-blue'}`} />
                                                                <div>
                                                                    <div className="text-white text-xs font-bold leading-none">{player.playerName}</div>
                                                                    <div className="text-[9px] text-gray-500 uppercase tracking-tighter mt-1">{player.teamId === scoringMatch.teamAId ? scoringMatch.teamA?.shortName : scoringMatch.teamB?.shortName}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.runsScored} onChange={(e) => handlePlayerStatChange(player.playerId, 'runsScored', parseInt(e.target.value) || 0)} className="w-12 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.ballsFaced} onChange={(e) => handlePlayerStatChange(player.playerId, 'ballsFaced', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.fours} onChange={(e) => handlePlayerStatChange(player.playerId, 'fours', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.sixes} onChange={(e) => handlePlayerStatChange(player.playerId, 'sixes', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3 bg-brand-red/5"><Input type="number" value={player.wickets} onChange={(e) => handlePlayerStatChange(player.playerId, 'wickets', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-red-900/20 border-white/5 p-1 text-brand-red font-bold" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.runsConceded} onChange={(e) => handlePlayerStatChange(player.playerId, 'runsConceded', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.ballsBowled} onChange={(e) => handlePlayerStatChange(player.playerId, 'ballsBowled', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                        <td className="px-2 py-3"><Input type="number" value={player.catches} onChange={(e) => handlePlayerStatChange(player.playerId, 'catches', parseInt(e.target.value) || 0)} className="w-10 h-8 text-[11px] bg-black/30 border-white/5 p-1" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Match Edit Modal */}
            <AnimatePresence>
                {editingMatch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-brand-bg border border-white/10 p-6 rounded-2xl w-full max-w-2xl shadow-2xl relative"
                        >
                            <button onClick={() => setEditingMatch(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-2xl font-heading text-white tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-brand-red" />
                                Edit Match Schedule
                            </h3>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                updateMatchMutation.mutate(editingMatch);
                            }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Team A</Label>
                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={editingMatch.teamAId} onChange={(e) => setEditingMatch({ ...editingMatch, teamAId: e.target.value })} required>
                                            {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Team B</Label>
                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={editingMatch.teamBId} onChange={(e) => setEditingMatch({ ...editingMatch, teamBId: e.target.value })} required>
                                            {teams?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={editingMatch.date} onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input type="time" value={editingMatch.time} onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Venue</Label>
                                        <Input value={editingMatch.venue} onChange={(e) => setEditingMatch({ ...editingMatch, venue: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Overs</Label>
                                        <Input type="number" value={editingMatch.overs} onChange={(e) => setEditingMatch({ ...editingMatch, overs: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={editingMatch.status} onChange={(e) => setEditingMatch({ ...editingMatch, status: e.target.value })}>
                                            <option value="upcoming">Upcoming</option>
                                            <option value="live">Live</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <select className="w-full h-10 bg-black/50 border border-white/10 rounded-md text-white px-3" value={editingMatch.matchType} onChange={(e) => setEditingMatch({ ...editingMatch, matchType: e.target.value })}>
                                            <option value="league">League</option>
                                            <option value="semi-final">Semi-Final</option>
                                            <option value="final">Final</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/10">
                                    <Button type="button" variant="outline" className="flex-1 border-white/10" onClick={() => setEditingMatch(null)}>Cancel</Button>
                                    <Button type="submit" className="flex-1 bg-brand-yellow text-black hover:bg-yellow-500 font-bold" disabled={updateMatchMutation.isPending}>
                                        {updateMatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE CHANGES'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
