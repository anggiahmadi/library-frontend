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
}