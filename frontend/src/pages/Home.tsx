import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Trophy, Calendar, Users, Activity } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
                <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-bg/50 via-brand-bg/80 to-brand-bg"></div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-block glass-panel px-6 py-2 rounded-full mb-8">
                            <span className="text-brand-blue font-heading tracking-widest text-sm uppercase">🏏 University Tournament</span>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-9xl font-heading tracking-tight text-white mb-6 uppercase"
                    >
                        <span className="block neon-text-yellow">ICE Cricket</span>
                        <span className="text-white font-light mt-2 tracking-widest flex items-center justify-center gap-3">
                            MANIA
                            <span className="text-brand-red font-black text-6xl md:text-8xl italic drop-shadow-[0_0_20px_rgba(255,59,48,0.8)] leading-none mt-1">S2</span>
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-4 text-xl md:text-2xl text-gray-300 max-w-3xl font-body font-light mb-12"
                    >
                        The ultimate battleground for the finest talents. Register now, get drafted, and witness the glory.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-6 justify-center"
                    >
                        <Link to="/register">
                            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-10">Register as Player</Button>
                        </Link>
                        <Link to="/matches">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-10">View Schedule</Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats/Features Section */}
            <section className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Live Action', desc: 'Real-time ball by ball scores', icon: <Activity className="w-8 h-8 text-brand-red" /> },
                            { title: 'Teams', desc: 'Franchise-based drafting system', icon: <Users className="w-8 h-8 text-brand-blue" /> },
                            { title: 'Tournament', desc: 'Intense round-robin & finals', icon: <Calendar className="w-8 h-8 text-white" /> },
                            { title: 'Glory', desc: 'Exclusive awards and trophies', icon: <Trophy className="w-8 h-8 text-brand-yellow" /> },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="glass-panel p-8 flex flex-col items-center text-center group hover:border-brand-blue/50 transition-all duration-300 transform hover:-translate-y-2"
                            >
                                <div className="bg-black/50 p-4 rounded-full mb-6 border border-white/10 group-hover:border-brand-blue/30 group-hover:shadow-[0_0_15px_rgba(10,132,255,0.3)] transition-all">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-heading text-white tracking-widest uppercase mb-3">{feature.title}</h3>
                                <p className="text-gray-400 font-light">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
