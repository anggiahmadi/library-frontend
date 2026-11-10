<script setup>
import { computed, onMounted, ref } from 'vue'
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'
import PaginatedTable from '../components/PaginatedTable.vue'
import { bookService } from '../services/bookService'
import { lendingService } from '../services/lendingService'
import { memberService } from '../services/memberService'
import { extractItems, loadAllPages } from '../utils/paginatedData'

const lendings = ref([])
const loading = ref(false)
const members = ref([])
const books = ref([])
const copies = ref([])
const loadingOptions = ref(false)
const copiesLoading = ref(false)
const copiesError = ref('')
const saving = ref(false)
const returnSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedBookId = ref(null)
const lendingToProcess = ref(null)
const showReturnModal = ref(false)

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const today = formatDate(new Date())

function defaultDueDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return formatDate(date)
}

const form = ref({
  member_id: null,
  book_copy_id: null,
  due_at: defaultDueDate(),
})

async function loadLendings() {
  loading.value = true
  errorMessage.value = ''

  try {
    lendings.value = await loadAllPages((page) =>
      lendingService.getAll({ page }),
    )
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Data peminjaman gagal dimuat.'
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  loadingOptions.value = true
  errorMessage.value = ''

  try {
    const [loadedMembers, loadedBooks] = await Promise.all([
      loadAllPages((page) => memberService.getAll({ page })),
      loadAllPages((page) => bookService.getAll({ page })),
    ])
    members.value = loadedMembers
    books.value = loadedBooks
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Data anggota atau buku gagal dimuat.'
  } finally {
    loadingOptions.value = false
  }
}

async function reloadData() {
  await Promise.all([loadLendings(), loadOptions()])
}

async function selectBook(bookId) {
  selectedBookId.value = bookId
  form.value.book_copy_id = null
  copies.value = []
  copiesError.value = ''

  if (!bookId) return

  copiesLoading.value = true

  try {
    const availableCopies = await loadAllPages((page) =>
      bookService.getCopies(bookId, { page, per_page: 100 }),
    )
    copies.value = availableCopies.filter(
      (copy) => String(copy.status).toUpperCase() === 'AVAILABLE',
    )
  } catch (error) {
    copiesError.value =
      error.response?.data?.message ??
      'Data eksemplar gagal dimuat.'
  } finally {
    copiesLoading.value = false
  }
}

async function createLending() {
  if (!form.value.member_id || !form.value.book_copy_id) return
  if (form.value.due_at < today) {
    errorMessage.value = 'Jatuh tempo tidak boleh menggunakan tanggal lampau.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await lendingService.create({
      member_id: Number(form.value.member_id),
      book_copy_id: Number(form.value.book_copy_id),
      due_at: form.value.due_at,
    })

    if (response.status === 'PENDING') {
      successMessage.value =
        'Permintaan diterima dan masih menunggu proses lanjutan.'
    } else {
      successMessage.value =
        'Permintaan peminjaman telah diproses.'
    }

    form.value = {
      member_id: null,
      book_copy_id: null,
      due_at: defaultDueDate(),
    }
    selectedBookId.value = null
    copies.value = []

    await loadLendings()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Permintaan peminjaman gagal.'
  } finally {
    saving.value = false
  }
}

function openReturnModal(lending) {
  lendingToProcess.value = lending
  showReturnModal.value = true
  errorMessage.value = ''
}

function closeReturnModal() {
  if (returnSaving.value) return

  showReturnModal.value = false
  lendingToProcess.value = null
}

async function processReturn(outcome) {
  if (!lendingToProcess.value || returnSaving.value) return

  returnSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response =
      outcome === 'LOST'
        ? await lendingService.reportLost(lendingToProcess.value.id)
        : await lendingService.returnBook(lendingToProcess.value.id)

    if (outcome === 'LOST') {
      successMessage.value =
        response.status === 'LOST_PENDING'
          ? 'Pelaporan kehilangan diterima dan sedang diproses.'
          : 'Buku ditandai hilang dan status eksemplar diperbarui.'
    } else if (response.status === 'RETURN_PENDING') {
      successMessage.value =
        'Permintaan pengembalian diterima dan sedang diproses.'
    } else {
      successMessage.value =
        'Permintaan pengembalian berhasil diproses.'
    }

    showReturnModal.value = false
    lendingToProcess.value = null
    await loadLendings()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      (outcome === 'LOST'
        ? 'Pelaporan kehilangan gagal diproses.'
        : 'Pengembalian buku gagal diproses.')
  } finally {
    returnSaving.value = false
  }
}

function canReturn(status) {
  return status === 'ACTIVE'
}

const memberOptions = computed(() =>
  members.value.map((member) => ({
    value: member.id,
    label: `${member.name} (${member.member_number}) — ${member.email}`,
  })),
)

const bookOptions = computed(() =>
  books.value.map((book) => ({
    value: book.id,
    label: `${book.title} — ${book.author?.name ?? book.author_name ?? 'Penulis tidak diketahui'}`,
  })),
)

const copyOptions = computed(() =>
  copies.value.map((copy) => ({
    value: copy.id,
    label: `${copy.copy_code} — ${copy.status}`,
  })),
)

onMounted(() => {
  loadLendings()
  loadOptions()
})

