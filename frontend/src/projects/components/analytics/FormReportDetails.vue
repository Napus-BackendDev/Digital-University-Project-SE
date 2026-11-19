<template>
    <div class="report-details-card">
        <div v-if="mode === 'all'" class="details-tabs" role="tablist">
            <button
                type="button"
                role="tab"
                class="details-tab"
                :aria-selected="activeTab === 'respondents'"
                :class="{ active: activeTab === 'respondents' }"
                @click="activeTab = 'respondents'"
            >
                {{ $t('analytics.respondentTracker') }}
                <span class="tab-count">{{ results.length }}</span>
            </button>
            <button
                type="button"
                role="tab"
                class="details-tab"
                :aria-selected="activeTab === 'questions'"
                :class="{ active: activeTab === 'questions' }"
                @click="activeTab = 'questions'"
            >
                {{ $t('analytics.questionHighlights') }}
                <span class="tab-count">{{ questions.length }}</span>
            </button>
        </div>
        <div v-else class="details-section-header">
            <div class="d-flex align-items-center" style="gap: 8px;">
                <h5 class="m-0 font-weight-bold text-dark">
                    {{ effectiveTab === 'respondents' ? $t('analytics.respondentTracker') : $t('analytics.questionHighlights') }}
                </h5>
                <span class="tab-count">
                    {{ effectiveTab === 'respondents' ? results.length : questions.length }}
                </span>
            </div>
        </div>

        <div class="details-body">
            <div v-if="loading" class="text-center py-5 text-muted small">
                <CSpinner size="sm" color="danger" class="mr-2" />
                {{ $t('analytics.loadingDetails') }}
            </div>

            <template v-else-if="effectiveTab === 'questions'">
                <div v-if="questions.length === 0" class="py-4">
                    <EmptyState
                        borderless
                        icon="cil-description"
                        :title="$t('analytics.noQuestions')"
                    />
                </div>
                <div v-else class="question-list">
                    <div
                        v-for="(q, idx) in questions"
                        :key="qKey(q, idx)"
                        class="question-item"
                    >
                        <div class="d-flex justify-content-between align-items-start flex-wrap mb-2" style="gap: 8px;">
                            <div class="question-title-wrap">
                                <span class="question-index">Q{{ q.order || (idx + 1) }}</span>
                                <span class="question-title">{{ resolveText(q.title) }}</span>
                                <span v-if="formatQuestionTypeLabel(q)" class="question-type-pill">
                                    {{ formatQuestionTypeLabel(q) }}
                                </span>
                            </div>
                            <span class="answered-badge">
                                {{ $t('analytics.answeredCount', { count: (q.stats && q.stats.answeredCount) || 0 }) }}
                            </span>
                        </div>

                        <!-- Rating Scale Stats -->
                        <div v-if="isRating(q) && q.stats" class="mt-2">
                            <div class="d-flex align-items-center flex-wrap mb-2" style="gap: 10px;">
                                <span v-if="q.stats.average !== null && q.stats.average !== undefined" class="badge badge-warning px-2 py-1">
                                    {{ q.stats.average }} ★
                                </span>
                                <span v-if="q.stats.min !== null && q.stats.min !== undefined" class="text-muted small">
                                    Min {{ q.stats.min }} · Max {{ q.stats.max }}
                                </span>
                            </div>
                            <div v-if="getRatingPills(q).length" class="rating-dist-pills">
                                <span
                                    v-for="pill in getRatingPills(q)"
                                    :key="pill.star"
                                    class="rating-dist-pill"
                                >
                                    {{ pill.star }}★: <strong>{{ pill.count }}</strong>
                                </span>
                            </div>
                        </div>

                        <!-- Choice Option Distribution -->
                        <div v-else-if="isChoice(q)" class="option-bars mt-2">
                            <div
                                v-for="opt in getVisibleOptions(q, idx)"
                                :key="opt.key"
                                class="option-row"
                            >
                                <div class="d-flex justify-content-between small mb-1" style="gap: 8px;">
                                    <span class="text-dark">{{ resolveText(opt.label) || opt.key }}</span>
                                    <span class="text-muted text-nowrap">{{ opt.count }} ({{ opt.percentage }}%)</span>
                                </div>
                                <div class="option-track">
                                    <div class="option-fill" :style="{ width: Math.min(100, opt.percentage || 0) + '%' }"></div>
                                </div>
                            </div>
                            <div v-if="q.stats.options.length > choicePreviewLimit" class="mt-1">
                                <button
                                    type="button"
                                    class="more-toggle-btn"
                                    @click="toggleQuestionExpand(qKey(q, idx))"
                                >
                                    <template v-if="isQuestionExpanded(qKey(q, idx))">
                                        {{ $t('analytics.showLess') }}
                                    </template>
                                    <template v-else>
                                        +{{ getRemainingOptionsCount(q) }} {{ $t('analytics.moreOptions') }}
                                    </template>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Respondent Tracker Table -->
            <template v-else>
                <div class="d-flex justify-content-between align-items-center flex-wrap mb-3" style="gap: 10px;">
                    <div class="subfilter-pills">
                        <button
                            v-for="st in ['all', 'submitted', 'ongoing', 'pending']"
                            :key="st"
                            type="button"
                            class="subfilter-pill"
                            :class="{ active: subfilter === st }"
                            @click="subfilter = st"
                        >
                            {{ getSubfilterLabel(st) }} ({{ getSubfilterCount(st) }})
                        </button>
                    </div>
                    <input
                        v-model="peopleSearch"
                        type="search"
                        class="people-search"
                        :placeholder="$t('analytics.searchPeople')"
                        :aria-label="$t('analytics.searchPeople')"
                    />
                </div>

                <div v-if="filteredPeople.length === 0" class="py-4">
                    <EmptyState
                        borderless
                        icon="cil-people"
                        :title="$t('analytics.noPeopleMatch')"
                    />
                </div>
                <template v-else>
                    <div class="respondent-table-scroll" data-test="respondent-table-scroll">
                        <table class="table respondent-tracker-table mb-0">
                            <thead>
                                <tr>
                                    <th>{{ $t('analytics.respondentTable.nameCol') }}</th>
                                    <th>{{ $t('analytics.respondentTable.organizationCol') }}</th>
                                    <th>{{ $t('analytics.respondentTable.statusCol') }}</th>
                                    <th>{{ $t('analytics.respondentTable.startTimeCol') }}</th>
                                    <th>{{ $t('analytics.respondentTable.submitTimeCol') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(entry, idx) in pagedPeople"
                                    :key="(entry._id || entry.email || 'person') + '-' + idx"
                                    class="person-table-row"
                                    :class="{ 'has-response-link': hasResponseLink(entry) }"
                                >
                                    <td>
                                        <div v-if="hasResponseLink(entry)" class="d-flex align-items-center flex-wrap" style="gap: 8px;">
                                            <router-link
                                                :to="{ name: 'Response', params: { id: getResponseId(entry) } }"
                                                class="person-name person-name-link font-weight-bold d-inline-flex align-items-center"
                                                data-test="respondent-response-link"
                                            >
                                                <span>{{ entry.name || entry.email || $t('responses.guestAccount') }}</span>
                                                <CIcon name="cil-external-link" size="sm" class="ml-1 text-primary" />
                                            </router-link>
                                            <router-link
                                                :to="{ name: 'Response', params: { id: getResponseId(entry) } }"
                                                class="respondent-view-link font-weight-bold d-inline-flex align-items-center"
                                                data-test="respondent-view-details-btn"
                                            >
                                                <span>{{ $t('responses.viewDetails') }}</span>
                                                <CIcon name="cil-arrow-right" size="sm" class="ml-1" />
                                            </router-link>
                                        </div>
                                        <div v-else class="person-name">{{ entry.name || entry.email || $t('responses.guestAccount') }}</div>
                                        <div v-if="(entry.email && entry.name) || entry.role" class="person-meta">
                                            <span v-if="entry.email && entry.name">{{ entry.email }}</span>
                                            <span v-if="entry.role">
                                                <span v-if="entry.email && entry.name"> · </span>
                                                {{ resolveText(entry.role) }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="person-org-text">{{ resolveText(entry.organization) || '-' }}</span>
                                    </td>
                                    <td>
                                        <span
                                            class="person-status"
                                            :class="'person-status--' + getPersonStatusKey(entry)"
                                        >
                                            {{ formatPersonStatus(entry) }}
                                        </span>
                                    </td>
                                    <td class="person-time-cell">
                                        {{ formatStartTime(entry) }}
                                    </td>
                                    <td class="person-time-cell">
                                        {{ formatSubmitTime(entry) }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        class="mt-3"
                        :activePage.sync="activePage"
                        :pages="totalPages"
                        :itemsPerPage="perPage"
                        :totalItems="filteredPeople.length"
                        align="end"
                        noMargin
                    />
                </template>
            </template>
        </div>
    </div>
</template>

<script>
import moment from 'moment';
import EmptyState from '@/projects/components/Util/EmptyState.vue';
import Pagination from '@/projects/components/Util/Pagination.vue';
import { pickLocalizedText } from '@/projects/utils/analyticsWorkbook';

export default {
    name: 'FormReportDetails',
    components: {
        EmptyState,
        Pagination
    },
    props: {
        mode: {
            type: String,
            default: 'all'
        },
        loading: {
            type: Boolean,
            default: false
        },
        detailPayload: {
            type: Object,
            default: null
        },
        summaryRow: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            activeTab: 'respondents',
            subfilter: 'all',
            peopleSearch: '',
            activePage: 1,
            perPage: 10,
            expandedQuestions: {},
            choicePreviewLimit: 5
        };
    },
    watch: {
        detailPayload() {
            this.expandedQuestions = {};
            this.activePage = 1;
        },
        subfilter() {
            this.activePage = 1;
        },
        peopleSearch() {
            this.activePage = 1;
        },
        totalPages(next) {
            if (this.activePage > next) {
                this.activePage = Math.max(1, next);
            }
        }
    },
    computed: {
        effectiveTab() {
            if (this.mode === 'respondents' || this.mode === 'questions') {
                return this.mode;
            }
            return this.activeTab;
        },
        questions() {
            return (this.detailPayload && Array.isArray(this.detailPayload.questions))
                ? this.detailPayload.questions
                : [];
        },
        results() {
            return (this.detailPayload && Array.isArray(this.detailPayload.results))
                ? this.detailPayload.results
                : [];
        },
        statusCounts() {
            const counts = { all: this.results.length, submitted: 0, ongoing: 0, pending: 0 };
            this.results.forEach((entry) => {
                const st = this.getPersonStatusKey(entry);
                if (counts[st] !== undefined) counts[st] += 1;
            });
            if (counts.pending === 0 && this.pendingUsersCount > 0 && this.results.length === 0) {
                counts.pending = this.pendingUsersCount;
            }
            return counts;
        },
        pendingUsersCount() {
            if (this.detailPayload && this.detailPayload.summary && this.detailPayload.summary.pendingCount !== undefined) {
                return this.detailPayload.summary.pendingCount;
            }
            const t = (this.summaryRow && this.summaryRow.targetCount) || 0;
            const c = (this.summaryRow && this.summaryRow.completedCount) || 0;
            return Math.max(0, t - c);
        },
        filteredPeople() {
            const q = String(this.peopleSearch || '').trim().toLowerCase();
            return this.results.filter((entry) => {
                const st = this.getPersonStatusKey(entry);
                if (this.subfilter !== 'all' && st !== this.subfilter) return false;
                if (!q) return true;
                const haystack = [
                    entry.name,
                    entry.email,
                    this.resolveText(entry.organization),
                    this.resolveText(entry.role)
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return haystack.includes(q);
            });
        },
        totalPages() {
            return Math.max(1, Math.ceil(this.filteredPeople.length / this.perPage));
        },
        pagedPeople() {
            const start = (this.activePage - 1) * this.perPage;
            return this.filteredPeople.slice(start, start + this.perPage);
        }
    },
    methods: {
        resolveText(val) {
            const locale = (this.$i18n && this.$i18n.locale) || 'en';
            return pickLocalizedText(val, locale);
        },
        qKey(q, idx) {
            return (q && q._id) ? String(q._id) : `idx-${idx}`;
        },
        toggleQuestionExpand(key) {
            this.$set(this.expandedQuestions, key, !this.expandedQuestions[key]);
        },
        isQuestionExpanded(key) {
            return Boolean(this.expandedQuestions[key]);
        },
        isRating(q) {
            return String((q && q.type) || '').toLowerCase() === 'rating';
        },
        isChoice(q) {
            return Boolean(q && q.stats && Array.isArray(q.stats.options) && q.stats.options.length > 0);
        },
        formatQuestionTypeLabel(q) {
            const t = String((q && q.type) || '').toLowerCase();
            return (t && this.$te && this.$te(`types.${t}`)) ? this.$t(`types.${t}`) : '';
        },
        getRatingPills(q) {
            const dist = (q && q.stats && q.stats.distribution) || {};
            return [5, 4, 3, 2, 1]
                .map((star) => ({ star, count: Number(dist[star] || dist[String(star)] || 0) }))
                .filter((item) => item.count > 0);
        },
        getVisibleOptions(q, idx) {
            const opts = (q && q.stats && Array.isArray(q.stats.options)) ? q.stats.options : [];
            if (this.isQuestionExpanded(this.qKey(q, idx))) return opts;
            return opts.slice(0, this.choicePreviewLimit);
        },
        getRemainingOptionsCount(q) {
            const len = (q && q.stats && Array.isArray(q.stats.options)) ? q.stats.options.length : 0;
            return Math.max(0, len - this.choicePreviewLimit);
        },
        getPersonStatusKey(entry) {
            if (!entry) return 'pending';
            const raw = String(entry.submissionStatus || (entry.submitted ? 'submitted' : 'pending')).toLowerCase();
            if (raw === 'submitted' || raw === 'completed') return 'submitted';
            if (raw === 'ongoing' || raw === 'inprogress' || raw === 'in_progress') return 'ongoing';
            return 'pending';
        },
        getSubfilterLabel(st) {
            if (st === 'all') return this.$t('analytics.allFormsTab');
            if (st === 'submitted') return this.$t('analytics.respondentTable.statusCompleted');
            if (st === 'ongoing') return this.$t('analytics.respondentTable.statusInProgress');
            return this.$t('analytics.respondentTable.statusAssigned');
        },
        getSubfilterCount(st) {
            return this.statusCounts[st] !== undefined ? this.statusCounts[st] : 0;
        },
        formatPersonStatus(entry) {
            const st = this.getPersonStatusKey(entry);
            if (st === 'submitted') return this.$t('analytics.respondentTable.statusCompleted');
            if (st === 'ongoing') return this.$t('analytics.respondentTable.statusInProgress');
            return this.$t('analytics.respondentTable.statusAssigned');
        },
        formatTimestamp(val) {
            if (!val) return '-';
            const m = moment(val);
            if (!m.isValid()) return '-';
            return m.format('DD/MM/YYYY HH:mm');
        },
        formatStartTime(entry) {
            if (!entry || !entry.startedAt) return '-';
            return this.formatTimestamp(entry.startedAt);
        },
        formatSubmitTime(entry) {
            if (!entry) return '-';
            const st = this.getPersonStatusKey(entry);
            if (st !== 'submitted' || !entry.submittedAt) return '-';
            return this.formatTimestamp(entry.submittedAt);
        },
        getResponseId(entry) {
            if (!entry) return null;
            return entry.responseId || entry.response_id || (entry.response && (entry.response._id || entry.response.id)) || (typeof entry.response === 'string' ? entry.response : null) || null;
        },
        hasResponseLink(entry) {
            if (!entry) return false;
            const st = this.getPersonStatusKey(entry);
            const hasResponse = st === 'submitted' || st === 'ongoing' || Boolean(entry.submitted) || (entry.submissionStatus && entry.submissionStatus !== 'pending');
            return Boolean(hasResponse && this.getResponseId(entry));
        }
    }
};
</script>

<style scoped>
.report-details-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
    overflow: hidden;
}

.details-tabs {
    display: flex;
    gap: 16px;
    padding: 12px 24px 0;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}

.details-section-header {
    padding: 14px 24px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}

.details-tab {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 8px 4px 11px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
}

.details-tab:hover {
    color: #0f172a;
}

.details-tab.active {
    color: #8c1515;
    border-bottom-color: #8c1515;
}

.tab-count {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
}

.details-body {
    padding: 20px 24px 24px;
}

.question-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.question-item {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 16px;
    background: #ffffff;
}

.question-title-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
}

.question-index {
    font-size: 0.8125rem;
    font-weight: 700;
    color: #8c1515;
    background: #fef2f2;
    padding: 2px 8px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
}

.question-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: #0f172a;
}

.question-type-pill {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 1px 8px;
    border-radius: 999px;
}

.answered-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    background: #f1f5f9;
    padding: 3px 10px;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
}

