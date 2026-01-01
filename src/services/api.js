import authService from './authService.js';

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(authService.getToken() && authService.getAuthHeaders())
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle token expiry with automatic refresh
                if (response.status === 401 && 
                    !endpoint.includes('/auth/login') && 
                    !endpoint.includes('/auth/register') &&
                    !endpoint.includes('/auth/refresh-token')) {
                    
                    // Try to refresh the token
                    try {
                        await authService.refreshToken();
                        // Retry the original request with new token
                        const newConfig = {
                            ...config,
                            headers: {
                                ...config.headers,
                                ...authService.getAuthHeaders()
                            }
                        };
                        const retryResponse = await fetch(url, newConfig);
                        
                        if (!retryResponse.ok) {
                            const retryErrorData = await retryResponse.json().catch(() => ({}));
                            throw new Error(retryErrorData.message || `HTTP error! status: ${retryResponse.status}`);
                        }
                        
                        return await retryResponse.json();
                    } catch (refreshError) {
                        // Refresh failed, logout user
                        authService.logout();
                        window.location.href = '/login';
                        throw new Error('Session expired. Please login again.');
                    }
                }
                
                // Handle other authentication errors
                if (response.status === 403 && 
                    !endpoint.includes('/auth/login') && 
                    !endpoint.includes('/auth/register')) {
                    authService.logout();
                    window.location.href = '/login';
                    throw new Error('Access denied. Please login again.');
                }
                
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Employee endpoints
    async getEmployees(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/employees?${queryString}` : '/employees';
        return this.request(endpoint);
    }

    async getEmployeeById(id) {
        return this.request(`/employees/${id}`);
    }

    async createEmployee(employeeData) {
        return this.request('/employees', {
            method: 'POST',
            body: JSON.stringify(employeeData),
        });
    }

    async updateEmployee(id, employeeData) {
        return this.request(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData),
        });
    }

    async deleteEmployee(id) {
        return this.request(`/employees/${id}`, {
            method: 'DELETE',
        });
    }

    async getEmployeeStats() {
        return this.request('/employees/stats');
    }

    async searchEmployees(searchTerm, filters = {}) {
        const params = { search: searchTerm, ...filters };
        return this.getEmployees(params);
    }

    // Project endpoints
    async getProjects(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/projects?${queryString}` : '/projects';
        return this.request(endpoint);
    }

    async getProjectById(id) {
        return this.request(`/projects/${id}`);
    }

    async createProject(projectData) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    }

    async updateProject(id, projectData) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        });
    }

    async deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        });
    }

    async getProjectStats() {
        return this.request('/projects/stats');
    }

    async searchProjects(searchTerm, filters = {}) {
        const params = { search: searchTerm, ...filters };
        return this.getProjects(params);
    }
}

export const apiService = new ApiService();
export default apiService;
