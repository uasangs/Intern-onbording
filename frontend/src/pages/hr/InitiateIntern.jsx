// // import { useForm } from 'react-hook-form'
// // import { fetchMasters, DEFAULT_MASTERS } from '../../utils/masters'
// // import { useNavigate } from 'react-router-dom'
// // import { hrApi, authApi } from '../../api'
// // import { Field, PageHeader, SectionCard } from '../../components/ui'
// // import { useEffect, useState } from 'react'
// // import toast from 'react-hot-toast'

// // export default function InitiateIntern() {
// //   const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
// //     defaultValues: { stipend_amount: 7000, location: 'MBDD' }
// //   })
// //   const navigate = useNavigate()
// //   const [managers, setManagers] = useState([])
// //   const [masters, setMasters] = useState(DEFAULT_MASTERS)

// //   useEffect(() => {
// //     fetchMasters().then(setMasters)
// //     authApi.getUsers().then(r => setManagers(r.data.filter(u => u.role === 'manager'))).catch(() => {})
// //   }, [])



// //   const onSubmit = async (data) => {
// //     try {
// //       const res = await hrApi.initiateIntern(data)
// //       toast.success('Intern initiated! Portal link sent to candidate.')
// //       navigate(`/hr/intern/${res.data.id}`)
// //     } catch (err) {
// //       toast.error(err.response?.data?.detail || 'Failed to initiate')
// //     }
// //   }

// //   return (
// //     <div className="max-w-3xl space-y-6">
// //       <PageHeader title="Initiate New Intern" subtitle="Fill details below. A secure portal link will be emailed to the candidate automatically." />
// //       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
// //         <SectionCard title="Candidate & Role Details">
// //           <div className="grid grid-cols-2 gap-4">
// //             <div className="col-span-2">
// //               <Field label="Candidate Email" required error={errors.candidate_email?.message}>
// //                 <input className="input" type="email" placeholder="candidate@college.edu"
// //                   {...register('candidate_email', { required: 'Email is required' })} />
// //               </Field>
// //             </div>
// //             <Field label="Role / Title" required error={errors.role_title?.message}>
// //               <input className="input" placeholder="e.g. R&D Intern"
// //                 {...register('role_title', { required: 'Required' })} />
// //             </Field>
// //             <Field label="Department" required error={errors.department?.message}>
// //               <select className="input" {...register('department', { required: 'Required' })}>
// //                 <option value="">Select department...</option>
// //                 {(masters.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
// //               </select>
// //             </Field>
// //             <Field label="Location" required>
// //               <select className="input" {...register('location', { required: true })}>
// //                 <option value="">Select location...</option>
// //                 {(masters.locations || []).map(l => <option key={l} value={l}>{l}</option>)}
// //               </select>
// //             </Field>
// //             <Field label="Source (Optional)">
// //               <input className="input" placeholder="e.g. VJTI, IIM Shillong, Referral"
// //                 {...register('source')} />
// //             </Field>
// //           </div>
// //         </SectionCard>

// //         <SectionCard title="Internship Duration">
// //           <div className="grid grid-cols-2 gap-4">
// //             <Field label="Start Date" required error={errors.start_date?.message}>
// //               <input type="date" className="input" {...register('start_date', { required: 'Required' })} />
// //             </Field>
// //             <Field label="End Date" required error={errors.end_date?.message}>
// //               <input type="date" className="input" {...register('end_date', { required: 'Required' })} />
// //             </Field>
// //             <Field label="Stipend Amount (₹/month)">
// //               <input type="number" className="input" {...register('stipend_amount')}
// //                 placeholder="Enter amount or pick template below" />
// //               {(masters.stipend_templates || []).length > 0 && (
// //                 <div className="flex flex-wrap gap-1.5 mt-2">
// //                   {(masters.stipend_templates || []).map(t => (
// //                     <button key={t.label} type="button"
// //                       onClick={() => setValue('stipend_amount', t.amount)}
// //                       className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors">
// //                       {t.label}: ₹{t.amount.toLocaleString('en-IN')}
// //                     </button>
// //                   ))}
// //                 </div>
// //               )}
// //             </Field>
// //             <Field label="Reporting Manager">
// //               <select className="input" {...register('reporting_manager_id')}>
// //                 <option value="">Select manager...</option>
// //                 {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
// //               </select>
// //             </Field>
// //             <Field label="Review Due Date" required error={errors.review_due_date?.message}>
// //               <input type="date" className="input" {...register('review_due_date', { required: 'Required' })} />
// //               <p className="text-xs text-slate-400 mt-1">Date by which manager must complete the evaluation. Typically a few days before end date.</p>
// //             </Field>
// //           </div>
// //         </SectionCard>

// //         <SectionCard title="Assets & Provisioning">
// //           <div className="grid grid-cols-2 gap-4">
// //             <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
// //               <input type="checkbox" id="laptop" className="w-4 h-4 text-indigo-600" {...register('laptop_required')} />
// //               <label htmlFor="laptop" className="text-sm font-medium text-slate-700">Laptop Required</label>
// //             </div>
// //             <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
// //               <input type="checkbox" id="email" className="w-4 h-4 text-indigo-600" {...register('corporate_email_required')} />
// //               <label htmlFor="email" className="text-sm font-medium text-slate-700">Corporate Email (ABG) Required</label>
// //             </div>
// //             <div className="col-span-2">
// //               <Field label="Other Assets">
// //                 <input className="input" placeholder="e.g. Access card, Lab equipment" {...register('other_assets')} />
// //               </Field>
// //             </div>
// //             <div className="col-span-2">
// //               <Field label="Notes for Accounts Team">
// //                 <textarea rows={3} className="input" placeholder="Any special instructions for stipend processing..."
// //                   {...register('notes_for_accounts')} />
// //               </Field>
// //             </div>
// //           </div>
// //         </SectionCard>

