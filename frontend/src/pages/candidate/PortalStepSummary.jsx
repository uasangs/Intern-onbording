import { useState, useEffect } from 'react'
import { CheckCircle, FileText, User, BookOpen, CreditCard, Eye } from 'lucide-react'
import { SectionCard } from '../../components/ui'
import { format } from 'date-fns'
import { candidateApi } from '../../api'
import PDFViewer from '../../components/ui/PDFViewer'

export default function PortalStepSummary({ info, onConfirm, onBack, token }) {
  const [docs, setDocs] = useState([])
  const [pdfViewer, setPdfViewer] = useState(null)

  // Always fetch fresh docs from API
  useEffect(() => {
    if (token) {
      candidateApi.getDocuments(token)
        .then(r => setDocs(r.data || []))
        .catch(() => {})
    }
  }, [token])

  const Section = ({ title, icon: Icon, children }) => (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <Icon className="w-4 h-4 text-indigo-500" />
        <p className="text-sm font-semibold text-slate-700">{title}</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">{children}</div>
    </div>
  )

  const Field = ({ label, value }) => value ? (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  ) : null

  return (
    <div className="space-y-5">

      {pdfViewer && <PDFViewer url={pdfViewer.url} label={pdfViewer.label} onClose={() => setPdfViewer(null)} />}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">📋 Review your submission before proceeding</p>
        <p className="text-xs text-blue-600">Please verify all information is correct. Click Back to make changes, or Confirm to proceed to the offer letter.</p>
      </div>

      {/* Internship Info */}
      <Section title="Internship Details" icon={BookOpen}>
        <Field label="Role" value={info?.role_title} />
        <Field label="Department" value={info?.department} />
        <Field label="Location" value={info?.location} />
        <Field label="Stipend" value={info?.stipend_amount > 0 ? `₹${parseInt(info.stipend_amount).toLocaleString('en-IN')}/month` : 'Not specified'} />
        <Field label="Start Date" value={info?.start_date ? format(new Date(info.start_date), 'dd MMM yyyy') : null} />
        <Field label="End Date" value={info?.end_date ? format(new Date(info.end_date), 'dd MMM yyyy') : null} />
      </Section>

      {/* Personal */}
      <Section title="Personal Details" icon={User}>
        <Field label="Full Name" value={info?.candidate_name} />
        <Field label="Gender" value={info?.gender} />
        <Field label="Date of Birth" value={info?.dob} />
        <Field label="Mobile" value={info?.mobile} />
        <Field label="PAN Card" value={info?.pan_card_no} />
        <Field label="Aadhaar" value={info?.aadhaar_no} />
        <Field label="Address" value={info?.address} />
        <Field label="City / State" value={info?.city && info?.state ? `${info.city}, ${info.state}` : info?.city || info?.state} />
        <Field label="Emergency Contact" value={info?.emergency_contact_name} />
        <Field label="Emergency Phone" value={info?.emergency_contact_phone} />
      </Section>

      {/* Academic */}
      <Section title="Academic Details" icon={BookOpen}>
        <Field label="Institute" value={info?.institute_name} />
        <Field label="Qualification" value={info?.qualification} />
        <Field label="Course" value={info?.course} />
        <Field label="Year of Study" value={info?.year_of_study} />
        <Field label="Graduation Year" value={info?.graduation_year} />
      </Section>

      {/* Bank */}
      <Section title="Bank Details" icon={CreditCard}>
        <Field label="Bank Name" value={info?.bank_name} />
        <Field label="Account Type" value={info?.account_type} />
        <Field label="Account Number" value={info?.account_number} />
        <Field label="IFSC Code" value={info?.ifsc_code} />
        <Field label="Account Holder" value={info?.account_holder_name} />
      </Section>

      {/* Documents */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <FileText className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-semibold text-slate-700">Uploaded Documents</p>
          <span className="text-xs text-slate-400 ml-auto">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="p-4 space-y-2">
          {docs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No documents uploaded yet</p>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{doc.doc_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400">{doc.file_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPdfViewer({ label: doc.doc_type?.replace(/_/g, ' '), url: doc.file_url })}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  <Eye className="w-3 h-3" />View
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Annexures */}
      <div className="border border-green-100 rounded-xl p-4 bg-green-50">
        <p className="text-sm font-semibold text-green-800 mb-2">✓ Annexures Accepted</p>
        <div className="flex flex-wrap gap-2">
          {info?.annexures_signed?.includes('A') && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Annexure A — Terms & Conditions</span>
          )}
          {info?.annexures_signed?.includes('B') && (
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">✓ Annexure B — Confidentiality</span>
          )}
        </div>
      </div>

      {/* Privacy */}
      <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50">
        <p className="text-xs text-indigo-700">
          <strong>✓ Privacy Policy Accepted</strong> — You have consented to Grasim Industries processing your personal data for internship purposes.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          ← Back to Edit Details
        </button>
        <button onClick={onConfirm} className="btn-primary px-8 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />Confirm & Proceed to Offer Letter →
        </button>
      </div>
    </div>
  )
}