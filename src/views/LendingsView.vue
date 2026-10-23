<script setup>
import { onMounted, ref } from 'vue'
import { lendingService } from '../services/lendingService'
import { memberService } from '../services/memberService'
// import Multiselect from '@vueform/multiselect'
// import '@vueform/multiselect/themes/default.css'

const lendings = ref([])
const loading = ref(false)
const members = ref([])
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = ref({
  member_id: '',
  book_copy_id: '',
})

function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

async function loadLendings() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await lendingService.getAll()
    lendings.value = extractItems(response)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Data peminjaman gagal dimuat.'
  } finally {
    loading.value = false
  }
}

async function loadMembers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await memberService.getAll()
    members.value = extractItems(response)
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Data anggota gagal dimuat.'
  } finally {
    loading.value = false
  }
}

async function createLending() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await lendingService.create({
      member_id: Number(form.value.member_id),
      book_copy_id: Number(form.value.book_copy_id),
    })

    if (response.status === 'PENDING') {
      successMessage.value =
        'Permintaan diterima dan masih menunggu proses lanjutan.'
    } else {
      successMessage.value =
        'Permintaan peminjaman telah diproses.'
    }

    form.value = {
      member_id: '',
      book_copy_id: '',
    }

    await loadLendings(), loadMembers()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Permintaan peminjaman gagal.'
  } finally {
    saving.value = false
  }
}

async function returnBook(lending) {
  const confirmed = window.confirm(
    'Apakah Anda yakin ingin memproses pengembalian buku ini?',
  )

  if (!confirmed) return

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await lendingService.returnBook(lending.id)

    if (response.status === 'RETURN_PENDING') {
      successMessage.value =
        'Permintaan pengembalian diterima dan sedang diproses.'
    } else {
      successMessage.value =
        'Permintaan pengembalian berhasil diproses.'
    }

    await loadLendings(), loadMembers()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Pengembalian buku gagal diproses.'
  }
}

function canReturn(status) {
  return status === 'ACTIVE'
}

onMounted(() => {
  loadLendings()
  loadMembers()
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

      <button class="button button-secondary" @click="loadLendings">
        Muat ulang
      </button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <form class="panel form-grid" @submit.prevent="createLending">
      <div>
        <h2>Peminjaman baru</h2>
        <p class="muted">
          Masukkan ID anggota dan ID eksemplar buku.
        </p>
      </div>

      <div class="form-group">
        <label for="lending-member">ID Anggota</label>
        <input
          id="lending-member"
          v-model="form.member_id"
          type="number"
          min="1"
          required
        />
        <!-- <Multiselect
          v-model="form.member_id"
          :options="members"
          value-prop="id"
          label="name"
          :searchable="true"
          placeholder="Pilih anggota"
        /> -->
        
      </div>

      <div class="form-group">
        <label for="lending-book-copy">ID Eksemplar Buku</label>
        <input
          id="lending-book-copy"
          v-model="form.book_copy_id"
          type="number"
          min="1"
          required
        />
      </div>

      <div>
        <button
          class="button button-primary"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Memproses...' : 'Ajukan Peminjaman' }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="panel">
      Memuat transaksi peminjaman...
    </div>

    <div v-else class="panel table-wrapper">
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
          <tr v-for="lending in lendings" :key="lending.id">
            <td>{{ lending.id }}</td>
            <td>{{ lending.member_id }}</td>
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
                @click="returnBook(lending)"
              >
                Kembalikan
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
    </div>
  </section>
</template>