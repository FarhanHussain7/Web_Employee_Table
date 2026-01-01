import React, { useState, useEffect } from 'react';
import { Users, Check, X, AlertCircle, UserPlus, Clock, Ban } from 'lucide-react';
import authService from '../services/authService';

const AdminNotifications = ({ onUserApproved }) => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const response = await authService.getPendingUsers();
            setPendingUsers(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await authService.approveUser(userId);
            setPendingUsers(prev => prev.filter(user => user._id !== userId));
            if (onUserApproved) {
                onUserApproved();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleReject = async (userId) => {
        try {
            await authService.rejectUser(userId);
            setPendingUsers(prev => prev.filter(user => user._id !== userId));
            if (onUserApproved) {
                onUserApproved();
            }
        } catch (err) {
            setError(err.message);
        }
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

    if (pendingUsers.length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Pending Approvals</h3>
                <p className="text-slate-400">All user registrations have been processed</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Pending User Approvals
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {pendingUsers.length}
                    </span>
                </h3>
                <button
                    onClick={fetchPendingUsers}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Refresh"
                >
                    <Clock className="w-4 h-4" />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg text-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-3">
                {pendingUsers.map((user) => (
                    <div key={user._id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">
                                        {user.firstName} {user.lastName}
                                    </h4>
                                    <p className="text-slate-400 text-sm">{user.email}</p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                        <span>{user.department}</span>
                                        <span>{user.position}</span>
                                        <span>{user.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleApprove(user._id)}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                                    title="Approve user"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleReject(user._id)}
                                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                                    title="Reject user"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminNotifications;
