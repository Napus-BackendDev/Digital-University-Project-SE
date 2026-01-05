<script setup>
/**
 * ResponsesTab - Tab แสดงคำตอบ
 */
import { computed, ref } from 'vue'
import { EmptyResponseIcon } from '@/components/icons'
import ResponsesView from '@/components/responses/ResponsesView.vue'
import ResponseSummaryCard from '@/components/responses/ResponseSummaryCard.vue'
import TextResponseTable from '@/components/responses/TextResponseTable.vue'
import PieChartSummary from '@/components/responses/PieChartSummary.vue'
import BarChartSummary from '@/components/responses/BarChartSummary.vue'
import DateTimeResponseList from '@/components/responses/DateTimeResponseList.vue'
import FileUploadSummary from '@/components/responses/FileUploadSummary.vue'

const props = defineProps({
  questions: { type: Array, required: true },
  totalResponses: { type: Number, default: 0 },
  responses: { type: Array, default: () => [] },
  viewMode: { type: String, default: 'summary' }
})

const emit = defineEmits(['update:viewMode', 'export'])

// Individual view state
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 6
const selectedResponse = ref(null)

// Computed for pagination
const filteredResponses = computed(() => {
  if (!searchQuery.value) return props.responses
  
  const query = searchQuery.value.toLowerCase()
  return props.responses.filter(resp => {
    const email = resp.responder?.email?.toLowerCase() || ''
    const date = formatDate(resp.submittedAt).toLowerCase()
    return email.includes(query) || date.includes(query)
  })
})

const totalPages = computed(() => Math.ceil(filteredResponses.value.length / pageSize))

const paginatedResponses = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredResponses.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current, '...', total)
    }
  }
  
  return pages.filter(p => p !== '...' || pages.indexOf(p) === pages.lastIndexOf(p))
})

// Date formatter
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// View individual response
function viewResponse(responseId) {
  const response = props.responses.find(r => r._id === responseId)
  if (response) {
    selectedResponse.value = response
  }
}

// Back to list
function backToList() {
  selectedResponse.value = null
}

// Navigate between responses
function goToPrevious() {
  const currentIndex = props.responses.findIndex(r => r._id === selectedResponse.value._id)
  if (currentIndex > 0) {
    selectedResponse.value = props.responses[currentIndex - 1]
  }
}

function goToNext() {
  const currentIndex = props.responses.findIndex(r => r._id === selectedResponse.value._id)
  if (currentIndex < props.responses.length - 1) {
    selectedResponse.value = props.responses[currentIndex + 1]
  }
}

function navigateToResponse(respId) {
  const response = props.responses.find(r => r._id === respId)
  if (response) {
    selectedResponse.value = response
  }
}

// Get answer for specific question
function getAnswer(questionId) {
  if (!selectedResponse.value?.answers) return null
  return selectedResponse.value.answers.find(a => a.question?._id === questionId)
}

// Format response value
function formatResponse(answer, question) {
  if (!answer || answer.response === null || answer.response === undefined) {
    return '-'
  }
  
  const value = answer.response
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    if (question.type === 'file-upload') {
      return `${value.length} file(s) uploaded`
    }
    return value.join(', ')
  }
  
  if (question.type === 'rating') {
    return `${value} / ${question.maxRating || 5}`
  }
  
  if (question.type === 'file-upload' && typeof value === 'string') {
    return value
  }
  
  return value
}

