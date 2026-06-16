// import { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { candidateApi } from '../../api'
// import { Spinner } from '../../components/ui'
// import { Building2, CheckCircle, ChevronLeft } from 'lucide-react'
// import toast from 'react-hot-toast'
// import PortalStep1Details from './PortalStep1Details'
// import PortalStep2Documents from './PortalStep2Documents'
// import PortalStep3Annexures from './PortalStep3Annexures'
// import PortalStep4Offer from './PortalStep4Offer'
// import PortalStepSummary from './PortalStepSummary'
// import PortalStepSelfReview from './PortalStepSelfReview'

// const STEPS = [
//   { id: 1, label: 'Your Details' },
//   { id: 2, label: 'Documents' },
//   { id: 3, label: 'Annexures' },
//   { id: 4, label: 'Summary' },
//   { id: 5, label: 'Offer Letter' },
//   { id: 6, label: 'My Review' },
// ]

// export default function CandidatePortal() {
//   const { token } = useParams()
//   const [info, setInfo] = useState(null)
//   const [docs, setDocs] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [step, setStep] = useState(1)

//   // Initial load — counts as a portal open (tracks access)
//   const loadInfo = () => {
//     candidateApi.getPortalInfo(token)
//       .then(r => {
//         setInfo(r.data)
//         // Set initial step based on progress — but don't lock steps
//         const data = r.data
//         if (!data.portal_submitted) {
//           setStep(1)
//         } else if (!data.annexures_signed?.includes('A') || !data.annexures_signed?.includes('B')) {
//           setStep(2)
//         } else if (!data.offer_status || data.offer_status === 'pending') {
//           setStep(5)
//         } else if (data.offer_status === 'accepted') {
//           setStep(6)
//         } else {
//           setStep(5)
//         }
//       })
//       .catch(() => toast.error('Invalid or expired portal link'))
//       .finally(() => setLoading(false))
//   }

//   // Silent refresh after step actions — does NOT increment access count
//   const refreshInfo = () => {
//     candidateApi.refreshPortalInfo(token)
//       .then(r => setInfo(r.data))
//       .catch(() => {})
//   }

//   useEffect(() => { loadInfo() }, [token])

//   const goTo = (targetStep) => {
//     if (!info) return
//     const bothSigned = info.annexures_signed?.includes('A') && info.annexures_signed?.includes('B')
//     const offerAccepted = info.offer_status === 'accepted'
//     const rules = {
//       1: true,
//       2: !!info.portal_submitted,
//       3: !!info.portal_submitted,
//       4: bothSigned,          // Summary
//       5: bothSigned,          // Offer Letter
//       6: offerAccepted,       // Self Review
//     }
//     if (rules[targetStep]) { setStep(targetStep); return }
//     toast.error('Please complete the previous steps first')
//   }

//   if (loading) return (
//     <div className="flex justify-center items-center min-h-screen">
//       <Spinner size="lg" />
//     </div>
//   )

//   if (!info) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <div className="card p-8 text-center max-w-md">
//         <p className="text-slate-600">This portal link is invalid or has expired. Please contact HR.</p>
//       </div>
//     </div>
//   )

//   // Determine which steps are accessible
//   const bothAnnexuresSigned = info.annexures_signed?.includes('A') && info.annexures_signed?.includes('B')
//   const offerAccepted = info.offer_status === 'accepted'

//   const stepAccess = {
//     1: true,
//     2: !!info.portal_submitted,
//     3: !!info.portal_submitted,
//     4: bothAnnexuresSigned,
//     5: bothAnnexuresSigned,
//     6: offerAccepted,
//   }

//   const canGoBack = step > 1 && step <= 5

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50">
//       {/* Header */}
//       <div className="bg-white border-b border-slate-200 px-6 py-4">
//         <div className="max-w-3xl mx-auto flex items-center gap-3">
//           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
//             <Building2 className="w-4 h-4 text-white" />
//           </div>
//           <div>
//             <p className="text-sm font-bold text-slate-900">Grasim Industries Ltd.</p>
//             <p className="text-xs text-slate-500">Intern Onboarding Portal</p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
//         {/* Role info */}
//         <div className="card p-5">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
//             {[
//               ['Role', info.role_title],
//               ['Department', info.department],
//               ['Location', info.location],
//               ['Stipend', `₹${parseInt(info.stipend_amount).toLocaleString()}/month`],
//             ].map(([k, v]) => (
//               <div key={k}>
//                 <p className="text-xs text-slate-500">{k}</p>
//                 <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Step progress — clickable */}
//         <div className="flex items-center gap-0">
//           {STEPS.map((s, i) => {
//             const accessible = stepAccess[s.id]
//             const isActive = step === s.id
//             const isDone = step > s.id || (s.id < step)

