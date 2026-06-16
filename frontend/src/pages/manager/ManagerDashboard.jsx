import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { managerApi } from '../../api'
import { PageHeader, StatusBadge, EmptyState, Spinner, StatCard } from '../../components/ui'
import { Star, CheckCircle, Clock, AlertCircle, Users, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'

function DaysRemaining({ endDate }) {
  const days = differenceInDays(new Date(endDate), new Date())
  if (days < 0) return <span className="text-xs text-slate-400">Ended</span>
  if (days <= 7)  return <span className="text-xs font-semibold text-red-600">{days}d left ⚠</span>
  if (days <= 14) return <span className="text-xs font-semibold text-amber-600">{days}d left</span>
  return <span className="text-xs text-slate-500">{days}d left</span>
}

function RatingStars({ value, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{value}/{max}</span>
    </div>
  )
}

export default function ManagerDashboard() {
  const [interns, setInterns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    managerApi.getMyInterns()
      .then(r => setInterns(r.data))
      .catch(() => toast.error('Failed to load interns'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  // Show interns who have accepted the offer (status-based check)
  const acceptedInterns = interns.filter(i =>
    ['offer_accepted', 'active', 'review_pending', 'completed'].includes(i.status)
  )

  const active        = acceptedInterns.filter(i => i.status === 'active')
  const reviewPending = acceptedInterns.filter(i => !i.review_submitted && ['active','review_pending'].includes(i.status))
  const reviewed      = acceptedInterns.filter(i => i.review_submitted)
  const completed     = acceptedInterns.filter(i => i.status === 'completed')
  const urgent        = reviewPending.filter(i => differenceInDays(new Date(i.end_date), new Date()) <= 7 && (!i.review_due_date || new Date() >= new Date(i.review_due_date)))

  const filtered =
    filter === 'pending'   ? reviewPending :
    filter === 'reviewed'  ? reviewed :
    filter === 'completed' ? completed :
    acceptedInterns

  return (
    <div className="space-y-6">
      <PageHeader title="My Interns" subtitle="Evaluate and track interns reporting to you" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Interns"    value={acceptedInterns.length}        icon={<Users className="w-5 h-5" />}       color="indigo" />
        <StatCard label="Active"           value={active.length}         icon={<Clock className="w-5 h-5" />}        color="green"  />
        <StatCard label="Review Pending"   value={reviewPending.length}  icon={<Star className="w-5 h-5" />}         color="amber"  />
        <StatCard label="Completed"        value={completed.length}      icon={<CheckCircle className="w-5 h-5" />}  color="slate"  />
      </div>

      {/* Urgent alert */}
      {urgent.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">
              {urgent.length} intern{urgent.length > 1 ? 's' : ''} ending within 7 days — review required!
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {urgent.map(i => (
                <Link key={i.id} to={`/manager/review/${i.id}`}
                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200 font-medium">
                  {i.candidate_name || i.candidate_email} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Review pending alert */}
      {reviewPending.length > 0 && urgent.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Star className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {reviewPending.length} intern{reviewPending.length > 1 ? 's' : ''} pending evaluation
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Please complete the evaluation form before their internship ends</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['all', `All (${acceptedInterns.length})`],
          ['pending', `Pending Review (${reviewPending.length})`],
          ['reviewed', `Reviewed (${reviewed.length})`],
          ['completed', `Completed (${completed.length})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            {filter === 'all' ? 'All Interns' : filter === 'pending' ? 'Pending Review' : filter === 'reviewed' ? 'Reviewed' : 'Completed'}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={filter === 'all' ? 'No interns assigned' : 'No interns in this category'}
            description={filter === 'all' ? 'HR will assign interns to you when initiating onboarding' : 'Try a different filter'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Institute / Course</th>
                  <th className="table-th">Role / Dept</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Period</th>
                  <th className="table-th">Days Left</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Review</th>
                  <th className="table-th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(intern => {
                  const needsReview = !intern.review_submitted && ['active','review_pending'].includes(intern.status)
                  const days = differenceInDays(new Date(intern.end_date), new Date())
                  // b: Review locked until review_due_date is reached
                  const reviewUnlocked = intern.review_due_date
                    ? new Date() >= new Date(intern.review_due_date)
                    : true
                  const canFillReview = needsReview && reviewUnlocked
                  return (
                    <tr key={intern.id}
                      className={`hover:bg-slate-50 transition-colors
                        ${canFillReview && days <= 7 ? 'bg-red-50/30' :
                          canFillReview ? 'bg-amber-50/20' : ''}`}>
                      <td className="table-td">
                        <p className="font-semibold text-slate-900">{intern.candidate_name || '—'}</p>
                        <p className="text-xs text-slate-400">{intern.candidate_email}</p>
                        {intern.candidate_mobile && <p className="text-xs text-slate-400">{intern.candidate_mobile}</p>}
                      </td>
                      <td className="table-td text-xs">
                        <p>{intern.institute_name || '—'}</p>
                        {intern.course && <p className="text-slate-400">{intern.course}</p>}
                        {intern.qualification && <p className="text-slate-400">{intern.qualification}</p>}
                      </td>
                      <td className="table-td text-xs">
                        <p className="font-medium">{intern.role_title}</p>
                        <p className="text-slate-400">{intern.department}</p>
                      </td>
                      <td className="table-td">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium
                          ${intern.location === 'MBDD' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {intern.location}
                        </span>
                      </td>
                      <td className="table-td text-xs text-slate-500">
                        <p>{intern.start_date ? format(new Date(intern.start_date), 'dd/MM/yy') : '—'}</p>
                        <p>{intern.end_date   ? format(new Date(intern.end_date),   'dd/MM/yy') : '—'}</p>
                        {intern.duration_weeks && <p className="text-slate-400">{intern.duration_weeks}w</p>}
                      </td>
                      <td className="table-td">
                        <DaysRemaining endDate={intern.end_date} />
                      </td>
                      <td className="table-td"><StatusBadge status={intern.status} /></td>
                      <td className="table-td">
                        {intern.review_submitted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />Done
                          </span>
                        ) : reviewUnlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />Locked until {format(new Date(intern.review_due_date), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </td>
                      <td className="table-td">
                        {intern.review_submitted || reviewUnlocked ? (
                          <Link
                            to={`/manager/review/${intern.id}`}
                            className={`text-xs font-medium whitespace-nowrap
                              ${canFillReview ? 'text-indigo-600 hover:text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
                            {intern.review_submitted ? 'View Review →' : 'Fill Review →'}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Not yet available</span>
                        )}
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