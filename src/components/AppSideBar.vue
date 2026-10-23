<script setup>
import { RouterLink } from 'vue-router'
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

      <RouterLink to="/books" class="nav-link" active-class="active">
        Daftar Buku
      </RouterLink>

      <RouterLink to="/members" class="nav-link" active-class="active">
        Anggota
      </RouterLink>

      <RouterLink to="/lendings" class="nav-link" active-class="active">
        Peminjaman
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      Praktikum Microservices
    </div>
  </aside>
</template>