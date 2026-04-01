<template>
    <div class="answer-table-premium">
        <CDataTable :items="answers" :fields="answerFields" hover class="mb-0 custom-premium-table">
            
            <!-- ID / Index Column -->
            <template #id="{ item, index }">
                <td class="align-middle pl-4 shadow-none border-0">
                    <div class="index-pill">{{ index + 1 }}</div>
                </td>
            </template>

            <!-- Question Column -->
            <template #question="{ item }">
                <td class="align-middle border-0 py-4" style="width: 45%;">
                    <div class="d-flex align-items-start">
                        <div class="q-type-icon mr-3 mt-1">
                            <CIcon :name="getQuestionIcon(item.question)" size="sm" />
                        </div>
                        <div>
                            <h6 class="font-weight-bold text-dark mb-1 question-text">
                                {{ getTitle(item.question && item.question.title) || 'Untitled Question' }}
                            </h6>
                            <div class="text-muted extra-small font-weight-bold text-uppercase letter-spacing-1">
                                {{ getQuestionTypeLabel(item.question) }}
                            </div>
                        </div>
                    </div>
                </td>
            </template>

            <!-- Response Column -->
            <template #response="{ item }">
                <td class="align-middle border-0 py-4">
                    <div class="response-content">
                        <!-- Empty State -->
                        <template v-if="isEmpty(item.response)">
                            <span class="empty-text font-italic">No response provided</span>
                        </template>

                        <!-- List / Multi-select (Labels resolved) -->
                        <template v-else-if="Array.isArray(resolveResponse(item))">
                            <div class="d-flex flex-wrap gap-2">
                                <span v-for="(val, i) in resolveResponse(item)" :key="i" class="response-pill">
                                    {{ val }}
                                </span>
                            </div>
                        </template>

                        <!-- Rating Style -->
                        <template v-else-if="isRating(item.question)">
                            <div class="rating-display">
                                <div class="rating-bar-bg mr-3">
                                    <div class="rating-bar-fill" :style="{ width: (Number(item.response) / getRatingMax(item.question) * 100) + '%' }"></div>
                                </div>
                                <span class="rating-values">
                                    <strong class="text-primary">{{ item.response }}</strong>
                                    <span class="text-muted"> / {{ getRatingMax(item.question) }}</span>
                                </span>
                            </div>
                        </template>

                        <!-- File / Link -->
                        <template v-else-if="isFilePath(item.response)">
                            <a :href="item.response" target="_blank" class="file-response-link">
                                <CIcon name="cil-file" class="mr-2" />
                                <span>{{ getFileName(item.response) }}</span>
                            </a>
                        </template>

                        <!-- Standard Text or Single Choice Label -->
                        <template v-else>
                            <div class="text-response-box">
                                {{ resolveResponse(item) }}
                            </div>
                        </template>
                    </div>
                </td>
            </template>

        </CDataTable>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    name: 'AnswerTable',
    props: {
        answers: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
        return {
            answerFields: [
                { key: 'id', label: '#', _style: 'width: 80px;' },
                { key: 'question', label: 'QUESTION DETAILS' },
                { key: 'response', label: 'SUBMITTED ANSWER' }
            ]
        }
    },
    computed: {
        ...mapGetters('Setting', ['lang'])
    },
    methods: {
        getTitle(titleArr) {
            if (!titleArr || !Array.isArray(titleArr) || titleArr.length === 0) return '';
            const currentLang = this.lang || 'en';
            let content = titleArr.find(t => t.key && t.key.toLowerCase() === currentLang.toLowerCase());
            if (!content) content = titleArr.find(t => t.key && t.key.toLowerCase() === 'en');
            if (!content) content = titleArr[0];
            return content ? content.value : '';
        },
        isEmpty(val) {
            if (val === null || val === undefined || val === '') return true;
            if (Array.isArray(val) && val.length === 0) return true;
            return false;
        },
        isRating(question) {
            if (!question || !question.type) return false;
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            return t === 'rating' || t === 'rate';
        },
        getRatingMax(question) {
            if (question && question.config && question.config.maxRate) {
                return Number(question.config.maxRate);
            }
            return 5;
        },
        isFilePath(val) {
            if (typeof val !== 'string') return false;
            return val.includes('\\') || val.includes('/') || val.startsWith('http');
        },
        getFileName(path) {
            if (!path) return 'File';
            const parts = path.split(/[\\/]/);
            return parts[parts.length - 1];
        },
        JSON_parse(val) {
            if (!val) return null;
            if (Array.isArray(val)) return val;
            try {
                const parsed = JSON.parse(val);
                return Array.isArray(parsed) ? parsed : null;
            } catch (e) {
                return null;
            }
        },
        getQuestionIcon(question) {
            if (!question || !question.type) return 'cil-help';
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            switch (t) {
                case 'short_answer': return 'cil-short-text';
                case 'paragraph': return 'cil-align-left';
                case 'multiple_choice': return 'cil-list';
                case 'checkboxes': return 'cil-check-square';
                case 'dropdown': return 'cil-arrow-circle-bottom';
                case 'rating': return 'cil-star';
                case 'date': return 'cil-calendar';
                case 'time': return 'cil-clock';
                case 'file_upload': return 'cil-cloud-upload';
                default: return 'cil-notes';
            }
        },
        getQuestionTypeLabel(question) {
            if (!question || !question.type) return 'Unknown Type';
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            switch (t) {
                case 'short_answer': case 'short': return 'Short Text';
                case 'paragraph': return 'Long Paragraph';
                case 'multiple_choice': return 'Multiple choice';
                case 'checkboxes': case 'checkbox': return 'Checkboxes';
                case 'dropdown': return 'Dropdown';
                case 'rating': case 'rate': return 'Rating Score';
                case 'date': return 'Date';
                case 'time': return 'Time';
                case 'file_upload': case 'file': return 'File Upload';
                case 'image': return 'Image';
                case 'video': return 'Video';
                default:
                    return t.charAt(0).toUpperCase() + t.slice(1);
            }
        },
        getChoiceLabel(question, val) {
            if (!question || !question.config || !question.config.choices) return val;
            const choice = question.config.choices.find(c => String(c.key) === String(val));
            if (choice && choice.lang) {
                return this.getTitle(choice.lang) || val;
            }
            return val;
        },
        resolveResponse(item) {
            const raw = item.response;
            if (this.isEmpty(raw)) return null;

            // Handle multi-select/checkbox (often stored as JSON array of keys)
            const parsed = this.JSON_parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map(v => this.getChoiceLabel(item.question, v));
            }

            // Handle single choice (Multiple Choice / Dropdown)
            const t = item.question?.type?.type?.toLowerCase() || '';
            if (['multiple_choice', 'dropdown'].includes(t)) {
                return this.getChoiceLabel(item.question, raw);
            }

            return raw;
        }
    }
}
</script>

