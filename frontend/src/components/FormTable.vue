<template>
  <div class="table-wrapper">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spinner pi-spin"></i>
      </div>
      <p class="loading-text">Loading forms...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <i class="pi pi-exclamation-circle"></i>
      </div>
      <p class="error-text">{{ error }}</p>
      <button class="retry-button" @click="$emit('retry')">
        <i class="pi pi-refresh"></i>
        <span>Retry</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="forms.length === 0" class="empty-container">
      <div class="empty-icon">
        <i class="pi pi-inbox"></i>
      </div>
      <p class="empty-text">No forms found</p>
      <p class="empty-subtext">{{ emptyMessage }}</p>
    </div>

    <!-- Table with Data -->
    <div v-else class="table-container">
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
            v-for="form in forms" 
            :key="form.id" 
            class="table-row data-row"
            @click="$emit('form-click', form.id)"
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
              <slot name="actions" :form="form" :toggle-dropdown="() => $emit('toggle-dropdown', form.id)"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  forms: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  emptyMessage: {
    type: String,
    default: 'No forms available'
  }
})

defineEmits(['form-click', 'toggle-dropdown', 'retry'])
</script>

<style scoped>
/* Table Wrapper */
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
  color: #333333;
}

/* Error State */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
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
  grid-template-columns: 3fr 1fr 1.2fr 1.3fr 1fr;
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
  grid-template-columns: 3fr 1fr 1.2fr 1.3fr 1fr;
  border-bottom: 1px solid #F5F5F5;
  min-height: 87px;
  cursor: pointer;
  transition: background 0.2s;
}

.data-row:hover {
  background: #FAFAFA;
}

.data-row:last-child {
  border-bottom: none;
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

.status-closed,
.status-close {
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

.status-closed .status-dot,
.status-close .status-dot {
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

.status-closed .status-text,
.status-close .status-text {
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

/* Responsive */
@media (max-width: 1200px) {
  .header-row,
  .data-row {
    grid-template-columns: 2fr 120px 140px 150px 120px;
  }
}

@media (max-width: 1024px) {
  .header-row,
  .data-row {
    grid-template-columns: 2fr 100px 120px 80px;
  }

  .modified-head,
  .modified-cell {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-row,
  .data-row {
    grid-template-columns: 1fr 80px;
  }

  .status-head,
  .status-cell,
  .responses-head,
  .responses-cell {
    display: none;
  }

  .form-description {
    max-width: 100%;
  }

  .table-cell {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .table-wrapper {
    min-height: auto;
    border-radius: 12px;
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
    padding-top: 8px;
    border-top: 1px solid #F5F5F5;
  }

  .form-info {
    gap: 6px;
  }

  .form-title {
    font-size: 15px;
  }

  .form-description {
    font-size: 13px;
    white-space: normal;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    display: -webkit-box;
    overflow: hidden;
  }

  .loading-container,
  .error-container,
  .empty-container {
    padding: 60px 20px;
    min-height: 300px;
  }

  .loading-spinner i,
  .error-icon i,
  .empty-icon i {
    font-size: 36px;
  }

  .loading-text,
  .error-text,
  .empty-text {
    font-size: 14px;
  }

  .empty-subtext {
    font-size: 13px;
  }
}
</style>
