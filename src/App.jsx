import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Employee from './components/Employee'

const App = () => {
  const [searchTerm, setSearchTerm] = useState('')
  // Admin account state — fixed credentials (no create flow)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [hasNewData, setHasNewData] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')

  const ADMIN_NAME = 'admin@1234'
  const ADMIN_PASSWORD = 'admin@password'

  const loginAdmin = ({ name, password }) => {
    if (name === ADMIN_NAME && password === ADMIN_PASSWORD) {
      setAdminUser({ name })
      setIsAdmin(true)
      setHasNewData(true)
      setNotificationMessage('Admin signed in')
      try {
        window.localStorage.setItem('adminSignedIn', 'true')
        window.localStorage.setItem('adminUser', name)
      } catch (e) {
        console.warn('Failed to persist admin sign-in', e)
      }
    } else {
      alert('Invalid credentials')
    }
  }

  const logoutAdmin = () => {
    setAdminUser(null)
    setIsAdmin(false)
    try {
      window.localStorage.removeItem('adminSignedIn')
      window.localStorage.removeItem('adminUser')
    } catch (e) {
      console.warn('Failed to clear admin sign-in', e)
    }
  }

  useEffect(() => {
    try {
      const signed = window.localStorage.getItem('adminSignedIn') === 'true'
      const name = window.localStorage.getItem('adminUser')
      if (signed && name) {
        setAdminUser({ name })
        setIsAdmin(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const clearNotifications = () => {
    setHasNewData(false)
    setNotificationMessage('')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header onSearch={setSearchTerm} hasNewData={hasNewData} notificationMessage={notificationMessage} onClearNotifications={clearNotifications} adminUser={adminUser} loginAdmin={loginAdmin} logoutAdmin={logoutAdmin} />
      <main className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to E-Staff</h1>
          <p className="text-slate-400 text-lg">Employee Management System</p>
        </div>

        <Employee searchTerm={searchTerm} onNewData={(msg) => { setHasNewData(true); setNotificationMessage(msg || 'Admin activity') }} isAdmin={isAdmin} />
      </main>
    </div>
  )
}

export default App