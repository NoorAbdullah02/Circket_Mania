import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, Calendar, Loader2, Database, Plus, Search, Edit, Trash2, Camera, Activity, Crown, Check, X, Star, History, User, Award, Zap, Target, Mail, Hash, Flag, Phone, RotateCcw, Trophy, UserMinus, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { formatTime12h } from '../lib/utils';

const PIE_COLORS = ['#38BDF8', '#FFD60A', '#FF3B30', '#22C55E', '#A855F7', '#EC4899'];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

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

    const queryClient = useQueryClient();

    const filteredPlayers = players?.filter((player: any) => {
        const query = searchQuery.toLowerCase();
        return player.name?.toLowerCase().includes(query) ||
            player.batch?.toLowerCase().includes(query) ||
            player.phone?.toLowerCase().includes(query);
    });

    useGSAP(() => {
        if (!loadingStats && !loadingPlayers && !hasAnimated.current) {
            hasAnimated.current = true;
            const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
            tl.from('.admin-title', { x: -30, opacity: 0 });
            tl.from('.tab-container', { x: 30, opacity: 0 }, '-=0.5');
        }
    }, { dependencies: [loadingStats, loadingPlayers], scope: container });

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
    const [viewingPlayer, setViewingPlayer] = useState<any>(null);
    const [unassignConfirmation, setUnassignConfirmation] = useState<any>(null);
    const [editingMatch, setEditingMatch] = useState<any>(null);
    const [showMatchForm, setShowMatchForm] = useState(false);
    const [newTeam, setNewTeam] = useState({ name: '', shortName: '', color: '#38BDF8', logo: '', coverPhoto: '' });
    const [newMatch, setNewMatch] = useState({
        teamAId: '', teamBId: '', date: '', time: '',
        venue: 'University Central Ground', overs: 10, matchType: 'league'
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingScoreboard, setUploadingScoreboard] = useState(false);

    // Scoring states
    const [scoringMatch, setScoringMatch] = useState<any>(null);
    const [isInitializingScoring, setIsInitializingScoring] = useState(false);
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
            setNewTeam({ name: '', shortName: '', color: '#38BDF8', logo: '' });
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
            toast.success('Player assigned and activation email sent! 💌');
            setAssigningPlayer(null);
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to assign player')
    });

    const unassignPlayerMutation = useMutation({
        mutationFn: async (playerId: string) =>
            api.post('/teams/unassign-player', { playerId }),
        onSuccess: () => {
            toast.success('Player returned to drafting pool 🕊️');
            queryClient.invalidateQueries({ queryKey: ['admin-players'] });
            queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to unassign player')
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

    const sendReminderMutation = useMutation({
        mutationFn: async (id: string) => api.post(`/matches/${id}/remind`),
        onSuccess: (data: any) => {
            toast.success(data.data?.message || 'Reminders sent! 📧');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send reminders')
    });

    const sendResultsMutation = useMutation({
        mutationFn: async (id: string) => api.post(`/matches/${id}/send-results`),
        onSuccess: (data: any) => {
            toast.success(data.data?.message || 'Match results sent! 🏏');
        },
        onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send results')
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

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingCover(true);
            const uploadData = new FormData();
            uploadData.append('file', file);
            const { data } = await api.post('/upload?folder=teams', uploadData);

            if (isEditing) {
                setEditingTeam({ ...editingTeam, coverPhoto: data.url });
            } else {
                setNewTeam({ ...newTeam, coverPhoto: data.url });
            }
            toast.success('Cover photo uploaded!');
        } catch (error) {
            toast.error('Cover upload failed');
        } finally {
            setUploadingCover(false);
        }
    };

    const handleCreateTeam = (e: React.FormEvent) => {
        e.preventDefault();
        createTeamMutation.mutate(newTeam);
    };

    const startScoring = async (match: any) => {
        try {
            setScoringMatch(match);
            setIsInitializingScoring(true);

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
                        playerName: p.name || p.user?.name || 'Unnamed Player',
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
        } finally {
            setIsInitializingScoring(false);
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
            // Update player stats - filter out entries with no teamId
            const validStats = matchPlayerStatsData.filter((s: any) => s.playerId && s.teamId);
            if (validStats.length > 0) {
                await updateMatchStatsMutation.mutateAsync({ matchId: scoringMatch.id, stats: validStats });
            }
        } catch (error: any) {
            console.error('Save scoring error:', error);
            throw error; // Re-throw so finalizeMatch knows it failed
        }
    };

    const finalizeMatch = async (winnerTeamId: string, manOfTheMatchId: string) => {
        if (!winnerTeamId) return toast.error('Please select a winner');

        try {
            // Save final scores and player stats first
            await saveScoring();

            // Handle "no_result" as a special status
            if (winnerTeamId === 'no_result') {
                completeMatchMutation.mutate({
                    matchId: scoringMatch.id,
                    data: { status: 'no_result' }
                });
            } else {
                completeMatchMutation.mutate({
                    matchId: scoringMatch.id,
                    data: { winnerTeamId, manOfTheMatch: manOfTheMatchId || null, status: 'completed' }
                });
            }
        } catch (error: any) {
            console.error('Finalize error:', error);
            toast.error('Failed to save scores before finalizing. Please try again.');
        }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative" ref={container}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="admin-title">
                    <h1 className="text-4xl md:text-5xl font-heading tracking-widest text-white uppercase neon-text-red">Admin Control</h1>
                    <p className="text-gray-400 mt-2 font-bold text-xs uppercase tracking-widest">Department: <span className="text-brand-yellow">ICE</span> • Strategic Management</p>
                </div>

                <div className="flex gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl border border-white/5 overflow-x-auto shadow-2xl relative z-20 custom-scrollbar tab-container">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-widest transition-all duration-300 text-xs uppercase relative overflow-hidden group whitespace-nowrap
                ${activeTab === tab.id
                                    ? 'text-white shadow-[0_0_20px_rgba(255,59,48,0.3)]'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-red to-orange-500 opacity-100 transition-opacity"></div>
                            )}
                            <div className="relative z-10 flex items-center gap-2">
                                {tab.icon} {tab.label}
                            </div>
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
                                            { label: 'Total Franchises', value: stats?.totalTeams, color: 'text-brand-blue', bg: 'bg-brand-blue/20', border: 'hover:border-brand-blue/50 hover:shadow-[0_0_30px_rgba(56,189,248,0.2)]' },
                                            { label: 'Registered Players', value: stats?.totalPlayers, color: 'text-brand-yellow', bg: 'bg-brand-yellow/20', border: 'hover:border-brand-yellow/50 hover:shadow-[0_0_30px_rgba(255,214,10,0.2)]' },
                                            { label: 'Drafted/Selected', value: stats?.selectedPlayers, color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]' },
                                            { label: 'Matches Scheduled', value: stats?.totalMatches, color: 'text-brand-red', bg: 'bg-brand-red/20', border: 'hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(255,59,48,0.2)]' },
                                        ].map((stat, i) => (
                                            <Card key={i} className={`stat-card relative bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl transition-all duration-500 overflow-hidden group ${stat.border}`}>
                                                <div className={`absolute -inset-4 ${stat.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                                                <CardContent className="p-8 relative z-10">
                                                    <p className="text-gray-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">{stat.label}</p>
                                                    <div className="flex items-baseline gap-2 mt-4">
                                                        <p className={`text-5xl md:text-6xl font-heading tracking-widest ${stat.color} filter drop-shadow-lg`}>{stat.value || 0}</p>
                                                    </div>
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
                                                            <Line type="monotone" dataKey="points" stroke="#38BDF8" strokeWidth={3} dot={{ r: 5 }} />
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
                                                <Button onClick={handleGenerateMatches} isLoading={generateMatchesMutation.isPending} className="bg-brand-red hover:bg-red-700 mx-auto w-full max-w-xs h-12">
                                                    {!generateMatchesMutation.isPending && <Calendar className="w-4 h-4 mr-2" />}
                                                    AUTOGENERATE LEAGUE FIXTURE
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
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative w-28 h-20 group">
                                                            <div className="relative w-full h-full rounded-lg bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                                                                {newTeam.coverPhoto ? (
                                                                    <img src={newTeam.coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Camera className="w-6 h-6 text-gray-500" />
                                                                )}
                                                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverUpload(e)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 uppercase mt-1">Cover Photo</span>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Team Name</Label>
                                                        <Input
                                                            placeholder="e.g. Dhaka Gladiators (Min 7 chars)"
                                                            value={newTeam.name}
                                                            minLength={7}
                                                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Short Name</Label>
                                                        <Input
                                                            placeholder="Dhaka GL"
                                                            maxLength={8}
                                                            minLength={6}
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
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="bg-brand-blue hover:bg-blue-600 h-10 uppercase tracking-widest text-xs" isLoading={createTeamMutation.isPending}>
                                                        Confirm
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
                                                    <div className="flex flex-col items-center">
                                                        <div className="relative w-28 h-20 group">
                                                            <div className="relative w-full h-full rounded-lg bg-black border border-white/20 flex items-center justify-center overflow-hidden">
                                                                {editingTeam.coverPhoto ? (
                                                                    <img src={editingTeam.coverPhoto} alt="Cover Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Camera className="w-6 h-6 text-gray-500" />
                                                                )}
                                                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                                                    {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverUpload(e, true)} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 uppercase mt-1">Cover Photo</span>
                                                    </div>
                                                    <div className="space-y-2 md:col-span-1">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Team Name</Label>
                                                        <Input
                                                            value={editingTeam.name}
                                                            minLength={7}
                                                            onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-gray-400 uppercase text-xs tracking-widest">Short Name</Label>
                                                        <Input
                                                            maxLength={8}
                                                            minLength={6}
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
                                                                className="w-10 h-10 p-1 bg-black/40 border-white/20"
                                                                value={editingTeam.color}
                                                                onChange={(e) => setEditingTeam({ ...editingTeam, color: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="submit" className="bg-brand-yellow text-black hover:bg-yellow-500 h-10 flex-1" isLoading={updateTeamMutation.isPending}>
                                                            {!updateTeamMutation.isPending && <Check className="w-4 h-4" />}
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
                                        <Card key={team.id} className="relative bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-3xl pointer-events-none" style={{ backgroundColor: team.color || '#38BDF8' }}></div>
                                            <div className="h-32 relative overflow-hidden">
                                                <div
                                                    className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black to-transparent z-10"
                                                />
                                                <div
                                                    className="absolute inset-0 opacity-60 z-0 group-hover:scale-110 transition-transform duration-700"
                                                    style={{ backgroundColor: team.color || '#38BDF8', backgroundImage: team.coverPhoto ? `url(${team.coverPhoto})` : 'linear-gradient(to top right, rgba(0,0,0,0.8), transparent)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
                                                />
                                                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-black/60 text-white hover:bg-white hover:text-black backdrop-blur-md shadow-lg" onClick={() => setEditingTeam(team)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-black/60 text-white hover:bg-brand-red hover:text-white backdrop-blur-md shadow-lg" onClick={() => { if (confirm('Delete team?')) deleteTeamMutation.mutate(team.id); }}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="px-8 pb-8 relative pt-0 z-20">
                                                <div className="relative w-28 h-28 mx-auto -mt-14 group-hover:-mt-16 transition-all duration-500">
                                                    <div className="absolute inset-0 rounded-full blur-md opacity-50 bg-black group-hover:opacity-100 transition-all duration-500" style={{ backgroundColor: team.color }}></div>
                                                    <img
                                                        src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                                        alt={team.name}
                                                        className="w-full h-full rounded-full bg-black border-[3px] border-white/10 object-cover relative z-10 shadow-2xl transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="text-center mt-6">
                                                    <h3 className="text-2xl font-heading tracking-[0.1em] text-white uppercase group-hover:text-shadow-sm transition-all" style={{ textShadow: `0 0 10px ${team.color}40` }}>{team.name}</h3>
                                                    <p className="font-bold tracking-[0.3em] uppercase mt-1" style={{ color: team.color }}>{team.shortName}</p>
                                                    <div className="mt-8 flex flex-col items-center gap-3">
                                                        <div className="flex gap-1.5 items-center bg-white/5 py-1.5 px-4 rounded-full border border-white/5">
                                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Roster: <span className="text-white ml-1">{team.players?.length || 0}/15</span></span>
                                                        </div>
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
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            className="w-full max-w-4xl"
                                        >
                                            <Card className="glass-card border-brand-blue/30 overflow-hidden relative">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue via-brand-yellow to-brand-red"></div>
                                                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                                                    <div className="flex items-center gap-6">
                                                        <div className="relative">
                                                            <div className="absolute -inset-2 bg-brand-blue/20 blur-xl rounded-full"></div>
                                                            <img
                                                                src={assigningPlayer.profileImage || `https://ui-avatars.com/api/?name=${assigningPlayer.name}`}
                                                                className="w-16 h-16 rounded-full border-2 border-brand-blue relative z-10"
                                                            />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-2xl font-heading tracking-[0.2em] text-white uppercase">Franchise Assignment</h3>
                                                            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Select a destination for <span className="text-brand-blue font-bold">{assigningPlayer.name}</span></p>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full hover:bg-white/10" onClick={() => setAssigningPlayer(null)}><X className="w-5 h-5" /></Button>
                                                </div>

                                                <div className="p-8 bg-black/40">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                                        {teams?.map((team: any) => (
                                                            <div
                                                                key={team.id}
                                                                className="group relative cursor-pointer"
                                                                onClick={() => assignPlayerMutation.mutate({ playerId: assigningPlayer.id, teamId: team.id })}
                                                            >
                                                                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-2xl group-hover:via-white/20 transition duration-500"></div>
                                                                <Card className="relative h-full bg-black/60 border border-white/10 hover:border-white/30 p-6 transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col items-center text-center">
                                                                    <div className="absolute top-0 right-0 p-3">
                                                                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: team.color, color: team.color }} />
                                                                    </div>

                                                                    <div className="w-20 h-20 rounded-full bg-black/80 p-1 border border-white/10 mb-5 relative group-hover:scale-110 transition-transform duration-500">
                                                                        <img
                                                                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}`}
                                                                            className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                                        />
                                                                    </div>

                                                                    <h4 className="text-white font-heading tracking-widest uppercase mb-2 group-hover:text-brand-yellow transition-colors">{team?.shortName || team.name}</h4>
                                                                    <div className="flex items-center gap-2 mt-auto">
                                                                        <Users className="w-3 h-3 text-gray-500" />
                                                                        <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase">
                                                                            {team.players?.length || 0} / 15 Elements
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-4 w-full h-px bg-white/5"></div>
                                                                    <Button
                                                                        className="mt-4 w-full h-9 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-brand-blue hover:text-white border-white/10 transition-all"
                                                                        variant="outline"
                                                                        isLoading={assignPlayerMutation.isPending}
                                                                    >
                                                                        Assign Asset
                                                                    </Button>
                                                                </Card>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {loadingPlayers ? (
                                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>
                            ) : (
                                <div className="overflow-x-auto bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-3xl"></div>
                                    <table className="w-full text-left border-collapse whitespace-nowrap relative z-10">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5 uppercase text-[10px] tracking-[0.2em] font-bold text-brand-yellow/80">
                                                <th className="px-8 py-6">Player</th>
                                                <th className="px-8 py-6">Batch</th>
                                                <th className="px-8 py-6">Team</th>
                                                <th className="px-8 py-6">Role</th>
                                                <th className="px-8 py-6">Status</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredPlayers?.map((player: any) => (
                                                <tr key={player.id} className="hover:bg-white/[0.03] transition-colors group cursor-default">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div
                                                                className="w-12 h-12 rounded-full bg-black/50 border-[3px] border-white/10 flex items-center justify-center text-white font-heading overflow-hidden shadow-lg group-hover:scale-110 group-hover:border-brand-yellow/50 transition-all duration-300 relative cursor-pointer"
                                                                onClick={() => setViewingPlayer(player)}
                                                                title="View Full Profile"
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-10"></div>
                                                                {player.profileImage ? (
                                                                    <img
                                                                        src={player.profileImage}
                                                                        className="w-full h-full object-cover relative z-0"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.name}&background=0D0D0D&color=fff&size=128`;
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-brand-blue to-accent flex items-center justify-center text-xl">
                                                                        {player.name?.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="text-white font-bold tracking-wider flex items-center gap-2 text-sm">
                                                                    {player.name}
                                                                    {player.userRole === 'admin' && <Crown className="w-3.5 h-3.5 text-brand-yellow drop-shadow-[0_0_8px_rgba(255,214,10,0.8)]" />}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{player.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-white font-bold text-xs uppercase tracking-widest">{player.batch || '—'}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            {player.teamId ? (
                                                                <div className="flex items-center gap-2 group/team cursor-help" title={`Assigned to ${player.team?.name}`}>
                                                                    <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center overflow-hidden shadow-inner transform group-hover/team:rotate-12 transition-transform duration-300">
                                                                        <img src={player.team?.logo || `https://ui-avatars.com/api/?name=${player.team?.shortName}`} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] text-white font-black uppercase tracking-[0.15em]">{player.team?.shortName}</span>
                                                                        <div className="h-0.5 w-full bg-gradient-to-r from-brand-blue to-transparent opacity-50"></div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 opacity-30">
                                                                    <div className="w-8 h-8 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
                                                                        <UserMinus className="w-3.5 h-3.5 text-gray-500" />
                                                                    </div>
                                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic">Undrafted</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${player.status === 'activated'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                                            : 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                                                            }`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${player.status === 'activated' ? 'bg-emerald-400 animate-pulse' : 'bg-brand-yellow'}`}></div>
                                                            {player.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {!player.teamId ? (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-9 px-5 bg-brand-blue/10 border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white uppercase text-[10px] font-black tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-blue/5"
                                                                    onClick={() => setAssigningPlayer(player)}
                                                                >
                                                                    Draft Player
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-9 px-5 text-brand-red/70 hover:text-white hover:bg-brand-red uppercase text-[10px] font-black tracking-widest rounded-xl transition-all border border-brand-red/20 hover:border-brand-red"
                                                                    onClick={() => setUnassignConfirmation(player)}
                                                                    isLoading={unassignPlayerMutation.isPending}
                                                                >
                                                                    <RotateCcw className="w-3 h-3 mr-2" /> Unassign
                                                                </Button>
                                                            )}
                                                            <div className="w-px h-6 bg-white/5 mx-1"></div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                                                onClick={() => setEditingPlayer(player)}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-9 w-9 p-0 text-gray-700 hover:text-brand-red hover:bg-brand-red/5 rounded-xl transition-colors"
                                                                onClick={() => { if (confirm('Irreversible Action: Delete this player data permanently?')) deletePlayerMutation.mutate(player.id); }}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
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
                                        isLoading={generateMatchesMutation.isPending}
                                    >
                                        <Calendar className="w-4 h-4" /> Auto-Generate
                                    </Button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showMatchForm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="glass-card mb-12 border-brand-yellow/20 overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <Trophy className="w-32 h-32 text-brand-yellow" />
                                            </div>
                                            <CardHeader className="border-b border-white/5 bg-white/[0.01]">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-brand-yellow/10 rounded-lg">
                                                        <Calendar className="w-5 h-5 text-brand-yellow" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl font-heading tracking-widest text-white uppercase">New Arena Dispatch</CardTitle>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Define a new battle between franchises</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-8">
                                                <form onSubmit={(e) => { e.preventDefault(); createMatchMutation.mutate(newMatch); }} className="space-y-8">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                        {/* Teams Selection */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Home Franchise (Team A)</Label>
                                                                <select
                                                                    className="w-full h-12 bg-black/60 border border-white/10 rounded-xl text-sm text-white px-4 focus:border-brand-blue transition-all outline-none"
                                                                    value={newMatch.teamAId}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, teamAId: e.target.value })}
                                                                    required
                                                                >
                                                                    <option value="">Select Team</option>
                                                                    {teams?.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-brand-red">Away Franchise (Team B)</Label>
                                                                <select
                                                                    className="w-full h-12 bg-black/60 border border-white/10 rounded-xl text-sm text-white px-4 focus:border-brand-red transition-all outline-none"
                                                                    value={newMatch.teamBId}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, teamBId: e.target.value })}
                                                                    required
                                                                >
                                                                    <option value="">Select Team</option>
                                                                    {teams?.filter((t: any) => t.id !== newMatch.teamAId).map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* Logistics Section */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    className="h-12 bg-black/60 border-white/10 rounded-xl text-sm focus:border-brand-yellow transition-all"
                                                                    value={newMatch.date}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Kickoff Time</Label>
                                                                <Input
                                                                    type="time"
                                                                    className="h-12 bg-black/60 border-white/10 rounded-xl text-sm"
                                                                    value={newMatch.time}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Over Limit</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-12 bg-black/60 border-white/10 rounded-xl text-sm"
                                                                    value={newMatch.overs}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, overs: parseInt(e.target.value) })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Stage</Label>
                                                                <select
                                                                    className="w-full h-12 bg-black/60 border border-white/10 rounded-xl text-xs text-white px-3"
                                                                    value={newMatch.matchType}
                                                                    onChange={(e) => setNewMatch({ ...newMatch, matchType: e.target.value })}
                                                                >
                                                                    <option value="league">League</option>
                                                                    <option value="semi-final">Semi-Final</option>
                                                                    <option value="final">Final</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
                                                        <div className="flex-1 space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Neutral Venue</Label>
                                                            <Input
                                                                className="h-12 bg-black/60 border-white/10 rounded-xl text-sm"
                                                                value={newMatch.venue}
                                                                onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button type="submit" className="h-12 px-12 bg-brand-yellow text-black hover:bg-yellow-400 font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] shadow-xl shadow-brand-yellow/10" isLoading={createMatchMutation.isPending}>
                                                                DEPLOY FIXTURE
                                                            </Button>
                                                        </div>
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
                                    {matches?.filter((m: any) => m.status !== 'completed').map((match: any) => {
                                        const isFinal = match.matchType?.toLowerCase().includes('final');
                                        return (
                                            <Card key={match.id} className={`glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-blue/40 transition-all group overflow-hidden relative ${isFinal ? 'border-brand-yellow/50 bg-brand-yellow/5' : ''}`}>
                                                {isFinal && (
                                                    <div className="absolute top-0 right-0 p-2">
                                                        <Trophy className="w-4 h-4 text-brand-yellow animate-bounce" />
                                                    </div>
                                                )}
                                                <div className={`absolute top-0 left-0 w-1 h-full ${isFinal ? 'bg-brand-yellow' : 'bg-brand-blue/40'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                                <div className="flex items-center gap-8 flex-1 w-full">
                                                    <div className="text-center w-24 flex-shrink-0">
                                                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{match.date}</div>
                                                        <div className={`${isFinal ? 'text-brand-yellow' : 'text-brand-blue'} text-xl font-black font-heading mt-1`}>{formatTime12h(match.time)}</div>
                                                        <div className="mt-2 text-[8px] font-black uppercase tracking-wider">
                                                            {match.tossWinner ? (
                                                                <span className="text-brand-yellow border border-brand-yellow/30 bg-brand-yellow/5 px-2 py-0.5 rounded-full inline-block">
                                                                    {match.tossWinner === match.teamAId ? (match.teamA?.shortName || match.teamA?.name) : (match.teamB?.shortName || match.teamB?.name)} 🏏 {match.tossDecision || 'Wins'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-600 border border-white/5 bg-white/5 px-2 py-0.5 rounded-full inline-block">Toss Pending</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
                                                        <div className="text-right flex-1 min-w-0">
                                                            <div className="text-white font-heading tracking-widest uppercase text-xs truncate">{match.teamA?.shortName || match.teamA?.name}</div>
                                                            <div className="text-brand-yellow font-black text-lg">{match.score?.teamARuns || 0}/{match.score?.teamAWickets || 0}</div>
                                                        </div>
                                                        <div className="bg-white/5 w-10 h-10 rounded-full flex items-center justify-center text-[8px] font-black text-gray-500 border border-white/5 flex-shrink-0">VS</div>
                                                        <div className="text-left flex-1 min-w-0">
                                                            <div className="text-white font-heading tracking-widest uppercase text-xs truncate">{match.teamB?.shortName || match.teamB?.name}</div>
                                                            <div className="text-brand-yellow font-black text-lg">{match.score?.teamBRuns || 0}/{match.score?.teamBWickets || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                                    <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${match.status === 'live' ? 'bg-brand-red/10 text-brand-red border border-brand-red/20' : 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'}`}>
                                                        {match.status === 'live' && <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></div>}
                                                        {match.status}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-10 px-4 bg-white/5 border-white/10 text-white hover:bg-brand-blue hover:text-white uppercase text-[9px] font-black tracking-widest rounded-xl transition-all"
                                                        onClick={() => startScoring(match)}
                                                    >
                                                        <Activity className="w-3.5 h-3.5 mr-2" /> {match.status === 'live' ? 'Scoring' : 'Initialize'}
                                                    </Button>
                                                    <div className="flex gap-1 ml-auto">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-10 h-10 text-gray-400 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded-xl"
                                                            onClick={() => sendReminderMutation.mutate(match.id)}
                                                            isLoading={sendReminderMutation.isPending}
                                                            title="Send Match Reminders"
                                                        >
                                                            {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                                                            onClick={() => setEditingMatch(match)}
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 text-gray-700 hover:text-brand-red hover:bg-brand-red/5 rounded-xl transition-colors"
                                                            onClick={() => { if (confirm('Irreversible: Permanently scrub this match from history?')) deleteMatchMutation.mutate(match.id); }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                    {matches?.filter((m: any) => m.status !== 'completed').length === 0 && (
                                        <div className="text-center py-20 bg-black/40 rounded-3xl border border-dashed border-white/10">
                                            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4 opacity-20" />
                                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No active deployments found</p>
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
                                                    className="text-brand-blue hover:text-white"
                                                    onClick={() => sendResultsMutation.mutate(match.id)}
                                                    isLoading={sendResultsMutation.isPending}
                                                    title="Send Results Email"
                                                >
                                                    {sendResultsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
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
                                    <Button type="submit" className="flex-1" isLoading={updatePlayerMutation.isPending}>
                                        Save Details
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Player Detailed Modal */}
            <AnimatePresence>
                {viewingPlayer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-brand-bg border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header/Profile Head */}
                            <div className="relative h-40 bg-gradient-to-br from-brand-blue/20 to-brand-yellow/20 p-6 flex items-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-4 right-4 text-white hover:bg-white/10"
                                    onClick={() => setViewingPlayer(null)}
                                >
                                    <X className="w-5 h-5" />
                                </Button>

                                <div className="flex gap-6 items-end">
                                    <div className="w-24 h-24 rounded-2xl bg-black border-[3px] border-white/20 overflow-hidden shadow-2xl translate-y-8">
                                        {viewingPlayer.profileImage ? (
                                            <img src={viewingPlayer.profileImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-brand-blue flex items-center justify-center text-3xl font-heading text-white">
                                                {viewingPlayer.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pb-2">
                                        <h3 className="text-2xl font-heading text-white tracking-widest uppercase flex items-center gap-2">
                                            {viewingPlayer.name}
                                            {viewingPlayer.userRole === 'admin' && <Crown className="w-5 h-5 text-brand-yellow" />}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            <span className="text-brand-yellow">{viewingPlayer.role || 'Undecided'}</span>
                                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                            <span>Batch {viewingPlayer.batch}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="p-8 pt-12 overflow-y-auto custom-scrollbar space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Mail className="w-4 h-4 text-brand-yellow" />
                                        <div className="overflow-hidden">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Email Address</div>
                                            <div className="text-xs text-white truncate">{viewingPlayer.email}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Hash className="w-4 h-4 text-brand-blue" />
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Jersey Number</div>
                                            <div className="text-xs text-white uppercase font-bold tracking-widest">#{viewingPlayer.jerseyNumber || '--'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Phone className="w-4 h-4 text-brand-red" />
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Phone Number</div>
                                            <div className="text-xs text-white uppercase font-bold tracking-widest">{viewingPlayer.phone || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Shield className="w-4 h-4 text-emerald-400" />
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Team Status</div>
                                            <div className="text-[10px] text-white uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 inline-block mt-1">
                                                {viewingPlayer.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                        <User className="w-3 h-3" /> About Player
                                    </div>
                                    <div className="bg-white/5 p-5 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed italic">
                                        {viewingPlayer.bio || "No biography provided yet for this player."}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                        <Activity className="w-3 h-3" /> Career Overview
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-white">{viewingPlayer.matchesPlayed || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">Matches</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-brand-blue">{viewingPlayer.totalRuns || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">Runs</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-brand-yellow">{viewingPlayer.totalWickets || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">Wickets</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-emerald-400">{viewingPlayer.totalCatches || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mt-1">Catches</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Batting Detailed */}
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-blue">
                                                    <Zap className="w-3 h-3" /> Batting Performance
                                                </div>
                                                <div className="text-xs font-bold text-white">
                                                    S/R: {viewingPlayer.totalBallsFaced > 0
                                                        ? ((viewingPlayer.totalRuns / viewingPlayer.totalBallsFaced) * 100).toFixed(2)
                                                        : '0.00'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Balls Faced</div>
                                                    <div className="text-sm text-white font-heading">{viewingPlayer.totalBallsFaced || 0}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Total Fours</div>
                                                    <div className="text-sm text-white font-heading">{viewingPlayer.totalFours || 0}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bowling Detailed */}
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-yellow">
                                                    <Target className="w-3 h-3" /> Bowling Skills
                                                </div>
                                                <div className="text-xs font-bold text-white">
                                                    ECO: {viewingPlayer.totalBallsBowled > 0
                                                        ? ((viewingPlayer.totalRunsConceded / (viewingPlayer.totalBallsBowled / 6))).toFixed(2)
                                                        : '0.00'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Overs</div>
                                                    <div className="text-sm text-white font-heading">{(viewingPlayer.totalBallsBowled / 6).toFixed(1) || '0.0'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Runs Conc.</div>
                                                    <div className="text-sm text-white font-heading">{viewingPlayer.totalRunsConceded || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                                <Button variant="outline" className="text-xs uppercase font-bold tracking-widest border-white/10" onClick={() => setViewingPlayer(null)}>Close View</Button>
                                <Button className="bg-brand-blue hover:bg-brand-blue/80 text-xs uppercase font-bold tracking-widest" onClick={() => {
                                    setEditingPlayer(viewingPlayer);
                                    setViewingPlayer(null);
                                }}>
                                    <Edit className="w-3 h-3 mr-2" /> Edit Details
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Unassign Confirmation Modal */}
            <AnimatePresence>
                {unassignConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-brand-bg border border-brand-red/20 rounded-[2rem] p-8 w-full max-w-md shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent"></div>

                            <div className="w-20 h-20 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto mb-6 border border-brand-red/20">
                                <RotateCcw className="w-10 h-10 text-brand-red animate-pulse" />
                            </div>

                            <h3 className="text-2xl font-heading text-white tracking-widest uppercase mb-2">Relinquish Asset?</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                You are about to return <span className="text-white font-bold">{unassignConfirmation.name}</span> to the <span className="text-brand-yellow font-bold">Draft Pool</span>.
                                This player will be removed from <span className="text-brand-blue font-bold">{unassignConfirmation.team?.name || 'their team'}</span> immediately.
                            </p>

                            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-8 flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden">
                                    {unassignConfirmation.profileImage ? (
                                        <img src={unassignConfirmation.profileImage} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-brand-blue flex items-center justify-center text-white font-bold">{unassignConfirmation.name?.[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs font-black text-white uppercase tracking-widest">{unassignConfirmation.name}</div>
                                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{unassignConfirmation.role} • Batch {unassignConfirmation.batch}</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button
                                    className="h-12 bg-brand-red text-white hover:bg-red-600 font-black uppercase tracking-[0.2em] rounded-xl transition-all hover:scale-[1.02]"
                                    onClick={() => {
                                        unassignPlayerMutation.mutate(unassignConfirmation.id);
                                        setUnassignConfirmation(null);
                                    }}
                                    isLoading={unassignPlayerMutation.isPending}
                                >
                                    CONFIRM UNASSIGN
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-widest"
                                    onClick={() => setUnassignConfirmation(null)}
                                >
                                    Abort Operation
                                </Button>
                            </div>
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

                            {isInitializingScoring ? (
                                <div className="flex flex-col items-center justify-center p-20 min-h-[400px]">
                                    <Loader2 className="w-12 h-12 animate-spin text-brand-red mb-6" />
                                    <p className="text-gray-400 font-heading tracking-[0.2em] text-sm uppercase animate-pulse text-center">Loading Live Match Data...</p>
                                    <p className="text-gray-600 text-[10px] mt-2 italic">Please wait while we sync the scoreboard and player rosters.</p>
                                </div>
                            ) : (
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
                                                    <Button className="w-full bg-brand-blue hover:bg-blue-600 h-10 gap-2" onClick={() => saveScoring().catch(console.error)} isLoading={updateMatchScoreMutation.isPending || updateMatchStatsMutation.isPending}>
                                                        {(updateMatchScoreMutation.isPending || updateMatchStatsMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}  SAVE LIVE SCOREBOARD
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Toss Management */}
                                        <Card className="glass-card border-brand-yellow/30 mt-6">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-brand-yellow/10 rounded-md text-brand-yellow"><Flag className="w-4 h-4" /></div>
                                                    <CardTitle className="text-sm font-heading tracking-widest text-brand-yellow uppercase">Toss</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Toss Won By</Label>
                                                    <select
                                                        id="toss-winner-select"
                                                        defaultValue={scoringMatch.tossWinner || ''}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg h-10 px-3 text-sm text-white focus:border-brand-yellow transition-all appearance-none"
                                                    >
                                                        <option value="">Not Conducted</option>
                                                        {scoringMatch.teamA && <option value={scoringMatch.teamAId}>{scoringMatch.teamA.name}</option>}
                                                        {scoringMatch.teamB && <option value={scoringMatch.teamBId}>{scoringMatch.teamB.name}</option>}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Elected To</Label>
                                                    <select
                                                        id="toss-decision-select"
                                                        defaultValue={scoringMatch.tossDecision || ''}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg h-10 px-3 text-sm text-white focus:border-brand-yellow transition-all appearance-none"
                                                    >
                                                        <option value="">—</option>
                                                        <option value="bat">Bat First</option>
                                                        <option value="bowl">Bowl First</option>
                                                    </select>
                                                </div>
                                                <Button
                                                    className="w-full bg-brand-yellow/90 hover:bg-brand-yellow text-black font-bold h-10 gap-2 uppercase tracking-widest text-xs"
                                                    isLoading={scoringMatch?.isTossUpdating}
                                                    onClick={async () => {
                                                        const tossWinner = (document.getElementById('toss-winner-select') as HTMLSelectElement).value;
                                                        const tossDecision = (document.getElementById('toss-decision-select') as HTMLSelectElement).value;
                                                        try {
                                                            // We use setScoringMatch to show a local loading state since toss is just a PUT
                                                            setScoringMatch({ ...scoringMatch, isTossUpdating: true });
                                                            await api.put(`/matches/${scoringMatch.id}`, {
                                                                tossWinner: tossWinner || null,
                                                                tossDecision: tossDecision || null,
                                                            });
                                                            setScoringMatch({ ...scoringMatch, tossWinner, tossDecision, isTossUpdating: false });
                                                            toast.success('Toss result saved! 🪙');
                                                        } catch (err: any) {
                                                            setScoringMatch({ ...scoringMatch, isTossUpdating: false });
                                                            toast.error(err.response?.data?.error || 'Failed to save toss');
                                                        }
                                                    }}
                                                >
                                                    {scoringMatch?.isTossUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />} SAVE TOSS RESULT
                                                </Button>
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
                                                        defaultValue={scoringMatch.status === 'no_result' ? 'no_result' : (scoringMatch.winnerTeamId || '')}
                                                        className="w-full bg-black/50 border border-white/10 rounded h-10 px-3 text-sm text-white focus:border-emerald-500"
                                                    >
                                                        <option value="">Select Winner</option>
                                                        {scoringMatch.teamA && <option value={scoringMatch.teamAId}>{scoringMatch.teamA.name}</option>}
                                                        {scoringMatch.teamB && <option value={scoringMatch.teamBId}>{scoringMatch.teamB.name}</option>}
                                                        <option value="no_result">No Result / Draw</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-gray-400 uppercase">Man of the Match</Label>
                                                    <select
                                                        id="motm-select"
                                                        defaultValue={typeof scoringMatch.manOfTheMatch === 'object' ? (scoringMatch.manOfTheMatch?.id || '') : (scoringMatch.manOfTheMatch || '')}
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
                                                    isLoading={completeMatchMutation.isPending}
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
                                        <div className="flex justify-end pt-4 gap-4">
                                            <Button
                                                variant="outline"
                                                className="border-brand-yellow text-brand-yellow hover:bg-brand-yellow/10 font-bold h-11 px-6 gap-2"
                                                onClick={() => sendReminderMutation.mutate(scoringMatch.id)}
                                                isLoading={sendReminderMutation.isPending}
                                            >
                                                {sendReminderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                                                SEND REMINDER
                                            </Button>
                                            <Button
                                                className="bg-brand-yellow text-black hover:bg-yellow-500 font-bold h-11 px-8 gap-2"
                                                onClick={() => updateMatchStatsMutation.mutate({ matchId: scoringMatch.id, stats: matchPlayerStatsData })}
                                                isLoading={updateMatchStatsMutation.isPending}
                                            >
                                                <Database className="w-4 h-4" />
                                                UPDATE PLAYER STATS
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    <Button type="submit" className="flex-1 bg-brand-yellow text-black hover:bg-yellow-500 font-bold" isLoading={updateMatchMutation.isPending}>
                                        SAVE CHANGES
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
