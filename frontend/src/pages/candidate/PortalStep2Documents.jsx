import { useState, useEffect } from 'react'
import { candidateApi } from '../../api'
import { SectionCard, Spinner } from '../../components/ui'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { fetchMasters, DEFAULT_MASTERS } from '../../utils/masters'
import PDFViewer from '../../components/ui/PDFViewer'
import toast from 'react-hot-toast'

export default function PortalStep2Documents({ token, onDone, onBack }) {
  const [pdfViewer, setPdfViewer] = useState(null) // { label, url }
  const [DOC_TYPES, setDocTypes] = useState(DEFAULT_MASTERS.document_checklist)

  useEffect(() => {
    fetchMasters().then(m => setDocTypes(m.document_checklist || DEFAULT_MASTERS.document_checklist))
  }, [])
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState({})
  const [loading, setLoading] = useState(true)

  const loadDocs = () => {
    candidateApi.getDocuments(token).then(r => setDocs(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { loadDocs() }, [token])

  const upload = async (docType, file) => {
    setUploading(p => ({ ...p, [docType]: true }))
    try {
      await candidateApi.uploadDocument(token, docType, file)
      toast.success('Document uploaded!')
      loadDocs()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(p => ({ ...p, [docType]: false }))
    }
  }

  const getDoc = (type) => docs.find(d => d.doc_type === type)
  const allUploaded = DOC_TYPES.filter(d => d.required).every(d => getDoc(d.key))

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div className="space-y-6">

      {pdfViewer && <PDFViewer url={pdfViewer.url} label={pdfViewer.label} onClose={() => setPdfViewer(null)} />}

      <SectionCard title="Upload Required Documents">
        <p className="text-sm text-slate-500 mb-5">Please upload clear scans of documents. <strong>Only PDF files accepted</strong> (max 10MB each). Use a scanner app on your phone if needed.</p>
        <div className="space-y-3">
          {DOC_TYPES.map(({ key, label, hint, required }) => {
            const doc = getDoc(key)
            return (
              <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc ? 'bg-green-50' : 'bg-slate-50'}`}>
                    {doc ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</p>
                    <p className="text-xs text-slate-400">{doc ? doc.file_name : hint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc && (
                    <button
                      onClick={() => setPdfViewer({ label: label, url: doc.file_url })}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                    >
                      <FileText className="w-3 h-3" />View
                    </button>
                  )}
                  <label className="btn-secondary cursor-pointer flex items-center gap-2 text-xs">
                    {uploading[key] ? 'Uploading...' : doc ? 'Re-upload' : 'Upload'}
                    <Upload className="w-3 h-3" />
                    <input type="file" className="hidden" accept=".pdf"
                      onChange={e => e.target.files[0] && upload(key, e.target.files[0])}
                      disabled={uploading[key]} />
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>
      <div className="flex justify-between items-center">
        <button type="button" onClick={onBack} className="btn-secondary flex items-center gap-2 text-sm">
          ← Back to Details
        </button>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500">
            {allUploaded ? '✓ All required documents uploaded' : 'Upload all required documents to proceed'}
          </p>
          <button onClick={() => onDone(docs)} disabled={!allUploaded} className="btn-primary px-8">
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}