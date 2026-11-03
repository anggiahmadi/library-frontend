import api from './api'

export const authorService = {
  async getAll(params = {}) {
    const response = await api.get('/authors', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/authors/${id}`)
    return response.data
  },

  async create(payload) {
    const response = await api.post('/authors', payload)
    return response.data
  },

  async update(id, payload) {
    const response = await api.put(`/authors/${id}`, payload)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/authors/${id}`)
    return response.data
  },
}
