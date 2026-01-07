
<script setup>
// --- Import dependencies ---
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QuestionsPreview from '@/components/preview/QuestionsPreview.vue'
import { ArrowLeftIcon } from '@/components/icons'

// --- Define component props ---
// formId: optional, fallback to route param
const props = defineProps({
	formId: {
		type: String,
		default: ''
	}
})
// --- Routing and formId resolution ---
const route = useRoute()
const formId = props.formId || route.params.id

// --- Form state ---
const formTitle = ref('Untitled Form')
const formDescription = ref('')
const questions = ref([])
const formStatus = ref('draft')

// --- API base URL ---
const API_BASE_URL = import.meta.env.VITE_API_URL

// --- Helper: Map backend question type to frontend type ---
function mapQuestionTypeFromBackend(backendType) {
	const typeMap = {
		'short': 'short-answer',
		'paragraph': 'paragraph',
		'choices': 'multiple-choice',
		'checkbox': 'checkbox',
		'rating': 'rating',
		'file': 'file-upload',
		'title': 'title-description',
		'image': 'image',
		'divider': 'section-divider'
	}
	return typeMap[backendType] || backendType
}

// --- Helper: Transform questions from API format to frontend format ---
function transformQuestionsFromAPI(apiQuestions) {
	return apiQuestions.map(q => ({
		_id: q._id,
		id: q._id,
		type: mapQuestionTypeFromBackend(q.type),
		title: q.title?.[0]?.value || '',
		required: q.required || false,
		options: q.config?.options || [],
		maxRating: q.config?.maxRating || 5,
		allowSpecificTypes: q.config?.allowSpecificTypes || false,
		allowedFileTypes: q.config?.allowedFileTypes || [],
		maxFiles: q.config?.maxFiles || 1,
		maxSize: q.config?.maxSize || 10,
		imageUrl: q.config?.imageUrl || '',
		caption: q.config?.caption || ''
	}))
}

// --- Fetch form data from API ---
async function fetchForm() {
	if (!formId) return
	try {
		const res = await fetch(`${API_BASE_URL}/form/id?_id=${formId}`)
		const data = await res.json()
		if (data?.data) {
			// Set form meta and questions from API response
			formTitle.value = data.data.title?.[0]?.value || 'Untitled Form'
			formDescription.value = data.data.description?.[0]?.value || ''
			questions.value = data.data.questions?.length > 0 
				? transformQuestionsFromAPI(data.data.questions)
				: []
			formStatus.value = data.data.status || 'draft'
		}
	} catch (e) {
		console.error('Error fetching form data:', e)
	}
}

// --- Fetch on mount ---
onMounted(fetchForm)
</script>
<template>
	<div class="response">
		<!-- Main Content -->
		<main class="main-content">
			<!-- Back Button -->
			<router-link :to="`/form-builder/${formId}`" class="back-btn">
				<ArrowLeftIcon />
				<span>Back to Forms</span>
			</router-link>

			<!-- Form Container -->
			<div class="form-container">
				<!-- Main preview component -->
				<QuestionsPreview
					:formTitle="formTitle"
					:formDescription="formDescription"
					:formStatus="formStatus"
					:questions="questions"
				/>
			</div>
		</main>
	</div>
</template>

<style scoped>
/* ==================== MAIN CONTAINER ==================== */
.response {
  min-height: 100vh;
  background: #F5F5F5;
  font-family: 'Inter', sans-serif;
  padding-top: 65px;
}

/* ==================== MAIN CONTENT ==================== */
.main-content {
  width: 100%;
  min-height: calc(100vh - 65px);
  max-width: 1216px;
  margin: 0 auto;
  padding: 32px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== ICON SIZING ==================== */
.back-btn svg {
  width: 16px;
  height: 16px;
}

/* ==================== BACK BUTTON ==================== */
.back-btn {
  width: 151px;
  height: 36px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.15px;
  color: #333333;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.back-btn:hover {
  background: #F5F5F5;
}

/* ==================== FORM CONTAINER ==================== */
.form-container {
  width: 100%;
  max-width: 704px;
  display: flex;
  flex-direction: column;
  padding: 33px;
  gap: 32px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-sizing: border-box;
  align-self: center;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .main-content {
    padding: 16px 8px;
  }
  
  .form-container {
    padding: 24px 16px;
    margin: 0 8px;
  }
}
</style>