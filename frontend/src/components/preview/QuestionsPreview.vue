<script setup>
// --- Import dependencies ---
// Vue core and child component imports
import { ref, watch } from 'vue'
import FollowupOption from './Followup.vue';
import { ArrowLeftIcon } from '@/components/icons';

// --- Define component props ---
// Props: form meta and questions array
const props = defineProps({
    formTitle: { type: String, required: true },
    formDescription: { type: String, default: '' },
    formStatus: { type: String, default: 'draft' },
    questions: { type: Array, required: true }
})

// --- Local state: answers for each question ---
// answers: stores preview answers for each question
const answers = ref([])
// Reset answers when questions change
// Watch for questions prop changes to reset answers
watch(() => props.questions, (newQ) => {
    answers.value = newQ.map(() => null)
}, { immediate: true })

// --- Handle input for text, paragraph, date, time, rating ---
// handleInput: updates answers, supports rating deselect
function handleInput(idx, value, type) {
    // For rating: allow deselecting by clicking the same star
    if (type === 'rating') {
        if (answers.value[idx] === value) {
            answers.value[idx] = 0;
        } else {
            answers.value[idx] = value;
        }
    } else {
        answers.value[idx] = value;
    }
}
</script>

<template>
    <!-- Main preview container -->
    <div class="questions-preview-googleform">
        <!-- =====================
            Form Header Section
        ====================== -->
        <!-- Form header: title & description -->
        <div class="form-header-section preview-header">
            <h2 class="preview-title">{{ formTitle }}</h2>
            <p class="preview-description" v-if="formDescription">{{ formDescription }}</p>
        </div>

        <!-- =====================
            Questions List
        ====================== -->
        <!-- Questions list -->
        <form class="preview-questions-list" @submit.prevent>
            <!-- Render each question card -->
            <div v-for="(q, idx) in questions" :key="q.id || idx" class="preview-question-card">
                <!-- --- Section Header --- -->
                <!-- Section header (question number) -->
                <div class="question-section-header">
                    <span class="question-section-label">Question {{ idx + 1 }}</span>
                </div>
                <!-- --- Question Title Row --- -->
                <!-- Question title and required marker -->
                <div class="question-title-row">
                    <span class="question-title">{{ q.title || 'Untitled Question' }}</span>
                    <span v-if="q.required" class="required-dot" title="Required">*</span>
                </div>
        
                <!-- Question body: render by type -->
                <div class="question-preview-body">
                   
                    <!-- Short Answer -->
                    <template v-if="q.type === 'short-answer'">
                        <!-- Single-line text input -->
                        <input class="custom-input" type="text" :placeholder="q.placeholder || 'Your answer'"
                            v-model="answers[idx]" @input="handleInput(idx, $event.target.value)" />
                    </template>

                    <!-- Paragraph -->
                    <template v-else-if="q.type === 'paragraph'">
                        <!-- Multi-line textarea -->
                        <textarea class="custom-input textarea" :placeholder="q.placeholder || 'Your answer'"
                            v-model="answers[idx]" @input="handleInput(idx, $event.target.value)"></textarea>
                    </template>

                
                    <!-- Multiple Choice (with follow-up support) -->
                    <template v-else-if="q.type === 'multiple-choice'">
                        <div class="preview-mc-list">
                            <FollowupOption v-for="opt in q.options || []" :key="opt.id" :option="opt" :idx="idx"
                                v-model:answers="answers" />
                        </div>
                    </template>

                    <!-- Checkbox (interactive preview) -->
                    <template v-else-if="q.type === 'checkbox'">
                        <div class="preview-checkbox-list">
                            <div v-for="opt in q.options || []" :key="opt.id" class="preview-checkbox-row"
                                :class="{ checked: Array.isArray(answers[idx]) && answers[idx].includes(opt.id) }"
                                @click="() => {
                                    if (!Array.isArray(answers[idx])) answers[idx] = [];
                                    const i = answers[idx].indexOf(opt.id);
                                    if (i === -1) answers[idx].push(opt.id);
                                    else answers[idx].splice(i, 1);
                                }">
                                <div class="preview-checkbox-box">
                                    <div v-if="Array.isArray(answers[idx]) && answers[idx].includes(opt.id)"
                                        class="preview-checkbox-tick"></div>
                                </div>
                                <span class="preview-checkbox-text">{{ opt.text }}</span>
                            </div>
                        </div>
                    </template>

                    <!-- Dropdown (interactive preview) -->
                    <!-- Dropdown (interactive preview) -->
                    <template v-else-if="q.type === 'dropdown'">
                        <!-- Dropdown display and menu with overlay alignment -->
                        <div class="preview-dropdown-wrapper">
                            <div class="preview-dropdown" tabindex="0" @click="q._dropdownOpen = !q._dropdownOpen"
                                @blur="q._dropdownOpen = false">
                                <div class="preview-dropdown-selected">
                                    <span v-if="!answers[idx]" class="dropdown-placeholder">Select an option</span>
                                    <span v-else>{{(q.options || []).find(o => o.id === answers[idx])?.text}}</span>
                                </div>
                                <div class="preview-dropdown-arrow">
                                    <ArrowLeftIcon class="dropdown-arrow-icon" />
                                </div>
                            </div>
                            <div v-if="q._dropdownOpen" class="preview-dropdown-menu">
                                <div v-for="opt in q.options || []" :key="opt.id" class="preview-dropdown-option"
                                    :class="{ selected: answers[idx] === opt.id }"
                                    @mousedown.prevent="() => { answers[idx] = opt.id; q._dropdownOpen = false; }">
                                    {{ opt.text }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Date -->
                    <!-- Date -->
                    <template v-else-if="q.type === 'date'">
                        <input class="custom-input" type="date" v-model="answers[idx]"
                            @input="handleInput(idx, $event.target.value)" />
                    </template>

                    <!-- Time -->
                    <!-- Time -->
                    <template v-else-if="q.type === 'time'">
                        <input class="custom-input" type="time" v-model="answers[idx]"
                            @input="handleInput(idx, $event.target.value)" />
                    </template>

                    <!-- Rating (star selection) -->
                    <!-- Rating (star selection) -->
                    <template v-else-if="q.type === 'rating'">
                        <div class="custom-rating">
                            <span v-for="star in q.maxRating || 5" :key="star" class="star"
                                :class="{ filled: answers[idx] >= star }" @click="handleInput(idx, star, 'rating')">
                                &#9733;
                            </span>
                        </div>
                    </template>

                    <!-- File Upload (interactive preview, builder-style UI) -->
                    <!-- File Upload (interactive preview, builder-style UI) -->
                    <template v-else-if="q.type === 'file-upload'">
                        <div class="preview-file-upload">
                            <label class="file-upload-area" style="cursor:pointer;">
                                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="1.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <span>File upload area</span>
                                <span class="upload-hint">Drag & drop or click to upload</span>
                                <input type="file" :multiple="q.maxFiles > 1" style="display:none" @change="e => {
                                    answers[idx] = Array.from(e.target.files);
                                }" />
                            </label>
                            <div v-if="Array.isArray(answers[idx]) && answers[idx].length" class="preview-file-list">
                                <div v-for="file in answers[idx]" :key="file.name" class="preview-file-item">
                                    <span class="preview-file-name">{{ file.name }}</span>
                                </div>
                            </div>
                        </div>
                    </template>


                    <!-- Image (display only) -->
                    <!-- Image (display only) -->
                    <template v-else-if="q.type === 'image'">
                        <div v-if="q.imageUrl" class="media-center">
                            <img :src="q.imageUrl" alt="Image" class="media-image" />
                            <div v-if="q.caption" class="custom-caption">{{ q.caption }}</div>
                        </div>
                    </template>

                    <!-- Video (display only) -->
                    <!-- Video (display only) -->
                    <template v-else-if="q.type === 'video'">
                        <div v-if="q.videoUrl" class="media-center">
                            <video :src="q.videoUrl" controls class="media-video"></video>
                            <div v-if="q.caption" class="custom-caption">{{ q.caption }}</div>
                        </div>
                    </template>

                </div>

                <!-- --- Divider between questions --- -->
                <!-- Divider between questions -->
                <hr v-if="idx < questions.length - 1" class="question-divider" />
            </div>

            <!-- =====================
                Footer Section
            ====================== -->
            <!-- Footer: required note and submit button -->
            <div class="preview-footer-row">
                <span class="required-note"><span class="star">*</span>Required field</span>
                <button class="submit-btn" type="button" disabled>Submit (Preview Mode)</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
