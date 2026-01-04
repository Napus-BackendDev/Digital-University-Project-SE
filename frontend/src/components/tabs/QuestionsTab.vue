<script setup>
/**
 * QuestionsTab - Tab แสดงคำถามทั้งหมด
 */
import { computed } from 'vue'
import draggable from 'vuedraggable'
import {
  CheckCircleIcon,
  CloseCircleIcon,
  EditIcon,
  ClockIcon,
  CopyIcon,
  PlayIcon,
  EmptyFormIcon
} from '@/components/icons'
import QuestionTypeSelector from '@/components/questions/QuestionTypeSelector.vue'
import QuestionCard from '@/components/questions/QuestionCard.vue'

const props = defineProps({
  formTitle: { type: String, required: true },
  formDescription: { type: String, default: '' },
  formUrl: { type: String, default: '' },
  formStatus: { type: String, default: 'draft' },
  questions: { type: Array, required: true },
  expandedQuestionId: { type: [Number, String, null], default: null }
})

const emit = defineEmits([
  'update:formTitle',
  'update:formDescription',
  'update:questions',
  'copy-url',
  'test-form',
  'add-question',
  'update-question',
  'delete-question',
  'add-option',
  'remove-option',
  'toggle-question',
  'reorder-questions'
])

// Computed for v-model with draggable
const localQuestions = computed({
  get: () => props.questions,
  set: (value) => emit('update:questions', value)
})
</script>

<template>
  <div class="questions-tab">
    <!-- Status Banners -->
    <div v-if="formStatus === 'open'" class="status-banner success">
      <div class="status-icon"><CheckCircleIcon /></div>
      <div class="status-content">
        <h3>Form is Live & Public</h3>
        <p>Your form is published and accepting responses. Anyone with the link can submit.</p>
        <div class="status-actions">
          <input type="text" :value="formUrl" readonly class="url-input" />
          <button class="btn btn-secondary" @click="emit('copy-url')"><CopyIcon /> Copy</button>
          <button class="btn btn-secondary" @click="emit('test-form')"><PlayIcon /> Preview</button>
        </div>
      </div>
    </div>

    <div v-else-if="formStatus === 'close'" class="status-banner warning">
      <div class="status-icon"><CloseCircleIcon /></div>
      <div class="status-content">
        <h3>Form is Closed</h3>
        <p>This form is no longer accepting responses.</p>
      </div>
    </div>

    <div v-else-if="formStatus === 'draft'" class="status-banner draft">
      <div class="status-icon"><EditIcon /></div>
      <div class="status-content">
        <h3>Draft Mode</h3>
        <p>This form is not published yet. Change status to "Open" to start collecting responses.</p>
        <div class="status-actions">
          <button class="btn btn-secondary" @click="emit('test-form')"><PlayIcon /> Preview</button>
        </div>
      </div>
    </div>

    <div v-else-if="formStatus === 'auto'" class="status-banner scheduled">
      <div class="status-icon"><ClockIcon /></div>
      <div class="status-content">
        <h3>Scheduled</h3>
        <p>This form will automatically open and close based on the schedule in settings.</p>
        <div class="status-actions">
          <input type="text" :value="formUrl" readonly class="url-input" />
          <button class="btn btn-secondary" @click="emit('copy-url')"><CopyIcon /> Copy</button>
          <button class="btn btn-secondary" @click="emit('test-form')"><PlayIcon /> Preview</button>
        </div>
      </div>
    </div>

    <!-- Form Title & Description -->
    <div class="form-header-section">
      <div class="title-input-wrapper">
        <input
          :value="formTitle"
          @input="emit('update:formTitle', $event.target.value)"
          type="text"
          class="form-title-input"
          placeholder="Form title"
        />
        <EditIcon class="edit-hint-icon" />
      </div>
      <div class="description-input-wrapper">
        <textarea
          :value="formDescription"
          @input="emit('update:formDescription', $event.target.value)"
          class="form-description-input"
          placeholder="Form description"
          rows="2"
        ></textarea>
        <EditIcon class="edit-hint-icon description-edit" />
      </div>
    </div>

    <!-- Questions Section -->
    <div class="questions-section">
      <div class="questions-list">
        <!-- Empty State -->
        <div v-if="questions.length === 0" class="empty-questions">
          <div class="empty-icon"><EmptyFormIcon /></div>
          <h3>No questions yet</h3>
          <p>Add your first question from the sidebar</p>
        </div>

        <!-- Question Cards with Drag & Drop -->
        <draggable
          v-model="localQuestions"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost-card"
          animation="200"
          class="draggable-list"
          @end="emit('reorder-questions')"
        >
          <template #item="{ element: question }">
            <QuestionCard
              :question="question"
              :isExpanded="expandedQuestionId === question.id"
              @update:question="emit('update-question', $event)"
              @delete="emit('delete-question', $event)"
              @add-option="emit('add-option', $event)"
              @remove-option="emit('remove-option', ...$event)"
              @toggle="emit('toggle-question', question.id)"
            />
          </template>
        </draggable>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <QuestionTypeSelector @add-question="emit('add-question', $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Status Banner */
