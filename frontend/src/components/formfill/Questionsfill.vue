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
    questions: { type: Array, required: true },
    responses: { type: Object, required: true },
    isResponseMode: { type: Boolean, default: false },
    currentSection: { type: Number, default: 0 },
    totalSections: { type: Number, default: 1 },
    isSubmitting: { type: Boolean, default: false }
})

// --- Define emits ---
const emit = defineEmits(['submit', 'next', 'prev'])

// --- Handle input for text, paragraph, date, time, rating ---
// handleInput: updates responses, supports rating deselect
function handleInput(questionId, value, type) {
    // For rating: allow deselecting by clicking the same star
    if (type === 'rating') {
        if (props.responses[questionId] === value) {
            props.responses[questionId] = 0;
        } else {
            props.responses[questionId] = value;
        }
    } else {
        props.responses[questionId] = value;
    }
}

// Handle checkbox toggle
function handleCheckbox(questionId, optionId) {
    // สร้าง array ใหม่แทนการแก้ไขโดยตรง เพื่อ trigger reactivity
    const current = Array.isArray(props.responses[questionId]) 
        ? [...props.responses[questionId]] 
        : [];
    
    const index = current.indexOf(optionId);
    if (index === -1) {
        current.push(optionId);
    } else {
        current.splice(index, 1);
    }
    
    // Assign array ใหม่เพื่อ trigger reactivity
    props.responses[questionId] = current;
}

// Handle dropdown toggle
function handleDropdownToggle(question) {
    question._dropdownOpen = !question._dropdownOpen;
}

// Handle dropdown select
function handleDropdownSelect(questionId, optionId, question) {
    props.responses[questionId] = optionId;
    question._dropdownOpen = false;
}

