<template>
    <div class="tab-question">
        <!-- Form Title & Description Card -->
        <div class="q-card q-card--title-desc">
            <div class="q-card__body">
                <div class="q-field">
                    <label class="q-field__label">Form Title</label>
                    <input 
                        class="q-input q-input--underline q-input--lg"
                        type="text"
                        placeholder="Untitled Form"
                        :value="title"
                        @input="$emit('update:title', $event.target.value)"
                        @change="triggerAutoSave"
                    />
                </div>
                <div class="q-field">
                    <label class="q-field__label">Description</label>
                    <textarea 
                        class="q-textarea q-input--underline"
                        placeholder="Form description (optional)"
                        :value="description"
                        @input="$emit('update:description', $event.target.value)"
                        @change="triggerAutoSave"
                        rows="2"
                    />
                </div>
            </div>
        </div>

        <div class="tab-question__layout">
            <!-- Left: Question List -->
            <div class="tab-question__main">
                <div 
                    v-for="(question, qIndex) in questions" 
                    :key="question.id"
                    class="q-editor"
                    :class="{ 'q-editor--followup': question.isFollowUp }"
                >
                    <!-- Follow-up badge -->
                    <div v-if="question.isFollowUp" class="q-editor__followup-header">
                        <span class="q-editor__followup-badge">{{ question.parentNumber }}.{{ question.subNumber }}</span>
                        <span class="q-editor__followup-label">Follow-up Question</span>
                    </div>

                    <div class="q-editor__row">
                        <!-- Drag handle -->
                        <div class="q-editor__drag-handle">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="7" cy="4" r="1.5" fill="#a3a3a3"/>
                                <circle cx="13" cy="4" r="1.5" fill="#a3a3a3"/>
                                <circle cx="7" cy="10" r="1.5" fill="#a3a3a3"/>
                                <circle cx="13" cy="10" r="1.5" fill="#a3a3a3"/>
                                <circle cx="7" cy="16" r="1.5" fill="#a3a3a3"/>
                                <circle cx="13" cy="16" r="1.5" fill="#a3a3a3"/>
                            </svg>
                        </div>

                        <!-- Question number badge -->
                        <div class="q-editor__number" v-if="!question.isFollowUp">
                            {{ qIndex + 1 }}
                        </div>

                        <div class="q-editor__content">
                            <!-- Question title with TH/EN -->
                            <div class="q-editor__title-row">
                                <div class="q-editor__lang-label">TH</div>
                                <input 
                                    class="q-input q-input--underline"
                                    placeholder="Question title"
                                    v-model="question.titleTH"
                                    @change="triggerAutoSave"
                                />
                            </div>
                            <div class="q-editor__title-row">
                                <div class="q-editor__lang-label">EN</div>
                                <input 
                                    class="q-input q-input--underline"
                                    placeholder="Question title"
                                    v-model="question.titleEN"
                                    @change="triggerAutoSave"
                                />
                            </div>

                            <!-- Type-specific content -->
                            <div class="q-editor__type-content">
                                <!-- Short Answer -->
                                <div v-if="question.type === 'short_answer'" class="q-type-placeholder">
                                    <input class="q-input q-input--bordered" disabled placeholder="Short answer text" />
                                </div>

                                <!-- Paragraph / Long Answer -->
                                <div v-else-if="question.type === 'paragraph'" class="q-type-placeholder">
                                    <textarea class="q-textarea q-input--bordered" disabled placeholder="Long answer text" rows="3" />
                                </div>

                                <!-- Multiple Choice -->
                                <div v-else-if="question.type === 'multiple_choice'" class="q-type-options">
                                    <div v-for="(opt, oIdx) in question.options" :key="oIdx" class="q-option">
                                        <div class="q-option__row">
                                            <div class="q-option__radio"></div>
                                            <div class="q-option__lang-label">TH</div>
                                            <input 
                                                class="q-input q-input--bordered"
                                                v-model="opt.labelTH"
                                                :placeholder="'Option ' + (oIdx + 1)"
                                                @change="triggerAutoSave"
                                            />
                                            <button class="q-option__delete" @click="removeOption(question, oIdx)">
                                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                    <path d="M4 4L12 12M12 4L4 12" stroke="#a3a3a3" stroke-width="1.5" stroke-linecap="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="q-option__row">
                                            <div class="q-option__radio"></div>
                                            <div class="q-option__lang-label">EN</div>
                                            <input 
                                                class="q-input q-input--bordered"
                                                v-model="opt.labelEN"
                                                :placeholder="'Option ' + (oIdx + 1)"
                                                @change="triggerAutoSave"
                                            />
                                        </div>
                                        <!-- Follow-up link -->
                                        <button 
                                            v-if="opt.hasFollowUp" 
                                            class="q-option__followup-link"
                                            @click="scrollToFollowUp(opt)"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M3 8L7 12L13 4" stroke="#f2a900" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                            Go to follow up question
                                        </button>
                                    </div>

                                    <div class="q-editor__actions-row">
                                        <button class="q-btn q-btn--text-red" @click="addFollowUpQuestion(question, qIndex)">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 3V13M3 8H13" stroke="#ba0c2f" stroke-width="1.5" stroke-linecap="round"/>
                                            </svg>
                                            Add follow-up question
                                        </button>
                                        <button class="q-btn q-btn--text-red" @click="addOption(question)">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 3V13M3 8H13" stroke="#ba0c2f" stroke-width="1.5" stroke-linecap="round"/>
                                            </svg>
                                            Add option
                                        </button>
                                    </div>
                                </div>

                                <!-- Rating -->
                                <div v-else-if="question.type === 'rating'" class="q-type-rating">
                                    <div class="q-type-rating__row">
                                        <label class="q-field__label">Max Rating</label>
                                        <input 
                                            class="q-input q-input--bordered q-input--sm"
                                            type="number"
                                            min="1"
                                            max="10"
                                            v-model.number="question.maxRating"
                                            @change="triggerAutoSave"
                                        />
                                    </div>
                                </div>

                                <!-- File Upload -->
                                <div v-else-if="question.type === 'file_upload'" class="q-type-file">
                                    <div class="q-type-file__row">
                                        <span class="q-field__label">Accepted file types</span>
                                        <div class="q-type-file__toggles">
                                            <label class="q-toggle" v-for="ft in fileTypes" :key="ft.key">
                                                <input 
                                                    type="checkbox" 
                                                    :checked="question.acceptedTypes && question.acceptedTypes.includes(ft.key)"
                                                    @change="toggleFileType(question, ft.key)"
                                                />
                                                <span class="q-toggle__slider"></span>
                                                <span class="q-toggle__label">{{ ft.label }}</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div class="q-type-file__row">
                                        <span class="q-field__label">Max number of files</span>
                                        <select class="q-select" v-model.number="question.maxFiles" @change="triggerAutoSave">
                                            <option :value="1">1</option>
                                            <option :value="3">3</option>
                                            <option :value="5">5</option>
                                            <option :value="10">10</option>
                                        </select>
                                    </div>
                                    <div class="q-type-file__row">
                                        <span class="q-field__label">Max file size</span>
                                        <select class="q-select" v-model="question.maxFileSize" @change="triggerAutoSave">
                                            <option value="1MB">1 MB</option>
                                            <option value="5MB">5 MB</option>
                                            <option value="10MB">10 MB</option>
                                            <option value="25MB">25 MB</option>
                                        </select>
                                    </div>
                                </div>

                                <!-- Title & Description (content element) -->
                                <div v-else-if="question.type === 'title_description'" class="q-type-title-desc">
                                    <div class="q-field">
                                        <label class="q-field__label">Title</label>
                                        <input class="q-input q-input--bordered" v-model="question.contentTitle" placeholder="Section title" @change="triggerAutoSave" />
                                    </div>
                                    <div class="q-field">
                                        <label class="q-field__label">Description</label>
                                        <textarea class="q-textarea q-input--bordered" v-model="question.contentDescription" placeholder="Section description" rows="2" @change="triggerAutoSave" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Delete button -->
                        <button class="q-editor__delete" @click="removeQuestion(qIndex)">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4H14M5.333 4V2.667A1.333 1.333 0 016.667 1.333h2.666A1.333 1.333 0 0110.667 2.667V4M12.667 4V13.333A1.333 1.333 0 0111.333 14.667H4.667A1.333 1.333 0 013.333 13.333V4" stroke="#a3a3a3" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Bottom section: Question type + Required toggle -->
                    <div class="q-editor__footer">
                        <div class="q-editor__footer-left">
                            <span class="q-editor__footer-label">Question Type</span>
                            <select class="q-select q-select--type" v-model="question.type" @change="onTypeChange(question)">
                                <option value="short_answer">Short Answer</option>
                                <option value="paragraph">Paragraph</option>
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="rating">Rating</option>
                                <option value="file_upload">File Upload</option>
                            </select>
                        </div>
                        <div class="q-editor__footer-right">
                            <span class="q-editor__footer-label">Required</span>
                            <button 
                                class="q-toggle-switch"
                                :class="{ 'q-toggle-switch--on': question.required }"
                                @click="question.required = !question.required; triggerAutoSave()"
                            >
                                <span class="q-toggle-switch__knob"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-if="questions.length === 0" class="q-empty">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                        <rect x="4" y="8" width="40" height="32" rx="4" stroke="#d4d4d4" stroke-width="2"/>
                        <path d="M16 20H32M16 28H28" stroke="#d4d4d4" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>No questions yet. Add one from the sidebar.</p>
                </div>
            </div>

            <!-- Right: Sidebar -->
            <div class="tab-question__sidebar">
                <div class="q-sidebar">
                    <div class="q-sidebar__section">
                        <h4 class="q-sidebar__heading">Question Types</h4>
                        <button class="q-sidebar__btn" @click="addQuestion('short_answer')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="6" width="16" height="2" rx="1" fill="#525252"/>
                                <rect x="2" y="12" width="10" height="2" rx="1" fill="#525252"/>
                            </svg>
                            <span>Short Answer</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('paragraph')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="4" width="16" height="2" rx="1" fill="#525252"/>
                                <rect x="2" y="9" width="16" height="2" rx="1" fill="#525252"/>
                                <rect x="2" y="14" width="10" height="2" rx="1" fill="#525252"/>
                            </svg>
                            <span>Paragraph</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('multiple_choice')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="5" cy="6" r="2.5" stroke="#525252" stroke-width="1.5"/>
                                <circle cx="5" cy="14" r="2.5" stroke="#525252" stroke-width="1.5"/>
                                <rect x="10" y="5" width="8" height="2" rx="1" fill="#525252"/>
                                <rect x="10" y="13" width="8" height="2" rx="1" fill="#525252"/>
                            </svg>
                            <span>Multiple Choice</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('rating')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 2L12.47 7.01L18 7.81L14 11.69L14.94 17.19L10 14.63L5.06 17.19L6 11.69L2 7.81L7.53 7.01L10 2Z" stroke="#525252" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Rating</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('file_upload')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 13V3M10 3L7 6M10 3L13 6" stroke="#525252" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M3 13V15C3 16.1 3.9 17 5 17H15C16.1 17 17 16.1 17 15V13" stroke="#525252" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>File Upload</span>
                        </button>
                    </div>

                    <div class="q-sidebar__divider"></div>

                    <div class="q-sidebar__section">
                        <h4 class="q-sidebar__heading">Content Elements</h4>
                        <button class="q-sidebar__btn" @click="addQuestion('title_description')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="3" width="16" height="3" rx="1" fill="#525252"/>
                                <rect x="2" y="9" width="16" height="2" rx="1" fill="#a3a3a3"/>
                                <rect x="2" y="14" width="12" height="2" rx="1" fill="#a3a3a3"/>
                            </svg>
                            <span>Title &amp; Description</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('image')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="3" width="16" height="14" rx="2" stroke="#525252" stroke-width="1.5"/>
                                <circle cx="7" cy="8" r="1.5" fill="#525252"/>
                                <path d="M2 14L6 10L10 14L14 8L18 14" stroke="#525252" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>Image</span>
                        </button>
                        <button class="q-sidebar__btn" @click="addQuestion('section_divider')">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <rect x="2" y="9" width="16" height="2" rx="1" fill="#525252"/>
                                <rect x="6" y="4" width="8" height="2" rx="1" fill="#a3a3a3"/>
                                <rect x="6" y="14" width="8" height="2" rx="1" fill="#a3a3a3"/>
                            </svg>
                            <span>Section Divider</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TabQuestion',
    props: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        questions: { type: Array, default: () => [] }
    },
    data() {
        return {
            fileTypes: [
                { key: 'pdf', label: 'PDF' },
                { key: 'image', label: 'Image' },
                { key: 'doc', label: 'Document' },
                { key: 'spreadsheet', label: 'Spreadsheet' },
            ]
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        addQuestion(type) {
            const base = {
                id: Date.now(),
                titleTH: '',
                titleEN: '',
                type: type,
                required: false,
                isFollowUp: false,
            };

            if (type === 'multiple_choice') {
                base.options = [
                    { labelTH: '', labelEN: '', hasFollowUp: false },
                    { labelTH: '', labelEN: '', hasFollowUp: false }
                ];
            } else if (type === 'rating') {
                base.maxRating = 5;
            } else if (type === 'file_upload') {
                base.acceptedTypes = ['pdf', 'image'];
                base.maxFiles = 1;
                base.maxFileSize = '10MB';
            } else if (type === 'title_description') {
                base.contentTitle = '';
                base.contentDescription = '';
            }

            this.questions.push(base);
            this.triggerAutoSave();
        },
        removeQuestion(index) {
            this.questions.splice(index, 1);
            this.triggerAutoSave();
        },
        addOption(question) {
            if (!question.options) {
                this.$set(question, 'options', []);
            }
            question.options.push({ labelTH: '', labelEN: '', hasFollowUp: false });
            this.triggerAutoSave();
        },
        removeOption(question, optIndex) {
            question.options.splice(optIndex, 1);
            this.triggerAutoSave();
        },
        addFollowUpQuestion(parentQuestion, parentIndex) {
            const followUp = {
                id: Date.now(),
                titleTH: '',
                titleEN: '',
                type: 'short_answer',
                required: false,
                isFollowUp: true,
                parentNumber: parentIndex + 1,
                subNumber: 1,
            };
            // Insert after the parent question
            const insertAt = parentIndex + 1;
            this.questions.splice(insertAt, 0, followUp);
            this.triggerAutoSave();
        },
        onTypeChange(question) {
            if (question.type === 'multiple_choice' && !question.options) {
                this.$set(question, 'options', [
                    { labelTH: '', labelEN: '', hasFollowUp: false },
                    { labelTH: '', labelEN: '', hasFollowUp: false }
                ]);
            }
            if (question.type === 'rating' && !question.maxRating) {
                this.$set(question, 'maxRating', 5);
            }
            if (question.type === 'file_upload') {
                if (!question.acceptedTypes) this.$set(question, 'acceptedTypes', ['pdf', 'image']);
                if (!question.maxFiles) this.$set(question, 'maxFiles', 1);
                if (!question.maxFileSize) this.$set(question, 'maxFileSize', '10MB');
            }
            this.triggerAutoSave();
        },
        toggleFileType(question, key) {
            if (!question.acceptedTypes) {
                this.$set(question, 'acceptedTypes', []);
            }
            const idx = question.acceptedTypes.indexOf(key);
            if (idx > -1) {
                question.acceptedTypes.splice(idx, 1);
            } else {
                question.acceptedTypes.push(key);
            }
            this.triggerAutoSave();
        },
        scrollToFollowUp() {
            // Placeholder for scrolling to follow-up question
        }
    }
}
</script>

