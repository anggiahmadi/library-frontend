<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppSideBar from '../components/AppSideBar.vue'
</script>

<!-- eslint-disable vue/comment-directive -->
<template>
  <div class="app-shell">
    <AppSideBar />

    <div class="main-area">
      <AppHeader />

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>