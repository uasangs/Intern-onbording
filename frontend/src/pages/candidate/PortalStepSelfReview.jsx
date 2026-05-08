import { useState } from 'react'
import { candidateApi } from '../../api'
import { SectionCard } from '../../components/ui'
import { Star, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import toast from 'react-hot-toast'

function StarRating({ label, value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {(hovered || value) > 0 && (
          <span className="text-xs text-amber-600 font-semibold">{LABELS[hovered || value]}</span>
        )}
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button key={n} type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`w-7 h-7 transition-colors ${n <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PortalStepSelfReview({ token, onDone }) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ratings, setRatings] = useState({
    overall_experience: 0,
    learning_rating: 0,
    mentorship_rating: 0,
    facilities_rating: 0,
    work_culture_rating: 0,
  })
  const [form, setForm] = useState({
    key_learnings: '',
    challenges_faced: '',
    suggestions: '',
    overall_feedback: '',
    would_recommend: true,
  })

  const setRating = (key, val) => setRatings(p => ({ ...p, [key]: val }))
  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async () => {
    // Validate
    const missingRatings = Object.entries(ratings).filter(([_, v]) => v === 0)
    if (missingRatings.length > 0) {
      toast.error('Please rate all categories')
      return
    }
    if (!form.key_learnings.trim()) {
      toast.error('Please fill in key learnings')
      return
    }
    if (!form.overall_feedback.trim()) {
      toast.error('Please fill in overall feedback')
      return
    }

    setSubmitting(true)
    try {
      await candidateApi.submitSelfReview(token, { ...ratings, ...form })
      toast.success('Review submitted! Thank you for your feedback.')
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  if (submitted) return (
    <div className="text-center py-16 space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <p className="text-xl font-bold text-slate-800">Thank you for your feedback!</p>
      <p className="text-sm text-slate-500">Your review has been submitted and will be shared with HR.</p>
      <button onClick={onDone} className="btn-primary px-8 mt-4">Continue</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">Internship Self-Evaluation</p>
        <p className="text-xs text-amber-700">Please share your honest feedback about your internship experience. This helps Grasim improve the program for future interns.</p>
      </div>

      <SectionCard title="Rate Your Experience">
        <div className="grid grid-cols-1 gap-5">
          <StarRating label="Overall Experience" value={ratings.overall_experience} onChange={v => setRating('overall_experience', v)} />
          <StarRating label="Learning & Skill Development" value={ratings.learning_rating} onChange={v => setRating('learning_rating', v)} />
          <StarRating label="Mentorship & Guidance" value={ratings.mentorship_rating} onChange={v => setRating('mentorship_rating', v)} />
          <StarRating label="Facilities & Work Environment" value={ratings.facilities_rating} onChange={v => setRating('facilities_rating', v)} />
          <StarRating label="Work Culture & Team" value={ratings.work_culture_rating} onChange={v => setRating('work_culture_rating', v)} />
        </div>
      </SectionCard>

      <SectionCard title="Your Feedback">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Key Learnings *</label>
            <textarea className="input" rows={3}
              placeholder="What were the most valuable things you learned during this internship?"
              value={form.key_learnings} onChange={e => setField('key_learnings', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Challenges Faced</label>
            <textarea className="input" rows={2}
              placeholder="Any challenges or difficulties you encountered?"
              value={form.challenges_faced} onChange={e => setField('challenges_faced', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Suggestions for Improvement</label>
            <textarea className="input" rows={2}
              placeholder="How can Grasim improve the internship program?"
              value={form.suggestions} onChange={e => setField('suggestions', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Overall Feedback *</label>
            <textarea className="input" rows={3}
              placeholder="Share your overall experience and any other thoughts..."
              value={form.overall_feedback} onChange={e => setField('overall_feedback', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Would you recommend this internship to others?</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setField('would_recommend', true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${form.would_recommend ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                <ThumbsUp className="w-4 h-4" />Yes, definitely
              </button>
              <button type="button" onClick={() => setField('would_recommend', false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${!form.would_recommend ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                <ThumbsDown className="w-4 h-4" />No
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary px-8 flex items-center gap-2">
          <Star className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'Submit My Review'}
        </button>
      </div>
    </div>
  )
}