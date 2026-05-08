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

// On 401 → clear and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── API helpers ───────────────────────────────────────────────────────────────

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  createUser: (data) => api.post('/auth/users', data),
  listUsers: () => api.get('/auth/users'),
}

export const hrAPI = {
  dashboard: () => api.get('/hr/dashboard'),
  listInterns: (params) => api.get('/hr/interns', { params }),
  getIntern: (id) => api.get(`/hr/intern/${id}`),
  initiateIntern: (data) => api.post('/hr/initiate', data),
  getDocuments: (id) => api.get(`/hr/intern/${id}/documents`),
  verifyDocument: (docId, data) => api.patch(`/hr/document/${docId}/verify`, data),
  generateOffer: (id) => api.post(`/hr/intern/${id}/offer-letter/generate`),
  uploadOffer: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/hr/intern/${id}/offer-letter/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  sendOffer: (id) => api.post(`/hr/intern/${id}/offer-letter/send`),
  generateCertificate: (id, data) => api.post(`/hr/intern/${id}/certificate/generate`, data),
  uploadCertificate: (id, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/hr/intern/${id}/certificate/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  updateStatus: (id, status) => api.patch(`/hr/intern/${id}/status`, { status }),
  exportExcel: () => api.get('/hr/export/excel', { responseType: 'blob' }),
}

export const candidateAPI = {
  getPortal: (token) => api.get(`/candidate/portal/${token}`),
  submitPortal: (token, data) => api.post(`/candidate/portal/${token}/submit`, data),
  uploadDocument: (token, docType, file) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/candidate/portal/${token}/upload-document?doc_type=${docType}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getOffer: (token) => api.get(`/candidate/portal/${token}/offer-letter`),
  respondToOffer: (token, data) => api.post(`/candidate/portal/${token}/offer-response`, data),
  signAnnexure: (token, data) => api.post(`/candidate/portal/${token}/sign-annexure`, data),
  getDocuments: (token) => api.get(`/candidate/portal/${token}/documents`),
}

export const accountsAPI = {
  getTasks: () => api.get('/accounts/tasks'),
  getDetail: (id) => api.get(`/accounts/intern/${id}`),
  updateTask: (taskId, data) => api.patch(`/accounts/task/${taskId}`, data),
  addStipend: (taskId, data) => api.post(`/accounts/task/${taskId}/stipend`, data),
  getStipends: (taskId) => api.get(`/accounts/task/${taskId}/stipends`),
}

export const itAPI = {
  getTasks: () => api.get('/it/tasks'),
  getDetail: (id) => api.get(`/it/intern/${id}`),
  updateTask: (taskId, data) => api.patch(`/it/task/${taskId}`, data),
}

export const managerAPI = {
  getInterns: () => api.get('/manager/interns'),
  submitReview: (id, data) => api.post(`/manager/intern/${id}/review`, data),
  getReview: (id) => api.get(`/manager/intern/${id}/review`),
}