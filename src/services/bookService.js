import api from './api'

export const bookService = {
  async getAll(params = {}) {
    const response = await api.get('/books', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/books/${id}`)
    return response.data
  },

  async create(payload) {
    const response = await api.post('/books', payload)
    return response.data
  },

  async update(id, payload) {
    const response = await api.put(`/books/${id}`, payload)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/books/${id}`)
    return response.data
  },

  async getCopies(bookId, params = {}) {
    const response = await api.get(`/books/${bookId}/copies`, { params })
    return response.data
  },

  async createCopy(bookId, payload) {
    const response = await api.post(`/books/${bookId}/copies`, payload)
    return response.data
  },

  async updateCopy(id, payload) {
    const response = await api.put(`/book-copies/${id}`, payload)
    return response.data
  },

  async deleteCopy(id) {
    const response = await api.delete(`/book-copies/${id}`)
    return response.data
  },
}