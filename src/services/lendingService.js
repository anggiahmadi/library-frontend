import api from './api'

export const lendingService = {
  async getAll(params = {}) {
    const response = await api.get('/lendings', { params })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/lendings', payload)
    return response.data
  },

  async returnBook(id) {
    const response = await api.post(`/lendings/${id}/return`)
    return response.data
  },
}