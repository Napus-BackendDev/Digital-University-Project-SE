<template>
  <div class="userdashboard">
    <!-- Form List Page -->
    <main class="form-list-page">
      <!-- Page Header -->
      <PageHeader 
        title="Available Forms" 
        subtitle="Fill out forms and submit responses" 
      />

      <!-- Search Bar -->
      <div class="search-container">
        <SearchBar 
          v-model="searchQuery"
          placeholder="Search forms..."
        />
      </div>

      <!-- Table Container -->
      <FormTable
        :forms="paginatedForms"
        :loading="loading"
        :error="error"
        :empty-message="searchQuery ? 'Try adjusting your search' : 'No forms available at the moment'"
        @form-click="handleFillForm"
        @toggle-dropdown="toggleActionsDropdown"
        @retry="fetchForms"
      >
        <template #actions="{ form }">
          <div class="actions-buttons">
            <button class="action-button more-button" @click.stop="toggleActionsDropdown(form.id)">
              <i class="pi pi-ellipsis-v"></i>
            </button>
            
            <!-- Actions Dropdown -->
            <div v-if="activeDropdown === form.id" class="actions-dropdown">
              <button class="dropdown-item" @click.stop="handleFillForm(form.id)">
                <i class="pi pi-file-edit"></i>
                <span>Fill Form</span>
              </button>
            </div>
          </div>
        </template>
      </FormTable>

      <!-- Pagination -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @prev="previousPage"
        @next="nextPage"
        @goto="goToPage"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import FormTable from '@/components/FormTable.vue';
import Pagination from '@/components/Pagination.vue';
import SearchBar from '@/components/SearchBar.vue';
import PageHeader from '@/components/PageHeader.vue';
import { formAPI } from '@/services/api';

const router = useRouter();

const searchQuery = ref('');
const loading = ref(false);
const error = ref(null);
const activeDropdown = ref(null);
const currentPage = ref(1);
const itemsPerPage = 6;

// Forms data from API
const formsData = ref([]);

// Helper function to extract title from array structure
const getTitle = (titleArray) => {
  if (!titleArray) return ''
  if (typeof titleArray === 'string') return titleArray
  if (!Array.isArray(titleArray)) return ''
  
  // Try English first, then Thai, then first available
  const enTitle = titleArray.find(t => t.key === 'en')?.value
  const thTitle = titleArray.find(t => t.key === 'th')?.value
  const firstTitle = titleArray[0]?.value || titleArray[0]?.text
  
  return enTitle || thTitle || firstTitle || ''
}

// Format date to readable format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// Fetch forms from API
const fetchForms = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await formAPI.getAll();
    
    // Handle different API response structures
    const formData = Array.isArray(response.data) 
      ? response.data 
      : (response.data.data || response.data.datas || []);
    
    // Transform API data to match component structure
    // Filter forms with status 'open' or 'closed' for user dashboard
    formsData.value = formData
      .filter(form => form.status === 'open' || form.status === 'close' || form.status === 'closed')
      .map(form => ({
        id: form._id,
        title: getTitle(form.title) || 'Untitled Form',
        description: getTitle(form.description) || 'No description',
        status: form.status || 'open',
        responses: form.responseCount || 0,
        createdDate: formatDate(form.updatedAt || form.createdAt)
      }));
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load forms';
    console.error('Error fetching forms:', err);
    formsData.value = [];
  } finally {
    loading.value = false;
  }
};

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

onMounted(() => {
  fetchForms();
});
</script>

<style scoped>
/* ==================== MAIN CONTAINER ==================== */
.userdashboard {
  position: relative;
  max-width: 1536px;
  width: 100%;
  min-height: 1000px;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
  margin: 0 auto;
}

.form-list-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 160px;
  gap: 32px;
  width: 100%;
  max-width: 1536px;
  min-height: calc(100vh - 65px);
  background: #FAFAFA;
  margin: 0 auto;
}

/* ==================== SEARCH ==================== */
.search-container {
  width: 100%;
  max-width: 1216px;
  position: relative;
}

/* ==================== TABLE WRAPPER ==================== */
.table-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1px;
  width: 100%;
  max-width: 1216px;
  min-height: 653px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
}

.table-container {
  width: 100%;
  overflow: hidden;
  border-radius: 16px;
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
  overflow: visible;
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
  position: relative;
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
  color: #DC2626;
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
  position: relative;
  z-index: 100;
}

.actions-buttons {
  position: relative;
  display: flex;
  gap: 4px;
  z-index: 100;
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
  z-index: 10000;
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
  color: #A3A3A3;
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

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1400px) {
  .form-list-page {
    padding: 32px 80px;
  }
}

@media (max-width: 1200px) {
  .form-list-page {
    padding: 32px 40px;
  }

  .header-row,
  .data-row {
    grid-template-columns: 2fr 110px 130px 140px 110px;
  }
}

@media (max-width: 1024px) {
  .form-list-page {
    padding: 24px 24px;
  }

  .header-row,
  .data-row {
    grid-template-columns: 2fr 100px 120px 80px;
  }

  .table-head:nth-child(4),
  .table-cell:nth-child(4) {
    display: none;
  }
}

@media (max-width: 768px) {
  .form-list-page {
    padding: 20px 16px;
  }

  .header-row,
  .data-row {
    grid-template-columns: 1fr 80px;
  }

  .table-head:nth-child(2),
  .table-head:nth-child(3),
  .table-cell:nth-child(2),
  .table-cell:nth-child(3) {
    display: none;
  }

  .form-description {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .form-list-page {
    padding: 16px 12px;
    gap: 20px;
  }

  .header-row {
    display: none;
  }

  .data-row {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 12px;
    align-items: flex-start;
  }

  .table-cell {
    width: 100%;
    padding: 0;
  }

  .actions-cell {
    justify-content: flex-start;
  }

  .responses-info,
  .modified-info {
    width: 100%;
  }
}
</style>