.rating-dist-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.rating-dist-pill {
    font-size: 0.8125rem;
    color: #92400e;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 999px;
    padding: 2px 10px;
    font-variant-numeric: tabular-nums;
}

.badge-warning {
    font-size: 0.8125rem;
}

.option-bars {
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.option-track {
    height: 8px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
}

.option-fill {
    height: 100%;
    background: #8c1515;
    border-radius: 999px;
}

.answer-preview-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.answer-text-chip {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.84rem;
    color: #1e293b;
    line-height: 1.45;
}

.answer-text-chip.is-clickable {
    cursor: pointer;
}

.answer-text-chip:not(.expanded) .answer-text-body {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.answer-author {
    font-size: 0.8125rem;
    color: #64748b;
    white-space: nowrap;
}

.answer-file-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 0.8125rem;
    color: #0369a1;
    font-weight: 600;
    text-decoration: none;
}

.answer-file-chip:hover {
    background: #f0f9ff;
    border-color: #38bdf8;
    text-decoration: none;
}

.file-name {
    max-width: 280px;
}

.more-toggle-btn {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #8c1515;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
}

.more-toggle-btn:hover {
    background: #fef2f2;
    border-color: #8c1515;
}

.subfilter-pills {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 8px;
}

.subfilter-pill {
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #475569;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.subfilter-pill.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.people-search {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 0.84rem;
    min-width: 220px;
}

.respondent-table-scroll {
    max-height: 480px;
    overflow-y: auto;
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
}

.respondent-tracker-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

.respondent-tracker-table thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 10px 14px;
    border-top: none;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
}

