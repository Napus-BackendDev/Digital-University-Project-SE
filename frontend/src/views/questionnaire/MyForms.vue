<template>
  <div class="my-forms-page">
    <!-- Page Header -->
    <div class="page-header mb-4">
      <h1 class="page-title">My Forms</h1>
      <p class="page-subtitle text-muted">Create and manage your forms</p>
    </div>

    <!-- Search and Actions Bar -->
    <CRow class="mb-4">
      <CCol md="8" lg="9">
        <div class="search-input-wrapper">
          <CIcon name="cil-search" class="search-icon" />
          <CInput
            v-model="searchQuery"
            placeholder="Search forms..."
            class="search-input"
          />
        </div>
      </CCol>
      <CCol md="4" lg="3">
        <div class="d-flex gap-2 justify-content-end">
          <CDropdown color="light" class="status-dropdown">
            <template #toggler-content>
              <CIcon name="cil-filter" class="mr-2" size="sm" />
              {{ selectedStatus || 'All Status' }}
              <CIcon name="cil-chevron-bottom" class="ml-2" size="sm" />
            </template>
            <CDropdownItem @click="selectedStatus = ''">All Status</CDropdownItem>
            <CDropdownItem @click="selectedStatus = 'Open'">Open</CDropdownItem>
            <CDropdownItem @click="selectedStatus = 'Draft'">Draft</CDropdownItem>
            <CDropdownItem @click="selectedStatus = 'Closed'">Closed</CDropdownItem>
          </CDropdown>
          <CButton color="danger" class="create-form-btn" @click="createForm">
            <CIcon name="cil-plus" class="mr-2" />
            Create Form
          </CButton>
        </div>
      </CCol>
    </CRow>

    <!-- Forms Table -->
    <CCard class="forms-table-card">
      <CCardBody class="p-0">
        <CDataTable
          :items="filteredForms"
          :fields="fields"
          hover
          :items-per-page="itemsPerPage"
          :pagination="false"
          class="forms-table"
        >
          <!-- Form Name Column -->
          <template #formName="{item}">
            <td class="form-name-cell">
              <div class="form-info">
                <div class="form-title">{{ item.formName }}</div>
                <div class="form-description text-muted">{{ item.description }}</div>
              </div>
            </td>
          </template>

          <!-- Status Column -->
          <template #status="{item}">
            <td>
              <CBadge :color="getStatusBadgeColor(item.status)" class="status-badge">
                <span class="status-dot" :class="getStatusDotClass(item.status)"></span>
                {{ item.status }}
              </CBadge>
            </td>
          </template>

          <!-- Responses Column -->
          <template #responses="{item}">
            <td>
              <div class="responses-cell d-flex align-items-center">
                <div class="responses-icon">
                  <CIcon name="cil-description" />
                </div>
                <div class="responses-info">
                  <div class="responses-count">{{ item.responses }}</div>
                  <div class="responses-label text-muted">responses</div>
                </div>
              </div>
            </td>
          </template>

          <!-- Last Modified Column -->
          <template #lastModified="{item}">
            <td>
              <div class="last-modified-cell d-flex align-items-center">
                <CIcon name="cil-calendar" class="mr-2 text-muted" />
                <span class="text-muted">{{ item.lastModified }}</span>
              </div>
            </td>
          </template>

          <!-- Actions Column -->
          <template #actions="{item}">
            <td class="actions-cell">
              <div class="d-flex justify-content-end">
                <CButton
                  color="light"
                  variant="ghost"
                  size="sm"
                  class="action-btn"
                  @click="editForm(item)"
                >
                  <CIcon name="cil-pencil" />
                </CButton>
                <CDropdown
                  color="light"
                  variant="ghost"
                  size="sm"
                  class="action-dropdown"
                  placement="bottom-end"
                >
                  <template #toggler-content>
                    <CIcon name="cil-options" />
                  </template>
                  <CDropdownItem @click="viewForm(item)">
                    <CIcon name="cil-magnifying-glass" class="mr-2" /> View
                  </CDropdownItem>
                  <CDropdownItem @click="duplicateForm(item)">
                    <CIcon name="cil-copy" class="mr-2" /> Duplicate
                  </CDropdownItem>
                  <CDropdownItem @click="shareForm(item)">
                    <CIcon name="cil-share" class="mr-2" /> Share
                  </CDropdownItem>
                  <CDropdownDivider />
                  <CDropdownItem @click="deleteForm(item)" class="text-danger">
                    <CIcon name="cil-trash" class="mr-2" /> Delete
                  </CDropdownItem>
                </CDropdown>
              </div>
            </td>
          </template>
        </CDataTable>
      </CCardBody>
    </CCard>

    <!-- Pagination -->
    <div class="pagination-wrapper d-flex justify-content-center mt-4">
      <CPagination
        :active-page.sync="currentPage"
        :pages="totalPages"
        align="center"
        size="sm"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MyForms',
  data() {
    return {
      searchQuery: '',
      selectedStatus: '',
      currentPage: 1,
      itemsPerPage: 7,
      fields: [
        { key: 'formName', label: 'Form Name', _style: 'width: 45%' },
        { key: 'status', label: 'Status', _style: 'width: 12%' },
        { key: 'responses', label: 'Responses', _style: 'width: 15%' },
        { key: 'lastModified', label: 'Last Modified', _style: 'width: 15%' },
        { key: 'actions', label: 'Actions', _style: 'width: 13%; text-align: right' }
      ],
      forms: [
        {
          id: 1,
          formName: 'Comprehensive Survey - All Question Types',
          description: 'A demonstration survey showcasing all available question types in the system',
          status: 'Open',
          responses: 6,
          lastModified: 'Dec 8, 2024'
        },
        {
          id: 2,
          formName: 'Customer Satisfaction Survey',
          description: 'Help us improve our services by sharing your feedback',
          status: 'Open',
          responses: 156,
          lastModified: 'Nov 20, 2024'
        },
        {
          id: 3,
          formName: 'Event Registration Form',
          description: 'Register for our upcoming webinar on December 15th',
          status: 'Open',
          responses: 89,
          lastModified: 'Nov 18, 2024'
        },
        {
          id: 4,
          formName: 'Employee Feedback Q4 2024',
          description: 'Internal feedback survey for team members',
          status: 'Draft',
          responses: 0,
          lastModified: 'Dec 2, 2024'
        },
        {
          id: 5,
          formName: 'Product Feature Request',
          description: 'Share your ideas for new features',
          status: 'Open',
          responses: 234,
          lastModified: 'Nov 25, 2024'
        },
        {
          id: 6,
          formName: 'Weekly Team Check-in',
          description: 'Quick pulse check for the team',
          status: 'Closed',
          responses: 12,
          lastModified: 'Nov 8, 2024'
        },
        {
          id: 7,
          formName: 'Conference Feedback 2024',
          description: 'Share your experience from the conference',
          status: 'Open',
          responses: 45,
          lastModified: 'Nov 30, 2024'
        }
      ]
    }
  },
  computed: {
    filteredForms() {
      let result = this.forms

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(form =>
          form.formName.toLowerCase().includes(query) ||
          form.description.toLowerCase().includes(query)
        )
      }

      // Filter by status
      if (this.selectedStatus) {
        result = result.filter(form => form.status === this.selectedStatus)
      }

      return result
    },
    totalPages() {
      return Math.ceil(this.filteredForms.length / this.itemsPerPage)
    }
  },
  methods: {
    getStatusBadgeColor(status) {
      switch (status) {
        case 'Open':
          return 'success'
        case 'Draft':
          return 'secondary'
        case 'Closed':
          return 'danger'
        default:
          return 'primary'
      }
    },
    getStatusDotClass(status) {
      switch (status) {
        case 'Open':
          return 'dot-success'
        case 'Draft':
          return 'dot-secondary'
        case 'Closed':
          return 'dot-danger'
        default:
          return 'dot-primary'
      }
    },
    createForm() {
      // Navigate to create form page
      this.$router.push({ name: 'CreateForm' })
    },
    editForm(item) {
      // Navigate to edit form page
      this.$router.push({ name: 'EditForm', params: { id: item.id } })
    },
    viewForm(item) {
      // Navigate to view form page
      this.$router.push({ name: 'ViewForm', params: { id: item.id } })
    },
    duplicateForm(item) {
      // Duplicate form logic
      console.log('Duplicate form:', item)
    },
    shareForm(item) {
      // Share form logic
      console.log('Share form:', item)
    },
    deleteForm(item) {
      // Delete form logic
      console.log('Delete form:', item)
    }
  }
}
</script>

