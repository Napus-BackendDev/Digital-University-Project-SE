<template>
  <div class="pagination-container" v-if="totalPages > 0">
    <button 
      class="pagination-button prev-button" 
      :disabled="currentPage === 1"
      :class="{ disabled: currentPage === 1 }"
      @click="handlePrev"
    >
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Previous</span>
    </button>
    
    <button 
      v-for="page in visiblePages" 
      :key="page"
      class="pagination-button page-button"
      :class="{ active: page === currentPage }"
      @click="handleGoto(page)"
    >
      {{ page }}
    </button>
    
    <button 
      class="pagination-button next-button" 
      :disabled="currentPage === totalPages"
      :class="{ disabled: currentPage === totalPages }"
      @click="handleNext"
    >
      <span>Next</span>
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
/**
 * Pagination - Unified pagination component
 * Supports both emit patterns:
 * - prev/next/goto (default)
 * - page-change (when usePageChange=true)
 */
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  },
  // Use 'page-change' emit instead of prev/next/goto
  usePageChange: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['prev', 'next', 'goto', 'page-change'])

// Handle prev button
function handlePrev() {
  if (props.usePageChange) {
    emit('page-change', props.currentPage - 1)
  } else {
    emit('prev')
  }
}

// Handle next button
function handleNext() {
  if (props.usePageChange) {
    emit('page-change', props.currentPage + 1)
  } else {
    emit('next')
  }
}

// Handle page number click
function handleGoto(page) {
  if (props.usePageChange) {
    emit('page-change', page)
  } else {
    emit('goto', page)
  }
}

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage
  const max = props.maxVisiblePages
  
  if (total <= max) {
    // Show all pages if total is less than max
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show limited pages with current page in middle when possible
    if (current <= 3) {
      // Near start
      for (let i = 1; i <= Math.min(max, total); i++) {
        pages.push(i)
      }
    } else if (current >= total - 2) {
      // Near end
      for (let i = total - max + 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Middle - show current page with neighbors
      const half = Math.floor(max / 2)
      for (let i = current - half; i <= current + half; i++) {
        if (i > 0 && i <= total) {
          pages.push(i)
        }
      }
    }
  }
  
  return pages
})
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0px;
  gap: 4px;
  width: auto;
  min-width: 299.66px;
  height: 36px;
  flex: none;
  order: 3;
  flex-grow: 0;
}

.pagination-button {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
  gap: 4px;
  height: 36px;
  background: #FFFFFF;
  border: 1px solid rgba(229, 229, 229, 0.3);
  border-radius: 12px;
  flex: none;
  order: 0;
  flex-grow: 0;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.pagination-button svg {
  width: 16px;
  height: 16px;
}

.pagination-button:hover:not(:disabled) {
  background: rgba(229, 229, 229, 0.3);
}

.pagination-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.prev-button {
  width: 100.97px;
}

.next-button {
  width: 74.69px;
}

.page-button {
  width: 36px;
  padding: 8px;
}

.page-button.active {
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid var(--border-color);
  color: #0A0A0A;
}
</style>
