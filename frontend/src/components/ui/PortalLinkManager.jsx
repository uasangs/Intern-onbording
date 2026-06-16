import { useEffect, useState } from 'react'
import { hrApi } from '../../api'
import { Spinner } from './index'
import {
  Link2, Link2Off, RefreshCw, Copy, CheckCircle,
  Clock, AlertCircle, ShieldOff, Eye, Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

// Backend stores UTC — convert to local time for display
const toLocal = (utcStr) => {
  if (!utcStr) return null
  // Ensure the string is treated as UTC by appending Z if missing
  const str = utcStr.endsWith('Z') || utcStr.includes('+') ? utcStr : utcStr + 'Z'
  return new Date(str)
}

const STATUS_CONFIG = {
  active: {
    icon: <Link2 className="w-4 h-4" />,
    label: 'Active',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    desc: 'Candidate can access portal with this link',
  },
  revoked: {
    icon: <ShieldOff className="w-4 h-4" />,
    label: 'Revoked by HR',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
    desc: 'Candidate sees "link revoked" message',
  },
  expired: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Expired',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    desc: 'Link is older than 30 days — resend to generate new one',
  },
  not_generated: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Not Generated',
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-300',
    desc: 'No portal link has been generated yet',
  },
}

export default function PortalLinkManager({ internId }) {
  const [portalStatus, setPortalStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState(false)
  const [resending, setResending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false)

  const load = () => {
    hrApi.getPortalStatus(internId)
      .then(r => setPortalStatus(r.data))
      .catch(() => toast.error('Failed to load portal status'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [internId])

  const handleCopy = () => {
    if (!portalStatus?.portal_url) return
    navigator.clipboard.writeText(portalStatus.portal_url)
    setCopied(true)
    toast.success('Portal link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    setRevoking(true)
    setShowConfirmRevoke(false)
    try {
      const res = await hrApi.revokePortalLink(internId)
      toast.success(res.data.message)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to revoke link')
    } finally { setRevoking(false) }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      const res = await hrApi.resendPortalLink(internId)
      toast.success(res.data.message)
      // Show the new URL too
      if (res.data.portal_url) {
        setTimeout(() => {
          toast.success('New link generated — copy it below', { duration: 5000 })
        }, 500)
      }
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend link')
    } finally { setResending(false) }
  }

  if (loading) return (
    <div className="flex items-center gap-2 p-4">
      <Spinner size="sm" /><span className="text-xs text-slate-400">Loading portal status...</span>
    </div>
  )

  if (!portalStatus) return null

  const config = STATUS_CONFIG[portalStatus.status] || STATUS_CONFIG.not_generated
  const isActive = portalStatus.status === 'active'
  const canResend = ['revoked', 'expired', 'not_generated'].includes(portalStatus.status) || isActive

  return (
    <div className="space-y-4">

      {/* Status banner */}
      <div className={`flex items-start justify-between p-4 rounded-xl border ${config.color}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{config.icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              <p className="text-sm font-semibold">{config.label}</p>
            </div>
            <p className="text-xs mt-0.5 opacity-80">{config.desc}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Times Opened</span>
          </div>
          <p className="text-lg font-bold text-slate-800">{portalStatus.access_count}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Send className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Last Sent</span>
          </div>
          <p className="text-xs font-semibold text-slate-700">
            {portalStatus.sent_at ? format(toLocal(portalStatus.sent_at), 'dd/MM/yy') : '—'}
          </p>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500">Last Accessed</span>
          </div>
          <p className="text-xs font-semibold text-slate-700">
            {portalStatus.last_accessed ? format(toLocal(portalStatus.last_accessed), 'dd/MM/yy, HH:mm') : 'Never'}
          </p>
        </div>
      </div>

      {/* Extra info */}
      <div className="space-y-1.5 text-xs text-slate-500">
        {portalStatus.expires_at && (
          <div className="flex justify-between">
            <span>Link expires</span>
            <span className="font-medium text-slate-700">
              {format(toLocal(portalStatus.expires_at), 'dd/MM/yyyy, HH:mm')}
            </span>
          </div>
        )}
        {portalStatus.revoked_at && (
          <div className="flex justify-between text-red-600">
            <span>Revoked at</span>
            <span className="font-medium">{format(toLocal(portalStatus.revoked_at), 'dd/MM/yyyy, HH:mm')}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Candidate submitted portal</span>
          <span className={`font-medium ${portalStatus.portal_submitted ? 'text-green-600' : 'text-amber-600'}`}>
            {portalStatus.portal_submitted ? 'Yes' : 'Not yet'}
          </span>
        </div>
      </div>

      {/* Portal URL (only when active) */}
      {isActive && portalStatus.portal_url && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <p className="text-xs text-indigo-500 mb-1.5 font-medium">Active portal link</p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-indigo-800 truncate flex-1">
              {portalStatus.portal_url}
            </p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1 text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
            >
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 pt-1">

        {/* Resend / Generate new */}
        <button
          onClick={handleResend}
          disabled={resending || revoking}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
          {resending ? 'Sending...' : isActive ? 'Resend New Link' : 'Generate & Send New Link'}
        </button>

        {/* Revoke — only when active */}
        {isActive && (
          <>
            {showConfirmRevoke ? (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-medium">Confirm revoke?</p>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
                >
                  {revoking ? 'Revoking...' : 'Yes, Revoke'}
                </button>
                <button
                  onClick={() => setShowConfirmRevoke(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmRevoke(true)}
                disabled={revoking || resending}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Link2Off className="w-4 h-4" />
                Revoke Link
              </button>
            )}
          </>
        )}
      </div>

      {/* What happens note */}
      <div className="text-xs text-slate-400 space-y-1">
        {isActive && (
          <>
            <p>• <strong>Resend New Link</strong> — generates a fresh 30-day link and emails it. Old link stops working.</p>
            <p>• <strong>Revoke Link</strong> — candidate immediately sees "link revoked" message. Use Resend to restore access.</p>
          </>
        )}
        {portalStatus.status === 'revoked' && (
          <p>• <strong>Generate & Send New Link</strong> — creates a fresh link and restores candidate access.</p>
        )}
        {portalStatus.status === 'expired' && (
          <p>• <strong>Generate & Send New Link</strong> — creates a fresh 30-day link and emails it to the candidate.</p>
        )}
      </div>
    </div>
  )
}