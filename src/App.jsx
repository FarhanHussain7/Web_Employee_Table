import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import EmployeeList from './components/EmployeeList'
import ProjectList from './components/ProjectList'
import Dashboard from './components/Dashboard'
import Navigation from './components/Navigation'
import Login from './components/Login'
import AdminNotifications from './components/AdminNotifications'
import UserSessionManagement from './components/UserSessionManagement'
import SessionStatus from './components/SessionStatus'
import authService from './services/authService'

const App = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasNewData, setHasNewData] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [currentView, setCurrentView] = useState('dashboard')
  const [pendingRegistrations, setPendingRegistrations] = useState(0)

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      setCurrentUser(authService.getUser())
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (user, token) => {
    setCurrentUser(user)
    setIsAuthenticated(true)
    setHasNewData(true)
    setNotificationMessage(`Welcome back, ${user.firstName}!`)
    
    // Refresh user data to get latest profile picture and other info
    try {
      const freshUserData = await authService.refreshCurrentUser()
      if (freshUserData) {
        setCurrentUser(freshUserData)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  const updateUser = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setCurrentView('dashboard')
  }

  const clearNotifications = () => {
    setHasNewData(false)
    setNotificationMessage('')
  }

  const handleNewData = (message) => {
    setHasNewData(true)
    setNotificationMessage(message || 'Activity completed')
  }

  const fetchPendingRegistrations = async () => {
    if (currentUser?.role === 'admin') {
      try {
        const response = await authService.getPendingUsers()
        setPendingRegistrations(response.data?.length || 0)
      } catch (error) {
        console.error('Error fetching pending registrations:', error)
        setPendingRegistrations(0)
      }
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchPendingRegistrations()
      // Set up periodic polling for new registrations
      const interval = setInterval(fetchPendingRegistrations, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    } else {
      setPendingRegistrations(0)
    }
  }, [currentUser])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <Dashboard />
            {currentUser?.role === 'admin' && <AdminNotifications onUserApproved={fetchPendingRegistrations} />}
          </div>
        )
      case 'employees':
        return (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Employee Management</h1>
              <p className="text-slate-400">Manage your employee database</p>
            </div>
            <EmployeeList 
              isAdmin={currentUser?.role === 'admin'} 
              onNewData={handleNewData}
            />
          </div>
        )
      case 'projects':
        return (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Project Management</h1>
              <p className="text-slate-400">Manage project details and consultant information</p>
            </div>
            <ProjectList 
              isAdmin={currentUser?.role === 'admin'} 
              onNewData={handleNewData}
            />
          </div>
        )
      case 'user-sessions':
        if (currentUser?.role !== 'admin') {
          return (
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
              <p className="text-slate-400">You don't have permission to access this page.</p>
            </div>
          )
        }
        return (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">User Session Management</h1>
              <p className="text-slate-400">Manage user sessions and access</p>
            </div>
            <UserSessionManagement />
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            <Dashboard />
            {currentUser?.role === 'admin' && <AdminNotifications onUserApproved={fetchPendingRegistrations} />}
          </div>
        )
    }
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header 
        hasNewData={hasNewData} 
        notificationMessage={notificationMessage} 
        onClearNotifications={clearNotifications} 
        adminUser={currentUser}
        loginAdmin={updateUser}
        logoutAdmin={handleLogout} 
        pendingRegistrations={pendingRegistrations}
      />
      
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        adminUser={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {renderCurrentView()}
      </main>
      
      {isAuthenticated && <SessionStatus />}
    </div>
  )
}

export default App