<script setup>
import { computed, onMounted, ref } from 'vue'
import { memberService } from '../services/memberService'

const members = ref([])
const loading = ref(false)
const saving = ref(false)
const savingEdit = ref(false)
const errorMessage = ref('')
const editError = ref('')
const successMessage = ref('')
const showForm = ref(false)
const showEditForm = ref(false)
const editingMember = ref(null)
const search = ref('')

const form = ref({
  member_number: '',
  name: '',
  email: '',
  status: 'ACTIVE',
})

const editForm = ref({
  name: '',
  email: '',
})

function extractItems(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response.data)) return response.data
  if (Array.isArray(response.data?.data)) return response.data.data
  return []
}

function getErrorMessage(error, fallback) {
  const validationMessages = error.response?.data?.errors
    ? Object.values(error.response.data.errors).flat()
    : []

  return (
    validationMessages[0] ??
    error.response?.data?.message ??
    fallback
  )
}

async function loadMembers() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await memberService.getAll()
    members.value = extractItems(response)
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Data anggota gagal dimuat.')
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
    errorMessage.value = getErrorMessage(error, 'Anggota gagal ditambahkan.')
  } finally {
    saving.value = false
  }
}

function openEditForm(member) {
  editingMember.value = member
  editForm.value = {
    name: member.name ?? '',
    email: member.email ?? '',
  }
  editError.value = ''
  showEditForm.value = true
}

function closeEditForm() {
  if (savingEdit.value) return

  showEditForm.value = false
  editingMember.value = null
  editError.value = ''
}

async function updateMember() {
  if (!editingMember.value) return

  savingEdit.value = true
  editError.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await memberService.update(editingMember.value.id, {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
    })

    successMessage.value = 'Data anggota berhasil diperbarui.'
    showEditForm.value = false
    editingMember.value = null
    await loadMembers()
  } catch (error) {
    editError.value = getErrorMessage(error, 'Data anggota gagal diperbarui.')
  } finally {
    savingEdit.value = false
  }
}

const filteredMembers = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) return members.value

  return members.value.filter((member) =>
    [
      member.member_number,
      member.name,
      member.email,
      member.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)),
  )
})

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

      <div class="page-actions">
        <button
          class="button button-primary"
          @click="showForm = !showForm"
        >
          {{ showForm ? 'Tutup Form' : 'Tambah Anggota' }}
        </button>
        <button class="button button-secondary" @click="loadMembers">
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
      <label for="search-members">Cari anggota</label>
      <input
        id="search-members"
        v-model="search"
        type="search"
        placeholder="Cari nomor anggota, nama, email, atau status..."
      />
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
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="member in filteredMembers" :key="member.id">
            <td>{{ member.member_number }}</td>
            <td>{{ member.name }}</td>
            <td>{{ member.email }}</td>
            <td>
              <span class="status-pill">
                {{ member.status }}
              </span>
            </td>
            <td>
              <button
                class="button button-secondary"
                @click="openEditForm(member)"
              >
                Edit
              </button>
            </td>
          </tr>

          <tr v-if="filteredMembers.length === 0">
            <td colspan="5" class="empty-state">
              {{
                members.length === 0
                  ? 'Belum ada data anggota.'
                  : 'Tidak ada anggota yang sesuai dengan pencarian.'
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showEditForm"
      class="modal-backdrop"
      @click.self="closeEditForm"
    >
      <section
        class="book-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-member-title"
      >
        <header class="modal-header">
          <div>
            <p class="eyebrow">EDIT MEMBER</p>
            <h2 id="edit-member-title">Edit Anggota</h2>
          </div>
          <button
            class="modal-close"
            type="button"
            aria-label="Tutup form edit"
            :disabled="savingEdit"
            @click="closeEditForm"
          >
            &times;
          </button>
        </header>

        <form @submit.prevent="updateMember">
          <div v-if="editError" class="alert alert-error">
            {{ editError }}
          </div>

          <div class="form-group">
            <label for="edit-member-name">Nama</label>
            <input
              id="edit-member-name"
              v-model.trim="editForm.name"
              maxlength="255"
              required
            />
          </div>

          <div class="form-group">
            <label for="edit-member-email">Email</label>
            <input
              id="edit-member-email"
              v-model.trim="editForm.email"
              type="email"
              maxlength="255"
              required
            />
          </div>

          <footer class="modal-actions">
            <button
              class="button button-secondary"
              type="button"
              :disabled="savingEdit"
              @click="closeEditForm"
            >
              Batal
            </button>
            <button
              class="button button-primary"
              type="submit"
              :disabled="savingEdit"
            >
              {{ savingEdit ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </section>
</template>