<script setup>
/**
 * MultipleChoiceQuestion - คำถามแบบเลือกตอบ (Radio)
 * ผู้ตอบเลือกได้เพียง 1 ตัวเลือก
 * รองรับ nested follow-up question หลายชั้น (1.1, 1.1.1, 1.1.1.1, ...)
 */
import NestedFollowUp from './NestedFollowUp.vue'

const props = defineProps({
  options: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:options', 'add-option', 'remove-option'])

// อัพเดทข้อความของตัวเลือก
function updateOptionText(optionId, text) {
  const updated = props.options.map(o => 
    o.id === optionId ? { ...o, text } : o
  )
  emit('update:options', updated)
}

// เพิ่ม follow-up question สำหรับตัวเลือกนี้ (เป็น Multiple Choice เสมอ)
function addFollowUp(optionId) {
  const updated = props.options.map(o => 
    o.id === optionId ? { 
      ...o, 
      hasFollowUp: true,
      followUpQuestion: {
        type: 'multiple-choice',
        title: '',
        required: false,
        options: [{ id: 1, text: 'Option 1' }]
      }
    } : o
  )
  emit('update:options', updated)
}

// ลบ follow-up question
function removeFollowUp(optionId) {
  const updated = props.options.map(o => 
    o.id === optionId ? { 
      ...o, 
      hasFollowUp: false,
      followUpQuestion: null
    } : o
  )
  emit('update:options', updated)
}

// อัพเดท follow-up question
function updateFollowUp(optionId, followUpQuestion) {
  const updated = props.options.map(o => 
    o.id === optionId ? { ...o, followUpQuestion } : o
  )
  emit('update:options', updated)
}
</script>

<template>
  <div class="question-field options-field">
    <div v-for="option in options" :key="option.id" class="option-row">
      <div class="option-content">
        <div class="radio-circle"></div>
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
      
      <!-- Nested Follow-up Question Component -->
      <NestedFollowUp
        v-if="option.hasFollowUp"
        :followUp="option.followUpQuestion"
        :depth="1"
        @update="(updated) => updateFollowUp(option.id, updated)"
        @remove="removeFollowUp(option.id)"
      />
      
      <!-- Add follow-up button -->
      <button v-else class="add-followup-btn" @click="addFollowUp(option.id)">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="6 12 10 8 6 4"></polyline>
        </svg>
        Add follow-up question
      </button>
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

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  flex-shrink: 0;
}

.option-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.option-input:focus {
  outline: none;
  border-color: #6366f1;
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
  color: #999;
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

.add-followup-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  margin-left: 28px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #6366f1;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-followup-btn:hover {
  background: #f0f0ff;
}

.add-followup-btn svg {
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
  color: #666;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-option-btn:hover {
  background: #f5f5f5;
}

.add-option-btn svg {
  width: 16px;
  height: 16px;
}
</style>
