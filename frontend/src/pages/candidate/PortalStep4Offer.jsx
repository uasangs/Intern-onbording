import { useEffect, useState } from 'react'
import { candidateApi } from '../../api'
import { SectionCard, StatusBadge, Spinner } from '../../components/ui'
import { FileText, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const fileUrl = (path) => path ? `http://localhost:8000${path}` : null
const isDocx = (path) => path && path.endsWith('.docx')

export default function PortalStep4Offer({ token, info, onBack, onAccepted }) {
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [responded, setResponded] = useState(false)

  useEffect(() => {
    candidateApi.getOffer(token)
      .then(r => { setOffer(r.data); if (r.data.candidate_response) setResponded(true) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const respond = async (response) => {
    setResponding(true)
    try {
      await candidateApi.respondOffer(token, response, remarks)
      toast.success(response === 'accepted' ? 'Offer accepted! Welcome to Grasim.' : 'Response recorded.')
      setOffer(p => ({ ...p, candidate_response: response }))
      setResponded(true)
      if (response === 'accepted' && onAccepted) setTimeout(onAccepted, 1500)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit response')
    } finally { setResponding(false) }
  }

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>

  if (!offer) return (
    <SectionCard title="Offer Letter">
      <div className="text-center py-10">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Your offer letter is being prepared by HR.</p>
        <p className="text-xs text-slate-400 mt-1">You will receive an email when it is ready.</p>
      </div>
    </SectionCard>
  )

  const canGoBack = !info?.offer_status || info?.offer_status === 'pending'
  return (
    <div className="space-y-6">
      <SectionCard title="Offer Letter">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">Your offer letter from Grasim Industries Ltd.</p>
          <StatusBadge status={offer.status} />
        </div>
        <a href={`/api/candidate/portal/${token}/offer-letter/download`} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-4 border-2 border-dashed border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors mb-5 group">
          <FileText className="w-6 h-6 text-indigo-500" />
          <div>
            <p className="text-sm font-medium text-indigo-700 group-hover:text-indigo-800">View / Download Offer Letter PDF</p>
            <p className="text-xs text-slate-400">Click to open in new tab</p>
          </div>
        </a>

        {responded ? (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            offer.candidate_response === 'accepted' ? 'bg-green-50 text-green-700' :
            'bg-red-50 text-red-700'
          }`}>
            {offer.candidate_response === 'accepted' && <CheckCircle className="w-5 h-5" />}
            {offer.candidate_response === 'declined' && <XCircle className="w-5 h-5" />}
            <div>
              <p className="font-medium capitalize">Offer {offer.candidate_response?.replace(/_/g, ' ')}</p>
              {offer.candidate_remarks && <p className="text-sm mt-0.5">{offer.candidate_remarks}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Remarks (optional)</label>
              <textarea className="input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Any questions or comments about the offer..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => respond('accepted')} disabled={responding} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />{responding ? 'Submitting...' : 'Accept Offer'}
              </button>
              
              <button onClick={() => respond('declined')} disabled={responding} className="btn-danger flex items-center justify-center gap-2 px-4">
                <XCircle className="w-4 h-4" />Decline
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      {offer.candidate_response === 'accepted' && (
        <div className="card p-6 text-center bg-green-50 border-green-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800 mb-1">Welcome to Grasim!</h3>
          <p className="text-sm text-green-700">Your onboarding is complete. HR will reach out with further details about your start date and asset provisioning.</p>
        </div>
      )}
    </div>
  )
}