import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Shield, Trophy, Target, Crosshair, Activity } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function PlayerProfile() {
    const { id } = useParams<{ id: string }>();

    const { data: player, isLoading } = useQuery({
        queryKey: ['player-profile', id],
        queryFn: async () => {
            const { data } = await api.get(`/players/${id}`);
            return data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
            </div>
        );
    }

    if (!player) {
        return <div className="text-center text-red-500 p-8">Player not found</div>;
    }

    const stats = [
        { label: 'Matches', value: player.matchesPlayed || 0, color: 'text-brand-blue' },
        { label: 'Runs', value: player.totalRuns || 0, color: 'text-brand-yellow' },
        { label: 'Wickets', value: player.totalWickets || 0, color: 'text-emerald-400' },
        { label: 'Fours', value: player.totalFours || 0, color: 'text-white' },
        { label: 'Catches', value: player.totalCatches || 0, color: 'text-purple-400' },
    ];

    const battingAvg = player.matchesPlayed > 0 ? (player.totalRuns / player.matchesPlayed).toFixed(1) : '0.0';
    const strikeRate = player.totalBallsFaced > 0 ? ((player.totalRuns / player.totalBallsFaced) * 100).toFixed(1) : '0.0';
    const bowlingAvg = player.totalWickets > 0 ? (player.totalRunsConceded / player.totalWickets).toFixed(1) : '-';
    const economyRate = player.totalBallsBowled > 0 ? ((player.totalRunsConceded / (player.totalBallsBowled / 6))).toFixed(2) : '-';

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Player Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl mb-10"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 via-transparent to-brand-red/20" />
                <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
                    <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-brand-blue to-brand-red blur-lg opacity-40" />
                        <img
                            src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random&size=200`}
                            alt={player.name}
                            className="relative w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white/20 shadow-xl"
                        />
                        {player.isCaptain && (
                            <div className="absolute bottom-1 right-1 w-8 h-8 bg-brand-yellow text-black rounded-full flex items-center justify-center text-sm font-black z-10">C</div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-6xl font-heading tracking-widest text-white uppercase neon-text-blue">
                            {player.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-3 justify-center md:justify-start flex-wrap">
                            <span className="bg-brand-blue/20 text-brand-blue px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-brand-blue/30">
                                {player.role || 'Undecided'}
                            </span>
                            <span className="text-gray-400 text-sm">{player.batch} Batch</span>
                            {player.jerseyNumber && (
                                <span className="text-brand-yellow font-heading text-xl">#{player.jerseyNumber}</span>
                            )}
                        </div>
                        {player.team && (
                            <Link to={`/team/${player.team.id}`} className="inline-flex items-center gap-3 mt-4 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-colors border border-white/10">
                                <img
                                    src={player.team.logo || `https://ui-avatars.com/api/?name=${player.team.name}&background=random`}
                                    className="w-6 h-6 rounded-full object-cover"
                                    alt={player.team.name}
                                />
                                <span className="text-white font-heading tracking-wider text-sm">{player.team.name}</span>
                            </Link>
                        )}
                        {player.bio && (
                            <p className="mt-4 text-gray-400 max-w-lg text-sm font-light">{player.bio}</p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-10">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="glass-card text-center hover:border-brand-blue/30 transition-all">
                            <CardContent className="p-4">
                                <div className={`text-3xl font-heading font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Batting */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="font-heading tracking-widest flex items-center gap-2 text-sm uppercase">
                            <Target className="w-4 h-4 text-brand-yellow" />
                            Batting Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {[
                            { label: 'Total Runs', value: player.totalRuns || 0 },
                            { label: 'Balls Faced', value: player.totalBallsFaced || 0 },
                            { label: 'Batting Average', value: battingAvg },
                            { label: 'Strike Rate', value: strikeRate },
                            { label: 'Fours', value: player.totalFours || 0 },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm">{stat.label}</span>
                                <span className="text-white font-heading text-lg">{stat.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Bowling */}
                <Card className="glass-card">
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="font-heading tracking-widest flex items-center gap-2 text-sm uppercase">
                            <Crosshair className="w-4 h-4 text-emerald-400" />
                            Bowling Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {[
                            { label: 'Total Wickets', value: player.totalWickets || 0 },
                            { label: 'Balls Bowled', value: player.totalBallsBowled || 0 },
                            { label: 'Runs Conceded', value: player.totalRunsConceded || 0 },
                            { label: 'Bowling Average', value: bowlingAvg },
                            { label: 'Economy Rate', value: economyRate },
                            { label: 'Catches', value: player.totalCatches || 0 },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-gray-400 text-sm">{stat.label}</span>
                                <span className="text-white font-heading text-lg">{stat.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
