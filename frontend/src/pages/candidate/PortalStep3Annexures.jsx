import { useState } from 'react'
import { candidateApi } from '../../api'
import { SectionCard } from '../../components/ui'
import { CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

const ANNEXURE_A_CONTENT = {
  title: "Annexure A — General Terms & Conditions",
  description: "Covers conduct, confidentiality, IP rights, termination, and governing law",
  sections: [
    {
      heading: "1. Code of Conduct",
      text: "The intern shall maintain professional conduct throughout the internship period. This includes punctuality, respect for colleagues, adherence to company policies, dress code, and maintaining confidentiality of all business information encountered during the internship."
    },
    {
      heading: "2. Confidentiality",
      text: "The intern shall not disclose any confidential information, trade secrets, business strategies, client data, or proprietary information belonging to Grasim Industries Ltd. to any third party, during or after the internship period. Any breach of this clause may result in immediate termination and legal action."
    },
    {
      heading: "3. Intellectual Property Rights",
      text: "All work, inventions, designs, developments, and deliverables created by the intern during the course of the internship shall be the exclusive property of Grasim Industries Ltd. The intern assigns all intellectual property rights in such work to the Company without any additional consideration."
    },
    {
      heading: "4. Data Protection",
      text: "The intern shall comply with the Company's data protection policies. Any personal data of employees, clients, or vendors accessed during the internship must be handled in accordance with applicable data protection laws and company guidelines."
    },
    {
      heading: "5. Termination",
      text: "Either party may terminate the internship with 3 days' written notice. The Company reserves the right to terminate immediately in case of misconduct, breach of confidentiality, or violation of company policies. Upon termination, the intern must return all company property."
    },
    {
      heading: "6. Non-Competition",
      text: "During the internship period, the intern shall not engage in any activity that directly competes with Grasim Industries Ltd.'s business interests without prior written consent from HR."
    },
    {
      heading: "7. Governing Law",
      text: "This agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising from this internship shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra."
    },
    {
      heading: "8. Stipend & Benefits",
      text: "The stipend, if applicable, will be paid as per the offer letter on the 23rd of each month. The intern is not entitled to any other benefits such as medical insurance, provident fund, gratuity, or leave encashment unless specifically mentioned in the offer letter."
    },
  ]
}

const ANNEXURE_B_CONTENT = {
  title: "Annexure B — Confidentiality & IP Declaration",
  description: "Your personal declaration on confidentiality, IP assignment, and indemnity. Binding for 5 years.",
  sections: [
    {
      heading: "Declaration of Confidentiality",
      text: "I hereby declare that I understand and acknowledge the confidential nature of the information I may access during my internship at Grasim Industries Ltd. I commit to not disclosing, sharing, copying, or transmitting any confidential information to any person or entity outside the Company, whether during or after my internship period."
    },
    {
      heading: "Intellectual Property Assignment",
      text: "I acknowledge that all intellectual property, including but not limited to inventions, software, designs, processes, reports, analyses, and any other work product created by me in connection with my internship, shall belong exclusively to Grasim Industries Ltd. I hereby irrevocably assign all rights, title, and interest in such intellectual property to the Company."
    },
    {
      heading: "Non-Disclosure Obligation",
      text: "I agree not to use any confidential information of the Company for any purpose other than performing my internship duties. This obligation shall remain in force for a period of five (5) years after the conclusion of my internship, regardless of the reason for termination."
    },
    {
      heading: "Indemnity",
      text: "I agree to indemnify and hold harmless Grasim Industries Ltd., its directors, officers, and employees from any claims, damages, losses, or expenses arising from my breach of this confidentiality declaration or any misuse of company information."
    },
    {
      heading: "Social Media & Public Communication",
      text: "I shall not post, publish, or share any information about the Company's business, strategies, clients, projects, or internal matters on social media or any public platform without prior written approval from the HR department."
    },
    {
      heading: "Return of Materials",
      text: "Upon completion or termination of my internship, I agree to promptly return all company materials, documents, data, and property in my possession, including any copies made thereof. I will not retain any copies of confidential information."
    },
    {
      heading: "Acknowledgement",
      text: "I confirm that I have read, understood, and agree to abide by all the terms stated in this declaration. I understand that violation of any of these terms may result in legal action against me."
    },
  ]
}

export default function PortalStep3Annexures({ token, info, onDone, onBack }) {
  const [signedA, setSignedA] = useState(info?.annexures_signed?.includes('A') || false)
  const [signedB, setSignedB] = useState(info?.annexures_signed?.includes('B') || false)
  const [expandedA, setExpandedA] = useState(!signedA) // auto-expand if not yet signed
  const [expandedB, setExpandedB] = useState(false)
  const [readA, setReadA] = useState(signedA)
  const [readB, setReadB] = useState(signedB)
  const [acceptedA, setAcceptedA] = useState(false)
  const [acceptedB, setAcceptedB] = useState(false)
  const [submitting, setSubmitting] = useState('')

  const sign = async (type) => {
    setSubmitting(type)
    try {
      await candidateApi.signAnnexure(token, {
        annexure_type: type,
        candidate_name: info.candidate_name || info.candidate_email,
        signed_place: info.city || 'India',
        university_name: info.institute_name || '',
        pan_card_no: info.pan_card_no || '',
        aadhaar_no: info.aadhaar_no || '',
      })
      toast.success(`Annexure ${type} accepted!`)
      type === 'A' ? setSignedA(true) : setSignedB(true)
      // Auto-expand next annexure
      if (type === 'A') setExpandedB(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to accept')
    } finally { setSubmitting('') }
  }

  const AnnexureCard = ({ type, content, expanded, setExpanded, read, setRead, accepted, setAccepted, signed }) => (
    <div className={`border rounded-xl overflow-hidden transition-all ${signed ? 'border-green-200' : 'border-slate-200'}`}>
      {/* Header — always visible */}
      <div
        className={`p-4 flex items-center justify-between cursor-pointer ${signed ? 'bg-green-50' : 'bg-white hover:bg-slate-50'}`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${signed ? 'bg-green-100' : 'bg-slate-100'}`}>
            {signed ? <CheckCircle className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-slate-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{content.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{content.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {signed && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Accepted
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expandable content — full text always readable */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Full text content */}
          <div className="p-5 space-y-4 bg-slate-50 max-h-96 overflow-y-auto">
            <p className="text-xs text-slate-500 italic mb-2">Scroll to read all sections. Your details are auto-filled.</p>
            {content.sections.map((s, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-slate-700 mb-1">{s.heading}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{s.text}</p>
              </div>
            ))}

            {/* Auto-filled details */}
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
              <p className="text-xs font-semibold text-indigo-700 mb-2">Your auto-filled details:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-indigo-500">Name: </span><span className="font-medium text-indigo-800">{info?.candidate_name || '—'}</span></div>
                <div><span className="text-indigo-500">Institute: </span><span className="font-medium text-indigo-800">{info?.institute_name || '—'}</span></div>
                <div><span className="text-indigo-500">PAN: </span><span className="font-medium text-indigo-800">{info?.pan_card_no || '—'}</span></div>
                <div><span className="text-indigo-500">Place: </span><span className="font-medium text-indigo-800">{info?.city || 'India'}</span></div>
              </div>
            </div>
          </div>

          {/* Accept section — only if not yet signed */}
          {!signed && (
            <div className="p-4 bg-white border-t border-slate-100 space-y-3">
              <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors border-indigo-200 bg-indigo-50 hover:bg-indigo-100`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0"
                  checked={accepted}
                  onChange={e => { setAccepted(e.target.checked); if (!read) setRead(true) }}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-700">I have read and agree to all the terms in {content.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Your electronic acceptance is legally binding</p>
                </div>
              </label>
              <button
                onClick={() => sign(type)}
                disabled={!accepted || submitting === type}
                className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting === type ? 'Accepting...' : `Accept Annexure ${type}`}
              </button>
            </div>
          )}

          {/* Already signed confirmation */}
          {signed && (
            <div className="p-4 bg-green-50 border-t border-green-100">
              <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> You have accepted this annexure. Your acceptance is recorded.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-sm font-semibold text-blue-800 mb-1">Please read both annexures carefully</p>
        <p className="text-xs text-blue-700">Click on each annexure to expand and read the full terms. You must accept both before proceeding.</p>
      </div>

      <AnnexureCard
        type="A"
        content={ANNEXURE_A_CONTENT}
        expanded={expandedA}
        setExpanded={setExpandedA}
        read={readA}
        setRead={setReadA}
        accepted={acceptedA}
        setAccepted={setAcceptedA}
        signed={signedA}
      />

      <AnnexureCard
        type="B"
        content={ANNEXURE_B_CONTENT}
        expanded={expandedB}
        setExpanded={setExpandedB}
        read={readB}
        setRead={setReadB}
        accepted={acceptedB}
        setAccepted={setAcceptedB}
        signed={signedB}
      />

      <div className="flex justify-between items-center pt-2">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2 text-sm">
          ← Back to Documents
        </button>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500">
            {signedA && signedB ? '✓ Both annexures accepted — ready to proceed' :
             signedA ? 'Now read and accept Annexure B' :
             'Read and accept both annexures to proceed'}
          </p>
          <button
            onClick={onDone}
            disabled={!signedA || !signedB}
            className="btn-primary px-8 disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}