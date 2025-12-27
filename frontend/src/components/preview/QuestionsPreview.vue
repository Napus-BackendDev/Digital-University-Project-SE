<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    formTitle: { type: String, required: true },
    formDescription: { type: String, default: '' },
    formStatus: { type: String, default: 'draft' },
    questions: { type: Array, required: true }
})

const answers = ref([])
watch(() => props.questions, (newQ) => {
    answers.value = newQ.map(() => null)
}, { immediate: true })

function handleInput(idx, value) {
    answers.value[idx] = value
}

</script>

<template>
    <div class="questions-preview-googleform">
        <!-- Form Title & Description (readonly) -->
        <div class="form-header-section preview-header">
            <h2 class="preview-title">{{ formTitle }}</h2>
            <p class="preview-description" v-if="formDescription">{{ formDescription }}</p>
        </div>
        <form class="preview-questions-list" @submit.prevent>
            <div v-for="(q, idx) in questions" :key="q.id || idx" class="preview-question-card">
                <div class="question-section-header">
                    <span class="question-section-label">Question {{ idx + 1 }}</span>
                </div>
                <div class="question-title-row">
                    <span class="question-title">{{ q.title || 'Untitled Question' }}</span>
                    <span v-if="q.required" class="required-dot" title="Required">*</span>
                </div>
                <div class="question-preview-body">
                    <!-- Short Answer -->
                    <template v-if="q.type === 'short-answer'">
                        <input class="custom-input" type="text" :placeholder="q.placeholder || 'Your answer'"
                            v-model="answers[idx]" @input="handleInput(idx, $event.target.value)" />
                    </template>
                    <!-- Paragraph -->
                    <template v-else-if="q.type === 'paragraph'">
                        <textarea class="custom-input textarea" :placeholder="q.placeholder || 'Your answer'"
                            v-model="answers[idx]" @input="handleInput(idx, $event.target.value)"></textarea>
                    </template>
                    <!-- Multiple Choice -->
                    <template v-else-if="q.type === 'multiple-choice'">
                        <div class="custom-options">
                            <label v-for="opt in q.options || []" :key="opt.id" class="custom-option-row">
                                <input type="radio" :name="'mc-' + idx" :value="opt.id" v-model="answers[idx]"
                                    @change="handleInput(idx, opt.id)" />
                                <span>{{ opt.text }}</span>
                            </label>
                        </div>
                    </template>
                    <!-- Checkbox -->
                    <template v-else-if="q.type === 'checkbox'">
                        <div class="custom-options">
                            <label v-for="opt in q.options || []" :key="opt.id" class="custom-option-row">
                                <input type="checkbox" :value="opt.id"
                                    :checked="Array.isArray(answers[idx]) && answers[idx].includes(opt.id)" @change="e => {
                                        const arr = Array.isArray(answers[idx]) ? [...answers[idx]] : [];
                                        if (e.target.checked) arr.push(opt.id)
                                        else arr.splice(arr.indexOf(opt.id), 1)
                                        handleInput(idx, arr)
                                    }" />
                                <span>{{ opt.text }}</span>
                            </label>
                        </div>
                    </template>
                    <!-- Dropdown -->
                    <template v-else-if="q.type === 'dropdown'">
                        <select class="custom-input" v-model="answers[idx]"
                            @change="handleInput(idx, $event.target.value)">
                            <option value="" disabled selected>Select an option</option>
                            <option v-for="opt in q.options || []" :key="opt.id" :value="opt.id">{{ opt.text }}</option>
                        </select>
                    </template>
                    <!-- Date -->
                    <template v-else-if="q.type === 'date'">
                        <input class="custom-input" type="date" v-model="answers[idx]"
                            @input="handleInput(idx, $event.target.value)" />
                    </template>
                    <!-- Time -->
                    <template v-else-if="q.type === 'time'">
                        <input class="custom-input" type="time" v-model="answers[idx]"
                            @input="handleInput(idx, $event.target.value)" />
                    </template>
                    <!-- Rating -->
                    <template v-else-if="q.type === 'rating'">
                        <div class="custom-rating">
                            <span v-for="star in q.maxRating || 5" :key="star" class="star"
                                :class="{ filled: answers[idx] >= star }" @click="handleInput(idx, star)">&#9733;</span>
                        </div>
                    </template>
                    <!-- File Upload -->
                    <template v-else-if="q.type === 'file-upload'">
                        <input class="custom-input" type="file" :multiple="q.maxFiles > 1"
                            @change="e => handleInput(idx, q.maxFiles > 1 ? Array.from(e.target.files) : e.target.files[0])" />
                    </template>
                    <!-- Image/Video/Other (show only, not answer) -->
                    <template v-else-if="q.type === 'image'">
                        <div v-if="q.imageUrl" class="media-center">
                            <img :src="q.imageUrl" alt="Image" class="media-image" />
                            <div v-if="q.caption" class="custom-caption">{{ q.caption }}</div>
                        </div>
                    </template>
                    <template v-else-if="q.type === 'video'">
                        <div v-if="q.videoUrl" class="media-center">
                            <video :src="q.videoUrl" controls class="media-video"></video>
                            <div v-if="q.caption" class="custom-caption">{{ q.caption }}</div>
                        </div>
                    </template>

                </div>

                <hr v-if="idx < questions.length - 1" class="question-divider" />
            </div>
            <div class="preview-footer-row">
                <span class="required-note"><span class="star">*</span>Required field</span>
                <button class="submit-btn" type="button" disabled>Submit (Preview Mode)</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