//             return (
//               <div key={s.id} className="flex items-center flex-1">
//                 <div className="flex items-center gap-2 flex-1">
//                   <button
//                     onClick={() => goTo(s.id)}
//                     disabled={!accessible}
//                     className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all
//                       ${isActive ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' :
//                         isDone && accessible ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' :
//                         accessible ? 'bg-slate-300 text-slate-600 cursor-pointer hover:bg-indigo-100' :
//                         'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
//                   >
//                     {isDone && accessible && !isActive
//                       ? <CheckCircle className="w-4 h-4" />
//                       : s.id}
//                   </button>
//                   <span className={`text-xs font-medium hidden sm:block
//                     ${isActive ? 'text-indigo-600' :
//                       accessible ? 'text-slate-500 cursor-pointer' :
//                       'text-slate-300'}`}
//                     onClick={() => accessible && goTo(s.id)}
//                   >
//                     {s.label}
//                   </span>
//                 </div>
//                 {i < STEPS.length - 1 && (
//                   <div className={`h-px flex-1 mx-2 ${stepAccess[s.id + 1] ? 'bg-green-300' : 'bg-slate-200'}`} />
//                 )}
//               </div>
//             )
//           })}
//         </div>

//         {/* Back button */}
//         {canGoBack && step !== 4 && (
//           <button
//             onClick={() => setStep(s => s - 1)}
//             className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
//           >
//             <ChevronLeft className="w-4 h-4" />
//             Back to {STEPS[step - 2]?.label}
//           </button>
//         )}

