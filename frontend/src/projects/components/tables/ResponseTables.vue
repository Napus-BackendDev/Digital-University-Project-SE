<template>
    <div class="response-table-wrapper">
        <!-- Error -->
        <div v-if="error" class="text-center py-5 text-danger bg-white rounded-20 shadow-sm">
            <CIcon name="cil-warning" size="xl" class="mb-3" />
            <div class="font-weight-bold">{{ error }}</div>
        </div>

        <!-- Table & Filter Container -->
        <div v-else>
            <!-- Unified Filter & Search Toolbar (Matches /forms & /manage via shared FilterTable) -->
            <FilterTable
                class="mb-3"
                :searchQuery.sync="searchQuery"
                :searchPlaceholder="$t('responses.searchPlaceholder')"
                :selectedStatus.sync="selectedStatus"
                :statusOptions="statusFilterOptions"
                :startDate.sync="startDate"
                :endDate.sync="endDate"
            />

            <CDataTable
                :items="loading ? [] : pagedItems"
                :fields="fields"
                :loading="loading"
                :hover="!loading && tableItems.length > 0"
                class="mb-0 tables-container mobile-card-table mobile-card-table--indexed"
                :class="{ 'table-empty': !loading && tableItems.length === 0 }"
            >
                <template #loading>
                    <TableLoading borderless />
                </template>

                <template #no-items-view>
                    <EmptyState
                        borderless
                        icon="cil-find-in-page"
                        :title="hasActiveFilters && baseItems.length > 0 ? $t('responses.noMatchTitle') : $t('responses.noData')"
                        :description="hasActiveFilters && baseItems.length > 0 ? $t('responses.noMatchDesc') : $t('responses.noDataDesc')"
                    >
                        <template v-if="hasActiveFilters && baseItems.length > 0" #action>
                            <button type="button" class="respondent-cta-btn cta-secondary mt-2" @click="resetAllFilters">
                                {{ $t('responses.clearFilters') }}
                            </button>
                        </template>
                    </EmptyState>
                </template>

                <!-- # Column -->
                <template #id="{ item }">
                    <td class="align-middle pl-3">
                        <div v-if="!item.isEmpty" class="index-badge-modern">{{ item.id }}</div>
                    </td>
                </template>

                <!-- Responder Column (Avatar + Name + MFU/Guest badge + Plain-text Role + Email) -->
                <template #responder="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="d-flex align-items-center responder-cell">
                            <div class="responder-avatar mr-3 flex-shrink-0" :class="item.isGuest ? 'avatar-guest' : 'avatar-mfu'">
                                {{ item.avatarChar }}
                            </div>
                            <div class="min-w-0">
                                <div class="d-flex align-items-center flex-wrap" style="gap: 6px;">
                                    <span class="responder-name text-truncate">{{ item.responder }}</span>
                                    <span class="account-type-badge" :class="item.isGuest ? 'badge-guest' : 'badge-mfu'">
                                        {{ item.isGuest ? $t('responses.guestAccount') : $t('responses.mfuAccount') }}
                                    </span>
                                </div>
                                <span v-if="item.responderRole" class="responder-role-text d-block text-truncate mt-1">{{ item.responderRole }}</span>
                                <span v-if="item.responderEmail" class="responder-meta d-block text-truncate">{{ item.responderEmail }}</span>
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Organization Column -->
                <template #organization="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="d-flex align-items-center">
                            <span class="visibility-badge text-truncate-pill" :class="item.organizationLabel ? 'visi-org' : 'visi-default'" :title="item.organizationDisplay">
                                <CIcon :name="item.organizationLabel ? 'cil-bank' : 'cil-user'" size="sm" class="mr-2 flex-shrink-0" />
                                <span class="text-truncate">{{ item.organizationDisplay }}</span>
                            </span>
                        </div>
                    </td>
                </template>

                <!-- Submitted & Updated At Column -->
                <template #submitted="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="date-display">
                            <div class="small font-weight-bold text-dark">{{ item.submittedDisplay }}</div>
                            <div v-if="item.wasEdited" class="edited-note mt-1" :title="item.updatedDisplay">
                                <CIcon name="cil-pencil" size="sm" class="edited-icon" />
                                <span>{{ $t('responses.editedAt') }}: {{ item.updatedDisplay }}</span>
                            </div>
                            <div v-else class="text-muted mt-1" style="font-size: 0.8125rem;">
                                {{ item.submittedTime }}
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Progress & Status Column -->
                <template #answers="{ item }">
                    <td class="align-middle">
                        <div v-if="!item.isEmpty" class="completion-cell-wrap">
                            <span class="status-badge" :class="item.status === 'Completed' ? 'status-completed' : 'status-ongoing'">
                                <span class="status-dot"></span>
                                {{ item.status === 'Completed' ? $t('table.completed') : $t('table.ongoing') }}
                            </span>
                            <template v-if="item.effectiveTotalQuestions > 0">
                                <div class="d-flex align-items-center mt-2" style="gap: 8px;">
                                    <div class="mini-progress-track flex-grow-1">
                                        <div
                                            class="mini-progress-fill"
                                            :class="{ 'is-partial': item.progressPercent < 100 }"
                                            :style="{ width: item.progressPercent + '%' }"
                                        />
                                    </div>
                                    <span class="small font-weight-bold text-dark" style="font-size: 0.8125rem;">{{ item.progressPercent }}%</span>
                                </div>
                                <div class="text-muted mt-1" style="font-size: 0.8125rem;">
                                    {{ $t('table.answeredFraction', { answered: item.answersCount, total: item.effectiveTotalQuestions }) }}
                                </div>
                            </template>
                            <div v-else class="text-muted mt-1" style="font-size: 0.8125rem;">
                                {{ $t('responses.answeredQuestionsOnly', { answered: item.answersCount }) }}
                            </div>
                        </div>
                    </td>
                </template>

                <!-- Actions Column -->
                <template #actions="{ item }">
                    <td class="align-middle text-right pr-3">
                        <div v-if="!item.isEmpty" class="d-flex align-items-center justify-content-end">
                            <span v-if="item.isActive" class="btn-action-viewing">
                                <CIcon name="cil-check-alt" size="sm" class="mr-1" />
                                {{ $t('responses.viewing') }}
                            </span>
                            <button v-else type="button" class="respondent-cta-btn cta-view" @click="viewResponse(item)">
                                <span>{{ $t('responses.viewDetails') }}</span>
                                <CIcon name="cil-arrow-right" size="sm" class="cta-icon" />
                            </button>
                        </div>
                    </td>
                </template>
            </CDataTable>

            <!-- Table Footer: Rows per page & Pagination -->
            <div v-if="!loading && tableItems.length > 0" class="d-flex justify-content-between align-items-center flex-wrap mt-3 px-2">
                <div class="d-flex align-items-center text-muted small font-weight-bold my-1">
                    <span class="mr-2">{{ $t('table.showing') }}</span>
                    <select v-model.number="perPage" class="custom-per-page-select mr-2">
                        <option :value="5">5</option>
                        <option :value="10">10</option>
                        <option :value="15">15</option>
                        <option :value="20">20</option>
                    </select>
                    <span class="mr-2">{{ $t('table.itemsPerPage') }}</span>
                    <span class="text-secondary">({{ startItem }} - {{ endItem }} {{ $t('table.of') }} {{ tableItems.length }} {{ $t('table.items') }})</span>
                </div>

                <div class="my-1">
                    <Pagination :activePage.sync="activePage" :pages="totalPages" align="end" noMargin />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import Pagination from '@/projects/components/Util/Pagination.vue'
