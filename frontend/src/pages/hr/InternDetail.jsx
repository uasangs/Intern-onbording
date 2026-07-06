import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { hrApi } from '../../api'
import { StatusBadge, SectionCard, PageHeader, Spinner } from '../../components/ui'
import { CheckCircle, FileText, Send, Award, Monitor, Mail, CreditCard, Star, Edit } from 'lucide-react'
import PortalLinkManager from '../../components/ui/PortalLinkManager'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// Absolute URL for PDF viewer open-in-new-tab
const fileDownloadUrl = (path) => path ? `http://localhost:8000${path}` : null
// Relative URL for downloads (goes through Vite proxy)
const fileRelativeUrl = (path) => path || null
// Check if file is HTML fallback
const isHtmlFallback = (path) => path && path.endsWith('.html')

const RECOMMEND_STYLE = {
  confirm:     'bg-green-50 border-green-200 text-green-800',
  extend:      'bg-blue-50 border-blue-200 text-blue-800',
  not_confirm: 'bg-red-50 border-red-200 text-red-800',
}
const RECOMMEND_LABEL = {
  confirm:     'Confirm — Offer Employment',
  extend:      'Extend Internship',
  not_confirm: 'Do Not Confirm',
}

function StarDisplay({ value, max = 5 }) {
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{value}/{max}</span>
    </div>
  )
}

