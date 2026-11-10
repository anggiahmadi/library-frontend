<script setup>
import { computed, onMounted, ref } from 'vue'
import PaginatedTable from '../components/PaginatedTable.vue'
import { userService } from '../services/userService'
import { loadAllPages } from '../utils/paginatedData'

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const changingStatusId = ref(null)
const errorMessage = ref('')
const formError = ref('')
const successMessage = ref('')
const search = ref('')
const showPasswordForm = ref(false)
const selectedUser = ref(null)
const passwordForm = ref({
  password: '',
  password_confirmation: '',
})

let currentUser = null
try {
  currentUser = JSON.parse(localStorage.getItem('user') ?? 'null')
} catch {
  currentUser = null
}

const isAdmin = computed(() => currentUser?.role === 'ADMIN')

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

async function loadUsers() {
  if (!isAdmin.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    users.value = await loadAllPages((page) => userService.getAll({ page }))
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Data pengguna gagal dimuat.')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(user) {
  if (!isAdmin.value || changingStatusId.value !== null) return

  changingStatusId.value = user.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await userService.updateStatus(user.id, !user.is_active)
    const updatedUser = response.data ?? response
    users.value = users.value.map((item) =>
      item.id === user.id ? { ...item, ...updatedUser } : item,
    )
    successMessage.value = `Status ${user.name} berhasil ${
      updatedUser.is_active ? 'diaktifkan' : 'dinonaktifkan'
    }.`
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      'Status pengguna gagal diperbarui.',
    )
  } finally {
    changingStatusId.value = null
  }
}

function openPasswordForm(user) {
  selectedUser.value = user
  passwordForm.value = {
    password: '',
    password_confirmation: '',
  }
  formError.value = ''
  showPasswordForm.value = true
}

function closePasswordForm() {
  if (saving.value) return

  showPasswordForm.value = false
  selectedUser.value = null
  formError.value = ''
}

async function resetPassword() {
  if (!isAdmin.value || !selectedUser.value) return

  saving.value = true
  formError.value = ''
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userService.resetPassword(selectedUser.value.id, passwordForm.value)
    successMessage.value = `Password ${selectedUser.value.name} berhasil direset.`
    showPasswordForm.value = false
    selectedUser.value = null
    passwordForm.value = {
      password: '',
      password_confirmation: '',
    }
  } catch (error) {
    formError.value = getErrorMessage(error, 'Password gagal direset.')
  } finally {
    saving.value = false
  }
}

const filteredUsers = computed(() => {
  const keyword = search.value.trim().toLowerCase()

  if (!keyword) return users.value

  return users.value.filter((user) =>
    [user.name, user.email, user.role]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword)),
  )
})

onMounted(loadUsers)
</script>

<template>
  <section>
    <div v-if="!isAdmin" class="alert alert-error">
      Halaman ini hanya dapat diakses oleh administrator.
    </div>

    <template v-else>
      <div class="page-heading">
        <div>
          <p class="eyebrow">ADMINISTRATION</p>
          <h1>Pengguna</h1>
          <p class="muted">
            Kelola status akun dan reset password pengguna.
          </p>
        </div>

        <button class="button button-secondary" @click="loadUsers">
          Muat ulang
        </button>
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div class="panel">
        <label for="search-users">Cari pengguna</label>
        <input
          id="search-users"
          v-model="search"
          type="search"
          placeholder="Cari nama, email, atau role..."
        />
      </div>

      <div v-if="loading" class="panel">
        Memuat data pengguna...
      </div>
      <PaginatedTable
        v-else
        class="panel"
        :items="filteredUsers"
        v-slot="{ pageItems }"
      >
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in pageItems" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td><span class="status-pill">{{ user.role }}</span></td>
              <td>
                <span
                  class="status-pill"
                  :class="user.is_active ? 'user-status-active' : 'user-status-inactive'"
                >
                  {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="table-actions">
                  <button
                    class="button button-secondary"
                    :disabled="
                      changingStatusId === user.id ||
                      user.id === currentUser?.id
                    "
                    :title="
                      user.id === currentUser?.id
                        ? 'Anda tidak dapat menonaktifkan akun sendiri'
                        : ''
                    "
                    @click="toggleStatus(user)"
                  >
                    {{
                      changingStatusId === user.id
                        ? 'Memproses...'
                        : user.is_active
                          ? 'Nonaktifkan'
                          : 'Aktifkan'
                    }}
                  </button>
                  <button
                    class="button button-secondary"
                    @click="openPasswordForm(user)"
                  >
                    Reset Password
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="empty-state">
                Tidak ada pengguna yang sesuai.
              </td>
            </tr>
          </tbody>
        </table>
      </PaginatedTable>

      <div
        v-if="showPasswordForm"
        class="modal-backdrop"
        @click.self="closePasswordForm"
      >
        <section
          class="book-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
        >
          <header class="modal-header">
            <div>
              <p class="eyebrow">ACCOUNT SECURITY</p>
              <h2 id="reset-password-title">
                Reset Password
              </h2>
              <p class="muted">{{ selectedUser?.name }}</p>
            </div>
            <button
              class="modal-close"
              type="button"
              aria-label="Tutup form"
              :disabled="saving"
              @click="closePasswordForm"
            >
              &times;
            </button>
          </header>

          <form @submit.prevent="resetPassword">
            <div v-if="formError" class="alert alert-error">
              {{ formError }}
            </div>

            <div class="form-group">
              <label for="user-password">Password baru</label>
              <input
                id="user-password"
                v-model="passwordForm.password"
                type="password"
                minlength="8"
                autocomplete="new-password"
                required
              />
            </div>

            <div class="form-group">
              <label for="user-password-confirmation">
                Konfirmasi password baru
              </label>
              <input
                id="user-password-confirmation"
                v-model="passwordForm.password_confirmation"
                type="password"
                minlength="8"
                autocomplete="new-password"
                required
              />
            </div>

            <footer class="modal-actions">
              <button
                class="button button-secondary"
                type="button"
                :disabled="saving"
                @click="closePasswordForm"
              >
                Batal
              </button>
              <button
                class="button button-primary"
                type="submit"
                :disabled="saving"
              >
                {{ saving ? 'Menyimpan...' : 'Reset Password' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </template>
  </section>
</template>