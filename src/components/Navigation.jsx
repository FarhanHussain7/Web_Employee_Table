import React from 'react';
import { Users, BarChart3, Briefcase, Settings, LogOut, Power } from 'lucide-react';

const Navigation = ({ currentView, onViewChange, adminUser, onLogout }) => {
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            description: 'View statistics and overview'
        },
        {
            id: 'employees',
            label: 'Employees',
            icon: Users,
            description: 'Manage employee records'
        },
        {
            id: 'projects',
            label: 'Projects',
            icon: Briefcase,
            description: 'Manage project details'
        }
    ];

    const adminMenuItems = [
        ...menuItems,
        {
            id: 'user-sessions',
            label: 'User Sessions',
            icon: Power,
            description: 'Manage user sessions and access'
        }
    ];

    return (
        <nav className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-8">
                        <div className="flex items-center">
                            <Users className="w-8 h-8 text-blue-500 mr-3" />
                            <span className="text-white font-bold text-xl">E-Staff</span>
                        </div>
                        
                        <div className="hidden md:flex items-center space-x-1">
                            {(adminUser ? adminMenuItems : menuItems).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => onViewChange(item.id)}
                                        className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            currentView === item.id
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {adminUser && (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:block">
                                    <p className="text-sm text-slate-300">Welcome,</p>
                                    <p className="text-sm font-medium text-white">{adminUser?.firstName || 'Admin'}</p>
                                </div>
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {(adminUser?.firstName?.charAt(0) || 'A').toUpperCase()}
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:hidden border-t border-slate-700 py-2">
                    <div className="flex space-x-1">
                        {(adminUser ? adminMenuItems : menuItems).map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`flex-1 px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                                        currentView === item.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
