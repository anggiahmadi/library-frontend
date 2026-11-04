<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
          <div class="password-input">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Masukkan password"
              required
            />
            <button
              class="password-toggle"
              type="button"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="showPassword"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 7 9 7a14.8 14.8 0 01-3 3.8" />
                <path d="M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7a10.7 10.7 0 004.1-.8" />
              </svg>
              <svg
                v-else
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
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