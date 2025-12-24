<template>
  <div class="editordashboard">
    <!-- Navbar -->
    <Navbar />

    <!-- Form List Page -->
    <main class="form-list-page-main">
      <!-- Page Header -->
      <PageHeader 
        title="My Forms" 
        subtitle="Create and manage your forms" 
      />

      <!-- Toolbar -->
      <div class="toolbar-container">
        <!-- Search Input -->
        <div class="editor-search-wrapper">
          <SearchBar 
            v-model="searchQuery"
            placeholder="Search forms..."
          />
        </div>

        <!-- Right Actions -->
        <div class="toolbar-right">
          <!-- Filter Dropdown -->
          <FilterDropdown 
            v-model="statusFilter"
            :options="filterOptions"
          />

          <!-- Create Form Button -->
          <div class="create-link" @click="handleCreateForm">
            <i class="pi pi-plus"></i>
            <span>Create Form</span>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <FormTable
        :forms="paginatedForms"
        :loading="loading"
        :error="error"
        :empty-message="searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first form to get started'"
        @form-click="() => {}"
        @toggle-dropdown="toggleActionsDropdown"
        @retry="fetchForms"
      >
        <template #actions="{ form }">
          <div class="actions-buttons" ref="actionsRef">
            <div class="action-more-wrapper">
              <button class="action-button more-button" @click.stop="toggleActionsDropdown(form.id)">
                <i class="pi pi-ellipsis-v"></i>
              </button>
              
              <div v-if="showActionsDropdown === form.id" class="actions-dropdown-menu">
                <button class="action-dropdown-item" @click.stop="handleEdit(form.id)">
                  <i class="pi pi-file-edit"></i>
                  <span>Edit Form</span>
                </button>
                <button class="action-dropdown-item" @click.stop="handlePreview(form.id)">
                  <i class="pi pi-eye"></i>
                  <span>Preview</span>
                </button>
                <button class="action-dropdown-item" @click.stop="handleDuplicate(form.id)">
                  <i class="pi pi-copy"></i>
                  <span>Duplicate</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="action-dropdown-item danger" @click.stop="handleDelete(form.id)">
                  <i class="pi pi-trash"></i>
                  <span>Delete</span>
                </button>
              </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { formAPI } from '@/services/api'
import Navbar from '@/components/Navbar.vue'
import FormTable from '@/components/FormTable.vue'
import Pagination from '@/components/Pagination.vue'
import SearchBar from '@/components/SearchBar.vue'
import FilterDropdown from '@/components/FilterDropdown.vue'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const searchQuery = ref('')
const statusFilter = ref('all')
const showActionsDropdown = ref(null)
const actionsRef = ref(null)
const forms = ref([])
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const itemsPerPage = ref(7)

const filterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' }
]

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

// Get title from multilingual array
const getTitle = (titleArray) => {
  if (!Array.isArray(titleArray) || titleArray.length === 0) return ''
  
  // Try English first, then Thai, then first available
  const enTitle = titleArray.find(t => t.key === 'en')?.value
  const thTitle = titleArray.find(t => t.key === 'th')?.value
  const firstTitle = titleArray[0]?.value || titleArray[0]?.text
  
  return enTitle || thTitle || firstTitle || ''
}

// Fetch forms from API
const fetchForms = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await formAPI.getAllForms()
    console.log('API Response:', response)
    
    // Handle different API response structures
    const formData = Array.isArray(response.data) 
      ? response.data 
      : (response.data.data || response.data.datas || [])
    
    console.log('Form Data:', formData)
    console.log('Form Data Length:', formData.length)
    
    // Transform API data to match component structure
    forms.value = formData.map(form => ({
      id: form._id,
      title: getTitle(form.title) || 'Untitled Form',
      description: getTitle(form.description) || 'No description',
      status: form.status || 'draft',
      responses: form.responseCount || 0,
      createdDate: formatDate(form.updatedAt || form.createdAt)
    }))
    
    console.log('Forms Value:', forms.value)
    console.log('Forms Length:', forms.value.length)
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load forms'
    console.error('Error fetching forms:', err)
  } finally {
    loading.value = false
  }
}