<style scoped lang="scss">
/* ===== Layout ===== */
.tab-question {
    display: flex;
    flex-direction: column;
    gap: 24px;

    &__layout {
        display: flex;
        gap: 24px;
        align-items: flex-start;
    }

    &__main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    &__sidebar {
        width: 256px;
        flex-shrink: 0;
        position: sticky;
        top: 20px;
    }
}

/* ===== Card ===== */
.q-card {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);

    &__body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}

/* ===== Inputs ===== */
.q-input {
    width: 100%;
    height: 36px;
    padding: 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.15px;
    color: #333;
    background: transparent;
    border: none;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder {
        color: #909090;
    }

    &--underline {
        background: rgba(229, 229, 229, 0.3);
        border-bottom: 1px solid #e5e5e5;
    }

    &--bordered {
        background: rgba(229, 229, 229, 0.3);
        border: 1px solid #e5e5e5;
        border-radius: 12px;
    }

    &--lg {
        font-size: 20px;
        font-weight: 600;
        height: 44px;
        line-height: 28px;
    }

    &--sm {
        width: 80px;
        text-align: center;
    }

    &:focus {
        border-color: #ba0c2f;
    }
}

.q-textarea {
    width: 100%;
    padding: 8px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: -0.15px;
    color: #333;
    background: transparent;
    border: none;
    outline: none;
    resize: vertical;
    transition: border-color 0.15s;

    &::placeholder {
        color: #909090;
    }
}

