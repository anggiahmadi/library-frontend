<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
</script>

<!-- eslint-disable vue/comment-directive -->
<template>
  <div class="app-shell">
    <AppSidebar />

    <div class="main-area">
      <AppHeader />

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>