const filteredForms = computed(() => {
  let filtered = forms.value

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(form => form.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(form =>
      form.title.toLowerCase().includes(query) ||
      form.description.toLowerCase().includes(query)
    )
  }

  return filtered
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredForms.value.length / itemsPerPage.value)
  console.log('Total Pages:', pages, 'Filtered Forms:', filteredForms.value.length, 'Items Per Page:', itemsPerPage.value)
  return pages
})

const paginatedForms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredForms.value.slice(start, end)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const handleCreateForm = () => {
  // Navigate to form creation page
  router.push('/form/create')
}

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    // TODO: Clear authentication tokens
    router.push('/')
  }
}

const handleEdit = (formId) => {
  showActionsDropdown.value = null
  router.push(`/form/${formId}/edit`)
}

const handlePreview = (formId) => {
  showActionsDropdown.value = null
  router.push(`/form/${formId}/preview`)
}

const handleDuplicate = async (formId) => {
  showActionsDropdown.value = null
  
  try {
    loading.value = true
    const result = await formAPI.duplicateForm(formId)
    console.log('Duplicate result:', result)
    // Refresh the forms list to show the duplicated form
    await fetchForms()
    alert('Form duplicated successfully!')
  } catch (err) {
    console.error('Error duplicating form:', err)
    const errorMsg = err.response?.data?.message || 'Failed to duplicate form. Please try again.'
    alert(errorMsg)
  } finally {
    loading.value = false
  }
}

const handleMore = (formId) => {
  console.log('More options for form:', formId)
}

const toggleActionsDropdown = (formId) => {
  showActionsDropdown.value = showActionsDropdown.value === formId ? null : formId
}

const handleDelete = async (formId) => {
  showActionsDropdown.value = null
  
  if (!confirm('Are you sure you want to delete this form?')) {
    return
  }
  
  try {
    await formAPI.deleteForm(formId)
    // Refresh the forms list
    await fetchForms()
  } catch (err) {
    console.error('Error deleting form:', err)
    alert('Failed to delete form. Please try again.')
  }
}

onMounted(() => {
  // Fetch forms when component is mounted
  fetchForms()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.editordashboard {
  width: 1536px;
  min-height: 100vh;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
  overflow-x: auto;
  margin: 0 auto;
  padding-top: 65px;
}

/* Form List Page */
.form-list-page-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 160px 40px;
  gap: 32px;
  width: 1536px;
  min-height: 1020px;
  background: #FAFAFA;
}

/* Toolbar */
.toolbar-container {
  position: relative;
  width: 1216px;
  height: 36px;
}

.editor-search-wrapper {
  position: absolute;
  width: 914.17px;
  height: 36px;
  left: 0px;
  top: 0px;
}

.toolbar-right {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 0px;
  gap: 8px;
  position: absolute;
  width: 285.83px;
  height: 36px;
  left: 930.17px;
  top: 0px;
}

.create-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 137.83px;
  height: 36px;
  background: #BA0C2F;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  flex: none;
  order: 1;
  flex-grow: 0;
}

.create-link:hover {
  background: #9A0A27;
}

.create-link i {
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: #FAFAFA;
}

.create-link span {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #FAFAFA;
}

/* Table Wrapper */
.table-wrapper {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1px;
  width: 1216px;
  min-height: 653px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  flex: none;
  order: 2;
  align-self: stretch;
  flex-grow: 0;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  width: 100%;
  min-height: 400px;
}

.loading-spinner i {
  font-size: 48px;
  color: #BA0C2F;
}

.loading-text {
  margin-top: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #525252;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.error-icon i {
  font-size: 48px;
  color: #FB2C36;
}

.error-text {
  margin-top: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #333333;
}

.retry-button {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #BA0C2F;
  border: none;
  border-radius: 12px;
  color: #FFFFFF;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #9A0A27;
}

.retry-button i {
  font-size: 14px;
}

/* Empty State */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.empty-icon i {
  font-size: 48px;
  color: #A3A3A3;
}

.empty-text {
  margin-top: 16px;
  font-weight: 600;
  font-size: 18px;
  color: #333333;
}

.empty-subtext {
  margin-top: 8px;
  font-weight: 400;
  font-size: 14px;
  color: #737373;
}

.table-container {
  width: 100%;
}

