import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Building, Mail, Phone, DollarSign, Calendar, User, Briefcase } from 'lucide-react';
import apiService from '../services/api';
import ProjectForm from './ProjectForm';

const ProjectList = ({ isAdmin, onNewData }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProjects: 0,
        projectsPerPage: 10
    });
    const [showForm, setShowForm] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const statuses = ['Active', 'Inactive', 'On Bench', 'Project Completed', 'Terminated'];

    useEffect(() => {
        fetchProjects();
    }, [pagination.currentPage, filters, searchTerm]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.currentPage,
                limit: pagination.projectsPerPage,
                ...filters
            };

            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await apiService.getProjects(params);
            setProjects(response.data);
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    const handleAddProject = () => {
        setSelectedProject(null);
        setShowForm(true);
    };

    const handleEditProject = (project) => {
        setSelectedProject(project);
        setShowForm(true);
    };

    const handleDeleteProject = async (project) => {
        if (window.confirm(`Are you sure you want to delete ${project.consultantName}'s project?`)) {
            try {
                await apiService.deleteProject(project._id);
                fetchProjects();
                onNewData(`Project for ${project.consultantName} deleted`);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSaveProject = async (projectData) => {
        try {
            setFormLoading(true);
            
            if (selectedProject) {
                await apiService.updateProject(selectedProject._id, projectData);
                onNewData(`Project for ${projectData.consultantName} updated`);
            } else {
                await apiService.createProject(projectData);
                onNewData(`Project for ${projectData.consultantName} created`);
            }
            
            setShowForm(false);
            setSelectedProject(null);
            fetchProjects();
        } catch (err) {
            setError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'bg-green-100 text-green-800',
            'Inactive': 'bg-yellow-100 text-yellow-800',
            'On Bench': 'bg-blue-100 text-blue-800',
            'Project Completed': 'bg-purple-100 text-purple-800',
            'Terminated': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getWorkAuthColor = (auth) => {
        const colors = {
            'H1B': 'bg-blue-100 text-blue-800',
            'Green Card': 'bg-green-100 text-green-800',
            'US Citizen': 'bg-purple-100 text-purple-800',
            'OPT': 'bg-yellow-100 text-yellow-800',
            'CPT': 'bg-orange-100 text-orange-800',
            'Other': 'bg-gray-100 text-gray-800'
        };
        return colors[auth] || 'bg-gray-100 text-gray-800';
    };

    if (showForm) {
        return (
            <ProjectForm
                project={selectedProject}
                onSave={handleSaveProject}
                onCancel={() => {
                    setShowForm(false);
                    setSelectedProject(null);
                }}
                isLoading={formLoading}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                    
                    {isAdmin && (
                        <button
                            onClick={handleAddProject}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Project
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Statuses</option>
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
                            <div className="h-4 bg-slate-700 rounded mb-2"></div>
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                    <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
                    <p className="text-slate-400 mb-6">
                        {searchTerm || filters.status
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first project'
                        }
                    </p>
                    {isAdmin && !searchTerm && !filters.status && (
                        <button
                            onClick={handleAddProject}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Project
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Consultant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <DollarSign className="w-4 h-4 inline mr-1" />
                                            Rate
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Work Auth
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            End Client
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            DOJ
                                        </th>
                                        {isAdmin && (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <User className="w-4 h-4 inline mr-1" />
                                                    Account Manager
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <Briefcase className="w-4 h-4 inline mr-1" />
                                                    Recruiter
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <Mail className="w-4 h-4 inline mr-1" />
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {projects.map((project) => (
                                        <tr key={project._id} className="hover:bg-slate-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {project.consultantName.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">
                                                            {project.consultantName}
                                                        </div>
                                                        <div className="text-sm text-slate-400">
                                                            {project.accountManager}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        {project.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {project.contactNo}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white font-medium">
                                                    ${project.rate}/hr
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkAuthColor(project.workAuthorization)}`}>
                                                    {project.workAuthorization}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{project.endClient}</div>
                                                <div className="text-xs text-slate-400">{project.recruiter}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {new Date(project.dateOfJoining).toLocaleDateString()}
                                            </td>
                                            {isAdmin && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white">{project.accountManager}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white">{project.recruiter}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white">{project.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditProject(project)}
                                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                                title="Edit project"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProject(project)}
                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                title="Delete project"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                                Showing {((pagination.currentPage - 1) * pagination.projectsPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.projectsPerPage, pagination.totalProjects)} of{' '}
                                {pagination.totalProjects} projects
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                <div className="flex items-center gap-1">
                                    {[...Array(pagination.totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handlePageChange(i + 1)}
                                            className={`px-3 py-1 rounded-lg transition-colors ${
                                                pagination.currentPage === i + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectList;
