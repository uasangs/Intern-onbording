import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hrApi } from '../../api'
import { PageHeader, StatusBadge, EmptyState, Spinner } from '../../components/ui'
import { Search, Filter, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUSES = [
  'all','initiated','portal_pending','portal_submitted','docs_under_review',
  'docs_approved','offer_sent','offer_accepted','active','review_pending','completed','offer_declined'
]

export default function InternList() {
  const [interns, setInterns] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')

  useEffect(() => {
    hrApi.listInterns({})
      .then(r => { setInterns(r.data); setFiltered(r.data) })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = interns
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.candidate_email?.toLowerCase().includes(q) ||
        i.candidate_name?.toLowerCase().includes(q) ||
        i.institute_name?.toLowerCase().includes(q) ||
        i.role_title?.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter)
    if (locationFilter !== 'all') result = result.filter(i => i.location === locationFilter)
    setFiltered(result)
  }, [search, statusFilter, locationFilter, interns])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5">
      <PageHeader
        title={`All Interns (${interns.length})`}
        subtitle="Full list with search and filters"
        action={
          <Link to="/hr/initiate" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />New Intern
          </Link>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search by name, email, institute..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <select className="input w-36" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
          <option value="all">All locations</option>
          <option value="MBDD">MBDD</option>
          <option value="TRADC">TRADC</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title="No interns found" description="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Sr.</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Institute</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Start</th>
                  <th className="table-th">End</th>
                  <th className="table-th">Stipend</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Cert</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(intern => (
                  <tr key={intern.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td text-xs text-slate-400">{intern.serial_no || '—'}</td>
                    <td className="table-td font-medium text-slate-900">{intern.candidate_name || '—'}</td>
                    <td className="table-td text-xs text-slate-500">{intern.candidate_email}</td>
                    <td className="table-td text-xs">{intern.institute_name || '—'}</td>
                    <td className="table-td text-xs">{intern.role_title}</td>
                    <td className="table-td">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${intern.location === 'MBDD' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                        {intern.location}
                      </span>
                    </td>
                    <td className="table-td text-xs">{format(new Date(intern.start_date), 'dd MM yy')}</td>
                    <td className="table-td text-xs">{format(new Date(intern.end_date), 'dd MM yy')}</td>
                    <td className="table-td text-xs">₹{parseInt(intern.stipend_amount).toLocaleString()}</td>
                    <td className="table-td"><StatusBadge status={intern.status} /></td>
                    <td className="table-td text-center">
                      {intern.experience_certificate_issued
                        ? <span className="text-green-500 text-xs">✓</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="table-td">
                      <Link to={`/hr/intern/${intern.id}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap">
                        View →
                      </Link>
                    </td>
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