// Export response
function handleExport() {
  if (!selectedResponse.value) return
  
  const exportData = {
    responseId: selectedResponse.value._id,
    submittedAt: selectedResponse.value.submittedAt,
    email: selectedResponse.value.responder?.email || 'Anonymous',
    answers: props.questions
      .filter(q => !['title-description', 'image', 'video', 'section-divider'].includes(q.type))
      .map((q, index) => {
        const answer = getAnswer(q._id || q.id)
        return {
          questionNumber: index + 1,
          question: q.title,
          type: q.type,
          response: answer?.response || null
        }
      })
  }
  
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  window.open(url, '_blank')
  
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Delete response
function handleDelete() {
  if (!confirm('Are you sure you want to delete this response?')) return
  console.log('Delete response:', selectedResponse.value._id)
  backToList()
}

// Open file
function openFile(fileUrl) {
  if (fileUrl) {
    window.open(fileUrl, '_blank')
  }
}

// Computed for current response position
const currentResponseIndex = computed(() => {
  if (!selectedResponse.value) return -1
  return props.responses.findIndex(r => r._id === selectedResponse.value._id)
})

const currentResponseNumber = computed(() => currentResponseIndex.value + 1)
const totalResponsesCount = computed(() => props.responses.length)


// ฟังก์ชันประมวลผล responses สำหรับแต่ละ question
function getQuestionResponses(questionId) {
  const responseList = []
  
  props.responses.forEach((resp, index) => {
    // Backend populate question เป็น object ที่มี _id
    const answer = resp.answers?.find(a => a.question?._id === questionId)
    if (answer) {
      responseList.push({
        id: resp._id,
        index: index + 1,
        text: answer.response,
        value: answer.response
      })
    }
  })
  
  return responseList
}

// สร้างข้อมูล chart สำหรับ multiple-choice
function getChoiceChartData(questionId, options) {
  const responses = getQuestionResponses(questionId)
  const counts = {}
  
  // นับจำนวนแต่ละตัวเลือก
  options.forEach(opt => {
    counts[opt.text] = 0
  })
  
  responses.forEach(resp => {
    // Handle checkbox (array of values)
    if (Array.isArray(resp.value)) {
      resp.value.forEach(val => {
        if (counts[val] !== undefined) {
          counts[val]++
        }
      })
    } else {
      // Handle single choice
      if (counts[resp.value] !== undefined) {
        counts[resp.value]++
      }
    }
  })
  
  // สีสำหรับ chart
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ]
  
  return Object.entries(counts).map(([label, count], index) => ({
    label,
    count,
    percentage: props.totalResponses > 0 ? Math.round((count / props.totalResponses) * 100) : 0,
    color: colors[index % colors.length]
  }))
}

// สร้างข้อมูล chart สำหรับ rating
function getRatingChartData(questionId, maxRating = 5) {
  const responses = getQuestionResponses(questionId)
  const counts = {}
  
  // สร้าง rating range
  for (let i = 1; i <= maxRating; i++) {
    counts[i] = 0
  }
  
  responses.forEach(resp => {
    const rating = parseInt(resp.value)
    if (counts[rating] !== undefined) {
      counts[rating]++
    }
  })
  
  // สีสำหรับ rating chart (gradient จากแดงไปเขียว)
  const colors = ['#E74C3C', '#E67E22', '#F39C12', '#2ECC71', '#27AE60']
  
  return Object.entries(counts).map(([rating, count], index) => ({
    label: rating.toString(),
    count,
    value: count, // เพิ่ม value สำหรับ BarChart
    percentage: props.totalResponses > 0 ? Math.round((count / props.totalResponses) * 100) : 0,
    color: colors[index % colors.length]
  }))
}

</script>

