import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/button';
import { User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    return (
        <nav className="glass-panel sticky top-0 z-50 rounded-none border-t-0 border-x-0 mx-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 group" onClick={() => setIsMenuOpen(false)}>
                            <span className="text-2xl font-heading tracking-widest flex items-center gap-1.5">
                                <span className="text-brand-yellow drop-shadow-[0_0_10px_rgba(255,214,10,0.4)]">ICE</span>
                                <span className="text-white font-light group-hover:text-brand-blue transition-colors">CRICKET</span>
                                <span className="bg-brand-red text-black text-[10px] font-black px-1.5 py-0.5 rounded-md italic shadow-[0_0_15px_rgba(255,59,48,0.3)] transform -rotate-12 -translate-y-2 group-hover:rotate-0 transition-transform">S2</span>
                            </span>
                        </Link>

                        <div className="hidden lg:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/matches" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Matches</Link>
                                <Link to="/points-table" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Points Table</Link>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="ml-4 flex items-center lg:ml-6 space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                                        <Button variant="outline" className="gap-2 border-white/10 h-9 text-xs">
                                            <User className="w-3.5 h-3.5" />
                                            {user?.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={handleLogout} className="gap-2 text-gray-400 hover:text-white h-9 text-xs">
                                        <LogOut className="w-3.5 h-3.5" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" className="text-gray-300 hover:text-white h-9 text-xs">Sign In</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button className="h-9 text-xs px-6">Register</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="-mr-2 flex lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-white hover:bg-white/10"
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
                        className="lg:hidden glass-panel border-t border-white/10 rounded-none overflow-hidden bg-brand-bg/95 backdrop-blur-xl"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            <Link
                                to="/matches"
                                className="text-gray-300 hover:text-white block px-3 py-4 rounded-md text-base font-medium border-b border-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Matches
                            </Link>
                            <Link
                                to="/points-table"
                                className="text-gray-300 hover:text-white block px-3 py-4 rounded-md text-base font-medium border-b border-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Points Table
                            </Link>

                            <div className="pt-4 pb-3 flex flex-col space-y-3 px-3">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Button className="w-full gap-2 justify-center py-6 h-auto text-lg">
                                                <User className="w-5 h-5" />
                                                {user?.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            onClick={handleLogout}
                                            className="w-full gap-2 justify-center py-4 h-auto text-gray-400"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                            <Button variant="ghost" className="w-full py-4 h-auto text-gray-300 text-lg">Sign In</Button>
                                        </Link>
                                        <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                            <Button className="w-full py-6 h-auto text-lg">Register</Button>
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
