<script setup>
import { onMounted, ref } from 'vue'
import { memberService } from '../services/memberService'

const members = ref([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showForm = ref(false)

const form = ref({
  member_number: '',
  name: '',
  email: '',
  status: 'ACTIVE',
})

function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
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

async function createMember() {
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await memberService.create(form.value)

    successMessage.value = 'Anggota berhasil ditambahkan.'
    showForm.value = false

    form.value = {
      member_number: '',
      name: '',
      email: '',
      status: 'ACTIVE',
    }

    await loadMembers()
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ??
      'Anggota gagal ditambahkan.'
  } finally {
    saving.value = false
  }
}

onMounted(loadMembers)
</script>

<template>
  <section>
    <div class="page-heading">
      <div>
        <p class="eyebrow">MEMBERS</p>
        <h1>Anggota</h1>
        <p class="muted">
          Pengelolaan anggota perpustakaan.
        </p>
      </div>

      <button
        class="button button-primary"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Tutup Form' : 'Tambah Anggota' }}
      </button>
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <form
      v-if="showForm"
      class="panel form-grid"
      @submit.prevent="createMember"
    >
      <div class="form-group">
        <label for="member-number">Nomor Anggota</label>
        <input
          id="member-number"
          v-model.trim="form.member_number"
          required
        />
      </div>

      <div class="form-group">
        <label for="member-name">Nama</label>
        <input
          id="member-name"
          v-model.trim="form.name"
          required
        />
      </div>

      <div class="form-group">
        <label for="member-email">Email</label>
        <input
          id="member-email"
          v-model.trim="form.email"
          type="email"
          required
        />
      </div>

      <div class="form-group">
        <label for="member-status">Status</label>
        <select id="member-status" v-model="form.status">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div>
        <button
          class="button button-primary"
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Menyimpan...' : 'Simpan Anggota' }}
        </button>
      </div>
    </form>

    <div v-if="loading" class="panel">
      Memuat data anggota...
    </div>

    <div v-else class="panel table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nomor Anggota</th>
            <th>Nama</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="member in members" :key="member.id">
            <td>{{ member.member_number }}</td>
            <td>{{ member.name }}</td>
            <td>{{ member.email }}</td>
            <td>
              <span class="status-pill">
                {{ member.status }}
              </span>
            </td>
          </tr>

          <tr v-if="members.length === 0">
            <td colspan="4" class="empty-state">
              Belum ada data anggota.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>