import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { itApi } from '../../api'
import { PageHeader, SectionCard, StatusBadge, Field, Spinner } from '../../components/ui'
import toast from 'react-hot-toast'
import { CheckCircle, Monitor, Mail, Package, AlertCircle, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'

function ProvisionStatus({ done, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
      ${done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
      {done ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
      {done ? `${label} provisioned` : `${label} pending`}
    </span>
  )
}

export default function ITTaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    laptop_serial: '',
    laptop_provisioned: false,
    abg_email_id: '',
    email_provisioned: false,
    other_assets_provisioned: false,
    notes: '',
  })

  const load = () => {
    itApi.getTask(taskId)
      .then(r => {
        const t = r.data
        setTask(t)
        setForm({
          laptop_serial: t.laptop_serial || '',
          laptop_provisioned: t.laptop_provisioned || false,
          abg_email_id: t.abg_email_id || '',
          email_provisioned: t.email_provisioned || false,
          other_assets_provisioned: t.other_assets_provisioned || false,
          notes: t.notes || '',
        })
      })
      .catch(() => toast.error('Failed to load task'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [taskId])

  const save = async (overrides = {}) => {
    setSaving(true)
    const payload = { ...form, ...overrides }

    // Validate before saving
    if (payload.laptop_provisioned && !payload.laptop_serial) {
      toast.error('Please enter laptop serial number before marking as provisioned')
      setSaving(false)
      return
    }
    if (payload.email_provisioned && !payload.abg_email_id) {
      toast.error('Please enter ABG email ID before marking as provisioned')
      setSaving(false)
      return
    }

    try {
      const res = await itApi.updateTask(taskId, payload)
      setTask(res.data)
      setForm({
        laptop_serial: res.data.laptop_serial || '',
        laptop_provisioned: res.data.laptop_provisioned,
        abg_email_id: res.data.abg_email_id || '',
        email_provisioned: res.data.email_provisioned,
        other_assets_provisioned: res.data.other_assets_provisioned,
        notes: res.data.notes || '',
      })
      toast.success('Task updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (!task) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-slate-500">Task not found.</p>
      <button onClick={() => navigate('/it/dashboard')} className="btn-secondary">Back to Dashboard</button>
    </div>
  )

  const intern = task.intern
  const isComplete = task.task_status === 'completed'
  const noAssetsRequired = !task.laptop_required && !task.email_required && !task.other_assets
  const noCandidate = !intern?.candidate_name

  // Progress calculation
  const items = []
  if (task.laptop_required) items.push(form.laptop_provisioned)
  if (task.email_required)  items.push(form.email_provisioned)
  if (task.other_assets)    items.push(form.other_assets_provisioned)
  const progress = items.length > 0 ? Math.round((items.filter(Boolean).length / items.length) * 100) : 100

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={intern?.candidate_name || intern?.candidate_email || 'IT Task'}
        subtitle={`${intern?.role_title || ''} · ${intern?.department || ''} · ${intern?.location || ''}`}
        action={<StatusBadge status={task.task_status} />}
      />

      {/* Completion banner */}
      {isComplete && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">All provisioning complete</p>
            {task.completed_at && (
              <p className="text-xs text-green-600">Completed on {format(new Date(task.completed_at), 'dd MMM yyyy, hh:mm a')}</p>
            )}
          </div>
        </div>
      )}

      {/* Warning if candidate not submitted */}
      {noCandidate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Candidate details not submitted yet</p>
            <p className="text-xs text-amber-700 mt-0.5">The candidate hasn't filled the portal form. You can still provision assets — candidate info will appear once they submit.</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {!noAssetsRequired && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600">Provisioning Progress</p>
            <p className="text-xs font-bold text-slate-800">{progress}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-3 mt-3">
            {task.laptop_required && <ProvisionStatus done={form.laptop_provisioned} label="Laptop" />}
            {task.email_required  && <ProvisionStatus done={form.email_provisioned}  label="ABG Email" />}
            {task.other_assets    && <ProvisionStatus done={form.other_assets_provisioned} label="Other assets" />}
          </div>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Candidate Info */}
        <SectionCard title="Candidate Details">
          <div className="space-y-2.5">
            {[
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Full Name',     value: intern?.candidate_name },
              { icon: <Mail className="w-3.5 h-3.5" />,     label: 'Email',         value: intern?.candidate_email },
              { icon: <Monitor className="w-3.5 h-3.5" />,  label: 'Mobile',        value: intern?.candidate_mobile },
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Institute',     value: intern?.institute_name },
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Course',        value: intern?.course },
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Graduation',    value: intern?.graduation_year },
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Role',          value: intern?.role_title },
              { icon: <User className="w-3.5 h-3.5" />,     label: 'Department',    value: intern?.department },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">{icon}{label}</span>
                <span className="text-xs font-medium text-slate-800">
                  {value || <span className="text-slate-300">—</span>}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Internship Period */}
        <SectionCard title="Internship Period">
          <div className="space-y-2.5">
            {[
              { label: 'Location',  value: intern?.location },
              { label: 'Start Date', value: intern?.start_date ? format(new Date(intern.start_date), 'dd MMM yyyy') : '—' },
              { label: 'End Date',   value: intern?.end_date   ? format(new Date(intern.end_date),   'dd MMM yyyy') : '—' },
              { label: 'Duration',  value: intern?.duration_weeks ? `${intern.duration_weeks} weeks` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-medium text-slate-800">{value || <span className="text-slate-300">—</span>}</span>
              </div>
            ))}
          </div>

          {/* What HR requested */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Assets requested by HR</p>
            <div className="space-y-1.5">
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                ${task.laptop_required ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-400 line-through'}`}>
                <Monitor className="w-3.5 h-3.5" />
                Laptop {task.laptop_required ? 'required' : 'not required'}
              </div>
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                ${task.email_required ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-400 line-through'}`}>
                <Mail className="w-3.5 h-3.5" />
                ABG Email {task.email_required ? 'required' : 'not required'}
              </div>
              {task.other_assets && (
                <div className="flex items-start gap-2 text-xs px-3 py-2 rounded-lg bg-amber-50 text-amber-700">
                  <Package className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Other: {task.other_assets}</span>
                </div>
              )}
              {noAssetsRequired && (
                <p className="text-xs text-slate-400 italic">No specific assets requested by HR</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Laptop Provisioning */}
      {task.laptop_required && (
        <SectionCard title="Laptop Provisioning">
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border
              ${form.laptop_provisioned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Monitor className={`w-5 h-5 ${form.laptop_provisioned ? 'text-green-500' : 'text-slate-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Laptop Assignment</p>
                  <p className="text-xs text-slate-400">
                    {form.laptop_provisioned
                      ? `Serial: ${form.laptop_serial || 'entered'}`
                      : 'Enter serial number and mark as provisioned'}
                  </p>
                </div>
              </div>
              <ProvisionStatus done={form.laptop_provisioned} label="Laptop" />
            </div>

            <Field label="Laptop Serial Number *">
              <input
                className="input font-mono"
                placeholder="e.g. GRS-LAP-2026-001 or DELL-XPS-SN12345"
                value={form.laptop_serial}
                onChange={e => setForm(p => ({ ...p, laptop_serial: e.target.value }))}
                disabled={isComplete}
              />
              <p className="text-xs text-slate-400 mt-1">Serial number is required before marking as provisioned</p>
            </Field>

            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
              ${!form.laptop_serial ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600"
                checked={form.laptop_provisioned}
                disabled={!form.laptop_serial || isComplete}
                onChange={e => setForm(p => ({ ...p, laptop_provisioned: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Mark laptop as provisioned</p>
                <p className="text-xs text-slate-400">Confirm laptop has been handed over to the intern</p>
              </div>
            </label>
          </div>
        </SectionCard>
      )}

      {/* ABG Email Provisioning */}
      {task.email_required && (
        <SectionCard title="Corporate Email (ABG) Setup">
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border
              ${form.email_provisioned ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${form.email_provisioned ? 'text-green-500' : 'text-slate-400'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">ABG Corporate Email</p>
                  <p className="text-xs text-slate-400">
                    {form.email_provisioned
                      ? `Assigned: ${form.abg_email_id}`
                      : 'Create email account and enter ID below'}
                  </p>
                </div>
              </div>
              <ProvisionStatus done={form.email_provisioned} label="Email" />
            </div>

            <Field label="ABG Email ID *">
              <input
                className="input"
                type="email"
                placeholder="firstname.lastname@adityabirla.com"
                value={form.abg_email_id}
                onChange={e => setForm(p => ({ ...p, abg_email_id: e.target.value }))}
                disabled={isComplete}
              />
              <p className="text-xs text-slate-400 mt-1">
                Suggested format: {intern?.candidate_name
                  ? intern.candidate_name.toLowerCase().replace(/\s+/g, '.') + '@adityabirla.com'
                  : 'firstname.lastname@adityabirla.com'}
              </p>
            </Field>

            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors
              ${!form.abg_email_id ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600"
                checked={form.email_provisioned}
                disabled={!form.abg_email_id || isComplete}
                onChange={e => setForm(p => ({ ...p, email_provisioned: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Mark email as provisioned</p>
                <p className="text-xs text-slate-400">Confirm email account has been created and credentials shared</p>
              </div>
            </label>
          </div>
        </SectionCard>
      )}

      {/* Other Assets */}
      {task.other_assets && (
        <SectionCard title="Other Assets">
          <div className="space-y-4">
            <div className={`flex items-start justify-between p-4 rounded-xl border
              ${form.other_assets_provisioned ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                <Package className={`w-5 h-5 mt-0.5 flex-shrink-0 ${form.other_assets_provisioned ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-700">Assets Requested</p>
                  <p className="text-xs text-slate-600 mt-0.5">{task.other_assets}</p>
                </div>
              </div>
              <ProvisionStatus done={form.other_assets_provisioned} label="Assets" />
            </div>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                className="w-4 h-4 text-indigo-600"
                checked={form.other_assets_provisioned}
                disabled={isComplete}
                onChange={e => setForm(p => ({ ...p, other_assets_provisioned: e.target.checked }))}
              />
              <div>
                <p className="text-sm font-medium text-slate-700">Mark all other assets as provisioned</p>
                <p className="text-xs text-slate-400">Confirm all requested items have been provided</p>
              </div>
            </label>
          </div>
        </SectionCard>
      )}

      {/* No assets required */}
      {noAssetsRequired && (
        <SectionCard title="Assets">
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No assets were requested by HR for this intern.</p>
          </div>
        </SectionCard>
      )}

      {/* Notes */}
      <SectionCard title="Internal Notes">
        <textarea
          className="input"
          rows={3}
          placeholder="Any notes about this provisioning task (device condition, handover details, etc.)..."
          value={form.notes}
          disabled={isComplete}
          onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
        />
      </SectionCard>

      {/* Save button */}
      {!isComplete && (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
          <div className="text-xs text-slate-500">
            {progress === 100
              ? '✓ All items provisioned — saving will mark this task complete'
              : `${items.filter(Boolean).length} of ${items.length} items provisioned`}
          </div>
          <button
            onClick={() => save()}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6"
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Saving...' : progress === 100 ? 'Save & Mark Complete' : 'Save Updates'}
          </button>
        </div>
      )}
    </div>
  )
}