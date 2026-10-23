<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
  router.replace({ name: 'login' })
}
</script>

<template>
  <header class="app-header">
    <div>
      <h2>Library Management</h2>
      <p>Sistem informasi perpustakaan</p>
    </div>

    <button class="button button-secondary" @click="logout">
      Logout
    </button>
  </header>
</template>