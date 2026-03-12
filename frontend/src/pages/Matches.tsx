import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PlayCircle, Loader2, Calendar, MapPin, CheckCircle, Clock, Trophy } from 'lucide-react';
import api from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { formatTime12h } from '../lib/utils';

export default function Matches() {
    const container = useRef<HTMLDivElement>(null);

    const { data: matches, isLoading, error } = useQuery({
        queryKey: ['matches'],
        queryFn: async () => {
            const { data } = await api.get('/matches');
            return data;
        },
        refetchInterval: 15000,
    });

    useGSAP(() => {
        if (matches) {
            const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
            tl.from('.matches-header', { y: -20, scale: 0.98 })
                .from('.match-card', { y: 30, stagger: 0.08, duration: 0.8 }, '-=0.6');
        }
    }, { dependencies: [matches], scope: container });

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-brand-blue" />
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-brand-red opacity-50" />
            </div>
            <h2 className="text-2xl font-heading tracking-widest text-white uppercase">Schedule Interrupted</h2>
            <p className="text-gray-500 mt-2 max-w-xs uppercase text-[10px] tracking-widest">Unable to synchronize with the tournament mainframe. Please check your connection.</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden" ref={container}>
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-1/4 -z-10 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[140px] opacity-20" />
            <div className="absolute bottom-0 right-1/4 -z-10 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[140px] opacity-20" />

            <div className="mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6 matches-header">
                <div>
                    <div className="flex flex-col">
                        <span className="text-brand-yellow font-heading text-xs tracking-[0.5em] mb-3 opacity-60 uppercase">ICE Cricket Mania</span>
                        <h1 className="text-5xl md:text-8xl font-heading tracking-tighter text-white uppercase leading-[0.8]">
                            ARENA <span className="text-brand-red drop-shadow-[0_0_20px_rgba(255,59,48,0.3)]">FIXTURES</span>
                        </h1>
                        <p className="text-gray-500 uppercase tracking-[0.4em] text-[10px] font-bold mt-6 md:ml-1">Tournament Schedule & Results • Season Two Edition</p>
                    </div>
                </div>
                <div className="glass-panel px-8 py-3 rounded-2xl inline-flex border border-brand-red/20 items-center justify-center text-brand-red font-black text-xs tracking-[0.2em] backdrop-blur-xl shadow-[0_0_30px_rgba(239,68,68,0.1)] uppercase">
                    <span className="w-2 h-2 rounded-full bg-brand-red animate-ping mr-3" />
                    {matches?.filter((m: any) => m.status === 'live').length || 0} Dynamic Matches underway
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {matches?.map((match: any, index: number) => {
                    const tA = match.teamA;
                    const tB = match.teamB;
                    const sc = match.score || {};
                    const isFinal = match.matchType?.toLowerCase().includes('final');

                    return (
                        <div key={match.id} className={`match-card ${isFinal ? 'lg:col-span-2' : ''}`}>
                            <Card className={`glass-card hover:border-brand-blue/40 transition-all duration-700 relative overflow-hidden group border-white/5 bg-black/40 backdrop-blur-2xl ${isFinal ? 'border-brand-yellow/30 shadow-[0_0_50px_rgba(255,214,10,0.1)]' : ''}`}>
                                {isFinal && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow/5 via-transparent to-brand-red/5 animate-pulse-slow"></div>
                                )}
                                {/* Match Progress Bar */}
                                <div className={`absolute top-0 right-0 left-0 h-1.5 z-20 
                                    ${match.status === 'live' ? 'bg-gradient-to-r from-brand-red via-brand-yellow to-brand-red animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' :
                                        match.status === 'upcoming' ? 'bg-brand-blue/40' : 'bg-gray-800'}`
                                } />

                                <CardContent className="p-8 relative">
                                    {isFinal && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                                            <div className="bg-brand-yellow text-black px-8 py-1.5 rounded-full font-heading text-xs tracking-[0.4em] uppercase shadow-2xl flex items-center gap-3">
                                                <Trophy className="w-4 h-4" /> The Grand Final <Trophy className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                    {/* Status Indicator */}
                                    <div className="absolute top-6 right-8 flex items-center gap-3">
                                        {match.status === 'live' && (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-brand-red tracking-[0.3em] uppercase mb-1">In Play</span>
                                                <div className="bg-brand-red/10 border border-brand-red/20 px-3 py-1 rounded-full flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                                                    <span className="text-[9px] font-bold text-brand-red uppercase tracking-widest">LIVE NOW</span>
                                                </div>
                                            </div>
                                        )}
                                        {match.status === 'completed' && (
                                            <div className="bg-white/5 border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FINAL RESULT</span>
                                            </div>
                                        )}
                                        {match.status === 'upcoming' && (
                                            <div className="bg-brand-blue/5 border border-brand-blue/20 px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md">
                                                <Clock className="w-3.5 h-3.5 text-brand-blue" />
                                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">SCHEDULED</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col space-y-10 mt-6 relative">
                                        {/* Cinematic VS Branding */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity">
                                            <span className="font-heading text-9xl tracking-tighter text-white">VS</span>
                                        </div>

                                        {/* Team A */}
                                        <div className="flex items-center justify-between group/teamA">
                                            <div className="flex items-center gap-6">
                                                <div className="relative">
                                                    <div className="absolute -inset-2 bg-gradient-to-br from-brand-blue/20 to-transparent blur-xl opacity-0 group-hover/teamA:opacity-100 transition-opacity" />
                                                    <img
                                                        src={tA?.logo || `https://ui-avatars.com/api/?name=${tA?.shortName || tA?.name}&background=random`}
                                                        alt={tA?.name}
                                                        className="w-16 h-16 rounded-full bg-black/60 flex-shrink-0 object-cover border-2 border-white/10 group-hover:scale-105 transition-transform duration-500 relative z-10"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-1 flex items-center gap-2">
                                                        {isFinal && <Trophy className="w-3 h-3 text-brand-yellow" />}
                                                        {isFinal ? 'FINALIST ALPHA' : 'Franchise Alpha'}
                                                    </span>
                                                    <span
                                                        className={`font-heading text-3xl lg:text-4xl tracking-tight leading-none uppercase ${match.winnerTeamId === tA.id ? 'text-brand-yellow drop-shadow-[0_0_10px_rgba(255,214,10,0.3)]' : 'text-white'}`}
                                                    >
                                                        {tA?.shortName || tA?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {(match.status === 'live' || match.status === 'completed') ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-4xl font-black font-heading tracking-tighter text-white">{sc.teamARuns}<span className="text-xl opacity-40 mx-0.5">/</span>{sc.teamAWickets}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Overs {sc.teamAOversPlayed}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 px-3 py-1 rounded opacity-40">Ready</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Team B */}
                                        <div className="flex items-center justify-between group/teamB">
                                            <div className="flex items-center gap-6">
                                                <div className="relative">
                                                    <div className="absolute -inset-2 bg-gradient-to-br from-brand-red/20 to-transparent blur-xl opacity-0 group-hover/teamB:opacity-100 transition-opacity" />
                                                    <img
                                                        src={tB?.logo || `https://ui-avatars.com/api/?name=${tB?.shortName || tB?.name}&background=random`}
                                                        alt={tB?.name}
                                                        className="w-16 h-16 rounded-full bg-black/60 flex-shrink-0 object-cover border-2 border-white/10 group-hover:scale-105 transition-transform duration-500 relative z-10"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold mb-1 flex items-center gap-2">
                                                        {isFinal && <Trophy className="w-3 h-3 text-brand-yellow" />}
                                                        {isFinal ? 'FINALIST BETA' : 'Franchise Beta'}
                                                    </span>
                                                    <span
                                                        className={`font-heading text-3xl lg:text-4xl tracking-tight leading-none uppercase ${match.winnerTeamId === tB.id ? 'text-brand-yellow drop-shadow-[0_0_10px_rgba(255,214,10,0.3)]' : 'text-white'}`}
                                                    >
                                                        {tB?.shortName || tB?.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {(match.status === 'live' || match.status === 'completed') ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-4xl font-black font-heading tracking-tighter text-white">{sc.teamBRuns}<span className="text-xl opacity-40 mx-0.5">/</span>{sc.teamBWickets}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Overs {sc.teamBOversPlayed}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] border border-white/5 px-3 py-1 rounded opacity-40">Ready</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Match Metadata & CTA */}
                                    <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2">
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5 text-brand-blue opacity-70" />
                                                {match.date} <span className="text-gray-600 mx-1">•</span> {formatTime12h(match.time)}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                <MapPin className="w-3.5 h-3.5 text-brand-red opacity-70" />
                                                {match.venue}
                                            </div>
                                            {match.tossWinner && (
                                                <div className="flex items-center gap-2 text-[10px] text-brand-yellow font-bold uppercase tracking-widest bg-brand-yellow/5 px-2 py-1 rounded border border-brand-yellow/10">
                                                    <Trophy className="w-3.5 h-3.5 opacity-70" />
                                                    {match.tossWinner === match.teamAId ? match.teamA?.shortName : match.teamB?.shortName} WON TOSS & {match.tossDecision}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {match.status === 'live' ? (
                                                <Link to={`/matches/${match.id}`} className="w-full sm:w-auto">
                                                    <Button variant="destructive" className="w-full h-11 px-8 rounded-xl bg-gradient-to-r from-brand-red to-orange-600 hover:scale-105 transition-transform duration-300 gap-3 font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                                        <PlayCircle className="w-4 h-4" /> ENTER ARENA
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link to={`/matches/${match.id}`} className="w-full sm:w-auto">
                                                    <Button variant="outline" className="w-full h-11 px-8 rounded-xl border-white/10 hover:border-brand-blue/50 hover:bg-brand-blue/5 text-gray-300 hover:text-white transition-all duration-300 font-black uppercase text-[10px] tracking-widest">
                                                        {match.status === 'completed' ? 'VIEW SCORECARD' : 'MATCH INTEL'}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {match.status === 'completed' && match.winnerTeamId && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none">
                                            <div className="border-4 border-emerald-500/20 px-8 py-2 rounded-2xl scale-125 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <span className="text-6xl font-black text-emerald-400 font-heading tracking-widest uppercase">STAMPED</span>
                                            </div>
                                        </div>
                                    )}

                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
                {matches?.length === 0 && (
                    <div className="col-span-full text-center py-32 glass-card border-dashed border-white/10 mx-4">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-6 opacity-20" />
                        <h3 className="text-xl font-heading text-white tracking-widest uppercase opacity-40">Schedule Matrix Empty</h3>
                        <p className="text-gray-600 text-[10px] uppercase tracking-widest mt-2">The organizing committee has not finalized any upcoming engagements.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

