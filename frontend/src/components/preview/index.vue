(*)<script setup>
import { defineProps } from 'vue'

const props = defineProps({
	formTitle: {
		type: String,
		default: 'Untitled Form'
	},
	formDescription: {
		type: String,
		default: ''
	},
	questions: {
		type: Array,
		default: () => []
	}
})
</script>


<template>
	<div class="preview-form">
		<div class="form-header-section">
			<h2 class="preview-title">{{ formTitle }}</h2>
			<p class="preview-description" v-if="formDescription">{{ formDescription }}</p>
		</div>
		<div class="questions-section">
			<div class="questions-list">
				<div v-if="questions.length === 0" class="empty-questions">
					<h3>ไม่มีคำถามในฟอร์ม</h3>
					<p>เพิ่มคำถามในโหมดแก้ไขเพื่อดูตัวอย่าง</p>
				</div>
				<div v-else>
					<div v-for="(q, idx) in questions" :key="q._id || idx" class="preview-question-card">
						<div class="question-title-row">
							<span class="question-number">{{ idx + 1 }}.</span>
							<span class="question-title">{{ q.title?.[0]?.value || 'Untitled Question' }}</span>
							<span v-if="q.required" class="required-badge">*</span>
						</div>
						<div class="question-preview-body">
							<template v-if="q.type === 'short_answer'">
								<input type="text" class="preview-input" disabled placeholder="Short answer" />
							</template>
							<template v-else-if="q.type === 'paragraph'">
								<textarea class="preview-input" disabled placeholder="Paragraph answer"></textarea>
							</template>
							<template v-else-if="q.type === 'multiple_choice'">
								<div class="preview-options">
									<label v-for="(opt, oidx) in q.options || []" :key="oidx" class="preview-option">
										<input type="radio" :name="'q' + idx" disabled />
										<span>{{ opt.value }}</span>
									</label>
								</div>
							</template>
							<template v-else-if="q.type === 'checkbox'">
								<div class="preview-options">
									<label v-for="(opt, oidx) in q.options || []" :key="oidx" class="preview-option">
										<input type="checkbox" disabled />
										<span>{{ opt.value }}</span>
									</label>
								</div>
							</template>
							<!-- เพิ่มประเภทอื่น ๆ ได้ตามต้องการ -->
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Preview Form Styles (คล้าย QuestionsTab แต่เน้นอ่านอย่างเดียว) */
.preview-form {
	background: #fff;
	border-radius: 16px;
	box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	padding: 32px;
	max-width: 650px;
	margin: 0 auto;
}
.form-header-section {
	margin-bottom: 32px;
	text-align: left;
}
.preview-title {
	font-size: 2rem;
	font-weight: 600;
	margin-bottom: 8px;
	color: #333;
}
.preview-description {
	color: #666;
	margin-bottom: 0;
	font-size: 1.1rem;
}
.questions-section {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
.questions-list {
	display: flex;
	flex-direction: column;
	gap: 24px;
}
.empty-questions {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 40px;
	text-align: center;
	background: #fff;
	border: 2px dashed #e5e5e5;
	border-radius: 16px;
}
.preview-question-card {
	background: #fafbfc;
	border: 1px solid #e5e5e5;
	border-radius: 12px;
	padding: 24px 20px 20px 20px;
	margin-bottom: 0;
	box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.question-title-row {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 1.1rem;
	font-weight: 500;
	color: #333;
	margin-bottom: 12px;
}
.question-number {
	color: #6366f1;
	font-weight: 700;
}
.question-title {
	flex: 1;
}
.required-badge {
	color: #e11d48;
	font-size: 1.2em;
	margin-left: 4px;
}
.question-preview-body {
	margin-left: 24px;
}
.preview-input {
	width: 100%;
	padding: 8px 12px;
	border: 1px solid #e5e5e5;
	border-radius: 8px;
	font-size: 1rem;
	color: #888;
	background: #f5f5f5;
	margin-bottom: 8px;
	resize: none;
}
.preview-input:disabled {
	background: #f5f5f5;
	color: #888;
}
.preview-options {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.preview-option {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 1rem;
	color: #444;
}
</style>
