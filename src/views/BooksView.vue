<script setup>
import { computed, onMounted, ref } from 'vue'
import { authorService } from '../services/authorService'
import { bookService } from '../services/bookService'

const books = ref([])
const authors = ref([])
const loading = ref(false)
const authorsLoading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formError = ref('')
const authorError = ref('')
const successMessage = ref('')
const search = ref('')
const showForm = ref(false)
const editingBook = ref(null)
const copies = ref([])
const copiesLoading = ref(false)
const copySaving = ref(false)
const deletingCopyId = ref(null)
const copyError = ref('')
const copySuccess = ref('')
const showCopiesModal = ref(false)
const selectedBook = ref(null)
const editingCopy = ref(null)
const copyForm = ref({ copy_code: '' })
const showDetailModal = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const bookDetails = ref(null)

const storedUser = localStorage.getItem('user')
let currentUser = null

try {
  currentUser = storedUser ? JSON.parse(storedUser) : null
} catch {
  currentUser = null
}

const isLibrarian = computed(() => currentUser?.role === 'LIBRARIAN')

function emptyBook() {
  return {
    author_id: '',
    isbn: '',
    title: '',
    description: '',
    replacement_price: '',
    published_year: '',
  }
}

const form = ref(emptyBook())

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

async function loadAuthors() {
  authorsLoading.value = true
  authorError.value = ''

  try {
    const response = await authorService.getAll({ total_per_page: 1000 })
    authors.value = extractItems(response)
  } catch (error) {
    authorError.value =
      error.response?.data?.message ??
      'Data penulis gagal dimuat.'
  } finally {
    authorsLoading.value = false
  }
}

function openForm(book = null) {
  if (!isLibrarian.value) return

  editingBook.value = book
  form.value = book
    ? {
        author_id: book.author_id ?? book.author?.id ?? '',
        isbn: book.isbn ?? '',
        title: book.title ?? '',
        description: book.description ?? '',
        replacement_price: book.replacement_price ?? '',
        published_year: book.published_year ?? '',
      }
    : emptyBook()
  formError.value = ''
  authorError.value = ''
  successMessage.value = ''
  showForm.value = true
  loadAuthors()
}

function closeForm() {
  if (saving.value) return

  showForm.value = false
  editingBook.value = null
  formError.value = ''
}

async function saveBook() {
  if (!isLibrarian.value) return

  saving.value = true
  formError.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  const payload = {
    ...form.value,
    author_id: Number(form.value.author_id),
    isbn: form.value.isbn.trim() || null,
    description: form.value.description.trim() || null,
    replacement_price: Number(form.value.replacement_price),
    published_year:
      form.value.published_year === ''
        ? null
        : Number(form.value.published_year),
  }

  try {
    if (editingBook.value) {
      await bookService.update(editingBook.value.id, payload)
      successMessage.value = 'Buku berhasil diperbarui.'
    } else {
      await bookService.create(payload)
      successMessage.value = 'Buku berhasil ditambahkan.'
    }

    showForm.value = false
    editingBook.value = null
    await loadBooks()
  } catch (error) {
    formError.value =
      error.response?.data?.message ??
      'Buku gagal disimpan.'
  } finally {
    saving.value = false
  }
}

async function loadCopies() {
  if (!selectedBook.value) return

  copiesLoading.value = true
  copyError.value = ''

  try {
    const response = await bookService.getCopies(selectedBook.value.id, {
      per_page: 100,
    })
    copies.value = extractItems(response)
  } catch (error) {
    copyError.value =
      error.response?.data?.message ??
      'Data eksemplar gagal dimuat.'
  } finally {
    copiesLoading.value = false
  }
}

function openCopies(book) {
  if (!isLibrarian.value) return

  selectedBook.value = book
  copies.value = []
  copySuccess.value = ''
  copyError.value = ''
  editingCopy.value = null
  copyForm.value = { copy_code: '' }
  showCopiesModal.value = true
  loadCopies()
}

function closeCopiesModal() {
  if (copySaving.value || deletingCopyId.value !== null) return

  showCopiesModal.value = false
  selectedBook.value = null
  editingCopy.value = null
  copyError.value = ''
}

function openCopyForm(copy = null) {
  editingCopy.value = copy
  copyForm.value = { copy_code: copy?.copy_code ?? '' }
  copyError.value = ''
  copySuccess.value = ''
}

async function saveCopy() {
  if (!isLibrarian.value || !selectedBook.value) return

  copySaving.value = true
  copyError.value = ''
  copySuccess.value = ''

  try {
    const payload = { copy_code: copyForm.value.copy_code.trim() }

    if (editingCopy.value) {
      await bookService.updateCopy(editingCopy.value.id, payload)
      copySuccess.value = 'Eksemplar berhasil diperbarui.'
    } else {
      await bookService.createCopy(selectedBook.value.id, payload)
      copySuccess.value = 'Eksemplar berhasil ditambahkan.'
    }

    editingCopy.value = null
    copyForm.value = { copy_code: '' }
    await Promise.all([loadCopies(), loadBooks()])
  } catch (error) {
    copyError.value =
      error.response?.data?.message ??
      'Eksemplar gagal disimpan.'
  } finally {
    copySaving.value = false
  }
}

