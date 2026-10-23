<script setup>
import { onMounted, ref } from 'vue'
import { bookService } from '../services/bookService'
import { memberService } from '../services/memberService'
import { lendingService } from '../services/lendingService'

const stats = ref({
  books: 0,
  members: 0,
  lendings: 0,
})

const loading = ref(true)
const errorMessage = ref('')

function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [booksResponse, membersResponse, lendingsResponse] =
      await Promise.all([
        bookService.getAll(),
        memberService.getAll(),
        lendingService.getAll(),
      ])

    stats.value = {
      books: extractItems(booksResponse).length,
      members: extractItems(membersResponse).length,
      lendings: extractItems(lendingsResponse).length,
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Dashboard gagal memuat data dari server.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>Dashboard</h1>
        <p class="muted">
          Ringkasan informasi sistem perpustakaan.
        </p>
      </div>
    </div>

    <div v-if="loading" class="panel">
      Memuat ringkasan data...
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
      <button class="button button-secondary" @click="loadDashboard">
        Coba lagi
      </button>
    </div>

    <div v-else class="stats-grid">
      <article class="stat-card">
        <p>Total Buku</p>
        <strong>{{ stats.books }}</strong>
        <span>Data katalog buku</span>
      </article>

      <article class="stat-card">
        <p>Total Anggota</p>
        <strong>{{ stats.members }}</strong>
        <span>Data anggota perpustakaan</span>
      </article>

      <article class="stat-card">
        <p>Total Peminjaman</p>
        <strong>{{ stats.lendings }}</strong>
        <span>Transaksi yang tercatat</span>
      </article>
    </div>

    <div class="panel">
      <h2>Informasi sistem</h2>
      <p>
        Aplikasi menggunakan Vue.js sebagai frontend dan Laravel
        API Gateway sebagai pintu masuk ke layanan backend.
      </p>
    </div>
  </section>
</template>