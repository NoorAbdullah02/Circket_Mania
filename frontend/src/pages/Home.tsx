import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Trophy, Calendar, Users, Activity, ChevronRight, Play, Sparkles, Star, Zap } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Home() {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });

        tl.from('.hero-badge', { y: 20, opacity: 0, duration: 0.8 })
            .from('.title-ice', {
                y: 100,
                opacity: 0,
                filter: 'blur(20px)',
                scale: 1.1,
                rotateX: -10,
                duration: 1.5
            }, '-=0.4')
            .from('.title-mania-wrapper', {
                y: 50,
                opacity: 0,
                filter: 'blur(10px)',
                duration: 1.2
            }, '-=1.2')
            .from('.s2-text', {
                y: -100,
                opacity: 0,
                filter: 'blur(20px)',
                scale: 2,
                duration: 1.5,
                ease: 'expo.out'
            }, '-=1.2')
            .from('.hero-desc', { y: 20, opacity: 0 }, '-=1')
            .from('.hero-btns', { y: 20, scale: 0.9, duration: 1 }, '-=0.8')
            .from('.hero-bg-accent', { scale: 0, opacity: 0, duration: 2 }, 0)
            .from('.hero-stats', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5');

        gsap.to('.float-icon', {
            y: -20,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.4
        });

        gsap.to('.spin-slow-element', {
            rotation: 360,
            duration: 40,
            repeat: -1,
            ease: 'none'
        });
    }, { scope: container });

    return (
        <div className="flex flex-col relative w-full overflow-x-clip" ref={container}>
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="hero-bg-accent absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-brand-blue/10 rounded-full blur-[120px]"></div>
                <div className="hero-bg-accent absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-red/10 rounded-full blur-[100px]"></div>
                <div className="hero-bg-accent absolute top-[30%] left-[40%] w-[30vw] h-[30vw] bg-brand-yellow/5 rounded-full blur-[150px]"></div>

                {/* Decorative rings */}
                <div className="spin-slow-element absolute top-[15%] right-[10%] w-[400px] h-[400px] border border-white/[0.02] rounded-full hidden lg:block" />
                <div className="spin-slow-element absolute top-[15%] right-[10%] w-[500px] h-[500px] border border-white/[0.015] rounded-full hidden lg:block" style={{ animationDirection: 'reverse' }} />

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-brand-blue/30 rounded-full hidden lg:block"
                        style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.3, 0.8, 0.3],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                        }}
                    />
                ))}
            </div>

            {/* Hero Section */}
            <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden pt-8 sm:pt-16 md:pt-20">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--brand-bg)_100%)] opacity-80"></div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <div className="hero-badge inline-block glass-premium px-4 py-2 sm:px-6 sm:py-2.5 rounded-full mb-8 sm:mb-8 shadow-xl overflow-hidden group cursor-default">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <span className="text-brand-blue font-heading tracking-[0.3em] text-sm sm:text-sm uppercase flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-ping"></span>
                            <span className="hidden sm:inline">University Tournament 🏏 Season 2</span>
                            <span className="sm:hidden">Tournament S2</span>
                        </span>
                    </div>

                    <h1 className="hero-title text-5xl sm:text-5xl md:text-8xl lg:text-[11rem] font-heading tracking-tighter text-white mb-6 sm:mb-12 uppercase leading-[0.85] flex flex-col items-center relative">
                        <div className="absolute -inset-x-20 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-20"></div>
                        <div className="overflow-hidden py-2">
                            <span className="block title-ice relative">
                                <span className="text-brand-yellow drop-shadow-[0_0_20px_rgba(255,214,10,0.5)]">ICE</span> CRICKET
                            </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-16 mt-2 sm:mt-4 relative title-mania-wrapper">
                            <span className="font-light tracking-[0.4em] opacity-40 text-lg sm:text-2xl md:text-6xl text-gray-300">MANIA</span>
                            <div className="relative s2-badge-container">
                                <div className="absolute inset-x-0 -inset-y-4 bg-gradient-to-r from-brand-red to-orange-500 blur-3xl opacity-20 scale-150 animate-pulse"></div>
                                <span className="s2-text block text-5xl sm:text-6xl md:text-[14rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-brand-red to-red-900 relative z-10 drop-shadow-[0_0_60px_rgba(255,59,48,0.4)] leading-none -rotate-2 group cursor-default tracking-tighter">
                                    S2
                                </span>
                                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 md:-bottom-4 md:right-0 bg-white text-black px-1.5 sm:px-2 md:px-4 py-0.25 sm:py-0.5 md:py-1 text-[5px] sm:text-[6px] md:text-[8px] font-black uppercase tracking-[0.3em] rotate-1 shadow-2xl z-20 whitespace-nowrap">
                                    THE SECOND IMPACT
                                </div>
                            </div>
                        </div>
                    </h1>

                    <p className="hero-desc mt-4 sm:mt-6 text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl font-body font-light mb-8 sm:mb-16 leading-relaxed italic px-2">
                        "Where technology strikes the willow." <br className="hidden sm:block" />
                        Register now, get drafted, and witness the ultimate glory in campus cricket.
                    </p>

                    <div className="hero-btns flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center w-full sm:w-auto px-4">
                        <Link to="/register" className="group w-full sm:w-auto">
                            <Button size="sm" className="h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-lg font-bold uppercase tracking-widest bg-gradient-to-r from-brand-blue to-brand-cyan hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(10,132,255,0.3)] hover:shadow-[0_0_40px_rgba(10,132,255,0.5)] w-full rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative flex items-center">Enter the Draft <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" /></span>
                            </Button>
                        </Link>
                        <Link to="/matches" className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-lg font-bold uppercase tracking-widest border-white/10 hover:bg-white/5 hover:border-brand-yellow/30 active:scale-95 transition-all flex items-center justify-center gap-2 w-full rounded-2xl">
                                <Play className="w-3 h-3 sm:w-4 sm:h-4 text-brand-yellow fill-brand-yellow" /> View Fixtures
                            </Button>
                        </Link>
                    </div>

                    {/* Hero Stats Bar */}
                    <div className="hero-stats mt-16 sm:mt-24 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-2xl mx-auto">
                        {[
                            { value: '8+', label: 'Teams', icon: Users },
                            { value: '50+', label: 'Players', icon: Star },
                            { value: 'S2', label: 'Season', icon: Sparkles },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                className="glass-premium px-4 py-4 sm:py-5 flex flex-col items-center gap-1 group hover:border-brand-blue/20 transition-all duration-500 cursor-default"
                                whileHover={{ y: -4 }}
                            >
                                <stat.icon className="w-4 h-4 text-brand-blue/50 mb-1 group-hover:text-brand-blue transition-colors" />
                                <span className="text-2xl sm:text-3xl font-heading font-black text-white">{stat.value}</span>
                                <span className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">{stat.label}</span>
                            </motion.div>
                        ))}
                    </div>

                    <div className="absolute -left-20 top-1/2 w-40 h-40 bg-brand-blue/20 blur-3xl float-icon hidden lg:block"></div>
                    <div className="absolute -right-20 top-1/4 w-32 h-32 bg-brand-red/20 blur-3xl float-icon hidden lg:block"></div>
                </div>
            </section>

            {/* Decorative divider */}
            <div className="relative z-10 px-8">
                <div className="decorative-line max-w-4xl mx-auto" />
            </div>

            {/* Features Section */}
            <section className="py-16 sm:py-24 md:py-32 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8 sm:mb-16">
                    <h2 className="text-[0.65rem] sm:text-xs font-bold text-brand-blue uppercase tracking-[0.5em] mb-2 sm:mb-4">Core Experience</h2>
                    <p className="text-lg sm:text-2xl md:text-3xl font-heading text-white uppercase tracking-widest">Tournament Excellence</p>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {[
                            { title: 'Live Action', desc: 'Real-time ball by ball scores with interactive commentary', icon: <Activity className="w-8 h-8 text-brand-red" />, accent: 'from-brand-red/10' },
                            { title: 'Teams', desc: 'Exclusive franchise-based drafting system for internal batches', icon: <Users className="w-8 h-8 text-brand-blue" />, accent: 'from-brand-blue/10' },
                            { title: 'Tournament', desc: 'Intense round-robin league followed by pressure knockouts', icon: <Calendar className="w-8 h-8 text-white" />, accent: 'from-white/5' },
                            { title: 'Glory', desc: 'Prestige, exclusive awards, and the coveted ICE Mania Cup', icon: <Trophy className="w-8 h-8 text-brand-yellow" />, accent: 'from-brand-yellow/10' },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className={`glass-card p-6 sm:p-10 flex flex-col items-center text-center group hover:border-brand-blue/30 transition-all duration-500 transform hover:-translate-y-4 relative overflow-hidden mx-auto w-full max-w-[340px] sm:max-w-none`}
                            >
                                {/* Gradient accent at top */}
                                <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${feature.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                                <div className="relative z-10 flex flex-col items-center justify-center w-full">
                                    <div className="bg-black/50 p-4 sm:p-6 rounded-2xl mb-4 sm:mb-8 border border-white/[0.06] group-hover:border-brand-blue/20 group-hover:shadow-[0_0_30px_rgba(10,132,255,0.1)] transition-all duration-500 relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-brand-blue opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity"></div>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-heading text-white tracking-widest uppercase mb-2 sm:mb-4">{feature.title}</h3>
                                    <p className="text-gray-400 font-light leading-relaxed text-xs sm:text-sm">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="relative z-10 border-t border-white/[0.04] mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-heading tracking-widest">
                                <span className="text-brand-yellow">ICE</span>
                                <span className="text-white font-light ml-1">CRICKET</span>
                            </span>
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Season 2</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <Link to="/matches" className="text-gray-500 hover:text-brand-blue text-xs uppercase tracking-widest font-bold transition-colors">Matches</Link>
                            <Link to="/points-table" className="text-gray-500 hover:text-brand-blue text-xs uppercase tracking-widest font-bold transition-colors">Standings</Link>
                            <Link to="/register" className="text-gray-500 hover:text-brand-yellow text-xs uppercase tracking-widest font-bold transition-colors">Register</Link>
                        </div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                            © 2026 ICE Cricket Mania
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
