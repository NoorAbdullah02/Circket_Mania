import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Shield, Trophy, Target, Crosshair, Activity, Star, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function PlayerProfile() {
    const { id } = useParams<{ id: string }>();
    const container = useRef<HTMLDivElement>(null);

    const { data: player, isLoading } = useQuery({
        queryKey: ['player-profile', id],
        queryFn: async () => {
            const { data } = await api.get(`/players/${id}`);
            return data;
        },
        enabled: !!id,
    });

    useGSAP(() => {
        if (player) {
            // Only use transform animations — never opacity (causes elements to disappear)
            gsap.from('.profile-header', { scale: 0.95, duration: 0.8, ease: 'power3.out' });
            gsap.from('.stat-card', { y: 20, duration: 0.6, stagger: 0.08, ease: 'back.out(1.5)', delay: 0.2 });
            gsap.from('.detail-card', { y: 20, duration: 0.8, ease: 'power3.out', delay: 0.3 });
        }
    }, { dependencies: [player], scope: container });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
            </div>
        );
    }

    if (!player) {
        return (
            <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-gray-500">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-heading tracking-widest uppercase">Player not found</h2>
                <Link to="/" className="mt-4 text-brand-blue hover:text-white transition-colors uppercase text-xs tracking-widest font-bold">Return to Stadium</Link>
            </div>
        );
    }

    const stats = [
        { label: 'Matches', value: player.matchesPlayed || 0, color: 'text-brand-blue', icon: Activity },
        { label: 'Runs', value: player.totalRuns || 0, color: 'text-brand-yellow', icon: Trophy },
        { label: 'Wickets', value: player.totalWickets || 0, color: 'text-brand-red', icon: Crosshair },
        { label: '4s', value: player.totalFours || 0, color: 'text-white', icon: Star },
        { label: '6s', value: player.totalSixes || 0, color: 'text-brand-yellow', icon: Zap },
        { label: 'Catches', value: player.totalCatches || 0, color: 'text-purple-400', icon: Target },
    ];

    const battingAvg = player.matchesPlayed > 0 ? (player.totalRuns / player.matchesPlayed).toFixed(1) : '0.0';
    const strikeRate = player.totalBallsFaced > 0 ? ((player.totalRuns / player.totalBallsFaced) * 100).toFixed(1) : '0.0';
    const bowlingAvg = player.totalWickets > 0 ? (player.totalRunsConceded / player.totalWickets).toFixed(1) : '-';
    const economyRate = player.totalBallsBowled > 0 ? ((player.totalRunsConceded / (player.totalBallsBowled / 6))).toFixed(2) : '-';

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative" ref={container}>
            {/* Background Accents */}
            <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-brand-red/5 rounded-full blur-[120px]" />

            {/* Player Header */}
            <div className="relative overflow-hidden rounded-[2.5rem] mb-12 glass-card border-none profile-header">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-transparent to-brand-red/20 opacity-40" />
                <div className="absolute inset-0 backdrop-blur-[2px]" />

                <div className="relative flex flex-col md:flex-row items-center gap-10 p-10 md:p-16">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-brand-blue to-brand-red blur-2xl opacity-30 animate-pulse" />
                        <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent">
                            <img
                                src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random&size=200`}
                                alt={player.name}
                                className="w-full h-full rounded-full object-cover border-4 border-brand-bg shadow-2xl relative z-10"
                            />
                        </div>
                        {player.isCaptain && (
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand-yellow text-black rounded-2xl flex items-center justify-center text-lg font-black z-20 shadow-xl rotate-12 border-4 border-brand-bg uppercase">
                                <Shield className="w-6 h-6" />
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                            <h1 className="text-5xl md:text-7xl font-heading tracking-widest text-white uppercase neon-text-blue leading-none">
                                {player.name}
                            </h1>
                            {player.jerseyNumber && (
                                <span className="text-brand-yellow font-heading text-4xl mb-1 opacity-80">#{player.jerseyNumber}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 justify-center md:justify-start flex-wrap">
                            <span className="bg-brand-blue/10 text-brand-blue px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-brand-blue/30 backdrop-blur-md">
                                {player.role || 'Player'}
                            </span>
                            <span className="text-gray-400 text-xs font-bold tracking-widest uppercase bg-white/5 px-4 py-1.5 rounded-full">{player.batch} BATCH</span>
                            {player.status === 'activated' && (
                                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Active
                                </span>
                            )}
                        </div>

                        {player.team ? (
                            <div className="flex items-center gap-3 bg-black/40 border border-white/5 py-1.5 px-4 rounded-full backdrop-blur-md translate-y-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]`} style={{ color: player.team.color || '#38BDF8' }} />
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Member Of</span>
                                <span className="text-white font-bold text-[11px] uppercase tracking-wider">{player.team.name}</span>
                                <Link to={`/team/${player.team.id}`} className="hover:text-brand-blue transition-colors group">
                                    <ArrowRight className="w-3 h-3 text-gray-600 group-hover:text-brand-blue transition-all" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-black/40 border border-white/5 py-1.5 px-4 rounded-full backdrop-blur-md translate-y-0 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                <span className="w-3 h-3 rounded-full bg-gray-500" />
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Free Agent</span>
                            </div>
                        )}

                        {player.bio && (
                            <p className="mt-8 text-gray-400 max-w-xl text-sm leading-relaxed font-light italic">"{player.bio}"</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-12">
                {stats.map((stat, i) => (
                    <div key={stat.label} className="stat-card">
                        <Card className="glass-card text-center hover:border-brand-blue/40 hover:-translate-y-1 transition-all duration-500 overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 group-hover:opacity-10 group-hover:scale-125 transition-all">
                                <stat.icon className="w-12 h-12" />
                            </div>
                            <CardContent className="p-6 relative z-10">
                                <div className={`text-4xl font-heading font-black ${stat.color} drop-shadow-sm`}>{stat.value}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mt-2">{stat.label}</div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Batting */}
                <Card className="glass-card detail-card hover:border-brand-yellow/30 transition-colors">
                    <CardHeader className="border-b border-white/5 py-6">
                        <CardTitle className="font-heading tracking-[0.2em] flex items-center gap-4 text-sm uppercase text-brand-yellow">
                            <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center">
                                <Target className="w-4 h-4" />
                            </div>
                            Offensive Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        {[
                            { label: 'Total Runs Scored', value: player.totalRuns || 0, color: 'text-white' },
                            { label: 'Deliveries Faced', value: player.totalBallsFaced || 0, color: 'text-gray-400' },
                            { label: 'Batting Average', value: battingAvg, color: 'text-brand-blue' },
                            { label: 'Strike Efficiency', value: strikeRate, color: 'text-brand-yellow' },
                            { label: 'Boundary Fours', value: player.totalFours || 0, color: 'text-white' },
                            { label: 'Boundary Sixes', value: player.totalSixes || 0, color: 'text-brand-yellow' },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center group">
                                <span className="text-gray-500 text-[11px] uppercase tracking-widest font-bold group-hover:text-gray-400 transition-colors">{stat.label}</span>
                                <span className={`${stat.color} font-heading text-2xl tracking-widest`}>{stat.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Bowling */}
                <Card className="glass-card detail-card hover:border-brand-red/30 transition-colors">
                    <CardHeader className="border-b border-white/5 py-6">
                        <CardTitle className="font-heading tracking-[0.2em] flex items-center gap-4 text-sm uppercase text-brand-red">
                            <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                                <Crosshair className="w-4 h-4" />
                            </div>
                            Defensive Execution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        {[
                            { label: 'Wickets Taken', value: player.totalWickets || 0, color: 'text-white' },
                            { label: 'Deliveries Bowled', value: player.totalBallsBowled || 0, color: 'text-gray-400' },
                            { label: 'Economy Rating', value: economyRate, color: 'text-brand-red' },
                            { label: 'Bowling Average', value: bowlingAvg, color: 'text-brand-blue' },
                            { label: 'Fielding Catches', value: player.totalCatches || 0, color: 'text-white' },
                        ].map(stat => (
                            <div key={stat.label} className="flex justify-between items-center group">
                                <span className="text-gray-500 text-[11px] uppercase tracking-widest font-bold group-hover:text-gray-400 transition-colors">{stat.label}</span>
                                <span className={`${stat.color} font-heading text-2xl tracking-widest`}>{stat.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

