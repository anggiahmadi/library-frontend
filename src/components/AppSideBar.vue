<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const userRole = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null')?.role ?? null
  } catch {
    return null
  }
})

const isAdmin = computed(() => userRole.value === 'ADMIN')
const isLibrarian = computed(() => userRole.value === 'LIBRARIAN')
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-icon">P</span>
      <div>
        <strong>Perpustakaan</strong>
        <small>Library System</small>
      </div>
    </div>

    <nav class="navigation">
      <RouterLink to="/" class="nav-link" exact-active-class="active">
        Dashboard
      </RouterLink>

      <RouterLink
        v-if="isAdmin"
        to="/users"
        class="nav-link"
        active-class="active"
      >
        Pengguna
      </RouterLink>

      <RouterLink
        v-if="isLibrarian"
        to="/books"
        class="nav-link"
        active-class="active"
      >
        Daftar Buku
      </RouterLink>

      <RouterLink
        v-if="isLibrarian"
        to="/authors"
        class="nav-link"
        active-class="active"
      >
        Penulis
      </RouterLink>

      <RouterLink
        v-if="isLibrarian"
        to="/members"
        class="nav-link"
        active-class="active"
      >
        Anggota
      </RouterLink>

      <RouterLink
        v-if="isLibrarian"
        to="/lendings"
        class="nav-link"
        active-class="active"
      >
        Peminjaman
      </RouterLink>

      <RouterLink
        v-if="userRole === 'MEMBER'"
        to="/books"
        class="nav-link"
        active-class="active"
      >
        Daftar Buku
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      Praktikum Microservices
    </div>
  </aside>
</template>