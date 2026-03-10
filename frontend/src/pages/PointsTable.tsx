import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, ArrowRightCircle, Star, Target, Zap, X, Activity, User, Crown, Mail, Hash, Phone, Shield } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function PointsTable() {
    const tableContainer = useRef<HTMLDivElement>(null);
    const [viewingPlayer, setViewingPlayer] = useState<any>(null);

    const { data: pointsTable, isLoading, error } = useQuery({
        queryKey: ['points-table'],
        queryFn: async () => {
            const { data } = await api.get('/matches/points-table');
            return data;
        },
        refetchInterval: 30000,
    });

    const { data: leaderboard } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const { data } = await api.get('/players/leaderboard');
            return data;
        },
    });

    const { data: mvp } = useQuery({
        queryKey: ['series-mvp'],
        queryFn: async () => {
            const { data } = await api.get('/players/series-mvp');
            return data;
        },
    });

    useGSAP(() => {
        if (!isLoading && pointsTable) {
            gsap.from('.table-row', {
                x: -30,
                opacity: 0,
                stagger: 0.1,
                duration: 0.8,
                ease: 'power3.out'
            });
        }
    }, { dependencies: [isLoading, pointsTable], scope: tableContainer });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">Failed to load points table</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" ref={tableContainer}>
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-brand-blue/20 p-3 rounded-full border border-brand-blue/30">
                        <Trophy className="w-8 h-8 text-brand-blue" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-heading tracking-widest text-white uppercase neon-text-blue">Points Table</h1>
                        <p className="text-gray-400">Current standings and NRR calculations</p>
                    </div>
                </div>

                <Card className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/60 border-b border-white/10 uppercase text-xs tracking-widest font-heading text-gray-400">
                                    <th className="px-6 py-4 font-normal text-center w-16">Pos</th>
                                    <th className="px-6 py-4 font-normal min-w-[200px]">Team</th>
                                    <th className="px-6 py-4 font-normal text-center">Played</th>
                                    <th className="px-6 py-4 font-normal text-center text-emerald-400">Won</th>
                                    <th className="px-6 py-4 font-normal text-center text-brand-red">Lost</th>
                                    <th className="px-6 py-4 font-normal text-center text-brand-yellow text-lg font-bold">Points</th>
                                    <th className="px-6 py-4 font-normal text-center">NRR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {pointsTable?.map((row: any, index: number) => {
                                    const isTop2 = index < 2;
                                    return (
                                        <tr
                                            key={row.id}
                                            className={`
                                                table-row hover:bg-white/5 transition-colors group
                                                ${isTop2 ? 'bg-gradient-to-r from-brand-blue/5 to-transparent' : ''}
                                            `}
                                        >
                                            <td className="px-6 py-4 text-center">
                                                <span className={`
                                                    flex items-center justify-center w-8 h-8 rounded-full mx-auto font-heading text-lg
                                                    ${index === 0 ? 'bg-brand-yellow font-bold text-black' :
                                                        index === 1 ? 'bg-gray-300 font-bold text-black' :
                                                            'bg-black/40 text-gray-300 border border-white/20'
                                                    }
                                                `}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Link to={`/team/${row.team?.id}`} className="hover:scale-110 transition-transform">
                                                        {row.team?.logo ? (
                                                            <img src={row.team.logo} alt={row.team.name} className="w-10 h-10 rounded-full bg-white/10 object-cover border border-white/20 shadow-lg" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold text-white">
                                                                {row.team?.shortName || row.team?.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </Link>
                                                    <div>
                                                        <Link to={`/team/${row.team?.id}`} className="hover:text-brand-yellow transition-colors">
                                                            <span className={`font-heading tracking-wider text-xl ${isTop2 ? 'neon-text-blue' : 'text-white'}`}>
                                                                {row.team?.name}
                                                            </span>
                                                        </Link>
                                                        {isTop2 && <div className="text-xs text-brand-blue ml-1 flex items-center"><ArrowRightCircle className="w-3 h-3 mr-1" /> Qualifier Zone</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-300 text-lg">{row.matchesPlayed}</td>
                                            <td className="px-6 py-4 text-center text-emerald-400 text-lg font-bold">{row.wins}</td>
                                            <td className="px-6 py-4 text-center text-brand-red text-lg font-bold">{row.losses}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-brand-yellow/20 text-brand-yellow px-4 py-1 rounded-full text-xl font-bold font-heading">
                                                    {row.points}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-300 font-bold">
                                                {row.nrr > 0 ? `+${row.nrr.toFixed(2)}` : row.nrr.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pointsTable?.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No matches played yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* MVP Section */}
                {mvp && (
                    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16">
                        <Card className="bg-gradient-to-br from-[#111827] to-[#1e293b] border border-brand-yellow/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Star className="w-32 h-32 text-brand-yellow" />
                            </div>
                            <CardHeader className="pb-2">
                                <p className="font-heading tracking-widest text-brand-yellow text-sm uppercase flex items-center gap-2">
                                    <Trophy className="w-4 h-4" /> Most Valuable Player
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col md:flex-row items-center gap-8 z-10 relative">
                                <img
                                    src={mvp.profileImage || `https://ui-avatars.com/api/?name=${mvp.name}&background=random`}
                                    alt={mvp.name}
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-brand-yellow shadow-[0_0_20px_rgba(255,214,10,0.4)] object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                                    onClick={() => setViewingPlayer(mvp)}
                                />
                                <div className="flex-1 text-center md:text-left">
                                    <Link to={`/player/${mvp.id}`} className="hover:text-brand-yellow transition-colors">
                                        <h2 className="text-3xl md:text-5xl font-heading text-white tracking-wider mb-2">{mvp.name}</h2>
                                    </Link>
                                    <p className="text-xl text-gray-300 font-light mb-4">{mvp.teamName}</p>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                        <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5 group-hover:border-brand-yellow/30 transition-colors">
                                            <div className="text-gray-400 text-xs uppercase mb-1 drop-shadow-md">Points</div>
                                            <div className="text-2xl font-bold text-brand-yellow font-heading drop-shadow-md">{mvp.points}</div>
                                        </div>
                                        <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5">
                                            <div className="text-gray-400 text-xs uppercase mb-1 drop-shadow-md">Runs</div>
                                            <div className="text-2xl font-bold text-white font-heading drop-shadow-md">{mvp.totalRuns}</div>
                                        </div>
                                        <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/5">
                                            <div className="text-gray-400 text-xs uppercase mb-1 drop-shadow-md">Wickets</div>
                                            <div className="text-2xl font-bold text-white font-heading drop-shadow-md">{mvp.totalWickets}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Top Performers Section */}
                {leaderboard && (
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Batsmen */}
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <Card className="glass-card h-full">
                                <CardHeader>
                                    <CardTitle className="font-heading tracking-widest text-white uppercase flex items-center gap-2 text-sm md:text-base">
                                        <Target className="w-5 h-5 text-emerald-400" /> Orange Cap (Runs)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {leaderboard.topBatsmen?.slice(0, 3).map((player: any, i: number) => (
                                            <div key={player.id} className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5 hover:border-emerald-400/30 transition-colors group">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm ${i === 0 ? 'bg-orange-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <img
                                                    src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random`}
                                                    alt={player.name}
                                                    className="w-10 h-10 rounded-full object-cover group-hover:scale-110 transition-transform cursor-pointer"
                                                    onClick={() => setViewingPlayer(player)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <Link to={`/player/${player.id}`} className="hover:text-emerald-400 transition-colors">
                                                        <p className="text-white font-medium truncate">{player.name}</p>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-emerald-400 font-bold text-lg font-heading">{player.totalRuns}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Top Bowlers */}
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <Card className="glass-card h-full">
                                <CardHeader>
                                    <CardTitle className="font-heading tracking-widest text-white uppercase flex items-center gap-2 text-sm md:text-base">
                                        <Zap className="w-5 h-5 text-brand-blue" /> Purple Cap (Wickets)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {leaderboard.topBowlers?.slice(0, 3).map((player: any, i: number) => (
                                            <div key={player.id} className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5 hover:border-brand-blue/30 transition-colors group">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm ${i === 0 ? 'bg-purple-500 text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>
                                                    {i + 1}
                                                </div>
                                                <img
                                                    src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random`}
                                                    alt={player.name}
                                                    className="w-10 h-10 rounded-full object-cover group-hover:scale-110 transition-transform cursor-pointer"
                                                    onClick={() => setViewingPlayer(player)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <Link to={`/player/${player.id}`} className="hover:text-brand-blue transition-colors">
                                                        <p className="text-white font-medium truncate">{player.name}</p>
                                                    </Link>
                                                    <p className="text-xs text-gray-500 truncate">{player.teamName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-brand-blue font-bold text-lg font-heading">{player.totalWickets}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {viewingPlayer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f1115] border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setViewingPlayer(null)}
                                className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-brand-red/20 text-white rounded-full transition-colors border border-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Modal Header/Banner */}
                            <div className="h-40 bg-gradient-to-br from-brand-blue/20 via-brand-red/10 to-brand-yellow/10 relative">
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0f1115] to-transparent"></div>

                                <div className="absolute inset-0 flex items-end px-8 pb-0">
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
                                                <span className="text-brand-yellow font-black">{viewingPlayer.role || 'Undecided'}</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                <span className="font-black">Batch {viewingPlayer.batch}</span>
                                            </div>
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
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Email</div>
                                            <div className="text-xs text-white truncate font-black">{viewingPlayer.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Hash className="w-4 h-4 text-brand-blue" />
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Jersey</div>
                                            <div className="text-xs text-white uppercase font-black tracking-widest">#{viewingPlayer.jerseyNumber || '--'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                                        <Phone className="w-4 h-4 text-brand-red" />
                                        <div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Phone</div>
                                            <div className="text-xs text-white uppercase font-black tracking-widest">{viewingPlayer.phone || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                        <User className="w-3 h-3 font-black" /> About Player
                                    </div>
                                    <div className="bg-white/5 p-5 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed italic">
                                        {viewingPlayer.bio || "No biography provided yet for this player."}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                        <Activity className="w-3 h-3 font-black" /> Career Overview
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-white">{viewingPlayer.matchesPlayed || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-black mt-1">Matches</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-brand-blue">{viewingPlayer.totalRuns || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-black mt-1">Runs</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-brand-yellow">{viewingPlayer.totalWickets || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-black mt-1">Wickets</div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 text-center">
                                            <div className="text-2xl font-heading text-emerald-400">{viewingPlayer.totalCatches || 0}</div>
                                            <div className="text-[10px] text-gray-500 uppercase font-black mt-1">Catches</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingPlayer(null)}
                                    className="border-white/10 text-xs font-bold uppercase tracking-widest"
                                >
                                    Close Portal
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

