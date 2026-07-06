import { useForm } from 'react-hook-form'
import { candidateApi } from '../../api'
import { Field, SectionCard } from '../../components/ui'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { Edit3, CheckCircle, Lock } from 'lucide-react'

// ── Input restriction helpers ─────────────────────────────────────────────────
const onlyDigits = (e) => {
  if (!/[\d]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) {
    e.preventDefault()
  }
}
const onlyLetters = (e) => {
  if (!/[a-zA-Z\s]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) {
    e.preventDefault()
  }
}
const onlyAlphanumeric = (e) => {
  if (!/[a-zA-Z0-9]/.test(e.key) && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)) {
    e.preventDefault()
  }
}
const maxLen = (max) => (e) => {
  const input = e.target
  if (input.value.length >= max && !['Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key) && input.selectionStart === input.selectionEnd) {
    e.preventDefault()
  }
}
const combine = (...fns) => (e) => fns.forEach(fn => fn(e))

// Format aadhaar for display: 123456789012 → 1234-5678-9012
const formatAadhaar = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join('-')
  )
}

// Locked field display (for HR-prefilled fields)
function LockedField({ label, value }) {
  return (
    <div>
      <label className="label flex items-center gap-1">
        {label}
        <Lock className="w-3 h-3 text-slate-400" />
      </label>
      <div className="input bg-slate-50 text-slate-600 cursor-not-allowed flex items-center">
        {value || '—'}
      </div>
      <p className="text-xs text-slate-400 mt-1">Filled by HR — contact HR to correct</p>
    </div>
  )
}

