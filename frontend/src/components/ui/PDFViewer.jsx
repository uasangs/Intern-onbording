// import { useState } from 'react'
// import { X, Download, ExternalLink } from 'lucide-react'

// /**
//  * PDFViewer — renders PDF using <embed>
//  * Accepts path like /uploads/documents/xxx.pdf
//  */
// export default function PDFViewer({ url, label, onClose }) {
//   const [error, setError] = useState(false)

//   if (!url) return (
//     <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
//         <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600 }}>{label}</span>
//         <button onClick={onClose} style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
//       </div>
//       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
//         File not available
//       </div>
//     </div>
//   )

//   // Always use direct backend URL (http://localhost:8000/uploads/...)
//   // This bypasses Vite proxy which can sometimes interfere with binary responses
//   const directUrl = url.startsWith('http')
//     ? url
//     : `http://localhost:8000${url}`

//   return (
//     <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column' }}>
//       {/* Header */}
//       <div style={{
//         background: '#1e293b', padding: '10px 16px', flexShrink: 0,
//         display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//         borderBottom: '1px solid #334155'
//       }}>
//         <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
//           {label}
//         </span>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <a
//             href={directUrl}
//             target="_blank"
//             rel="noopener noreferrer"
//             style={{ fontSize: 12, color: '#94a3b8', background: '#334155', padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
//           >
//             ↗ Open in New Tab
//           </a>
//           <a
//             href={directUrl}
//             download
//             style={{ fontSize: 12, color: '#cbd5e1', background: '#4f46e5', padding: '5px 12px', borderRadius: 6, textDecoration: 'none' }}
//           >
//             ↓ Download
//           </a>
//           <button
//             onClick={onClose}
//             style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
//           >
//             ✕
//           </button>
//         </div>
//       </div>

//       {/* PDF embed */}
//       {error ? (
//         <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#f8fafc' }}>
//           <p style={{ color: '#64748b', fontSize: 14 }}>Your browser could not display the PDF inline.</p>
//           <a
//             href={directUrl}
//             target="_blank"
//             rel="noopener noreferrer"
//             style={{ background: '#4f46e5', color: '#fff', padding: '10px 28px', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
//           >
//             Open PDF in New Tab ↗
//           </a>
//         </div>
//       ) : (
//         <embed
//           src={directUrl}
//           type="application/pdf"
//           style={{ flex: 1, width: '100%', border: 'none' }}
//           onError={() => setError(true)}
//         />
//       )}
//     </div>
//   )
// }

import { X, Download, ExternalLink } from 'lucide-react'

/**
 * PDFViewer — renders any file (PDF, docx) inline via iframe.
 * Uses relative /uploads/... path so requests go through the Vite proxy
 * to FastAPI — same approach as the working Documents section.
 */
export default function PDFViewer({ url, label, onClose }) {

  if (!url) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#1e293b', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>{label}</span>
        <button onClick={onClose} style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
        File not available
      </div>
    </div>
  )

  // Relative path → goes through Vite proxy → FastAPI (same as Documents viewer)
  const proxyUrl = url

  // Absolute URL for download only
  const downloadUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Header */}
      <div style={{
        background: '#1e293b', padding: '12px 20px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #334155'
      }}>
        <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#94a3b8', background: '#334155', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            Open in New Tab ↗
          </a>
          <a
            href={downloadUrl}
            download
            style={{ fontSize: 12, color: '#cbd5e1', background: '#4f46e5', padding: '6px 12px', borderRadius: 6, textDecoration: 'none' }}
          >
            ↓ Download
          </a>
          <button
            onClick={onClose}
            style={{ fontSize: 20, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inline viewer — Vite proxy serves the file with correct headers */}
      <iframe
        src={proxyUrl}
        style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }}
        title={label}
      />
    </div>
  )
}