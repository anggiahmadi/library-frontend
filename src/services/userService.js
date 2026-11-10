import api from './api'

export const userService = {
  async getAll(params = {}) {
    const response = await api.get('/users', { params })
    return response.data
  },

  async updateStatus(id, isActive) {
    const response = await api.put(`/users/${id}/status`, {
      is_active: isActive,
    })
    return response.data
  },

  async resetPassword(id, payload) {
    const response = await api.post(`/users/${id}/reset-password`, payload)
    return response.data
  },
}
