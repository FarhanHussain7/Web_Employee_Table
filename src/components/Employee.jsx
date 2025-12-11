import React, { useState, useEffect } from 'react'
import employees from '../data/employeeData.json'
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
  const pageSize = 6
  const [displayCurrency, setDisplayCurrency] = useState('USD')

  const loadData = () => {
    try {
      const raw = window.localStorage.getItem('employees')
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.warn('Failed to parse employees from localStorage', e)
    }
    // First run: save default JSON into localStorage so future runs persist
    try {
      // ensure each employee has a currency field (default USD)
      const seeded = employees.map((e) => ({ currency: 'USD', ...e }))
      window.localStorage.setItem('employees', JSON.stringify(seeded))
    } catch (e) {
      console.warn('Failed to write default employees to localStorage', e)
    }
    return employees
  }

  const [data, setData] = useState(loadData)

  const saveData = (next) => {
    try {
      window.localStorage.setItem('employees', JSON.stringify(next))
    } catch (e) {
      console.warn('Failed to save employees to localStorage', e)
    }
  }

  const USD_TO_INR = 83
  const convertSalary = (amount, from = 'USD', to = 'USD') => {
    if (from === to) return amount
    if (from === 'USD' && to === 'INR') return amount * USD_TO_INR
    if (from === 'INR' && to === 'USD') return amount / USD_TO_INR
    return amount
  }

  const term = searchTerm?.toString().trim().toLowerCase()
  const filtered = data.filter((emp) => {
    if (!term) return true
    return [emp.name, emp.position, emp.department, emp.email, emp.phone]
      .join(' ')
      .toLowerCase()
      .includes(term)
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => setPage(1), [term])
  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageItems = filtered.slice(startIdx, endIdx)

  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  const handleDelete = (emp) => {
    const ok = window.confirm(`Delete ${emp.name}? This cannot be undone.`)
    if (!ok) return
    setData((d) => {
      const next = d.filter((x) => x.id !== emp.id)
      saveData(next)
      if (isAdmin && typeof onNewData === 'function') onNewData(`Deleted ${emp.name}`)
      return next
    })
  }

  // EDIT: open modal with pre-filled form to edit full employee
  const [showEdit, setShowEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const handleEdit = (emp) => {
    setEditingId(emp.id)
    setEditForm({
      name: emp.name || '',
      position: emp.position || '',
      department: emp.department || '',
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || 'Active',
      joined: emp.joined || new Date().toISOString().slice(0,10),
      salary: emp.salary != null ? String(emp.salary) : '',
      currency: emp.currency || displayCurrency
    })
    setShowEdit(true)
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editForm?.name) return alert('Name is required')
    const next = data.map((x) => (x.id === editingId ? { ...x, name: editForm.name, position: editForm.position, department: editForm.department, email: editForm.email, phone: editForm.phone, status: editForm.status, joined: editForm.joined, salary: Number(editForm.salary) || 0, currency: editForm.currency || 'USD' } : x))
    setData(next)
    saveData(next)
    setShowEdit(false)
    setEditingId(null)
    setEditForm(null)
    if (isAdmin && typeof onNewData === 'function') onNewData(`Updated ${editForm.name}`)
  }

  const exportCsv = () => {
    const headers = ['id','name','position','department','email','phone','joined','salary','currency','status']
    const esc = (v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }
    const rows = data.map((emp) => {
      // export salary converted to current displayCurrency
      const from = emp.currency || 'USD'
      const to = displayCurrency || 'USD'
      const salaryVal = emp.salary != null ? convertSalary(Number(emp.salary), from, to) : ''
      const rowObj = { ...emp, salary: salaryVal, currency: to }
      return headers.map((h) => rowObj[h]).map(esc).join(',')
    })
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employeeData.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Add employee modal state & handlers
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    status: 'Active',
    joined: new Date().toISOString().slice(0, 10),
    salary: '',
    currency: displayCurrency
  })

  const openAdd = () => {
    setForm({ name: '', position: '', department: '', email: '', phone: '', status: 'Active', joined: new Date().toISOString().slice(0,10), salary: '', currency: displayCurrency })
    setShowAdd(true)
  }

  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!form.name) return alert('Name is required')
    const nextId = data.reduce((m, x) => Math.max(m, x.id), 0) + 1
    const newEmp = {
      id: nextId,
      name: form.name,
      position: form.position || 'Employee',
      department: form.department || 'General',
      email: form.email || '',
      phone: form.phone || '',
      status: form.status || 'Active',
      joined: form.joined,
      salary: Number(form.salary) || 0,
      currency: form.currency || displayCurrency
    }
    const next = [newEmp, ...data]
    setData(next)
    saveData(next)
    setShowAdd(false)
    if (isAdmin && typeof onNewData === 'function') onNewData(`Added ${newEmp.name}`)
  }

  return (
    <section className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12">
      <div className="flex items-center justify-end gap-3 mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <label className="text-slate-300">Currency:</label>
          <select value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)} className="px-2 py-1 rounded bg-slate-800 text-white">
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => openAdd()}
            className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-500"
          >
            Add Employee
          </button>
        )}
        <button
          type="button"
          onClick={exportCsv}
          className="px-3 py-1 rounded-md bg-slate-700 text-white text-sm hover:bg-slate-600"
        >
          Export CSV
        </button>
        
      </div>
      <div className="mt-6 bg-slate-900 rounded-lg shadow-md border border-slate-700 overflow-hidden">
        {/* Add Employee Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <form onSubmit={handleAddSubmit} className="w-full max-w-lg bg-slate-900 rounded-md p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Add Employee</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required value={form.name} onChange={(e)=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.position} onChange={(e)=>setForm(f=>({...f,position:e.target.value}))} placeholder="Position" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.department} onChange={(e)=>setForm(f=>({...f,department:e.target.value}))} placeholder="Department" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.email} onChange={(e)=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.phone} onChange={(e)=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="date" value={form.joined} onChange={(e)=>setForm(f=>({...f,joined:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={form.salary} onChange={(e)=>setForm(f=>({...f,salary:e.target.value}))} placeholder="Salary" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={form.currency} onChange={(e)=>setForm(f=>({...f,currency:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
                <select value={form.status} onChange={(e)=>setForm(f=>({...f,status:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
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
                <input value={editForm.position} onChange={(e)=>setEditForm(f=>({...f,position:e.target.value}))} placeholder="Position" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.department} onChange={(e)=>setEditForm(f=>({...f,department:e.target.value}))} placeholder="Department" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.email} onChange={(e)=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="Email" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.phone} onChange={(e)=>setEditForm(f=>({...f,phone:e.target.value}))} placeholder="Phone" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input type="date" value={editForm.joined} onChange={(e)=>setEditForm(f=>({...f,joined:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white" />
                <input value={editForm.salary} onChange={(e)=>setEditForm(f=>({...f,salary:e.target.value}))} placeholder="Salary" className="px-3 py-2 rounded bg-slate-800 text-white" />
                <select value={editForm.currency} onChange={(e)=>setEditForm(f=>({...f,currency:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
                <select value={editForm.status} onChange={(e)=>setEditForm(f=>({...f,status:e.target.value}))} className="px-3 py-2 rounded bg-slate-800 text-white">
                  <option>Active</option>
                  <option>On Leave</option>
                  <option>Inactive</option>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Position</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Salary</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {pageItems.map((emp, idx) => (
                <tr key={emp.id} className={`${(startIdx + idx) % 2 === 0 ? 'bg-slate-900' : 'bg-slate-950'} hover:bg-slate-800`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-linear-to-tr from-blue-500 to-cyan-400 flex items-center justify-center font-semibold text-white">
                        {emp.name.split(' ').map(n => n[0]).slice(0,2).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{emp.name}</div>
                        <div className="text-xs text-slate-400">ID: {emp.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-200">{emp.position}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{emp.department}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{emp.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{emp.phone}</td>
                  <td className="px-4 py-3 text-sm text-slate-200">{new Date(emp.joined).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-200 text-right">{
                    (() => {
                      const from = emp.currency || 'USD'
                      const to = displayCurrency || 'USD'
                      const salaryVal = emp.salary != null ? convertSalary(Number(emp.salary), from, to) : ''
                      return formatCurrency(salaryVal, to)
                    })()
                  }</td>
                  <td className="px-4 py-3 text-center"><StatusPill status={emp.status} /></td>
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
