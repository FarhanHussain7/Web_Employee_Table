import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Users, Building, Mail, Phone, Calendar, DollarSign, MapPin, UserPlus, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import EmployeeForm from './EmployeeForm';

const EmployeeList = ({ isAdmin, onNewData }) => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        department: '',
        status: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalEmployees: 0,
        employeesPerPage: 10
    });
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const departments = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'IT', 'Management'];
    const statuses = ['Active', 'Inactive', 'On Leave', 'Terminated'];

    useEffect(() => {
        fetchEmployees();
    }, [pagination.currentPage, filters, searchTerm]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.currentPage,
                limit: pagination.employeesPerPage,
                ...filters
            };

            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await apiService.getEmployees(params);
            setEmployees(response.data);
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

    const handleAddEmployee = () => {
        setSelectedEmployee(null);
        setShowForm(true);
    };

    const handleEditEmployee = (employee) => {
        setSelectedEmployee(employee);
        setShowForm(true);
    };

    const handleDeleteEmployee = async (employee) => {
        if (window.confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
            try {
                await apiService.deleteEmployee(employee._id);
                fetchEmployees();
                onNewData(`Employee ${employee.firstName} ${employee.lastName} deleted`);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSaveEmployee = async (employeeData) => {
        try {
            setFormLoading(true);
            
            if (selectedEmployee) {
                await apiService.updateEmployee(selectedEmployee._id, employeeData);
                onNewData(`Employee ${employeeData.firstName} ${employeeData.lastName} updated`);
            } else {
                await apiService.createEmployee(employeeData);
                onNewData(`Employee ${employeeData.firstName} ${employeeData.lastName} created`);
            }
            
            setShowForm(false);
            setSelectedEmployee(null);
            fetchEmployees();
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
            'On Leave': 'bg-blue-100 text-blue-800',
            'Terminated': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (showForm) {
        return (
            <EmployeeForm
                employee={selectedEmployee}
                onSave={handleSaveEmployee}
                onCancel={() => {
                    setShowForm(false);
                    setSelectedEmployee(null);
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
                        placeholder="Search employees..."
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
                            onClick={handleAddEmployee}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Department
                            </label>
                            <select
                                value={filters.department}
                                onChange={(e) => handleFilterChange('department', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        
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
            ) : employees.length === 0 ? (
                <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
                    <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No employees found</h3>
                    <p className="text-slate-400 mb-6">
                        {searchTerm || filters.department || filters.status
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first employee'
                        }
                    </p>
                    {isAdmin && !searchTerm && !filters.department && !filters.status && (
                        <button
                            onClick={handleAddEmployee}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <Plus className="w-4 h-4" />
                            Add First Employee
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
                                            Employee
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <Mail className="w-4 h-4 inline mr-1" />
                                            Contact
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <Building className="w-4 h-4 inline mr-1" />
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            Start Date
                                        </th>
                                        {isAdmin && (
                                            <>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                                    Salary
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <Calendar className="w-4 h-4 inline mr-1" />
                                                    DOB
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <MapPin className="w-4 h-4 inline mr-1" />
                                                    Address
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                                    Emergency
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {employees.map((employee) => (
                                        <tr key={employee._id} className="hover:bg-slate-700 transition-colors">
                                            {/* Employee Column */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3">
                                                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">
                                                            {employee.firstName} {employee.lastName}
                                                        </div>
                                                        <div className="text-sm text-slate-400">
                                                            {employee.position}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3 text-slate-400" />
                                                        {employee.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {employee.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-white">{employee.department}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                                                    {employee.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {new Date(employee.startDate).toLocaleDateString()}
                                            </td>
                                            {isAdmin && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white font-medium">
                                                            ${employee.salary?.toLocaleString() || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                        {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white max-w-xs">
                                                            {employee.address ? (
                                                                <div className="space-y-1">
                                                                    <div>{employee.address.street}</div>
                                                                    <div>{employee.address.city}, {employee.address.state} {employee.address.zipCode}</div>
                                                                    <div>{employee.address.country}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">N/A</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-white max-w-xs">
                                                            {employee.emergencyContact ? (
                                                                <div className="space-y-1">
                                                                    <div className="font-medium">{employee.emergencyContact.name}</div>
                                                                    <div className="text-slate-400">{employee.emergencyContact.relationship}</div>
                                                                    <div className="text-slate-400">{employee.emergencyContact.phone}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400">N/A</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditEmployee(employee)}
                                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                                title="Edit employee"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEmployee(employee)}
                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                title="Delete employee"
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
                                Showing {((pagination.currentPage - 1) * pagination.employeesPerPage) + 1} to{' '}
                                {Math.min(pagination.currentPage * pagination.employeesPerPage, pagination.totalEmployees)} of{' '}
                                {pagination.totalEmployees} employees
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

export default EmployeeList;