<style scoped>
.my-forms-page {
  background-color: #fafafa;
  min-height: 100%;
  padding: 24px 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  line-height: 40px;
}

.page-subtitle {
  font-size: 16px;
  color: #525252;
  line-height: 24px;
}

/* Search Input */
.search-input-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #737373;
  z-index: 2;
}

.search-input {
  padding-left: 40px;
}

.search-input >>> input {
  background-color: rgba(229, 229, 229, 0.3);
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding-left: 40px;
  height: 36px;
}

.search-input >>> input:focus {
  background-color: #fff;
  border-color: #ba0c2f;
  box-shadow: 0 0 0 0.2rem rgba(186, 12, 47, 0.1);
}

/* Status Dropdown */
.status-dropdown {
  background-color: rgba(229, 229, 229, 0.3);
  border: 1px solid #e5e5e5;
  border-radius: 12px;
}

.status-dropdown >>> .dropdown-toggle {
  background-color: rgba(229, 229, 229, 0.3);
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  color: #333;
  height: 36px;
  padding: 0 13px;
}

/* Create Form Button */
.create-form-btn {
  background-color: #ba0c2f;
  border-color: #ba0c2f;
  border-radius: 12px;
  height: 36px;
  padding: 0 16px;
  font-weight: 500;
  font-size: 14px;
}

