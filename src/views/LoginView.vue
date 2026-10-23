<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''

  if (!email.value.trim() || !password.value) {
    errorMessage.value = 'Email dan password wajib diisi.'
    return
  }

  loading.value = true

  try {
    const result = await authService.login({
      email: email.value,
      password: password.value,
    })

    // Sesuaikan dengan struktur respons API Gateway.
    const token = result.token ?? result.access_token

    if (!token) {
      throw new Error('Token tidak ditemukan dalam respons login.')
    }

    localStorage.setItem('access_token', token)

    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user))
    }

    router.replace({ name: 'dashboard' })
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      error.message ??
      'Login gagal. Silakan periksa kembali kredensial Anda.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <span class="brand-icon">P</span>
        <div>
          <h1>Perpustakaan</h1>
          <p>Library Management System</p>
        </div>
      </div>

      <h2>Selamat datang</h2>
      <p class="muted">Silakan masuk untuk melanjutkan.</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="email"
            type="email"
            autocomplete="username"
            placeholder="admin@library.test"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Masukkan password"
            required
          />
        </div>

        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <button
          class="button button-primary button-full"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>