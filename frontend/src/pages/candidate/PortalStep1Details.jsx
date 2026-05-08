import { useForm } from 'react-hook-form'
import { candidateApi } from '../../api'
import { Field, SectionCard } from '../../components/ui'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Edit3, CheckCircle } from 'lucide-react'

export default function PortalStep1Details({ token, info, onDone }) {
  const isResubmit = !!info?.portal_submitted

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({ defaultValues: { privacy_accepted: false } })

  // Pre-fill form with existing data on return visits
  useEffect(() => {
    if (info && info.portal_submitted) {
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
        year_of_study: info.year_of_study || '',
        graduation_year: info.graduation_year || '',
        bank_name: info.bank_name || '',
        account_number: info.account_number || '',
        ifsc_code: info.ifsc_code || '',
        account_holder_name: info.account_holder_name || '',
        account_type: info.account_type || 'savings',
        privacy_accepted: true, // Already accepted on first submission — pre-tick on return
      })
    }
  }, [info, reset])

  const onSubmit = async (data) => {
    try {
      await candidateApi.submitPortal(token, {
        privacy_accepted: data.privacy_accepted,
        personal: {
          full_name: data.full_name, gender: data.gender, dob: data.dob,
          mobile: data.mobile, contact_no: data.contact_no, address: data.address,
          city: data.city, state: data.state, pincode: data.pincode,
          pan_card_no: data.pan_card_no, aadhaar_no: data.aadhaar_no,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
        },
        academic: {
          institute_name: data.institute_name, qualification: data.qualification,
          course: data.course, year_of_study: data.year_of_study,
          graduation_year: parseInt(data.graduation_year),
        },
        bank: {
          bank_name: data.bank_name, account_number: data.account_number,
          ifsc_code: data.ifsc_code, account_holder_name: data.account_holder_name,
          account_type: data.account_type,
        },
      })
      toast.success(isResubmit ? 'Details updated successfully!' : 'Details submitted successfully!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    }
  }

  const R = (msg = 'Required') => ({ required: msg })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Edit notice if returning */}
      {isResubmit && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Edit3 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Editing your details</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Your previously submitted details are pre-filled. Make any changes and click Save to update.
            </p>
          </div>
        </div>
      )}

      <SectionCard title="Personal Details">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Full Name" required error={errors.full_name?.message}>
              <input className="input" {...register('full_name', R())} placeholder="As per official ID" />
            </Field>
          </div>
          <Field label="Gender" required error={errors.gender?.message}>
            <select className="input" {...register('gender', R())}>
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Date of Birth" required error={errors.dob?.message}>
            <input type="date" className="input" {...register('dob', R())} />
          </Field>
          <Field label="Mobile" required error={errors.mobile?.message}>
            <input className="input" {...register('mobile', R())} placeholder="10-digit number" />
          </Field>
          <Field label="Alternate Contact">
            <input className="input" {...register('contact_no')} />
          </Field>
          <div className="col-span-2">
            <Field label="Address" required error={errors.address?.message}>
              <textarea className="input" rows={2} {...register('address', R())} />
            </Field>
          </div>
          <Field label="City" required error={errors.city?.message}>
            <input className="input" {...register('city', R())} />
          </Field>
          <Field label="State" required error={errors.state?.message}>
            <input className="input" {...register('state', R())} />
          </Field>
          <Field label="Pincode" required error={errors.pincode?.message}>
            <input className="input" {...register('pincode', R())} />
          </Field>
          <Field label="PAN Card No." required error={errors.pan_card_no?.message}>
            <input className="input" {...register('pan_card_no', R())} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Aadhaar No." required error={errors.aadhaar_no?.message}>
            <input className="input" {...register('aadhaar_no', R())} placeholder="12-digit number" />
          </Field>
          <Field label="Emergency Contact Name" required error={errors.emergency_contact_name?.message}>
            <input className="input" {...register('emergency_contact_name', R())} />
          </Field>
          <Field label="Emergency Contact Phone" required error={errors.emergency_contact_phone?.message}>
            <input className="input" {...register('emergency_contact_phone', R())} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Academic Details">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Institute / College Name" required error={errors.institute_name?.message}>
              <input className="input" {...register('institute_name', R())} />
            </Field>
          </div>
          <Field label="Qualification" required error={errors.qualification?.message}>
            <input className="input" {...register('qualification', R())} placeholder="e.g. B.Tech, MBA" />
          </Field>
          <Field label="Course / Specialization" required error={errors.course?.message}>
            <input className="input" {...register('course', R())} placeholder="e.g. Chemical Engineering" />
          </Field>
          <Field label="Year of Study" required error={errors.year_of_study?.message}>
            <input className="input" {...register('year_of_study', R())} placeholder="e.g. 3rd Year, Final Year" />
          </Field>
          <Field label="Expected Graduation Year" required error={errors.graduation_year?.message}>
            <input type="number" className="input" {...register('graduation_year', R())} placeholder="e.g. 2026" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Bank Details (for Stipend)">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bank Name" required error={errors.bank_name?.message}>
            <input className="input" {...register('bank_name', R())} />
          </Field>
          <Field label="Account Type" required>
            <select className="input" {...register('account_type', R())}>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
            </select>
          </Field>
          <Field label="Account Number" required error={errors.account_number?.message}>
            <input className="input" {...register('account_number', R())} />
          </Field>
          <Field label="IFSC Code" required error={errors.ifsc_code?.message}>
            <input className="input" {...register('ifsc_code', R())} placeholder="e.g. SBIN0001234" />
          </Field>
          <div className="col-span-2">
            <Field label="Account Holder Name" required error={errors.account_holder_name?.message}>
              <input className="input" {...register('account_holder_name', R())} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Privacy Policy */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <p className="text-xs font-semibold text-slate-700">Privacy Policy & Data Consent *</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          By submitting this form, you consent to Grasim Industries Ltd. collecting, storing, and processing
          your personal information (including PAN, Aadhaar, bank details) for internship onboarding purposes.
          Your data will be kept confidential and used only for HR and payroll processing. You may contact
          HR to request deletion of your data after the internship period.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 mt-0.5 text-indigo-600 flex-shrink-0"
            {...register('privacy_accepted', { required: 'You must accept the privacy policy to continue' })} />
          <span className="text-xs text-slate-700">
            I have read and agree to the <strong>Privacy Policy</strong>. I consent to Grasim Industries
            processing my personal data as described above. *
          </span>
        </label>
        {errors.privacy_accepted && (
          <p className="text-xs text-red-600">{errors.privacy_accepted.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {isResubmit ? 'You can update your details at any time before the offer is accepted.' : 'All fields marked * are required.'}
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