import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { accountsApi } from '../../api'
import { PageHeader, SectionCard, StatusBadge, Field, Spinner } from '../../components/ui'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { PlusCircle, CheckCircle, AlertCircle, Building, User, CreditCard, Calendar } from 'lucide-react'

export default function AccountsTaskDetail() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [stipends, setStipends] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showStipendForm, setShowStipendForm] = useState(false)

  const stipendAmount = task?.intern?.stipend_amount || 0

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const load = () => {
    Promise.all([
      accountsApi.getTask(taskId),
      accountsApi.getStipends(taskId),
    ])
      .then(([t, s]) => {
        setTask(t.data)
        setStipends(s.data)
      })
      .catch(() => toast.error('Failed to load task'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [taskId])

  const saveTask = async (field, value) => {
  if (!value && value !== false && value !== '') return
  if (field === 'vendor_id' && !value) {
    toast.error('Vendor ID cannot be empty')
    return
  }
    setSaving(true)
    try {
      await accountsApi.updateTask(taskId, { [field]: value })
      toast.success('Saved successfully')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const addStipend = async (data) => {
    // Validate amount matches intern's stipend
    const enteredAmount = parseFloat(data.amount)
    if (enteredAmount !== stipendAmount) {
      const confirm = window.confirm(
        `Warning: The intern's stipend is ₹${stipendAmount.toLocaleString('en-IN')} but you entered ₹${enteredAmount.toLocaleString('en-IN')}. Continue anyway?`
      )
      if (!confirm) return
    }

    try {
      await accountsApi.addStipend(taskId, {
        ...data,
        amount: enteredAmount,
        payment_date: data.payment_date,
      })
      toast.success('Stipend payment logged!')
      reset()
      setShowStipendForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to log payment')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!task) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-slate-500">Task not found.</p>
      <button onClick={() => navigate('/accounts/dashboard')} className="btn-secondary">Back to Dashboard</button>
    </div>
  )

  const intern = task.intern
  const bank = intern
  const totalPaid = stipends.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = stipends.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const noBankDetails = !intern?.bank_name
  const noCandidate = !intern?.candidate_name

  // Generate current month/year string
  const today = new Date()
  const currentMonthYear = today.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
  const defaultPaymentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-23`

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={intern?.candidate_name || intern?.candidate_email || 'Accounts Task'}
        subtitle={`${intern?.role_title || ''} · ${intern?.department || ''} · ${intern?.location || ''}`}
        action={<StatusBadge status={task.task_status} />}
      />

      {/* Warnings */}
      {noCandidate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Candidate details not submitted yet</p>
            <p className="text-xs text-amber-700 mt-0.5">The candidate has not filled their portal form. Bank details and personal info will appear here once submitted.</p>
          </div>
        </div>
      )}
      {!noCandidate && noBankDetails && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Bank details missing</p>
            <p className="text-xs text-amber-700 mt-0.5">Candidate has submitted details but bank information is incomplete. Cannot process stipend without bank details.</p>
          </div>
        </div>
      )}

      {/* Intern Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Candidate Details */}
        <SectionCard title="Candidate Details">
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: intern?.candidate_name },
              { label: 'Email', value: intern?.candidate_email },
              { label: 'Institute', value: intern?.institute_name },
              { label: 'Role', value: intern?.role_title },
              { label: 'Department', value: intern?.department },
              { label: 'Location', value: intern?.location },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300">—</span>}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Stipend & Period */}
        <SectionCard title="Stipend Details">
          <div className="space-y-3">
            <div className="p-4 bg-indigo-50 rounded-xl text-center">
              <p className="text-xs text-indigo-500 mb-1">Monthly Stipend Amount</p>
              <p className="text-3xl font-bold text-indigo-900">
                ₹{stipendAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-indigo-400 mt-1">as set by HR · paid on 23rd every month</p>
            </div>
            {[
              { label: 'Duration', value: intern?.duration_weeks ? `${intern.duration_weeks} weeks` : '—' },
              { label: 'Start Date', value: intern?.start_date ? format(new Date(intern.start_date), 'dd/MM/yyyy') : '—' },
              { label: 'End Date', value: intern?.end_date ? format(new Date(intern.end_date), 'dd/MM/yyyy') : '—' },
              { label: 'Frequency', value: intern?.payment_frequency || 'Monthly' },
              { label: 'Notes from HR', value: intern?.notes_for_accounts },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300">—</span>}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bank Details */}
      <SectionCard title="Bank Details (for Stipend Transfer)">
        {noBankDetails ? (
          <p className="text-sm text-slate-400 text-center py-4">Bank details not submitted by candidate yet</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Bank Name', value: bank?.bank_name },
              { label: 'Account Holder', value: bank?.account_holder_name },
              { label: 'Account Type', value: bank?.account_type },
              { label: 'Account Number', value: bank?.account_number, sensitive: true },
              { label: 'IFSC Code', value: bank?.ifsc_code },
            ].map(({ label, value, sensitive }) => (
              <div key={label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-sm font-semibold ${sensitive ? 'font-mono tracking-wider' : ''} text-slate-900`}>
                  {value || <span className="text-slate-300 font-normal">—</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Vendor Setup */}
      <SectionCard title="Vendor Setup & Payment Configuration">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vendor ID">
            <input
              className="input"
              defaultValue={task.vendor_id || ''}
              placeholder="e.g. VND-2026-001"
              onBlur={e => e.target.value !== task.vendor_id && saveTask('vendor_id', e.target.value)}
            />
          </Field>
          <Field label="Payment Mode">
            <select
              className="input"
              defaultValue={task.payment_mode || 'bank_transfer'}
              onChange={e => saveTask('payment_mode', e.target.value)}
            >
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Internal Notes">
              <textarea
                className="input"
                rows={2}
                defaultValue={task.notes || ''}
                placeholder="Any notes about this vendor/payment setup..."
                onBlur={e => e.target.value !== task.notes && saveTask('notes', e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2 flex items-center gap-3 pt-1">
            {task.task_status === 'completed' ? (
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Vendor setup completed
                {task.completed_at && (
                  <span className="text-slate-400 font-normal text-xs">
                    on {format(new Date(task.completed_at + 'Z'), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
            ) : (
              <button
  onClick={() => {
    if (!task.vendor_id) {
      toast.error('Please enter Vendor ID before marking as complete')
      return
    }
    saveTask('task_status', 'completed')
  }}
  disabled={saving || noBankDetails}
  className="btn-primary flex items-center gap-2"
  title={noBankDetails ? 'Cannot complete — bank details missing' : !task.vendor_id ? 'Vendor ID is required' : ''}
>
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Saving...' : 'Mark Vendor Setup Complete'}
              </button>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Stipend Payment Tracker */}
      <SectionCard title="Stipend Payment Tracker">
        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-green-800">₹{totalPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <p className="text-xs text-amber-600 mb-1">Pending</p>
            <p className="text-lg font-bold text-amber-800">₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-1">Per Month</p>
            <p className="text-lg font-bold text-slate-800">₹{stipendAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-500">
            {stipends.length} payment{stipends.length !== 1 ? 's' : ''} logged
          </p>
          <button
            onClick={() => setShowStipendForm(p => !p)}
            disabled={noBankDetails}
            title={noBankDetails ? 'Bank details required before logging payments' : ''}
            className="btn-secondary flex items-center gap-2 text-xs disabled:opacity-40"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log Payment
          </button>
        </div>

        {/* Add stipend form */}
        {showStipendForm && (
          <form
            onSubmit={handleSubmit(addStipend)}
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 space-y-4"
          >
            <p className="text-xs font-semibold text-slate-700 mb-2">Log Stipend Payment</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Month / Year *">
                <input
                  className="input"
                  placeholder="e.g. Jan 2026"
                  defaultValue={currentMonthYear}
                  {...register('month_year', { required: 'Required' })}
                />
                {errors.month_year && <p className="text-xs text-red-500 mt-1">{errors.month_year.message}</p>}
              </Field>
              <Field label="Payment Date *">
                <input
                  type="date"
                  className="input"
                  defaultValue={defaultPaymentDate}
                  {...register('payment_date', { required: 'Required' })}
                />
                {errors.payment_date && <p className="text-xs text-red-500 mt-1">{errors.payment_date.message}</p>}
              </Field>
              <Field label={`Amount (₹) — intern's stipend is ₹${stipendAmount.toLocaleString('en-IN')}`}>
                <input
                  type="number"
                  className="input font-semibold"
                  defaultValue={stipendAmount}
                  {...register('amount', {
                    required: 'Required',
                    min: { value: 1, message: 'Must be greater than 0' }
                  })}
                />
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
              </Field>
              <Field label="Status">
                <select className="input" {...register('status')} defaultValue="paid">
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </Field>
              <Field label="UTR / Reference Number">
                <input
                  className="input"
                  placeholder="Bank UTR or reference number"
                  {...register('utr_reference')}
                />
              </Field>
              <Field label="Notes (optional)">
                <input className="input" placeholder="Any notes..." {...register('notes')} />
              </Field>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? 'Saving...' : 'Log Payment'}
              </button>
              <button type="button" onClick={() => setShowStipendForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Payments table */}
        {stipends.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No payments logged yet. Click "Log Payment" to record the first stipend.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Month</th>
                  <th className="table-th">Payment Date</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">UTR Reference</th>
                  <th className="table-th">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stipends.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-medium">{p.month_year}</td>
                    <td className="table-td text-xs">
                      {p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="table-td">
                      <span className={`font-bold ${p.amount !== stipendAmount ? 'text-amber-600' : 'text-slate-900'}`}>
                        ₹{parseInt(p.amount).toLocaleString('en-IN')}
                      </span>
                      {p.amount !== stipendAmount && (
                        <span className="text-xs text-amber-500 ml-1" title="Different from intern's stipend amount">
                          ⚠ differs
                        </span>
                      )}
                    </td>
                    <td className="table-td"><StatusBadge status={p.status} /></td>
                    <td className="table-td text-xs font-mono">{p.utr_reference || '—'}</td>
                    <td className="table-td text-xs text-slate-400">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="table-td text-xs font-semibold text-slate-600">
                    Total ({stipends.filter(p => p.status === 'paid').length} paid)
                  </td>
                  <td className="table-td font-bold text-green-700">
                    ₹{totalPaid.toLocaleString('en-IN')}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}