.create-form-btn:hover {
  background-color: #a00a29;
  border-color: #a00a29;
}

/* Forms Table Card */
.forms-table-card {
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.forms-table >>> table {
  margin-bottom: 0;
}

.forms-table >>> thead {
  background-color: #fafafa;
}

.forms-table >>> thead th {
  font-weight: 600;
  font-size: 14px;
  color: #404040;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.forms-table >>> tbody tr {
  border-bottom: 1px solid #f5f5f5;
}

.forms-table >>> tbody tr:last-child {
  border-bottom: none;
}

.forms-table >>> tbody td {
  padding: 20px 24px;
  vertical-align: middle;
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
  color: #1a1a1a;
  line-height: 20px;
}

.form-description {
  font-size: 14px;
  color: #525252;
  line-height: 22px;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.badge-success {
  background-color: #ecfdf5;
  color: #007a55;
  border: 1px solid #a4f4cf;
}

.status-badge.badge-secondary {
  background-color: #f5f5f5;
  color: #404040;
  border: 1px solid #e5e5e5;
}

.status-badge.badge-danger {
  background-color: #fef2f2;
  color: #c10007;
  border: 1px solid #ffc9c9;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot.dot-success {
  background-color: #00bc7d;
}

.status-dot.dot-secondary {
  background-color: #a3a3a3;
}

.status-dot.dot-danger {
  background-color: #fb2c36;
}

/* Responses Cell */
.responses-cell {
  gap: 8px;
}

.responses-icon {
  width: 32px;
  height: 32px;
  background-color: #fef2f2;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ba0c2f;
}

.responses-info {
  display: flex;
  flex-direction: column;
}

.responses-count {
  font-weight: 600;
  font-size: 14px;
  color: #1a1a1a;
  line-height: 20px;
}

.responses-label {
  font-size: 12px;
  color: #737373;
  line-height: 16px;
}

/* Last Modified Cell */
.last-modified-cell {
  font-size: 14px;
  color: #525252;
}

/* Actions Cell */
.actions-cell {
  text-align: right;
}

.action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  opacity: 0.6;
}

.action-btn:hover {
  opacity: 1;
  background-color: #f5f5f5;
}

.action-dropdown >>> .dropdown-toggle {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  opacity: 0.6;
}

.action-dropdown >>> .dropdown-toggle:hover {
  opacity: 1;
  background-color: #f5f5f5;
}

.action-dropdown >>> .dropdown-toggle::after {
  display: none;
}

/* Pagination */
.pagination-wrapper {
  padding: 16px 0;
}

.pagination-wrapper >>> .pagination {
  gap: 4px;
}

.pagination-wrapper >>> .page-item .page-link {
  border-radius: 12px;
  border: none;
  color: #333;
  font-weight: 500;
  font-size: 14px;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-wrapper >>> .page-item.active .page-link {
  background-color: rgba(229, 229, 229, 0.3);
  border: 1px solid #e5e5e5;
  color: #0a0a0a;
}

.pagination-wrapper >>> .page-item.disabled .page-link {
  opacity: 0.5;
}

/* Gap utility */
.gap-2 {
  gap: 8px;
}
</style>