// //         <div className="flex justify-end gap-3">
// //           <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
// //           <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
// //             {isSubmitting ? 'Initiating...' : 'Initiate & Send Portal Link'}
// //           </button>
// //         </div>
// //       </form>
// //     </div>
// //   )
// // }

// import { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom'
// import { hrApi } from '../../api'
// import PDFViewer from '../../components/ui/PDFViewer'
// import { StatusBadge, SectionCard, PageHeader, Spinner, YNBadge } from '../../components/ui'
// import { CheckCircle, FileText, Send, Award, Monitor, Mail, CreditCard, Star, Download } from 'lucide-react'
// import PortalLinkManager from '../../components/ui/PortalLinkManager'
// import toast from 'react-hot-toast'
// import { format } from 'date-fns'

// // /uploads/ path goes through Vite proxy → FastAPI endpoint with iframe headers
// const fileUrl = (path) => path || null

// // Check if file is HTML fallback (when PDF libs not installed)
// const isHtmlFallback = (path) => path && path.endsWith('.html')

// // Absolute URL for open-in-new-tab (bypasses Vite proxy)
// const fileDownloadUrl = (path) => path ? `http://localhost:8000${path}` : null

// const RECOMMEND_STYLE = {
//   confirm:     'bg-green-50 border-green-200 text-green-800',
//   extend:      'bg-blue-50 border-blue-200 text-blue-800',
//   not_confirm: 'bg-red-50 border-red-200 text-red-800',
// }
// const RECOMMEND_LABEL = {
//   confirm: 'Confirm — Offer Employment',
//   extend: 'Extend Internship',
//   not_confirm: 'Do Not Confirm',
// }

// function StarDisplay({ value, max = 5 }) {
//   return (
//     <div className="flex gap-0.5 items-center">
//       {Array.from({ length: max }).map((_, i) => (
//         <Star key={i} className={`w-3.5 h-3.5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
//       ))}
//       <span className="text-xs text-slate-500 ml-1">{value}/{max}</span>
//     </div>
//   )
// }

// export default function InternDetail() {
//   const { id } = useParams()
//   const [intern, setIntern] = useState(null)
//   const [docs, setDocs] = useState([])
//   const [accountsTask, setAccountsTask] = useState(null)
//   const [itTask, setItTask] = useState(null)
//   const [loading, setLoading] = useState(true)
//   const [generating, setGenerating] = useState(false)
//   const [sendingCert, setSendingCert] = useState(false)
//   const [certData, setCertData] = useState({ project_title: '', guide_names: '', conduct_remark: 'good', issue_date: '' })
//   const [pdfViewer, setPdfViewer] = useState(null)
//   const [offerViewer, setOfferViewer] = useState(false)
//   const [certViewer, setCertViewer] = useState(false)

//   const load = () => {
//     Promise.all([
//       hrApi.getIntern(id),
//       hrApi.getDocuments(id),
//       hrApi.getAccountsTask(id).catch(() => ({ data: null })),
//       hrApi.getITTask(id).catch(() => ({ data: null })),
//     ])
//       .then(([i, d, aTask, iTask]) => {
//         setIntern(i.data)
//         setDocs(d.data)
//         setAccountsTask(aTask.data || null)
//         setItTask(iTask.data || null)
//       })
//       .catch(() => toast.error('Failed to load'))
//       .finally(() => setLoading(false))
//   }

//   useEffect(() => { load() }, [id])

//   const generateOffer = async () => {
//     setGenerating(true)
//     try {
//       await hrApi.generateOffer(id)
//       toast.success('Offer letter generated!')
//       load()
//     } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate') }
//     finally { setGenerating(false) }
//   }

//   const sendOffer = async () => {
//     setGenerating(true)
//     try {
//       await hrApi.sendOffer(id)
//       toast.success('Offer letter generated & sent to candidate!')
//       load()
//     } catch (err) { toast.error(err.response?.data?.detail || 'Failed to send offer') }
//     finally { setGenerating(false) }
//   }

//   const generateCert = async () => {
//     if (!certData.project_title || !certData.guide_names || !certData.issue_date) {
//       return toast.error('Please fill project title, guide names and issue date')
//     }
//     try {
//       await hrApi.generateCertificate(id, certData)
//       toast.success('Certificate generated!')
//       load()
//     } catch { toast.error('Failed to generate certificate') }
//   }

//   const sendCertificate = async () => {
//     setSendingCert(true)
//     try {
//       await hrApi.sendCertificate(id)
//       toast.success('Certificate sent to candidate!')
//       load()
//     } catch (err) {
//       toast.error(err.response?.data?.detail || 'Failed to send certificate')
//     } finally { setSendingCert(false) }
//   }

//   if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
//   if (!intern) return <p className="text-slate-500">Intern not found.</p>

//   const c = intern.candidate
//   const offer = intern.offer_letter
//   const cert = intern.experience_certificate
//   const review = intern.manager_review

