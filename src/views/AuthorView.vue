<script setup>
import { computed, onMounted, ref } from 'vue'
import PaginatedTable from '../components/PaginatedTable.vue'
import { authorService } from '../services/authorService'
import { loadAllPages } from '../utils/paginatedData'

const authors = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const errorMessage = ref('')
const formError = ref('')
const successMessage = ref('')
const search = ref('')
const showForm = ref(false)
const editingAuthor = ref(null)
const selectedAuthor = ref(null)
const detailLoading = ref(false)

let currentUser = null
try {
  const storedUser = localStorage.getItem('user')
  currentUser = storedUser ? JSON.parse(storedUser) : null
} catch {
  currentUser = null
}

const isLibrarian = computed(() => currentUser?.role === 'LIBRARIAN')

function emptyAuthor() {
  return {
    name: '',
    biography: '',
  }
}

const form = ref(emptyAuthor())

function errorText(error, fallback) {
  const responseMessage = error.response?.data?.message
  const validationMessages = error.response?.data?.errors
    ? Object.values(error.response.data.errors).flat()
    : []

  return validationMessages[0] ?? responseMessage ?? fallback
}

async function loadAuthors() {
  loading.value = true
  errorMessage.value = ''

  try {
    authors.value = await loadAllPages((page) =>
      authorService.getAll({ page, total_per_page: 1000 }),
    )
  } catch (error) {
    errorMessage.value = errorText(error, 'Data penulis gagal dimuat.')
  } finally {
    loading.value = false
  }
}

function openForm(author = null) {
  if (!isLibrarian.value) return

  editingAuthor.value = author
  form.value = author
    ? {
        name: author.name ?? '',
        biography: author.biography ?? '',
      }
    : emptyAuthor()
  formError.value = ''
  successMessage.value = ''
  showForm.value = true
}

function closeForm() {
  if (saving.value) return

  showForm.value = false
  editingAuthor.value = null
  formError.value = ''
}

async function saveAuthor() {
  if (!isLibrarian.value) return

  saving.value = true
  formError.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    name: form.value.name.trim(),
    biography: form.value.biography.trim() || null,
  }

  try {
    if (editingAuthor.value) {
      await authorService.update(editingAuthor.value.id, payload)
      successMessage.value = 'Penulis berhasil diperbarui.'
    } else {
      await authorService.create(payload)
      successMessage.value = 'Penulis berhasil ditambahkan.'
    }

    showForm.value = false
    editingAuthor.value = null
    await loadAuthors()
  } catch (error) {
    formError.value = errorText(error, 'Penulis gagal disimpan.')
  } finally {
    saving.value = false
  }
}

async function viewAuthor(author) {
  selectedAuthor.value = author
  detailLoading.value = true

  try {
    selectedAuthor.value = await authorService.getById(author.id)
  } catch (error) {
    errorMessage.value = errorText(error, 'Detail penulis gagal dimuat.')
  } finally {
    detailLoading.value = false
  }
}

async function deleteAuthor(author) {
  if (!isLibrarian.value || deletingId.value !== null) return
  if (!window.confirm(`Hapus penulis "${author.name}"?`)) return

  deletingId.value = author.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await authorService.delete(author.id)
    if (selectedAuthor.value?.id === author.id) {
      selectedAuthor.value = null
    }
    successMessage.value = 'Penulis berhasil dihapus.'
    await loadAuthors()
  } catch (error) {
    errorMessage.value = errorText(
      error,
      'Penulis gagal dihapus. Pastikan penulis belum memiliki buku.',
    )
  } finally {
    deletingId.value = null
  }
}

const filteredAuthors = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) return authors.value

  return authors.value.filter((author) =>
    [author.name, author.biography]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)),
  )
})

onMounted(loadAuthors)
</script>

