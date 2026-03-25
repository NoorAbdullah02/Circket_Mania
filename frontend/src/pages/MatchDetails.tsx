import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Camera, Trophy, Radio, Clock, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { formatTime12h } from '../lib/utils';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function MatchDetails() {
    const { id } = useParams();
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    const { data: match, isLoading, error } = useQuery({
        queryKey: ['match', id],
        queryFn: async () => {
            const { data } = await api.get(`/matches/${id}`);
            return data;
        },
        refetchInterval: 5000,
    });

    const { data: commentary } = useQuery({
        queryKey: ['commentary', id],
        queryFn: async () => {
            const { data } = await api.get(`/matches/${id}/commentary`);
            return data;
        },
        refetchInterval: 5000,
    });

    const { data: playerStats } = useQuery({
        queryKey: ['match-player-stats', id],
        queryFn: async () => {
            const { data } = await api.get(`/matches/${id}/player-stats`);
            return data;
        },
        refetchInterval: 5000,
    });

    useGSAP(() => {
        if (hasAnimated.current || isLoading) return;
        hasAnimated.current = true;
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from('.details-header', { y: 30, duration: 1 })
            .from('.details-card', { y: 20, scale: 0.98, stagger: 0.1, duration: 0.6 }, '-=0.6');
    }, { scope: container, dependencies: [isLoading] });

    if (isLoading) return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-2 border-white/5 border-t-brand-blue rounded-full animate-spin" />
                <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Loading match...</span>
            </div>
        </div>
    );

    if (error || !match) return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="glass-card p-12 text-center max-w-md">
                <p className="text-gray-400 font-light text-lg">Match not found</p>
                <Link to="/matches"><Button variant="outline" className="mt-6 border-white/10">Back to Fixtures</Button></Link>
            </div>
        </div>
    );

    const tA = match.teamA;
    const tB = match.teamB;
    const sc = match.score || {};
    const isLive = match.status === 'live' || match.status === 'Live';

    return (
        <div className="min-h-screen relative" ref={container}>
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[30vw] h-[30vw] bg-brand-blue/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] bg-brand-red/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                <Link to="/matches" className="inline-flex items-center text-gray-400 hover:text-brand-blue mb-8 transition-colors uppercase tracking-widest font-bold text-xs details-header group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Fixtures
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Main Scorecard */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        <Card className="details-card glass-card overflow-hidden relative">
                            {/* Live / status indicator bar */}
                            <div className={`absolute top-0 left-0 right-0 h-[2px] z-10 ${isLive ? 'bg-gradient-to-r from-brand-red via-brand-yellow to-brand-red animate-gradient-shift' : 'bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent'}`} style={{ backgroundSize: '200% 200%' }} />

                            <CardHeader className="text-center border-b border-white/[0.06] pb-6 relative overflow-hidden">
                                {/* Ambient glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-brand-blue/5 blur-3xl rounded-full" />

                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-brand-blue/80 font-heading tracking-widest text-xs sm:text-sm uppercase">{match.matchType} Match</span>
                                        </div>
                                        <p className="text-gray-500 text-[10px] sm:text-xs mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {match.venue}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {match.date}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime12h(match.time)}</span>
                                        </p>
                                    </div>
                                    {isLive && (
                                        <span className="text-brand-red font-bold uppercase tracking-widest text-[10px] sm:text-xs bg-brand-red/10 px-3 py-1.5 rounded-full border border-brand-red/20 flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75 animate-ping"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-red"></span>
                                            </span>
                                            LIVE
                                        </span>
                                    )}
                                </div>

                                {/* Team scoreboard */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 mt-4 relative z-10">
                                    <div className="flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-3 sm:gap-4">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/50 flex-shrink-0">
                                            <img src={tA?.logo || `https://ui-avatars.com/api/?name=${tA?.name}&background=random`} alt={tA.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-heading text-white tracking-widest uppercase">{tA?.shortName || tA?.name}</h2>
                                            <div className="text-3xl sm:text-4xl font-bold font-heading neon-text-yellow">{sc.teamARuns ?? '-'}/{sc.teamAWickets ?? '-'}</div>
                                            <div className="text-xs sm:text-sm text-gray-500">({sc.teamAOversPlayed ?? '0'} ov)</div>
                                        </div>
                                    </div>

                                    <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                        <span className="text-gray-500 font-heading text-sm tracking-widest">VS</span>
                                    </div>

                                    <div className="flex-1 text-center md:text-right flex items-center justify-center md:justify-end gap-3 sm:gap-4 flex-row-reverse">
                                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/50 flex-shrink-0">
                                            <img src={tB?.logo || `https://ui-avatars.com/api/?name=${tB?.name}&background=random`} alt={tB.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-heading text-white tracking-widest uppercase">{tB?.shortName || tB?.name}</h2>
                                            <div className="text-3xl sm:text-4xl font-bold font-heading neon-text-yellow">{sc.teamBRuns ?? '-'}/{sc.teamBWickets ?? '-'}</div>
                                            <div className="text-xs sm:text-sm text-gray-500">({sc.teamBOversPlayed ?? '0'} ov)</div>
                                        </div>
                                    </div>
                                </div>

                                {match.winnerTeamId && (
                                    <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-3">
                                        <Trophy className="w-5 h-5 text-brand-yellow" />
                                        <p className="text-brand-yellow text-sm sm:text-lg font-bold font-heading tracking-wider">
                                            {match.winnerTeamId === tA.id ? tA.name : tB.name} won the match
                                        </p>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="pt-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-center">
                                    <div className="bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/[0.05]">
                                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1 uppercase tracking-widest font-bold">Toss</p>
                                        <p className="font-heading text-white tracking-wide text-xs sm:text-sm">
                                            {match.tossWinner
                                                ? `${match.tossWinner === tA?.id ? tA?.name : tB?.name} elected to ${match.tossDecision === 'bat' ? 'bat first' : 'bowl first'}`
                                                : 'Not conducted'}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/[0.05]">
                                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1 uppercase tracking-widest font-bold">Man of the Match</p>
                                        <p className="font-heading text-brand-yellow tracking-wide text-xs sm:text-sm">{match.manOfTheMatch?.name || 'TBD'}</p>
                                    </div>
                                    {match.scoreboardImage && (
                                        <div className="md:col-span-1 col-span-2 bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/[0.05] flex flex-col items-center justify-center">
                                            <a href={match.scoreboardImage} target="_blank" rel="noreferrer" className="text-brand-blue font-bold text-[10px] sm:text-xs uppercase hover:text-white transition-colors flex items-center gap-2 tracking-widest">
                                                <Camera className="w-4 h-4" /> View Official Sheet
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Player Scorecard Tables */}
                        <div className="space-y-6 sm:space-y-8">
                            {[
                                { team: tA, players: playerStats?.filter((p: any) => p.teamId === tA.id) },
                                { team: tB, players: playerStats?.filter((p: any) => p.teamId === tB.id) }
                            ].map(({ team, players }, idx) => (
                                <Card key={idx} className="details-card glass-card overflow-hidden">
                                    <CardHeader className="bg-white/[0.02] py-3 sm:py-4 border-b border-white/[0.06]">
                                        <CardTitle className="text-sm sm:text-lg font-heading tracking-widest flex items-center gap-3">
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0">
                                                <img src={team?.logo || `https://ui-avatars.com/api/?name=${team?.name}`} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="uppercase">{team?.name}</span>
                                            <span className="text-gray-600 text-xs font-normal">Scorecard</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-black/30 text-[9px] sm:text-[10px] uppercase font-heading text-gray-500 border-b border-white/[0.05]">
                                                    <th className="px-4 sm:px-6 py-2 sm:py-3 font-medium">Batter</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Runs</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Balls</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">4s</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">6s</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium border-l border-white/[0.05] bg-brand-red/5">Wkts</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium">Bowled</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/[0.03]">
                                                {players?.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors text-xs sm:text-sm group">
                                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/50 border border-white/[0.06] overflow-hidden flex-shrink-0 group-hover:border-brand-blue/20 transition-colors">
                                                                    <img src={p.profileImage || `https://ui-avatars.com/api/?name=${p.playerName}`} className="w-full h-full object-cover" />
                                                                </div>
                                                                <Link to={`/player/${p.playerId}`} className="font-medium text-white hover:text-brand-blue transition-colors truncate">{p.playerName}</Link>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-white font-bold font-heading">{p.runsScored}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-gray-500">{p.ballsFaced}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-gray-500">{p.fours}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-gray-500">{p.sixes}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-brand-red font-bold font-heading border-l border-white/[0.05] bg-brand-red/[0.03]">{p.wickets}</td>
                                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-gray-500">{p.ballsBowled}</td>
                                                    </tr>
                                                ))}
                                                {(!players || players.length === 0) && (
                                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-600 italic text-sm">No player stats recorded yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Commentary Pipeline */}
                    <div className="space-y-4">
                        <Card className="details-card glass-card h-full max-h-[700px] flex flex-col overflow-hidden">
                            <CardHeader className="pb-3 sm:pb-4 border-b border-white/[0.06] flex-shrink-0 bg-white/[0.01]">
                                <CardTitle className="text-lg sm:text-xl inline-flex items-center gap-2 font-heading tracking-widest">
                                    Ball by Ball
                                    {isLive && (
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75 animate-ping"></span>
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-red"></span>
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                                <div className="divide-y divide-white/[0.03]">
                                    {commentary?.map((comm: any, i: number) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={comm.id}
                                            className="p-3 sm:p-4 hover:bg-white/[0.02] transition-colors flex gap-3 sm:gap-4 group"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/[0.06] relative overflow-hidden group-hover:border-brand-blue/20 transition-colors">
                                                <span className="font-heading text-gray-600 text-[8px] sm:text-[9px] absolute top-0.5 sm:top-1 uppercase">ov</span>
                                                <span className="font-bold font-heading text-base sm:text-lg mt-2 text-brand-blue">{comm.overNumber}.{comm.ballNumber}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="font-bold text-white text-xs sm:text-sm truncate">{comm.batsmanId}</span>
                                                    <span className="text-gray-600 text-[10px] sm:text-xs">to</span>
                                                    <span className="font-bold text-white text-xs sm:text-sm truncate">{comm.bowlerId}</span>

                                                    {comm.isWicket && <span className="ml-auto bg-brand-red/15 text-brand-red px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-brand-red/20">Wicket</span>}
                                                    {comm.isBoundary && <span className="ml-auto bg-brand-yellow/15 text-brand-yellow px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border border-brand-yellow/20">{comm.runs === 4 ? 'Four' : 'Six'}</span>}
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{comm.action}</p>

                                                {parseInt(comm.runs) > 0 && !comm.isBoundary && (
                                                    <div className="mt-1.5 text-[10px] sm:text-xs bg-white/[0.03] inline-block px-2 py-0.5 rounded-full text-gray-400 border border-white/[0.04]">
                                                        {comm.runs} runs
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {(!commentary || commentary.length === 0) && (
                                        <div className="p-8 sm:p-12 text-center">
                                            <Radio className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                                            <p className="text-gray-600 font-light italic text-sm">
                                                Commentary will appear here once the match begins.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
