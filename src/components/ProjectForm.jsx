import React, { useState, useEffect } from 'react';
import { Plus, X, Save, User, Mail, Phone, DollarSign, Calendar, Building, AlertCircle } from 'lucide-react';

const ProjectForm = ({ project, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        consultantName: '',
        email: '',
        contactNo: '',
        rate: '',
        margin: '',
        workAuthorization: '',
        dateOfJoining: '',
        status: 'Active',
        endClient: '',
        projectCompleted: false,
        accountManager: '',
        recruiter: ''
    });

    const [errors, setErrors] = useState({});

    const workAuthorizations = ['H1B', 'Green Card', 'US Citizen', 'OPT', 'CPT', 'Other'];
    const statuses = ['Active', 'Inactive', 'On Bench', 'Project Completed', 'Terminated'];

    useEffect(() => {
        if (project) {
            setFormData({
                ...project,
                rate: project.rate || '',
                margin: project.margin || '',
                dateOfJoining: project.dateOfJoining ? new Date(project.dateOfJoining).toISOString().split('T')[0] : ''
            });
        }
    }, [project]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.consultantName.trim()) newErrors.consultantName = 'Consultant name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.contactNo.trim()) newErrors.contactNo = 'Contact number is required';
        if (!formData.rate || parseFloat(formData.rate) < 0 || parseFloat(formData.rate) > 150) newErrors.rate = 'Rate must be between 0 and 150';
        if (!formData.margin || parseFloat(formData.margin) < 0 || parseFloat(formData.margin) > 25) newErrors.margin = 'Margin must be between 0 and 25';
        if (!formData.workAuthorization) newErrors.workAuthorization = 'Work authorization is required';
        if (!formData.dateOfJoining) newErrors.dateOfJoining = 'Date of joining is required';
        if (!formData.endClient.trim()) newErrors.endClient = 'End client is required';
        if (!formData.accountManager.trim()) newErrors.accountManager = 'Account manager is required';
        if (!formData.recruiter.trim()) newErrors.recruiter = 'Recruiter is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            const submissionData = {
                ...formData,
                rate: parseFloat(formData.rate),
                margin: parseFloat(formData.margin)
            };

            onSave(submissionData);
        }
    };

    const handleInputChange = (field, value) => {
        // Special handling for rate field to enforce 0-150 range (including floats)
        if (field === 'rate') {
            // Allow empty value or valid float numbers between 0 and 150
            if (value === '' || value === '-') {
                setFormData(prev => ({ ...prev, [field]: value }));
                if (errors[field]) {
                    setErrors(prev => ({ ...prev, [field]: '' }));
                }
            } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 150) {
                    setFormData(prev => ({ ...prev, [field]: value }));
                    if (errors[field]) {
                        setErrors(prev => ({ ...prev, [field]: '' }));
                    }
                }
            }
        } else if (field === 'margin') {
            // Special handling for margin field to enforce 0-25 range (including floats)
            if (value === '' || value === '-') {
                setFormData(prev => ({ ...prev, [field]: value }));
                if (errors[field]) {
                    setErrors(prev => ({ ...prev, [field]: '' }));
                }
            } else {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 25) {
                    setFormData(prev => ({ ...prev, [field]: value }));
                    if (errors[field]) {
                        setErrors(prev => ({ ...prev, [field]: '' }));
                    }
                }
            }
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {project ? 'Edit Project' : 'Add New Project'}
                        <Building className="w-6 h-6" />
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Consultant Name *
                            </label>
                            <input
                                type="text"
                                value={formData.consultantName}
                                onChange={(e) => handleInputChange('consultantName', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.consultantName ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="John Doe"
                            />
                            {errors.consultantName && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.consultantName}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Email *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.email ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="john.doe@company.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Contact Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.contactNo}
                                onChange={(e) => handleInputChange('contactNo', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.contactNo ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="+1 (555) 123-4567"
                            />
                            {errors.contactNo && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.contactNo}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Rate ($/hr) * (0-150)
                            </label>
                            <input
                                type="number"
                                value={formData.rate}
                                onChange={(e) => handleInputChange('rate', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.rate ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="0-150 (e.g., 75.5)"
                                min="0"
                                max="150"
                                step="0.01"
                            />
                            {errors.rate && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.rate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Margin (%) * (0-25)
                            </label>
                            <input
                                type="number"
                                value={formData.margin}
                                onChange={(e) => handleInputChange('margin', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.margin ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="0-25 (e.g., 15.5)"
                                min="0"
                                max="25"
                                step="0.01"
                            />
                            {errors.margin && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.margin}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Work Authorization *
                            </label>
                            <select
                                value={formData.workAuthorization}
                                onChange={(e) => handleInputChange('workAuthorization', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.workAuthorization ? 'border-red-500' : 'border-slate-600'
                                }`}
                            >
                                <option value="">Select Work Authorization</option>
                                {workAuthorizations.map(auth => (
                                    <option key={auth} value={auth}>{auth}</option>
                                ))}
                            </select>
                            {errors.workAuthorization && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.workAuthorization}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Date of Joining *
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfJoining}
                                onChange={(e) => handleInputChange('dateOfJoining', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.dateOfJoining ? 'border-red-500' : 'border-slate-600'
                                }`}
                            />
                            {errors.dateOfJoining && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.dateOfJoining}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                End Client *
                            </label>
                            <input
                                type="text"
                                value={formData.endClient}
                                onChange={(e) => handleInputChange('endClient', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.endClient ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="Client Company Name"
                            />
                            {errors.endClient && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.endClient}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Account Manager *
                            </label>
                            <input
                                type="text"
                                value={formData.accountManager}
                                onChange={(e) => handleInputChange('accountManager', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.accountManager ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="Manager Name"
                            />
                            {errors.accountManager && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.accountManager}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Recruiter *
                            </label>
                            <input
                                type="text"
                                value={formData.recruiter}
                                onChange={(e) => handleInputChange('recruiter', e.target.value)}
                                className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.recruiter ? 'border-red-500' : 'border-slate-600'
                                }`}
                                placeholder="Recruiter Name"
                            />
                            {errors.recruiter && (
                                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.recruiter}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="projectCompleted"
                                checked={formData.projectCompleted}
                                onChange={(e) => handleInputChange('projectCompleted', e.target.checked)}
                                className="w-4 h-4 bg-slate-700 border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="projectCompleted" className="ml-2 text-sm text-slate-300">
                                Project Completed
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                'Saving...'
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {project ? 'Update Project' : 'Create Project'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectForm;