<template>
  <div class="responses-tab">
    <!-- Empty State -->
    <div v-if="totalResponses === 0" class="empty-responses">
      <div class="empty-icon"><EmptyResponseIcon /></div>
      <h3>No responses yet</h3>
      <p>Share your form to start collecting responses. Responses will appear here once people submit the form.</p>
    </div>

    <!-- Responses View -->
    <ResponsesView 
      v-else
      :totalResponses="totalResponses"
      :viewMode="viewMode"
      @update:viewMode="emit('update:viewMode', $event)"
      @export="emit('export', $event)"
    >
      <!-- Summary View: Question-based cards -->
      <div v-if="viewMode === 'summary'">
        <div v-for="(question, index) in questions" :key="question.id">
          <!-- ไม่แสดง question ที่เป็น title, image, video, divider -->
          <ResponseSummaryCard
            v-if="!['title-description', 'image', 'video', 'section-divider'].includes(question.type)"
            :questionNumber="index + 1"
            :title="question.title"
            :responseCount="totalResponses"
          >
            <template v-if="question.type === 'short-answer' || question.type === 'paragraph'">
              <TextResponseTable :responses="getQuestionResponses(question._id || question.id)" />
            </template>
            <template v-else-if="question.type === 'multiple-choice' || question.type === 'dropdown'">
              <PieChartSummary :chartData="getChoiceChartData(question._id || question.id, question.options || [])" />
            </template>
            <template v-else-if="question.type === 'checkbox'">
              <PieChartSummary :chartData="getChoiceChartData(question._id || question.id, question.options || [])" />
            </template>
            <template v-else-if="question.type === 'rating'">
              <BarChartSummary 
                :chartData="getRatingChartData(question._id || question.id, question.maxRating || 5)" 
                :maxValue="question.maxRating || 5" 
              />
            </template>
            <template v-else-if="question.type === 'date' || question.type === 'time'">
              <DateTimeResponseList :responses="getQuestionResponses(question._id || question.id)" />
            </template>
            <template v-else-if="question.type === 'file-upload'">
              <FileUploadSummary 
                :count="getQuestionResponses(question._id || question.id).length" 
                fileType="file" 
              />
            </template>
          </ResponseSummaryCard>
        </div>
      </div>

      <!-- Individual View: Person-based table or detail -->
      <div v-else class="individual-view">
        <!-- Detail View (when response selected) -->
        <div v-if="selectedResponse" class="detail-view">
          <!-- Back Button -->
          <button class="back-to-list-btn" @click="backToList">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 4L6 8l4 4"/>
            </svg>
            Back to List
          </button>

          <!-- Title Section -->
          <div class="detail-title-section">
            <h2 class="detail-title">Response Details</h2>
            <div class="submitted-info">
              Submitted on {{ formatDate(selectedResponse.submittedAt) }}
            </div>
          </div>

          <!-- Actions Bar -->
          <div class="detail-actions-bar">
            <div class="navigation">
              <button 
                class="nav-btn" 
                :disabled="currentResponseIndex === 0"
                @click="goToPrevious"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 4L6 8l4 4"/>
                </svg>
              </button>
              <span class="nav-text">{{ currentResponseNumber }} of {{ totalResponsesCount }}</span>
              <button 
                class="nav-btn" 
                :disabled="currentResponseIndex === responses.length - 1"
                @click="goToNext"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 4l4 4-4 4"/>
                </svg>
              </button>
            </div>
            <div class="action-buttons">
              <button class="export-btn" @click="handleExport">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M8 2v8m0-8L5 5m3-3l3 3M3 14h10"/>
                </svg>
                Export
              </button>
              <button class="delete-btn" @click="handleDelete">
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
            <div class="email-value">{{ selectedResponse.responder?.email || 'Anonymous' }}</div>
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
                  <template v-if="!['title-description', 'image', 'video', 'section-divider'].includes(question.type)">
                    <td class="col-number">{{ index + 1 }}</td>
                    <td class="col-question">
                      <div class="question-text">{{ question.title }}</div>
                      <div class="question-type">{{ question.type }}</div>
                    </td>
                    <td class="col-response">
                      <div class="response-text">
                        <template v-if="question.type === 'file-upload'">
                          <span 
                            class="file-link" 
                            @click="openFile(getAnswer(question._id || question.id)?.response)"
                          >
                            {{ formatResponse(getAnswer(question._id || question.id), question) }}
                          </span>
                        </template>
                        <template v-else>
                          {{ formatResponse(getAnswer(question._id || question.id), question) }}
                        </template>
                      </div>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- All Responses List -->
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
                  v-for="(resp, index) in responses.slice(0, 5)" 
                  :key="resp._id"
                  :class="{ 'active-row': resp._id === selectedResponse._id }"
                >
                  <td class="col-number">{{ index + 1 }}</td>
                  <td class="col-timestamp">{{ formatDate(resp.submittedAt) }}</td>
                  <td class="col-email">{{ resp.responder?.email || 'Anonymous' }}</td>
                  <td class="col-actions">
                    <button 
                      v-if="resp._id === selectedResponse._id"
                      class="viewing-btn"
                    >
                      Viewing
                    </button>
                    <button 
                      v-else
                      class="view-btn-small" 
                      @click="navigateToResponse(resp._id)"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- List View (default) -->
        <div v-else>
          <!-- Search Box -->
          <div class="search-container">
          <svg class="search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search responses by email or date..."
            v-model="searchQuery"
          />
        </div>

        <!-- Responses Table -->
        <div class="table-container">
          <table class="responses-table">
            <thead>
              <tr>
                <th class="col-number">#</th>
                <th class="col-email">Email</th>
                <th class="col-submitted">Submitted</th>
                <th class="col-answers">Answers</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(resp, index) in paginatedResponses" :key="resp._id" class="table-row">
                <td class="col-number">
                  <div class="row-badge">{{ (currentPage - 1) * pageSize + index + 1 }}</div>
                </td>
                <td class="col-email">{{ resp.responder?.email || 'Anonymous' }}</td>
                <td class="col-submitted">{{ formatDate(resp.submittedAt) }}</td>
                <td class="col-answers">{{ resp.answers?.length || 0 }} answers</td>
                <td class="col-actions">
                  <button class="view-btn-action" @click="viewResponse(resp._id)">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/>
                      <circle cx="8" cy="8" r="2"/>
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 4L6 8l4 4"/>
            </svg>
            Previous
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              :class="['page-number', { active: page === currentPage }]"
              @click="currentPage = page"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 4l4 4-4 4"/>
            </svg>
          </button>
        </div>
        </div>
      </div>
    </ResponsesView>
  </div>
