import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { managerApi } from '../../api'
import { useForm } from 'react-hook-form'
import { PageHeader, SectionCard, Field, Spinner, StatusBadge } from '../../components/ui'
import { Star, CheckCircle, User, Calendar, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays } from 'date-fns'

// Interactive star rating component
function StarRating({ label, name, register, watch, setValue, errors }) {
  const value = parseInt(watch(name) || 0)
  const [hovered, setHovered] = useState(0)

  const LABELS = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Good', 5: 'Excellent' }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label} *</label>
        {(hovered || value) > 0 && (
          <span className="text-xs font-semibold text-amber-600">
            {LABELS[hovered || value]}
          </span>
        )}
      </div>
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setValue(name, n, { shouldValidate: true })}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star className={`w-8 h-8 transition-colors
              ${n <= (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-200 fill-slate-100'}`}
            />
          </button>
        ))}
        <input type="hidden" {...register(name, { required: true, min: 1 })} />
      </div>
      {errors[name] && <p className="text-xs text-red-600">Please select a rating</p>}
    </div>
  )
}

function ReviewDisplay({ review, intern }) {
  const RATING_LABELS = { 1:'Poor', 2:'Below Average', 3:'Average', 4:'Good', 5:'Excellent' }
  const RECOMMEND_STYLE = {
    confirm:     'bg-green-50 text-green-700 border-green-200',
    extend:      'bg-blue-50 text-blue-700 border-blue-200',
    not_confirm: 'bg-red-50 text-red-700 border-red-200',
  }
  const RECOMMEND_LABEL = {
    confirm: 'Confirm — Offer Employment',
    extend: 'Extend Internship',
    not_confirm: 'Do Not Confirm',
  }

  const ratings = [
    ['Performance',   review.performance_rating],
    ['Attitude',      review.attitude_rating],
    ['Punctuality',   review.punctuality_rating],
    ['Technical',     review.technical_rating],
    ['Communication', review.communication_rating],
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={intern?.candidate_name || 'Review Submitted'}
        subtitle={`${intern?.role_title || ''} · ${intern?.department || ''}`}
        action={<span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />Review Submitted
        </span>}
      />

      {/* Candidate info */}
      {intern && (
        <SectionCard title="Candidate">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              ['Name', intern.candidate_name],
              ['Institute', intern.institute_name],
              ['Course', intern.course],
              ['Period', intern.start_date ? `${format(new Date(intern.start_date),'dd/MM/yy')} → ${format(new Date(intern.end_date),'dd/MM/yy')}` : '—'],
            ].map(([k,v]) => (
              <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800">{v||'—'}</p></div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Overall rating */}
      <div className="card p-6 text-center bg-amber-50 border-amber-100">
        <p className="text-xs text-amber-600 mb-2">Overall Rating</p>
        <div className="flex justify-center gap-1 mb-2">
          {[1,2,3,4,5].map(n => (
            <Star key={n} className={`w-7 h-7 ${n <= review.overall_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
          ))}
        </div>
        <p className="text-2xl font-bold text-amber-900">{review.overall_rating}/5</p>
        <p className="text-sm text-amber-700">{RATING_LABELS[review.overall_rating]}</p>
      </div>

      {/* All ratings */}
      <SectionCard title="Performance Ratings">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ratings.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-600">{label}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-4 h-4 ${n <= val ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-700 w-4">{val}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Project */}
      <SectionCard title="Project Details">
        <div className="space-y-3">
          <div><p className="text-xs text-slate-500">Project Title</p><p className="font-medium text-slate-800 mt-0.5">{review.project_name}</p></div>
          <div><p className="text-xs text-slate-500">Guide(s)</p><p className="font-medium text-slate-800 mt-0.5">{review.guide_names}</p></div>
          <div><p className="text-xs text-slate-500">Detailed Feedback</p><p className="text-slate-700 mt-1 leading-relaxed">{review.feedback_text}</p></div>
        </div>
      </SectionCard>

      {/* Recommendation */}
      <SectionCard title="Recommendation">
        <div className={`p-4 rounded-xl border ${RECOMMEND_STYLE[review.recommendation] || 'bg-slate-50 border-slate-200'}`}>
          <p className="font-semibold capitalize">{RECOMMEND_LABEL[review.recommendation] || review.recommendation}</p>
        </div>
      </SectionCard>

      {/* Tracker */}
      <SectionCard title="Completion Checklist">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['Project Submitted',    review.project_submission],
            ['Project Presented',    review.project_presentation],
            ['Panel Evaluation Done',review.panel_evaluation],
          ].map(([label, done]) => (
            <div key={label} className={`flex items-center gap-2 p-3 rounded-lg border
              ${done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
              {done
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
              <span className={`text-xs font-medium ${done ? 'text-green-700' : 'text-slate-500'}`}>{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <p className="text-xs text-slate-400 text-center">
        Submitted on {review.submitted_at ? format(new Date(review.submitted_at + 'Z'), 'dd/MM/yyyy, hh:mm a') : '—'}
      </p>
    </div>
  )
}

export default function ManagerReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm()
  const [intern, setIntern] = useState(null)
  const [existing, setExisting] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      managerApi.getInternDetail(id),
      managerApi.getReview(id),
    ])
      .then(([internRes, reviewRes]) => {
        setIntern(internRes.data)
        setExisting(reviewRes.data)
      })
      .catch(err => {
        if (err.response?.status === 403) {
          toast.error('You are not the manager of this intern')
          navigate('/manager/dashboard')
        } else {
          toast.error('Failed to load data')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const onSubmit = async (data) => {
    if (!data.overall_rating) {
      toast.error('Please select an overall rating')
      return
    }
    try {
      await managerApi.submitReview(id, {
        project_name: data.project_name,
        guide_names: data.guide_names,
        performance_rating:   parseInt(data.performance_rating),
        attitude_rating:      parseInt(data.attitude_rating),
        punctuality_rating:   parseInt(data.punctuality_rating),
        technical_rating:     parseInt(data.technical_rating),
        communication_rating: parseInt(data.communication_rating),
        overall_rating:       parseInt(data.overall_rating),
        feedback_text:        data.feedback_text,
        recommendation:       data.recommendation,
        // eval_from_mgr:        !!data.eval_from_mgr,
        panel_evaluation:     !!data.panel_evaluation,
        project_submission:   !!data.project_submission,
        project_presentation: !!data.project_presentation,
      })
      toast.success('Review submitted successfully!')
      navigate('/manager/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review')
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  // Show submitted review
  if (existing?.submitted_at) return <ReviewDisplay review={existing} intern={intern} />

  // b: Block review form if review_due_date not yet reached
  const reviewUnlocked = intern?.review_due_date ? new Date() >= new Date(intern.review_due_date) : true

  if (!reviewUnlocked) {
    return (
      <div className="max-w-3xl space-y-6">
        <PageHeader
          title={`Evaluate: ${intern?.candidate_name || intern?.candidate_email || 'Intern'}`}
          subtitle={`${intern?.role_title || ''} · ${intern?.department || ''} · ${intern?.location || ''}`}
        />
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Review Not Yet Available</p>
            <p className="text-sm text-amber-700 mt-1">
              The review form will be unlocked on{' '}
              <strong>{format(new Date(intern.review_due_date), 'dd/MM/yyyy')}</strong>.
              Please come back on or after that date to submit your evaluation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const daysLeft = intern?.end_date ? differenceInDays(new Date(intern.end_date), new Date()) : null

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={`Evaluate: ${intern?.candidate_name || intern?.candidate_email || 'Intern'}`}
        subtitle={`${intern?.role_title || ''} · ${intern?.department || ''} · ${intern?.location || ''}`}
      />

      {/* Days remaining warning */}
      {daysLeft !== null && daysLeft <= 7 && (
        <div className={`p-4 rounded-xl border flex items-start gap-3
          ${daysLeft <= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${daysLeft <= 3 ? 'text-red-500' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm font-bold ${daysLeft <= 3 ? 'text-red-800' : 'text-amber-800'}`}>
              {daysLeft <= 0 ? 'Internship has ended!' : `Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining!`}
            </p>
            <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-700' : 'text-amber-700'}`}>
              Please submit the evaluation before the internship ends
            </p>
          </div>
        </div>
      )}

      {/* Candidate info card */}
      {intern && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-500 mb-3">Candidate You Are Evaluating</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Name',      intern.candidate_name],
              ['Email',     intern.candidate_email],
              ['Institute', intern.institute_name],
              ['Course',    intern.course],
              ['Role',      intern.role_title],
              ['Dept',      intern.department],
              ['Start',     intern.start_date ? format(new Date(intern.start_date), 'dd/MM/yyyy') : '—'],
              ['End',       intern.end_date   ? format(new Date(intern.end_date),   'dd/MM/yyyy') : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-400">{k}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 break-all">{v || '—'}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
            <span>Duration: {intern.duration_weeks ? `${intern.duration_weeks} weeks` : '—'}</span>
            {daysLeft !== null && daysLeft >= 0 && <span className={daysLeft <= 7 ? 'text-amber-600 font-semibold' : ''}>{daysLeft} days remaining</span>}
            <StatusBadge status={intern.status} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Details */}
        <SectionCard title="Project Details">
          <div className="space-y-4">
            <Field label="Project Title *" error={errors.project_name?.message}>
              <input className="input" placeholder="e.g. Performance Analysis of Yarn and Woven Fabric..."
                {...register('project_name', { required: 'Required' })} />
            </Field>
            <Field label="Guide / Mentor Names *" error={errors.guide_names?.message}>
              <input className="input" placeholder="e.g. Mr. Gaurav Shrivastava and Mr. Rituraj Nagpure"
                {...register('guide_names', { required: 'Required' })} />
            </Field>
          </div>
        </SectionCard>

        {/* Star Ratings */}
        <SectionCard title="Performance Ratings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              ['Performance',   'performance_rating'],
              ['Attitude',      'attitude_rating'],
              ['Punctuality',   'punctuality_rating'],
              ['Technical Skills','technical_rating'],
              ['Communication', 'communication_rating'],
              ['Overall Rating','overall_rating'],
            ].map(([label, name]) => (
              <StarRating
                key={name}
                label={label}
                name={name}
                register={register}
                watch={watch}
                setValue={setValue}
                errors={errors}
              />
            ))}
          </div>
        </SectionCard>

        {/* Feedback */}
        <SectionCard title="Feedback & Recommendation">
          <div className="space-y-4">
            <Field label="Detailed Feedback *" error={errors.feedback_text?.message}>
              <textarea
                rows={5}
                className="input"
                {...register('feedback_text', { required: 'Required', minLength: { value: 20, message: 'Please provide at least 20 characters' } })}
                placeholder="Describe the intern's performance, key contributions, strengths, areas for improvement, and overall impression..."
              />
            </Field>
            <Field label="Recommendation *" error={errors.recommendation?.message}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['confirm',     'Confirm',     'bg-green-50 border-green-300 text-green-800'],
                  ['extend',      'Extend',      'bg-blue-50 border-blue-300 text-blue-800'],
                  ['not_confirm', 'Do Not Confirm', 'bg-red-50 border-red-300 text-red-800'],
                ].map(([val, label, style]) => (
                  <label key={val} className="cursor-pointer">
                    <input type="radio" value={val} className="hidden peer"
                      {...register('recommendation', { required: true })} />
                    <div className={`p-3 border-2 rounded-lg text-center text-sm font-medium transition-all
                      peer-checked:ring-2 peer-checked:ring-offset-1 peer-checked:ring-indigo-400
                      peer-checked:${style} hover:${style} border-slate-200`}>
                      {label}
                    </div>
                  </label>
                ))}
              </div>
              {errors.recommendation && <p className="text-xs text-red-600 mt-1">Please select a recommendation</p>}
            </Field>
          </div>
        </SectionCard>

        {/* Completion Checklist */}
        <SectionCard title="Completion Checklist">
          <p className="text-xs text-slate-500 mb-4">Check all that apply at the time of this evaluation</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['project_submission',   'Project Report submitted'],
              ['project_presentation', 'Project Presentation given'],
              ['panel_evaluation',     'Panel Evaluation done'],
            ].map(([name, label]) => (
              <label key={name}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" {...register(name)} />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Submit */}
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500">Review once submitted cannot be edited</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary px-8 flex items-center gap-2">
              <Star className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}