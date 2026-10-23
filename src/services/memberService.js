import api from './api'

export const memberService = {
  async getAll(params = {}) {
    const response = await api.get('/members', { params })
    return response.data
  },

  async create(payload) {
    const response = await api.post('/members', payload)
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/members/${id}`)
    return response.data
  },
}