export default function PortalStep1Details({ token, info, onDone }) {
  const isResubmit = !!info?.portal_submitted
  const hrFields = info?.hr_prefilled_fields || []
  // HR-filled fields are ALWAYS locked — whether first visit or return visit
  const isLocked = (field) => hrFields.includes(field)

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { privacy_accepted: false },
    mode: 'onTouched',
  })

  const today = new Date().toISOString().split('T')[0]

  // a: Pre-fill from HR data on FIRST visit too (not just return visits)
  useEffect(() => {
    if (info) {
      reset({
        full_name: info.candidate_name || '',
        gender: info.gender || '',
        dob: info.dob || '',
        mobile: info.mobile || '',
        contact_no: info.contact_no || '',
        address: info.address || '',
        city: info.city || '',
        state: info.state || '',
        pincode: info.pincode || '',
        pan_card_no: info.pan_card_no || '',
        aadhaar_no: info.aadhaar_no || '',
        emergency_contact_name: info.emergency_contact_name || '',
        emergency_contact_phone: info.emergency_contact_phone || '',
        institute_name: info.institute_name || '',
        qualification: info.qualification || '',
        course: info.course || '',
        year_of_study: info.year_of_study ? String(info.year_of_study) : '',
        graduation_year: info.graduation_year || '',
        bank_name: info.bank_name || '',
        account_number: info.account_number || '',
        ifsc_code: info.ifsc_code || '',
        account_holder_name: info.account_holder_name || '',
        account_type: info.account_type || 'savings',
        privacy_accepted: true,
      })
    }
  }, [info, reset, isResubmit])

  const onSubmit = async (data) => {
    try {
      await candidateApi.submitPortal(token, {
        privacy_accepted: true,
        personal: {
          full_name: data.full_name, gender: data.gender, dob: data.dob,
          mobile: data.mobile, contact_no: data.contact_no, address: data.address,
          city: data.city, state: data.state, pincode: data.pincode,
          pan_card_no: data.pan_card_no?.toUpperCase(),
          aadhaar_no: (data.aadhaar_no || '').replace(/-/g, ''), // strip dashes before saving
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
        },
        academic: {
          institute_name: data.institute_name, qualification: data.qualification,
          course: data.course, year_of_study: data.year_of_study,
          graduation_year: parseInt(data.graduation_year),
        },
        bank: info?.stipend_amount > 0 ? {
  bank_name: data.bank_name, account_number: data.account_number,
  ifsc_code: data.ifsc_code?.toUpperCase(), account_holder_name: data.account_holder_name,
  account_type: data.account_type,
} : {
  bank_name: '', account_number: '', ifsc_code: '',
  account_holder_name: '', account_type: 'savings',
},
      })
      toast.success(isResubmit ? 'Details updated successfully!' : 'Details submitted successfully!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

     
      {isResubmit && hrFields.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Edit3 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Editing your details</p>
            <p className="text-xs text-blue-600 mt-0.5">Your previously submitted details are pre-filled. Make any changes and click Save to update.</p>
          </div>
        </div>
      )}

      {/* ── Personal Details ──────────────────────────────────────── */}
      <SectionCard title="Personal Details">
        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            {isLocked('full_name') ? (
              <LockedField label="Full Name" value={info.candidate_name} />
            ) : (
              <Field label="Full Name" required error={errors.full_name?.message}>
                <input className="input" placeholder="As per official ID"
                  onKeyDown={onlyLetters}
                  {...register('full_name', {
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  })} />
              </Field>
            )}
          </div>

          {isLocked('gender') ? (
            <LockedField label="Gender" value={info.gender} />
          ) : (
            <Field label="Gender" required error={errors.gender?.message}>
              <select className="input" {...register('gender', { required: 'Please select gender' })}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
          )}

          <Field label="Date of Birth" required error={errors.dob?.message}>
           <input type="date" className="input" max={(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().split('T')[0]
})()}
  {...register('dob', {
    required: 'Date of birth is required',
    validate: v => {
      if (!v) return 'Date of birth is required'
      const dob = new Date(v)
      const minAge = new Date()
      minAge.setFullYear(minAge.getFullYear() - 18)
      if (dob > minAge) return 'You must be at least 18 years old'
      return true
    },
  })} />
          </Field>

          {isLocked('mobile') ? (
            <LockedField label="Mobile" value={info.mobile} />
          ) : (
            <Field label="Mobile" required error={errors.mobile?.message}>
              <input className="input" placeholder="10-digit mobile number" maxLength={10}
                onKeyDown={combine(onlyDigits, maxLen(10))}
                {...register('mobile', {
                  required: 'Mobile number is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Must start with 6–9 and be 10 digits' },
                })} />
            </Field>
          )}

          <Field label="Alternate Contact" error={errors.contact_no?.message}>
            <input className="input" placeholder="10-digit number (optional)" maxLength={10}
              onKeyDown={combine(onlyDigits, maxLen(10))}
              {...register('contact_no', {
                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit number' },
              })} />
          </Field>

          <div className="col-span-2">
            <Field label="Address" required error={errors.address?.message}>
              <textarea className="input" rows={2} placeholder="Full residential address"
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 10, message: 'Please enter a complete address' },
                })} />
            </Field>
          </div>

          {isLocked('city') ? (
            <LockedField label="City" value={info.city} />
          ) : (
            <Field label="City" required error={errors.city?.message}>
              <input className="input" placeholder="e.g. Mumbai"
                onKeyDown={onlyLetters}
                {...register('city', { required: 'City is required' })} />
            </Field>
          )}

          {isLocked('state') ? (
            <LockedField label="State" value={info.state} />
          ) : (
            <Field label="State" required error={errors.state?.message}>
              <input className="input" placeholder="e.g. Maharashtra"
                onKeyDown={onlyLetters}
                {...register('state', { required: 'State is required' })} />
            </Field>
          )}

          <Field label="Pincode" required error={errors.pincode?.message}>
            <input className="input" placeholder="6-digit pincode" maxLength={6}
              onKeyDown={combine(onlyDigits, maxLen(6))}
              {...register('pincode', {
                required: 'Pincode is required',
                pattern: { value: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' },
              })} />
          </Field>

          <Field label="PAN Card No." required error={errors.pan_card_no?.message}>
            <input className="input" placeholder="e.g. ABCDE1234F" maxLength={10}
              style={{ textTransform: 'uppercase' }}
              onKeyDown={combine(onlyAlphanumeric, maxLen(10))}
              {...register('pan_card_no', {
                required: 'PAN card number is required',
                pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, message: 'Invalid PAN — format must be ABCDE1234F' },
              })} />
          </Field>

          {/* g-iv: Aadhaar shown as 1234-5678-9012 */}
          <Field label="Aadhaar No." required error={errors.aadhaar_no?.message}>
           <input className="input" placeholder="1234-5678-9012"
  maxLength={14}
  onKeyDown={combine(onlyDigits, maxLen(14))}
  {...register('aadhaar_no', {
    required: 'Aadhaar number is required',
    validate: v => (v || '').replace(/-/g, '').length === 12 || 'Aadhaar must be exactly 12 digits',
    onChange: e => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 12)
      const formatted = raw.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join('-')
      )
      setValue('aadhaar_no', formatted, { shouldValidate: true })
    }
  })} />
          </Field>

          <Field label="Emergency Contact Name" required error={errors.emergency_contact_name?.message}>
            <input className="input" placeholder="Name of emergency contact"
              onKeyDown={onlyLetters}
              {...register('emergency_contact_name', {
                required: 'Emergency contact name is required',
                minLength: { value: 2, message: 'Please enter a valid name' },
              })} />
          </Field>

          <Field label="Emergency Contact Phone" required error={errors.emergency_contact_phone?.message}>
            <input className="input" placeholder="10-digit phone number" maxLength={10}
              onKeyDown={combine(onlyDigits, maxLen(10))}
              {...register('emergency_contact_phone', {
                required: 'Emergency contact phone is required',
                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' },
              })} />
          </Field>

        </div>
      </SectionCard>

      {/* ── Academic Details ──────────────────────────────────────── */}
      <SectionCard title="Academic Details">
        <div className="grid grid-cols-2 gap-4">

          <div className="col-span-2">
            {isLocked('institute_name') ? (
              <LockedField label="Institute / College Name" value={info.institute_name} />
            ) : (
              <Field label="Institute / College Name" required error={errors.institute_name?.message}>
                <input className="input" placeholder="e.g. VJTI Mumbai"
                  {...register('institute_name', {
                    required: 'Institute name is required',
                    minLength: { value: 3, message: 'Please enter full institute name' },
                  })} />
              </Field>
            )}
          </div>

          {isLocked('qualification') ? (
            <LockedField label="Qualification" value={info.qualification} />
          ) : (
            <Field label="Qualification" required error={errors.qualification?.message}>
              <input className="input" placeholder="e.g. B.Tech, MBA"
                {...register('qualification', { required: 'Qualification is required' })} />
            </Field>
          )}

          {isLocked('course') ? (
            <LockedField label="Course / Specialization" value={info.course} />
          ) : (
            <Field label="Course / Specialization" required error={errors.course?.message}>
              <input className="input" placeholder="e.g. Chemical Engineering"
                {...register('course', { required: 'Course is required' })} />
            </Field>
          )}

          {isLocked('year_of_study') ? (
            <LockedField label="Year of Study" value={info.year_of_study} />
          ) : (
            <Field label="Year of Study" required error={errors.year_of_study?.message}>
              <input className="input" placeholder="e.g. 1st Year, 2nd Year, Final Year"
                {...register('year_of_study', {
                  required: 'Year of study is required',
                })} />
            </Field>
          )}

          {isLocked('graduation_year') ? (
            <LockedField label="Expected Graduation Year" value={info.graduation_year} />
          ) : (
            <Field label="Expected Graduation Year" required error={errors.graduation_year?.message}>
              <input type="number" className="input" placeholder="e.g. 2026"
                onKeyDown={combine(onlyDigits, maxLen(4))}
                {...register('graduation_year', {
                  required: 'Graduation year is required',
                  min: { value: 2020, message: 'Year seems too early' },
                  max: { value: 2035, message: 'Year seems too far ahead' },
                })} />
            </Field>
          )}

        </div>
      </SectionCard>

        {/* ── Bank Details — only show if stipend > 0 ─────────────── */}
      {info?.stipend_amount > 0 && (
        <SectionCard title="Bank Details (for Stipend)">
          <div className="grid grid-cols-2 gap-4">

            <Field label="Bank Name" required error={errors.bank_name?.message}>
              <input className="input" placeholder="e.g. State Bank of India"
                onKeyDown={onlyLetters}
                {...register('bank_name', {
                  required: 'Bank name is required',
                  minLength: { value: 2, message: 'Please enter full bank name' },
                })} />
            </Field>

            <Field label="Account Type" required error={errors.account_type?.message}>
              <select className="input" {...register('account_type', { required: 'Account type is required' })}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </Field>

            <Field label="Account Number" required error={errors.account_number?.message}>
              <input className="input" placeholder="9–18 digit account number" maxLength={18}
                onKeyDown={combine(onlyDigits, maxLen(18))}
                {...register('account_number', {
                  required: 'Account number is required',
                  pattern: { value: /^\d{9,18}$/, message: 'Account number must be 9–18 digits' },
                })} />
            </Field>

            <Field label="IFSC Code" required error={errors.ifsc_code?.message}>
              <input className="input" placeholder="e.g. SBIN0001234" maxLength={11}
                style={{ textTransform: 'uppercase' }}
                onKeyDown={combine(onlyAlphanumeric, maxLen(11))}
                {...register('ifsc_code', {
                  required: 'IFSC code is required',
                  pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/i, message: 'Invalid IFSC — format must be SBIN0001234' },
                })} />
            </Field>

            <div className="col-span-2">
              <Field label="Account Holder Name" required error={errors.account_holder_name?.message}>
                <input className="input" placeholder="Name as per bank records"
                  onKeyDown={onlyLetters}
                  {...register('account_holder_name', {
                    required: 'Account holder name is required',
                    minLength: { value: 2, message: 'Please enter full name as per bank records' },
                  })} />
              </Field>
            </div>

          </div>
        </SectionCard>
      )}

              
    

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {hrFields.length > 0 ? 'Fields with 🔒 were filled by HR and cannot be edited. Contact HR for corrections.' : isResubmit ? 'Update your details and click Save.' : 'All fields marked * are required.'}
        </p>
        <button type="submit" disabled={isSubmitting} className="btn-primary px-8 flex items-center gap-2">
          {isSubmitting
            ? 'Saving...'
            : isResubmit
              ? <><CheckCircle className="w-4 h-4" /> Update & Continue →</>
              : 'Save & Continue →'
          }
        </button>
      </div>
    </form>
  )
}