//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title={c?.full_name || intern.candidate_email}
//         subtitle={`${intern.role_title} · ${intern.location} · ${intern.department}`}
//         action={<StatusBadge status={intern.status} />}
//       />

//       {/* Internship Details */}
//       <SectionCard title="Internship Details">
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
//           {[
//             ['Email', intern.candidate_email],
//             ['Location', intern.location],
//             ['Department', intern.department],
//             ['Stipend', `₹${parseInt(intern.stipend_amount).toLocaleString()}/month`],
//             ['Start Date', intern.start_date ? format(new Date(intern.start_date), 'dd MMM yyyy') : '—'],
//             ['End Date', intern.end_date ? format(new Date(intern.end_date), 'dd MMM yyyy') : '—'],
//             ['Duration', intern.duration_weeks ? `${intern.duration_weeks} weeks` : '—'],
//             ['Review Due Date', intern.review_due_date ? format(new Date(intern.review_due_date), 'dd MMM yyyy') : '—'],
//             ['Manager', intern.reporting_manager?.name || '—'],
//           ].map(([k, v]) => (
//             <div key={k}><p className="text-xs text-slate-500">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
//           ))}
//         </div>
//       </SectionCard>

//       {/* Tracker Flags */}
//       <SectionCard title="Completion Tracker">
//         <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
//           {[
//             ['Project Submission', intern.project_submission_done],
//             ['Presentation', intern.project_presentation_done],
//             ['Mgr Evaluation', intern.eval_from_mgr_done],
//             ['Panel Evaluation', intern.panel_evaluation_done],
//             ['Certificate Issued', intern.experience_certificate_issued],
//           ].map(([k, v]) => (
//             <div key={k} className={`flex flex-col items-center justify-center p-3 border rounded-xl text-center gap-1.5 transition-all
//               ${v ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
//               {v
//                 ? <CheckCircle className="w-5 h-5 text-green-500" />
//                 : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
//               }
//               <span className={`text-xs font-medium ${v ? 'text-green-700' : 'text-slate-400'}`}>{k}</span>
//             </div>
//           ))}
//         </div>
//       </SectionCard>

//       {/* Portal Link */}
//       <SectionCard title="Candidate Portal Link">
//         <PortalLinkManager internId={id} />
//       </SectionCard>

//       {/* Candidate Details */}
//       {c && (
//         <SectionCard title="Candidate Details">
//           {/* Personal */}
//           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Personal</p>
//           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
//             {[
//               ['Full Name', c.full_name], ['Gender', c.gender], ['Date of Birth', c.dob],
//               ['Mobile', c.mobile], ['Alternate Contact', c.contact_no],
//               ['PAN Card', c.pan_card_no], ['Aadhaar No.', c.aadhaar_no],
//               ['Emergency Contact', c.emergency_contact_name], ['Emergency Phone', c.emergency_contact_phone],
//             ].map(([k, v]) => v ? (
//               <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
//             ) : null)}
//           </div>

//           {/* Address */}
//           {(c.address || c.city) && (
//             <>
//               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Address</p>
//               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
//                 {[
//                   ['Address', c.address], ['City', c.city],
//                   ['State', c.state], ['Pincode', c.pincode],
//                 ].map(([k, v]) => v ? (
//                   <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
//                 ) : null)}
//               </div>
//             </>
//           )}

//           {/* Academic */}
//           <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Academic</p>
//           <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-5">
//             {[
//               ['Institute', c.institute_name], ['Qualification', c.qualification],
//               ['Course', c.course], ['Year of Study', c.year_of_study],
//               ['Graduation Year', c.graduation_year],
//             ].map(([k, v]) => v ? (
//               <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 mt-0.5">{v}</p></div>
//             ) : null)}
//           </div>

//           {/* Bank Details */}
//           {c.bank_details && (
//             <>
//               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Bank Details</p>
//               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
//                 {[
//                   ['Bank Name', c.bank_details.bank_name],
//                   ['Account Type', c.bank_details.account_type],
//                   ['Account Number', c.bank_details.account_number],
//                   ['IFSC Code', c.bank_details.ifsc_code],
//                   ['Account Holder', c.bank_details.account_holder_name],
//                 ].map(([k, v]) => v ? (
//                   <div key={k}><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800 mt-0.5 font-mono">{v}</p></div>
//                 ) : null)}
//               </div>
//             </>
//           )}
//         </SectionCard>
//       )}

//       {/* PDF Viewer Modal */}
//       {pdfViewer && (
//         <div
//           style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}
//           onClick={e => { if (e.target === e.currentTarget) setPdfViewer(null) }}
//         >
//           {/* Modal header */}
//           <div style={{ background: '#1e293b', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//               <FileText style={{ width: 18, height: 18, color: '#94a3b8' }} />
//               <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
//                 {pdfViewer.doc_type?.replace(/_/g, ' ')} — {pdfViewer.file_name}
//               </span>
//             </div>
//             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//               <a
//                 href={fileDownloadUrl(pdfViewer.file_url)}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 style={{ fontSize: 12, color: '#94a3b8', background: '#334155', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}
//               >
//                 Open in New Tab ↗
//               </a>