import EmptyState from '@/projects/components/Util/EmptyState.vue'
import FilterTable from '@/projects/components/Filter/FilterTable.vue'
import TableLoading from '@/projects/components/Util/TableLoading.vue'
import localeMixin from '@/mixins/localeMixin'
import {
    resolveUserRoleLabel,
    resolveUserOrganizationLabel,
    countInputQuestions,
    countValidAnswers
} from '@/projects/utils/formPolicy'

export default {
    name: 'ResponseTables',
    mixins: [localeMixin],
    components: { Pagination, EmptyState, FilterTable, TableLoading },
    props: {
        responseList: {
            type: Array,
            default: null
        },
        currentId: {
            type: String,
            default: null
        },
        totalQuestions: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            loading: false,
            error: null,
            activePage: 1,
            perPage: 5,
            searchQuery: '',
            selectedStatus: 'all',
            startDate: '',
            endDate: ''
        }
    },

    computed: {
        ...mapGetters({
            responses: 'Responses/responses',
            users: 'User/users',
            organizations: 'Organizations/organizations'
        }),

        fields() {
            return [
                { key: 'id', label: '#', _style: 'width:6%', sorter: false },
                { key: 'responder', label: this.$t('responses.responderCol'), _style: 'width:27%' },
                { key: 'organization', label: this.$t('responses.organizationCol'), _style: 'width:17%' },
                { key: 'submitted', label: this.$t('responses.submittedUpdatedCol'), _style: 'width:17%' },
                { key: 'answers', label: this.$t('responses.completionCol'), _style: 'width:19%', sorter: false },
                { key: 'actions', label: this.$t('table.action'), _style: 'width:14%; text-align:right', sorter: false, filter: false }
            ]
        },

        hasActiveFilters() {
            return Boolean(
                String(this.searchQuery || '').trim()
                || this.selectedStatus !== 'all'
                || (this.startDate && this.startDate.trim())
                || (this.endDate && this.endDate.trim())
            );
        },

        statusFilterOptions() {
            return [
                { value: 'all', label: this.$t('analytics.allFormsTab') },
                { value: 'Completed', label: this.$t('table.completed') },
                { value: 'Ongoing', label: this.$t('table.ongoing') }
            ];
        },

        baseItems() {
            const source = this.responseList !== null
                ? this.responseList
                : (this.responses || []).filter(r => r && ((r.submit === true || r.submit === 'true') || (Array.isArray(r.answers) && r.answers.length > 0)));

            return source.map((r, idx) => {
                const hasResponderObj = Boolean(r && r.responder && typeof r.responder === 'object');
                const hasResponderStr = Boolean(r && typeof r.responder === 'string' && r.responder.trim());
                const isGuest = !hasResponderObj && !hasResponderStr;

                let responder = 'Anonymous';
                let responderEmail = '';
                if (r) {
                    if (hasResponderObj) {
                        responder = r.responder.name || r.responder.fullname || r.responder.username || r.responder.email || 'Anonymous';
                        responderEmail = r.responder.email || '';
                    } else if (hasResponderStr) {
                        responder = r.responder;
                    } else if (r.responderName) {
                        responder = r.responderName;
                        responderEmail = r.email || '';
                    }
                }

                const responderRole = (r && r.responder)
                    ? resolveUserRoleLabel(r.responder, { users: this.users || [], getText: (v) => this.getLang(v) })
                    : '';

                const organizationLabel = (r && r.responder)
                    ? resolveUserOrganizationLabel(r.responder, {
                        organizations: this.organizations || [],
                        users: this.users || [],
                        getText: (v) => this.getLang(v)
                    })
                    : '';

                const organizationDisplay = organizationLabel || (isGuest ? this.$t('responses.guestUnspecifiedOrg') : '-');
                const isSubmitted = Boolean(r && (r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true'));

                const answersList = Array.isArray(r && r.answers) ? r.answers : [];
                const answersCount = countValidAnswers(answersList);
                const formLevelQuestions = (r && r.form && Array.isArray(r.form.questions))
                    ? countInputQuestions(r.form.questions)
                    : 0;
                const effectiveTotalQuestions = this.totalQuestions > 0
                    ? this.totalQuestions
                    : formLevelQuestions;

                let progressPercent = isSubmitted ? 100 : 0;
                if (effectiveTotalQuestions > 0) {
                    progressPercent = Math.min(100, Math.round((answersCount / effectiveTotalQuestions) * 100));
                }

                const createdAt = r && (r.createdAt || r.updatedAt) ? (r.createdAt || r.updatedAt) : null;
                const updatedAt = r && r.updatedAt ? r.updatedAt : createdAt;
                const createdAtMs = createdAt ? new Date(createdAt).getTime() : 0;
                const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : createdAtMs;
                const wasEdited = Boolean(createdAtMs && updatedAtMs && (updatedAtMs - createdAtMs > 60 * 1000));

                return {
                    id: idx + 1,
                    _id: r._id,
                    isActive: r._id === this.currentId,
                    isGuest,
                    avatarChar: (responder ? responder.charAt(0) : 'A').toUpperCase(),
                    responder: responder || 'Anonymous',
                    responderEmail,
                    responderRole,
                    organizationLabel,
                    organizationDisplay,
                    submittedDisplay: createdAt ? moment(createdAt).format('DD/MM/YYYY') : '-',
                    submittedTime: createdAt ? moment(createdAt).format('HH:mm') : '',
                    updatedDisplay: updatedAt ? moment(updatedAt).format('DD/MM/YYYY · HH:mm') : '-',
                    createdAtMs,
                    updatedAtMs,
                    wasEdited,
                    status: isSubmitted ? 'Completed' : 'Ongoing',
                    answersCount,
                    effectiveTotalQuestions,
                    progressPercent,
                    raw: r,
                    isEmpty: false
                };
            });
        },

        tableItems() {
            let items = [...this.baseItems];

            const q = String(this.searchQuery || '').trim().toLowerCase();
            if (q) {
                items = items.filter(item =>
                    String(item.responder || '').toLowerCase().includes(q)
                    || String(item.responderEmail || '').toLowerCase().includes(q)
                    || String(item.responderRole || '').toLowerCase().includes(q)
                    || String(item.organizationDisplay || '').toLowerCase().includes(q)
                );
            }

            if (this.selectedStatus && this.selectedStatus !== 'all') {
                items = items.filter(item => item.status === this.selectedStatus);
            }

            if ((this.startDate && this.startDate.trim()) || (this.endDate && this.endDate.trim())) {
                const startMs = this.startDate ? new Date(`${this.startDate}T00:00:00`).getTime() : -Infinity;
                const endMs = this.endDate ? new Date(`${this.endDate}T23:59:59.999`).getTime() : Infinity;
                if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
                    items = items.filter(item => item.createdAtMs >= startMs && item.createdAtMs <= endMs);
                }
            }

            items.sort((a, b) => b.createdAtMs - a.createdAtMs);

            return items.map((item, idx) => ({ ...item, id: idx + 1 }));
        },

        startItem() {
            if (this.tableItems.length === 0) return 0;
            return (this.activePage - 1) * this.perPage + 1;
        },

        endItem() {
            return Math.min(this.activePage * this.perPage, this.tableItems.length);
        },

        totalPages() {
            return Math.max(1, Math.ceil(this.tableItems.length / this.perPage));
        },

        pagedItems() {
            const start = (this.activePage - 1) * this.perPage;
            return this.tableItems.slice(start, start + this.perPage);
        }
    },

    watch: {
        perPage() { this.activePage = 1; },
        searchQuery() { this.activePage = 1; },
        selectedStatus() { this.activePage = 1; },
        startDate() { this.activePage = 1; },
        endDate() { this.activePage = 1; },
        totalPages(next) {
            if (this.activePage > next) {
                this.activePage = Math.max(1, next);
            }
        }
    },

    methods: {
        resetAllFilters() {
            this.searchQuery = '';
            this.selectedStatus = 'all';
            this.startDate = '';
            this.endDate = '';
        },

        viewResponse(item) {
            this.$router.push({ name: 'Response', params: { id: item._id } });
        }
    }
}
</script>

