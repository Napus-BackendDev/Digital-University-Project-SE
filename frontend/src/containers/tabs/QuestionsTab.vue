<template>
  <div>
    <!-- Form Header -->
    <CCard class="mb-4">
      <CCardBody>
        <CRow>
          <CCol>
            <CInput
              :value="formTitle"
              @input="$emit('update:formTitle', $event)"
              placeholder="Form Title"
              size="lg"
              class="mb-3"
            />
            <CTextarea
              :value="formDescription"
              @input="$emit('update:formDescription', $event)"
              placeholder="Form Description"
              rows="2"
            />
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Status Banner -->
    <CAlert 
      :color="statusColor" 
      class="mb-4"
    >
      <strong>{{ statusTitle }}</strong>
      <p class="mb-0">{{ statusMessage }}</p>
      <div v-if="formStatus !== 'close'" class="mt-2">
        <CButton color="secondary" size="sm" @click="$emit('copy-url')" class="mr-2">
          <CIcon name="cil-copy" /> Copy URL
        </CButton>
        <CButton color="secondary" size="sm" @click="$emit('test-form')">
          <CIcon name="cil-media-play" /> Preview
        </CButton>
      </div>
    </CAlert>

    <!-- Questions List -->
    <div v-if="questions.length === 0" class="text-center py-5">
      <CIcon name="cil-file" size="3xl" class="text-muted mb-3" />
      <h4 class="text-muted">No questions yet</h4>
      <p class="text-muted">Click below to add your first question</p>
    </div>

    <CCard 
      v-for="(question, index) in questions" 
      :key="question.id || question._id"
      class="mb-3"
    >
      <CCardHeader class="d-flex justify-content-between align-items-center">
        <div>
          <CBadge color="info" class="mr-2">{{ index + 1 }}</CBadge>
          <strong>{{ question.title || 'Untitled Question' }}</strong>
          <CBadge v-if="question.required" color="danger" class="ml-2">Required</CBadge>
        </div>
        <div>
          <CButton 
            color="primary" 
            size="sm" 
            variant="ghost"
            @click="$emit('toggle-question', question.id || question._id)"
          >
            <CIcon :name="expandedQuestionId === (question.id || question._id) ? 'cil-chevron-top' : 'cil-chevron-bottom'" />
          </CButton>
          <CButton 
            color="danger" 
            size="sm" 
            variant="ghost"
            @click="$emit('delete-question', question.id || question._id)"
          >
            <CIcon name="cil-trash" />
          </CButton>
        </div>
      </CCardHeader>
      
      <CCollapse :show="expandedQuestionId === (question.id || question._id)">
        <CCardBody>
          <CRow>
            <CCol md="8">
              <CInput
                :value="question.title"
                @input="$emit('update-question', { questionId: question.id || question._id, field: 'title', value: $event })"
                placeholder="Question title"
                label="Question"
              />
            </CCol>
            <CCol md="4">
              <label class="form-label">Type</label>
              <CSelect
                :value="question.type"
                @change="$emit('update-question', { questionId: question.id || question._id, field: 'type', value: $event.target.value })"
                :options="questionTypes"
              />
            </CCol>
          </CRow>
          
          <!-- Options for choice types -->
          <div v-if="['multiple-choice', 'checkbox', 'dropdown'].includes(question.type)" class="mt-3">
            <label class="form-label">Options</label>
            <div v-for="opt in question.options" :key="opt.id" class="d-flex mb-2">
              <CInput
                :value="opt.text"
                @input="updateOptionText(question, opt.id, $event)"
                placeholder="Option text"
                class="flex-grow-1 mr-2"
              />
              <CButton 
                color="danger" 
                size="sm"
                @click="$emit('remove-option', { questionId: question.id || question._id, optionId: opt.id })"
              >
                <CIcon name="cil-x" />
              </CButton>
            </div>
            <CButton 
              color="primary" 
              size="sm"
              @click="$emit('add-option', question.id || question._id)"
            >
              <CIcon name="cil-plus" /> Add Option
            </CButton>
          </div>

          <div class="mt-3">
            <CSwitch
              color="primary"
              :checked="question.required"
              @update:checked="$emit('update-question', { questionId: question.id || question._id, field: 'required', value: $event })"
              label="Required"
              labelOn="Yes"
              labelOff="No"
            />
            <span class="ml-2">Required</span>
          </div>
        </CCardBody>
      </CCollapse>
    </CCard>

    <!-- Add Question Button -->
    <CCard class="text-center">
      <CCardBody>
        <CDropdown color="primary">
          <CDropdownToggle>
            <CIcon name="cil-plus" /> Add Question
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem 
              v-for="type in questionTypesList" 
              :key="type.id"
              @click="$emit('add-question', type.id)"
            >
              {{ type.label }}
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </CCardBody>
    </CCard>
  </div>
</template>

<script>
export default {
  name: 'QuestionsTab',
  
  props: {
    formTitle: { type: String, required: true },
    formDescription: { type: String, default: '' },
    formUrl: { type: String, default: '' },
    formStatus: { type: String, default: 'draft' },
    questions: { type: Array, required: true },
    expandedQuestionId: { type: [Number, String], default: null }
  },
  
  data() {
    return {
      questionTypes: [
        { value: 'short-answer', label: 'Short Answer' },
        { value: 'paragraph', label: 'Paragraph' },
        { value: 'multiple-choice', label: 'Multiple Choice' },
        { value: 'checkbox', label: 'Checkbox' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'rating', label: 'Rating' },
        { value: 'file-upload', label: 'File Upload' }
      ],
      questionTypesList: [
        { id: 'short-answer', label: 'Short Answer' },
        { id: 'paragraph', label: 'Paragraph' },
        { id: 'multiple-choice', label: 'Multiple Choice' },
        { id: 'checkbox', label: 'Checkbox' },
        { id: 'dropdown', label: 'Dropdown' },
        { id: 'rating', label: 'Rating' },
        { id: 'file-upload', label: 'File Upload' }
      ]
    }
  },
  
  computed: {
    statusColor() {
      const colors = {
        'open': 'success',
        'close': 'warning',
        'draft': 'secondary',
        'auto': 'info'
      }
      return colors[this.formStatus] || 'secondary'
    },
    
    statusTitle() {
      const titles = {
        'open': 'Form is Live & Public',
        'close': 'Form is Closed',
        'draft': 'Draft Mode',
        'auto': 'Scheduled'
      }
      return titles[this.formStatus] || 'Unknown Status'
    },
    
    statusMessage() {
      const messages = {
        'open': 'Your form is published and accepting responses.',
        'close': 'This form is no longer accepting responses.',
        'draft': 'This form is not published yet. Change status to "Open" to start collecting responses.',
        'auto': 'This form will automatically open and close based on the schedule.'
      }
      return messages[this.formStatus] || ''
    }
  },
  
  methods: {
    updateOptionText(question, optionId, value) {
      const options = question.options.map(opt => 
        opt.id === optionId ? { ...opt, text: value } : opt
      )
      this.$emit('update-question', { 
        questionId: question.id || question._id, 
        field: 'options', 
        value: options 
      })
    }
  }
}
</script>

<style scoped>
.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  display: block;
}
</style>
