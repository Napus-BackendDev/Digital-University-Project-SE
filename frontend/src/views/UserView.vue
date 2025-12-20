<template>
  <div class="user-view">
    <!-- Navbar -->
    <Navbar />

    <!-- Form List Page -->
    <main class="form-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-heading">My Forms</h1>
        <p class="page-description">Create and manage your forms</p>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 16 16" fill="none">
          <circle cx="7.5" cy="7.5" r="5.5" stroke="#A3A3A3" stroke-width="1.33333"/>
          <path d="M11.5 11.5L14 14" stroke="#A3A3A3" stroke-width="1.33333" stroke-linecap="round"/>
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search forms..."
          class="search-input"
        />
      </div>

      <!-- Table Container -->
      <div class="table-wrapper">
        <!-- Loading State -->
        <div v-if="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p class="loading-text">Loading forms...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredForms.length === 0" class="empty-container">
          <div class="empty-icon">📋</div>
          <p class="empty-text">No forms found</p>
          <p class="empty-subtext">
            {{ searchQuery ? 'Try adjusting your search' : 'No forms available at the moment' }}
          </p>
        </div>

        <!-- Table with Data -->
        <div v-else class="table-container">
          <!-- Table Header -->
          <div class="table-header">
            <div class="table-row header-row">
              <div class="table-head form-name-head">Form Name</div>
              <div class="table-head status-head">Status</div>
              <div class="table-head responses-head">Responses</div>
              <div class="table-head modified-head">Last Modified</div>
              <div class="table-head actions-head">Actions</div>
            </div>
          </div>

          <!-- Table Body -->
          <div class="table-body">
            <div 
              v-for="form in paginatedForms" 
              :key="form.id" 
              class="table-row data-row"
            >
              <!-- Form Name Cell -->
              <div class="table-cell form-name-cell">
                <div class="form-info">
                  <div class="form-title">{{ form.title }}</div>
                  <div class="form-description">{{ form.description }}</div>
                </div>
              </div>

              <!-- Status Cell -->
              <div class="table-cell status-cell">
                <div :class="['status-badge', `status-${form.status}`]">
                  <div class="status-dot"></div>
                  <div class="status-text">
                    {{ form.status === 'open' ? 'Open' : form.status === 'draft' ? 'Draft' : 'Closed' }}
                  </div>
                </div>
              </div>

              <!-- Responses Cell -->
              <div class="table-cell responses-cell">
                <div class="responses-info">
                  <div class="responses-icon-wrapper">
                    <svg class="responses-icon" viewBox="0 0 16 16" fill="none">
                      <path d="M2 12.5L3.5 11L2 9.5M2 2.5L13 2.5C13.8284 2.5 14.5 3.17157 14.5 4V9C14.5 9.82843 13.8284 10.5 13 10.5H5.5L2 14V2.5Z" stroke="#BA0C2F" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div class="responses-content">
                    <div class="responses-count">{{ form.responses }}</div>
                    <div class="responses-label">responses</div>
                  </div>
                </div>
              </div>

              <!-- Last Modified Cell -->
              <div class="table-cell modified-cell">
                <div class="modified-info">
                  <svg class="calendar-icon" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#A3A3A3" stroke-width="1.33333"/>
                    <path d="M5 1.5V3M11 1.5V3M2 6H14M2 7H14" stroke="#A3A3A3" stroke-width="1.33333" stroke-linecap="round"/>
                  </svg>
                  <div class="modified-text">{{ form.createdDate }}</div>
                </div>
              </div>

              <!-- Actions Cell -->
              <div class="table-cell actions-cell">
                <div class="actions-buttons">
                  <button class="action-button more-button" @click.stop="toggleActionsDropdown(form.id)">
                    <svg viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="3" r="1" fill="#333333"/>
                      <circle cx="8" cy="8" r="1" fill="#333333"/>
                      <circle cx="8" cy="13" r="1" fill="#333333"/>
                    </svg>
                  </button>
                  
                  <!-- Actions Dropdown -->
                  <div v-if="activeDropdown === form.id" class="actions-dropdown">
                    <button class="dropdown-item" @click="handleFillForm(form.id)">
                      <svg viewBox="0 0 16 16" fill="none">
                        <path d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z" stroke="currentColor" stroke-width="1.33333"/>
                        <path d="M5 6H11M5 9H11" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round"/>
                      </svg>
                      <span>Fill Form</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container">
        <button 
          class="pagination-button prev-button" 
          @click="previousPage" 
          :disabled="currentPage === 1"
          :class="{ disabled: currentPage === 1 }"
        >
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Previous</span>
        </button>
        
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="pagination-button page-button"
          :class="{ active: page === currentPage }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        
        <button 
          class="pagination-button next-button" 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          :class="{ disabled: currentPage === totalPages }"
        >
          <span>Next</span>
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';

const router = useRouter();

const searchQuery = ref('');
const loading = ref(false);
const activeDropdown = ref(null);
const currentPage = ref(1);
const itemsPerPage = 6;

// Mock data
const formsData = ref([
  {
    id: 1,
    title: "Comprehensive Survey - All Question Types",
    description: "A demonstration survey showcasing all available question types in the system",
    status: "open",
    responses: 6,
    createdDate: "Dec 8, 2024"
  },
  {
    id: 2,
    title: "Customer Satisfaction Survey",
    description: "Help us improve our services by sharing your feedback",
    status: "open",
    responses: 156,
    createdDate: "Nov 20, 2024"
  }
]);

