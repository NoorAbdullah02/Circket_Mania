import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../ui/button';
import { User, LogOut, Menu } from 'lucide-react';

export default function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass-panel sticky top-0 z-50 rounded-none border-t-0 border-x-0 mx-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0">
                            <span className="neon-text-yellow text-2xl font-heading tracking-widest">
                                CRICKET<span className="text-white font-light">MANIA</span>
                            </span>
                        </Link>

                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                <Link to="/matches" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Matches</Link>
                                <Link to="/points-table" className="text-gray-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">Points Table</Link>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6 space-x-4">
                            {isAuthenticated ? (
                                <>
                                    <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'}>
                                        <Button variant="outline" className="gap-2">
                                            <User className="w-4 h-4" />
                                            {user?.role === 'admin' ? 'Admin Panel' : 'My Dashboard'}
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" onClick={handleLogout} className="gap-2 text-gray-300 hover:text-white">
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login">
                                        <Button variant="ghost" className="text-gray-300 hover:text-white">Sign In</Button>
                                    </Link>
                                    <Link to="/register">
                                        <Button>Register</Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
