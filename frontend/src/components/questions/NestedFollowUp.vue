<script setup>
/**
 * NestedFollowUp - Follow-up question ที่ซ้อนกันได้หลายชั้น
 * รองรับ recursive nesting: 1.1 → 1.1.1 → 1.1.1.1 ไปเรื่อยๆ
 * Follow-up เป็น Multiple Choice เสมอ
 */
import { computed } from 'vue'

const props = defineProps({
  followUp: { type: Object, required: true },
  depth: { type: Number, default: 1 }
})

const emit = defineEmits(['update', 'remove'])

// สร้าง depth indicator (1.1, 1.1.1, etc.)
const depthLabel = computed(() => {
  return '1' + '.1'.repeat(props.depth)
})

// อัพเดท follow-up data
function updateFollowUp(updates) {
  emit('update', { ...props.followUp, ...updates })
}

// อัพเดท title
function updateTitle(title) {
  updateFollowUp({ title })
}

// อัพเดท required
function updateRequired(required) {
  updateFollowUp({ required })
}

// === Multiple Choice Options ===
function updateOptionText(optionId, text) {
  const options = props.followUp.options.map(o => 
    o.id === optionId ? { ...o, text } : o
  )
  updateFollowUp({ options })
}

function addOption() {
  const newId = (props.followUp.options?.length || 0) + 1
  const options = [...(props.followUp.options || []), { id: newId, text: `Option ${newId}` }]
  updateFollowUp({ options })
}

function removeOption(optionId) {
  const options = props.followUp.options.filter(o => o.id !== optionId)
  updateFollowUp({ options })
}

// === Nested Follow-up ===
function addNestedFollowUp(optionId) {
  const options = props.followUp.options.map(o => 
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
  updateFollowUp({ options })
}

function updateNestedFollowUp(optionId, nestedFollowUp) {
  const options = props.followUp.options.map(o => 
    o.id === optionId ? { ...o, followUpQuestion: nestedFollowUp } : o
  )
  updateFollowUp({ options })
}

function removeNestedFollowUp(optionId) {
  const options = props.followUp.options.map(o => 
    o.id === optionId ? { ...o, hasFollowUp: false, followUpQuestion: null } : o
  )
  updateFollowUp({ options })
}
</script>

<template>
  <div class="followup-container" :style="{ marginLeft: depth > 1 ? '20px' : '28px' }">
    <div class="followup-header">
      <div class="followup-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
        <span>Follow-up {{ depthLabel }}</span>
      </div>
      <button class="remove-followup-btn" @click="emit('remove')">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="4" x2="12" y2="12"></line>
          <line x1="12" y1="4" x2="4" y2="12"></line>
        </svg>
      </button>
    </div>
    
    <div class="followup-content">
      <!-- Title Input -->
      <input 
        :value="followUp.title || ''"
        @input="updateTitle($event.target.value)"
        type="text"
        class="followup-title-input"
        placeholder="Enter follow-up question..."
      />
      
      <!-- Required toggle -->
      <div class="followup-settings">
        <label class="followup-required">
          <input 
            type="checkbox"
            :checked="followUp.required"
            @change="updateRequired($event.target.checked)"
          />
          Required
        </label>
      </div>
      
      <!-- Multiple Choice Options (always shown) -->
      <div class="followup-options">
        <div v-for="option in (followUp.options || [])" :key="option.id" class="followup-option-row">
          <div class="followup-option-content">
            <div class="radio-circle-small"></div>
            <input 
              :value="option.text"
              @input="updateOptionText(option.id, $event.target.value)"
              type="text"
              class="followup-option-input"
            />
            <button class="option-delete-btn-small" @click="removeOption(option.id)">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="4" x2="12" y2="12"></line>
                <line x1="12" y1="4" x2="4" y2="12"></line>
              </svg>
            </button>
          </div>
          
          <!-- Nested Follow-up (Recursive) -->
          <NestedFollowUp
            v-if="option.hasFollowUp"
            :followUp="option.followUpQuestion"
            :depth="depth + 1"
            @update="(updated) => updateNestedFollowUp(option.id, updated)"
            @remove="removeNestedFollowUp(option.id)"
          />
          
          <!-- Add nested follow-up button -->
          <button 
            v-else 
            class="add-nested-followup-btn"
            @click="addNestedFollowUp(option.id)"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="6 12 10 8 6 4"></polyline>
            </svg>
            Add follow-up {{ depthLabel }}.1
          </button>
        </div>
        
        <!-- Add option button -->
        <button class="add-option-btn-small" @click="addOption">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <line x1="8" y1="4" x2="8" y2="12"></line>
            <line x1="4" y1="8" x2="12" y2="8"></line>
          </svg>
          Add option
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.followup-container {
  padding: 12px;
  background: #f8f8ff;
  border: 1px solid #e0e0ff;
  border-left: 3px solid var(--primary);
  border-radius: 8px;
  margin-top: 8px;
}

.followup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.followup-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--primary);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
}

.followup-indicator svg {
  width: 14px;
  height: 14px;
}

.remove-followup-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.remove-followup-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.remove-followup-btn svg {
  width: 14px;
  height: 14px;
}

.followup-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.followup-title-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0ff;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--text-primary);
  background: #fff;
}

.followup-title-input:focus {
  outline: none;
  border-color: var(--primary);
}

.followup-title-input::placeholder {
  color: var(--text-muted);
}

.followup-settings {
  display: flex;
  align-items: center;
  gap: 16px;
}

.followup-type-select {
  padding: 6px 10px;
  border: 1px solid #e0e0ff;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #555;
  background: #fff;
  cursor: pointer;
}

.followup-type-select:focus {
  outline: none;
  border-color: var(--primary);
}

.followup-required {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}

.followup-required input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
  cursor: pointer;
}

/* Multiple Choice Options in Follow-up */
.followup-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.followup-option-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.followup-option-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.radio-circle-small {
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-radius: 50%;
  flex-shrink: 0;
}

.followup-option-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #e0e0ff;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--text-primary);
  background: #fff;
}

.followup-option-input:focus {
  outline: none;
  border-color: var(--primary);
}

.option-delete-btn-small {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.option-delete-btn-small:hover {
  background: #fee2e2;
  color: #ef4444;
}

.option-delete-btn-small svg {
  width: 14px;
  height: 14px;
}

.add-nested-followup-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin-left: 24px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-nested-followup-btn:hover {
  background: #f0f0ff;
}

.add-nested-followup-btn svg {
  width: 14px;
  height: 14px;
}

.add-option-btn-small {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-option-btn-small:hover {
  background: #f0f0f0;
}

.add-option-btn-small svg {
  width: 14px;
  height: 14px;
}
</style>