//               <button
//                 onClick={() => setPdfViewer(null)}
//                 style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '4px 8px' }}
//               >
//                 ✕
//               </button>
//             </div>
//           </div>
//           {/* PDF / HTML iframe */}
//           {isHtmlFallback(pdfViewer.file_url) ? (
//             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 16 }}>
//               <p style={{ color: '#64748b', fontSize: 14 }}>PDF preview not available — WeasyPrint not installed on server.</p>
//               <a href={fileDownloadUrl(pdfViewer.file_url)} target="_blank" rel="noopener noreferrer"
//                 style={{ background: '#4f46e5', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}>
//                 Open Document in Browser ↗
//               </a>
//             </div>
//           ) : (
//             <iframe
//               src={fileUrl(pdfViewer.file_url)}
//               style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }}
//               title={pdfViewer.file_name}
//             />
//           )}
//         </div>
//       )}

//       {/* Documents */}
//       <SectionCard title="Documents (PDF only)">
//         {docs.length === 0 ? (
//           <p className="text-sm text-slate-400">No documents uploaded yet.</p>
//         ) : (
//           <div className="space-y-3">
//             {docs.map(doc => (
//               <div key={doc.id} className="border border-slate-100 rounded-lg p-4">
//                 {/* Top row: icon + name + status */}
//                 <div className="flex items-center gap-3 mb-3">
//                   <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-slate-800 capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
//                     <p className="text-xs text-slate-400 truncate">{doc.file_name}</p>
//                     {doc.rejection_reason && (
//                       <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">Rejected: {doc.rejection_reason}</p>
//                     )}

//                   </div>
//                 </div>
//                 {/* Bottom row: view and download only */}
//                 <div className="flex gap-2 flex-wrap">
//                   <button
//                     onClick={() => setPdfViewer(doc)}
//                     className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
//                   >
//                     <FileText className="w-3.5 h-3.5" />View PDF
//                   </button>
//                   <a
//                     href={fileDownloadUrl(doc.file_url)}
//                     download
//                     className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-2 rounded-lg font-medium transition-colors"
//                   >
//                     <FileText className="w-3.5 h-3.5" />Download
//                   </a>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </SectionCard>

//       {offerViewer && <PDFViewer url={offer?.pdf_url} label={`Offer Letter — ${intern?.candidate_email}`} onClose={() => setOfferViewer(false)} />}

//       {/* Offer Letter */}
//       <SectionCard title="Offer Letter">
//         <div className="flex flex-wrap gap-3 items-center">

//           {/* No offer yet — single "Generate & Send" action */}
//           {!offer && (
//             <div className="w-full space-y-3">
//               <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
//                 <FileText className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1">
//                   <p className="text-sm font-medium text-amber-800">Offer letter not sent yet</p>
//                   <p className="text-xs text-amber-600 mt-0.5">
//                     Clicking below will generate the offer letter from candidate details and send it immediately.
//                     Make sure all candidate details are correct before sending.
//                   </p>
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={generateOffer} disabled={generating} className="btn-secondary flex items-center gap-2">
//                   <FileText className="w-4 h-4" />{generating ? 'Generating...' : 'Preview Only (Generate)'}
//                 </button>
//                 <button onClick={sendOffer} disabled={generating} className="btn-primary flex items-center gap-2">
//                   <Send className="w-4 h-4" />{generating ? 'Processing...' : 'Generate & Send to Candidate'}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Offer generated but not sent */}
//           {offer?.pdf_url && offer.status === 'draft' && (
//             <div className="w-full space-y-3">
//               <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
//                 <p className="text-sm text-blue-800 font-medium">Offer letter generated — not sent yet</p>
//               </div>
//               <div className="flex gap-2 flex-wrap">
//                 {offer.pdf_url.endsWith('.docx') ? (
//                   <a href={fileDownloadUrl(offer.pdf_url)} download className="btn-secondary flex items-center gap-2">
//                     <FileText className="w-4 h-4" />Download to Preview (.docx)
//                   </a>
//                 ) : (
//                   <button onClick={() => setOfferViewer(true)} className="btn-secondary flex items-center gap-2">
//                     <FileText className="w-4 h-4" />Preview Offer Letter
//                   </button>
//                 )}
//                 <button onClick={sendOffer} disabled={generating} className="btn-primary flex items-center gap-2">
//                   <Send className="w-4 h-4" />{generating ? 'Sending...' : 'Send to Candidate'}
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Offer sent / responded */}
//           {offer?.pdf_url && offer.status !== 'draft' && (
//             <div className="w-full space-y-3">
//               <div className="flex items-center gap-3 flex-wrap">
//                 {offer.pdf_url.endsWith('.docx') ? (
//                   <a href={fileDownloadUrl(offer.pdf_url)} download className="btn-secondary flex items-center gap-2">
//                     <FileText className="w-4 h-4" />Download Offer Letter (.docx)
//                   </a>
//                 ) : (
//                   <button onClick={() => setOfferViewer(true)} className="btn-secondary flex items-center gap-2">
//                     <FileText className="w-4 h-4" />View Offer Letter
//                   </button>
//                 )}
//                 <StatusBadge status={offer.status} />
//                 {offer?.candidate_response && (
//                   <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize
//                     ${offer.candidate_response === 'accepted' ? 'bg-green-100 text-green-700' :
//                       offer.candidate_response === 'declined' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
//                     Candidate: {offer.candidate_response}
//                   </span>
//                 )}
//               </div>
//               {offer?.candidate_remarks && (
//                 <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">Candidate remarks: "{offer.candidate_remarks}"</p>
//               )}
//               {/* Allow re-send if declined or clarification requested */}
//               {(offer.status === 'clarification_requested' || offer.status === 'declined') && (
//                 <button onClick={sendOffer} disabled={generating} className="btn-secondary flex items-center gap-2 text-sm">
//                   <Send className="w-4 h-4" />Resend Offer Letter
//                 </button>
//               )}
//             </div>
//           )}

