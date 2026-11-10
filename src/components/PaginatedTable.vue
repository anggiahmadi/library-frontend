<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

const pageSizeOptions = [10, 25, 50]
const currentPage = ref(1)
const pageSize = ref(pageSizeOptions[0])

const pageCount = computed(() =>
  Math.max(1, Math.ceil(props.items.length / pageSize.value)),
)

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return props.items.slice(start, start + pageSize.value)
})

const rangeStart = computed(() =>
  props.items.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1,
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, props.items.length),
)

watch(
  () => props.items,
  () => {
    currentPage.value = 1
  },
)

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count
})

function changePageSize(event) {
  pageSize.value = Number(event.target.value)
  currentPage.value = 1
}
</script>

<template>
  <div class="paginated-table">
    <div class="table-wrapper">
      <slot :page-items="pageItems" />
    </div>

    <div v-if="items.length > 0" class="pagination-controls">
      <span class="pagination-summary">
        Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ items.length }} data
      </span>

      <div class="pagination-actions">
        <label class="pagination-page-size">
          Baris per halaman
          <select :value="pageSize" @change="changePageSize">
            <option v-for="option in pageSizeOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </label>

        <button
          class="button button-secondary"
          type="button"
          :disabled="currentPage === 1"
          @click="currentPage -= 1"
        >
          Sebelumnya
        </button>
        <span class="pagination-current-page">
          Halaman {{ currentPage }} dari {{ pageCount }}
        </span>
        <button
          class="button button-secondary"
          type="button"
          :disabled="currentPage === pageCount"
          @click="currentPage += 1"
        >
          Berikutnya
        </button>
      </div>
    </div>
  </div>
</template>
