import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../../api'
import { PageHeader, StatusBadge, EmptyState, Spinner, StatCard } from '../../components/ui'
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function AccountsDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    accountsApi.getTasks()
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const pending = tasks.filter(t => t.task_status === 'pending').length
  const inProgress = tasks.filter(t => t.task_status === 'in_progress').length
  const done = tasks.filter(t => t.task_status === 'completed').length
  // Calculate total liability based on remaining internship period
  const today = new Date()
  const totalStipend = tasks.reduce((sum, t) => sum + (t.intern?.stipend_amount || 0), 0)
  
  // Calculate month-wise liability
  const getMonthsRemaining = (endDate) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const months = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth())
    return Math.max(0, months)
  }
  const totalRemainingLiability = tasks.reduce((sum, t) => {
    const months = getMonthsRemaining(t.intern?.end_date)
    return sum + ((t.intern?.stipend_amount || 0) * months)
  }, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts Dashboard"
        subtitle="Vendor creation & stipend management"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={tasks.length} icon={<CreditCard className="w-5 h-5" />} color="indigo" />
        <StatCard label="Pending" value={pending} icon={<Clock className="w-5 h-5" />} color="amber" />
        <StatCard label="In Progress" value={inProgress} icon={<AlertCircle className="w-5 h-5" />} color="blue" />
        <StatCard label="Completed" value={done} icon={<CheckCircle className="w-5 h-5" />} color="green" />
      </div>

      {/* Monthly liability summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5 bg-indigo-50 border-indigo-100">
          <p className="text-xs text-indigo-600 font-medium mb-1">Monthly Stipend Liability</p>
          <p className="text-3xl font-bold text-indigo-900">
            ₹{totalStipend.toLocaleString('en-IN')}
            <span className="text-sm font-normal text-indigo-500 ml-2">/ month</span>
          </p>
          <p className="text-xs text-indigo-500 mt-1">Across {tasks.length} active intern(s)</p>
        </div>
        <div className="card p-5 bg-amber-50 border-amber-100">
          <p className="text-xs text-amber-600 font-medium mb-1">Total Remaining Liability</p>
          <p className="text-3xl font-bold text-amber-900">
            ₹{totalRemainingLiability.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-amber-500 mt-1">Based on remaining internship periods · Paid on 23rd</p>
        </div>
      </div>

      {/* Tasks table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">All Stipend Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Tasks are created automatically when HR initiates an intern"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Institute</th>
                  <th className="table-th">Role / Dept</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Stipend</th>
                  <th className="table-th">Period</th>
                  <th className="table-th">Bank</th>
                  <th className="table-th">Vendor ID</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tasks.map(task => {
                  const intern = task.intern
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td">
                        <p className="font-medium text-slate-900">{intern?.candidate_name || '—'}</p>
                        <p className="text-xs text-slate-400">{intern?.candidate_email}</p>
                      </td>
                      <td className="table-td text-xs">{intern?.institute_name || '—'}</td>
                      <td className="table-td text-xs">
                        <p>{intern?.role_title}</p>
                        <p className="text-slate-400">{intern?.department}</p>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium
                          ${intern?.location === 'MBDD' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {intern?.location}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="font-bold text-slate-900">
                          ₹{intern?.stipend_amount?.toLocaleString('en-IN') || '—'}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">/ mo</span>
                      </td>
                      <td className="table-td text-xs text-slate-500">
                        {intern?.start_date ? format(new Date(intern.start_date), 'dd/MM/yy') : '—'}
                        {' → '}
                        {intern?.end_date ? format(new Date(intern.end_date), 'dd/MM/yy') : '—'}
                      </td>
                      <td className="table-td text-xs">
                        {intern?.bank_name
                          ? <span className="text-green-700 font-medium">{intern.bank_name}</span>
                          : <span className="text-amber-500">Not submitted</span>
                        }
                      </td>
                      <td className="table-td text-xs">
                        {task.vendor_id || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={task.task_status} />
                      </td>
                      <td className="table-td">
                        <Link
                          to={`/accounts/task/${task.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}