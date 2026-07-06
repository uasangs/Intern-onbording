import { useForm } from 'react-hook-form'
import { fetchMasters, DEFAULT_MASTERS } from '../../utils/masters'
import { useNavigate } from 'react-router-dom'
import { hrApi, authApi } from '../../api'
import { Field, PageHeader, SectionCard } from '../../components/ui'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export default function InitiateIntern() {
  const { register, handleSubmit, setValue, watch, trigger, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { stipend_amount: 7000, location: 'MBDD' },
    mode: 'onTouched',
  })
  const navigate = useNavigate()
  const [managers, setManagers] = useState([])
  const [masters, setMasters] = useState(DEFAULT_MASTERS)
  const [daysBeforeEnd, setDaysBeforeEnd] = useState(7)

  useEffect(() => {
    fetchMasters().then(setMasters)
    authApi.getUsers().then(r => setManagers(r.data.filter(u => u.role === 'manager'))).catch(() => {})
  }, [])

  const watchEndDate = watch('end_date')
  const watchStartDate = watch('start_date')

  // b: Auto-calculate Manager Review Date when end date or days changes
  useEffect(() => {
    if (watchEndDate && daysBeforeEnd >= 0) {
      const end = new Date(watchEndDate)
      if (!isNaN(end)) {
        end.setDate(end.getDate() - daysBeforeEnd)
        const yyyy = end.getFullYear()
        const mm = String(end.getMonth() + 1).padStart(2, '0')
        const dd = String(end.getDate()).padStart(2, '0')
        setValue('review_due_date', `${yyyy}-${mm}-${dd}`, { shouldValidate: true })
      }
    }
  }, [watchEndDate, daysBeforeEnd, setValue])

  const today = new Date().toISOString().split('T')[0]

  const onSubmit = async (data) => {
    try {
      // Sanitize payload — convert empty strings to null, numbers to correct types
      const payload = {
        ...data,
        stipend_amount: data.stipend_amount ? parseFloat(data.stipend_amount) : 7000,
        graduation_year: data.graduation_year ? parseInt(data.graduation_year) : null,
        reporting_manager_id: data.reporting_manager_id || null,
        review_due_date: data.review_due_date || null,
        candidate_mobile: data.candidate_mobile || null,
        other_assets: data.other_assets || null,
        notes_for_accounts: data.notes_for_accounts || null,
        source: data.source || null,
        candidate_name: data.candidate_name || null,
        candidate_gender: data.candidate_gender || null,
        institute_name: data.institute_name || null,
        qualification: data.qualification || null,
        course: data.course || null,
        year_of_study: data.year_of_study || null,
        candidate_city: data.candidate_city || null,
        candidate_state: data.candidate_state || null,
      }
      const res = await hrApi.initiateIntern(payload)
      toast.success('Intern initiated! Portal link sent to candidate.')
      navigate(`/hr/intern/${res.data.id}`)
    } catch (err) {
      // Extract detailed error message from 422 validation errors
      const errData = err.response?.data
      let message = 'Failed to initiate intern'
      if (errData?.detail) {
        if (typeof errData.detail === 'string') {
          message = errData.detail
        } else if (Array.isArray(errData.detail)) {
          // Pydantic validation errors — show first error clearly
          message = errData.detail.map(e => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join(', ')
        }
      }
      toast.error(message, { duration: 6000 })
      console.error('Initiate intern error:', errData)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Initiate New Intern"
        subtitle="Fill details below. A secure portal link will be emailed to the candidate automatically."
      />
      <form onSubmit={handleSubmit(onSubmit, (errs) => {
          const firstErrKey = Object.keys(errs)[0]
          const el = document.querySelector(`[name="${firstErrKey}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          toast.error('Please fix the errors highlighted in red before submitting', { duration: 4000 })
        })} className="space-y-6">

        {/* f: Candidate Details first */}
        <SectionCard title="Candidate Details (Pre-fill for Offer Letter)">
          <p className="text-xs text-slate-400 mb-4">
            Optional — fill if known, so the offer letter can be generated before the candidate completes the portal.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input className="input" placeholder="e.g. Niket Totala" {...register('candidate_name')} />
            </Field>
            <Field label="Gender">
              <select className="input" {...register('candidate_gender')}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Mobile" error={errors.candidate_mobile?.message}>
              <input
                className="input" type="tel" placeholder="e.g. 9876543210"
                {...register('candidate_mobile', {
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Enter valid 10-digit mobile number' }
                })}
              />
            </Field>
            <Field label="Institute Name">
              <input className="input" placeholder="e.g. VJTI Mumbai" {...register('institute_name')} />
            </Field>
            <Field label="Qualification">
              <input className="input" placeholder="e.g. B.Tech, MBA" {...register('qualification')} />
            </Field>
            <Field label="Course">
              <input className="input" placeholder="e.g. Mechanical Engineering" {...register('course')} />
            </Field>
            <Field label="Year of Study">
              <input className="input" placeholder="e.g. 3rd Year" {...register('year_of_study')} />
            </Field>
            <Field label="Graduation Year" error={errors.graduation_year?.message}>
              <input
                type="number" className="input" placeholder="e.g. 2026"
                {...register('graduation_year', {
                  valueAsNumber: true,
                  min: { value: 2020, message: 'Enter a valid graduation year' },
                  max: { value: 2035, message: 'Enter a valid graduation year' }
                })}
              />
            </Field>
            <Field label="City">
              <input className="input" placeholder="e.g. Mumbai" {...register('candidate_city')} />
            </Field>
            <Field label="State">
              <input className="input" placeholder="e.g. Maharashtra" {...register('candidate_state')} />
            </Field>
          </div>
        </SectionCard>

        {/* f: Candidate & Role second */}
        <SectionCard title="Candidate & Role Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Candidate Email" required error={errors.candidate_email?.message}>
                <input
                  className="input" type="email" placeholder="candidate@college.edu"
                  {...register('candidate_email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' }
                  })}
                />
              </Field>
            </div>
            <Field label="Role / Title" required error={errors.role_title?.message}>
              <input
                className="input" placeholder="e.g. R&D Intern"
                {...register('role_title', { required: 'Role title is required' })}
              />
            </Field>
            <Field label="Department" required error={errors.department?.message}>
              <select className="input" {...register('department', { required: 'Department is required' })}>
                <option value="">Select department...</option>
                {(masters.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Location" required error={errors.location?.message}>
              <select className="input" {...register('location', { required: 'Location is required' })}>
                <option value="">Select location...</option>
                {(masters.locations || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Source (Optional)">
              <input className="input" placeholder="e.g. VJTI, IIM Shillong, Referral" {...register('source')} />
            </Field>
          </div>
        </SectionCard>

        {/* f: Internship Duration third */}
        {/* f: Internship Duration third */}
<SectionCard title="Internship Duration">
  <div className="grid grid-cols-2 gap-4">

    {/* Start Date */}
    <Field label="Start Date" required error={errors.start_date?.message}>
      <DatePicker
        className="input w-full"
        dateFormat="dd/MM/yyyy"
        minDate={new Date()}
        selected={watchStartDate ? new Date(watchStartDate) : null}
        onChange={date => {
          const val = date ? date.toISOString().split('T')[0] : ''
          setValue('start_date', val, { shouldValidate: true })
          trigger('end_date')
          trigger('review_due_date')
        }}
        placeholderText="DD/MM/YYYY"
      />
      <input type="hidden" {...register('start_date', {
        required: 'Start date is required',
        validate: v => v >= today || 'Start date cannot be before today',
      })} />
      {!errors.start_date && <p className="text-xs text-slate-400 mt-1"></p>}
    </Field>

    {/* End Date */}
    <Field label="End Date" required error={errors.end_date?.message}>
      <DatePicker
        className="input w-full"
        dateFormat="dd/MM/yyyy"
        minDate={watchStartDate ? new Date(watchStartDate) : new Date()}
        selected={watchEndDate ? new Date(watchEndDate) : null}
        onChange={date => {
          const val = date ? date.toISOString().split('T')[0] : ''
          setValue('end_date', val, { shouldValidate: true })
          trigger('review_due_date')
        }}
        placeholderText="DD/MM/YYYY"
      />
      <input type="hidden" {...register('end_date', {
        required: 'End date is required',
        validate: v => {
          const start = watch('start_date')
          if (!v) return 'End date is required'
          if (start && v <= start) return 'End date must be after start date'
          if (v <= today) return 'End date must be in the future'
          const diffDays = (new Date(v) - new Date(start)) / (1000 * 60 * 60 * 24)
          if (diffDays < 7) return 'Internship must be at least 1 week'
          return true
        },
      })} />
      {!errors.end_date && <p className="text-xs text-slate-400 mt-1"></p>}
    </Field>

    <Field label="Stipend Amount (₹/month)" error={errors.stipend_amount?.message}>
      <input
        type="number" className="input"
        placeholder="Enter amount or pick template below"
        {...register('stipend_amount', {
          min: { value: 0, message: 'Stipend cannot be negative' },
          max: { value: 100000, message: 'Stipend seems too high, please verify' }
        })}
      />
      {/* {(masters.stipend_templates || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(masters.stipend_templates || []).map(t => (
            <button
              key={t.label} type="button"
              onClick={() => setValue('stipend_amount', t.amount)}
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
            >
              {t.label}: ₹{t.amount.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )} */}
    </Field>

    <Field label="Reporting Manager" required error={errors.reporting_manager_id?.message}>
      <select
        className="input"
        {...register('reporting_manager_id', { required: 'Reporting manager is required' })}
      >
        <option value="">Select manager...</option>
        {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </Field>

    {/* Manager Review Date */}
    <div className="col-span-2">
      <div className="flex items-end gap-3 mb-2">
        <div className="flex-1">
          <Field label="Manager Review Date" required error={errors.review_due_date?.message}>
            <DatePicker
              className="input w-full"
              dateFormat="dd/MM/yyyy"
              minDate={watchStartDate ? new Date(watchStartDate) : new Date()}
              maxDate={watchEndDate ? new Date(new Date(watchEndDate).setDate(new Date(watchEndDate).getDate() - 1)) : null}
              selected={watch('review_due_date') ? new Date(watch('review_due_date')) : null}
              onChange={date => {
                const val = date ? date.toISOString().split('T')[0] : ''
                setValue('review_due_date', val, { shouldValidate: true })
              }}
              placeholderText="DD/MM/YYYY"
            />
            <input type="hidden" {...register('review_due_date', {
              required: 'Manager review date is required',
              validate: v => {
                const start = watch('start_date')
                const end = watch('end_date')
                if (!v) return 'Manager review date is required'
                if (start && v < start) return 'Cannot be before start date'
                if (end && v >= end) return 'Must be before end date'
                return true
              }
            })} />
          </Field>
        </div>
        <div className="flex flex-col gap-1 pb-0.5">
          <label className="text-xs text-slate-500 font-medium">Days before end date</label>
          <div className="flex items-center gap-2">
            <input
              type="number" min={0} max={365}
              value={daysBeforeEnd}
              onChange={e => setDaysBeforeEnd(Number(e.target.value))}
              className="input w-20 text-center"
            />
            <span className="text-xs text-slate-400">days</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Date by which manager must complete evaluation. Default is 7 days before end date.
      </p>
    </div>

  </div>
</SectionCard>

        {/* f: Assets & Provisioning last */}
        <SectionCard title="Assets & Provisioning">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <input type="checkbox" id="laptop" className="w-4 h-4 text-indigo-600" {...register('laptop_required')} />
              <label htmlFor="laptop" className="text-sm font-medium text-slate-700">Laptop Required</label>
            </div>
            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <input type="checkbox" id="email" className="w-4 h-4 text-indigo-600" {...register('corporate_email_required')} />
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Corporate Email (ABG) Required</label>
            </div>
            <div className="col-span-2">
              <Field label="Other Assets">
                <input className="input" placeholder="e.g. Access card, Lab equipment" {...register('other_assets')} />
              </Field>
            </div>
            {/* <div className="col-span-2">
              <Field label="Notes for Accounts Team">
                <textarea
                  rows={3} className="input"
                  placeholder="Any special instructions for stipend processing..."
                  {...register('notes_for_accounts')}
                />
              </Field>
            </div> */}
          </div>
        </SectionCard>

        {/* e: Submit — react-hook-form will show all validation errors inline */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
            {isSubmitting ? 'Initiating...' : 'Initiate & Send Portal Link'}
          </button>
        </div>

      </form>
    </div>
  )
}