.status-banner {
  display: flex;
  gap: 12px;
  padding: 25px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  margin-bottom: 24px;
}

.status-banner.success { border-left: 4px solid #22c55e; }
.status-banner.success .status-icon { background: #dcfce7; color: #22c55e; }
.status-banner.warning { border-left: 4px solid #f59e0b; }
.status-banner.warning .status-icon { background: #fef3c7; color: #f59e0b; }
.status-banner.draft { border-left: 4px solid #6b7280; }
.status-banner.draft .status-icon { background: #f3f4f6; color: #6b7280; }
.status-banner.scheduled { border-left: 4px solid #6366f1; }
.status-banner.scheduled .status-icon { background: #e0e7ff; color: #6366f1; }

.status-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.status-icon svg { width: 20px; height: 20px; }

.status-content { flex: 1; }
.status-content h3 { font-size: 20px; font-weight: 600; color: #333; margin: 0 0 4px; }
.status-content p { font-size: 14px; color: #666; margin: 0 0 12px; }

.status-actions { display: flex; gap: 8px; }

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  background: #f9f9f9;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e5e5e5;
}

.btn-secondary:hover { background: #eee; }

/* Form Header */
.form-header-section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 33px;
  margin-bottom: 24px;
}

.title-input-wrapper, .description-input-wrapper {
  position: relative;
}

.title-input-wrapper { margin-bottom: 16px; }

.form-title-input {
  width: 100%;
  padding: 8px 32px 8px 0;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  background: transparent;
}

.form-title-input:focus { outline: none; border-bottom-color: #6366f1; }

.form-description-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  resize: vertical;
}

.form-description-input:focus { outline: none; border-color: #6366f1; }

.edit-hint-icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #ccc;
  pointer-events: none;
}

.edit-hint-icon svg {
  width: 18px;
  height: 18px;
}

.edit-hint-icon.description-edit {
  top: 10px;
  transform: none;
}

/* Questions Section */
.questions-section { display: flex; gap: 24px; }

.questions-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.draggable-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar {
  width: 256px;
  flex-shrink: 0;
  position: sticky;
  top: 24px;
  height: fit-content;
}

.ghost-card {
  opacity: 0.5;
  background: #f0f4ff;
  border: 2px dashed #4285f4;
}

/* Empty State */
.empty-questions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  background: #fff;
  border: 2px dashed #e5e5e5;
  border-radius: 16px;
}

.empty-questions .empty-icon {
  width: 64px;
  height: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.empty-questions h3 { font-size: 16px; font-weight: 500; color: #666; margin: 0 0 4px; }
.empty-questions p { font-size: 14px; color: #999; margin: 0; }

@media (max-width: 1024px) {
  .questions-tab {
    padding-bottom: 80px; /* Space for fixed toolbar */
  }

  .questions-section { 
    flex-direction: column; 
  }
  
  .sidebar { 
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%; 
    z-index: 100;
  }

  .status-banner {
    flex-direction: column;
    padding: 16px;
  }

  .status-actions {
    flex-direction: column;
  }

  .url-input {
    width: 100%;
  }
}

/* Mobile: smaller padding */
@media (max-width: 768px) {
  .form-header-section {
    padding: 20px;
  }

  .form-title-input {
    font-size: 16px;
  }

  .empty-questions {
    padding: 40px 20px;
  }
}

@media (max-width: 480px) {
  .status-content h3 {
    font-size: 16px;
  }

  .status-content p {
    font-size: 13px;
  }

  .btn {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
