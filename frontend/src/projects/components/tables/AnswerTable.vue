<template>
    <div class="answer-table-premium">
        <CDataTable :items="pagedAnswers" :fields="answerFields" hover class="mb-0 custom-premium-table">

            <!-- ID / Index Column -->
            <template #id="{ item, index }">
                <td class="align-middle pl-4 shadow-none border-0">
                    <div class="index-pill">{{ (activePage - 1) * perPage + index + 1 }}</div>
                </td>
            </template>

            <!-- Question Column -->
            <template #question="{ item }">
                <td class="align-middle border-0 py-3 py-md-4 question-col-cell">
                    <div class="d-flex align-items-start">
                        <div class="q-type-icon mr-3 mt-1">
                            <CIcon :name="getQuestionIcon(item.question)" size="sm" />
                        </div>
                        <div>
                            <h6 class="font-weight-bold text-dark mb-1 question-text">
                                {{ getLang(item.question && item.question.title) || 'Untitled Question' }}
                            </h6>
                            <div class="d-flex align-items-center">
                                <span class="badge-type-custom">
                                    {{ getQuestionTypeLabel(item.question) }}
                                </span>
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

                        <!-- List / Multi-select (Labels resolved) or Multi-file -->
                        <template v-else-if="Array.isArray(resolveResponse(item))">
                            <div class="d-flex flex-wrap gap-2">
                                <template v-for="(val, i) in resolveResponse(item)">
                                    <!-- Image in Array -->
                                    <template v-if="isImagePath(val)">
                                        <a v-if="hasFileUrl(val)" :key="i" :href="resolveFileUrl(val)" target="_blank"
                                            rel="noopener noreferrer"
                                            class="file-response-link p-1 border-0 bg-transparent shadow-none">
                                            <img v-if="!imgErrors[val]" :src="resolveFileUrl(val)"
                                                class="answer-image-preview sm" loading="lazy"
                                                @error="$set(imgErrors, val, true)" />
                                            <div v-else
                                                class="file-response-link p-1 d-inline-flex align-items-center bg-light rounded shadow-sm"
                                                style="font-size: 0.8125rem;">
                                                <CIcon name="cil-image1" class="mr-1 text-muted" style="width: 14px" />
                                                <span class="text-truncate" style="max-width: 140px">{{ getFileName(val)
                                                    }}</span>
                                            </div>
                                        </a>
                                        <div v-else :key="i"
                                            class="file-response-link p-1 d-inline-flex align-items-center bg-light rounded shadow-sm"
                                            style="font-size: 0.8125rem;">
                                            <CIcon name="cil-image1" class="mr-1 text-muted" style="width: 14px" />
                                            <span class="text-truncate" style="max-width: 140px">{{ getFileName(val)
                                                }}</span>
                                        </div>
                                    </template>
                                    <!-- File in Array -->
                                    <template v-else-if="isFilePath(val, item.question)">
                                        <a v-if="hasFileUrl(val)" :key="i" :href="resolveFileUrl(val)" target="_blank"
                                            rel="noopener noreferrer"
                                            class="file-response-link p-1 d-inline-flex align-items-center bg-light rounded shadow-sm"
                                            style="font-size: 0.8125rem;">
                                            <CIcon name="cil-paperclip" class="mr-1 text-primary" style="width: 14px" />
                                            <span class="text-truncate" style="max-width: 140px">{{ getFileName(val)
                                                }}</span>
                                        </a>
                                        <div v-else :key="i"
                                            class="file-response-link p-1 d-inline-flex align-items-center bg-light rounded shadow-sm"
                                            style="font-size: 0.8125rem;">
                                            <CIcon name="cil-paperclip" class="mr-1 text-primary" style="width: 14px" />
                                            <span class="text-truncate" style="max-width: 140px">{{ getFileName(val)
                                                }}</span>
                                        </div>
                                    </template>
                                    <!-- Standard Pill -->
                                    <span v-else :key="i" class="response-pill">
                                        {{ val }}
                                    </span>
                                </template>
                            </div>
                        </template>

                        <!-- Rating Style -->
                        <template v-else-if="isRating(item.question)">
                            <div class="rating-display">
                                <div class="rating-bar-bg mr-3">
                                    <div class="rating-bar-fill"
                                        :style="{ width: (Number(item.response) / getRatingMax(item.question) * 100) + '%' }">
                                    </div>
                                </div>
                                <span class="rating-values">
                                    <strong class="text-primary">{{ item.response }}</strong>
                                    <span class="text-muted"> / {{ getRatingMax(item.question) }}</span>
                                </span>
                            </div>
                        </template>

                        <!-- Image Preview -->
                        <template v-else-if="isImagePath(item.response)">
                            <a v-if="hasFileUrl(item.response)" :href="resolveFileUrl(item.response)" target="_blank" rel="noopener noreferrer"
                                class="file-response-link">
                                <img v-if="!imgErrors[item.response]" :src="resolveFileUrl(item.response)"
                                    class="answer-image-preview" loading="lazy"
                                    @error="$set(imgErrors, item.response, true)" />
                                <div v-else
                                    class="file-response-link bg-light p-2 rounded shadow-sm d-flex align-items-center">
                                    <CIcon name="cil-camera" class="mr-2 text-muted" />
                                    <span class="small">{{ getFileName(item.response) }}</span>
                                </div>
                            </a>
                            <div v-else
                                class="file-response-link bg-light p-2 rounded shadow-sm d-flex align-items-center">
                                <CIcon name="cil-image1" class="mr-2 text-muted" />
                                <span class="small">{{ getFileName(item.response) }}</span>
                            </div>
                        </template>

                        <!-- File / Link -->
                        <template v-else-if="isFilePath(item.response, item.question)">
                            <a v-if="hasFileUrl(item.response)" :href="resolveFileUrl(item.response)" target="_blank" rel="noopener noreferrer"
                                class="file-response-link bg-light p-2 rounded shadow-sm d-flex align-items-center">
                                <CIcon name="cil-paperclip" class="mr-2 text-primary" />
                                <span class="small">{{ getFileName(item.response) }}</span>
                            </a>
                            <div v-else class="file-response-link bg-light p-2 rounded shadow-sm d-flex align-items-center">
                                <CIcon name="cil-paperclip" class="mr-2 text-primary" />
                                <span class="small">{{ getFileName(item.response) }}</span>
                            </div>
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

        <Pagination
            v-if="(answers || []).length > 0"
            class="p-3 border-top"
            :activePage.sync="activePage"
            :pages="totalPages"
            :showPerPage="true"
            :itemsPerPage.sync="perPage"
            :totalItems="(answers || []).length"
            noMargin
        />
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Pagination from '@/projects/components/Util/Pagination.vue';
import localeMixin from '@/mixins/localeMixin';
import { isFreeTextQuestionType, normalizeQuestionTypeKey } from '@/projects/utils/formPolicy';

