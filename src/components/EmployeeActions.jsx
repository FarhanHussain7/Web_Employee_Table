import React from 'react'
import { Edit, Trash2 } from 'lucide-react'

const EmployeeActions = ({ emp, onEdit, onDelete, isAdmin = false }) => {
  if (!isAdmin) return null
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onEdit(emp)}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-sm bg-slate-700 hover:bg-slate-600 text-white"
        title="Edit"
      >
        <Edit className="h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>

      <button
        type="button"
        onClick={() => onDelete(emp)}
        className="flex items-center gap-2 px-2 py-1 rounded-md text-sm bg-rose-600 hover:bg-rose-500 text-white"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  )
}

export default EmployeeActions
