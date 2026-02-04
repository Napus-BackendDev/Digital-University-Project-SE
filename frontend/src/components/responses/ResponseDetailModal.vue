<script setup>
/**
 * ResponseDetailModal - Modal แสดงรายละเอียดของ response
 */
import { computed, ref } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  response: { type: Object, default: null },
  questions: { type: Array, default: () => [] },
  allResponses: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'delete', 'navigate'])

// หา index ของ response ปัจจุบัน
const currentIndex = computed(() => {
  if (!props.response) return -1
  return props.allResponses.findIndex(r => r._id === props.response._id)
})

const currentNumber = computed(() => currentIndex.value + 1)
const totalResponses = computed(() => props.allResponses.length)

// Format date
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Get answer for specific question
function getAnswer(questionId) {
  if (!props.response?.answers) return null
  return props.response.answers.find(a => a.question?._id === questionId)
}

// Format response value based on question type
function formatResponse(answer, question) {
  if (!answer || answer.response === null || answer.response === undefined) {
    return '-'
  }
  
  const value = answer.response
  
  // Handle array (checkbox, multiple files)
  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    // For file uploads
    if (question.type === 'file-upload') {
      return `${value.length} file(s) uploaded`
    }
    // For checkbox
    return value.join(', ')
  }
  
  // Handle rating
  if (question.type === 'rating') {
    return `${value} / ${question.maxRating || 5}`
  }
  
  // Handle file upload (single file)
  if (question.type === 'file-upload' && typeof value === 'string') {
    return value
  }
  
  return value
}

// Navigation
function goToPrevious() {
  if (currentIndex.value > 0) {
    emit('navigate', props.allResponses[currentIndex.value - 1]._id)
  }
}

function goToNext() {
  if (currentIndex.value < props.allResponses.length - 1) {
    emit('navigate', props.allResponses[currentIndex.value + 1]._id)
  }
}

// Close on Escape key
function handleKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  } else if (e.key === 'ArrowLeft') {
    goToPrevious()
  } else if (e.key === 'ArrowRight') {
    goToNext()
  }
}

// Add/remove event listener
const setupKeyboardNav = () => {
  if (props.show) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
}

// Watch show prop
import { watch } from 'vue'
watch(() => props.show, setupKeyboardNav)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show && response" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-left">
              <button class="back-btn" @click="emit('close')">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 4L6 8l4 4"/>
                </svg>
                Back to Responses
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <!-- Title Section -->
            <div class="title-section">
              <h2 class="modal-title">Response Details</h2>
              <div class="submitted-info">
                Submitted on {{ formatDate(response.submittedAt) }}
              </div>
            </div>

            <!-- Actions Bar -->
            <div class="actions-bar">
              <div class="navigation">
                <button 
                  class="nav-btn" 
                  :disabled="currentIndex === 0"
                  @click="goToPrevious"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10 4L6 8l4 4"/>
                  </svg>
                </button>
                <span class="nav-text">{{ currentNumber }} of {{ totalResponses }}</span>
                <button 
                  class="nav-btn" 
                  :disabled="currentIndex === allResponses.length - 1"
                  @click="goToNext"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 4l4 4-4 4"/>
                  </svg>
                </button>
              </div>
              <div class="action-buttons">
                <button class="export-btn">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M8 2v8m0-8L5 5m3-3l3 3M3 14h10"/>
                  </svg>
                  Export
                </button>
                <button class="delete-btn" @click="emit('delete', response._id)">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            <!-- Email Section -->
            <div class="email-section">
              <div class="email-label">Email Address</div>
              <div class="email-value">{{ response.responder?.email || 'Anonymous' }}</div>
            </div>

            <!-- Answers Table -->
            <div class="answers-section">
              <table class="answers-table">
                <thead>
                  <tr>
                    <th class="col-number">#</th>
                    <th class="col-question">Question</th>
                    <th class="col-response">Response</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(question, index) in questions" 
                    :key="question._id || question.id"
                  >
                    <!-- Skip display-only questions -->
                    <template v-if="!['title-description', 'image', 'video', 'section-divider'].includes(question.type)">
                      <td class="col-number">{{ index + 1 }}</td>
                      <td class="col-question">
                        <div class="question-text">{{ question.title }}</div>
                        <div class="question-type">{{ question.type }}</div>
                      </td>
                      <td class="col-response">
                        <div class="response-text">
                          {{ formatResponse(getAnswer(question._id || question.id), question) }}
                        </div>
                      </td>
                    </template>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- All Responses List (Optional) -->
            <div class="all-responses-section">
              <h3 class="section-title">All Responses</h3>
              <table class="responses-list-table">
                <thead>
                  <tr>
                    <th class="col-number">#</th>
                    <th class="col-timestamp">Timestamp</th>
                    <th class="col-email">Email</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="(resp, index) in allResponses.slice(0, 5)" 
                    :key="resp._id"
                    :class="{ 'active-row': resp._id === response._id }"
                  >
                    <td class="col-number">{{ index + 1 }}</td>
                    <td class="col-timestamp">{{ formatDate(resp.submittedAt) }}</td>
                    <td class="col-email">{{ resp.responder?.email || 'Anonymous' }}</td>
                    <td class="col-actions">
                      <button 
                        v-if="resp._id === response._id"
                        class="viewing-btn"
                      >
                        Viewing
                      </button>
                      <button 
                        v-else
                        class="view-btn" 
                        @click="emit('navigate', resp._id)"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 9999;
  overflow-y: auto;
  padding: 40px 20px;
}

