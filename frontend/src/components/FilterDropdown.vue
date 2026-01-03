<template>
  <div class="filter-wrapper" ref="filterRef">
    <button class="filter-button" @click="toggleDropdown">
      <i class="pi pi-filter"></i>
      <span class="filter-span">{{ currentLabel }}</span>
      <i class="pi pi-chevron-down chevron-icon"></i>
    </button>
    
    <div v-if="showDropdown" class="filter-dropdown-menu">
      <button 
        v-for="option in options"
        :key="option.value"
        class="filter-option" 
        :class="{ active: modelValue === option.value }"
        @click="selectOption(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true,
    // Format: [{ value: 'all', label: 'All Status' }, ...]
  }
})

const emit = defineEmits(['update:modelValue'])

const showDropdown = ref(false)
const filterRef = ref(null)

const currentLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option?.label || 'Select'
})

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const selectOption = (value) => {
  emit('update:modelValue', value)
  showDropdown.value = false
}

const handleClickOutside = (event) => {
  if (filterRef.value && !filterRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.filter-wrapper {
  position: relative;
  width: 140px;
  height: 36px;
}

.filter-button {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 12px;
  gap: 16px;
  width: 140px;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  flex: none;
  order: 0;
  flex-grow: 1;
}

.filter-button i {
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: #737373;
}

.filter-span {
  height: 20px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  letter-spacing: -0.150391px;
  color: #333333;
  white-space: nowrap;
  flex: 1;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

.filter-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 140px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

.filter-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.filter-option:hover {
  background: #F5F5F5;
}

.filter-option.active {
  background: #BA0C2F;
  color: #FFFFFF;
}
</style>
