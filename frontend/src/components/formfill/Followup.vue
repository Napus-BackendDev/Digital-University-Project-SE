<script setup>
// --- FollowupOption.vue: Handles rendering and selection for a single option (with recursive follow-up) ---

// Define component name for recursive usage
import { defineComponent } from 'vue'

// --- Define component props ---
// option: option object for this row
// idx: index or key for answer tracking
// answers: shared answers object (v-model) - changed from Array to Object
const props = defineProps({
  option: { type: Object, required: true },
  idx: { type: [Number, String], required: true },
  answers: { type: Object, required: true }, // Changed from Array to Object
});

// --- Emits update:answers for v-model ---
const emit = defineEmits(['update:answers']);

// --- Handle input: toggles selection, supports deselect ---
function handleInput(val) {
  if (props.answers[props.idx] === val) {
    // Deselect if already selected
    props.answers[props.idx] = null;
  } else {
    props.answers[props.idx] = val;
  }
  emit('update:answers', props.answers);
}
</script>

<script>
export default {
  name: 'FollowupOption'
}
</script>
<template>
  <!-- Option row with radio and recursive follow-up rendering -->
  <div>
    <!-- Main option row -->
    <div
      class="preview-option-row clickable"
      :class="{ selected: answers[idx] === option.id }"
      @click="handleInput(option.id)"
      tabindex="0"
      @keydown.enter.space="handleInput(option.id)"
      role="radio"
      :aria-checked="answers[idx] === option.id"
    >
      <!-- Radio visual -->
      <div class="preview-radio-circle">
        <div v-if="answers[idx] === option.id" class="preview-radio-dot"></div>
      </div>
      <!-- Option text -->
      <span class="preview-option-text">{{ option.text }}</span>
    </div>
    <!-- Render follow-up recursively if selected and has follow-up -->
    <div v-if="answers[idx] === option.id && option.hasFollowUp && option.followUpQuestion && Array.isArray(option.followUpQuestion.options)" class="preview-followup-list-box">
      <!-- Follow-up question title -->
      <div v-if="option.followUpQuestion.title" class="followup-question-title">{{ option.followUpQuestion.title }}</div>
      <!-- Recursive follow-up options -->
      <FollowupOption
        v-for="fopt in option.followUpQuestion.options"
        :key="fopt.id"
        :option="fopt"
        :idx="`${idx}-${option.id}`"
        :answers="answers"
        @update:answers="$emit('update:answers', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
    
.preview-option-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 6px;
  transition: background 0.2s;
  cursor: default;
}
.preview-option-row.clickable {
  cursor: pointer;
  user-select: none;
}
.preview-option-row.clickable:active {
  background: #e0e7ff;
}
.preview-option-row.selected {
  background: #f5f7ff;
}
.preview-radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #bbb;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.preview-option-row.selected .preview-radio-circle {
  border-color: #6366f1;
}
.preview-radio-dot {
  width: 10px;
  height: 10px;
  background: #6366f1;
  border-radius: 50%;
}
.preview-option-text {
  font-size: 1rem;
  color: #222;
  font-family: 'Inter', sans-serif;
}
.preview-followup-list-box {
  margin-left: 24px;
  margin-top: 6px;
  margin-bottom: 6px;
  padding: 12px 12px 8px 16px;
  border-left: 3px solid #6366f1;
  background: #f8f9ff;
  border-radius: 0 8px 8px 0;
}

/* Follow-up question title styling */
  .followup-question-title {
    font-size: 0.98rem;
    color: #000000;
    font-weight: 300;
    margin-bottom: 6px;
    font-family: 'Inter', sans-serif;
  }
</style>