//         {/* Step content */}
//         {step === 1 && (
//           <PortalStep1Details
//             token={token}
//             info={info}
//             onDone={() => { refreshInfo(); setStep(2) }}
//           />
//         )}
//         {step === 2 && (
//           <PortalStep2Documents
//             token={token}
//             onBack={() => setStep(1)}
//             onDone={(uploadedDocs) => { if (uploadedDocs) setDocs(uploadedDocs); setStep(3) }}
//           />
//         )}
//         {step === 3 && (
//           <PortalStep3Annexures
//             token={token}
//             info={info}
//             onBack={() => setStep(2)}
//             onDone={() => { refreshInfo(); setStep(4) }}
//           />
//         )}
//         {step === 4 && (
//           <PortalStepSummary
//             token={token}
//             info={info}
//             onBack={() => setStep(3)}
//             onConfirm={() => setStep(5)}
//           />
//         )}
//         {step === 5 && (
//           <PortalStep4Offer
//             token={token}
//             info={info}
//             onBack={() => setStep(4)}
//             onAccepted={() => { refreshInfo(); setStep(6) }}
//           />
//         )}
//         {step === 6 && (
//           <PortalStepSelfReview
//             token={token}
//             onDone={() => refreshInfo()}
//           />
//         )}
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { candidateApi } from '../../api'
import { Spinner } from '../../components/ui'
import { Building2, CheckCircle, ChevronLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import PortalStep1Details from './PortalStep1Details'
import PortalStep2Documents from './PortalStep2Documents'
import PortalStep3Annexures from './PortalStep3Annexures'
import PortalStep4Offer from './PortalStep4Offer'
import PortalStepSummary from './PortalStepSummary'
import PortalStepSelfReview from './PortalStepSelfReview'

const STEPS = [
  { id: 1, label: 'Your Details' },
  { id: 2, label: 'Documents' },
  { id: 3, label: 'Annexures' },
  { id: 4, label: 'Summary' },
  { id: 5, label: 'Offer Letter' },
  { id: 6, label: 'My Review' },
]

export default function CandidatePortal() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)

  const loadInfo = () => {
    candidateApi.getPortalInfo(token)
      .then(r => {
        setInfo(r.data)
        const data = r.data
        // l: If self-review already submitted, portal is closed — stay on a completion screen
        if (data.self_review_submitted) {
          setStep(7) // closed state
          return
        }
        // Resume at correct step
        if (!data.portal_submitted) {
          setStep(1)
        } else if (!data.annexures_signed?.includes('A') || !data.annexures_signed?.includes('B')) {
          setStep(2)
        } else if (!data.offer_status || data.offer_status === 'pending') {
          setStep(5)
        } else if (data.offer_status === 'accepted') {
          // j: My Review only if HR enabled it
          if (data.self_review_enabled) {
            setStep(6)
          } else {
            setStep(5)
          }
        } else {
          setStep(5)
        }
      })
      .catch(err => {
        const msg = err.response?.data?.detail || 'Invalid or expired portal link'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  // Silent refresh — does NOT increment access count
  const refreshInfo = () => {
    candidateApi.refreshPortalInfo(token)
      .then(r => {
        setInfo(r.data)
        // l: Check if review just got submitted
        if (r.data.self_review_submitted) setStep(7)
      })
      .catch(() => {})
  }

  useEffect(() => { loadInfo() }, [token])

  const goTo = (targetStep) => {
    if (!info) return
    const bothSigned = info.annexures_signed?.includes('A') && info.annexures_signed?.includes('B')
    const offerAccepted = info.offer_status === 'accepted'
    const rules = {
      1: true,
      2: !!info.portal_submitted,
      3: !!info.portal_submitted,
      4: bothSigned,
      5: bothSigned,
      6: offerAccepted && info.self_review_enabled, // j: locked until HR enables
    }
    if (rules[targetStep]) { setStep(targetStep); return }
    if (targetStep === 6 && offerAccepted && !info.self_review_enabled) {
      toast.error('My Review will be enabled by HR once you are ready')
      return
    }
    toast.error('Please complete the previous steps first')
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner size="lg" />
    </div>
  )

  // Portal error (revoked, expired, invalid)
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-50">
      <div className="card p-8 text-center max-w-md space-y-3">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-lg font-bold text-slate-800">Portal Link Issue</p>
        <p className="text-sm text-slate-500">{error}</p>
        <p className="text-xs text-slate-400">Please contact HR at hr@grasim.com</p>
      </div>
    </div>
  )

  if (!info) return null

  // l: Portal closed after self-review submitted
  if (step === 7 || info.self_review_submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center">
      <div className="card p-10 text-center max-w-lg space-y-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-green-500" />
        </div>
        <p className="text-xl font-bold text-slate-800">Internship Complete!</p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Thank you for completing your internship at Grasim Industries Ltd. Your review has been submitted successfully.
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
          You will receive your <strong>Experience Certificate</strong> via email once it is issued by HR.
        </div>
        <p className="text-xs text-slate-400">
          In case of any queries, reach out to{' '}
          <a href="mailto:hr@grasim.com" className="text-indigo-600 underline">hr@grasim.com</a>
        </p>
      </div>
    </div>
  )

  const bothAnnexuresSigned = info.annexures_signed?.includes('A') && info.annexures_signed?.includes('B')
  const offerAccepted = info.offer_status === 'accepted'
  const canGoBack = step > 1 && step <= 5

  const stepAccess = {
    1: true,
    2: !!info.portal_submitted,
    3: !!info.portal_submitted,
    4: bothAnnexuresSigned,
    5: bothAnnexuresSigned,
    6: offerAccepted && info.self_review_enabled, // j
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Grasim Industries Ltd.</p>
            <p className="text-xs text-slate-500">Intern Onboarding Portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Role info */}
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {[
              ['Role', info.role_title],
              ['Department', info.department],
              ['Location', info.location],
              ['Stipend', `₹${parseInt(info.stipend_amount).toLocaleString()}/month`],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-500">{k}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const accessible = stepAccess[s.id]
            const isActive = step === s.id
            const isDone = step > s.id

            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => goTo(s.id)}
                    disabled={!accessible}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all
                      ${isActive ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' :
                        isDone && accessible ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' :
                        accessible ? 'bg-slate-300 text-slate-600 cursor-pointer hover:bg-indigo-100' :
                        'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                  >
                    {isDone && accessible && !isActive
                      ? <CheckCircle className="w-4 h-4" />
                      : s.id}
                  </button>
                  <span
                    className={`text-xs font-medium hidden sm:block
                      ${isActive ? 'text-indigo-600' :
                        accessible ? 'text-slate-500 cursor-pointer' :
                        'text-slate-300'}`}
                    onClick={() => accessible && goTo(s.id)}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-2 ${stepAccess[s.id + 1] ? 'bg-green-300' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Back button */}
        {canGoBack && step !== 4 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {STEPS[step - 2]?.label}
          </button>
        )}

        {/* Step content — h: onDone advances step directly without requiring tab click */}
        {step === 1 && (
          <PortalStep1Details
            token={token}
            info={info}
            onDone={() => { refreshInfo(); setStep(2) }}
          />
        )}
        {step === 2 && (
          <PortalStep2Documents
            token={token}
            onBack={() => setStep(1)}
            onDone={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <PortalStep3Annexures
            token={token}
            info={info}
            onBack={() => setStep(2)}
            onDone={() => { refreshInfo(); setStep(4) }}
          />
        )}
        {step === 4 && (
          <PortalStepSummary
            token={token}
            info={info}
            onBack={() => setStep(3)}
            onConfirm={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <PortalStep4Offer
            token={token}
            info={info}
            onBack={() => setStep(4)}
            onAccepted={() => { refreshInfo(); }}
          />
        )}
        {step === 6 && (
          <PortalStepSelfReview
            token={token}
            onDone={() => { refreshInfo(); setStep(7) }}
          />
        )}
      </div>
    </div>
  )
}