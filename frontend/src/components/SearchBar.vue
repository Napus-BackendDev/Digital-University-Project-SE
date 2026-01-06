<template>
  <div class="search-wrapper">
    <input
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      class="search-input"
    />
    <i class="pi pi-search search-icon"></i>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Search...'
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
  height: 36px;
}

.search-input {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 4px 12px 4px 40px;
  width: 100%;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-primary);
}

.search-icon {
  position: absolute;
  width: 16px;
  height: 16px;
  left: 12px;
  top: 10px;
  color: #A3A3A3;
  pointer-events: none;
}
</style>