function canDeleteCopy(copy) {
  return ['AVAILABLE', 'LOST'].includes(String(copy.status).toUpperCase())
}

async function viewBook(book) {
  showDetailModal.value = true
  detailLoading.value = true
  detailError.value = ''
  bookDetails.value = book

  try {
    const response = await bookService.getById(book.id)
    bookDetails.value = response.data ?? response
  } catch (error) {
    detailError.value =
      error.response?.data?.message ??
      'Detail buku gagal dimuat.'
  } finally {
    detailLoading.value = false
  }
}

function closeDetailModal() {
  showDetailModal.value = false
  bookDetails.value = null
  detailError.value = ''
}

async function deleteCopy(copy) {
  if (!isLibrarian.value || !canDeleteCopy(copy)) return
  if (!window.confirm(`Hapus eksemplar "${copy.copy_code}"?`)) return

  deletingCopyId.value = copy.id
  copyError.value = ''
  copySuccess.value = ''

  try {
    await bookService.deleteCopy(copy.id)
    copySuccess.value = 'Eksemplar berhasil dihapus.'
    await Promise.all([loadCopies(), loadBooks()])
  } catch (error) {
    copyError.value =
      error.response?.data?.message ??
      'Eksemplar gagal dihapus.'
  } finally {
    deletingCopyId.value = null
  }
}

