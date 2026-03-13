<template>
    <!-- Answers Table matching Design -->
    <CDataTable :items="answers" :fields="answerFields" hover class="mb-0 custom-table">

        <!-- Index / # Column -->
        <template #id="{ item, index }">
            <td class="align-middle text-center" style="width: 50px;">
                <div class="index-circle">{{ index + 1 }}</div>
            </td>
        </template>

        <!-- Question Column -->
        <template #question="{ item }">
            <td class="align-middle" style="width: 45%;">
                <h6 class="font-weight-bold text-dark mb-1" style="font-size: 0.95rem;">
                    {{ getTitle(item.question && item.question.title) || 'Unknown Question' }}
                </h6>
                <div class="text-muted small">
                    {{ getQuestionTypeLabel(item.question) }}
                </div>
            </td>
        </template>

        <!-- Response Column -->
        <template #response="{ item }">
            <td class="align-middle">
                <template v-if="isEmpty(item.response)">
                    <span class="text-muted font-italic">No response</span>
                </template>
                <template v-else-if="Array.isArray(item.response)">
                    <span class="text-dark">{{ item.response.join(', ') }}</span>
                </template>
                <template v-else-if="isRating(item.question)">
                    <div class="d-flex align-items-center h6 mb-0">
                        <strong class="text-warning mr-2" style="font-size: 1.1rem;">{{ item.response }}</strong>
                        <span class="text-muted small"> / {{ getRatingMax(item.question) }}</span>
                    </div>
                </template>
                <template v-else>
                    <span class="text-dark" style="white-space: pre-wrap;">{{ item.response }}</span>
                </template>
            </td>
        </template>

    </CDataTable>
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
                { key: 'id', label: '#' },
                { key: 'question', label: 'Question' },
                { key: 'response', label: 'Response' }
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
        getQuestionTypeLabel(question) {
            if (!question || !question.type) return 'Unknown Type';
            const t = question.type.type ? question.type.type.toLowerCase() : '';
            switch (t) {
                case 'short_answer': case 'short': return 'Short Paragraph';
                case 'paragraph': return 'Paragraph';
                case 'multiple_choice': return 'Multiple choice';
                case 'checkboxes': case 'checkbox': return 'Checkbox';
                case 'dropdown': return 'Dropdown';
                case 'rating': case 'rate': return 'Rating';
                case 'date': return 'Date';
                case 'time': return 'Time';
                case 'file_upload': case 'file': return 'File upload';
                case 'image': return 'Image';
                case 'video': return 'Video';
                default:
                    return t.charAt(0).toUpperCase() + t.slice(1);
            }
        }
    }
}
</script>

<style scoped>
/* Custom Answers Table Styling matching ResponseTables */
::v-deep .custom-table table {
    margin-bottom: 0;
    border-collapse: separate;
    border-spacing: 0;
}

/* Header Styling */
::v-deep .custom-table thead th {
    background-color: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    text-transform: capitalize !important;
    letter-spacing: normal;
    border: none !important;
    border-bottom: 1px solid #e2e8f0 !important;
    padding: 16px 24px !important;
    vertical-align: middle;
}

::v-deep .custom-table thead th:first-child {
    border-top-left-radius: 8px;
}

::v-deep .custom-table thead th:last-child {
    border-top-right-radius: 8px;
}

/* Body Styling */
::v-deep .custom-table tbody td {
    color: #1e293b !important;
    font-size: 14px;
    font-weight: 500;
    border: none !important;
    border-bottom: 1px solid #f1f5f9 !important;
    padding: 18px 24px !important;
    vertical-align: middle;
    height: 76px;
}

/* Hover Effect */
::v-deep .custom-table tbody tr:hover td {
    background-color: #f8fafc !important;
}

/* Remove bottom border from the very last row */
::v-deep .custom-table tbody tr:last-child td {
    border-bottom: none !important;
}

.index-circle {
    width: 32px;
    height: 32px;
    background-color: #f1f5f9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    font-weight: 600;
    color: #475569;
    margin: 0 auto;
}
</style>
