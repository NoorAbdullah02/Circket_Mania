import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function MatchDetails() {
    const { id } = useParams();

    const { data: match, isLoading, error } = useQuery({
        queryKey: ['match', id],
        queryFn: async () => {
            const { data } = await api.get(`/matches/${id}`);
            return data;
        },
        refetchInterval: 5000, // Refresh frequently for live matches
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

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>;
    if (error || !match) return <div className="text-center text-red-500 mt-20">Match not found</div>;

    const tA = match.teamA;
    const tB = match.teamB;
    const sc = match.score || {};

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link to="/matches" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Fixtures
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Scorecard Component */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="glass-card">
                        <CardHeader className="text-center border-b border-white/10 pb-6 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 left-0 h-1 z-10 ${match.status === 'live' ? 'bg-gradient-to-r from-red-500 via-brand-yellow to-red-500 animate-pulse' : 'bg-brand-blue'}`} />
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <span className="text-brand-blue/80 font-heading tracking-widest text-sm uppercase">{match.matchType} Match</span>
                                    <p className="text-gray-400 text-xs mt-1">{match.venue} • {match.date}</p>
                                </div>
                                {match.status === 'live' && <span className="text-red-500 font-bold uppercase tracking-widest text-xs animate-pulse bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">Live</span>}
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mt-4">
                                <div className="flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-4">
                                    <img src={tA?.logo || `https://ui-avatars.com/api/?name=${tA?.name}&background=random`} alt={tA.name} className="w-16 h-16 rounded-full glass-panel" />
                                    <div>
                                        <h2 className="text-2xl font-heading text-white tracking-widest">{tA?.shortName || tA?.name}</h2>
                                        <div className="text-4xl font-bold font-heading neon-text-yellow">{sc.teamARuns}/{sc.teamAWickets}</div>
                                        <div className="text-sm text-gray-400">({sc.teamAOversPlayed} ov)</div>
                                    </div>
                                </div>

                                <div className="text-2xl font-bold font-heading text-white/50 bg-[#111827] px-4 py-2 rounded-full border border-white/10">VS</div>

                                <div className="flex-1 text-center md:text-right flex items-center justify-center md:justify-end gap-4 flex-row-reverse">
                                    <img src={tB?.logo || `https://ui-avatars.com/api/?name=${tB?.name}&background=random`} alt={tB.name} className="w-16 h-16 rounded-full glass-panel" />
                                    <div>
                                        <h2 className="text-2xl font-heading text-white tracking-widest">{tB?.shortName || tB?.name}</h2>
                                        <div className="text-4xl font-bold font-heading neon-text-yellow">{sc.teamBRuns}/{sc.teamBWickets}</div>
                                        <div className="text-sm text-gray-400">({sc.teamBOversPlayed} ov)</div>
                                    </div>
                                </div>
                            </div>

                            {match.winnerTeamId && (
                                <div className="mt-8 pt-4 border-t border-white/10 text-emerald-400 text-lg font-bold font-heading">
                                    {match.winnerTeamId === tA.id ? tA.name : tB.name} won the match
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-400 text-sm mb-1">Toss</p>
                                    <p className="font-heading text-white tracking-wide">{match.tossWinner ? match.tossWinner + ' chose to ' + match.tossDecision : 'Not conducted'}</p>
                                </div>
                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-400 text-sm mb-1">Man of the Match</p>
                                    <p className="font-heading text-brand-yellow tracking-wide">{match.manOfTheMatch?.name || 'TBD'}</p>
                                </div>
                                {match.scoreboardImage && (
                                    <div className="md:col-span-1 bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                                        <a href={match.scoreboardImage} target="_blank" rel="noreferrer" className="text-brand-blue font-bold text-xs uppercase hover:underline flex items-center gap-2">
                                            <Camera className="w-4 h-4" /> View Official Sheet
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Scorecard Tables */}
                    <div className="space-y-8">
                        {[
                            { team: tA, players: playerStats?.filter((p: any) => p.teamId === tA.id) },
                            { team: tB, players: playerStats?.filter((p: any) => p.teamId === tB.id) }
                        ].map(({ team, players }, idx) => (
                            <Card key={idx} className="glass-card overflow-hidden">
                                <CardHeader className="bg-white/5 py-4 border-b border-white/10">
                                    <CardTitle className="text-lg font-heading tracking-widest flex items-center gap-3">
                                        <img src={team?.logo || `https://ui-avatars.com/api/?name=${team?.name}`} className="w-6 h-6 rounded-full" />
                                        {team?.name} Scorecard
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/20 text-[10px] uppercase font-heading text-gray-500 border-b border-white/5">
                                                <th className="px-6 py-3">Batter</th>
                                                <th className="px-4 py-3">Runs</th>
                                                <th className="px-4 py-3">Balls</th>
                                                <th className="px-4 py-3">4s</th>
                                                <th className="px-4 py-3">6s</th>
                                                <th className="px-4 py-3 border-l border-white/5 bg-brand-red/5">Wkts</th>
                                                <th className="px-4 py-3">Balls Bowled</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {players?.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-white/5 transition-colors text-sm">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                                                                <img src={p.profileImage || `https://ui-avatars.com/api/?name=${p.playerName}`} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="font-medium text-white">{p.playerName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-white font-bold">{p.runsScored}</td>
                                                    <td className="px-4 py-4 text-gray-400">{p.ballsFaced}</td>
                                                    <td className="px-4 py-4 text-gray-400">{p.fours}</td>
                                                    <td className="px-4 py-4 text-gray-400">{p.sixes}</td>
                                                    <td className="px-4 py-4 text-brand-red font-bold border-l border-white/5 bg-brand-red/5">{p.wickets}</td>
                                                    <td className="px-4 py-4 text-gray-400">{p.ballsBowled}</td>
                                                </tr>
                                            ))}
                                            {(!players || players.length === 0) && (
                                                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 italic">No player stats recorded yet.</td></tr>
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
                    <Card className="glass-card h-full max-h-[600px] flex flex-col">
                        <CardHeader className="pb-4 border-b border-white/10 flex-shrink-0">
                            <CardTitle className="text-xl inline-flex items-center gap-2">
                                Ball by Ball <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                            <div className="divide-y divide-white/5">
                                {commentary?.map((comm: any, i: number) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={comm.id}
                                        className="p-4 hover:bg-white/5 transition-colors flex gap-4"
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-white/10 relative overflow-hidden">
                                            <span className="font-heading text-white/50 text-xs absolute top-1">ov</span>
                                            <span className="font-bold font-heading text-lg mt-2 text-brand-blue">{comm.overNumber}.{comm.ballNumber}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-white">{comm.batsmanId}</span>
                                                <span className="text-gray-500 text-xs">to</span>
                                                <span className="font-bold text-white">{comm.bowlerId}</span>

                                                {comm.isWicket && <span className="ml-auto bg-brand-red/20 text-brand-red px-2 py-0.5 rounded text-xs font-bold uppercase">Wicket</span>}
                                                {comm.isBoundary && <span className="ml-auto bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded text-xs font-bold uppercase">{comm.runs === 4 ? 'Four' : 'Six'}</span>}
                                            </div>
                                            <p className="text-sm text-gray-400 leading-relaxed">{comm.action}</p>

                                            {parseInt(comm.runs) > 0 && !comm.isBoundary && (
                                                <div className="mt-2 text-xs bg-white/5 inline-block px-2 py-1 rounded text-gray-300">
                                                    {comm.runs} runs
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {(!commentary || commentary.length === 0) && (
                                    <div className="p-8 text-center text-gray-500 font-light italic">
                                        Commentary will appear here once the match begins.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