export default function InternDetail() {
  const { id } = useParams()
  const [intern, setIntern] = useState(null)
  const [docs, setDocs] = useState([])
  const [accountsTask, setAccountsTask] = useState(null)
  const [itTask, setItTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sendingCert, setSendingCert] = useState(false)
  const [certData, setCertData] = useState({ project_title: '', guide_names: '', conduct_remark: 'good', issue_date: '' })
  const [certErrors, setCertErrors] = useState({})
  const [pdfViewer, setPdfViewer] = useState(null)
  const [editPrefill, setEditPrefill] = useState(false)
  const [prefillData, setPrefillData] = useState({})
  const [savingPrefill, setSavingPrefill] = useState(false)

  const load = () => {
    Promise.all([
      hrApi.getIntern(id),
      hrApi.getDocuments(id),
      hrApi.getAccountsTask(id).catch(() => ({ data: null })),
      hrApi.getITTask(id).catch(() => ({ data: null })),
    ])
      .then(([i, d, aTask, iTask]) => {
        setIntern(i.data)
        setDocs(d.data)
        setAccountsTask(aTask.data || null)
        setItTask(iTask.data || null)
        // h: Pre-fill cert fields from manager review
        const rev = i.data?.manager_review
        if (rev?.project_name || rev?.guide_names) {
          setCertData(prev => ({
            ...prev,
            project_title: rev.project_name || prev.project_title,
            guide_names: rev.guide_names || prev.guide_names,
          }))
        }
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const generateOffer = async () => {
    setGenerating(true)
    try {
      await hrApi.generateOffer(id)
      toast.success('Offer letter generated!')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate') }
    finally { setGenerating(false) }
  }

  const sendOffer = async () => {
    try { await hrApi.sendOffer(id); toast.success('Offer sent to candidate!'); load() }
    catch { toast.error('Failed to send offer') }
  }

  const generateCert = async () => {
    const errs = {}
    if (!certData.project_title.trim()) errs.project_title = 'Project title is required'
    if (!certData.guide_names.trim()) errs.guide_names = 'Guide names are required'
    if (!certData.issue_date) {
      errs.issue_date = 'Issue date is required'
    } else if (intern?.end_date && certData.issue_date < intern.end_date) {
      errs.issue_date = 'Certificate date cannot be before the end date of the internship'
    }
    setCertErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      await hrApi.generateCertificate(id, certData)
      toast.success('Certificate generated!')
      load()
    } catch { toast.error('Failed to generate certificate') }
  }

  const sendCertificate = async () => {
    setSendingCert(true)
    try {
      await hrApi.sendCertificate(id)
      toast.success('Certificate sent to candidate!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send certificate')
    } finally { setSendingCert(false) }
  }

  const openEditPrefill = () => {
    const c = intern.candidate
    setPrefillData({
      candidate_name: c?.full_name || '',
      candidate_gender: c?.gender || '',
      candidate_mobile: c?.mobile || '',
      candidate_city: c?.city || '',
      candidate_state: c?.state || '',
      institute_name: c?.institute_name || '',
      qualification: c?.qualification || '',
      course: c?.course || '',
      year_of_study: c?.year_of_study || '',
      graduation_year: c?.graduation_year || '',
    })
    setEditPrefill(true)
  }

  const savePrefill = async () => {
    setSavingPrefill(true)
    try {
      await hrApi.updateCandidatePrefill(id, prefillData)
      toast.success('Candidate information updated! Please resend the portal link.')
      setEditPrefill(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update')
    } finally { setSavingPrefill(false) }
  }

  const enableSelfReview = async () => {
    try {
      await hrApi.enableSelfReview(id)
      toast.success('Self-review enabled for candidate!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to enable self-review')
    }
  }

  const openDocBlob = async (docId, fileName) => {
    try {
      const res = await hrApi.downloadDocument(docId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch { toast.error('Failed to open document') }
  }

  const downloadDocBlob = async (docId, fileName) => {
    try {
      const res = await hrApi.downloadDocument(docId)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = fileName || 'document.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download document') }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!intern) return <p className="text-slate-500">Intern not found.</p>

  const c = intern.candidate
  const offer = intern.offer_letter
  const cert = intern.experience_certificate
  const review = intern.manager_review

  // g: Status timeline steps
 const STATUS_STEPS = [
  { key: 'initiated',        label: 'Initiated' },
  { key: 'portal_submitted', label: 'Form Submitted' },
  { key: 'offer_accepted',   label: 'Offer Accepted' },
  { key: 'active',           label: 'Manager Review' },
  { key: 'review_pending',   label: 'Candidate Review' },
  { key: 'completed',        label: 'Completed' },
]
  const statusOrder = STATUS_STEPS.map(s => s.key)
  const statusMapping = {
  'initiated':         0,
  'portal_pending':    0,
  'portal_submitted':  1,
  'docs_under_review': 1,
  'docs_approved':     1,
  'offer_sent':        2,
  'offer_accepted':    2,
  'active':            3,
  'review_pending':    4,
  'completed':         5,
}
const currentIdx = statusMapping[intern.status] ?? 0
  const isDeclined = intern.status === 'offer_declined' || intern.status === 'terminated'

  return (
    <div className="space-y-6">
      <PageHeader
        title={c?.full_name || intern.candidate_email}
        subtitle={`${intern.role_title} · ${intern.location} · ${intern.department}`}
        action={<StatusBadge status={intern.status} />}
      />

      {/* g: Status Timeline */}
       {/* Status Timeline */}
<div className="card px-10 py-6">
  <div className="flex items-center justify-between relative">
    <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-100 z-0" />
    {STATUS_STEPS.map((step, idx) => {
      const done = currentIdx > idx
      const active = currentIdx === idx
      return (
        <div key={step.key} className="flex flex-col items-center z-10 flex-1 gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all shadow-sm
            ${isDeclined && active ? 'bg-red-100 border-red-400 text-red-600' :
              active ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' :
              done ? 'bg-green-500 border-green-500 text-white' :
              'bg-white border-slate-200 text-slate-300'}`}>
            {done ? '✓' : idx + 1}
          </div>
          <span className={`text-xs text-center leading-snug font-medium
            ${active ? 'text-indigo-700 font-semibold' :
              done ? 'text-green-600' :
              'text-slate-300'}`}
            style={{fontSize: '11px', maxWidth: '90px'}}>
            {step.label}
          </span>
        </div>
      )
    })}
  </div>
  {isDeclined && (
    <p className="text-xs text-red-500 mt-3 font-medium text-center">
      {intern.status === 'offer_declined' ? '⚠ Candidate declined the offer' : '⚠ Internship terminated'}
    </p>
  )}
</div>

      {/* Internship Details */}
      <SectionCard title="Internship Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            ['Email', intern.candidate_email],
            ['Location', intern.location],
            ['Department', intern.department],
            ['Stipend', `₹${parseInt(intern.stipend_amount).toLocaleString()}/month`],
            ['Start Date', intern.start_date ? format(new Date(intern.start_date), 'dd/MM/yyyy') : '—'],
            ['End Date', intern.end_date ? format(new Date(intern.end_date), 'dd/MM/yyyy') : '—'],
            ['Duration', intern.duration_weeks ? `${intern.duration_weeks} weeks` : '—'],
            ['Manager Review Date', intern.review_due_date ? format(new Date(intern.review_due_date), 'dd/MM/yyyy') : '—'],
            ['Manager', intern.reporting_manager?.name || '—'],
          ].map(([k, v]) => (
            <div key={k}><p className="text-xs text-slate-500">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
          ))}
        </div>
      </SectionCard>

      {/* Completion Tracker */}
      <SectionCard title="Completion Tracker">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['Project Submission', intern.project_submission_done],
            ['Presentation', intern.project_presentation_done],
            ['Panel Evaluation', intern.panel_evaluation_done],
            ['Certificate Issued', intern.experience_certificate_issued],
          ].map(([k, v]) => (
            <div key={k} className={`flex flex-col items-center justify-center p-3 border rounded-xl text-center gap-1.5 transition-all
              ${v ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
              {v
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
              }
              <span className={`text-xs font-medium ${v ? 'text-green-700' : 'text-slate-400'}`}>{k}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Portal Link */}
      <SectionCard title="Candidate Portal Link">
        <PortalLinkManager internId={id} />
      </SectionCard>

      {/* Candidate Details */}
      {c && (
        <SectionCard title="Candidate Details">
          {/* HR Edit Prefill button */}
          <div className="flex justify-end mb-4">
            <button onClick={openEditPrefill}
              className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-3 py-2 rounded-lg font-medium transition-colors">
              <Edit className="w-3.5 h-3.5" />
              Edit HR-Filled Information
            </button>
          </div>

          {/* Edit Prefill Modal */}
          {editPrefill && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-800">Edit Pre-filled Candidate Information</p>
                <button onClick={() => setEditPrefill(false)} className="text-amber-500 hover:text-amber-700 text-lg leading-none">✕</button>
              </div>
              <p className="text-xs text-amber-700">
                Update the information below and click Save. Then use the <strong>Resend Portal Link</strong> button so the candidate receives a fresh link with the corrected data. Their locked fields will reflect the updated values.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['candidate_name',   'Full Name',        'text'],
                  ['candidate_gender', 'Gender',           'select'],
                  ['candidate_mobile', 'Mobile',           'text'],
                  ['candidate_city',   'City',             'text'],
                  ['candidate_state',  'State',            'text'],
                  ['institute_name',   'Institute Name',   'text'],
                  ['qualification',    'Qualification',    'text'],
                  ['course',           'Course',           'text'],
                  ['year_of_study',    'Year of Study',    'text'],
                  ['graduation_year',  'Graduation Year',  'number'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-amber-700 block mb-1">{label}</label>
                    {type === 'select' ? (
                      <select className="input text-sm" value={prefillData[key] || ''}
                        onChange={e => setPrefillData(p => ({...p, [key]: e.target.value}))}>
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <input type={type} className="input text-sm"
                        value={prefillData[key] || ''}
                        onChange={e => setPrefillData(p => ({...p, [key]: e.target.value}))} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditPrefill(false)} className="btn-secondary text-sm">Cancel</button>
                <button onClick={savePrefill} disabled={savingPrefill} className="btn-primary text-sm flex items-center gap-2">
                  {savingPrefill ? 'Saving...' : 'Save & Close'}
                </button>
              </div>
            </div>
          )}

          {/* Personal */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Personal</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
            {[
              ['Full Name', c.full_name],
              ['Gender', c.gender],
              ['Date of Birth', c.dob ? format(new Date(c.dob), 'dd/MM/yyyy') : null],
              ['Mobile', c.mobile],
              ['Alternate Contact', c.contact_no],
              ['PAN Card', c.pan_card_no],
              ['Aadhaar No.', c.aadhaar_no],
              ['Emergency Contact', c.emergency_contact_name],
              ['Emergency Phone', c.emergency_contact_phone],
            ].map(([k, v]) => v ? (
              <div key={k}>
                <p className="text-xs text-slate-400">{k}</p>
                <p className="font-medium text-slate-800 mt-0.5">{v}</p>
              </div>
            ) : null)}
          </div>

          {/* Address */}
          {(c.address || c.city) && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Address</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
                {[
                  ['Address', c.address], ['City', c.city],
                  ['State', c.state], ['Pincode', c.pincode],
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <p className="text-xs text-slate-400">{k}</p>
                    <p className="font-medium text-slate-800 mt-0.5">{v}</p>
                  </div>
                ) : null)}
              </div>
            </>
          )}

          {/* Academic */}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Academic</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
            {[
              ['Institute', c.institute_name], ['Qualification', c.qualification],
              ['Course', c.course], ['Year of Study', c.year_of_study],
              ['Graduation Year', c.graduation_year],
            ].map(([k, v]) => v ? (
              <div key={k}>
                <p className="text-xs text-slate-400">{k}</p>
                <p className="font-medium text-slate-800 mt-0.5">{v}</p>
              </div>
            ) : null)}
          </div>

          {/* c: Bank Details — visually distinct blue block */}
          {c.bank_details && (
            <div className="mt-2 rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-700 uppercase tracking-wide">Bank Details</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {[
                  ['Bank Name', c.bank_details.bank_name],
                  ['Account Type', c.bank_details.account_type],
                  ['Account Number', c.bank_details.account_number],
                  ['IFSC Code', c.bank_details.ifsc_code],
                  ['Account Holder', c.bank_details.account_holder_name],
                ].map(([k, v]) => v ? (
                  <div key={k}>
                    <p className="text-xs text--500 font-medium">{k}</p>
                    <p className="font-mono font-semibold text--900 mt-0.5 text-sm">{v}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewer && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}
          onClick={e => { if (e.target === e.currentTarget) setPdfViewer(null) }}
        >
          <div style={{ background: '#1e293b', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText style={{ width: 18, height: 18, color: '#94a3b8' }} />
              <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
                {pdfViewer.doc_type?.replace(/_/g, ' ')} — {pdfViewer.file_name}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href={fileDownloadUrl(pdfViewer.file_url)} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#94a3b8', background: '#334155', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>
                Open in New Tab ↗
              </a>
              <a href={fileDownloadUrl(pdfViewer.file_url)} download
                style={{ fontSize: 12, color: '#94a3b8', background: '#334155', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}>
                Download ↓
              </a>
              <button onClick={() => setPdfViewer(null)}
                style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px 8px' }}>
                ✕
              </button>
            </div>
          </div>
          {isHtmlFallback(pdfViewer.file_url) ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 16 }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>PDF preview not available.</p>
              <a href={fileDownloadUrl(pdfViewer.file_url)} target="_blank" rel="noopener noreferrer"
                style={{ background: '#4f46e5', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
                Open Document in Browser ↗
              </a>
            </div>
          ) : (
            <iframe src={pdfViewer.file_url} style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }} title={pdfViewer.file_name} />
          )}
        </div>
      )}

      {/* Documents */}
      <SectionCard title="Documents (PDF only)">
        {docs.length === 0 ? (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="border border-slate-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">Rejected: {doc.rejection_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {doc.file_data_available ? (
                    <>
                      <button
                        onClick={() => openDocBlob(doc.id, doc.file_name)}
                        className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-lg font-medium transition-colors">
                        <FileText className="w-3.5 h-3.5" />View PDF
                      </button>
                      <button
                        onClick={() => downloadDocBlob(doc.id, doc.file_name)}
                        className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium transition-colors">
                        <FileText className="w-3.5 h-3.5" />Download
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-amber-600 italic px-2 py-1 bg-amber-50 rounded-lg border border-amber-200">
                      Old document — ask candidate to re-upload
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Offer Letter */}
      <SectionCard title="Offer Letter">
        <div className="flex flex-wrap gap-3 items-center">
          {!offer?.has_file && (
            <button onClick={generateOffer} disabled={generating} className="btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" />{generating ? 'Generating...' : 'Generate Offer Letter'}
            </button>
          )}
          {offer?.has_file && (
  <button onClick={async () => {
    try {
      const res = await hrApi.downloadOffer(id)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url; a.download = 'offer_letter.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download offer letter') }
  }} className="btn-secondary flex items-center gap-2">
    <FileText className="w-4 h-4" />Download Offer Letter (.pdf)
  </button>
)}
          
          {offer?.has_file && offer.status !== 'sent' && offer.status !== 'accepted' && (
            <button onClick={sendOffer} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" />Send to Candidate
            </button>
          )}
          {offer && <StatusBadge status={offer.status} />}
          {offer?.candidate_response && (
            <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize
              ${offer.candidate_response === 'accepted' ? 'bg-green-100 text-green-700' :
                offer.candidate_response === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              Candidate: {offer.candidate_response}
            </span>
          )}
          {offer?.candidate_remarks && (
            <p className="w-full text-xs text-slate-500 italic">Candidate remarks: "{offer.candidate_remarks}"</p>
          )}
        </div>
      </SectionCard>

      {/* Accounts Task */}
      <SectionCard title="Accounts — Stipend & Vendor Status">
  {intern.stipend_amount === 0 ? (
    <p className="text-sm text-slate-400">No stipend provided for this intern.</p>
  ) : !accountsTask ? (
          <p className="text-sm text-slate-400">Accounts task not created yet. Will be created automatically when candidate accepts the offer letter.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Task Status', <StatusBadge status={accountsTask.task_status} />],
                ['Vendor ID', accountsTask.vendor_id || '—'],
                ['Payment Mode', accountsTask.payment_mode || '—'],
                ['Monthly Stipend', accountsTask.intern?.stipend_amount
                  ? `₹${parseInt(accountsTask.intern.stipend_amount).toLocaleString()}`
                  : `₹${parseInt(intern.stipend_amount).toLocaleString()}`],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">{k}</p>
                  <div className="text-sm font-medium text-slate-800">{v}</div>
                </div>
              ))}
            </div>
            {accountsTask.completed_at && (
              <p className="text-xs text-green-600">✓ Vendor setup completed on {format(new Date(accountsTask.completed_at + 'Z'), 'dd/MM/yyyy')}</p>
            )}
            {accountsTask.notes && (
              <p className="text-xs text-slate-500 italic">Notes: {accountsTask.notes}</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* IT Task */}
      <SectionCard title="IT — Asset Provisioning Status">
  {!intern.laptop_required && !intern.corporate_email_required ? (
    <p className="text-sm text-slate-400">No IT assets required for this intern.</p>
  ) : !itTask ? (
          <p className="text-sm text-slate-400">IT task not created yet. Will be created automatically when candidate accepts the offer letter.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Laptop */}
              <div className={`p-3 rounded-lg border ${itTask.laptop_required
                ? (itTask.laptop_provisioned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100')
                : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">Laptop</p>
                </div>
                {itTask.laptop_required ? (
                  <>
                    <p className={`text-xs font-bold ${itTask.laptop_provisioned ? 'text-green-700' : 'text-amber-700'}`}>
                      {itTask.laptop_provisioned ? 'Provisioned' : 'Pending'}
                    </p>
                    {itTask.laptop_serial && <p className="text-xs text-slate-500 mt-0.5">Serial: {itTask.laptop_serial}</p>}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Not required</p>
                )}
              </div>

              {/* Email */}
              <div className={`p-3 rounded-lg border ${itTask.email_required
                ? (itTask.email_provisioned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100')
                : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">ABG Email</p>
                </div>
                {itTask.email_required ? (
                  <>
                    <p className={`text-xs font-bold ${itTask.email_provisioned ? 'text-green-700' : 'text-amber-700'}`}>
                      {itTask.email_provisioned ? 'Created' : 'Pending'}
                    </p>
                    {itTask.abg_email_id && <p className="text-xs text-slate-500 mt-0.5">{itTask.abg_email_id}</p>}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Not required</p>
                )}
              </div>

              {/* Overall Status */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-1">Overall Status</p>
                <StatusBadge status={itTask.task_status} />
                {itTask.completed_at && (
                  <p className="text-xs text-slate-400 mt-1">{format(new Date(itTask.completed_at + 'Z'), 'dd/MM/yyyy')}</p>
                )}
              </div>
            </div>
            {itTask.completed_at && (
              <p className="text-xs text-green-600">✓ Asset provisioning completed on {format(new Date(itTask.completed_at + 'Z'), 'dd/MM/yyyy')}</p>
            )}
            {itTask.notes && <p className="text-xs text-slate-500 italic">Notes: {itTask.notes}</p>}
          </div>
        )}
      </SectionCard>

      {/* Manager Evaluation Result */}
      <SectionCard title="Manager Evaluation Result">
        {!review || !review.submitted_at ? (
          <div className="text-center py-6 text-slate-400">
            <Star className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No review submitted yet.</p>
            {intern.review_due_date && (
              <p className="text-xs mt-1">Review due by: <strong>{format(new Date(intern.review_due_date), 'dd/MM/yyyy')}</strong></p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl text-center">
                <p className="text-xs text-amber-600 mb-2">Overall Rating</p>
                <div className="flex justify-center gap-0.5 mb-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-5 h-5 ${n <= review.overall_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-xl font-bold text-amber-900">{review.overall_rating}/5</p>
              </div>
              <div className={`p-4 rounded-xl border flex flex-col justify-center ${RECOMMEND_STYLE[review.recommendation] || 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-medium mb-1">Recommendation</p>
                <p className="text-sm font-bold">{RECOMMEND_LABEL[review.recommendation] || review.recommendation}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ['Performance', review.performance_rating],
                ['Attitude', review.attitude_rating],
                ['Punctuality', review.punctuality_rating],
                ['Technical', review.technical_rating],
                ['Communication', review.communication_rating],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">{k}</span>
                  <StarDisplay value={v} />
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-semibold text-slate-600 mb-2">Manager Feedback</p>
              <p className="text-sm text-slate-700 leading-relaxed">{review.feedback_text}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-500">Project</p><p className="font-medium">{review.project_name}</p></div>
              <div><p className="text-xs text-slate-500">Guide(s)</p><p className="font-medium">{review.guide_names}</p></div>
              <div><p className="text-xs text-slate-500">Reviewed by</p><p className="font-medium">{review.manager?.name || '—'}</p></div>
              <div><p className="text-xs text-slate-500">Submitted</p><p className="font-medium">{review.submitted_at ? format(new Date(review.submitted_at + 'Z'), 'dd/MM/yyyy') : '—'}</p></div>
            </div>

            {review.recommendation === 'confirm' && !cert?.has_file && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">Manager recommends confirmation — issue the experience certificate</p>
                <button onClick={() => document.getElementById('cert-section').scrollIntoView({ behavior: 'smooth' })}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                  Go to Certificate ↓
                </button>
              </div>
            )}
            {review.recommendation === 'not_confirm' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Manager does not recommend confirmation. Consider closing this record.</p>
              </div>
            )}
            {review.recommendation === 'extend' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Manager recommends extending the internship. Update the end date accordingly.</p>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Student Self-Review */}
      <SectionCard title="Student Self-Review">
        {!intern.self_review ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-2 text-slate-400">
              <Star className="w-8 h-8 text-slate-200" />
              <div>
                <p className="text-sm">No self-review submitted yet.</p>
                <p className="text-xs text-slate-300 mt-0.5">Available after candidate accepts the offer letter.</p>
              </div>
            </div>
            {intern.offer_letter?.candidate_response === 'accepted' && (
              intern.self_review_enabled ? (
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Self-review is enabled — candidate can now submit their review.
                </div>
              ) : (
                <button onClick={enableSelfReview}
                  className="btn-primary text-sm flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Enable Candidate Self-Review
                </button>
              )
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                ['Overall Experience', intern.self_review.overall_experience],
                ['Learning', intern.self_review.learning_rating],
                ['Mentorship', intern.self_review.mentorship_rating],
                ['Facilities', intern.self_review.facilities_rating],
                ['Work Culture', intern.self_review.work_culture_rating],
              ].map(([label, rating]) => (
                <div key={label} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                  <p className="text-xs text-amber-600 mb-1">{label}</p>
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`} />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-amber-800">{rating}/5</p>
                </div>
              ))}
            </div>
            {intern.self_review.would_recommend !== null && (
              <p className="text-sm">
                <span className="font-medium">Would recommend: </span>
                <span className={intern.self_review.would_recommend ? 'text-green-600' : 'text-red-600'}>
                  {intern.self_review.would_recommend ? '✓ Yes' : '✗ No'}
                </span>
              </p>
            )}
            {intern.self_review.key_learnings && (
              <div><p className="text-xs font-semibold text-slate-500 mb-1">Key Learnings</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.key_learnings}</p></div>
            )}
            {intern.self_review.challenges_faced && (
              <div><p className="text-xs font-semibold text-slate-500 mb-1">Challenges</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.challenges_faced}</p></div>
            )}
            {intern.self_review.suggestions && (
              <div><p className="text-xs font-semibold text-slate-500 mb-1">Suggestions</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.suggestions}</p></div>
            )}
            {intern.self_review.overall_feedback && (
              <div><p className="text-xs font-semibold text-slate-500 mb-1">Overall Feedback</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.overall_feedback}</p></div>
            )}
            {intern.self_review.submitted_at && (
              <p className="text-xs text-slate-400">Submitted: {format(new Date(intern.self_review.submitted_at + 'Z'), 'dd/MM/yyyy, HH:mm')}</p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Experience Certificate */}
      <div id="cert-section">
        <SectionCard title="Experience Certificate">
          {cert?.has_file ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                  <Award className="w-5 h-5 text-green-600" />
                  Certificate generated
                </div>
                <button onClick={async () => {
  try {
    const res = await hrApi.downloadCertificate(id)
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'certificate.pdf'; a.click()
    URL.revokeObjectURL(url)
  } catch { toast.error('Failed to download certificate') }
}} className="btn-secondary flex items-center gap-2 text-xs">
  <FileText className="w-3.5 h-3.5" />Download (.pdf)
</button>
              </div>
              <div className={`p-4 rounded-xl border ${cert.delivered_to_candidate ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'}`}>
                {cert.delivered_to_candidate ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="text-sm font-semibold">Certificate sent to candidate</p>
                      {cert.delivered_at && <p className="text-xs mt-0.5">Sent on {format(new Date(cert.delivered_at + 'Z'), 'dd/MM/yyyy, HH:mm')}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">Send certificate to candidate</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Will be emailed to: {intern.candidate_email}</p>
                    </div>
                    <button onClick={sendCertificate} disabled={sendingCert}
                      className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      <Send className="w-4 h-4" />
                      {sendingCert ? 'Sending...' : 'Send to Candidate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Fill in the details below to generate the experience certificate PDF.
                {intern?.manager_review?.project_name && ' Fields pre-filled from manager review.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Project Title <span className="text-red-500">*</span></label>
                  <input className={`input ${certErrors.project_title ? 'border-red-400' : ''}`}
                    placeholder="e.g. Performance Analysis of Yarn..."
                    value={certData.project_title}
                    onChange={e => { setCertData(p => ({...p, project_title: e.target.value})); setCertErrors(p => ({...p, project_title: ''})) }} />
                  {certErrors.project_title && <p className="text-xs text-red-600 mt-1">{certErrors.project_title}</p>}
                </div>
                <div>
                  <label className="label">Guide Names <span className="text-red-500">*</span></label>
                  <input className={`input ${certErrors.guide_names ? 'border-red-400' : ''}`}
                    placeholder="e.g. Mr. Gaurav Shrivastava and Mr. Rituraj Nagpure"
                    value={certData.guide_names}
                    onChange={e => { setCertData(p => ({...p, guide_names: e.target.value})); setCertErrors(p => ({...p, guide_names: ''})) }} />
                  {certErrors.guide_names && <p className="text-xs text-red-600 mt-1">{certErrors.guide_names}</p>}
                </div>
                <div>
                  <label className="label">Conduct Remark</label>
                  <select className="input" value={certData.conduct_remark}
                    onChange={e => setCertData(p => ({...p, conduct_remark: e.target.value}))}>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                    <option value="satisfactory">Satisfactory</option>
                  </select>
                </div>
                <div>
                  <label className="label">Issue Date <span className="text-red-500">*</span></label>
                  <input type="date" className={`input ${certErrors.issue_date ? 'border-red-400' : ''}`}
                    min={intern?.end_date || undefined}
                    value={certData.issue_date}
                    onChange={e => { setCertData(p => ({...p, issue_date: e.target.value})); setCertErrors(p => ({...p, issue_date: ''})) }} />
                  {certErrors.issue_date
                    ? <p className="text-xs text-red-600 mt-1">{certErrors.issue_date}</p>
                    : <p className="text-xs text-slate-400 mt-1">Cannot be before internship end date ({intern?.end_date || '—'})</p>
                  }
                </div>
              </div>
              <button onClick={generateCert} className="btn-primary flex items-center gap-2">
                <Award className="w-4 h-4" />Generate Certificate
              </button>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}