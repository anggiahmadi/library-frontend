<script setup>
import { onMounted, ref } from 'vue'
import { bookService } from '../services/bookService'

const books = ref([])
const loading = ref(false)
const errorMessage = ref('')
const search = ref('')

function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

async function loadBooks() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await bookService.getAll()
    books.value = extractItems(response)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Data buku gagal dimuat.'
  } finally {
    loading.value = false
  }
}

const filteredBooks = () => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) return books.value

  return books.value.filter((book) =>
    [
      book.title,
      book.author?.name,
      book.isbn,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)),
  )
}

onMounted(loadBooks)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">COLLECTION</p>
        <h1>Daftar Buku</h1>
        <p class="muted">
          Katalog buku yang dikelola oleh Book Service.
        </p>
      </div>

      <button class="button button-secondary" @click="loadBooks">
        Muat ulang
      </button>
    </div>

    <div class="panel">
      <label for="search-books">Cari buku</label>
      <input
        id="search-books"
        v-model="search"
        type="search"
        placeholder="Cari judul, penulis, atau ISBN..."
      />
    </div>

    <div v-if="loading" class="panel">
      Memuat data buku...
    </div>

    <div v-else-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
      <button class="button button-secondary" @click="loadBooks">
        Coba lagi
      </button>
    </div>

    <div v-else class="panel table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Judul</th>
            <th>Penulis</th>
            <th>ISBN</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="book in filteredBooks()" :key="book.id">
            <td>{{ book.title ?? '-' }}</td>
            <td>{{ book.author?.name ?? book.author_name ?? '-' }}</td>
            <td>{{ book.isbn ?? '-' }}</td>
            <td>
              <span class="status-pill">
                {{ book.status ?? 'Tidak diketahui' }}
              </span>
            </td>
          </tr>

          <tr v-if="filteredBooks().length === 0">
            <td colspan="4" class="empty-state">
              Tidak ada data buku yang sesuai.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>