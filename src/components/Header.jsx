import React, { useState, useEffect } from 'react'
import { Search, Bell, Settings, LogOut, User } from 'lucide-react'

const Header = ({ onSearch = () => {}, hasNewData = false, notificationMessage = '', onClearNotifications = () => {}, adminUser = null, loginAdmin = () => {}, logoutAdmin = () => {} }) => {
  const [searchInput, setSearchInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ name: '', password: '' })
  const [showToast, setShowToast] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchInput)
  }

  const menuItems = [
    { icon: User, label: 'Profile', action: 'profile' },
    { icon: Settings, label: 'Settings', action: 'settings' },
    { icon: LogOut, label: 'Logout', action: 'logout' },
  ]

  const initials = (name) => (name || 'SI').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()

  const submitLogin = (e) => {
    e.preventDefault()
    loginAdmin(loginForm)
    setShowLogin(false)
    setShowDropdown(false)
    setLoginForm({ name: '', password: '' })
  }

  useEffect(() => {
    if (notificationMessage) {
      setShowToast(true)
      const t = setTimeout(() => {
        setShowToast(false)
        if (typeof onClearNotifications === 'function') onClearNotifications()
      }, 3000)
      return () => clearTimeout(t)
    }
    return undefined
  }, [notificationMessage, onClearNotifications])

  return (
    <header className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg border-b border-slate-700">
      {/* Toast popup */}
      {showToast && notificationMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded shadow-lg border border-slate-700">
          {notificationMessage}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-cyan-500 rounded-lg blur opacity-75 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative px-4 py-2 bg-slate-900 rounded-lg">
                <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">TEKACCEL</span>
              </div>
            </div>
          </div>

          {/* Search Bar Section */}
          <div className="flex-1 max-w-sm mx-6">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value); onSearch(e.target.value) }}
                  placeholder="Search employees, departments..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:bg-slate-600"
                />
              </div>
            </form>
          </div>

          {/* Right Side Icons & Admin Section */}
          <div className="flex items-center gap-6">
            {/* Notification Bell */}
            <button type="button" onClick={() => onClearNotifications()} aria-label="Notifications" className="p-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200 relative group">
              <Bell className="h-5 w-5" />
              {/* indicator: green for admin, blue for normal user */}
              <span className={`absolute top-1 right-1 h-2 w-2 rounded-full ${adminUser ? 'bg-emerald-500' : 'bg-blue-500'} ${hasNewData ? 'animate-pulse ring-2 ring-white/20' : ''}`}></span>
              <div className="absolute -bottom-10 -right-5 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {hasNewData ? (notificationMessage || (adminUser ? 'Admin activity' : 'Activity')) : (adminUser ? 'Signed in as admin' : 'Signed in as user')}
              </div>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-600"></div>

            {/* Admin Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
                aria-haspopup="true"
                aria-expanded={showDropdown}
              >
                {/* Admin Avatar or Sign In */}
                <div className="h-8 w-8 rounded-full bg-linear-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-sm text-white">
                  {adminUser ? initials(adminUser.name) : 'SI'}
                </div>
                <div className="hidden sm:block">
                  {adminUser ? (
                    <>
                      <p className="text-sm font-semibold">{adminUser.name}</p>
                      <p className="text-xs text-blue-100">Administrator</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold">Sign In</p>
                      <p className="text-xs text-blue-100">Guest</p>
                    </>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div role="menu" className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-semibold text-white">{adminUser ? 'Admin Panel' : 'Account'}</p>
                    <p className="text-xs text-slate-400">{adminUser ? adminUser.name : 'Not signed in'}</p>
                  </div>
                  <div className="py-2">
                    {adminUser ? (
                      <>
                        {menuItems.map((item, index) => {
                          const Icon = item.icon
                          return (
                            <button
                              type="button"
                              key={index}
                              onClick={() => {
                                console.log(`Action: ${item.action}`)
                                setShowDropdown(false)
                              }}
                              className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm">{item.label}</span>
                            </button>
                          )
                        })}
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setShowLogin(true); setShowDropdown(false) }} className="w-full px-4 py-2.5 flex items-center gap-3 text-slate-300 hover:bg-slate-700 hover:text-white">Sign in</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {adminUser && (
              <button type="button" onClick={() => { logoutAdmin(); setShowDropdown(false) }} className="px-3 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-500">Logout</button>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={submitLogin} className="w-full max-w-sm bg-slate-900 rounded-md p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-3">Admin Login</h3>
            <input value={loginForm.name} onChange={(e)=>setLoginForm(f=>({...f,name:e.target.value}))} placeholder="Name" className="w-full px-3 py-2 rounded bg-slate-800 text-white mb-2" />
            <input type="password" value={loginForm.password} onChange={(e)=>setLoginForm(f=>({...f,password:e.target.value}))} placeholder="Password" className="w-full px-3 py-2 rounded bg-slate-800 text-white mb-3" />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={()=>setShowLogin(false)} className="px-3 py-1 rounded bg-slate-700 text-slate-200">Cancel</button>
              <button type="submit" className="px-3 py-1 rounded bg-emerald-600 text-white">Login</button>
            </div>
          </form>
        </div>
      )}

    </header>
  )
}

export default Header