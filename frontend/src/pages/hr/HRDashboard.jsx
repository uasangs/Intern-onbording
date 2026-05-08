import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hrApi } from '../../api'
import { StatCard, StatusBadge, PageHeader, EmptyState, Spinner } from '../../components/ui'
import { Users, FileCheck, Send, Star, Award, TrendingUp, Plus, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function HRDashboard() {
  const [stats, setStats] = useState(null)
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    Promise.all([hrApi.dashboard(), hrApi.listInterns({})])
      .then(([s, i]) => { setStats(s.data); setInterns(i.data) })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await hrApi.exportExcel()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'FY_Intern_Tracker.xlsx'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel exported!')
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Dashboard"
        subtitle="Grasim Industries — MBDD / TRADC"
        action={
          <div className="flex gap-3">
            <button onClick={handleExport} disabled={exporting} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />{exporting ? 'Exporting...' : 'Export FY Tracker'}
            </button>
            <Link to="/hr/initiate" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />New Intern
            </Link>
          </div>
        }
      />
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Interns" value={stats.total_interns} icon={<Users className="w-5 h-5" />} color="indigo" />
          <StatCard label="Active" value={stats.active_interns} icon={<TrendingUp className="w-5 h-5" />} color="green" />
          <StatCard label="Pending Doc Review" value={stats.pending_docs_verification} icon={<FileCheck className="w-5 h-5" />} color="amber" />
          <StatCard label="Pending Review" value={stats.pending_manager_review} icon={<Star className="w-5 h-5" />} color="amber" />
          <StatCard label="Certs Issued" value={stats.certificates_issued} icon={<Award className="w-5 h-5" />} color="green" />
          <StatCard label="Completion Rate" value={`${stats.completion_rate}%`} icon={<TrendingUp className="w-5 h-5" />} color="indigo" />
        </div>
      )}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">All Interns</h2>
          <Link to="/hr/interns" className="text-xs text-indigo-600 font-medium">View all →</Link>
        </div>
        {interns.length === 0 ? (
          <EmptyState title="No interns yet" description="Initiate the first intern to get started"
            action={<Link to="/hr/initiate" className="btn-primary">Initiate Intern</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Sr.</th><th className="table-th">Name / Email</th>
                  <th className="table-th">Institute</th><th className="table-th">Location</th>
                  <th className="table-th">Status</th><th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {interns.map(intern => (
                  <tr key={intern.id} className="hover:bg-slate-50">
                    <td className="table-td text-slate-400 text-xs">{intern.serial_no || '—'}</td>
                    <td className="table-td">
                      <p className="font-medium">{intern.candidate_name || '—'}</p>
                      <p className="text-xs text-slate-400">{intern.candidate_email}</p>
                    </td>
                    <td className="table-td text-xs">{intern.institute_name || '—'}</td>
                    <td className="table-td"><span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{intern.location}</span></td>
                    <td className="table-td"><StatusBadge status={intern.status} /></td>
                    <td className="table-td"><Link to={`/hr/intern/${intern.id}`} className="text-xs text-indigo-600 font-medium">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}