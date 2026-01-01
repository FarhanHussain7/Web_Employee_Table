import React, { useState, useEffect } from 'react';
import { Users, Power, PowerOff, Search, Eye, AlertCircle, CheckCircle, XCircle, UserX, RefreshCw, Clock, Trash } from 'lucide-react';
import authService from '../services/authService';

const UserSessionManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState({});
    const [sessionStats, setSessionStats] = useState({
        totalUsers: 0,
        activeSessions: 0,
        pendingUsers: 0,
        approvedUsers: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await authService.getAllUsers();
            const usersData = response.data || [];
            setUsers(usersData);
            
            // Calculate session statistics
            const stats = {
                totalUsers: usersData.length,
                activeSessions: usersData.filter(user => user.sessionActive).length,
                pendingUsers: usersData.filter(user => user.status === 'pending').length,
                approvedUsers: usersData.filter(user => user.status === 'approved').length
            };
            setSessionStats(stats);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStopSession = async (userId) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: 'stopping' }));
            
            // Update local state immediately for persistence
            setUsers(prev => prev.map(user => 
                user._id === userId 
                    ? { ...user, sessionActive: false, lastSessionEnd: new Date().toISOString() }
                    : user
            ));
            
            // API call to update backend
            await authService.updateUserSession(userId, { sessionActive: false });
            
            // Update stats
            setSessionStats(prev => ({
                ...prev,
                activeSessions: Math.max(0, prev.activeSessions - 1)
            }));
        } catch (err) {
            setError(err.message);
            // Revert on error
            fetchUsers();
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: null }));
        }
    };

    const handleStartSession = async (userId) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: 'starting' }));
            
            // Update local state immediately for persistence
            setUsers(prev => prev.map(user => 
                user._id === userId 
                    ? { ...user, sessionActive: true, lastSessionStart: new Date().toISOString() }
                    : user
            ));
            
            // API call to update backend
            await authService.updateUserSession(userId, { sessionActive: true });
            
            // Update stats
            setSessionStats(prev => ({
                ...prev,
                activeSessions: prev.activeSessions + 1
            }));
        } catch (err) {
            setError(err.message);
            // Revert on error
            fetchUsers();
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: null }));
        }
    };

    const handleResetToPending = async (userId) => {
        if (!window.confirm('Are you sure you want to reset this user to pending status? They will lose access to the application until approved again.')) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [userId]: 'resetting' }));
            
            // Update local state immediately
            setUsers(prev => prev.map(user => 
                user._id === userId 
                    ? { ...user, status: 'pending', sessionActive: false, lastSessionEnd: new Date().toISOString() }
                    : user
            ));
            
            // API call to update user status
            await authService.updateUserStatus(userId, 'pending');
            
            // Update stats
            setSessionStats(prev => ({
                ...prev,
                activeSessions: Math.max(0, prev.activeSessions - 1),
                pendingUsers: prev.pendingUsers + 1,
                approvedUsers: Math.max(0, prev.approvedUsers - 1)
            }));
        } catch (err) {
            setError(err.message);
            // Revert on error
            fetchUsers();
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: null }));
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone and all user data will be permanently removed.')) {
            return;
        }

        try {
            setActionLoading(prev => ({ ...prev, [userId]: 'deleting' }));
            
            // API call to delete user
            await authService.deleteUser(userId);
            
            // Remove user from local state
            setUsers(prev => prev.filter(user => user._id !== userId));
            
            // Update stats
            const deletedUser = users.find(user => user._id === userId);
            if (deletedUser) {
                setSessionStats(prev => ({
                    ...prev,
                    totalUsers: Math.max(0, prev.totalUsers - 1),
                    activeSessions: deletedUser.sessionActive ? Math.max(0, prev.activeSessions - 1) : prev.activeSessions,
                    pendingUsers: deletedUser.status === 'pending' ? Math.max(0, prev.pendingUsers - 1) : prev.pendingUsers,
                    approvedUsers: deletedUser.status === 'approved' ? Math.max(0, prev.approvedUsers - 1) : prev.approvedUsers
                }));
            }
        } catch (err) {
            setError(err.message);
            // Revert on error
            fetchUsers();
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: null }));
        }
    };

    const handleBulkAction = async (action, userIds) => {
        if (!window.confirm(`Are you sure you want to ${action} ${userIds.length} user(s)?`)) {
            return;
        }

        try {
            setLoading(true);
            const promises = userIds.map(userId => {
                if (action === 'stop') return handleStopSession(userId);
                if (action === 'start') return handleStartSession(userId);
                if (action === 'reset') return handleResetToPending(userId);
            });
            
            await Promise.all(promises);
            fetchUsers(); // Refresh to ensure consistency
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSessionStatusColor = (user) => {
        if (user.sessionActive) return 'bg-green-100 text-green-800';
        return 'bg-red-100 text-red-800';
    };

    const getStatusColor = (status) => {
        const colors = {
            'approved': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatSessionDuration = (startTime) => {
        if (!startTime) return 'N/A';
        const start = new Date(startTime);
        const now = new Date();
        const diff = now - start;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (loading) {
        return (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-slate-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Session Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Total Users</p>
                            <p className="text-2xl font-bold text-white">{sessionStats.totalUsers}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Active Sessions</p>
                            <p className="text-2xl font-bold text-green-400">{sessionStats.activeSessions}</p>
                        </div>
                        <Power className="w-8 h-8 text-green-500" />
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Pending Users</p>
                            <p className="text-2xl font-bold text-yellow-400">{sessionStats.pendingUsers}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-500" />
                    </div>
                </div>
                
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400">Approved Users</p>
                            <p className="text-2xl font-bold text-emerald-400">{sessionStats.approvedUsers}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                </div>
            </div>

            {/* Main User Management */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        User Session Management
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            {filteredUsers.length}
                        </span>
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchUsers}
                            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                    </div>
                )}

                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No users found</h3>
                        <p className="text-slate-400">
                            {searchTerm ? 'Try adjusting your search' : 'No users in the system'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Session
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-700 transition-colors">
                                        {/* User Column */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3">
                                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className="text-sm text-slate-400">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSessionStatusColor(user)}`}>
                                                {user.sessionActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {user.sessionActive && user.lastSessionStart 
                                                    ? formatSessionDuration(user.lastSessionStart)
                                                    : 'N/A'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-white">{user.department}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-300">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => user.sessionActive ? handleStopSession(user._id) : handleStartSession(user._id)}
                                                    disabled={actionLoading[user._id]}
                                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                                                        user.sessionActive 
                                                            ? 'bg-red-600 text-white hover:bg-red-500' 
                                                            : 'bg-green-600 text-white hover:bg-green-500'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    title={user.sessionActive ? 'Stop session' : 'Start session'}
                                                >
                                                    {actionLoading[user._id] === 'stopping' || actionLoading[user._id] === 'starting' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : user.sessionActive ? (
                                                        <>
                                                            <PowerOff className="w-4 h-4" />
                                                            Stop
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="w-4 h-4" />
                                                            Start
                                                        </>
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleResetToPending(user._id)}
                                                    disabled={actionLoading[user._id] || user.status === 'pending'}
                                                    className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Reset to pending"
                                                >
                                                    {actionLoading[user._id] === 'resetting' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <UserX className="w-4 h-4" />
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    disabled={actionLoading[user._id]}
                                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete user"
                                                >
                                                    {actionLoading[user._id] === 'deleting' ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Trash className="w-4 h-4" />
                                                    )}
                                                </button>
                                                
                                                <button
                                                    className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSessionManagement;
