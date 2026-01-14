<template>
  <div>
    <!-- View Mode Toggle -->
    <CCard class="mb-4">
      <CCardBody>
        <CRow class="align-items-center">
          <CCol sm="6">
            <h5 class="mb-0">
              <CIcon name="cil-chart-pie" class="mr-2" />
              {{ totalResponses }} Responses
            </h5>
          </CCol>
          <CCol sm="6" class="text-right">
            <CButtonGroup>
              <CButton 
                :color="viewMode === 'summary' ? 'primary' : 'secondary'"
                @click="$emit('update:viewMode', 'summary')"
              >
                Summary
              </CButton>
              <CButton 
                :color="viewMode === 'individual' ? 'primary' : 'secondary'"
                @click="$emit('update:viewMode', 'individual')"
              >
                Individual
              </CButton>
            </CButtonGroup>
            
            <CDropdown class="ml-2" color="secondary">
              <CDropdownToggle>
                <CIcon name="cil-cloud-download" /> Export
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem @click="$emit('export', 'csv')">Export as CSV</CDropdownItem>
                <CDropdownItem @click="$emit('export', 'xlsx')">Export as Excel</CDropdownItem>
                <CDropdownItem @click="$emit('export', 'json')">Export as JSON</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <!-- Empty State -->
    <div v-if="totalResponses === 0" class="text-center py-5">
      <CIcon name="cil-inbox" size="4xl" class="text-muted mb-3" />
      <h4 class="text-muted">No responses yet</h4>
      <p class="text-muted">Share your form to start collecting responses</p>
    </div>

    <!-- Summary View -->
    <div v-else-if="viewMode === 'summary'">
      <CCard v-for="(question, index) in questions" :key="question.id || question._id" class="mb-4">
        <CCardHeader>
          <strong>{{ index + 1 }}. {{ question.title || 'Untitled Question' }}</strong>
          <CBadge :color="getQuestionTypeColor(question.type)" class="ml-2">
            {{ formatQuestionType(question.type) }}
          </CBadge>
        </CCardHeader>
        <CCardBody>
          <div v-if="getQuestionResponseCount(question) === 0" class="text-muted">
            No responses for this question
          </div>
          <div v-else>
            <p class="text-muted mb-2">{{ getQuestionResponseCount(question) }} responses</p>
            
            <!-- Choice/Checkbox Summary -->
            <div v-if="['multiple-choice', 'checkbox', 'dropdown'].includes(question.type)">
              <CProgress 
                v-for="opt in getOptionStats(question)" 
                :key="opt.label"
                class="mb-2"
              >
                <CProgressBar 
                  :value="opt.percentage" 
                  :color="opt.color"
                >
                  {{ opt.label }} ({{ opt.count }} - {{ opt.percentage }}%)
                </CProgressBar>
              </CProgress>
            </div>
            
            <!-- Rating Summary -->
            <div v-else-if="question.type === 'rating'">
              <div class="d-flex align-items-center mb-2">
                <strong class="mr-2">Average:</strong>
                <span>{{ getAverageRating(question) }} / {{ question.maxRating || 5 }}</span>
              </div>
            </div>
            
            <!-- Text Responses -->
            <div v-else>
              <CListGroup>
                <CListGroupItem 
                  v-for="(resp, i) in getTextResponses(question).slice(0, 5)" 
                  :key="i"
                >
                  {{ resp }}
                </CListGroupItem>
              </CListGroup>
              <p v-if="getTextResponses(question).length > 5" class="text-muted mt-2">
                And {{ getTextResponses(question).length - 5 }} more...
              </p>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <!-- Individual View -->
    <div v-else>
      <CCard v-for="(response, index) in responses" :key="response._id" class="mb-3">
        <CCardHeader class="d-flex justify-content-between">
          <span>
            <CBadge color="primary" class="mr-2">#{{ index + 1 }}</CBadge>
            {{ getResponderEmail(response) }}
          </span>
          <small class="text-muted">{{ formatDate(response.submittedAt) }}</small>
        </CCardHeader>
        <CCardBody>
          <div v-for="question in questions" :key="question.id || question._id" class="mb-3">
            <strong>{{ question.title }}</strong>
            <p class="mb-0">{{ getAnswerForQuestion(response, question) || '-' }}</p>
          </div>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResponsesTab',
  
  props: {
    questions: { type: Array, required: true },
    totalResponses: { type: Number, default: 0 },
    responses: { type: Array, default: () => [] },
    viewMode: { type: String, default: 'summary' }
  },
  
  methods: {
    formatQuestionType(type) {
      const types = {
        'short-answer': 'Short Answer',
        'paragraph': 'Paragraph',
        'multiple-choice': 'Multiple Choice',
        'checkbox': 'Checkbox',
        'dropdown': 'Dropdown',
        'rating': 'Rating',
        'file-upload': 'File Upload'
      }
      return types[type] || type
    },
    
    getQuestionTypeColor(type) {
      const colors = {
        'short-answer': 'info',
        'paragraph': 'info',
        'multiple-choice': 'success',
        'checkbox': 'success',
        'dropdown': 'success',
        'rating': 'warning',
        'file-upload': 'primary'
      }
      return colors[type] || 'secondary'
    },
    
    getResponderEmail(response) {
      if (response && response.responder && response.responder.email) {
        return response.responder.email
      }
      return 'Anonymous'
    },
    
    getQuestionResponseCount(question) {
      return this.responses.filter(function(r) {
        if (!r.answers) return false
        return r.answers.some(function(a) {
          return a.question && a.question._id === (question._id || question.id)
        })
      }).length
    },
    
    getOptionStats(question) {
      const counts = {}
      const colors = ['success', 'info', 'warning', 'danger', 'primary']
      
      // Initialize counts
      if (question.options) {
        question.options.forEach(function(opt) {
          counts[opt.text] = 0
        })
      }
      
      // Count responses
      const self = this
      this.responses.forEach(function(resp) {
        if (!resp.answers) return
        const answer = resp.answers.find(function(a) {
          return a.question && a.question._id === (question._id || question.id)
        })
        if (answer && answer.response) {
          const values = Array.isArray(answer.response) ? answer.response : [answer.response]
          values.forEach(function(val) {
            if (counts[val] !== undefined) {
              counts[val]++
            }
          })
        }
      })
      
      const self2 = this
      return Object.entries(counts).map(function(entry, index) {
        return {
          label: entry[0],
          count: entry[1],
          percentage: self2.totalResponses > 0 ? Math.round((entry[1] / self2.totalResponses) * 100) : 0,
          color: colors[index % colors.length]
        }
      })
    },
    
    getAverageRating(question) {
      let total = 0
      let count = 0
      
      this.responses.forEach(function(resp) {
        if (!resp.answers) return
        const answer = resp.answers.find(function(a) {
          return a.question && a.question._id === (question._id || question.id)
        })
        if (answer && answer.response) {
          const rating = parseInt(answer.response)
          if (!isNaN(rating)) {
            total += rating
            count++
          }
        }
      })
      
      return count > 0 ? (total / count).toFixed(1) : 0
    },
    
    getTextResponses(question) {
      const texts = []
      
      this.responses.forEach(function(resp) {
        if (!resp.answers) return
        const answer = resp.answers.find(function(a) {
          return a.question && a.question._id === (question._id || question.id)
        })
        if (answer && answer.response) {
          texts.push(String(answer.response))
        }
      })
      
      return texts
    },
    
    getAnswerForQuestion(response, question) {
      if (!response.answers) return null
      const answer = response.answers.find(function(a) {
        return a.question && a.question._id === (question._id || question.id)
      })
      if (!answer) return null
      
      if (Array.isArray(answer.response)) {
        return answer.response.join(', ')
      }
      return answer.response
    },
    
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>