</template>

<style scoped>
.responses-tab {
  max-width: 960px;
  margin: 0 auto;
}

.empty-responses {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e5e5e5;
}

.empty-responses .empty-icon {
  width: 80px;
  height: 80px;
  color: #ccc;
  margin-bottom: 24px;
}

.empty-responses .empty-icon svg { width: 100%; height: 100%; }
.empty-responses h3 { font-size: 20px; font-weight: 600; color: #333; margin: 0 0 8px; }
.empty-responses p { font-size: 14px; color: #666; margin: 0; max-width: 400px; }

/* Individual View Styles */
.individual-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Search Box */
.search-container {
  position: relative;
  max-width: 100%;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1.5px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #FAFAFA;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #6366F1;
  background: #FFF;
}

.search-input::placeholder {
  color: #999;
}

/* Table Container */
.table-container {
  background: #FFF;
  border: 1.5px solid #E5E5E5;
  border-radius: 16px;
  overflow: hidden;
}

.responses-table {
  width: 100%;
  border-collapse: collapse;
}

.responses-table thead {
  background: #FAFAFA;
  border-bottom: 1.5px solid #E5E5E5;
}

.responses-table th {
  padding: 12px 16px;
  text-align: left;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #737373;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.responses-table tbody tr {
  border-bottom: 1px solid #F5F5F5;
}

.responses-table tbody tr:last-child {
  border-bottom: none;
}

.responses-table tbody tr:hover {
  background: #FAFAFA;
}

.responses-table td {
  padding: 16px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.col-number {
  width: 60px;
  text-align: center;
}

.row-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #FFE5E5;
  color: #DC2626;
  border-radius: 50%;
  font-weight: 500;
  font-size: 13px;
}

.col-email {
  min-width: 200px;
  font-weight: 400;
}

.col-submitted {
  min-width: 160px;
  color: #737373;
}

.col-answers {
  min-width: 100px;
  color: #737373;
}

.col-actions {
  width: 100px;
  text-align: right;
}

.view-btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn-action:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.view-btn-action svg {
  width: 14px;
  height: 14px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
}

.page-btn {
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
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn svg {
  width: 12px;
  height: 12px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  background: #FFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.page-number.active {
  background: #171717;
  border-color: #171717;
  color: #FFF;
}

/* Detail View Styles */
.detail-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.back-to-list-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #FFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.back-to-list-btn:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.back-to-list-btn svg {
  width: 14px;
  height: 14px;
}

.detail-title-section {
  margin-bottom: 4px;
}

.detail-title {
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

.detail-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
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

.email-section {
  padding: 20px;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
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

.answers-section {
  background: #FFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  overflow: hidden;
}

.answers-table {
  width: 100%;
  border-collapse: collapse;
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

.file-link {
  color: #6366F1;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.file-link:hover {
  color: #4F46E5;
}

.all-responses-section {
  margin-top: 12px;
  padding-top: 24px;
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
  background: #FFF;
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

.view-btn-small,
.viewing-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn-small {
  background: #FFF;
  border: 1px solid #E5E5E5;
  color: #333;
}

.view-btn-small:hover {
  background: #F5F5F5;
  border-color: #D4D4D4;
}

.viewing-btn {
  background: #171717;
  border: 1px solid #171717;
  color: #FFF;
  cursor: default;
}
</style>
