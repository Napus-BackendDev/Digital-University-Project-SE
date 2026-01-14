<template>
  <div>
    <!-- General Settings -->
    <CCard class="mb-4">
      <CCardHeader>
        <strong><CIcon name="cil-settings" class="mr-2" />General Settings</strong>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="12" class="mb-3">
            <label class="form-label font-weight-bold">Form Title</label>
            <CInput 
              :value="settings.title"
              @input="updateSetting('title', $event)"
              placeholder="Enter form title"
            />
          </CCol>
          
          <CCol md="12" class="mb-3">
            <label class="form-label font-weight-bold">Description</label>
            <CTextarea
              :value="settings.description"
              @input="updateSetting('description', $event)"
              placeholder="Enter form description"
              rows="3"
            />
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Response Settings -->
    <CCard class="mb-4">
      <CCardHeader>
        <strong><CIcon name="cil-envelope-closed" class="mr-2" />Response Settings</strong>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Accept Responses</label>
              <CSwitch
                color="primary"
                :checked="settings.isAcceptingResponses"
                @update:checked="updateSetting('isAcceptingResponses', $event)"
              />
            </div>
            <small class="text-muted">Turn off to stop collecting new responses</small>
          </CCol>
          
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Limit to 1 Response</label>
              <CSwitch
                color="primary"
                :checked="settings.limitOneResponse"
                @update:checked="updateSetting('limitOneResponse', $event)"
              />
            </div>
            <small class="text-muted">Limit each person to one response</small>
          </CCol>
          
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Collect Email Addresses</label>
              <CSwitch
                color="primary"
                :checked="settings.collectEmails"
                @update:checked="updateSetting('collectEmails', $event)"
              />
            </div>
            <small class="text-muted">Require respondent email addresses</small>
          </CCol>
          
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Send Copy to Respondent</label>
              <CSwitch
                color="primary"
                :checked="settings.sendCopyToRespondent"
                @update:checked="updateSetting('sendCopyToRespondent', $event)"
              />
            </div>
            <small class="text-muted">Send a copy of their response</small>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Advanced Settings -->
    <CCard class="mb-4">
      <CCardHeader>
        <strong><CIcon name="cil-cog" class="mr-2" />Advanced Settings</strong>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Show Progress Bar</label>
              <CSwitch
                color="primary"
                :checked="settings.showProgressBar"
                @update:checked="updateSetting('showProgressBar', $event)"
              />
            </div>
            <small class="text-muted">Display progress bar at top of form</small>
          </CCol>
          
          <CCol md="6" class="mb-3">
            <div class="d-flex justify-content-between align-items-center">
              <label class="form-label mb-0 font-weight-bold">Shuffle Question Order</label>
              <CSwitch
                color="primary"
                :checked="settings.shuffleQuestions"
                @update:checked="updateSetting('shuffleQuestions', $event)"
              />
            </div>
            <small class="text-muted">Randomize question order for each respondent</small>
          </CCol>
          
          <CCol md="12" class="mb-3">
            <label class="form-label font-weight-bold">Confirmation Message</label>
            <CTextarea
              :value="settings.confirmationMessage"
              @input="updateSetting('confirmationMessage', $event)"
              placeholder="Message shown after form submission"
              rows="2"
            />
          </CCol>
          
          <CCol md="6" class="mb-3">
            <label class="form-label font-weight-bold">Start Date</label>
            <CInput 
              type="datetime-local"
              :value="formatDateTime(settings.startDate)"
              @input="updateSetting('startDate', $event)"
            />
            <small class="text-muted">Form will accept responses after this date</small>
          </CCol>
          
          <CCol md="6" class="mb-3">
            <label class="form-label font-weight-bold">End Date</label>
            <CInput 
              type="datetime-local"
              :value="formatDateTime(settings.endDate)"
              @input="updateSetting('endDate', $event)"
            />
            <small class="text-muted">Form will stop accepting responses after this date</small>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Sharing -->
    <CCard class="mb-4">
      <CCardHeader>
        <strong><CIcon name="cil-share" class="mr-2" />Sharing</strong>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="12" class="mb-3">
            <label class="form-label font-weight-bold">Form URL</label>
            <CInputGroup>
              <CInput 
                :value="formUrl" 
                readonly
              />
              <CInputGroupAppend>
                <CButton color="primary" @click="copyUrl">
                  <CIcon name="cil-copy" /> Copy
                </CButton>
              </CInputGroupAppend>
            </CInputGroup>
          </CCol>
          
          <CCol md="12">
            <label class="form-label font-weight-bold">Share via</label>
            <div>
              <CButton color="primary" class="mr-2" @click="$emit('share', 'email')">
                <CIcon name="cil-envelope-closed" /> Email
              </CButton>
              <CButton color="info" class="mr-2" @click="$emit('share', 'link')">
                <CIcon name="cil-link" /> Copy Link
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Danger Zone -->
    <CCard border-color="danger">
      <CCardHeader class="bg-danger text-white">
        <strong><CIcon name="cil-warning" class="mr-2" />Danger Zone</strong>
      </CCardHeader>
      <CCardBody>
        <CRow>
          <CCol md="6">
            <h6>Delete All Responses</h6>
            <p class="text-muted mb-2">This action cannot be undone</p>
            <CButton color="danger" variant="outline" @click="$emit('delete-responses')">
              <CIcon name="cil-trash" /> Delete All Responses
            </CButton>
          </CCol>
          <CCol md="6">
            <h6>Delete Form</h6>
            <p class="text-muted mb-2">Permanently delete this form and all data</p>
            <CButton color="danger" @click="$emit('delete-form')">
              <CIcon name="cil-trash" /> Delete Form
            </CButton>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
export default {
  name: 'SettingsTab',
  
  props: {
    settings: { 
      type: Object, 
      required: true,
      default: () => ({
        title: '',
        description: '',
        isAcceptingResponses: true,
        limitOneResponse: false,
        collectEmails: false,
        sendCopyToRespondent: false,
        showProgressBar: false,
        shuffleQuestions: false,
        confirmationMessage: '',
        startDate: null,
        endDate: null
      })
    },
    formId: {
      type: String,
      default: ''
    }
  },
  
  computed: {
    formUrl() {
      if (!this.formId) return ''
      const baseUrl = window.location.origin
      return `${baseUrl}/form/${this.formId}`
    }
  },
  
  methods: {
    updateSetting(key, value) {
      const updatedSettings = { ...this.settings }
      updatedSettings[key] = value
      this.$emit('update:settings', updatedSettings)
    },
    
    formatDateTime(dateStr) {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        return date.toISOString().slice(0, 16)
      } catch (e) {
        return ''
      }
    },
    
    copyUrl() {
      if (navigator.clipboard && this.formUrl) {
        navigator.clipboard.writeText(this.formUrl)
          .then(() => {
            this.$emit('url-copied')
          })
          .catch(err => {
            console.error('Failed to copy URL:', err)
          })
      }
    }
  }
}
</script>

<style scoped>
.form-label {
  margin-bottom: 0.5rem;
  display: block;
}
</style>
