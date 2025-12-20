import React, { useState, useEffect } from 'react'
import { 
  initDB, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  getAllEmployees, 
  searchEmployees 
} from '../services/database'
import EmployeeActions from './EmployeeActions'

const formatCurrency = (value, currency = 'USD') => {
  try {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  } catch (e) {
    return `${value} ${currency}`
  }
}

const StatusPill = ({ status }) => {
  const base = 'px-2 py-0.5 rounded-full text-xs font-medium'
  if (status === 'Active') return <span className={`${base} bg-emerald-600 text-emerald-50`}>{status}</span>
  if (status === 'On Leave') return <span className={`${base} bg-amber-500 text-amber-900`}>{status}</span>
  return <span className={`${base} bg-slate-700 text-slate-200`}>{status}</span>
}

const Employee = ({ searchTerm = '', onNewData = () => {}, isAdmin = false }) => {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState([])

  // Initialize database and load data
  useEffect(() => {
    const init = async () => {
      try {
        await initDB()
        const employees = await getAllEmployees()
        setData(employees)
      } catch (error) {
        console.error('Failed to initialize database', error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const USD_TO_INR = 83
  const convertSalary = (amount, from = 'USD', to = 'USD') => {
    if (from === to) return amount
    if (from === 'USD' && to === 'INR') return amount * USD_TO_INR
    if (from === 'INR' && to === 'USD') return amount / USD_TO_INR
    return amount
  }

  // Search employees when searchTerm changes
  const [filtered, setFiltered] = useState([])
  
  useEffect(() => {
    const search = async () => {
      if (isLoading) return
      try {
        const results = await searchEmployees(searchTerm)
        setFiltered(results)
        setPage(1) // Reset to first page on new search
      } catch (error) {
        console.error('Error searching employees', error)
      }
    }
    search()
  }, [searchTerm, data, isLoading])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => setPage(1), [searchTerm])
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageItems = filtered.slice(startIdx, endIdx)

  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  const handleDelete = async (emp) => {
    const ok = window.confirm(`Delete ${emp.name}? This cannot be undone.`)
    if (!ok) return
    
    try {
      await deleteEmployee(emp.id)
      setData(prev => prev.filter(x => x.id !== emp.id))
      if (isAdmin && typeof onNewData === 'function') onNewData(`Deleted ${emp.name}`)
    } catch (error) {
      console.error('Error deleting employee', error)
      alert('Failed to delete employee. Please try again.')
    }
  }

  // EDIT: open modal with pre-filled form to edit full employee
  const [showEdit, setShowEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const handleEdit = (emp) => {
    setEditingId(emp.id)
    setEditForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      rate: emp.rate || '',
      workAuthorization: emp.workAuthorization || 'H1B',
      doj: emp.doj || new Date().toISOString().slice(0,10),
      status: emp.status || 'Active',
      endClient: emp.endClient || '',
      projectsCompleted: emp.projectsCompleted?.toString() || '0',
      accountManager: emp.accountManager || '',
      recruiter: emp.recruiter || '',
      currency: emp.currency || displayCurrency
    })
    setShowEdit(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm?.name) return alert('Name is required')
    
    const updatedEmployee = {
      id: editingId,
      name: editForm.name,
      email: editForm.email || '',
      phone: editForm.phone || '',
      rate: Number(editForm.rate) || 0,
      workAuthorization: editForm.workAuthorization || 'H1B',
      doj: editForm.doj,
      status: editForm.status || 'Active',
      endClient: editForm.endClient || '',
      projectsCompleted: parseInt(editForm.projectsCompleted) || 0,
      accountManager: editForm.accountManager || '',
      recruiter: editForm.recruiter || '',
      currency: editForm.currency || displayCurrency
    }
    
    try {
      await updateEmployee(updatedEmployee)
      setData(prev => prev.map(emp => emp.id === editingId ? updatedEmployee : emp))
      setShowEdit(false)
      setEditingId(null)
      setEditForm(null)
      if (isAdmin && typeof onNewData === 'function') onNewData(`Updated ${editForm.name}`)
    } catch (error) {
      console.error('Error updating employee', error)
      alert('Failed to update employee. Please try again.')
    }
  }

  const exportCsv = () => {
    const headers = [
      'ID', 'Consultant Name', 'Email', 'Contact No.', 'Rate', 
      'Work Authorization', 'DOJ', 'Status', 'End Client', 
      'Projects Completed', 'Sr. Account Manager', 'Recruiter', 'Currency'
    ]
    
    const esc = (v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    
    const rows = data.map((emp) => {
      const rowData = [
        emp.id,
        emp.name,
        emp.email,
        emp.phone,
        emp.rate,
        emp.workAuthorization,
        emp.doj,
        emp.status,
        emp.endClient,
        emp.projectsCompleted,
        emp.accountManager,
        emp.recruiter,
        emp.currency || 'USD'
      ]
      return rowData.map(esc).join(',')
    })
    
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Add employee modal state & handlers
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rate: '',
    workAuthorization: '',
    doj: new Date().toISOString().slice(0, 10),
    status: 'Active',
    endClient: '',
    projectsCompleted: '0',
    accountManager: '',
    recruiter: '',
    currency: displayCurrency
  })

  const openAdd = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      rate: '',
      workAuthorization: 'H1B',
      doj: new Date().toISOString().slice(0, 10),
      status: 'Active',
      endClient: '',
      projectsCompleted: '0',
      accountManager: '',
      recruiter: '',
      currency: displayCurrency
    })
    setShowAdd(true)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) return alert('Name is required')
    
    const newEmp = {
      id: Date.now(), // Use timestamp as ID for better uniqueness
      name: form.name,
      email: form.email || '',
      phone: form.phone || '',
      rate: Number(form.rate) || 0,
      workAuthorization: form.workAuthorization || 'H1B',
      doj: form.doj,
      status: form.status || 'Active',
      endClient: form.endClient || '',
      projectsCompleted: parseInt(form.projectsCompleted) || 0,
      accountManager: form.accountManager || '',
      recruiter: form.recruiter || '',
      currency: form.currency || displayCurrency
    }
    
    try {
      await addEmployee(newEmp)
      setData(prev => [newEmp, ...prev])
      setShowAdd(false)
      if (isAdmin && typeof onNewData === 'function') onNewData(`Added ${newEmp.name}`)
    } catch (error) {
      console.error('Error adding employee', error)
      alert('Failed to add employee. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <section className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="flex items-center justify-between gap-3 mt-4">
        <h2 className="text-xl font-semibold text-slate-200">Employee Directory</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <label className="text-slate-300">Currency:</label>
            <select 
              value={displayCurrency} 
              onChange={(e) => setDisplayCurrency(e.target.value)} 
              className="px-2 py-1 rounded bg-slate-800 text-white border border-slate-600"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openAdd}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              + Add Employee
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="px-4 py-2 rounded-md bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="mt-6 bg-slate-900 rounded-lg shadow-md border border-slate-700 overflow-hidden">
        {/* Add Employee Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <form onSubmit={handleAddSubmit} className="w-full max-w-lg bg-slate-900 rounded-md p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Add Employee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="email" value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.phone} onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="number" value={form.rate} onChange={(e)=>setForm(f=>({...f,rate:e.target.value}))} placeholder="Hourly Rate" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={form.workAuthorization} onChange={(e)=>setForm(f=>({...f,workAuthorization:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="H1B">H1B</option>
                  <option value="Green Card">Green Card</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="L1 Visa">L1 Visa</option>
                </select>
                <input type="date" value={form.doj} onChange={(e)=>setForm(f=>({...f,doj:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={form.status} onChange={(e)=>setForm(f=>({...f,status:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
                </select>
                <input value={form.endClient} onChange={(e)=>setForm(f=>({...f,endClient:e.target.value}))} placeholder="End Client" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="number" value={form.projectsCompleted} onChange={(e)=>setForm(f=>({...f,projectsCompleted:e.target.value}))} placeholder="Projects Completed" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.accountManager} onChange={(e)=>setForm(f=>({...f,accountManager:e.target.value}))} placeholder="Account Manager" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.recruiter} onChange={(e)=>setForm(f=>({...f,recruiter:e.target.value}))} placeholder="Recruiter" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={form.currency} onChange={(e)=>setForm(f=>({...f,currency:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={()=>setShowAdd(false)} className="px-3 py-1 rounded bg-slate-700 text-slate-200">Cancel</button>
                <button type="submit" className="px-3 py-1 rounded bg-emerald-600 text-white">Add</button>
              </div>
            </form>
          </div>
        )}
        {showEdit && editForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <form onSubmit={handleEditSubmit} className="w-full max-w-lg bg-slate-900 rounded-md p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Edit Employee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required value={editForm.name} onChange={(e)=>setEditForm(f=>({...f,name:e.target.value}))} placeholder="Full name" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="email" value={editForm.email} onChange={(e)=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="Email" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.phone} onChange={(e)=>setEditForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="number" value={editForm.rate} onChange={(e)=>setEditForm(f=>({...f,rate:e.target.value}))} placeholder="Hourly Rate" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={editForm.workAuthorization} onChange={(e)=>setEditForm(f=>({...f,workAuthorization:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="H1B">H1B</option>
                  <option value="Green Card">Green Card</option>
                  <option value="US Citizen">US Citizen</option>
                  <option value="L1 Visa">L1 Visa</option>
                </select>
                <input type="date" value={editForm.doj} onChange={(e)=>setEditForm(f=>({...f,doj:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={editForm.status} onChange={(e)=>setEditForm(f=>({...f,status:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
                </select>
                <input value={editForm.endClient} onChange={(e)=>setEditForm(f=>({...f,endClient:e.target.value}))} placeholder="End Client" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="number" value={editForm.projectsCompleted} onChange={(e)=>setEditForm(f=>({...f,projectsCompleted:e.target.value}))} placeholder="Projects Completed" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.accountManager} onChange={(e)=>setEditForm(f=>({...f,accountManager:e.target.value}))} placeholder="Account Manager" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.recruiter} onChange={(e)=>setEditForm(f=>({...f,recruiter:e.target.value}))} placeholder="Recruiter" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={editForm.currency} onChange={(e)=>setEditForm(f=>({...f,currency:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button type="button" onClick={()=>{setShowEdit(false); setEditForm(null); setEditingId(null)}} className="px-3 py-1 rounded bg-slate-700 text-slate-200">Cancel</button>
                <button type="submit" className="px-3 py-1 rounded bg-amber-600 text-white">Save</button>
              </div>
            </form>
          </div>
        )}
        <div className="overflow-x-auto">
          <table style={{ minWidth: '1100px' }} className="w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sr.no</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultant Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Work Authorization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">DOJ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">End Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sr. Account Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recruiter</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {pageItems.map((emp, idx) => (
                <tr key={emp.id} className={`${(startIdx + idx) % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'} hover:bg-slate-800`}>
                  <td className="px-4 py-3 text-sm text-center text-slate-200">{startIdx + idx + 1}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-slate-400">ID: {emp.id}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 text-right">
                    {formatCurrency(emp.rate || 0, emp.currency || 'USD')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.workAuthorization || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">
                    {emp.doj ? new Date(emp.doj).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusPill status={emp.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.endClient || '-'}</td>
                  <td className="px-4 py-3 text-sm text-center text-slate-200">
                    {emp.projectsCompleted || '0'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.accountManager || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.recruiter || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <EmployeeActions emp={emp} onEdit={handleEdit} onDelete={handleDelete} isAdmin={isAdmin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-800 text-sm text-slate-400 flex items-center justify-between">
          <div>Showing {startIdx + 1} — {endIdx} of {total} employees</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevPage}
              disabled={page === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium ${page === 1 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
              Prev
            </button>
            <div className="text-sm text-slate-300">Page {page} / {totalPages}</div>
            <button
              type="button"
              onClick={nextPage}
              disabled={page === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium ${page === totalPages ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}>
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Employee
