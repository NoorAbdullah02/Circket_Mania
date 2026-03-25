import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/button';
import { User, LogOut, Menu, X, Loader2, Trophy, Swords, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { isAuthenticated, user, logout, isInitialized } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const navLinks = [
        { to: '/matches', label: 'Matches', icon: Swords },
        { to: '/points-table', label: 'Standings', icon: Trophy },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
            ? 'backdrop-blur-2xl bg-black/70 border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
            : 'backdrop-blur-xl bg-black/30 border-b border-white/[0.03]'
            }`}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/30 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-[72px]">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 group relative" onClick={() => setIsMenuOpen(false)}>
                            <div className="absolute -inset-4 bg-brand-blue/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                            <span className="text-2xl font-heading tracking-widest flex items-center gap-1.5 relative">
                                <span className="text-brand-yellow drop-shadow-[0_0_10px_rgba(255,214,10,0.4)] group-hover:drop-shadow-[0_0_20px_rgba(255,214,10,0.6)] transition-all">ICE</span>
                                <span className="text-white font-light group-hover:text-brand-blue transition-colors duration-300">CRICKET</span>
                                <span className="bg-gradient-to-br from-brand-red to-red-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md italic shadow-[0_0_15px_rgba(255,59,48,0.3)] transform -rotate-12 -translate-y-2 group-hover:rotate-0 group-hover:shadow-[0_0_25px_rgba(255,59,48,0.5)] transition-all duration-300">S2</span>
                            </span>
                        </Link>

                        <div className="hidden lg:flex ml-10 items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${isActive(link.to)
                                        ? 'text-white bg-white/[0.06]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <link.icon className={`w-4 h-4 transition-colors ${isActive(link.to) ? 'text-brand-blue' : 'text-gray-500 group-hover:text-brand-blue'}`} />
                                    {link.label}
                                    {isActive(link.to) && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full"
                                            transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                        />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden lg:block">
                        <div className="ml-4 flex items-center lg:ml-6 space-x-3 min-w-[140px] justify-end">
                            {!isInitialized ? (
                                <div className="h-9 w-9 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500/50" />
                                </div>
                            ) : isAuthenticated ? (
                                <>
                                    <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                                        <Button variant="outline" className="gap-2 border-white/[0.08] h-9 text-xs bg-white/[0.02] hover:bg-brand-blue/10 hover:border-brand-blue/30 hover:text-brand-blue transition-all duration-300 rounded-xl">
                                            <LayoutDashboard className="w-3.5 h-3.5" />
                                            {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={handleLogout} className="gap-2 text-gray-400 hover:text-brand-red h-9 text-xs hover:bg-brand-red/5 rounded-xl transition-all duration-300">
                                        <LogOut className="w-3.5 h-3.5" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" className="text-gray-300 hover:text-white h-9 text-xs hover:bg-white/[0.04] rounded-xl transition-all">Sign In</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button className="h-9 text-xs px-6 bg-gradient-to-r from-brand-blue to-brand-cyan hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300 rounded-xl font-bold">Register</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="-mr-2 flex lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-white hover:bg-white/10 rounded-xl"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-white/[0.06] overflow-hidden bg-black/95 backdrop-blur-2xl"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-2">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all ${isActive(link.to)
                                        ? 'text-white bg-brand-blue/10 border border-brand-blue/20'
                                        : 'text-gray-300 hover:text-white hover:bg-white/[0.04]'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <link.icon className={`w-5 h-5 ${isActive(link.to) ? 'text-brand-blue' : 'text-gray-500'}`} />
                                    {link.label}
                                </Link>
                            ))}

                            <div className="pt-4 flex flex-col space-y-3 border-t border-white/[0.06] mt-4">
                                {!isInitialized ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-500/50" />
                                    </div>
                                ) : isAuthenticated ? (
                                    <>
                                        <Link
                                            to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Button className="w-full gap-2 justify-center py-6 h-auto text-lg bg-gradient-to-r from-brand-blue to-brand-cyan rounded-xl">
                                                <LayoutDashboard className="w-5 h-5" />
                                                {user?.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            className="w-full gap-2 justify-center py-4 h-auto text-gray-400 hover:text-brand-red hover:bg-brand-red/5 rounded-xl"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full py-4 h-auto text-gray-300 text-lg rounded-xl">Sign In</Button>
                                        </Link>
                                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full py-6 h-auto text-lg bg-gradient-to-r from-brand-blue to-brand-cyan rounded-xl font-bold">Register</Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
