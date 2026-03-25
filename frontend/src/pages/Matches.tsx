import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Calendar, Loader2, Swords, Clock, CheckCircle2, Radio, ChevronRight, MapPin, Trophy } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Matches() {
    const container = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    const { data: matches, isLoading, isError } = useQuery<any[]>({
        queryKey: ['matches'],
        queryFn: async () => {
            const { data } = await api.get('/matches');
            return data;
        },
        refetchInterval: 30000,
    });

    useGSAP(() => {
        if (hasAnimated.current || isLoading) return;
        hasAnimated.current = true;

        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from('.matches-header', { y: 30, duration: 1 })
            .from('.match-card-item', {
                y: 30,
                scale: 0.95,
                stagger: 0.08,
                duration: 0.6,
                ease: 'power3.out'
            }, '-=0.6');
    }, { scope: container, dependencies: [isLoading] });

    const getStatusConfig = (status: string) => {
        const s = status?.toLowerCase() || 'upcoming';
        if (s === 'live') {
            return { icon: Radio, text: 'LIVE NOW', color: 'text-brand-red', bg: 'bg-brand-red/10', border: 'border-brand-red/30', dot: 'bg-brand-red animate-ping', glow: 'shadow-[0_0_20px_rgba(255,59,48,0.2)]' };
        } else if (s === 'completed') {
            return { icon: CheckCircle2, text: 'COMPLETED', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', dot: 'bg-green-400', glow: '' };
        } else {
            return { icon: Clock, text: 'UPCOMING', color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/30', dot: 'bg-brand-blue', glow: '' };
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        return timeStr; // The API returns "10:01" 
    };

    return (
        <div className="min-h-screen relative" ref={container}>
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-brand-blue/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-brand-red/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                {/* Header */}
                <div className="matches-header text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center gap-3 glass-premium px-6 py-3 rounded-full mb-6 shadow-lg">
                        <Swords className="w-4 h-4 text-brand-blue" />
                        <span className="text-brand-blue font-heading text-xs tracking-[0.5em] uppercase">Fixture Schedule</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading tracking-wide text-white uppercase">
                        Match <span className="text-brand-yellow drop-shadow-[0_0_20px_rgba(255,214,10,0.4)]">Center</span>
                    </h1>
                    <p className="text-gray-400 mt-4 font-light text-sm sm:text-base max-w-xl mx-auto">All fixtures for ICE Cricket Mania S2. Stay updated with live scores and results.</p>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-32">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 border-2 border-white/5 border-t-brand-blue rounded-full animate-spin" />
                            <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Loading fixtures...</span>
                        </div>
                    </div>
                ) : isError ? (
                    <div className="text-center py-32 glass-card mx-auto max-w-md p-12">
                        <Swords className="w-12 h-12 text-gray-600 mx-auto mb-6" />
                        <p className="text-gray-400 font-light text-lg">Unable to fetch match data</p>
                        <p className="text-gray-600 text-sm mt-3">Please check your connection and try again</p>
                    </div>
                ) : !matches || matches.length === 0 ? (
                    <div className="text-center py-32 glass-card mx-auto max-w-md p-12">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-6" />
                        <p className="text-gray-400 font-light text-lg">No fixtures scheduled yet</p>
                        <p className="text-gray-600 text-sm mt-3">Matches will appear here once the schedule is announced</p>
                    </div>
                ) : (
                    <div className="space-y-4 sm:space-y-6">
                        {matches.map((match, i) => {
                            const status = getStatusConfig(match.status);
                            const tA = match.teamA || {};
                            const tB = match.teamB || {};
                            const sc = match.score || {};

                            return (
                                <Link to={`/matches/${match.id}`} key={match.id}>
                                    <div className={`match-card-item glass-card p-5 sm:p-8 group hover:border-white/10 ${status.glow} transition-all duration-500 relative overflow-hidden mb-4 sm:mb-6`}>
                                        {/* Shimmer */}
                                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.01] to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000" />
                                        </div>

                                        {/* Top bar: Status + Date */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`flex items-center gap-2 ${status.bg} ${status.border} border px-3 py-1.5 rounded-full`}>
                                                <div className="relative">
                                                    {match.status === 'live' && <span className={`absolute inset-0 ${status.dot} rounded-full`}></span>}
                                                    <span className={`block w-2 h-2 ${match.status === 'live' ? 'bg-brand-red' : status.dot} rounded-full relative z-10`}></span>
                                                </div>
                                                <span className={`${status.color} text-[10px] font-black tracking-[0.2em] uppercase`}>{status.text}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-gray-500 text-xs">
                                                <span className="uppercase tracking-widest font-bold hidden sm:inline">{formatDate(match.date)}</span>
                                                <span className="text-gray-600">|</span>
                                                <span className="uppercase tracking-widest font-bold">{formatTime(match.time)}</span>
                                            </div>
                                        </div>

                                        {/* Teams */}
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Team 1 */}
                                            <div className="flex-1 flex items-center gap-3 sm:gap-5">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border border-white/[0.06] overflow-hidden bg-black/50 flex-shrink-0 group-hover:border-white/10 transition-all">
                                                    {tA.logo ? (
                                                        <img src={tA.logo} alt={tA.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-brand-blue font-heading text-lg sm:text-2xl">
                                                            {tA.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-heading text-white text-sm sm:text-xl uppercase tracking-widest">
                                                        {tA.shortName || tA.name || 'Team A'}
                                                    </p>
                                                    {sc.teamARuns !== undefined && (
                                                        <p className="text-brand-yellow font-heading text-lg sm:text-2xl mt-1 tracking-wider">
                                                            {sc.teamARuns}/{sc.teamAWickets}
                                                            <span className="text-gray-500 text-xs ml-2">({sc.teamAOversPlayed} ov)</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* VS */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.06] group-hover:border-brand-blue/20 transition-all">
                                                <span className="text-gray-500 font-heading text-sm tracking-widest group-hover:text-brand-blue transition-colors">VS</span>
                                            </div>

                                            {/* Team 2 */}
                                            <div className="flex-1 flex items-center flex-row-reverse gap-3 sm:gap-5 text-right">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border border-white/[0.06] overflow-hidden bg-black/50 flex-shrink-0 group-hover:border-white/10 transition-all">
                                                    {tB.logo ? (
                                                        <img src={tB.logo} alt={tB.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-brand-red font-heading text-lg sm:text-2xl">
                                                            {tB.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-heading text-white text-sm sm:text-xl uppercase tracking-widest">
                                                        {tB.shortName || tB.name || 'Team B'}
                                                    </p>
                                                    {sc.teamBRuns !== undefined && (
                                                        <p className="text-brand-yellow font-heading text-lg sm:text-2xl mt-1 tracking-wider">
                                                            {sc.teamBRuns}/{sc.teamBWickets}
                                                            <span className="text-gray-500 text-xs ml-2">({sc.teamBOversPlayed} ov)</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Result / Venue */}
                                        <div className="mt-6 flex items-center justify-between border-t border-white/[0.04] pt-4">
                                            {match.winnerTeamId ? (
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="w-3.5 h-3.5 text-brand-yellow" />
                                                    <p className="text-brand-yellow text-xs font-bold tracking-wider uppercase">
                                                        {match.winnerTeamId === tA.id ? tA.name : tB.name} WON
                                                    </p>
                                                </div>
                                            ) : match.venue ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <p className="text-xs font-medium tracking-wider uppercase">{match.venue}</p>
                                                </div>
                                            ) : <div />}

                                            <div className="flex items-center gap-2 text-gray-500 group-hover:text-brand-blue transition-colors">
                                                <span className="text-[10px] uppercase tracking-widest font-black">Details</span>
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
