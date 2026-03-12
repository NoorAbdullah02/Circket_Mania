import React, { useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Shield, Users, Calendar, Trophy, ArrowRight, Star, Target } from 'lucide-react';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function TeamDetails() {
    const { id } = useParams<{ id: string }>();
    const container = useRef<HTMLDivElement>(null);

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

    useGSAP(() => {
        if (team) {
            // Only animate transforms — NEVER set opacity to 0 as it hides elements permanently
            gsap.from('.team-header', { y: 20, duration: 0.8, ease: 'power3.out' });
            gsap.from('.team-stat', { scale: 0.8, duration: 0.6, stagger: 0.05, ease: 'back.out(1.5)', delay: 0.2 });
            gsap.from('.match-sidebar', { x: 20, duration: 0.8, ease: 'power3.out', delay: 0.3 });
        }
    }, { dependencies: [team], scope: container });

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
                    <span className="text-[10px] font-black tracking-[0.4em] text-gray-500 uppercase">Loading Franchise Intel</span>
                </div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center text-center px-4">
                <Shield className="w-20 h-20 text-brand-red opacity-20 mb-6" />
                <h2 className="text-2xl font-heading tracking-widest text-white uppercase">Franchise Not Found</h2>
                <Link to="/" className="mt-6 text-brand-blue hover:text-white transition-colors font-bold uppercase text-[10px] tracking-[0.3em]">Return to Stadium</Link>
            </div>
        );
    }

    const completedMatches = matches?.filter((m: any) => ['completed', 'no_result', 'cancelled'].includes(m.status)) || [];
    const upcomingMatches = matches?.filter((m: any) => ['upcoming', 'live', 'postponed'].includes(m.status)) || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative" ref={container}>
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] opacity-10 rounded-full blur-[160px]" style={{ backgroundColor: team.color || '#38BDF8' }} />

            {/* Team Header */}
            <div className="relative overflow-hidden rounded-[3rem] mb-12 glass-card border-none team-header">
                {/* Cover Photo Background */}
                {team.coverPhoto && (
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${team.coverPhoto})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                )}
                <div className="absolute inset-0 opacity-10" style={{ backgroundColor: team.color || '#38BDF8' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-bg/80 via-transparent to-brand-bg/80" />

                <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12 p-6 sm:p-10 md:p-16">
                    <div className="relative group">
                        <div className="absolute -inset-6 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-1000" style={{ backgroundColor: team.color }} />
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-full p-1 bg-gradient-to-br from-white/20 to-transparent">
                            <img
                                src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random&size=200`}
                                alt={team.name}
                                className="w-full h-full rounded-full object-cover border-4 border-brand-bg shadow-2xl relative z-10"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-white uppercase shadow-xl z-20">
                            EST. 2024
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-4 justify-center md:justify-start flex-wrap">
                            <span className="text-brand-yellow font-black text-lg sm:text-2xl tracking-[0.3em] uppercase drop-shadow-[0_0_10px_rgba(255,214,10,0.3)]">{team.shortName}</span>
                            <div className="w-px h-6 bg-white/20" />
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: team.color }} />
                                <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">{team.color}</span>
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-4xl md:text-8xl font-heading tracking-tighter text-white uppercase leading-none mb-4 sm:mb-8">
                            {team.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 justify-center md:justify-start">
                            {[
                                { label: 'Active Roster', value: team.players?.length || 0, color: 'text-brand-blue', icon: Users },
                                { label: 'Battles Won', value: completedMatches.filter((m: any) => m.winnerTeamId === id).length, color: 'text-emerald-400', icon: Trophy },
                                { label: 'Upcoming', value: upcomingMatches.length, color: 'text-brand-yellow', icon: Calendar },
                            ].map((stat, i) => (
                                <div key={stat.label} className="team-stat glass-panel px-3 sm:px-6 py-2 sm:py-3 rounded-2xl flex items-center gap-2 sm:gap-4 border-white/5 hover:border-white/10 transition-colors group">
                                    <div className={`p-1.5 sm:p-2 rounded-lg bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-lg sm:text-2xl font-black font-heading leading-none ${stat.color}`}>{stat.value}</div>
                                        <div className="text-[8px] sm:text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5 sm:mt-1">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                {/* Squad Section */}
                <div className="md:col-span-2">
                    <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span style={{ color: '#38BDF8', fontWeight: 800, fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'Oswald, sans-serif' }}>
                                Franchise Squad
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                            {(!team.players || team.players.length === 0) ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555', gridColumn: '1 / -1' }}>
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: '#555' }} />
                                    <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700 }}>Roster synchronization pending</p>
                                </div>
                            ) : (
                                team.players.map((player: any, i: number) => (
                                    <Link
                                        to={`/player/${player.id}`}
                                        key={player.id}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            borderRight: '1px solid rgba(255,255,255,0.04)',
                                            color: 'white',
                                            textDecoration: 'none',
                                            transition: 'background 0.3s',
                                            textAlign: 'center'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={player.profileImage || `https://ui-avatars.com/api/?name=${player.name}&background=random`}
                                                alt={player.name}
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                                            />
                                            {player.isCaptain && (
                                                <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', background: '#FFD60A', color: 'black', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 900, transform: 'rotate(12deg)', border: '2px solid #000', zIndex: 10 }}>C</div>
                                            )}
                                        </div>
                                        <div style={{ minWidth: 0, width: '100%' }}>
                                            <div style={{ fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {player.name}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '8px', color: '#38BDF8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{player.role || 'PLAYER'}</span>
                                                {player.jerseyNumber && (
                                                    <span style={{ fontSize: '8px', color: '#666', fontWeight: 700 }}>#{player.jerseyNumber}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center', fontSize: '9px', color: '#666', width: '100%' }}>
                                            <div><span style={{ color: '#fff', fontWeight: 600, fontSize: '10px' }}>{player.totalRuns || 0}</span> <span style={{color: '#666'}}>runs</span></div>
                                            <div><span style={{ color: '#fff', fontWeight: 600, fontSize: '10px' }}>{player.totalWickets || 0}</span> <span style={{color: '#666'}}>wkts</span></div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Match Sidebars */}
                <div className="space-y-6 md:space-y-8 match-sidebar">
                    {/* Live/Upcoming Matches */}
                    <Card className="glass-card border-brand-blue/10 bg-brand-blue/[0.02]">
                        <CardHeader className="border-b border-white/5 px-6 py-5">
                            <CardTitle className="font-heading tracking-[0.2em] text-[11px] flex items-center gap-3 uppercase text-brand-blue">
                                <Calendar className="w-4 h-4" />
                                Next Engagements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {upcomingMatches.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold font-heading">No Scheduled Battles</p>
                                </div>
                            ) : (
                                upcomingMatches.map((match: any) => {
                                    const opponent = match.teamA?.id === id ? match.teamB : match.teamA;
                                    return (
                                        <Link key={match.id} to={`/matches/${match.id}`} className="flex items-center gap-4 p-5 border-b border-white/5 hover:bg-brand-blue/5 transition-all group">
                                            <img
                                                src={opponent?.logo || `https://ui-avatars.com/api/?name=${opponent?.name}&background=random`}
                                                className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:scale-110 transition-transform"
                                                alt={opponent?.name}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white text-xs font-black uppercase tracking-widest truncate group-hover:text-brand-blue transition-colors">vs {opponent?.shortName || opponent?.name}</div>
                                                <div className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-tighter">{match.date} • {match.venue}</div>
                                            </div>
                                            {match.status === 'live' && (
                                                <span className="text-[9px] text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-1 rounded-sm font-black uppercase tracking-widest animate-pulse">LIVE</span>
                                            )}
                                            <ArrowRight className="w-3 h-3 text-gray-700 group-hover:text-brand-blue transition-colors" />
                                        </Link>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Results Section */}
                    <Card className="glass-card border-brand-yellow/10">
                        <CardHeader className="border-b border-white/5 px-6 py-5">
                            <CardTitle className="font-heading tracking-[0.2em] text-[11px] flex items-center gap-3 uppercase text-brand-yellow">
                                <Trophy className="w-4 h-4" />
                                Tactical Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {completedMatches.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold font-heading">No Records Found</p>
                                </div>
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
                                        <Link key={match.id} to={`/matches/${match.id}`} className="flex items-center gap-4 p-5 border-b border-white/5 hover:bg-white/[0.03] transition-all group">
                                            <div className={`w-1.5 h-8 rounded-full ${won ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-brand-red shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{match.date}</span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${won ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-red/10 text-brand-red'}`}>{won ? 'Victoire' : 'Défaite'}</span>
                                                </div>
                                                <div className="text-white text-xs font-black uppercase tracking-wider group-hover:text-brand-yellow transition-colors truncate">vs {opponent?.shortName || opponent?.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-black font-heading ${won ? 'text-emerald-400' : 'text-brand-red'}`}>
                                                    {ourRuns}/{ourWickets}
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                                    Target {oppRuns}
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