//         </div>
//       </SectionCard>

//       {/* Accounts Task View (read-only for HR) */}
//       <SectionCard title="Accounts — Stipend & Vendor Status">
//         {!accountsTask ? (
//           <p className="text-sm text-slate-400">Accounts task not created yet. Will be created automatically when candidate accepts the offer letter.</p>
//         ) : (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//               {[
//                 ['Task Status', <StatusBadge status={accountsTask.task_status} />],
//                 ['Vendor ID', accountsTask.vendor_id || '—'],
//                 ['Payment Mode', accountsTask.payment_mode || '—'],
//                 ['Monthly Stipend', accountsTask.intern?.stipend_amount ? `₹${parseInt(accountsTask.intern.stipend_amount).toLocaleString()}` : `₹${parseInt(intern.stipend_amount).toLocaleString()}`],
//               ].map(([k, v]) => (
//                 <div key={k} className="p-3 bg-slate-50 rounded-lg">
//                   <p className="text-xs text-slate-500 mb-1">{k}</p>
//                   <div className="text-sm font-medium text-slate-800">{v}</div>
//                 </div>
//               ))}
//             </div>
//             {accountsTask.completed_at && (
//               <p className="text-xs text-green-600">✓ Vendor setup completed on {format(new Date(accountsTask.completed_at), 'dd MMM yyyy')}</p>
//             )}
//             {accountsTask.notes && (
//               <p className="text-xs text-slate-500 italic">Notes: {accountsTask.notes}</p>
//             )}
//           </div>
//         )}
//       </SectionCard>

//       {/* IT Task View (read-only for HR) */}
//      {/* IT Task View (read-only for HR) */}
// <SectionCard title="IT — Asset Provisioning Status">
//   {!itTask ? (
//     <p className="text-sm text-slate-400">IT task not created yet.</p>
//   ) : (
//     <div className="space-y-4">
      
//       {/* GRID */}
//       <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        
//         {/* Laptop */}
//         <div className={`p-3 rounded-lg border ${
//           itTask.laptop_required
//             ? (itTask.laptop_provisioned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100')
//             : 'bg-slate-50 border-slate-100'
//         }`}>
//           <div className="flex items-center gap-2 mb-1">
//             <Monitor className="w-4 h-4 text-slate-400" />
//             <p className="text-xs font-semibold text-slate-700">Laptop</p>
//           </div>

//           {itTask.laptop_required ? (
//             <>
//               <p className={`text-xs font-bold ${
//                 itTask.laptop_provisioned ? 'text-green-700' : 'text-amber-700'
//               }`}>
//                 {itTask.laptop_provisioned ? 'Provisioned' : 'Pending'}
//               </p>

//               {itTask.laptop_serial && (
//                 <p className="text-xs text-slate-500 mt-0.5">
//                   Serial: {itTask.laptop_serial}
//                 </p>
//               )}
//             </>
//           ) : (
//             <p className="text-xs text-slate-400">Not required</p>
//           )}
//         </div>

//         {/* Email */}
//         <div className={`p-3 rounded-lg border ${
//           itTask.email_required
//             ? (itTask.email_provisioned ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100')
//             : 'bg-slate-50 border-slate-100'
//         }`}>
//           <div className="flex items-center gap-2 mb-1">
//             <Mail className="w-4 h-4 text-slate-400" />
//             <p className="text-xs font-semibold text-slate-700">ABG Email</p>
//           </div>

//           {itTask.email_required ? (
//             <>
//               <p className={`text-xs font-bold ${
//                 itTask.email_provisioned ? 'text-green-700' : 'text-amber-700'
//               }`}>
//                 {itTask.email_provisioned ? 'Created' : 'Pending'}
//               </p>

//               {itTask.abg_email_id && (
//                 <p className="text-xs text-slate-500 mt-0.5">
//                   {itTask.abg_email_id}
//                 </p>
//               )}
//             </>
//           ) : (
//             <p className="text-xs text-slate-400">Not required</p>
//           )}
//         </div>

//         {/* Overall Status */}
//         <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
//           <p className="text-xs font-semibold text-slate-700 mb-1">
//             Overall Status
//           </p>

//           <StatusBadge status={itTask.task_status} />

//           {itTask.completed_at && (
//             <p className="text-xs text-slate-400 mt-1">
//               {format(new Date(itTask.completed_at), 'dd MMM yyyy')}
//             </p>
//           )}
//         </div>

//       </div>

//       {/* ✅ THIS IS THE FIX (same as Accounts) */}
//       {itTask.completed_at && (
//         <p className="text-xs text-green-600">
//           ✓ Asset provisioning completed on{' '}
//           {format(new Date(itTask.completed_at), 'dd MMM yyyy')}
//         </p>
//       )}

//       {/* Notes (optional) */}
//       {itTask.notes && (
//         <p className="text-xs text-slate-500 italic">
//           Notes: {itTask.notes}
//         </p>
//       )}

//     </div>
//   )}
// </SectionCard>