.respondent-tracker-table tbody td {
    padding: 10px 14px;
    vertical-align: middle;
    border-top: none;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.85rem;
    color: #1e293b;
}

.respondent-tracker-table tbody tr:last-child td {
    border-bottom: none;
}

.respondent-tracker-table tbody tr:hover td {
    background-color: #f8fafc;
}

.person-org-text {
    font-size: 0.84rem;
    color: #334155;
    font-weight: 500;
}

.person-time-cell {
    font-size: 0.82rem;
    color: #475569;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.person-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: #0f172a;
}

.person-name-link {
    color: #8c1515 !important;
    text-decoration: none;
    transition: color 0.15s ease;
}

.person-name-link:hover {
    color: #b91c1c !important;
    text-decoration: underline;
}

.respondent-view-link {
    color: #8c1515;
    text-decoration: none;
    font-size: 0.8125rem;
    padding: 4px 8px;
    border-radius: 6px;
    background: transparent;
    transition: all 0.15s ease;
}

.respondent-view-link:hover {
    background-color: #fee2e2;
    color: #b91c1c;
    text-decoration: none;
}

.person-meta {
    font-size: 0.8125rem;
    color: #64748b;
}

.person-status {
    display: inline-flex;
    align-items: center;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    white-space: nowrap;
}

.person-status--submitted { background: #ecfdf5; color: #047857; }
.person-status--ongoing { background: #fffbeb; color: #b45309; }
.person-status--pending { background: #f1f5f9; color: #475569; }

@media (max-width: 575.98px) {
    .details-tabs {
        padding: 10px 16px 0;
        overflow-x: auto;
    }

    .details-body {
        padding: 16px;
    }

    .people-search {
        width: 100%;
        min-width: 0;
    }

    .person-row {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