.table {
  width: 100%;
}

/* Table Header */
.table-header {
  width: 100%;
}

.header-row {
  display: grid;
  grid-template-columns: 604.36px 134.75px 161.61px 176.41px 136.91px;
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
  height: 52px;
}

.table-head {
  display: flex;
  align-items: center;
  padding-left: 24px;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #404040;
}

.actions-head {
  text-align: right;
  padding-right: 24px;
  padding-left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* Table Body */
.table-body {
  width: 100%;
}

.data-row {
  display: grid;
  grid-template-columns: 604.36px 134.75px 161.61px 176.41px 136.91px;
  border-bottom: 1px solid #F5F5F5;
  min-height: 87px;
  cursor: pointer;
  transition: background 0.2s;
}

.data-row:hover {
  background: #FAFAFA;
}

.table-cell {
  display: flex;
  align-items: center;
  padding: 20.5px 24px;
}

/* Form Name Cell */
.form-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #1A1A1A;
}

.form-description {
  font-weight: 400;
  font-size: 14px;
  line-height: 23px;
  letter-spacing: -0.150391px;
  color: #525252;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 499.41px;
}

/* Status Cell */
.status-badge {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 12px 5px 11px;
  height: 26px;
  border-radius: 33554400px;
}

.status-open {
  background: #ECFDF5;
  border: 1px solid #A4F4CF;
}

.status-draft {
  background: #F5F5F5;
  border: 1px solid #E5E5E5;
}

.status-closed {
  background: #FEF2F2;
  border: 1px solid #FFC9C9;
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
  background: #A3A3A3;
}

.status-closed .status-dot {
  background: #FB2C36;
}

.status-text {
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
}

.status-open .status-text {
  color: #007A55;
}

.status-draft .status-text {
  color: #404040;
}

.status-closed .status-text {
  color: #C10007;
}

/* Responses Cell */
.responses-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.responses-icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  background: #FEF2F2;
  border-radius: 16px;
}

.responses-icon-wrapper i {
  font-size: 16px;
  color: #BA0C2F;
}

.responses-content {
  display: flex;
  flex-direction: column;
}

.responses-count {
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #1A1A1A;
}

.responses-label {
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #737373;
}

/* Modified Cell */
.modified-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modified-info i {
  font-size: 16px;
  color: #A3A3A3;
}

.modified-text {
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #525252;
}

/* Actions Cell */
.actions-cell {
  justify-content: flex-end;
}

.actions-buttons {
  display: flex;
  gap: 4px;
}

.action-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.edit-button {
  opacity: 0;
}

.more-button {
  opacity: 0.6;
}

.data-row:hover .edit-button {
  opacity: 1;
}

.action-button:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.05);
}

.action-button i {
  font-size: 16px;
  color: #333333;
}

.action-more-wrapper {
  position: relative;
}

.actions-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
  padding: 4px 0;
}

.action-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.action-dropdown-item:hover {
  background: #F5F5F5;
}

.action-dropdown-item.danger {
  color: #DC2626;
}

.action-dropdown-item.danger:hover {
  background: #FEF2F2;
}

.action-dropdown-item i {
  font-size: 16px;
  color: #737373;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-dropdown-item.danger i {
  color: #DC2626;
}

.action-dropdown-item span {
  flex: 1;
}

.dropdown-divider {
  height: 1px;
  background: #E5E5E5;
  margin: 4px 0;
}

/* Responsive */
@media (max-width: 1200px) {
  .form-list-page-main {
    padding: 97px 16px 0px;
  }

  .navbar {
    padding: 0 16px;
  }

  .search-wrapper {
    width: auto;
    flex: 1;
  }

  .header-row,
  .data-row {
    grid-template-columns: 2fr 1fr 1fr 1fr 100px;
  }
}

@media (max-width: 768px) {
  .toolbar-container {
    flex-direction: column;
    height: auto;
    gap: 12px;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .toolbar-right {
    justify-content: space-between;
  }

  .filter-button {
    flex: 1;
  }

  .header-row,
  .data-row {
    grid-template-columns: 1fr;
  }

  .table-head:not(.form-name-head),
  .table-cell:not(.form-name-cell) {
    display: none;
  }
}
</style>