<template>
  <section>
    <div v-if="!isLibrarian" class="alert alert-error">
      Halaman ini hanya dapat diakses oleh pustakawan.
    </div>

    <template v-else>
      <div class="page-heading">
        <div>
          <p class="eyebrow">COLLECTION</p>
          <h1>Penulis</h1>
          <p class="muted">Kelola data penulis dan lihat buku terkait.</p>
        </div>

        <div class="page-actions">
          <button class="button button-primary" @click="openForm()">
            Tambah Penulis
          </button>
          <button class="button button-secondary" @click="loadAuthors">
            Muat ulang
          </button>
        </div>
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div class="panel">
        <label for="search-authors">Cari penulis</label>
        <input
          id="search-authors"
          v-model="search"
          type="search"
          placeholder="Cari nama atau biografi penulis..."
        />
      </div>

      <div v-if="loading" class="panel">
        Memuat data penulis...
      </div>

      <PaginatedTable
        v-else
        class="panel"
        :items="filteredAuthors"
        v-slot="{ pageItems }"
      >
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Biografi</th>
              <th>Jumlah Buku</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="author in pageItems" :key="author.id">
              <td>{{ author.name }}</td>
              <td class="author-biography">
                {{ author.biography || '-' }}
              </td>
              <td>{{ author.books_count ?? author.books?.length ?? 0 }}</td>
              <td>
                <div class="table-actions">
                  <button
                    class="button button-secondary"
                    @click="viewAuthor(author)"
                  >
                    Lihat
                  </button>
                  <button
                    class="button button-secondary"
                    @click="openForm(author)"
                  >
                    Edit
                  </button>
                  <button
                    class="button button-danger"
                    :disabled="deletingId === author.id"
                    @click="deleteAuthor(author)"
                  >
                    {{ deletingId === author.id ? 'Menghapus...' : 'Hapus' }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredAuthors.length === 0">
              <td colspan="4" class="empty-state">
                Tidak ada data penulis yang sesuai.
              </td>
            </tr>
          </tbody>
        </table>
      </PaginatedTable>

      <div
        v-if="showForm"
        class="modal-backdrop"
        @click.self="closeForm"
      >
        <section
          class="book-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="author-form-title"
        >
          <header class="modal-header">
            <div>
              <p class="eyebrow">{{ editingAuthor ? 'EDIT AUTHOR' : 'NEW AUTHOR' }}</p>
              <h2 id="author-form-title">
                {{ editingAuthor ? 'Edit Penulis' : 'Tambah Penulis' }}
              </h2>
            </div>
            <button
              class="modal-close"
              type="button"
              aria-label="Tutup form"
              :disabled="saving"
              @click="closeForm"
            >
              &times;
            </button>
          </header>

          <form @submit.prevent="saveAuthor">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <div class="form-group">
              <label for="author-name">Nama</label>
              <input
                id="author-name"
                v-model.trim="form.name"
                maxlength="255"
                required
              />
            </div>

            <div class="form-group">
              <label for="author-biography">Biografi</label>
              <textarea
                id="author-biography"
                v-model.trim="form.biography"
                rows="5"
              ></textarea>
            </div>

            <footer class="modal-actions">
              <button
                class="button button-secondary"
                type="button"
                :disabled="saving"
                @click="closeForm"
              >
                Batal
              </button>
              <button
                class="button button-primary"
                type="submit"
                :disabled="saving"
              >
                {{
                  saving
                    ? 'Menyimpan...'
                    : editingAuthor
                      ? 'Simpan Perubahan'
                      : 'Simpan Penulis'
                }}
              </button>
            </footer>
          </form>
        </section>
      </div>

      <div
        v-if="selectedAuthor"
        class="modal-backdrop"
        @click.self="selectedAuthor = null"
      >
        <section
          class="book-modal author-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="author-detail-title"
        >
          <header class="modal-header">
            <div>
              <p class="eyebrow">AUTHOR DETAILS</p>
              <h2 id="author-detail-title">{{ selectedAuthor.name }}</h2>
            </div>
            <button
              class="modal-close"
              type="button"
              aria-label="Tutup detail"
              @click="selectedAuthor = null"
            >
              &times;
            </button>
          </header>

          <p v-if="detailLoading" class="muted">Memuat detail penulis...</p>
          <template v-else>
            <h3>Biografi</h3>
            <p class="author-detail-biography">
              {{ selectedAuthor.biography || 'Biografi belum tersedia.' }}
            </p>

            <h3>Buku</h3>
            <ul v-if="selectedAuthor.books?.length" class="author-book-list">
              <li v-for="book in selectedAuthor.books" :key="book.id">
                {{ book.title }}
              </li>
            </ul>
            <p v-else class="muted">Belum ada buku dari penulis ini.</p>
          </template>
        </section>
      </div>
    </template>
  </section>
</template>
