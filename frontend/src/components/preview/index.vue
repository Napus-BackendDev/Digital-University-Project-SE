<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QuestionsPreview from './QuestionsPreview.vue'
import { ArrowLeftIcon } from '@/components/icons'

const props = defineProps({
	formId: {
		type: String,
		default: ''
	}
})
const route = useRoute()
const formId = props.formId || route.params.id

const formTitle = ref('Untitled Form')
const formDescription = ref('')
const questions = ref([])
const formStatus = ref('draft')

const API_BASE_URL = import.meta.env.VITE_API_URL

async function fetchForm() {
	if (!formId) return
	try {
		const res = await fetch(`${API_BASE_URL}/form/id?_id=${formId}`)
		const data = await res.json()
		if (data?.data) {
			formTitle.value = data.data.title?.[0]?.value || 'Untitled Form'
			formDescription.value = data.data.description || ''
			questions.value = data.data.questions || []
			formStatus.value = data.data.status || 'draft'
		}
	} catch (e) {
		console.error('Error fetching form data:', e)
	}
}

onMounted(fetchForm)
</script>
<template>
	
	<div>
		<div class="top-actions">
      <router-link :to="`/form-builder/${formId}`" class="action-link">
        <ArrowLeftIcon />
        Back to Forms
      </router-link>
    </div>
		<QuestionsPreview
			:formTitle="formTitle"
			:formDescription="formDescription"
			:formStatus="formStatus"
			:questions="questions"
		/>
	</div>
</template>

<style scoped>


/* Top actions bar and preview-footer styles remain for navigation and submit button */
.top-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #333;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.2s;
}

.action-link:hover {
  background-color: #f0f0f0;
}

.action-link svg {
  width: 16px;
  height: 16px;
}

.form-content {
  max-width: 960px;
  margin: 0 auto;
}
.preview-footer {
	display: flex;
	justify-content: flex-end;
	margin-top: 32px;
}
.preview-submit-btn {
	background: #6366f1;
	color: #fff;
	border: none;
	border-radius: 8px;
	padding: 12px 32px;
	font-size: 1.1rem;
	font-weight: 600;
	cursor: not-allowed;
	opacity: 0.7;
}
</style>