.q-select {
    height: 36px;
    padding: 4px 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #333;
    background: rgba(229, 229, 229, 0.3);
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23737373' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;

    &--type {
        width: 200px;
    }
}

/* ===== Field ===== */
.q-field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__label {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #333;
        line-height: 20px;
        letter-spacing: -0.15px;
    }
}

/* ===== Question Editor ===== */
.q-editor {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
    padding: 24px;

    &--followup {
        border-color: #fde68a;
        border-width: 2px;
        background: linear-gradient(180deg, #fffbeb 0%, #fff 100%);
    }

    &__followup-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
    }

    &__followup-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 24px;
        padding: 0 8px;
        border-radius: 8px;
        background: #f2a900;
        color: #fff;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 700;
    }

    &__followup-label {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }

    &__row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }

    &__drag-handle {
        flex-shrink: 0;
        width: 20px;
        padding-top: 8px;
        cursor: grab;
        opacity: 0.5;
        transition: opacity 0.15s;

        &:hover {
            opacity: 1;
        }
    }

    &__number {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        background: #f5f5f5;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: #525252;
        margin-top: 4px;
    }

    &__content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__lang-label {
        flex-shrink: 0;
        width: 50px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #909090;
        background: rgba(229, 229, 229, 0.3);
        border-bottom: 1px solid #e5e5e5;
    }

    &__type-content {
        margin-top: 8px;
    }

    &__actions-row {
        display: flex;
        gap: 16px;
        margin-top: 12px;
    }

    &__delete {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
            background: #fee2e2;
            svg path {
                stroke: #dc2626;
            }
        }
    }

    &__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #e5e5e5;
    }

    &__footer-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__footer-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    &__footer-label {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #333;
    }
}