<style scoped>
.response-table-wrapper {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}

.tables-container {
    background: #ffffff;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    padding: 0;
    overflow: hidden;
}

.tables-container.table-empty tbody tr,
.tables-container.table-empty tbody tr:hover,
.tables-container.table-empty tbody td {
    background: transparent !important;
    cursor: default !important;
    pointer-events: none !important;
}

.index-badge-modern {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-weight: 700;
}

.responder-cell {
    min-width: 0;
}

.responder-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
}

.avatar-mfu {
    background: #eef2ff;
    color: #4338ca;
}

.avatar-guest {
    background: #fef3c7;
    color: #92400e;
}

.responder-name {
    color: #0f172a;
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.3;
    max-width: 170px;
}

.account-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
}

.badge-mfu {
    background-color: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
}

.badge-guest {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
}

.responder-role-text {
    color: #475569;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.3;
}

.responder-meta {
    color: #64748b;
    font-size: 0.8125rem;
    font-weight: 500;
}

.visibility-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.85rem;
    border-radius: 100px;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    max-width: 220px;
    overflow: hidden;
}

.visi-org {
    background-color: #eff6ff;
    color: #1e40af;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
}

.date-display {
    line-height: 1.3;
}

.edited-note {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #b45309;
}

.edited-icon {
    width: 11px !important;
    height: 11px !important;
    flex-shrink: 0;
}

