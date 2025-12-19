<template>
  <div class="responses-view">
    <!-- Header -->
    <div class="responses-header">
      <span class="total-responses">{{ totalResponses }} responses</span>
      
      <div class="header-actions">
        <button 
          :class="['view-btn', { active: viewMode === 'summary' }]"
          @click="$emit('update:viewMode', 'summary')"
        >
          <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="5" height="5" rx="1"></rect>
            <rect x="9" y="2" width="5" height="5" rx="1"></rect>
            <rect x="2" y="9" width="5" height="5" rx="1"></rect>
            <rect x="9" y="9" width="5" height="5" rx="1"></rect>
          </svg>
          Summary
        </button>
        
        <button 
          :class="['view-btn', { active: viewMode === 'individual' }]"
          @click="$emit('update:viewMode', 'individual')"
        >
          <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path>
            <path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"></path>
          </svg>
          Individual
        </button>
        
        <div class="export-dropdown">
          <button class="export-btn" @click="toggleExportDropdown">
            <span>Export</span>
            <svg class="dropdown-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 6l4 4 4-4"></path>
            </svg>
          </button>
          <div v-if="showExportDropdown" class="dropdown-menu">
            <button class="dropdown-item" @click="handleExport('xlsx')">Excel (.xlsx)</button>
            <button class="dropdown-item" @click="handleExport('csv')">CSV (.csv)</button>
            <button class="dropdown-item" @click="handleExport('json')">JSON (.json)</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Response Summary Cards -->
    <div class="responses-list">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  totalResponses: {
    type: Number,
    default: 0
  },
  viewMode: {
    type: String,
    default: 'summary'
  }
})

const emit = defineEmits(['update:viewMode', 'export'])

const showExportDropdown = ref(false)

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value
}

const handleExport = (format) => {
  emit('export', format)
  showExportDropdown.value = false
}
</script>

<style scoped>
.responses-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.responses-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
}

.total-responses {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #525252;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  height: 32px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: rgba(229, 229, 229, 0.3);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #0a0a0a;
  transition: all 0.2s;
}

.view-btn.active {
  background: #171717;
  border-color: #171717;
  color: #fafafa;
}

.view-btn:hover:not(.active) {
  background: rgba(229, 229, 229, 0.5);
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.export-dropdown {
  position: relative;
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 13px;
  height: 36px;
  min-width: 100px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: rgba(229, 229, 229, 0.3);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #737373;
  transition: background 0.2s;
}

.export-btn:hover {
  background: rgba(229, 229, 229, 0.5);
}

.dropdown-icon {
  width: 16px;
  height: 16px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 150px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  border: none;
  background: none;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.responses-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
