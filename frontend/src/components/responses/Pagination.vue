<template>
  <div class="pagination-content">
    <div class="pagination-item">
      <button 
        class="pagination-link nav-link" 
        :class="{ disabled: currentPage === 1 }"
        :disabled="currentPage === 1"
        @click="$emit('page-change', currentPage - 1)"
      >
        <svg class="pagination-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 12L6 8L10 4"></path>
        </svg>
        <span>Previous</span>
      </button>
    </div>
    
    <div 
      v-for="page in visiblePages" 
      :key="page" 
      class="pagination-item"
    >
      <button 
        class="pagination-link page-number"
        :class="{ active: page === currentPage }"
        @click="$emit('page-change', page)"
      >
        {{ page }}
      </button>
    </div>
    
    <div class="pagination-item">
      <button 
        class="pagination-link nav-link"
        :class="{ disabled: currentPage === totalPages }"
        :disabled="currentPage === totalPages"
        @click="$emit('page-change', currentPage + 1)"
      >
        <span>Next</span>
        <svg class="pagination-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 4L10 8L6 12"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 1
  },
  maxVisiblePages: {
    type: Number,
    default: 3
  }
})

defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  let start = Math.max(1, props.currentPage - Math.floor(props.maxVisiblePages / 2))
  let end = Math.min(props.totalPages, start + props.maxVisiblePages - 1)
  
  if (end - start + 1 < props.maxVisiblePages) {
    start = Math.max(1, end - props.maxVisiblePages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})
</script>

<style scoped>
.pagination-content {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.pagination-item {
  flex-shrink: 0;
}

.pagination-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #333;
  transition: background-color 0.2s;
}

.pagination-link:hover:not(.disabled) {
  background-color: rgba(229, 229, 229, 0.3);
}

.pagination-link.nav-link {
  min-width: 80px;
}

.pagination-link.nav-link.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-link.page-number {
  width: 36px;
  height: 36px;
  padding: 0;
  justify-content: center;
}

.pagination-link.page-number.active {
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #e5e5e5;
  color: #0a0a0a;
}

.pagination-icon {
  width: 16px;
  height: 16px;
}
</style>