// Handle file upload (Google Form style)
function handleFileUpload(questionId, event, question) {
    const newFiles = Array.from(event.target.files);
    const existingFiles = props.responses[questionId] || [];
    const maxFiles = question?.maxFiles || 10;
    const maxSize = (question?.maxSize || 10) * 1024 * 1024; // Convert MB to bytes
    
    // Filter files by size
    const validFiles = newFiles.filter(file => {
        if (file.size > maxSize) {
            alert(`File "${file.name}" is too large. Maximum size is ${formatFileSize(question?.maxSize || 10)}.`);
            return false;
        }
        return true;
    });
    
    // Check max files limit
    const totalFiles = [...existingFiles, ...validFiles];
    if (totalFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files.`);
        props.responses[questionId] = totalFiles.slice(0, maxFiles);
    } else {
        props.responses[questionId] = totalFiles;
    }
    
    event.target.value = ''; // Reset input to allow re-uploading same file
}

// Handle file removal
function handleFileRemove(questionId, fileIndex) {
    if (Array.isArray(props.responses[questionId])) {
        props.responses[questionId].splice(fileIndex, 1);
    }
}

// Get accept types for file input
function getAcceptTypes(question) {
    if (!question.allowSpecificTypes || !question.allowedFileTypes?.length) {
        return '*/*';
    }
    
    const typeMap = {
        'document': '.doc,.docx,.txt,.rtf',
        'spreadsheet': '.xls,.xlsx,.csv',
        'pdf': '.pdf',
        'video': 'video/*',
        'presentation': '.ppt,.pptx',
        'drawing': '.svg,.ai,.eps',
        'image': 'image/*',
        'audio': 'audio/*'
    };
    
    return question.allowedFileTypes.map(type => typeMap[type] || '').filter(Boolean).join(',');
}

// Check if file is an image
function isImageFile(file) {
    return file.type?.startsWith('image/');
}

// Get file preview URL
function getFilePreview(file) {
    if (file instanceof File) {
        return URL.createObjectURL(file);
    }
    return file.url || '';
}

// Format file size in MB
function formatFileSize(mb) {
    if (mb >= 1024) {
        return `${mb / 1024} GB`;
    }
    return `${mb} MB`;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Computed properties for section navigation ---
import { computed } from 'vue'
const isFirstSection = computed(() => props.currentSection === 0)
const isLastSection = computed(() => props.currentSection === props.totalSections - 1)

// --- Navigation handlers ---
function handleNext() {
    emit('next')
}

function handlePrev() {
    emit('prev')
}

function handleSubmit() {
    emit('submit')
}
</script>

<template>
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
                            v-model="responses[q._id]" @input="handleInput(q._id, $event.target.value)" />
                    </template>

                    <!-- Paragraph -->
                    <template v-else-if="q.type === 'paragraph'">
                        <!-- Multi-line textarea -->
                        <textarea class="custom-input textarea" :placeholder="q.placeholder || 'Your answer'"
                            v-model="responses[q._id]" @input="handleInput(q._id, $event.target.value)"></textarea>
                    </template>

                
                    <!-- Multiple Choice -->
                    <template v-else-if="q.type === 'multiple-choice'">
                        <div class="preview-mc-list">
                            <!-- Use Followup component for options with follow-up support -->
                            <FollowupOption
                                v-for="opt in q.options || []"
                                :key="opt.id"
                                :option="opt"
                                :idx="q._id"
                                :answers="responses"
                                @update:answers="(val) => handleInput(q._id, val[q._id])"
                            />
                        </div>
                    </template>

                    <!-- Checkbox (interactive preview) -->
                    <template v-else-if="q.type === 'checkbox'">
                        <div class="preview-checkbox-list">
                            <div v-for="opt in q.options || []" :key="opt.id" class="preview-checkbox-row"
                                :class="{ checked: Array.isArray(responses[q._id]) && responses[q._id].includes(opt.text) }"
                                @click="handleCheckbox(q._id, opt.text)">
                                <div class="preview-checkbox-box">
                                    <div v-if="Array.isArray(responses[q._id]) && responses[q._id].includes(opt.text)"
                                        class="preview-checkbox-tick"></div>
                                </div>
                                <span class="preview-checkbox-text">{{ opt.text }}</span>
                            </div>
                        </div>
                    </template>

                    <!-- Dropdown (interactive preview) -->
                    <template v-else-if="q.type === 'dropdown'">
                        <!-- Dropdown display and menu with overlay alignment -->
                        <div class="preview-dropdown-wrapper">
                            <div class="preview-dropdown" tabindex="0" @click="handleDropdownToggle(q)"
                                @blur="q._dropdownOpen = false">
                                <div class="preview-dropdown-selected">
                                    <span v-if="!responses[q._id]" class="dropdown-placeholder">Select an option</span>
                                    <span v-else>{{(q.options || []).find(o => o.text === responses[q._id])?.text}}</span>
                                </div>
                                <div class="preview-dropdown-arrow">
                                    <ArrowLeftIcon class="dropdown-arrow-icon" />
                                </div>
                            </div>
                            <div v-if="q._dropdownOpen" class="preview-dropdown-menu">
                                <div v-for="opt in q.options || []" :key="opt.id" class="preview-dropdown-option"
                                    :class="{ selected: responses[q._id] === opt.text }"
                                    @mousedown.prevent="handleDropdownSelect(q._id, opt.text, q)">
                                    {{ opt.text }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Date -->
                    <template v-else-if="q.type === 'date'">
                        <input class="custom-input" type="date" v-model="responses[q._id]"
                            @input="handleInput(q._id, $event.target.value)" />
                    </template>

                    <!-- Time -->
                    <template v-else-if="q.type === 'time'">
                        <input class="custom-input" type="time" v-model="responses[q._id]"
                            @input="handleInput(q._id, $event.target.value)" />
                    </template>

                    <!-- Rating (star selection) -->
                    <template v-else-if="q.type === 'rating'">
                        <div class="custom-rating">
                            <span v-for="star in q.maxRating || 5" :key="star" class="star"
                                :class="{ filled: responses[q._id] >= star }" @click="handleInput(q._id, star, 'rating')">
                                &#9733;
                            </span>
                        </div>
                    </template>

                    <!-- File Upload (Google Form Style) -->
                    <template v-else-if="q.type === 'file-upload'">
                        <div class="google-file-upload">
                            <!-- File Info Line -->
                            <p class="gf-upload-info">Upload {{ q.maxFiles || 1 }} supported file{{ (q.maxFiles || 1) > 1 ? 's' : '' }}. Max {{ formatFileSize(q.maxSize || 10) }}.</p>
                            
                            <!-- Add File Button -->
                            <label class="gf-add-file-btn">
                                <svg class="gf-upload-icon" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2"/>
                                    <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2"/>
                                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Add file
                                <input 
                                    type="file" 
                                    :multiple="(q.maxFiles || 1) > 1" 
                                    :accept="getAcceptTypes(q)"
                                    @change="handleFileUpload(q._id, $event, q)"
                                    style="display:none"
                                />
                            </label>

                            <!-- Uploaded Files List -->
                            <div v-if="Array.isArray(responses[q._id]) && responses[q._id].length" class="uploaded-files-list">
                                <div v-for="(file, index) in responses[q._id]" :key="index" class="uploaded-file-item">
                                    <div class="file-preview">
                                        <!-- Image Preview -->
                                        <img 
                                            v-if="isImageFile(file)" 
                                            :src="getFilePreview(file)" 
                                            class="file-thumbnail"
                                            alt="Preview"
                                        />
                                        <!-- File Icon for non-images -->
                                        <div v-else class="file-icon-box">
                                            <svg class="file-type-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.5"/>
                                                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.5"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="file-details">
                                        <span class="file-name">{{ file.name }}</span>
                                        <span class="file-size">{{ formatBytes(file.size) }}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        class="remove-file-btn"
                                        @click="handleFileRemove(q._id, index)"
                                        title="Remove file"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Upload Progress (if uploading) -->
                            <div v-if="q._uploadProgress" class="upload-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" :style="{ width: q._uploadProgress + '%' }"></div>
                                </div>
                                <span class="progress-text">Uploading... {{ q._uploadProgress }}%</span>
                            </div>
                        </div>
                    </template>


                    <!-- Image (display only) -->
                    <template v-else-if="q.type === 'image'">
                        <div v-if="q.imageUrl" class="media-center">
                            <img :src="q.imageUrl" alt="Image" class="media-image" />
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
            <!-- Footer: required note and navigation buttons -->
            <div class="preview-footer-row">
                <span class="required-note"><span class="star">*</span>Required field</span>
                
                <!-- Navigation Buttons for Multi-section Forms or Single Submit -->
                <div class="navigation-buttons">
                    <!-- Previous Button (show if not first section and response mode) -->
                    <button 
                        v-if="isResponseMode && totalSections > 1 && !isFirstSection"
                        class="nav-btn prev-btn" 
                        type="button"
                        @click="handlePrev"
                    >
                        <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Previous
                    </button>
                    
                    <!-- Spacer for alignment when no prev button -->
                    <div v-else-if="isResponseMode && totalSections > 1"></div>
                    
                    <!-- Next Button (show if not last section and response mode) -->
                    <button 
                        v-if="isResponseMode && totalSections > 1 && !isLastSection"
                        class="nav-btn next-btn" 
                        type="button"
                        @click="handleNext"
                    >
                        Next
                        <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    
                    <!-- Submit Button (show if last section or single section, and response mode) -->
                    <button 
                        v-if="isResponseMode && (totalSections === 1 || isLastSection)"
                        class="submit-btn" 
                        type="button"
                        :disabled="isSubmitting"
                        @click="handleSubmit"
                    >
                        {{ isSubmitting ? 'Submitting...' : 'Submit' }}
                    </button>
                </div>
            </div>
        </form>
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
    border: 1.5px solid var(--border-color);
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
    color: var(--primary);
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
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-icon-wrapper {
    position: relative;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.file-icon {
    width: 24px;
    height: 24px;
    color: var(--primary);
}

.preview-file-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.97rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preview-file-size {
    font-size: 0.85rem;
    color: #888;
    flex-shrink: 0;
}

.file-remove-btn {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border: none;
    background: #dc2626;
    color: #fff;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
}

.file-remove-btn:hover {
    background: #b91c1c;
    transform: scale(1.15);
}

.file-remove-btn svg {
    width: 10px;
    height: 10px;
}

.file-upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 24px 18px;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-muted);
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
    border-color: var(--primary);
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
    border-color: var(--primary);
    background: #f5f7ff;
}

.preview-checkbox-tick {
    width: 12px;
    height: 12px;
    background: var(--primary);
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
    border: 1.5px solid var(--border-color);
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
    border: 1.5px solid var(--border-color);
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
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
    color: var(--text-primary);
    background: var(--bg-gray);
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
    border-left: 2px solid var(--border-color);
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
    color: var(--border-color);
    transition: color 0.2s;
}

.custom-rating .star.filled {
    color: #fbbf24;
}

/* =============================
   Caption, Image, Video
============================= */
.custom-caption {
    color: var(--text-secondary);
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
    color: var(--text-primary);
}

.preview-description {
    color: var(--text-secondary);
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

/* Navigation Buttons Container */
.navigation-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

/* Navigation Button Base */
.nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: #FFFFFF;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.15px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
}

.nav-btn:hover {
    background: var(--bg-gray-light);
    border-color: #D4D4D4;
}

.icon-16 {
    width: 16px;
    height: 16px;
}

.prev-btn svg {
    color: #737373;
}

.next-btn {
    background: var(--primary);
    border-color: var(--primary);
    color: #FFFFFF;
}

.next-btn:hover {
    background: #4F46E5;
    border-color: #4F46E5;
}

.next-btn svg {
    color: #FFFFFF;
}

/* Submit Button */
.submit-btn {
    background: #171717;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    padding: 10px 32px;
    cursor: pointer;
    transition: background 0.2s;
    margin-left: auto;
}

.submit-btn:hover:not(:disabled) {
    background: #404040;
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #737373;
}

/* =============================
   Google Form Style File Upload
============================= */
.google-file-upload {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.gf-upload-info {
    margin: 0;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #5f6368;
}

.gf-add-file-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    padding: 8px 16px;
    background: #fff;
    border: 1px solid #dadce0;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #1a73e8;
    cursor: pointer;
    transition: all 0.2s;
}

.gf-add-file-btn:hover {
    background: #f8f9fa;
    border-color: #1a73e8;
}

.gf-upload-icon {
    width: 18px;
    height: 18px;
}

.file-constraints span {
    padding: 4px 8px;
    background: #f1f3f4;
    border-radius: 4px;
}

/* Uploaded Files List */
.uploaded-files-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.uploaded-file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #dadce0;
    border-radius: 8px;
    transition: all 0.2s;
}

.uploaded-file-item:hover {
    border-color: #bdc1c6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.file-preview {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.file-thumbnail {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
}

.file-icon-box {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f3f4;
    border-radius: 4px;
}

.file-type-icon {
    width: 24px;
    height: 24px;
    color: #5f6368;
}

.file-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.file-name {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: #202124;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.file-size {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #5f6368;
}

.remove-file-btn {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
}

.remove-file-btn:hover {
    background: #f1f3f4;
}

.remove-file-btn svg {
    width: 18px;
    height: 18px;
    color: #5f6368;
}

.remove-file-btn:hover svg {
    color: #d93025;
}

/* Upload Progress */
.upload-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: #e8eaed;
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s;
}

.progress-text {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #5f6368;
}
</style>