import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import authService from '../services/authService';

const SessionStatus = () => {
    const [sessionInfo, setSessionInfo] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const updateSessionInfo = () => {
            setSessionInfo(authService.getSessionInfo());
        };

        // Update immediately
        updateSessionInfo();

        // Update every minute
        const interval = setInterval(updateSessionInfo, 60000);

        return () => clearInterval(interval);
    }, []);

    const formatTimeRemaining = (milliseconds) => {
        if (!milliseconds) return 'Unknown';

        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const handleRefreshSession = async () => {
        try {
            await authService.refreshToken();
            setSessionInfo(authService.getSessionInfo());
        } catch (error) {
            console.error('Session refresh failed:', error);
        }
    };

    const handleLogout = () => {
        authService.logout();
        window.location.href = '/login';
    };

    if (!sessionInfo || !sessionInfo.isAuthenticated) {
        return null;
    }

    const { timeUntilExpiry, tokenExpiry, user } = sessionInfo;
    const isExpiringSoon = timeUntilExpiry && timeUntilExpiry < 10 * 60 * 1000; // Less than 10 minutes

    return (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-40 max-w-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-white">Session Status</span>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    {showDetails ? '−' : '+'}
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status:</span>
                    <span className={`text-sm font-medium ${
                        isExpiringSoon ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                        {isExpiringSoon ? 'Expiring Soon' : 'Active'}
                    </span>
                </div>

                {timeUntilExpiry && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Time left:</span>
                        <span className={`text-sm font-medium ${
                            isExpiringSoon ? 'text-yellow-400' : 'text-slate-300'
                        }`}>
                            {formatTimeRemaining(timeUntilExpiry)}
                        </span>
                    </div>
                )}

                {showDetails && (
                    <div className="pt-2 border-t border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">User:</span>
                            <span className="text-sm text-white">{user?.firstName} {user?.lastName}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Role:</span>
                            <span className="text-sm text-white capitalize">{user?.role}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Status:</span>
                            <span className={`text-sm capitalize ${
                                user?.status === 'approved' ? 'text-green-400' : 
                                user?.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                                {user?.status}
                            </span>
                        </div>
                        
                        {tokenExpiry && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Expires:</span>
                                <span className="text-sm text-slate-300">
                                    {new Date(tokenExpiry).toLocaleString()}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleRefreshSession}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-500 transition-colors"
                            >
                                <LogOut className="w-3 h-3" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isExpiringSoon && (
                <div className="mt-3 p-2 bg-yellow-900 border border-yellow-700 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-300">
                            Session expires soon! Save your work or refresh.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionStatus;