/* ===== Options (Multiple Choice) ===== */
.q-type-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.q-option {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &__row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__radio {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: 2px solid #d4d4d4;
        border-radius: 50%;
    }

    &__lang-label {
        flex-shrink: 0;
        width: 50px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #909090;
        background: rgba(229, 229, 229, 0.3);
        border-bottom: 1px solid #e5e5e5;
    }

    &__delete {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;

        &:hover {
            background: #fee2e2;
        }
    }

    &__followup-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 0;
        border: none;
        background: transparent;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #f2a900;
        cursor: pointer;
        margin-left: 28px;

        &:hover {
            text-decoration: underline;
        }
    }
}

/* ===== Rating ===== */
.q-type-rating {
    &__row {
        display: flex;
        align-items: center;
        gap: 12px;
    }
}

/* ===== File Upload ===== */
.q-type-file {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    &__toggles {
        display: flex;
        gap: 12px;
    }
}

.q-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    color: #333;

    input {
        display: none;
    }

    &__slider {
        width: 32px;
        height: 18px;
        background: rgba(229, 229, 229, 0.8);
        border-radius: 999px;
        position: relative;
        transition: background 0.2s;

        &::after {
            content: '';
            position: absolute;
            top: 1px;
            left: 1px;
            width: 16px;
            height: 16px;
            background: #0a0a0a;
            border-radius: 50%;
            transition: transform 0.2s;
        }
    }

    input:checked + &__slider {
        background: #ba0c2f;

        &::after {
            transform: translateX(14px);
            background: #fff;
        }
    }
}