.completion-cell-wrap {
    min-width: 120px;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.3em 0.75em;
    border-radius: 50rem;
    font-size: 0.8125rem;
    font-weight: 600;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-completed {
    background-color: #d1fae5;
    color: #065f46;
}

.status-completed .status-dot {
    background-color: #059669;
}

.status-ongoing {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-ongoing .status-dot {
    background-color: #eab308;
}

.mini-progress-track {
    height: 6px;
    background: #f1f5f9;
    border-radius: 999px;
    overflow: hidden;
}

.mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 999px;
    transition: width 0.25s ease;
}

.mini-progress-fill.is-partial {
    background: linear-gradient(90deg, #f59e0b, #d97706);
}

.respondent-cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0.42rem 0.9rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.18s ease;
}

.respondent-cta-btn .cta-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}

.respondent-cta-btn.cta-view {
    background-color: #8c1515;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(140, 21, 21, 0.22);
}

.respondent-cta-btn.cta-view:hover {
    background-color: #701010;
    transform: translateY(-1px);
}

.respondent-cta-btn.cta-secondary {
    background-color: #ffffff;
    color: #334155;
    border-color: #cbd5e1;
}

.respondent-cta-btn.cta-secondary:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
}

.btn-action-viewing {
    display: inline-flex;
    align-items: center;
    padding: 0.42rem 0.85rem;
    background-color: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 700;
    white-space: nowrap;
}

.custom-per-page-select {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px !important;
    padding: 4px 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    outline: none;
}

.custom-per-page-select:focus,
.custom-per-page-select:hover {
    border-color: #8c1515;
    box-shadow: 0 0 0 2px rgba(140, 21, 21, 0.1);
}

@media (max-width: 991.98px) {
    .respondent-cta-btn,
    .btn-action-viewing {
        width: 100%;
        justify-content: center;
        min-height: 44px;
    }

    .completion-cell-wrap {
        width: 100%;
    }
}
</style>