<style scoped>
/* Premium Table Core Matching ResponseTables.vue */
.answer-table-premium {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

::v-deep .custom-premium-table table {
    margin-bottom: 0;
}

::v-deep .custom-premium-table thead th {
    background-color: #f8fafc !important;
    color: #64748b !important;
    font-size: 0.75rem !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em;
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-premium-table tbody td {
    padding: 12px 24px !important;
    border: none !important;
    border-bottom: 1px solid #f8fafc !important;
    background: white;
}

::v-deep .custom-premium-table tbody tr:hover td {
    background-color: #fcfdfe !important;
}

/* UI Elements */
.index-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
}

.q-type-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 8px;
}

.question-text {
    font-size: 0.95rem;
    line-height: 1.4;
    color: #1e293b !important;
}

.extra-small {
    font-size: 0.65rem;
}

.letter-spacing-1 {
    letter-spacing: 0.05em;
}

/* Response Formatting */
.response-content {
    min-height: 40px;
    display: flex;
    align-items: center;
}

.empty-text {
    color: #94a3b8;
    font-size: 0.9rem;
}

.text-response-box {
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
    color: #334155;
    font-size: 0.9rem;
    line-height: 1.5;
    width: 100%;
    white-space: pre-wrap;
}

.response-pill {
    padding: 4px 12px;
    background: #eff6ff;
    color: #2563eb;
    border-radius: 50rem;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid #dbeafe;
}

/* Rating Bar UI */
.rating-display {
    display: flex;
    align-items: center;
    width: 100%;
}

.rating-bar-bg {
    flex-grow: 1;
    max-width: 150px;
    height: 8px;
    background: #f1f5f9;
    border-radius: 10px;
    overflow: hidden;
}

.rating-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #2563eb);
    border-radius: 10px;
}

.rating-values {
    font-size: 0.9rem;
    white-space: nowrap;
}

/* File Link UI */
.file-response-link {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #dcfce7;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none !important;
    transition: all 0.2s ease;
}

.file-response-link:hover {
    background: #dcfce7;
    transform: translateY(-1px);
}

.gap-2 {
    gap: 0.5rem;
}
</style>