.modal-container {
  background: #FFF;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  margin: 0 auto;
}

/* Header */
.modal-header {
  padding: 20px 32px;
  border-bottom: 1px solid #E5E5E5;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
  margin-left: -12px;
}

.back-btn:hover {
  color: #333;
}

.back-btn svg {
  width: 14px;
  height: 14px;
}

/* Content */
.modal-content {
  padding: 32px;
  max-height: calc(100vh - 160px);
  overflow-y: auto;
}

/* Title Section */
.title-section {
  margin-bottom: 24px;
}

.modal-title {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #171717;
  margin: 0 0 8px;
}

.submitted-info {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #737373;
}

/* Actions Bar */
.actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  margin-bottom: 24px;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #FFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn svg {
  width: 14px;
  height: 14px;
}

.nav-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.export-btn,
.delete-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #FFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn {
  color: #333;
}

.export-btn:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.delete-btn {
  color: #DC2626;
  border-color: #FEE2E2;
}

.delete-btn:hover {
  background: #FEF2F2;
  border-color: #FECACA;
}

.export-btn svg,
.delete-btn svg {
  width: 14px;
  height: 14px;
}

/* Email Section */
.email-section {
  padding: 20px;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  margin-bottom: 24px;
}

.email-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.email-value {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #171717;
  font-weight: 500;
}

/* Answers Table */
.answers-section {
  margin-bottom: 32px;
}

.answers-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  overflow: hidden;
}

.answers-table thead {
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
}

.answers-table th {
  padding: 12px 16px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: #525252;
}

.answers-table tbody tr {
  border-bottom: 1px solid #F5F5F5;
}

.answers-table tbody tr:last-child {
  border-bottom: none;
}

.answers-table td {
  padding: 16px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  vertical-align: top;
}

.answers-table .col-number {
  width: 60px;
  text-align: center;
  font-weight: 500;
  color: #737373;
}

.answers-table .col-question {
  width: 40%;
}

.answers-table .col-response {
  width: auto;
}

.question-text {
  font-weight: 500;
  color: #171717;
  margin-bottom: 4px;
}

.question-type {
  font-size: 12px;
  color: #999;
  text-transform: capitalize;
}

.response-text {
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

/* All Responses Section */
.all-responses-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #E5E5E5;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #171717;
  margin: 0 0 16px;
}

.responses-list-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  overflow: hidden;
}

.responses-list-table thead {
  background: #FAFAFA;
}

.responses-list-table th {
  padding: 10px 12px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.responses-list-table tbody tr {
  border-bottom: 1px solid #F5F5F5;
  transition: background 0.2s;
}

.responses-list-table tbody tr:last-child {
  border-bottom: none;
}

.responses-list-table tbody tr:hover {
  background: #FAFAFA;
}

.responses-list-table tbody tr.active-row {
  background: #F0F0F0;
}

.responses-list-table td {
  padding: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #333;
}

.responses-list-table .col-number {
  width: 50px;
  text-align: center;
  color: #737373;
}

.responses-list-table .col-timestamp {
  min-width: 160px;
  color: #737373;
}

.responses-list-table .col-actions {
  width: 100px;
  text-align: right;
}

.view-btn,
.viewing-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn {
  background: #FFF;
  border: 1px solid #E5E5E5;
  color: #333;
}

.view-btn:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.viewing-btn {
  background: #171717;
  border: 1px solid #171717;
  color: #FFF;
  cursor: default;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}
</style>