const filteredForms = computed(() => {
  let forms = formsData.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    forms = forms.filter(form => 
      form.title.toLowerCase().includes(query) || 
      form.description.toLowerCase().includes(query)
    );
  }
  
  return forms;
});

const totalPages = computed(() => Math.ceil(filteredForms.value.length / itemsPerPage));

const paginatedForms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredForms.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3);
    } else if (current >= total - 2) {
      pages.push(total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }
  
  return pages;
});

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    router.push('/');
  }
};

const handleViewForm = (formId) => {
  activeDropdown.value = null;
  router.push(`/form/${formId}/preview`);
};

const handleFillForm = (formId) => {
  activeDropdown.value = null;
  router.push(`/form/${formId}/response`);
};

const toggleActionsDropdown = (formId) => {
  activeDropdown.value = activeDropdown.value === formId ? null : formId;
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPage = (page) => {
  currentPage.value = page;
};

const handleClickOutside = (event) => {
  if (!event.target.closest('.actions-buttons')) {
    activeDropdown.value = null;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* ==================== MAIN CONTAINER ==================== */
.user-view {
  min-height: 100vh;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
  padding-top: 65px;
}

.form-list-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 160px 40px;
  gap: 32px;
  min-height: calc(100vh - 65px);
  background: #FAFAFA;
}

/* ==================== PAGE HEADER ==================== */
.page-header {
  width: 100%;
  max-width: 1216px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.53px;
  color: #333333;
  margin: 0;
}

.page-description {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.31px;
  color: #525252;
  margin: 0;
}

/* ==================== SEARCH ==================== */
.search-container {
  width: 100%;
  max-width: 1216px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 4px 12px 4px 40px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input::placeholder {
  color: #A3A3A3;
}

.search-input:focus {
  outline: none;
  border-color: #333333;
}

/* ==================== TABLE WRAPPER ==================== */
.table-wrapper {
  width: 100%;
  max-width: 1216px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
}

.table-container {
  width: 100%;
}

/* ==================== TABLE HEADER ==================== */
.table-header {
  width: 100%;
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
}

.header-row {
  display: grid;
  grid-template-columns: 1fr 135px 162px 176px 137px;
  align-items: center;
  height: 52px;
  padding: 0 24px;
}

.table-head {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #404040;
}

.actions-head {
  text-align: right;
}

/* ==================== TABLE BODY ==================== */
.table-body {
  width: 100%;
}

.data-row {
  display: grid;
  grid-template-columns: 1fr 135px 162px 176px 137px;
  align-items: center;
  min-height: 87px;
  padding: 20px 24px;
  border-bottom: 1px solid #F5F5F5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.data-row:hover {
  background: #FAFAFA;
}

.data-row:last-child {
  border-bottom: none;
}

/* ==================== TABLE CELLS ==================== */
.table-cell {
  display: flex;
  align-items: center;
}

.form-name-cell {
  overflow: hidden;
}

.form-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.form-title {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #1A1A1A;
}

.form-description {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 23px;
  letter-spacing: -0.15px;
  color: #525252;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== STATUS BADGE ==================== */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 5px 11px;
  border-radius: 999px;
}

.status-open {
  background: #ECFDF5;
  border: 1px solid #A4F4CF;
}

.status-draft {
  background: #FEF9C3;
  border: 1px solid #FDE68A;
}

.status-closed {
  background: #FEE2E2;
  border: 1px solid #FECACA;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-open .status-dot {
  background: #00BC7D;
}

.status-draft .status-dot {
  background: #F59E0B;
}

.status-closed .status-dot {
  background: #EF4444;
}

.status-text {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
}

.status-open .status-text {
  color: #007A55;
}

.status-draft .status-text {
  color: #92400E;
}

.status-closed .status-text {
  color: #991B1B;
}

/* ==================== RESPONSES ==================== */
.responses-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.responses-icon-wrapper {
  width: 32px;
  height: 32px;
  background: #FEF2F2;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.responses-icon {
  width: 16px;
  height: 16px;
}

.responses-content {
  display: flex;
  flex-direction: column;
}

.responses-count {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #1A1A1A;
}

.responses-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

/* ==================== MODIFIED DATE ==================== */
.modified-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-icon {
  width: 16px;
  height: 16px;
}

.modified-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #525252;
}

/* ==================== ACTIONS ==================== */
.actions-cell {
  justify-content: flex-end;
}

.actions-buttons {
  position: relative;
  display: flex;
  gap: 4px;
}

.action-button {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button svg {
  width: 16px;
  height: 16px;
}

.more-button {
  opacity: 0.6;
}

.action-button:hover {
  background: rgba(229, 229, 229, 0.3);
  opacity: 1;
}

.actions-dropdown {
  position: absolute;
  right: 0;
  top: 40px;
  width: 160px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  text-align: left;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #F5F5F5;
}

.dropdown-item svg {
  width: 16px;
  height: 16px;
}

/* ==================== LOADING & EMPTY STATES ==================== */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E5E5;
  border-top-color: #333333;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #333333;
  margin-top: 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #333333;
}

.empty-subtext {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #737373;
  margin-top: 8px;
}

/* ==================== PAGINATION ==================== */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: auto;
}

.pagination-button {
  height: 36px;
  min-width: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  transition: all 0.2s;
}

.pagination-button svg {
  width: 16px;
  height: 16px;
}

.pagination-button:hover:not(.disabled) {
  background: rgba(229, 229, 229, 0.3);
}

.pagination-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-button {
  width: 36px;
  padding: 8px;
}

.page-button.active {
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  color: #0A0A0A;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1600px) {
  .form-list-page {
    padding: 32px 40px 40px;
  }
}
</style>