const filteredBooks = computed(() => {
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
})

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

      <div class="page-actions">
        <button
          v-if="isLibrarian"
          class="button button-primary"
          @click="openForm()"
        >
          Tambah Buku
        </button>
        <button class="button button-secondary" @click="loadBooks">
          Muat ulang
        </button>
      </div>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
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
            <th>Biaya Penggantian</th>
            <th v-if="isLibrarian">Eksemplar</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="book in filteredBooks" :key="book.id">
            <td>{{ book.title ?? '-' }}</td>
            <td>{{ book.author?.name ?? book.author_name ?? '-' }}</td>
            <td>{{ book.isbn ?? '-' }}</td>
            <td>
              {{ book.replacement_price == null
                ? '-'
                : Number(book.replacement_price).toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }) 
              }}
            </td>
            <td v-if="isLibrarian">
              {{ book.copies_count ?? book.copies?.length ?? 0 }}
            </td>
            <td>
              <div class="table-actions">
                <button
                  class="button button-secondary"
                  @click="viewBook(book)"
                >
                  Lihat
                </button>
                <template v-if="isLibrarian">
                <button
                  class="button button-secondary"
                  @click="openCopies(book)"
                >
                  Eksemplar
                </button>
                <button
                  class="button button-secondary"
                  @click="openForm(book)"
                >
                  Edit
                </button>
                <button
                  class="button button-danger"
                  @click="deleteBook(book.id)"
                >
                  Hapus
                </button>
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="filteredBooks.length === 0">
            <td :colspan="isLibrarian ? 6 : 5" class="empty-state">
              Tidak ada data buku yang sesuai.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-backdrop"
      @click.self="closeDetailModal"
    >
      <section
        class="book-modal book-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-detail-title"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">BOOK DETAILS</p>
            <h2 id="book-detail-title">
              {{ bookDetails?.title ?? 'Detail Buku' }}
            </h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup detail buku"
            @click="closeDetailModal"
          >
            &times;
          </button>
        </header>

        <div v-if="detailLoading" class="panel">
          Memuat detail buku...
        </div>
        <div v-else-if="detailError" class="alert alert-error">
          {{ detailError }}
        </div>
        <template v-else-if="bookDetails">
          <dl class="book-detail-grid">
            <div>
              <dt>Penulis</dt>
              <dd>
                {{ bookDetails.author?.name ?? bookDetails.author_name ?? '-' }}
              </dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{{ bookDetails.isbn ?? '-' }}</dd>
            </div>
            <div>
              <dt>Tahun Terbit</dt>
              <dd>{{ bookDetails.published_year ?? '-' }}</dd>
            </div>
            <div>
              <dt>Harga Pengganti</dt>
              <dd>
                {{
                  bookDetails.replacement_price == null
                    ? '-'
                    : Number(bookDetails.replacement_price).toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                      })
                }}
              </dd>
            </div>
          </dl>

          <div class="book-detail-section">
            <h3>Deskripsi</h3>
            <p class="book-detail-description">
              {{ bookDetails.description || 'Deskripsi belum tersedia.' }}
            </p>
          </div>

          <div class="book-detail-section">
            <h3>Eksemplar</h3>
            <div v-if="bookDetails.copies?.length" class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Kode Eksemplar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="copy in bookDetails.copies" :key="copy.id">
                    <td>{{ copy.copy_code }}</td>
                    <td><span class="status-pill">{{ copy.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="muted">Belum ada data eksemplar.</p>
          </div>
        </template>
      </section>
    </div>

    <div
      v-if="showCopiesModal"
      class="modal-backdrop"
      @click.self="closeCopiesModal"
    >
      <section
        class="book-modal copies-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="copies-modal-title"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">BOOK COPIES</p>
            <h2 id="copies-modal-title">
              Eksemplar: {{ selectedBook?.title }}
            </h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup pengelolaan eksemplar"
            :disabled="copySaving || deletingCopyId !== null"
            @click="closeCopiesModal"
          >
            &times;
          </button>
        </header>

        <div v-if="copySuccess" class="alert alert-success">
          {{ copySuccess }}
        </div>
        <div v-if="copyError" class="alert alert-error">
          {{ copyError }}
          <button
            v-if="copies.length === 0"
            class="button button-secondary"
            type="button"
            @click="loadCopies"
          >
            Coba lagi
          </button>
        </div>

        <form class="copy-form" @submit.prevent="saveCopy">
          <div class="form-group">
            <label for="copy-code">Kode Eksemplar</label>
            <input
              id="copy-code"
              v-model.trim="copyForm.copy_code"
              maxlength="100"
              required
            />
          </div>
          <div class="copy-form-actions">
            <button
              v-if="editingCopy"
              class="button button-secondary"
              type="button"
              :disabled="copySaving"
              @click="openCopyForm()"
            >
              Batal Edit
            </button>
            <button
              class="button button-primary"
              type="submit"
              :disabled="copySaving"
            >
              {{
                copySaving
                  ? 'Menyimpan...'
                  : editingCopy
                    ? 'Simpan Perubahan'
                    : 'Tambah Eksemplar'
              }}
            </button>
          </div>
        </form>

        <div v-if="copiesLoading" class="panel">
          Memuat data eksemplar...
        </div>

        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Kode Eksemplar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="copy in copies" :key="copy.id">
                <td>{{ copy.copy_code }}</td>
                <td>
                  <span class="status-pill">{{ copy.status }}</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button
                      class="button button-secondary"
                      type="button"
                      @click="openCopyForm(copy)"
                    >
                      Edit
                    </button>
                    <button
                      class="button button-danger"
                      type="button"
                      :disabled="!canDeleteCopy(copy) || deletingCopyId === copy.id"
                      :title="
                        canDeleteCopy(copy)
                          ? 'Hapus eksemplar'
                          : 'Hanya status AVAILABLE atau LOST yang dapat dihapus'
                      "
                      @click="deleteCopy(copy)"
                    >
                      {{ deletingCopyId === copy.id ? 'Menghapus...' : 'Hapus' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="copies.length === 0">
                <td colspan="3" class="empty-state">
                  Belum ada eksemplar untuk buku ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div
      v-if="showForm"
      class="modal-backdrop"
      @click.self="closeForm"
    >
      <section
        class="book-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">{{ editingBook ? 'EDIT BOOK' : 'NEW BOOK' }}</p>
            <h2 id="book-modal-title">
              {{ editingBook ? 'Edit Buku' : 'Tambah Buku' }}
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

        <form @submit.prevent="saveBook">
          <div v-if="formError" class="alert alert-error">
            {{ formError }}
          </div>

          <div v-if="authorError" class="alert alert-error">
            {{ authorError }}
            <button
              class="button button-secondary"
              type="button"
              @click="loadAuthors"
            >
              Coba lagi
            </button>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="book-title">Judul</label>
              <input
                id="book-title"
                v-model.trim="form.title"
                maxlength="255"
                required
              />
            </div>

            <div class="form-group">
              <label for="book-author">Penulis</label>
              <select
                id="book-author"
                v-model="form.author_id"
                required
                :disabled="authorsLoading || authors.length === 0"
              >
                <option value="" disabled>
                  {{ authorsLoading ? 'Memuat penulis...' : 'Pilih penulis' }}
                </option>
                <option
                  v-for="author in authors"
                  :key="author.id"
                  :value="author.id"
                >
                  {{ author.name }}
                </option>
              </select>
              <small v-if="!authorsLoading && authors.length === 0 && !authorError">
                Belum ada data penulis.
              </small>
            </div>

            <div class="form-group">
              <label for="book-isbn">ISBN</label>
              <input
                id="book-isbn"
                v-model.trim="form.isbn"
                maxlength="20"
              />
            </div>

            <div class="form-group">
              <label for="book-price">Harga Pengganti</label>
              <input
                id="book-price"
                v-model.number="form.replacement_price"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div class="form-group">
              <label for="book-year">Tahun Terbit</label>
              <input
                id="book-year"
                v-model.number="form.published_year"
                type="number"
                min="1000"
                max="2100"
              />
            </div>

            <div class="form-group">
              <label for="book-description">Deskripsi</label>
              <textarea
                id="book-description"
                v-model.trim="form.description"
                rows="3"
              ></textarea>
            </div>
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
              :disabled="saving || authorsLoading || authors.length === 0"
            >
              {{
                saving
                  ? 'Menyimpan...'
                  : editingBook
                    ? 'Simpan Perubahan'
                    : 'Simpan Buku'
              }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </section>
</template>
