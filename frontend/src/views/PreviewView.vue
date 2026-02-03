<template>
	<!-- Top actions: back to builder -->
	<div>
		<div class="top-actions">
			<router-link :to="`/form-builder/${resolvedFormId}`" class="action-link">
				<ArrowLeftIcon />
				Back to Forms
			</router-link>
		</div>
		<!-- Main preview component -->
		<QuestionsPreview :formTitle="formTitle" :formDescription="formDescription" :formStatus="formStatus"
			:questions="questions" />
	</div>
</template>

<script>
import QuestionsPreview from '@/components/preview/QuestionsPreview.vue'
import { ArrowLeftIcon } from '@/components/icons'

export default {
	name: 'PreviewView',
	components: {
		QuestionsPreview,
		ArrowLeftIcon
	},
	props: {
		formId: {
			type: String,
			default: ''
		}
	},
	data() {
		return {
			formTitle: 'Untitled Form',
			formDescription: '',
			questions: [],
			formStatus: 'draft',
			API_BASE_URL: import.meta.env.VITE_API_URL
		}
	},
	computed: {
		resolvedFormId() {
			return this.formId || this.$route.params.id
		}
	},
	created() {
		this.onInit()
	},
	mounted() {

	},
	beforeDestroy() {

	},
	methods: {
		onInit() {
			this.fetchForm()
		},
		mapQuestionTypeFromBackend(backendType) {
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
		},
		transformQuestionsFromAPI(apiQuestions) {
			return apiQuestions.map(q => ({
				_id: q._id,
				id: q._id,
				type: this.mapQuestionTypeFromBackend(q.type),
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
		},
		async fetchForm() {
			if (!this.resolvedFormId) return
			try {
				const res = await fetch(`${this.API_BASE_URL}/form/id?_id=${this.resolvedFormId}`)
				const data = await res.json()
				if (data?.data) {
					// Set form meta and questions from API response
					this.formTitle = data.data.title?.[0]?.value || 'Untitled Form'
					this.formDescription = data.data.description?.[0]?.value || ''
					this.questions = data.data.questions?.length > 0
						? this.transformQuestionsFromAPI(data.data.questions)
						: []
					this.formStatus = data.data.status || 'draft'
				}
			} catch (e) {
				console.error('Error fetching form data:', e)
			}
		}
	}
}
</script>


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
	color: var(--text-primary);
	font-family: 'Inter', sans-serif;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	text-decoration: none;
	transition: background-color 0.2s;
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
	background: var(--primary);
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