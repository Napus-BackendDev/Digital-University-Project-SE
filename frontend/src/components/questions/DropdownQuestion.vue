<template>
  <div class="question-field options-field">
    <div v-for="option in options" :key="option.id" class="option-row">
      <div class="option-content">
        <div class="dropdown-number">{{ option.id }}</div>
        <input 
          :value="option.text"
          @input="updateOptionText(option.id, $event.target.value)"
          type="text" 
          class="option-input" 
        />
        <button class="option-delete-btn" @click="emit('remove-option', option.id)">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="4" x2="12" y2="12"></line>
            <line x1="12" y1="4" x2="4" y2="12"></line>
          </svg>
        </button>
      </div>
    </div>
    <button class="add-option-btn" @click="emit('add-option')">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="8" y1="4" x2="8" y2="12"></line>
        <line x1="4" y1="8" x2="12" y2="8"></line>
      </svg>
      Add option
    </button>
  </div>
</template>

<script>
/**
 * DropdownQuestion - คำถามแบบ dropdown
 * ผู้ตอบเลือกจาก list ที่แสดงเป็น dropdown
 */
export default {
  name: 'DropdownQuestion',
  props: {
    options: { type: Array, default: () => [] }
  },
  emits: ['update:options', 'add-option', 'remove-option'],
  methods: {
    updateOptionText(optionId, text) {
      const updated = this.options.map(o => 
        o.id === optionId ? { ...o, text } : o
      )
      this.$emit('update:options', updated)
    },
    emit(event, payload) {
      this.$emit(event, payload)
    }
  }
}
</script>

<style scoped>
.question-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.options-field {
  gap: 8px;
}

.option-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-number {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.option-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
}

.option-input:focus {
  outline: none;
  border-color: var(--primary);
}

.option-delete-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.option-delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.option-delete-btn svg {
  width: 16px;
  height: 16px;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-option-btn:hover {
  background: var(--bg-gray-light);
}

.add-option-btn svg {
  width: 16px;
  height: 16px;
}
</style>
