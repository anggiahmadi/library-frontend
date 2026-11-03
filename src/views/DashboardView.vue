<script setup>
import { computed, onMounted, ref } from 'vue'
import { bookService } from '../services/bookService'
import { lendingService } from '../services/lendingService'
import { memberService } from '../services/memberService'
import { userService } from '../services/userService'

let currentUser = null
try {
  currentUser = JSON.parse(localStorage.getItem('user') ?? 'null')
} catch {
  currentUser = null
}

const userRole = computed(() => currentUser?.role ?? '')
const users = ref([])
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
    if (userRole.value === 'ADMIN') {
      const response = await userService.getAll()
      users.value = extractItems(response)
      return
    }

    if (userRole.value === 'LIBRARIAN') {
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
      return
    }

    if (userRole.value === 'MEMBER') {
      const [booksResponse, lendingsResponse] = await Promise.all([
        bookService.getAll(),
        lendingService.getAll(),
      ])

      stats.value = {
        ...stats.value,
        books: extractItems(booksResponse).length,
        lendings: extractItems(lendingsResponse).length,
      }
    }
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Dashboard gagal memuat data dari server.'
  } finally {
    loading.value = false
  }
}

const userRoleCounts = computed(() =>
  users.value.reduce(
    (counts, user) => {
      counts[user.role] = (counts[user.role] ?? 0) + 1
      return counts
    },
    { ADMIN: 0, LIBRARIAN: 0, MEMBER: 0 },
  ),
)

onMounted(loadDashboard)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">OVERVIEW</p>
        <h1>Dashboard</h1>
        <p class="muted">
          {{
            userRole === 'ADMIN'
              ? 'Ringkasan akun pengguna perpustakaan.'
              : 'Ringkasan informasi sistem perpustakaan.'
          }}
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

    <div v-else-if="userRole === 'ADMIN'" class="stats-grid">
      <article class="stat-card">
        <p>Total Pengguna</p>
        <strong>{{ users.length }}</strong>
        <span>Seluruh akun yang terdaftar</span>
      </article>

      <article class="stat-card">
        <p>Administrator</p>
        <strong>{{ userRoleCounts.ADMIN }}</strong>
        <span>Pengguna dengan role ADMIN</span>
      </article>

      <article class="stat-card">
        <p>Pustakawan</p>
        <strong>{{ userRoleCounts.LIBRARIAN }}</strong>
        <span>Pengguna dengan role LIBRARIAN</span>
      </article>

      <article class="stat-card">
        <p>Anggota</p>
        <strong>{{ userRoleCounts.MEMBER }}</strong>
        <span>Pengguna dengan role MEMBER</span>
      </article>
    </div>

    <div v-else-if="userRole === 'LIBRARIAN'" class="stats-grid">
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

    <div v-else-if="userRole === 'MEMBER'" class="stats-grid">
      <article class="stat-card">
        <p>Total Buku</p>
        <strong>{{ stats.books }}</strong>
        <span>Data katalog buku</span>
      </article>

      <article class="stat-card">
        <p>Peminjaman Saya</p>
        <strong>{{ stats.lendings }}</strong>
        <span>Transaksi akun Anda</span>
      </article>
    </div>

    <div v-if="!loading && !errorMessage" class="panel">
      <h2>Informasi sistem</h2>
      <p>
        Aplikasi menggunakan Vue.js sebagai frontend dan Laravel
        API Gateway sebagai pintu masuk ke layanan backend.
      </p>
    </div>
  </section>
</template>
