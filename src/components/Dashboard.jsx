import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Briefcase, TrendingUp, Activity } from 'lucide-react';
import apiService from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await apiService.getEmployeeStats();
            setStats(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
                        <div className="h-8 bg-slate-700 rounded mb-4"></div>
                        <div className="h-12 bg-slate-700 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
                <p>Error loading dashboard: {error}</p>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Total Employees',
            value: stats.totalEmployees,
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-900',
            textColor: 'text-blue-100'
        },
        {
            title: 'Active Employees',
            value: stats.activeEmployees,
            icon: UserCheck,
            color: 'green',
            bgColor: 'bg-green-900',
            textColor: 'text-green-100'
        },
        {
            title: 'Inactive Employees',
            value: stats.inactiveEmployees,
            icon: UserX,
            color: 'yellow',
            bgColor: 'bg-yellow-900',
            textColor: 'text-yellow-100'
        },
        {
            title: 'On Leave',
            value: stats.onLeaveEmployees,
            icon: Activity,
            color: 'purple',
            bgColor: 'bg-purple-900',
            textColor: 'text-purple-100'
        }
    ];

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'bg-green-500',
            'Inactive': 'bg-yellow-500',
            'On Leave': 'bg-blue-500',
            'Terminated': 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Employee Dashboard
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className={`${card.bgColor} rounded-lg p-6 border border-slate-700`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`${card.textColor} text-sm font-medium mb-1`}>
                                        {card.title}
                                    </p>
                                    <p className="text-white text-3xl font-bold">
                                        {card.value.toLocaleString()}
                                    </p>
                                </div>
                                <div className={`${card.textColor} opacity-80`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Department Distribution
                    </h3>
                    <div className="space-y-3">
                        {stats.departmentStats.map((dept, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-slate-300">{dept._id}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{
                                                width: `${(dept.count / stats.totalEmployees) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-white font-medium min-w-[3rem] text-right">
                                        {dept.count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Employee Status Overview</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-slate-300">Active</span>
                            </div>
                            <span className="text-white font-medium">{stats.activeEmployees}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span className="text-slate-300">Inactive</span>
                            </div>
                            <span className="text-white font-medium">{stats.inactiveEmployees}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-slate-300">On Leave</span>
                            </div>
                            <span className="text-white font-medium">{stats.onLeaveEmployees}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-slate-300">Terminated</span>
                            </div>
                            <span className="text-white font-medium">{stats.terminatedEmployees}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
