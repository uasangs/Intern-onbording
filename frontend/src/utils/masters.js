/**
 * Masters utility — fetches from database via API.
 * Data is stored in PostgreSQL, not localStorage.
 */
import api from '../api/client'

export const DEFAULT_MASTERS = {
  departments: ['TRADC', 'MBDD', 'Manufacturing', 'R&D', 'Finance', 'IT', 'HR', 'Sales', 'Marketing'],
  locations: ['MBDD', 'TRADC'],
  asset_types: ['Laptop', 'Desktop', 'Access Card', 'Lab Equipment', 'Safety Kit', 'Mobile Phone'],
  document_checklist: [
    { key: 'id_proof',         label: 'ID Proof',                    required: true },
    { key: 'pan_card',         label: 'PAN Card',                    required: true },
    { key: 'aadhaar',          label: 'Aadhaar Card',                required: true },
    { key: 'cancelled_cheque', label: 'Cancelled Cheque / Passbook', required: true },
    { key: 'noc',              label: 'NOC from College',            required: false },
    { key: 'joining_letter',   label: 'College Joining Letter',      required: false },
  ],
  stipend_templates: [
    { label: 'Standard Intern',    amount: 7000 },
    { label: 'IIT/IIM Intern',     amount: 15000 },
    { label: 'PhD Scholar',        amount: 25000 },
    { label: 'Management Trainee', amount: 20000 },
  ],
  letter_formats: [
    { department: 'TRADC', header: 'Grasim Industries Ltd. — TRADC Division', signatory: 'Head - Human Resources, TRADC', footer: 'TRADC, Nagda, Madhya Pradesh' },
    { department: 'MBDD',  header: 'Grasim Industries Ltd. — MBDD Division',  signatory: 'Head - Human Resources, MBDD',  footer: 'Aditya Birla Centre, Worli, Mumbai 400 030' },
  ],
}

// In-memory cache so we don't fetch on every render
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/** Fetch masters from database */
export async function fetchMasters() {
  const now = Date.now()
  if (_cache && (now - _cacheTime) < CACHE_TTL) return _cache

  try {
    const res = await api.get('/hr/masters')
    _cache = { ...DEFAULT_MASTERS, ...res.data }
    _cacheTime = now
    return _cache
  } catch {
    return DEFAULT_MASTERS
  }
}

/** Save masters to database */
export async function saveMastersToDb(data) {
  const res = await api.put('/hr/masters', data)
  _cache = { ...DEFAULT_MASTERS, ...data }
  _cacheTime = Date.now()
  return res.data
}

/** Invalidate cache (call after save) */
export function invalidateMastersCache() {
  _cache = null
  _cacheTime = 0
}

/** Sync getters — use cached data or defaults (for components that loaded masters already) */
export const getDepartments      = () => (_cache || DEFAULT_MASTERS).departments
export const getLocations        = () => (_cache || DEFAULT_MASTERS).locations
export const getStipendTemplates = () => (_cache || DEFAULT_MASTERS).stipend_templates
export const getDocumentChecklist= () => (_cache || DEFAULT_MASTERS).document_checklist
export const getAssetTypes       = () => (_cache || DEFAULT_MASTERS).asset_types
export const getLetterFormat     = (dept) => ((_cache || DEFAULT_MASTERS).letter_formats || []).find(f => f.department === dept) || null