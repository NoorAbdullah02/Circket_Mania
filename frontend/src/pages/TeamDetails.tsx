import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Shield, Users, Calendar, Trophy, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function TeamDetails() {
    const { id } = useParams<{ id: string }>();

    const { data: team, isLoading } = useQuery({
        queryKey: ['team', id],
        queryFn: async () => {
            const { data } = await api.get(`/teams/${id}`);
            return data;
        },
        enabled: !!id,
    });

    const { data: matches } = useQuery({
        queryKey: ['team-matches', id],
        queryFn: async () => {
            const { data } = await api.get(`/matches?teamId=${id}`);
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

    if (!team) {
        return <div className="text-center text-red-500 p-8">Team not found</div>;
    }

    const completedMatches = matches?.filter((m: any) => m.status === 'completed') || [];
    const upcomingMatches = matches?.filter((m: any) => m.status === 'upcoming' || m.status === 'live') || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Team Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl mb-10"
            >
                <div className="absolute inset-0 opacity-20" style={{ backgroundColor: team.color || '#38BDF8' }} />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-transparent to-brand-bg" />
                <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
                    <div className="relative">
                        <div className="absolute -inset-2 rounded-full blur-lg opacity-50" style={{ backgroundColor: team.color }} />
                        <img
                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random&size=200`}
                            alt={team.name}
                            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/20 shadow-xl"
                        />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-4xl md:text-6xl font-heading tracking-widest text-white uppercase">
                            {team.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
                            <span className="text-brand-yellow font-bold text-xl tracking-widest uppercase">{team.shortName}</span>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                            <span className="text-gray-400 text-sm">{team.color}</span>
                        </div>
                        <div className="flex items-center gap-6 mt-6 justify-center md:justify-start">
                            <div className="glass-panel px-4 py-2 rounded-lg text-center">
                                <div className="text-2xl font-heading text-brand-blue">{team.players?.length || 0}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest">Players</div>
                            </div>
                            <div className="glass-panel px-4 py-2 rounded-lg text-center">
                                <div className="text-2xl font-heading text-emerald-400">{completedMatches.length}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest">Played</div>
                            </div>
                            <div className="glass-panel px-4 py-2 rounded-lg text-center">
                                <div className="text-2xl font-heading text-brand-yellow">{upcomingMatches.length}</div>
                                <div className="text-[10px] text-gray-400 uppercase tracking-widest">Upcoming</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Squad Section */}
                <div className="lg:col-span-2">
                    <Card className="glass-card">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="font-heading tracking-widest flex items-center gap-2">
                                <Users className="w-5 h-5 text-brand-blue" />
                                Squad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {team.players?.length === 0 ? (
                                <div className="text-center text-gray-500 py-12">No players assigned yet</div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                                    {team.players?.map((player: any, i: number) => (
                                        <Link
                                            to={`/player/${player.id}`}
                                            key={player.id}
                                            className="flex items-center gap-4 p-5 border-b border-white/5 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random`}
                                                    alt={player.name}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-white/10 group-hover:border-brand-blue/50 transition-colors"
                                                />
                                                {player.isCaptain && (
                                                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-yellow text-black rounded-full flex items-center justify-center text-[10px] font-black">C</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">{player.name}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-brand-blue font-bold uppercase">{player.role || 'Undecided'}</span>
                                                    {player.jerseyNumber && (
                                                        <span className="text-xs text-gray-500">#{player.jerseyNumber}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right hidden sm:block">
                                                <div className="text-sm text-white">{player.totalRuns || 0} <span className="text-[10px] text-gray-500">runs</span></div>
                                                <div className="text-sm text-white">{player.totalWickets || 0} <span className="text-[10px] text-gray-500">wkts</span></div>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-blue transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Match History Section */}
                <div className="space-y-6">
                    {/* Upcoming Matches */}
                    <Card className="glass-card">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="font-heading tracking-widest text-sm flex items-center gap-2 uppercase">
                                <Calendar className="w-4 h-4 text-brand-blue" />
                                Upcoming Matches
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {upcomingMatches.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 text-sm">No upcoming matches</div>
                            ) : (
                                upcomingMatches.map((match: any) => {
                                    const opponent = match.teamA?.id === id ? match.teamB : match.teamA;
                                    return (
                                        <Link key={match.id} to={`/matches/${match.id}`} className="flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <img
                                                src={opponent?.logo || `https://ui-avatars.com/api/?name=${opponent?.name}&background=random`}
                                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                                                alt={opponent?.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm font-medium truncate">vs {opponent?.name}</div>
                                                <div className="text-[10px] text-gray-500">{match.date} • {match.time}</div>
                                            </div>
                                            {match.status === 'live' && (
                                                <span className="text-[10px] text-brand-red bg-red-500/10 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">LIVE</span>
                                            )}
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Completed Matches */}
                    <Card className="glass-card">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="font-heading tracking-widest text-sm flex items-center gap-2 uppercase">
                                <Trophy className="w-4 h-4 text-brand-yellow" />
                                Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {completedMatches.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 text-sm">No completed matches yet</div>
                            ) : (
                                completedMatches.map((match: any) => {
                                    const opponent = match.teamA?.id === id ? match.teamB : match.teamA;
                                    const sc = match.score || {};
                                    const isTeamA = match.teamA?.id === id;
                                    const ourRuns = isTeamA ? sc.teamARuns : sc.teamBRuns;
                                    const ourWickets = isTeamA ? sc.teamAWickets : sc.teamBWickets;
                                    const oppRuns = isTeamA ? sc.teamBRuns : sc.teamARuns;
                                    const oppWickets = isTeamA ? sc.teamBWickets : sc.teamAWickets;
                                    const won = match.winnerTeamId === id;

                                    return (
                                        <Link key={match.id} to={`/matches/${match.id}`} className="flex items-center gap-3 p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <div className={`w-2 h-2 rounded-full ${won ? 'bg-emerald-400' : 'bg-brand-red'}`} />
                                            <img
                                                src={opponent?.logo || `https://ui-avatars.com/api/?name=${opponent?.name}&background=random`}
                                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                                                alt={opponent?.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-sm truncate">vs {opponent?.name}</div>
                                                <div className="text-[10px] text-gray-500">{match.date}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${won ? 'text-emerald-400' : 'text-brand-red'}`}>
                                                    {ourRuns}/{ourWickets} — {oppRuns}/{oppWickets}
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase ${won ? 'text-emerald-400' : 'text-brand-red'}`}>
                                                    {won ? 'Won' : 'Lost'}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
