<script setup>
/**
 * HomeView - หน้าแรกแสดงรายการฟอร์มทั้งหมด
 * ผู้ใช้สามารถสร้าง, แก้ไข, ลบฟอร์มได้จากหน้านี้
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFormStore } from '@/stores/form'

const router = useRouter()
const formStore = useFormStore()

// ดึงค่าจาก store
const loading = computed(() => formStore.loading)
const error = computed(() => formStore.error)
const forms = computed(() => formStore.forms)

// โหลดฟอร์มเมื่อ component mount
onMounted(async () => {
  await formStore.fetchForms()
})


/* ===================================
   Helper Functions - ฟังก์ชันช่วย
   =================================== */

/**
 * ดึงชื่อฟอร์มจากข้อมูล
 * title เก็บเป็น array ของ { key, value }
 */
function getFormTitle(form) {
  if (form.title && form.title.length > 0) {
    return form.title[0].value || 'Untitled Form'
  }
  return 'Untitled Form'
}

/**
 * แปลง status code เป็นข้อความ
 */
function getStatusLabel(status) {
  const labels = {
    'draft': 'Draft',
    'open': 'Active',
    'close': 'Closed',
    'auto': 'Scheduled'
  }
  return labels[status] || status
}

/**
 * แปลงวันที่ให้อ่านง่าย
 * เช่น "Dec 19, 2025"
 */
function formatDate(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}


/* ===================================
   Actions - การทำงานหลัก
   =================================== */

/**
 * สร้างฟอร์มใหม่แล้วไปหน้า form builder
 */
async function createNewForm() {
  const newForm = await formStore.createForm({ title: 'Untitled Form' })
  if (newForm) {
    router.push(`/form-builder/${newForm._id}`)
  }
}

/**
 * ไปหน้าแก้ไขฟอร์ม
 */
function editForm(formId) {
  router.push(`/form-builder/${formId}`)
}

/**
 * ลบฟอร์ม (ถามยืนยันก่อน)
 */
async function deleteForm(event, formId) {
  event.stopPropagation() // ไม่ให้ click ไปถึง card
  
  if (confirm('Are you sure you want to delete this form?')) {
    await formStore.deleteForm(formId)
  }
}
</script>

<template>
  <div class="home-view">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>My Forms</h1>
          <p>Create, manage, and analyze your forms</p>
        </div>
        <button class="btn btn-primary" @click="createNewForm" :disabled="loading">
          <svg class="btn-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="4" x2="8" y2="12"></line>
            <line x1="4" y1="8" x2="12" y2="8"></line>
          </svg>
          {{ loading ? 'Creating...' : 'Create Form' }}
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button @click="formStore.clearError">Dismiss</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading && forms.length === 0" class="loading-state">
        <div class="spinner"></div>
        <p>Loading forms...</p>
      </div>

      <!-- Forms Grid -->
      <div v-else class="forms-grid">
        <!-- Create New Form Card -->
        <div class="form-card create-card" @click="createNewForm">
          <div class="create-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span class="create-text">Create New Form</span>
        </div>

        <!-- Existing Forms -->
        <div
          v-for="form in forms"
          :key="form._id"
          class="form-card"
          @click="editForm(form._id)"
        >
          <div class="form-preview">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="8" y="4" width="32" height="40" rx="4" stroke="#e5e5e5" stroke-width="2" fill="#fff"/>
              <line x1="14" y1="14" x2="34" y2="14" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="14" y1="22" x2="34" y2="22" stroke="#e5e5e5" stroke-width="2"/>
              <line x1="14" y1="30" x2="28" y2="30" stroke="#e5e5e5" stroke-width="2"/>
            </svg>
          </div>
          <div class="form-info">
            <h3 class="form-title">{{ getFormTitle(form) }}</h3>
            <div class="form-meta">
              <span :class="['status-badge', form.status]">
                {{ getStatusLabel(form.status) }}
              </span>
              <span class="responses">{{ form.responses?.length || 0 }} responses</span>
            </div>
            <div class="form-date">
              Modified: {{ formatDate(form.updatedAt) }}
            </div>
          </div>
          <button class="delete-btn" @click="deleteForm($event, form._id)" title="Delete form">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 4h10M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M7 7v5M9 7v5M6 4l.5 9h3l.5-9"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && forms.length === 0" class="empty-state">
        <p>No forms yet. Create your first form!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  padding: 40px 0;
  min-height: calc(100vh - 65px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-content h1 {
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 4px;
}

.header-content p {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover {
  background: #5558e3;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.form-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.form-card:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-style: dashed;
  border-width: 2px;
}

.create-card:hover {
  border-color: #6366f1;
  background: #fafaff;
}

.create-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0ff;
  border-radius: 12px;
  color: #6366f1;
  margin-bottom: 12px;
}

.create-icon svg {
  width: 24px;
  height: 24px;
}

.create-text {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #6366f1;
}

.form-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
}

.form-preview svg {
  width: 48px;
  height: 48px;
}

.form-info {
  padding: 16px;
}

.form-title {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.draft {
  background: #f5f5f5;
  color: #666;
}

.status-badge.open {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.close {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.auto {
  background: #fef3c7;
  color: #d97706;
}

.responses {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #666;
}

.form-date {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  opacity: 0;
  transition: all 0.2s;
}

.form-card {
  position: relative;
}

.form-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fecaca;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message button {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-weight: 500;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e5e5;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #666;
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
