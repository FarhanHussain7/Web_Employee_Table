import apiService from './api.js';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.tokenExpiry = localStorage.getItem('tokenExpiry');
        this.refreshTokenTimeout = null;
        
        // Check token validity on initialization
        this.checkTokenValidity();
    }

    login(email, password) {
        return apiService.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }).then(response => {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
            
            // Set up auto-refresh and session timeout
            this.setupSessionManagement(response.data.expiresIn || 3600); // Default 1 hour
            
            return response;
        });
    }

    register(userData) {
        return apiService.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        // Clear refresh timeout
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
        }
        
        // Clear all session data
        this.removeToken();
        this.removeUser();
        this.removeTokenExpiry();
        
        // Call logout endpoint to invalidate server session
        apiService.request('/auth/logout', {
            method: 'POST'
        }).catch(() => {
            // Ignore errors during logout
        });
    }

    getCurrentUser() {
        return apiService.request('/auth/current-user');
    }

    getPendingUsers() {
        return apiService.request('/auth/pending-users');
    }

    approveUser(userId) {
        return apiService.request(`/auth/approve-user/${userId}`, {
            method: 'PUT'
        });
    }

    rejectUser(userId) {
        return apiService.request(`/auth/reject-user/${userId}`, {
            method: 'PUT'
        });
    }

    getAllUsers() {
        return apiService.request('/auth/users');
    }

    updateUserSession(userId, sessionData) {
        return apiService.request(`/auth/users/${userId}/session`, {
            method: 'PUT',
            body: JSON.stringify(sessionData)
        });
    }

    updateUserStatus(userId, status) {
        return apiService.request(`/auth/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    deleteUser(userId) {
        return apiService.request(`/auth/users/${userId}`, {
            method: 'DELETE'
        });
    }

    setToken(token, expiresIn = null) {
        this.token = token;
        localStorage.setItem('token', token);
        
        if (expiresIn) {
            const expiryTime = new Date().getTime() + (expiresIn * 1000);
            this.tokenExpiry = expiryTime;
            localStorage.setItem('tokenExpiry', expiryTime.toString());
        }
    }

    setUser(user) {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('token');
    }
    
    removeTokenExpiry() {
        this.tokenExpiry = null;
        localStorage.removeItem('tokenExpiry');
    }

    removeUser() {
        this.user = null;
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!this.token && !!this.user && !this.isTokenExpired();
    }

    isAdmin() {
        return this.user && this.user.role === 'admin';
    }

    isApproved() {
        return this.user && this.user.status === 'approved';
    }

    getToken() {
        // Check if token is expired before returning
        if (this.isTokenExpired()) {
            this.logout();
            return null;
        }
        return this.token;
    }

    getUser() {
        return this.user;
    }

    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`,
            'X-Session-Valid': 'true'
        };
    }
    
    // New session management methods
    isTokenExpired() {
        if (!this.tokenExpiry) {
            return false; // No expiry set, assume valid
        }
        return new Date().getTime() > this.tokenExpiry;
    }
    
    checkTokenValidity() {
        if (this.isTokenExpired()) {
            this.logout();
        }
    }
    
    setupSessionManagement(expiresIn) {
        // Clear existing timeout
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
        }
        
        // Set up warning 5 minutes before expiry
        const warningTime = (expiresIn - 300) * 1000; // 5 minutes before expiry
        this.refreshTokenTimeout = setTimeout(() => {
            this.showSessionWarning();
        }, warningTime);
        
        // Set up auto-logout at expiry
        const expiryTime = expiresIn * 1000;
        setTimeout(() => {
            this.logout();
            this.showSessionExpiredMessage();
        }, expiryTime);
    }
    
    showSessionWarning() {
        if (typeof window !== 'undefined') {
            // Show session expiry warning
            const warningDiv = document.createElement('div');
            warningDiv.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            warningDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span>Your session will expire in 5 minutes. Please save your work.</span>
                </div>
            `;
            document.body.appendChild(warningDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (warningDiv.parentNode) {
                    warningDiv.parentNode.removeChild(warningDiv);
                }
            }, 10000);
        }
    }
    
    showSessionExpiredMessage() {
        if (typeof window !== 'undefined') {
            // Show session expired message
            const messageDiv = document.createElement('div');
            messageDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            messageDiv.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <span>Your session has expired. Please login again.</span>
                </div>
            `;
            document.body.appendChild(messageDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 5000);
        }
    }
    
    // Refresh token method
    async refreshToken() {
        try {
            const response = await apiService.request('/auth/refresh-token', {
                method: 'POST'
            });
            
            this.setToken(response.data.token, response.data.expiresIn);
            this.setupSessionManagement(response.data.expiresIn || 3600);
            
            return response;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            throw error;
        }
    }
    
    // Get session info
    getSessionInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            isAdmin: this.isAdmin(),
            isApproved: this.isApproved(),
            user: this.getUser(),
            tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry) : null,
            timeUntilExpiry: this.tokenExpiry ? this.tokenExpiry - new Date().getTime() : null
        };
    }
}

export const authService = new AuthService();
export default authService;
