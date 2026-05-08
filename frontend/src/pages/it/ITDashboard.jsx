import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { itApi } from '../../api'
import { PageHeader, StatusBadge, EmptyState, Spinner, StatCard } from '../../components/ui'
import { Monitor, CheckCircle, Clock, AlertCircle, Mail, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function ProvisionPill({ done, label }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
      ${done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      {done ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {label}
    </span>
  )
}

export default function ITDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    itApi.getTasks()
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const pending   = tasks.filter(t => t.task_status === 'pending').length
  const inProg    = tasks.filter(t => t.task_status === 'in_progress').length
  const done      = tasks.filter(t => t.task_status === 'completed').length
  const laptops   = tasks.filter(t => t.laptop_required).length
  const emails    = tasks.filter(t => t.email_required).length

  const filtered = filter === 'all' ? tasks
    : filter === 'pending' ? tasks.filter(t => t.task_status !== 'completed')
    : tasks.filter(t => t.task_status === 'completed')

  return (
    <div className="space-y-6">
      <PageHeader title="IT Dashboard" subtitle="Asset provisioning & ABG email setup" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Tasks"   value={tasks.length} icon={<Monitor className="w-5 h-5" />}      color="indigo" />
        <StatCard label="Pending"       value={pending}      icon={<Clock className="w-5 h-5" />}         color="amber"  />
        {/* <StatCard label="In Progress"   value={inProg}       icon={<AlertCircle className="w-5 h-5" />}   color="blue"   /> */}
        <StatCard label="Laptops"       value={laptops}      icon={<Monitor className="w-5 h-5" />}       color="slate"  />
        <StatCard label="Completed"     value={done}         icon={<CheckCircle className="w-5 h-5" />}   color="green"  />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[['all','All'],['pending','Pending'],['done','Completed']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            {filter === 'all' ? 'All' : filter === 'pending' ? 'Pending' : 'Completed'} IT Tasks
            <span className="ml-2 text-slate-400 font-normal">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No tasks" description="IT tasks are created when HR initiates an intern" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Institute</th>
                  <th className="table-th">Role / Dept</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Period</th>
                  <th className="table-th">Assets Required</th>
                  <th className="table-th">Provisioning</th>
                  <th className="table-th">Status</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(task => {
                  const intern = task.intern
                  const allDone = task.task_status === 'completed'
                  return (
                    <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${!allDone ? 'bg-white' : 'bg-green-50/30'}`}>
                      <td className="table-td">
                        <p className="font-medium text-slate-900">{intern?.candidate_name || '—'}</p>
                        <p className="text-xs text-slate-400">{intern?.candidate_email}</p>
                        {intern?.candidate_mobile && (
                          <p className="text-xs text-slate-400">{intern.candidate_mobile}</p>
                        )}
                      </td>
                      <td className="table-td text-xs">
                        <p>{intern?.institute_name || '—'}</p>
                        {intern?.course && <p className="text-slate-400">{intern.course}</p>}
                      </td>
                      <td className="table-td text-xs">
                        <p className="font-medium">{intern?.role_title}</p>
                        <p className="text-slate-400">{intern?.department}</p>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium
                          ${intern?.location === 'MBDD' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {intern?.location}
                        </span>
                      </td>
                      <td className="table-td text-xs text-slate-500">
                        <p>{intern?.start_date ? format(new Date(intern.start_date), 'dd MMM yy') : '—'}</p>
                        <p>{intern?.end_date   ? format(new Date(intern.end_date),   'dd MMM yy') : '—'}</p>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1">
                          {task.laptop_required  && <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Monitor className="w-3 h-3" /> Laptop</span>}
                          {task.email_required   && <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Mail className="w-3 h-3" /> ABG Email</span>}
                          {task.other_assets     && <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Package className="w-3 h-3" /> Other</span>}
                          {!task.laptop_required && !task.email_required && !task.other_assets && (
                            <span className="text-slate-300 text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex flex-col gap-1">
                          {task.laptop_required && (
                            <ProvisionPill done={task.laptop_provisioned} label={task.laptop_provisioned ? `Laptop: ${task.laptop_serial || 'done'}` : 'Laptop pending'} />
                          )}
                          {task.email_required && (
                            <ProvisionPill done={task.email_provisioned} label={task.email_provisioned ? `Email: ${task.abg_email_id || 'done'}` : 'Email pending'} />
                          )}
                          {task.other_assets && (
                            <ProvisionPill done={task.other_assets_provisioned} label={task.other_assets_provisioned ? 'Other: done' : 'Other pending'} />
                          )}
                        </div>
                      </td>
                      <td className="table-td"><StatusBadge status={task.task_status} /></td>
                      <td className="table-td">
                        <Link to={`/it/task/${task.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
                          {allDone ? 'View →' : 'Manage →'}
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