/* =============================
   Dropdown Menu (Preview)
============================= */
/* Dropdown wrapper for overlay alignment */
.preview-dropdown-wrapper {
    position: relative;
    width: 100%;
    max-width: 600px;
    margin-bottom: 8px;
}

.preview-dropdown-menu {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    background: #fff;
    border: 1.5px solid #e5e5e5;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    margin-top: 2px;
    z-index: 10;
    min-width: 0;
    max-width: 600px;
}

.preview-dropdown-option {
    padding: 8px 16px;
    cursor: pointer;
    font-size: 1rem;
    color: #222;
    font-family: 'Inter', sans-serif;
    transition: background 0.15s;
}

.preview-dropdown-option:hover {
    background: #f5f7ff;
}

.preview-dropdown-option.selected {
    background: #e0e7ff;
    color: #6366f1;
}

/* =============================
   File Upload (Preview)
============================= */
.preview-file-list {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.preview-file-item {
    font-size: 0.97rem;
    color: #444;
    background: #f5f7ff;
    border-radius: 6px;
    padding: 4px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.preview-file-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.97rem;
}

.file-upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 18px;
    border: 2px dashed #e5e5e5;
    border-radius: 8px;
    color: #999;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
    margin-right: auto;
    max-width: 500px;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
}

.file-upload-area:hover {
    border-color: #6366f1;
    background: #fafaff;
}