/* ===== Title & Description type ===== */
.q-type-title-desc {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* ===== Toggle Switch (Required) ===== */
.q-toggle-switch {
    width: 32px;
    height: 18px;
    background: rgba(229, 229, 229, 0.8);
    border: 1px solid transparent;
    border-radius: 999px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
    padding: 1px;
    display: flex;
    align-items: center;

    &__knob {
        width: 16px;
        height: 16px;
        background: #0a0a0a;
        border-radius: 50%;
        transition: transform 0.2s, background 0.2s;
    }

    &--on {
        background: #ba0c2f;

        .q-toggle-switch__knob {
            transform: translateX(14px);
            background: #fff;
        }
    }
}

/* ===== Buttons ===== */
.q-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: none;
    background: transparent;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
    line-height: 20px;
    letter-spacing: -0.15px;

    &--text-red {
        color: #ba0c2f;

        &:hover {
            background: rgba(186, 12, 47, 0.06);
        }
    }
}

/* ===== Sidebar ===== */
.q-sidebar {
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
    padding: 17px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    &__section {
        display: flex;
        flex-direction: column;
    }

    &__heading {
        font-family: 'Inter', sans-serif;
        font-size: 20px;
        font-weight: 600;
        color: #333;
        line-height: 28px;
        letter-spacing: -0.45px;
        margin: 0;
        padding: 8px 12px;
    }

    &__btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border: none;
        background: transparent;
        border-radius: 16px;
        cursor: pointer;
        transition: background 0.15s;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #333;
        line-height: 20px;
        letter-spacing: -0.15px;

        &:hover {
            background: #f5f5f5;
        }
    }

    &__divider {
        height: 1px;
        background: #e5e5e5;
    }
}

/* ===== Empty State ===== */
.q-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px 24px;
    background: #fff;
    border: 1px solid #e5e5e5;
    border-radius: 16px;
    color: #909090;
    font-family: 'Inter', sans-serif;
    font-size: 14px;

    p {
        margin: 0;
    }
}

/* ===== Responsive ===== */
@media (max-width: 992px) {
    .tab-question__layout {
        flex-direction: column-reverse;
    }

    .tab-question__sidebar {
        width: 100%;
        position: static;
    }

    .q-sidebar {
        flex-direction: row;
        flex-wrap: wrap;
    }

    .q-sidebar__section {
        flex: 1;
        min-width: 200px;
    }

    .q-sidebar__divider {
        width: 1px;
        height: auto;
        align-self: stretch;
    }
}
</style>