//       {/* Manager Review Result */}
//       <SectionCard title="Manager Evaluation Result">
//         {!review || !review.submitted_at ? (
//           <div className="text-center py-6 text-slate-400">
//             <Star className="w-8 h-8 mx-auto mb-2 text-slate-200" />
//             <p className="text-sm">No review submitted yet.</p>
//             {intern.review_due_date && (
//               <p className="text-xs mt-1">Review due by: <strong>{format(new Date(intern.review_due_date), 'dd MMM yyyy')}</strong></p>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-5">
//             {/* Overall + Recommendation */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="p-4 bg-amber-50 rounded-xl text-center">
//                 <p className="text-xs text-amber-600 mb-2">Overall Rating</p>
//                 <div className="flex justify-center gap-0.5 mb-1">
//                   {[1,2,3,4,5].map(n => (
//                     <Star key={n} className={`w-5 h-5 ${n <= review.overall_rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
//                   ))}
//                 </div>
//                 <p className="text-xl font-bold text-amber-900">{review.overall_rating}/5</p>
//               </div>
//               <div className={`p-4 rounded-xl border flex flex-col justify-center ${RECOMMEND_STYLE[review.recommendation] || 'bg-slate-50 border-slate-200'}`}>
//                 <p className="text-xs font-medium mb-1">Recommendation</p>
//                 <p className="text-sm font-bold">{RECOMMEND_LABEL[review.recommendation] || review.recommendation}</p>
//               </div>
//             </div>

//             {/* Individual ratings */}
//             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
//               {[
//                 ['Performance', review.performance_rating],
//                 ['Attitude', review.attitude_rating],
//                 ['Punctuality', review.punctuality_rating],
//                 ['Technical', review.technical_rating],
//                 ['Communication', review.communication_rating],
//               ].map(([k, v]) => (
//                 <div key={k} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                   <span className="text-xs text-slate-600">{k}</span>
//                   <StarDisplay value={v} />
//                 </div>
//               ))}
//             </div>

//             {/* Feedback */}
//             <div className="p-4 bg-slate-50 rounded-xl">
//               <p className="text-xs font-semibold text-slate-600 mb-2">Manager Feedback</p>
//               <p className="text-sm text-slate-700 leading-relaxed">{review.feedback_text}</p>
//             </div>

//             {/* Project */}
//             <div className="grid grid-cols-2 gap-4 text-sm">
//               <div><p className="text-xs text-slate-500">Project</p><p className="font-medium">{review.project_name}</p></div>
//               <div><p className="text-xs text-slate-500">Guide(s)</p><p className="font-medium">{review.guide_names}</p></div>
//               <div><p className="text-xs text-slate-500">Reviewed by</p><p className="font-medium">{review.manager?.name || '—'}</p></div>
//               <div><p className="text-xs text-slate-500">Submitted</p><p className="font-medium">{review.submitted_at ? format(new Date(review.submitted_at), 'dd MMM yyyy') : '—'}</p></div>
//             </div>

//             {/* Action based on recommendation */}
//             {review.recommendation === 'confirm' && !cert?.pdf_url && (
//               <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
//                 <p className="text-sm text-green-700 font-medium">Manager recommends confirmation — issue the experience certificate</p>
//                 <button onClick={() => document.getElementById('cert-section').scrollIntoView({ behavior: 'smooth' })}
//                   className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
//                   Go to Certificate ↓
//                 </button>
//               </div>
//             )}
//             {review.recommendation === 'not_confirm' && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-sm text-red-700 font-medium">Manager does not recommend confirmation. Consider closing this record.</p>
//               </div>
//             )}
//             {review.recommendation === 'extend' && (
//               <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//                 <p className="text-sm text-blue-700 font-medium">Manager recommends extending the internship. Update the end date accordingly.</p>
//               </div>
//             )}
//           </div>
//         )}
//       </SectionCard>

//       {certViewer && <PDFViewer url={cert?.pdf_url} label={`Experience Certificate — ${intern?.candidate_email}`} onClose={() => setCertViewer(false)} />}

//       {/* Student Self-Review */}
//       <SectionCard title="Student Self-Review">
//         {!intern.self_review ? (
//           <div className="flex items-center gap-3 py-4 text-slate-400">
//             <Star className="w-8 h-8 text-slate-200" />
//             <div>
//               <p className="text-sm">No self-review submitted yet.</p>
//               <p className="text-xs text-slate-300 mt-0.5">Available after candidate accepts the offer letter.</p>
//             </div>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
//               {[
//                 ['Overall Experience', intern.self_review.overall_experience],
//                 ['Learning', intern.self_review.learning_rating],
//                 ['Mentorship', intern.self_review.mentorship_rating],
//                 ['Facilities', intern.self_review.facilities_rating],
//                 ['Work Culture', intern.self_review.work_culture_rating],
//               ].map(([label, rating]) => (
//                 <div key={label} className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
//                   <p className="text-xs text-amber-600 mb-1">{label}</p>
//                   <div className="flex justify-center gap-0.5 mb-1">
//                     {[1,2,3,4,5].map(n => (
//                       <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'}`} />
//                     ))}
//                   </div>
//                   <p className="text-sm font-bold text-amber-800">{rating}/5</p>
//                 </div>
//               ))}
//             </div>
//             {intern.self_review.would_recommend !== null && (
//               <p className="text-sm">
//                 <span className="font-medium">Would recommend: </span>
//                 <span className={intern.self_review.would_recommend ? 'text-green-600' : 'text-red-600'}>
//                   {intern.self_review.would_recommend ? '✓ Yes' : '✗ No'}
//                 </span>
//               </p>
//             )}
//             {intern.self_review.key_learnings && (
//               <div><p className="text-xs font-semibold text-slate-500 mb-1">Key Learnings</p>
//               <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.key_learnings}</p></div>
//             )}
//             {intern.self_review.challenges_faced && (
//               <div><p className="text-xs font-semibold text-slate-500 mb-1">Challenges</p>
//               <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.challenges_faced}</p></div>
//             )}
//             {intern.self_review.suggestions && (
//               <div><p className="text-xs font-semibold text-slate-500 mb-1">Suggestions</p>
//               <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.suggestions}</p></div>
//             )}
//             {intern.self_review.overall_feedback && (
//               <div><p className="text-xs font-semibold text-slate-500 mb-1">Overall Feedback</p>
//               <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{intern.self_review.overall_feedback}</p></div>
//             )}
//             {intern.self_review.submitted_at && (
//               <p className="text-xs text-slate-400">Submitted: {format(new Date(intern.self_review.submitted_at + 'Z'), 'dd MMM yyyy, HH:mm')}</p>
//             )}
//           </div>
//         )}
//       </SectionCard>