.upload-icon {
    width: 48px;
    max-width: 100%;
    height: 2.2em;
    color: #ccc;
    display: block;
    margin: 0 auto;
}

.upload-hint {
    font-size: 12px;
    color: #bbb;
}

/* =============================
   Checkbox (Preview)
============================= */
.preview-checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
}

.preview-checkbox-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1rem;
    color: #444;
    padding: 7px 14px;
    border-radius: 8px;
    background: #fff;
    transition: background 0.2s;
}

.preview-checkbox-box {
    width: 20px;
    height: 20px;
    border: 2px solid #bbb;
    border-radius: 6px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-checkbox-row.checked .preview-checkbox-box {
    border-color: #6366f1;
    background: #f5f7ff;
}

.preview-checkbox-tick {
    width: 12px;
    height: 12px;
    background: #6366f1;
    border-radius: 2px;
}

.preview-checkbox-text {
    font-size: 1rem;
    color: #222;
    font-family: 'Inter', sans-serif;
}

/* =============================
   Dropdown (Preview)
============================= */
.preview-dropdown {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 8px;
    background: #fff;
    border: 1.5px solid #e5e5e5;
    font-size: 1rem;
    color: #222;
    font-family: 'Inter', sans-serif;
    margin-bottom: 8px;
    min-width: 0;
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

.preview-dropdown-selected {
    flex: 1;
}

.dropdown-placeholder {
    color: #bbb;
}

.preview-dropdown-arrow {
    color: #bbb;
    font-size: 1.1em;
    display: flex;
    align-items: center;
}

.dropdown-arrow-icon {
    transform: rotate(-90deg);
    width: 1.2em;
    height: 1.2em;
    color: #bbb;
    display: block;
}


/* =============================
   File Upload (Preview)
============================= */
.preview-file-upload {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    margin-bottom: 8px;
}

.preview-file-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    border-radius: 8px;
    background: #fff;
    border: 1.5px solid #e5e5e5;
    font-size: 1rem;
    color: #222;
    font-family: 'Inter', sans-serif;
}

.preview-file-icon {
    font-size: 1.2em;
}

.preview-file-label {
    font-size: 1rem;
}

.preview-file-note {
    color: #888;
    font-size: 0.95em;
    margin-left: 8px;
}

/* =============================
   Custom Input Styles
============================= */

/* Short Answer (single-line input) */
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
    min-height: 40px;
    /* Shorter height for single-line input */
}

/* Paragraph (multi-line textarea) */
.custom-input.textarea {
    min-height: 100px;
    resize: vertical;
}

/* Option list for builder/preview (not answer input) */
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

/* =============================
   Follow-up Options Styling
============================= */
.followup-options {
    margin-left: 32px;
    margin-top: 4px;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 2px solid #e5e5e5;
}

.followup-label {
    font-size: 0.98rem;
    color: #888;
    margin-bottom: 2px;
}

.followup-list {
    margin-bottom: 0;
}

/* =============================
   Multiple Choice List (Preview)
============================= */
.preview-mc-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
}

.followup-row {
    font-size: 0.97rem;
    color: #555;
}

/* =============================
   Rating (Stars)
============================= */
.custom-rating {
    display: flex;
    gap: 4px;
    font-size: 2.5rem;
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

/* =============================
   Caption, Image, Video
============================= */
.custom-caption {
    color: #666;
    font-size: 0.95em;
    margin-top: 4px;
}

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

/* =============================
   Main Container & Layout
============================= */
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