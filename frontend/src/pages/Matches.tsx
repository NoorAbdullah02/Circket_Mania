import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlayCircle, Loader2, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Matches() {
    const { data: matches, isLoading, error } = useQuery({
        queryKey: ['matches'],
        queryFn: async () => {
            const { data } = await api.get('/matches');
            return data;
        },
        refetchInterval: 15000,
    });

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 text-brand-blue animate-spin" /></div>;
    if (error) return <div className="text-center text-red-500 mt-20">Failed to load matches</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-heading tracking-widest text-white uppercase neon-text-red">Tournament Fixtures</h1>
                <div className="glass-panel px-6 py-2 rounded-full inline-flex border border-brand-red/30 items-center justify-center text-brand-red font-bold text-sm tracking-wider hover:bg-brand-red/10 transition-colors">
                    {matches?.filter((m: any) => m.status === 'live').length || 0} Matches Live
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {matches?.map((match: any, index: number) => {
                    const tA = match.teamA;
                    const tB = match.teamB;
                    const sc = match.score || {};

                    return (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="glass-card hover:border-brand-blue/30 transition-all duration-300 relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 left-0 h-1 z-10 
                  ${match.status === 'live' ? 'bg-gradient-to-r from-red-500 via-brand-yellow to-red-500 animate-pulse' :
                                        match.status === 'upcoming' ? 'bg-brand-blue' : 'bg-gray-600'}`
                                } />

                                <CardContent className="p-6 pt-8 relative">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2">
                                        {match.status === 'live' && (
                                            <span className="flex items-center gap-1.5 text-brand-red text-xs font-bold uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                                                <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                                                LIVE
                                            </span>
                                        )}
                                        {match.status === 'completed' && (
                                            <span className="flex items-center gap-1 text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-800/50 px-3 py-1 rounded-full">
                                                <CheckCircle className="w-3 h-3" /> Result
                                            </span>
                                        )}
                                        {match.status === 'upcoming' && (
                                            <span className="flex items-center gap-1 text-brand-blue text-xs font-bold uppercase tracking-widest bg-brand-blue/10 px-3 py-1 rounded-full">
                                                <Clock className="w-3 h-3" /> Upcoming
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-6 mt-4">
                                        {/* Team A */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={tA?.logo || `https://ui-avatars.com/api/?name=${tA?.name}&background=random`}
                                                    alt={tA?.name}
                                                    className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0 object-cover border border-white/20"
                                                />
                                                <span className={`font-heading text-2xl tracking-wide ${match.winnerTeamId === tA.id ? 'text-brand-yellow font-bold' : 'text-white'}`}>
                                                    {tA?.name}
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {(match.status === 'live' || match.status === 'completed') ? (
                                                    <>
                                                        <span className="text-3xl font-bold font-heading neon-text-yellow">{sc.teamARuns}/{sc.teamAWickets}</span>
                                                        <span className="text-sm text-gray-400 font-medium">({sc.teamAOversPlayed} ov)</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500 font-heading">Yet to bat</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full h-px bg-white/10 relative flex justify-center items-center">
                                            <span className="bg-[#111827] px-2 text-xs text-brand-blue font-bold tracking-widest">VS</span>
                                        </div>

                                        {/* Team B */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <img
                                                    src={tB?.logo || `https://ui-avatars.com/api/?name=${tB?.name}&background=random`}
                                                    alt={tB?.name}
                                                    className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0 object-cover border border-white/20"
                                                />
                                                <span className={`font-heading text-2xl tracking-wide ${match.winnerTeamId === tB.id ? 'text-brand-yellow font-bold' : 'text-white'}`}>
                                                    {tB?.name}
                                                </span>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {(match.status === 'live' || match.status === 'completed') ? (
                                                    <>
                                                        <span className="text-3xl font-bold font-heading neon-text-yellow">{sc.teamBRuns}/{sc.teamBWickets}</span>
                                                        <span className="text-sm text-gray-400 font-medium">({sc.teamBOversPlayed} ov)</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500 font-heading">Yet to bat</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Match Meta Footer */}
                                    <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex flex-col space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Calendar className="w-4 h-4 text-brand-blue" />
                                                {match.date} • {match.time} • {match.overs} Overs
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <MapPin className="w-4 h-4 text-brand-red" />
                                                {match.venue}
                                            </div>
                                        </div>
                                        {match.status === 'live' ? (
                                            <Link to={`/matches/${match.id}`}>
                                                <Button variant="destructive" size="sm" className="gap-2 font-bold animate-pulse hover:animate-none">
                                                    <PlayCircle className="w-4 h-4" /> Match Center
                                                </Button>
                                            </Link>
                                        ) : match.status === 'completed' ? (
                                            <Link to={`/matches/${match.id}`}>
                                                <Button variant="outline" size="sm" className="gap-2 font-bold">
                                                    View Scorecard
                                                </Button>
                                            </Link>
                                        ) : null}
                                    </div>

                                    {match.status === 'completed' && match.winnerTeamId && (
                                        <div className="absolute bottom-4 right-6 text-sm font-bold text-emerald-400 mt-2 bg-emerald-500/10 px-3 py-1 rounded-full">
                                            {match.winnerTeamId === tA.id ? tA.name : tB.name} won
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
                {matches?.length === 0 && (
                    <div className="col-span-1 lg:col-span-2 text-center text-gray-500 py-12 text-xl font-light">
                        No fixtures announced yet.
                    </div>
                )}
            </div>
        </div>
    );
}