//       {/* Certificate */}
//       <div id="cert-section">
//         <SectionCard title="Experience Certificate">
//           {cert?.pdf_url ? (
//             <div className="space-y-4">
//               <div className="flex items-center gap-3 flex-wrap">
//                 <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
//                   <Award className="w-5 h-5 text-green-600" />
//                   Certificate generated
//                 </div>
//                 {cert.pdf_url?.endsWith('.docx') ? (
//                   <a href={fileDownloadUrl(cert.pdf_url)} download
//                     className="btn-secondary flex items-center gap-2 text-xs">
//                     <FileText className="w-3.5 h-3.5" />Download Certificate (.docx)
//                   </a>
//                 ) : (
//                   <button onClick={() => setCertViewer(true)} className="btn-secondary flex items-center gap-2 text-xs">
//                     <FileText className="w-3.5 h-3.5" />View Certificate
//                   </button>
//                 )}
//                 <a href={fileDownloadUrl(cert.pdf_url)} download className="btn-secondary flex items-center gap-2 text-xs">
//                   Download
//                 </a>
//               </div>
//               {/* Send certificate */}
//               <div className={`p-4 rounded-xl border ${cert.delivered_to_candidate ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'}`}>
//                 {cert.delivered_to_candidate ? (
//                   <div className="flex items-center gap-2 text-green-700">
//                     <CheckCircle className="w-5 h-5" />
//                     <div>
//                       <p className="text-sm font-semibold">Certificate sent to candidate</p>
//                       {cert.delivered_at && <p className="text-xs mt-0.5">Sent on {format(new Date(cert.delivered_at), 'dd MMM yyyy, HH:mm')}</p>}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-semibold text-indigo-800">Send certificate to candidate</p>
//                       <p className="text-xs text-indigo-600 mt-0.5">Will be emailed to: {intern.candidate_email}</p>
//                     </div>
//                     <button
//                       onClick={sendCertificate}
//                       disabled={sendingCert}
//                       className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
//                     >
//                       <Send className="w-4 h-4" />
//                       {sendingCert ? 'Sending...' : 'Send to Candidate'}
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               <p className="text-xs text-slate-500">Fill in the details below to generate the experience certificate PDF.</p>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="label">Project Title *</label>
//                   <input className="input" placeholder="e.g. Performance Analysis of Yarn..."
//                     value={certData.project_title} onChange={e => setCertData(p => ({...p, project_title: e.target.value}))} />
//                 </div>
//                 <div>
//                   <label className="label">Guide Names *</label>
//                   <input className="input" placeholder="e.g. Mr. Gaurav Shrivastava and Mr. Rituraj Nagpure"
//                     value={certData.guide_names} onChange={e => setCertData(p => ({...p, guide_names: e.target.value}))} />
//                 </div>
//                 <div>
//                   <label className="label">Conduct Remark</label>
//                   <select className="input" value={certData.conduct_remark} onChange={e => setCertData(p => ({...p, conduct_remark: e.target.value}))}>
//                     <option value="good">Good</option>
//                     <option value="excellent">Excellent</option>
//                     <option value="satisfactory">Satisfactory</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="label">Issue Date *</label>
//                   <input type="date" className="input" value={certData.issue_date}
//                     onChange={e => setCertData(p => ({...p, issue_date: e.target.value}))} />
//                 </div>
//               </div>
//               <button onClick={generateCert} className="btn-primary flex items-center gap-2">
//                 <Award className="w-4 h-4" />Generate Certificate
//               </button>
//             </div>
//           )}
//         </SectionCard>
//       </div>
//     </div>
//   )
// }


