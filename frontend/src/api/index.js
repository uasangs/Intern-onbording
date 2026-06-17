import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 → logout ONLY for HR/internal API calls, NOT candidate portal
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || ''
      // Candidate portal uses token-based auth — never redirect to login
      const isCandidatePortal = url.includes('/candidate/portal/')
      if (!isCandidatePortal) {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
}

// ── HR ──────────────────────────────────────────────────
export const hrApi = {
  downloadOffer: (internId) => api.get(`/hr/offer-letter/${internId}/download`, { responseType: 'arraybuffer' }),
  downloadCertificate: (internId) => api.get(`/hr/certificate/${internId}/download`, { responseType: 'arraybuffer' }),
  downloadDocument: (docId) => api.get(`/hr/document/${docId}/download`, { responseType: 'arraybuffer' }),
  dashboard: () => api.get('/hr/dashboard'),
  listInterns: (params) => api.get('/hr/interns', { params }),
  getIntern: (id) => api.get(`/hr/intern/${id}`),
  initiateIntern: (data) => api.post('/hr/initiate', data),
  updateStatus: (id, status) => api.patch(`/hr/intern/${id}/status`, { status }),
  getDocuments: (id) => api.get(`/hr/intern/${id}/documents`),
  verifyDocument: (docId, data) => api.patch(`/hr/document/${docId}/verify`, data),
  generateOffer: (id) => api.post(`/hr/intern/${id}/offer-letter/generate`),
  uploadOffer: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/hr/intern/${id}/offer-letter/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  sendOffer: (id) => api.post(`/hr/intern/${id}/offer-letter/send`),
  generateCertificate: (id, data) => api.post(`/hr/intern/${id}/certificate/generate`, data),
  uploadCertificate: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/hr/intern/${id}/certificate/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  exportExcel: () => api.get('/hr/export/excel', { responseType: 'blob' }),
  sendCertificate: (id) => api.post(`/hr/intern/${id}/certificate/send`),
  // Portal link management
  getPortalStatus: (id) => api.get(`/hr/intern/${id}/portal-status`),
  revokePortalLink: (id) => api.post(`/hr/intern/${id}/portal/revoke`),
  resendPortalLink: (id) => api.post(`/hr/intern/${id}/portal/resend`),
  getAccountsTask: (internId) => api.get(`/hr/intern/${internId}/accounts-task`),
  getITTask: (internId) => api.get(`/hr/intern/${internId}/it-task`),
  getMasters: () => api.get('/hr/masters'),
  saveMasters: (data) => api.put('/hr/masters', data),
  // Masters — per-section patch (saves only that section instantly)
  patchDepartments:      (data) => api.patch('/hr/masters/departments', data),
  patchLocations:        (data) => api.patch('/hr/masters/locations', data),
  patchAssetTypes:       (data) => api.patch('/hr/masters/asset-types', data),
  patchDocumentChecklist:(data) => api.patch('/hr/masters/document-checklist', data),
  patchStipendTemplates: (data) => api.patch('/hr/masters/stipend-templates', data),
  patchLetterFormats:    (data) => api.patch('/hr/masters/letter-formats', data),
  // Manager CRUD
  getManagers:    ()         => api.get('/hr/managers'),
  createManager:  (data)     => api.post('/hr/managers', data),
  updateManager:  (id, data) => api.patch('/hr/managers/' + id, data),
  deleteManager:  (id)       => api.delete('/hr/managers/' + id),
  enableSelfReview: (id)     => api.post(`/hr/intern/${id}/enable-self-review`),
  updateCandidatePrefill: (id, data) => api.patch(`/hr/intern/${id}/candidate-prefill`, data),
  sendTestEmail: (data)      => api.post('/hr/test-email', data),
  // downloadDocument:  (docId)    => `/api/hr/document/${docId}/download`,
  // downloadOffer:     (internId) => `/api/hr/offer-letter/${internId}/download`,
  // downloadCertificate:(internId)=> `/api/hr/certificate/${internId}/download`,
}

// ── Candidate (portal — token based) ───────────────────
export const candidateApi = {
  getPortalInfo: (token) => api.get(`/candidate/portal/${token}`),
  refreshPortalInfo: (token) => api.get(`/candidate/portal/${token}/refresh`),
  submitPortal: (token, data) => api.post(`/candidate/portal/${token}/submit`, data),
  uploadDocument: (token, docType, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/candidate/portal/${token}/upload-document?doc_type=${docType}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  signAnnexure: (token, data) => api.post(`/candidate/portal/${token}/sign-annexure`, data),
  getOffer: (token) => api.get(`/candidate/portal/${token}/offer-letter`),
  respondOffer: (token, response, remarks) =>
    api.post(`/candidate/portal/${token}/offer-response`, { response, remarks }),
  getDocuments: (token) => api.get(`/candidate/portal/${token}/documents`),
  submitSelfReview: (token, data) => api.post(`/candidate/portal/${token}/self-review`, data),
  getSelfReview: (token) => api.get(`/candidate/portal/${token}/self-review`),
}

// ── Accounts ────────────────────────────────────────────
export const accountsApi = {
  getTasks: () => api.get('/accounts/tasks'),
  getTask: (taskId) => api.get(`/accounts/task/${taskId}`),
  getTaskByIntern: (internId) => api.get(`/accounts/intern/${internId}`),
  updateTask: (taskId, data) => api.patch(`/accounts/task/${taskId}`, data),
  addStipend: (taskId, data) => api.post(`/accounts/task/${taskId}/stipend`, data),
  getStipends: (taskId) => api.get(`/accounts/task/${taskId}/stipends`),
}

// ── IT ──────────────────────────────────────────────────
export const itApi = {
  getTasks: () => api.get('/it/tasks'),
  getTask: (taskId) => api.get(`/it/task/${taskId}`),
  getTaskByIntern: (internId) => api.get(`/it/intern/${internId}`),
  updateTask: (taskId, data) => api.patch(`/it/task/${taskId}`, data),
}

// ── Manager ─────────────────────────────────────────────
export const managerApi = {
  getMyInterns: () => api.get('/manager/interns'),
  getInternDetail: (internId) => api.get(`/manager/intern/${internId}`),
  submitReview: (internId, data) => api.post(`/manager/intern/${internId}/review`, data),
  getReview: (internId) => api.get(`/manager/intern/${internId}/review`),
}