<template>
  <div class="from-list-page">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-link">
          <div class="navbar-logo">
            <img 
              src="https://archives.mfu.ac.th/wp-content/uploads/2019/06/Mae-Fah-Luang-University-2-1.png" 
              alt="MFU Logo"
            />
          </div>
          <div class="navbar-brand">
            <div class="brand-text">FormBuilder</div>
            <div class="brand-subtext">มหาวิทยาลัย</div>
          </div>
        </div>
        <div class="navbar-user-container">
          <div class="user-text">user@example.com</div>
          <div class="logout-link" @click="handleLogout">
            <i class="pi pi-sign-out"></i>
            <span>Logout</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Form List Page -->
    <main class="form-list-page-main">
      <!-- Page Header -->
      <div class="page-container">
        <h1 class="page-heading">My Forms</h1>
        <p class="page-paragraph">Create and manage your forms</p>
      </div>

      <!-- Toolbar -->
      <div class="toolbar-container">
        <!-- Search Input -->
        <div class="search-wrapper">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search forms..."
            class="search-input"
          />
          <i class="pi pi-search search-icon"></i>
        </div>

        <!-- Right Actions -->
        <div class="toolbar-right">
          <!-- Filter Dropdown -->
          <div class="filter-wrapper" ref="filterRef">
            <button class="filter-button" @click="toggleFilterDropdown">
              <i class="pi pi-filter"></i>
              <span class="filter-span">{{ filterLabel }}</span>
              <i class="pi pi-chevron-down chevron-icon"></i>
            </button>
            
            <div v-if="showFilterDropdown" class="filter-dropdown-menu">
              <button 
                class="filter-option" 
                :class="{ active: statusFilter === 'all' }"
                @click="selectFilter('all')"
              >
                All Status
              </button>
              <button 
                class="filter-option" 
                :class="{ active: statusFilter === 'open' }"
                @click="selectFilter('open')"
              >
                Open
              </button>
              <button 
                class="filter-option" 
                :class="{ active: statusFilter === 'draft' }"
                @click="selectFilter('draft')"
              >
                Draft
              </button>
              <button 
                class="filter-option" 
                :class="{ active: statusFilter === 'closed' }"
                @click="selectFilter('closed')"
              >
                Closed
              </button>
            </div>
          </div>

          <!-- Create Form Button -->
          <div class="create-link" @click="handleCreateForm">
            <i class="pi pi-plus"></i>
            <span>Create Form</span>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-wrapper">
        <div class="table-container">
          <div class="table">
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
                v-for="form in filteredForms" 
                :key="form.id" 
                class="table-row data-row"
                @click="handleFormClick(form.id)"
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
                      <i class="pi pi-comment"></i>
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
                    <i class="pi pi-calendar"></i>
                    <div class="modified-text">{{ form.createdDate }}</div>
                  </div>
                </div>

                <!-- Actions Cell -->
                <div class="table-cell actions-cell">
                  <div class="actions-buttons">
                    <button class="action-button edit-button" @click.stop="handleEdit(form.id)">
                      <i class="pi pi-pencil"></i>
                    </button>
                    <button class="action-button more-button" @click.stop="handleMore(form.id)">
                      <i class="pi pi-ellipsis-v"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const statusFilter = ref('all')
const showFilterDropdown = ref(false)
const filterRef = ref(null)

const forms = ref([
  {
    id: 1,
    title: 'Comprehensive Survey - All Question Types',
    description: 'A demonstration survey showcasing all available qu',
    status: 'open',
    responses: 6,
    createdDate: 'Dec 10, 2025'
  },
  {
    id: 2,
    title: 'Customer Satisfaction Survey',
    description: 'Help us improve our services by sharing your feedb',
    status: 'open',
    responses: 156,
    createdDate: 'Nov 20, 2024'
  },
  {
    id: 3,
    title: 'Event Registration Form',
    description: 'Register for our upcoming webinar on December 15th',
    status: 'open',
    responses: 89,
    createdDate: 'Nov 18, 2024'
  },
  {
    id: 4,
    title: 'Employee Feedback Q4 2024',
    description: 'Internal feedback survey for team members',
    status: 'draft',
    responses: 0,
    createdDate: 'Dec 2, 2024'
  },
  {
    id: 5,
    title: 'Product Feature Request',
    description: 'Share your ideas for new features',
    status: 'open',
    responses: 234,
    createdDate: 'Nov 25, 2024'
  },
  {
    id: 6,
    title: 'Weekly Team Check-in',
    description: 'Quick pulse check for the team',
    status: 'closed',
    responses: 12,
    createdDate: 'Nov 8, 2024'
  },
  {
    id: 7,
    title: 'Conference Feedback 2024',
    description: '',
    status: 'open',
    responses: 45,
    createdDate: 'Nov 30, 2024'
  }
])

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