import { useForm } from 'react-hook-form'
import { fetchMasters, DEFAULT_MASTERS } from '../../utils/masters'
import { useNavigate } from 'react-router-dom'
import { hrApi, authApi } from '../../api'
import { Field, PageHeader, SectionCard } from '../../components/ui'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function InitiateIntern() {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { stipend_amount: 7000, location: 'MBDD' }
  })
  const navigate = useNavigate()
  const [managers, setManagers] = useState([])
  const [masters, setMasters] = useState(DEFAULT_MASTERS)

  useEffect(() => {
    fetchMasters().then(setMasters)
    authApi.getUsers().then(r => setManagers(r.data.filter(u => u.role === 'manager'))).catch(() => {})
  }, [])

  const onSubmit = async (data) => {
    try {
      const res = await hrApi.initiateIntern(data)
      toast.success('Intern initiated! Portal link sent to candidate.')
      navigate(`/hr/intern/${res.data.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate')
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Initiate New Intern"
        subtitle="Fill details below. A secure portal link will be emailed to the candidate automatically."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Candidate & Role Details ───────────────────────────────── */}
        <SectionCard title="Candidate & Role Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Candidate Email" required error={errors.candidate_email?.message}>
                <input
                  className="input" type="email" placeholder="candidate@college.edu"
                  {...register('candidate_email', { required: 'Email is required' })}
                />
              </Field>
            </div>
            <Field label="Role / Title" required error={errors.role_title?.message}>
              <input
                className="input" placeholder="e.g. R&D Intern"
                {...register('role_title', { required: 'Required' })}
              />
            </Field>
            <Field label="Department" required error={errors.department?.message}>
              <select className="input" {...register('department', { required: 'Required' })}>
                <option value="">Select department...</option>
                {(masters.departments || []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Location" required error={errors.location?.message}>
              <select className="input" {...register('location', { required: 'Required' })}>
                <option value="">Select location...</option>
                {(masters.locations || []).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Source (Optional)">
              <input
                className="input" placeholder="e.g. VJTI, IIM Shillong, Referral"
                {...register('source')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Internship Duration ────────────────────────────────────── */}
        <SectionCard title="Internship Duration">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required error={errors.start_date?.message}>
              <input type="date" className="input" {...register('start_date', { required: 'Required' })} />
            </Field>
            <Field label="End Date" required error={errors.end_date?.message}>
              <input type="date" className="input" {...register('end_date', { required: 'Required' })} />
            </Field>
            <Field label="Stipend Amount (₹/month)">
              <input
                type="number" className="input"
                placeholder="Enter amount or pick template below"
                {...register('stipend_amount')}
              />
              {(masters.stipend_templates || []).length > 0 && (
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
              )}
            </Field>
            <Field label="Reporting Manager">
              <select className="input" {...register('reporting_manager_id')}>
                <option value="">Select manager...</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Review Due Date" required error={errors.review_due_date?.message}>
                <input type="date" className="input" {...register('review_due_date', { required: 'Required' })} />
                <p className="text-xs text-slate-400 mt-1">
                  Date by which manager must complete the evaluation. Typically a few days before end date.
                </p>
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ── Candidate Pre-fill (for Offer Letter) ─────────────────── */}
        <SectionCard title="Candidate Details (Pre-fill for Offer Letter)">
          <p className="text-xs text-slate-400 mb-4">
            Optional — fill if known, so the offer letter can be generated before the candidate completes the portal.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                className="input" placeholder="e.g. Niket Totala"
                {...register('candidate_name')}
              />
            </Field>
            <Field label="Gender">
              <select className="input" {...register('candidate_gender')}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Mobile">
              <input
                className="input" type="tel" placeholder="e.g. 9876543210"
                {...register('candidate_mobile')}
              />
            </Field>
            <Field label="Institute Name">
              <input
                className="input" placeholder="e.g. VJTI Mumbai"
                {...register('institute_name')}
              />
            </Field>
            <Field label="Qualification">
              <input
                className="input" placeholder="e.g. B.Tech, MBA"
                {...register('qualification')}
              />
            </Field>
            <Field label="Course">
              <input
                className="input" placeholder="e.g. Mechanical Engineering"
                {...register('course')}
              />
            </Field>
            <Field label="Year of Study">
              <input
                className="input" placeholder="e.g. 3rd Year"
                {...register('year_of_study')}
              />
            </Field>
            <Field label="Graduation Year">
              <input
                type="number" className="input" placeholder="e.g. 2026"
                {...register('graduation_year', { valueAsNumber: true })}
              />
            </Field>
            <Field label="City">
              <input
                className="input" placeholder="e.g. Mumbai"
                {...register('candidate_city')}
              />
            </Field>
            <Field label="State">
              <input
                className="input" placeholder="e.g. Maharashtra"
                {...register('candidate_state')}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ── Assets & Provisioning ──────────────────────────────────── */}
        <SectionCard title="Assets & Provisioning">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <input
                type="checkbox" id="laptop" className="w-4 h-4 text-indigo-600"
                {...register('laptop_required')}
              />
              <label htmlFor="laptop" className="text-sm font-medium text-slate-700">Laptop Required</label>
            </div>
            <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
              <input
                type="checkbox" id="email" className="w-4 h-4 text-indigo-600"
                {...register('corporate_email_required')}
              />
              <label htmlFor="email" className="text-sm font-medium text-slate-700">Corporate Email (ABG) Required</label>
            </div>
            <div className="col-span-2">
              <Field label="Other Assets">
                <input
                  className="input" placeholder="e.g. Access card, Lab equipment"
                  {...register('other_assets')}
                />
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Notes for Accounts Team">
                <textarea
                  rows={3} className="input"
                  placeholder="Any special instructions for stipend processing..."
                  {...register('notes_for_accounts')}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* ── Actions ───────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary px-6">
            {isSubmitting ? 'Initiating...' : 'Initiate & Send Portal Link'}
          </button>
        </div>

      </form>
    </div>
  )
}