export default {
    name: 'AnswerTable',
    mixins: [localeMixin],
    components: { Pagination },
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
            ],
            activePage: 1,
            perPage: 5,
            imgErrors: {}
        }
    },
    created() {
        this.$store.dispatch('Setting/question_type/get');
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type_list: 'item' }),
        questionTypes() {
            if (!this.question_type_list || !Array.isArray(this.question_type_list)) return [];
            return this.question_type_list.map(type => ({
                _id: type._id,
                type: type.type,
            }));
        },
        totalPages() {
            return Math.max(1, Math.ceil((this.answers || []).length / this.perPage));
        },
        pagedAnswers() {
            const start = (this.activePage - 1) * this.perPage;
            return (this.answers || []).slice(start, start + this.perPage);
        }
    },
    watch: {
        answers() {
            this.activePage = 1;
        },
        perPage() {
            this.activePage = 1;
        }
    },
    methods: {
        isEmpty(val) {
            if (val === null || val === undefined || val === '') return true;
            if (Array.isArray(val) && val.length === 0) return true;
            return false;
        },
        getQuestionTypeStr(question) {
            if (!question || !question.type) return '';
            let t = (question.type.type || question.type || '').toString().toLowerCase();
            if (/^[0-9a-fA-F]{24}$/.test(t) && this.questionTypes.length) {
                const found = this.questionTypes.find(type => type._id === t);
                if (found) t = found.type.toLowerCase();
            }
            return t;
        },
        isRating(question) {
            const t = this.getQuestionTypeStr(question);
            return t === 'rating' || t === 'rate';
        },
        getRatingMax(question) {
            if (question && question.config && question.config.maxRate) {
                return Number(question.config.maxRate);
            }
            return 5;
        },
        hasFileUrl(val) {
            if (typeof val !== 'string') return false;
            return val.includes('\\') || val.includes('/') || val.startsWith('http') || val.startsWith('data:');
        },
        isFilePath(val, question) {
            if (typeof val !== 'string' || !val.trim()) return false;
            if (this.hasFileUrl(val)) return true;
            return this.getQuestionTypeStr(question).includes('file');
        },
        isImagePath(val) {
            if (typeof val !== 'string') return false;
            const lower = val.toLowerCase();
            let isImg = false;
            if (lower.startsWith('data:image/')) isImg = true;
            else isImg = /\.(png|jpe?g|gif|webp|svg)$/i.test(lower);

            return isImg;
        },
        resolveFileUrl(value) {
            if (!value || typeof value !== 'string') return '#';
            if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
                return value;
            }

            const apiBase = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1/';
            const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');

            // Clean up double slashes
            const cleanValue = value.startsWith('/') ? value.slice(1) : value;
            const url = `${backendOrigin}/${cleanValue}`;
            return url;
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
            const t = normalizeQuestionTypeKey(this.getQuestionTypeStr(question));
            if (!t) return 'cil-notes';

            switch (t) {
                case 'free_text': return 'cil-align-left';
                case 'multiple_choice': return 'cil-list';
                case 'checkbox':
                case 'checkboxes': return 'cil-square';
                case 'dropdown': return 'cil-arrow-circle-bottom';
                case 'rating': return 'cil-star';
                case 'date': return 'cil-calendar';
                case 'time': return 'cil-clock';
                case 'file_upload': return 'cil-cloud-upload';
                default: return 'cil-notes';
            }
        },
        getQuestionTypeLabel(question) {
            const t = this.getQuestionTypeStr(question);
            if (!t) return 'Unknown Type';
            if (isFreeTextQuestionType(t)) return 'Free Text';

            switch (t) {
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
                    // If it looks like a MongoDB ObjectID (24 hex chars), don't display it as a label
                    if (/^[0-9a-fA-F]{24}$/.test(t)) return 'Unknown Type';
                    return t.charAt(0).toUpperCase() + t.slice(1);
            }
        },
        getChoiceLabel(question, val) {
            const choices = (question && question.config && Array.isArray(question.config.choices))
                ? question.config.choices
                : (question && Array.isArray(question.options) ? question.options : null);
            if (!choices || choices.length === 0) return val;
            let choice = choices.find(c => c && (String(c.key) === String(val) || String(c._id) === String(val) || String(c.value) === String(val)));
            if (!choice && val !== '' && val !== null && !isNaN(val) && choices[Number(val)]) {
                choice = choices[Number(val)];
            }
            if (choice) {
                const resolved = (choice.lang && Array.isArray(choice.lang))
                    ? this.getLang(choice.lang)
                    : (choice.label ? this.getLang(choice.label) : this.getLang(choice));
                if (resolved) return resolved;
                if (choice.value) return choice.value;
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
            const t = this.getQuestionTypeStr(item.question);
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
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

::v-deep .custom-premium-table table {
    margin-bottom: 0;
}

::v-deep .custom-premium-table thead th {
    background-color: #f8fafc !important;
    color: #64748b !important;
    font-size: 0.8125rem !important;
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
    font-size: 0.8125rem;
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
    font-size: 0.8125rem;
}

.letter-spacing-1 {
    letter-spacing: 0.05em;
}

.badge-type-custom {
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background-color: #f0f7ff;
    color: #007bff;
    padding: 3px 10px;
    border-radius: 100px;
    display: inline-block;
    border: 1px solid #d0e7ff;
}

/* Response Formatting */
.response-content {
    min-height: 40px;
    display: flex;
    align-items: center;
}

.empty-text {
    color: #64748b;
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
    font-size: 0.8125rem;
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

.answer-image-preview {
    max-width: 220px;
    max-height: 140px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    object-fit: cover;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.answer-image-preview:hover {
    transform: scale(1.02);
}

.answer-image-preview.sm {
    max-width: 100px;
    max-height: 70px;
    border-radius: 8px;
}

.gap-2 {
    gap: 0.5rem;
}

.question-col-cell {
    width: 45%;
}

@media (max-width: 767.98px) {
    .question-col-cell {
        width: auto;
        min-width: 190px;
    }

    ::v-deep .custom-premium-table thead th {
        padding: 12px 12px !important;
    }

    ::v-deep .custom-premium-table tbody td {
        padding: 12px 12px !important;
    }

    .answer-image-preview {
        max-width: 160px;
    }
}
</style>