const filterLabel = computed(() => {
  if (statusFilter.value === 'all') return 'All Status'
  if (statusFilter.value === 'open') return 'Open'
  if (statusFilter.value === 'draft') return 'Draft'
  if (statusFilter.value === 'closed') return 'Closed'
  return 'All Status'
})

const toggleFilterDropdown = () => {
  showFilterDropdown.value = !showFilterDropdown.value
}

const selectFilter = (filter) => {
  statusFilter.value = filter
  showFilterDropdown.value = false
}

const handleFormClick = (formId) => {
  router.push(`/form/${formId}/preview`)
}

const handleCreateForm = () => {
  console.log('Create new form')
}

const handleLogout = () => {
  console.log('Logout')
}

const handleEdit = (formId) => {
  console.log('Edit form:', formId)
}

const handleMore = (formId) => {
  console.log('More options for form:', formId)
}

const handleClickOutside = (event) => {
  if (filterRef.value && !filterRef.value.contains(event.target)) {
    showFilterDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.from-list-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 65px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 32px;
  z-index: 100;
}

.navbar-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1143px;
  margin: 0 auto;
}

.navbar-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.navbar-logo {
  width: 40px;
  height: 40px;
}

.navbar-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.navbar-brand {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.brand-text {
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  letter-spacing: -0.3125px;
  color: #1A1A1A;
}

.brand-subtext {
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  color: #737373;
}

.navbar-user-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.user-text {
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #525252;
}

.logout-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-link:hover {
  background: rgba(0, 0, 0, 0.05);
}

.logout-link i {
  font-size: 16px;
  color: #333333;
}

.logout-link span {
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
}

/* Main Content */
.form-list-page-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 97px 32px 0px;
  gap: 32px;
  max-width: 1143px;
  margin: 0 auto;
  background: #FAFAFA;
}

/* Page Header */
.page-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.page-heading {
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.530859px;
  color: #333333;
}

.page-paragraph {
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #525252;
}

/* Toolbar */
.toolbar-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 36px;
}

.search-wrapper {
  position: relative;
  width: 777.17px;
}

.search-input {
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  padding: 4px 12px 4px 40px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  outline: none;
}

.search-input::placeholder {
  color: #333333;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 10px;
  width: 16px;
  height: 16px;
  color: #A3A3A3;
  pointer-events: none;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.filter-wrapper {
  position: relative;
}

.filter-button {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 12px;
  gap: 16px;
  width: 140px;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.filter-button i {
  font-size: 16px;
  color: #737373;
}

.filter-span {
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
  letter-spacing: -0.150391px;
  color: #333333;
}

.chevron-icon {
  opacity: 0.5;
}

.filter-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 140px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 10;
}

.filter-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
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

.filter-option:hover {
  background: #F5F5F5;
}

.filter-option.active {
  background: #BA0C2F;
  color: #FFFFFF;
}

.create-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 137.83px;
  height: 36px;
  background: #BA0C2F;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.create-link:hover {
  background: #9A0A27;
}

.create-link i {
  font-size: 16px;
  color: #FAFAFA;
}

.create-link span {
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #FAFAFA;
}

/* Table */
.table-wrapper {
  box-sizing: border-box;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 1px;
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
  grid-template-columns: 547.41px 122.05px 146.38px 159.78px 124px;
  background: #FAFAFA;
  border-bottom: 1px solid #E5E5E5;
  height: 52.5px;
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
  justify-content: flex-end;
  padding-right: 24px;
}

/* Table Body */
.table-body {
  width: 100%;
}

.data-row {
  display: grid;
  grid-template-columns: 547.41px 122.05px 146.38px 159.78px 124px;
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