/* Custom UI styles for preview questions */
.custom-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    font-size: 1rem;
    color: #333;
    background: #fafafa;
    margin-bottom: 8px;
    font-family: 'Inter', sans-serif;
}

.custom-input.textarea {
    min-height: 64px;
    resize: vertical;
}

.custom-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
}

.custom-option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    color: #444;
}

.custom-rating {
    display: flex;
    gap: 4px;
    font-size: 1.6rem;
    margin-bottom: 8px;
}

.custom-rating .star {
    cursor: pointer;
    color: #e5e5e5;
    transition: color 0.2s;
}

.custom-rating .star.filled {
    color: #fbbf24;
}

.custom-caption {
    color: #666;
    font-size: 0.95em;
    margin-top: 4px;
}

/* Center image and video */
.media-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 12px 0;
}

.media-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    display: block;
    margin: 0 auto;
}

.media-video {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    display: block;
    margin: 0 auto;
}

.questions-preview-googleform {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    padding: 32px;
    max-width: 650px;
    margin: 40px auto;
}

.preview-header {
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

.preview-questions-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.preview-question-card {
    background: transparent;
    border: none;
    border-radius: 0;
    padding: 0 0 24px 0;
    margin-bottom: 0;
    box-shadow: none;
}

.question-section-header {
    font-size: 1.05rem;
    color: #b0b0b0;
    font-weight: 600;
    margin-bottom: 2px;
    margin-top: 16px;
}

.question-section-label {
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.01em;
}

.question-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.13rem;
    font-weight: 600;
    color: #222;
    margin-bottom: 10px;
    margin-top: 2px;
}

.question-title {
    flex: 1;
    font-family: 'Inter', sans-serif;
    font-size: 1.0rem;
    font-weight: 200;
    color: #222;
}

.required-dot {
    color: #d93025;
    font-size: 1.2em;
    margin-left: 4px;
    line-height: 1;
    vertical-align: middle;
    font-weight: bold;
}

.question-preview-body {
    margin-left: 0;
    margin-bottom: 8px;
}

.question-divider {
    border: none;
    border-top: 1.5px solid #f0f0f0;
    margin: 32px 0 0 0;
}

.preview-footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1.5px solid #f0f0f0;
}

.required-note {
    color: #737373;
    font-size: 1rem;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
    margin-left: 2px;
}

.required-note .star {
    color: #d93025;
    margin-right: 2px;
}

.submit-btn {
    background: #737373;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    font-weight: 300;
    border: none;
    border-radius: 8px;
    padding: 10px 32px;
    cursor: not-allowed;
    opacity: 0.7;
    transition: background 0.2s;
    margin-left: auto;
}

</style>