</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">TRANSACTIONS</p>
        <h1>Peminjaman</h1>
        <p class="muted">
          Pengelolaan peminjaman dan pengembalian buku.
        </p>
      </div>

      <button
        class="button button-secondary"
        :disabled="loading || loadingOptions"
        @click="reloadData"
      >
        Muat ulang
      </button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <form class="panel lending-form" @submit.prevent="createLending">
      <header class="lending-form-header">
        <h2>Peminjaman baru</h2>
        <p class="muted">
          Cari anggota, lalu pilih buku berdasarkan judul dan penulis.
        </p>
      </header>

      <div class="lending-form-fields">
        <div class="form-group">
          <label for="lending-member">Anggota</label>
          <Multiselect
            id="lending-member"
            v-model="form.member_id"
            :options="memberOptions"
            :searchable="true"
            :close-on-select="true"
            :can-clear="true"
            :disabled="loadingOptions"
            placeholder="Cari nama, nomor anggota, atau email..."
          />
        </div>

        <div class="form-group">
          <label for="lending-book">Buku</label>
          <Multiselect
            id="lending-book"
            :model-value="selectedBookId"
            :options="bookOptions"
            :searchable="true"
            :close-on-select="true"
            :can-clear="true"
            :disabled="loadingOptions"
            placeholder="Cari judul buku atau nama penulis..."
            @update:model-value="selectBook"
          />
        </div>

        <div class="form-group">
          <label for="lending-book-copy">Eksemplar Tersedia</label>
          <Multiselect
            id="lending-book-copy"
            v-model="form.book_copy_id"
            :options="copyOptions"
            :searchable="true"
            :close-on-select="true"
            :can-clear="true"
            :disabled="!selectedBookId || copiesLoading || copies.length === 0"
            :placeholder="
              copiesLoading
                ? 'Memuat eksemplar...'
                : selectedBookId
                  ? 'Pilih eksemplar'
                  : 'Pilih buku terlebih dahulu'
            "
          />
          <small v-if="copiesError" class="field-error">{{ copiesError }}</small>
          <small
            v-else-if="selectedBookId && !copiesLoading && copies.length === 0"
            class="muted"
          >
            Tidak ada eksemplar tersedia untuk buku ini.
          </small>
        </div>

        <div class="form-group">
          <label for="lending-due-date">Jatuh Tempo</label>
          <input
            id="lending-due-date"
            v-model="form.due_at"
            type="date"
            :min="today"
            required
          />
        </div>
      </div>

      <div class="lending-form-submit">
        <button
          class="button button-primary"
          type="submit"
          :disabled="
            saving ||
            loadingOptions ||
            copiesLoading ||
            !form.member_id ||
            !form.book_copy_id
          "
        >
          {{ saving ? 'Memproses...' : 'Ajukan Peminjaman' }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="panel">
      Memuat transaksi peminjaman...
    </div>

    <PaginatedTable
      v-else
      class="panel"
      :items="lendings"
      v-slot="{ pageItems }"
    >
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Anggota</th>
            <th>ID Eksemplar</th>
            <th>Tanggal Pinjam</th>
            <th>Jatuh Tempo</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="lending in pageItems" :key="lending.id">
            <td>{{ lending.id }}</td>
            <td>
              <strong>{{ lending.member?.member_number ?? `ID ${lending.member_id}` }}</strong>
              <span class="lending-member-name">
                {{ lending.member?.name ?? 'Nama tidak tersedia' }}
              </span>
            </td>
            <td>{{ lending.book_copy_id }}</td>
            <td>{{ lending.borrowed_at ?? '-' }}</td>
            <td>{{ lending.due_at ?? '-' }}</td>
            <td>
              <span class="status-pill">
                {{ lending.status }}
              </span>
            </td>
            <td>
              <button
                v-if="canReturn(lending.status)"
                class="button button-secondary"
                @click="openReturnModal(lending)"
              >
                Proses
              </button>

              <span v-else class="muted">
                -
              </span>
            </td>
          </tr>

          <tr v-if="lendings.length === 0">
            <td colspan="7" class="empty-state">
              Belum ada transaksi peminjaman.
            </td>
          </tr>
        </tbody>
      </table>
    </PaginatedTable>

    <div
      v-if="showReturnModal"
      class="modal-backdrop"
      @click.self="closeReturnModal"
    >
      <section
        class="book-modal return-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">LENDING #{{ lendingToProcess?.id }}</p>
            <h2 id="return-modal-title">Konfirmasi Status Buku</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup konfirmasi"
            :disabled="returnSaving"
            @click="closeReturnModal"
          >
            &times;
          </button>
        </header>

        <p>
          Tentukan kondisi buku
          <strong>{{ lendingToProcess?.member?.member_number }}</strong>
          <span v-if="lendingToProcess?.member?.name">
            ({{ lendingToProcess.member.name }})
          </span>
          setelah peminjaman.
        </p>
        <p class="muted">
          Pilih “Buku hilang” hanya jika eksemplar tidak dikembalikan.
        </p>

        <footer class="modal-actions">
          <button
            class="button button-secondary"
            type="button"
            :disabled="returnSaving"
            @click="closeReturnModal"
          >
            Batal
          </button>
          <button
            class="button button-danger"
            type="button"
            :disabled="returnSaving"
            @click="processReturn('LOST')"
          >
            {{ returnSaving ? 'Memproses...' : 'Buku hilang' }}
          </button>
          <button
            class="button button-primary"
            type="button"
            :disabled="returnSaving"
            @click="processReturn('RETURNED')"
          >
            {{ returnSaving ? 'Memproses...' : 'Buku dikembalikan' }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>