import { Loader2 } from 'lucide-react'

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return <Loader2 className={`${s} animate-spin text-indigo-600`} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  )
}

const STATUS_STYLES = {
  initiated:'bg-slate-100 text-slate-700',portal_pending:'bg-yellow-100 text-yellow-800',
  portal_submitted:'bg-blue-100 text-blue-800',docs_under_review:'bg-orange-100 text-orange-800',
  docs_approved:'bg-cyan-100 text-cyan-800',offer_sent:'bg-purple-100 text-purple-800',
  offer_accepted:'bg-indigo-100 text-indigo-800',offer_declined:'bg-red-100 text-red-800',
  active:'bg-green-100 text-green-800',review_pending:'bg-amber-100 text-amber-800',
  completed:'bg-emerald-100 text-emerald-800',terminated:'bg-red-100 text-red-700',
  pending:'bg-yellow-100 text-yellow-800',in_progress:'bg-blue-100 text-blue-800',
  approved:'bg-green-100 text-green-800',rejected:'bg-red-100 text-red-800',
  paid:'bg-green-100 text-green-800',draft:'bg-slate-100 text-slate-600',
  sent:'bg-blue-100 text-blue-800',accepted:'bg-green-100 text-green-800',
  declined:'bg-red-100 text-red-800',
}

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>{status?.replace(/_/g,' ')}</span>
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <span className="text-slate-400 text-xl">📋</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 mb-4">{description}</p>}
      {action}
    </div>
  )
}

export function StatCard({ label, value, color='indigo', icon }) {
  const colors = { indigo:'bg-indigo-50 text-indigo-700',green:'bg-green-50 text-green-700',amber:'bg-amber-50 text-amber-700',red:'bg-red-50 text-red-700',blue:'bg-blue-50 text-blue-700',slate:'bg-slate-50 text-slate-700' }
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div><p className="text-sm text-slate-500 mb-1">{label}</p><p className="text-2xl font-bold text-slate-900">{value}</p></div>
        {icon && <span className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</span>}
      </div>
    </div>
  )
}

export function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div><h1 className="text-xl font-bold text-slate-900">{title}</h1>{subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}</div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function SectionCard({ title, children, className='' }) {
  return (
    <div className={`card p-6 ${className}`}>
      {title && <h2 className="section-title">{title}</h2>}
      {children}
    </div>
  )
}

export function YNBadge({ value }) {
  return value ? <span className="text-green-600 font-semibold text-xs">Y</span> : <span className="text-slate-400 text-xs">N</span>
}
