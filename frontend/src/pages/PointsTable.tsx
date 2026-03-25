import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Loader2, ArrowRightCircle, Star, Target, Zap, X, Activity, User, Crown, Mail, Hash, Phone, Shield } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
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

    const { data: finalMatch } = useQuery({
        queryKey: ['final-match'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/matches/final');
                return data;
            } catch {
                return null;
            }
        },
    });

    const { data: winnerTeamPlayers } = useQuery({
        queryKey: ['winner-team-players', finalMatch?.winner?.id],
        queryFn: async () => {
            if (!finalMatch?.winner?.id) return [];
            try {
                const { data } = await api.get(`/teams/${finalMatch.winner.id}`);
                return data.players || [];
            } catch {
                return [];
            }
        },
        enabled: !!finalMatch?.winner?.id,
    });

    useGSAP(() => {
        if (!isLoading && pointsTable) {
            gsap.from('.table-row', {
                x: -20,
                scale: 0.98,
                stagger: 0.05,
                duration: 0.6,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative" ref={tableContainer}>
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-[30vw] h-[30vw] bg-brand-yellow/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[30vw] h-[30vw] bg-brand-blue/5 rounded-full blur-[100px]" />
            </div>

            <div className="space-y-4 md:space-y-6 relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center gap-3 glass-premium px-6 py-3 rounded-full mb-6 shadow-lg">
                        <Trophy className="w-4 h-4 text-brand-yellow" />
                        <span className="text-brand-yellow font-heading text-xs tracking-[0.5em] uppercase">Tournament Standings</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading tracking-wide text-white uppercase">
                        Points <span className="text-brand-yellow drop-shadow-[0_0_20px_rgba(255,214,10,0.4)]">Table</span>
                    </h1>
                    <p className="text-gray-400 mt-4 font-light text-sm sm:text-base max-w-xl mx-auto">Current standings, net run rate calculations, and top performers.</p>
                </div>

                {/* The Grand Final Section */}
                {finalMatch?.isTournamentComplete && finalMatch?.winner && (
                    <div className="space-y-4">
                        {/* Grand Final Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center justify-center gap-4"
                        >
                            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>
                            <div className="text-center">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading text-brand-yellow uppercase tracking-widest drop-shadow-[0_0_20px_rgba(255,214,10,0.5)]">
                                    🎯 THE GRAND FINAL 🎯
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-300 mt-1 tracking-widest">Tournament Championship Match</p>
                            </div>
                            <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent"></div>
                        </motion.div>

                        {/* Tournament Champion Display */}
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative overflow-hidden rounded-3xl border-2 border-brand-yellow/60 bg-black p-0 shadow-2xl group"
                        >
                            {/* Multi-layer animated background */}
                            <div className="absolute inset-0 overflow-hidden">
                                {/* Gradient orb 1 */}
                                <motion.div
                                    animate={{ rotate: 360, x: [0, 20, 0] }}
                                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                                    className="absolute -top-1/2 -right-1/2 h-full w-full rounded-full bg-linear-to-bl from-brand-yellow/30 via-transparent to-transparent blur-3xl"
                                ></motion.div>

                                {/* Gradient orb 2 */}
                                <motion.div
                                    animate={{ rotate: -360, x: [0, -20, 0] }}
                                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                                    className="absolute -bottom-1/2 -left-1/2 h-full w-full rounded-full bg-linear-to-tr from-brand-red/20 via-transparent to-transparent blur-3xl"
                                ></motion.div>

                                {/* Top glow line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-yellow to-transparent opacity-60"></div>
                            </div>

                            {/* Content */}
                            <div className="relative z-10">
                                {/* Header Section */}
                                <div className="text-center pt-6 sm:pt-8 md:pt-12 px-4 sm:px-6">
                                    <motion.div
                                        animate={{ y: [0, -15, 0], rotateZ: [0, 5, -5, 0] }}
                                        transition={{ duration: 2.5, repeat: Infinity, type: "spring" }}
                                        className="mb-4 sm:mb-6 flex justify-center"
                                    >
                                        <Trophy className="h-14 sm:h-20 md:h-24 lg:h-32 w-14 sm:w-20 md:w-24 lg:w-32 text-brand-yellow drop-shadow-[0_0_30px_rgba(255,214,10,0.6)] filter" />
                                    </motion.div>

                                    <motion.h2
                                        animate={{ opacity: [0.8, 1, 0.8] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="mb-3 sm:mb-4 font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-widest text-brand-yellow uppercase drop-shadow-[0_0_20px_rgba(255,214,10,0.4)]"
                                    >
                                        🏆 TOURNAMENT 🏆
                                    </motion.h2>
                                    <motion.div
                                        animate={{ opacity: [1, 0.7, 1] }}
                                        transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                                        className="mb-6 sm:mb-8 font-heading text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-[0.3em] text-white drop-shadow-lg"
                                    >
                                        CHAMPION
                                    </motion.div>
                                </div>

                                {/* Champion Team Section */}
                                <div className="px-4 sm:px-6 md:px-12 pb-6 sm:pb-8">
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-16 bg-gradient-to-r from-brand-yellow/10 via-black to-brand-red/10 rounded-2xl p-4 sm:p-6 md:p-8 border border-brand-yellow/30"
                                    >
                                        {/* Logo Section */}
                                        {finalMatch.winner.logo && (
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.08, 1],
                                                    boxShadow: [
                                                        "0 0 20px rgba(255,214,10,0.3)",
                                                        "0 0 50px rgba(255,214,10,0.6)",
                                                        "0 0 20px rgba(255,214,10,0.3)"
                                                    ]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="relative"
                                            >
                                                <div className="absolute inset-0 rounded-full bg-linear-to-tr from-brand-yellow/40 via-transparent to-transparent blur-2xl"></div>
                                                <img
                                                    src={finalMatch.winner.logo}
                                                    alt={finalMatch.winner.name}
                                                    className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full border-3 sm:border-4 md:border-6 border-brand-yellow object-cover relative z-10 drop-shadow-2xl"
                                                />
                                            </motion.div>
                                        )}

                                        {/* Team Info Section */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                            className="text-center md:text-left"
                                        >
                                            <motion.h3
                                                animate={{ letterSpacing: ["0.05em", "0.15em", "0.05em"] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-6xl tracking-wider text-white uppercase mb-2 sm:mb-3 drop-shadow-lg"
                                            >
                                                {finalMatch.winner.name}
                                            </motion.h3>
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                                className="inline-block"
                                            >
                                                <span className="px-4 sm:px-6 md:px-8 py-1.5 sm:py-2 md:py-3 font-heading text-sm sm:text-lg md:text-xl lg:text-2xl tracking-widest text-black uppercase bg-linear-to-r from-brand-yellow to-orange-400 rounded-full font-bold drop-shadow-lg">
                                                    ⭐ CHAMPIONS ⭐
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    </motion.div>
                                </div>

                                {/* Team Members Section */}
                                {winnerTeamPlayers && winnerTeamPlayers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.7, delay: 0.4 }}
                                        className="mx-3 sm:mx-6 md:mx-12 mb-6 sm:mb-8 rounded-2xl border-2 border-brand-yellow/50 bg-linear-to-br from-brand-yellow/15 via-black to-orange-500/10 p-4 sm:p-6 md:p-8 backdrop-blur-sm"
                                    >
                                        <motion.h4
                                            animate={{ textShadow: ["0 0 10px rgba(255,214,10,0.3)", "0 0 20px rgba(255,214,10,0.6)", "0 0 10px rgba(255,214,10,0.3)"] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="mb-4 sm:mb-6 text-center font-heading text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-widest text-brand-yellow uppercase"
                                        >
                                            🎉 Congratulations to All Champions 🎉
                                        </motion.h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                                            {winnerTeamPlayers.map((player: any, index: number) => (
                                                <motion.div
                                                    key={player.id}
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.5, delay: index * 0.08 }}
                                                    whileHover={{
                                                        scale: 1.15,
                                                        boxShadow: "0 0 30px rgba(255,214,10,0.6)",
                                                        y: -10
                                                    }}
                                                    className="group relative rounded-xl border-2 border-brand-yellow/30 bg-gradient-to-b from-brand-yellow/10 to-black p-2 sm:p-3 md:p-4 text-center hover:border-brand-yellow/70 transition-all cursor-pointer"
                                                >
                                                    {/* Glow effect on hover */}
                                                    <div className="absolute inset-0 rounded-xl bg-linear-to-t from-brand-yellow/0 via-brand-yellow/0 to-brand-yellow/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <motion.div
                                                        animate={{ y: [0, -5, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                                        className="relative z-10 mb-2 sm:mb-3"
                                                    >
                                                        <div className="relative inline-block">
                                                            <motion.div
                                                                animate={{ boxShadow: ["0 0 10px rgba(255,214,10,0.2)", "0 0 25px rgba(255,214,10,0.5)", "0 0 10px rgba(255,214,10,0.2)"] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className="absolute inset-0 rounded-full"
                                                            ></motion.div>
                                                            <img
                                                                src={player.profileImage || `https://ui-avatars.com/api/?name=${player.user?.name}&background=random`}
                                                                alt={player.user?.name}
                                                                className="relative h-12 sm:h-14 md:h-16 w-12 sm:w-14 md:w-16 rounded-full object-cover border-2 sm:border-3 border-brand-yellow drop-shadow-lg"
                                                            />
                                                        </div>
                                                    </motion.div>

                                                    <p className="relative z-10 text-[10px] sm:text-xs md:text-sm font-bold text-white truncate drop-shadow-md">
                                                        {player.user?.name || 'Player'}
                                                    </p>

                                                    {player.isCaptain && (
                                                        <motion.div
                                                            animate={{ rotate: [0, 360] }}
                                                            transition={{ duration: 4, repeat: Infinity }}
                                                            className="mt-1 sm:mt-2 flex justify-center"
                                                        >
                                                            <div className="relative">
                                                                <Star className="h-3.5 sm:h-4 md:h-5 w-3.5 sm:w-4 md:w-5 text-brand-yellow drop-shadow-lg" />
                                                                <span className="text-[7px] sm:text-[8px] font-black text-white absolute inset-0 flex items-center justify-center drop-shadow-lg">C</span>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Enhanced Confetti Effect */}
                                <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2 pb-6 sm:pb-8 h-20 sm:h-24">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                y: [0, -80, -100],
                                                opacity: [1, 1, 0],
                                                rotate: [0, 360, 720],
                                                x: [0, Math.sin(i) * 50, Math.cos(i) * 80]
                                            }}
                                            transition={{
                                                duration: 3.5,
                                                repeat: Infinity,
                                                delay: i * 0.15,
                                                ease: "easeOut"
                                            }}
                                            className={`h-2.5 w-2.5 rounded-full drop-shadow-lg ${i % 4 === 0 ? 'bg-brand-yellow' :
                                                i % 4 === 1 ? 'bg-brand-red' :
                                                    i % 4 === 2 ? 'bg-brand-blue' :
                                                        'bg-orange-400'
                                                }`}
                                        ></motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                <Card className="glass-card overflow-hidden">
                    <div className="overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
                        <table className="w-full text-left border-collapse text-[11px] sm:text-sm md:text-base">
                            <thead>
                                <tr className="bg-black/60 border-b border-white/10 uppercase text-[9px] sm:text-xs tracking-widest font-heading text-gray-400">
                                    <th className="px-3 sm:px-6 py-2 sm:py-4 font-normal text-center w-10 sm:w-16">Pos</th>
                                    <th className="px-3 sm:px-6 py-2 sm:py-4 font-normal min-w-[120px] sm:min-w-[200px]">Team</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-4 font-normal text-center text-[10px] sm:text-sm">Played</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-4 font-normal text-center text-emerald-400 text-[10px] sm:text-sm">Won</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-4 font-normal text-center text-brand-red text-[10px] sm:text-sm">Lost</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-4 font-normal text-center text-brand-yellow font-bold text-[11px] sm:text-lg">Pts</th>
                                    <th className="px-2 sm:px-6 py-2 sm:py-4 font-normal text-center text-[10px] sm:text-sm">NRR</th>
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
                                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-center">
                                                <span className={`
                                                    flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full mx-auto font-heading text-sm sm:text-lg
                                                    ${index === 0 ? 'bg-brand-yellow font-bold text-black' :
                                                        index === 1 ? 'bg-gray-300 font-bold text-black' :
                                                            'bg-black/40 text-gray-300 border border-white/20'
                                                    }
                                                `}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-2 sm:py-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <Link to={`/team/${row.team?.id}`} className="hover:scale-110 transition-transform flex-shrink-0">
                                                        {row.team?.logo ? (
                                                            <img src={row.team.logo} alt={row.team.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 object-cover border border-white/20 shadow-lg" />
                                                        ) : (
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm sm:text-lg font-bold text-white">
                                                                {row.team?.shortName || row.team?.name?.charAt(0)}
                                                            </div>
                                                        )}
                                                    </Link>
                                                    <div className="min-w-0">
                                                        <Link to={`/team/${row.team?.id}`} className="hover:text-brand-yellow transition-colors">
                                                            <span className={`font-heading tracking-wider text-sm sm:text-xl ${isTop2 ? 'neon-text-blue' : 'text-white'} truncate`}>
                                                                {row.team?.name}
                                                            </span>
                                                        </Link>
                                                        <div className="text-[8px] sm:text-xs flex items-center gap-2 mt-1">
                                                            {isTop2 && <span className="text-brand-blue flex items-center"><ArrowRightCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" /> Qualifier Zone</span>}
                                                            {row.isFinalist && <span className="text-brand-yellow flex items-center">🏆 Finalist</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-300 text-sm sm:text-lg">{row.matchesPlayed}</td>
                                            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-emerald-400 text-sm sm:text-lg font-bold">{row.wins}</td>
                                            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-brand-red text-sm sm:text-lg font-bold">{row.losses}</td>
                                            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center">
                                                <span className="bg-brand-yellow/20 text-brand-yellow px-2 sm:px-4 py-0.5 sm:py-1 rounded-full text-sm sm:text-xl font-bold font-heading">
                                                    {row.points}
                                                </span>
                                            </td>
                                            <td className="px-2 sm:px-6 py-2 sm:py-4 text-center text-gray-300 font-bold text-sm sm:text-base">
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
                {
                    mvp && (
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
                    )
                }

                {/* Top Performers Section */}
                {
                    leaderboard && (
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
                    )
                }
            </div >

            <AnimatePresence>
                {viewingPlayer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#0f1115] border border-white/10 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setViewingPlayer(null)}
                                className="absolute top-4 sm:top-6 right-4 sm:right-6 z-50 p-1.5 sm:p-2 bg-black/50 hover:bg-brand-red/20 text-white rounded-full transition-colors border border-white/10"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>

                            {/* Modal Header/Banner */}
                            <div className="h-32 sm:h-40 bg-gradient-to-br from-brand-blue/20 via-brand-red/10 to-brand-yellow/10 relative">
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0f1115] to-transparent"></div>

                                <div className="absolute inset-0 flex items-end px-4 sm:px-8 pb-0">
                                    <div className="flex gap-3 sm:gap-6 items-end w-full min-w-0">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg sm:rounded-2xl bg-black border-2 sm:border-[3px] border-white/20 overflow-hidden shadow-2xl translate-y-8 flex-shrink-0">
                                            {viewingPlayer.profileImage ? (
                                                <img src={viewingPlayer.profileImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-brand-blue flex items-center justify-center text-2xl font-heading text-white">
                                                    {viewingPlayer.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="pb-2 min-w-0 flex-1">
                                            <h3 className="text-lg sm:text-2xl font-heading text-white tracking-widest uppercase flex items-center gap-1 sm:gap-2 truncate">
                                                {viewingPlayer.name}
                                                {viewingPlayer.userRole === 'admin' && <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow flex-shrink-0" />}
                                            </h3>
                                            <div className="flex items-center gap-2 text-[9px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex-wrap">
                                                <span className="text-brand-yellow font-black">{viewingPlayer.role || 'Undecided'}</span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                <span className="font-black">Batch {viewingPlayer.batch}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body (Scrollable) */}
                            <div className="p-4 sm:p-8 pt-8 sm:pt-12 overflow-y-auto custom-scrollbar space-y-6 sm:space-y-8">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-2 sm:gap-4">
                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-brand-yellow flex-shrink-0" />
                                        <div className="overflow-hidden min-w-0">
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Email</div>
                                            <div className="text-[10px] sm:text-xs text-white truncate font-black">{viewingPlayer.email || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-2 sm:gap-4">
                                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-brand-blue flex-shrink-0" />
                                        <div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Jersey</div>
                                            <div className="text-[10px] sm:text-xs text-white uppercase font-black tracking-widest">#{viewingPlayer.jerseyNumber || '--'}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-2 sm:gap-4">
                                        <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-brand-red flex-shrink-0" />
                                        <div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Status</div>
                                            <div className="text-[10px] sm:text-xs text-emerald-400 uppercase font-black tracking-widest capitalize">{viewingPlayer.status || 'Pending'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio Section */}
                                {viewingPlayer.bio && (
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex items-center gap-2 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                            <User className="w-3 h-3 font-black" /> About Player
                                        </div>
                                        <div className="bg-white/5 p-3 sm:p-5 rounded-lg sm:rounded-xl border border-white/5 text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                                            {viewingPlayer.bio}
                                        </div>
                                    </div>
                                )}

                                {/* Stats Grid */}
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="flex items-center gap-2 text-[9px] sm:text-xs font-bold uppercase tracking-widest text-brand-yellow/80">
                                        <Activity className="w-3 h-3 font-black" /> Career Overview
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                                        <div className="bg-black/40 p-3 sm:p-4 rounded-lg sm:rounded-2xl border border-white/10 text-center">
                                            <div className="text-lg sm:text-2xl font-heading text-white">{viewingPlayer.matchesPlayed || 0}</div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mt-1">Matches</div>
                                        </div>
                                        <div className="bg-black/40 p-3 sm:p-4 rounded-lg sm:rounded-2xl border border-white/10 text-center">
                                            <div className="text-lg sm:text-2xl font-heading text-brand-blue">{viewingPlayer.totalRuns || 0}</div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mt-1">Runs</div>
                                        </div>
                                        <div className="bg-black/40 p-3 sm:p-4 rounded-lg sm:rounded-2xl border border-white/10 text-center">
                                            <div className="text-lg sm:text-2xl font-heading text-brand-yellow">{viewingPlayer.totalWickets || 0}</div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mt-1">Wickets</div>
                                        </div>
                                        <div className="bg-black/40 p-3 sm:p-4 rounded-lg sm:rounded-2xl border border-white/10 text-center">
                                            <div className="text-lg sm:text-2xl font-heading text-emerald-400">{viewingPlayer.totalCatches || 0}</div>
                                            <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black mt-1">Catches</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 bg-black/40 border-t border-white/5 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setViewingPlayer(null)}
                                    className="border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-widest h-9 sm:h-auto px-4 sm:px-6"
                                >
                                    Close Portal
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}

