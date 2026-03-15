<template>
    <div>
        <!-- Toolbar -->
        <div class="d-flex justify-content-between align-items-center mb-4 px-2">
            <!-- Loading state -->
            <div v-if="loading" class="text-center py-4">
                <CSpinner color="secondary" />
                <p class="text-muted mt-2">Loading responses...</p>
            </div>
            <!-- Error state -->
            <div v-else-if="error" class="text-center py-4 text-danger">{{ error }}</div>

            <div class="text-muted" style="font-size: 1.1rem; font-weight: 500; color: #475569 !important;">
                {{ allSubmittedResponses.length }} responses
            </div>

            <div class="d-flex align-items-center gap-2">

                <CButton :color="currentView === 'summary' ? 'dark' : 'light'" shape="pill"
                    :class="['d-flex align-items-center mx-1', currentView === 'summary' ? 'custom-btn-dark' : 'custom-btn-light text-muted']"
                    @click="currentView = 'summary'">
                    <CIcon name="cil-chart-pie" size="sm" class="mr-2" />
                    Summary
                </CButton>

                <CButton :color="currentView === 'individual' ? 'dark' : 'light'" shape="pill"
                    :class="['d-flex align-items-center mx-1', currentView === 'individual' ? 'custom-btn-dark' : 'custom-btn-light text-muted']"
                    @click="currentView = 'individual'">
                    <CIcon name="cil-list" size="sm" class="mr-2" />
                    Individual
                </CButton>

                <CDropdown class="mx-1 custom-dropdown">
                    <template #toggler>
                        <CButton color="light" shape="pill"
                            class="d-flex align-items-center custom-btn-light text-muted">
                            Export
                            <CIcon name="cil-chevron-top" size="sm" class="ml-2" />
                        </CButton>
                    </template>
                    <CDropdownItem @click="exportXlsx">
                        <CIcon name="cil-data-transfer-down" size="sm" class="mr-2" />
                        Export Excel
                    </CDropdownItem>
                    <CDropdownItem @click="copyApiLink">
                        <CIcon name="cil-copy" size="sm" class="mr-2" />
                        Copy API Link
                    </CDropdownItem>
                </CDropdown>

                <!-- Copied toast -->
                <transition name="fade">
                    <span v-if="copied" class="ml-2 text-success d-inline-flex align-items-center"
                        style="font-size:0.82rem; font-weight:600;">
                        ✓ Copied!
                    </span>
                </transition>

            </div>
        </div>

        <!-- SUMMARY VIEW -->
        <div v-if="currentView === 'summary'">

            <!-- Empty state -->
            <div v-if="allSubmittedResponses.length === 0" class="text-center py-5 text-muted">
                <p>No responses yet for this form.</p>
            </div>

            <!-- Dynamic question cards -->
            <div v-for="(q, qIdx) in summaryByQuestion" :key="q._id" class="p-5 bg-white border rounded shadow-sm mb-4">
                <!-- Question header -->
                <h4 class="mb-1 font-weight-bold" style="color: #334155;">
                    {{ qIdx + 1 }}. {{ getTitle(q.title) }}
                </h4>
                <div class="text-muted mb-4" style="font-size: 0.95rem;">
                    {{ q.responses.length }} response{{ q.responses.length !== 1 ? 's' : '' }}
                </div>

                <!-- ── SHORT / PARAGRAPH ── -->
                <template v-if="isTextType(q.type)">
                    <CDataTable :items="q.responses.map((r, i) => ({ '#': i + 1, Response: r || '—' }))"
                        :fields="[{ key: '#', _style: 'width:60px' }, 'Response']" border striped hover class="mb-0" />
                </template>

                <!-- ── MULTIPLE CHOICE / CHECKBOXES ── -->
                <template v-else-if="isChoiceType(q.type)">
                    <div v-for="(opt, oIdx) in q.optionCounts" :key="oIdx" class="mb-3 pr-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="text-dark">{{ opt.label }}</span>
                            <span class="font-weight-bold text-dark">{{ opt.count }}</span>
                        </div>
                        <div class="progress w-100"
                            style="height: 8px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
                            <div class="progress-bar"
                                :style="{ width: opt.pct + '%', backgroundColor: choiceColor(oIdx) }" role="progressbar"
                                :aria-valuenow="opt.pct" aria-valuemin="0" aria-valuemax="100" />
                        </div>
                    </div>
                </template>

                <!-- ── RATING ── -->
                <template v-else-if="isRatingType(q.type)">
                    <div class="mt-3 mb-3 px-3">
                        <div class="d-flex" style="height: 200px;">
                            <!-- Y-Axis -->
                            <div class="y-axis-labels">
                                <span v-for="(val, yIdx) in q.ratingYAxis" :key="yIdx">{{ val }}</span>
                            </div>
                            <!-- Bars -->
                            <div class="chart-area w-100 position-relative">
                                <div class="grid-line" style="top: 0%"></div>
                                <div class="grid-line" style="top: 25%"></div>
                                <div class="grid-line" style="top: 50%"></div>
                                <div class="grid-line" style="top: 75%"></div>
                                <div class="bars-container">
                                    <div v-for="(bar, bIdx) in q.ratingBars" :key="bIdx" class="rating-bar-wrapper">
                                        <div class="rating-bar" :style="{ height: bar.percentage + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- X-Axis -->
                        <div class="d-flex x-axis-labels">
                            <div style="width: 45px; padding-right: 12px;"></div>
                            <div class="d-flex justify-content-around w-100 px-5">
                                <div v-for="(bar, bIdx) in q.ratingBars" :key="bIdx" class="text-center">{{ bar.label }}
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <!-- ── FALLBACK ── -->
                <template v-else>
                    <CDataTable :items="q.responses.map((r, i) => ({ '#': i + 1, Response: r || '—' }))"
                        :fields="[{ key: '#', _style: 'width:60px' }, 'Response']" border striped hover class="mb-0" />
                </template>
            </div>
        </div>

        <!-- INDIVIDUAL VIEW -->
        <div v-else-if="currentView === 'individual'" class="p-5 bg-white border rounded shadow-sm">
            <ResponseTables :responseList="allSubmittedResponses" />
        </div>

    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import * as XLSX from 'xlsx'
import ResponseTables from '@/projects/components/tables/ResponseTables.vue'
export default {
    name: 'TabResponses',
    components: { ResponseTables },
    props: {
        responses: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            currentView: 'summary',
            activePage: 1,
            activePageParagraph: 1,
            activePageIndividual: 1,
            loading: false,
            error: null,
            copied: false,
        }
    },
    watch: {
        responses: {
            handler(newVal) {
                if (newVal && newVal._id) {
                    this.fetchResponses();
                }
            },
            immediate: true
        }
    },
    methods: {
        exportXlsx() {
            if (!this.allSubmittedResponses.length) {
                alert('No responses to export.');
                return;
            }

            const firstAnswers = this.allSubmittedResponses[0].answers || [];
            const headers = ['Responder', 'Submitted'];
            firstAnswers.forEach((a, i) => {
                const title = a.question && Array.isArray(a.question.title) && a.question.title.length
                    ? this.getTitle(a.question.title)
                    : `Question ${i + 1}`;
                headers.push(title);
            });

            const rows = this.allSubmittedResponses.map(r => {
                const row = [
                    (r.responder || '-').toString(),
                    this.formatDate(r.createdAt)
                ];
                (r.answers || []).forEach(a => {
                    const val = Array.isArray(a.response)
                        ? a.response.join(', ')
                        : (a.response === null || a.response === undefined ? '' : String(a.response));
                    row.push(val);
                });
                return row;
            });

            const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

            // Set column widths (optional but nice)
            const wscols = headers.map(h => ({ wch: Math.max(h.length, 15) }));
            worksheet['!cols'] = wscols;

            const filename = `responses_${this.responses && this.responses._id || 'export'}.xlsx`;
            XLSX.writeFile(workbook, filename);
        },

        // ── Copy API Link ─────────────────────────────────────────────────
        copyApiLink() {
            const formId = this.responses && this.responses._id;
            if (!formId) { alert('Form ID not available yet.'); return; }
            const BASE = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1';
            const url = `${BASE}/response/download/${formId}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => this.showCopied());
            } else {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                this.showCopied();
            }
        },
        showCopied() {
            this.copied = true;
            setTimeout(() => { this.copied = false; }, 2000);
        },

        async fetchResponses() {
            const formId = this.responses && this.responses._id;
            if (!formId) {
                console.warn('[TabResponses] fetchResponses: formId not ready yet, skip');
                return;
            }
            if (this.loading) return;

            this.loading = true;
            this.error = null;
            try {
                await this.$store.dispatch('Responses/get', { form_id: formId });
            } catch (err) {
                console.error('[TabResponses] Failed to fetch responses:', err);
                this.error = 'Failed to load responses.';
            } finally {
                this.loading = false;
            }
        },

        formatDate(dateStr) {
            return dateStr ? moment(dateStr).format('DD/MM/YYYY, HH:mm:ss') : '-';
        },

        getTitle(arr) {
            if (!arr || !arr.length) return '';
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase();
            return (arr.find(t => t.key && t.key.toUpperCase() === lang) || arr[0]).value || '';
        },

        isTextType(type) {
            return ['short', 'short_answer', 'paragraph', 'text'].includes((type || '').toLowerCase());
        },
        isChoiceType(type) {
            return ['multiple_choice', 'multiplechoice', 'checkboxes', 'checkbox'].includes((type || '').toLowerCase());
        },
        isRatingType(type) {
            return ['rating', 'rate'].includes((type || '').toLowerCase());
        },
        choiceColor(idx) {
            const PALETTE = ['#a32a29', '#d9a036', '#723469', '#618a44', '#3d5a92', '#e55353', '#f9c74f', '#90be6d'];
            return PALETTE[idx % PALETTE.length];
        },
    },
    computed: {
        ...mapGetters({
            storeResponses: 'Responses/responses'
        }),
        allSubmittedResponses() {
            // this.responses prop is the form object which has responses array
            // Combine with responses fetched from store and stored in Responses module.
            const listFromProp = (this.responses && this.responses.responses) || [];
            const listFromStore = this.storeResponses || [];
            const combined = [...listFromProp, ...listFromStore];
            
            // Remove duplicates by _id and filter by submit status
            const unique = [];
            const seen = new Set();
            combined.forEach(r => {
                if (r && r._id && !seen.has(r._id)) {
                    if (r.submit === true || r.submit === 'true') {
                        unique.push(r);
                        seen.add(r._id);
                    }
                }
            });
            return unique;
        },

        summaryByQuestion() {
            const PALETTE = ['#a32a29', '#d9a036', '#723469', '#618a44', '#3d5a92', '#e55353', '#f9c74f', '#90be6d'];
            const map = {};
            const order = [];

            this.allSubmittedResponses.forEach(resp => {
                (resp.answers || []).forEach(ans => {
                    const q = ans.question;
                    if (!q || !q._id) return;
                    if (!map[q._id]) {
                        map[q._id] = {
                            _id: q._id,
                            title: q.title,
                            type: (q.type && q.type.type ? q.type.type : 'short').toLowerCase(),
                            responses: [],
                            _rawChoices: {}
                        };
                        order.push(q._id);
                    }
                    const val = ans.response;
                    map[q._id].responses.push(val);

                    if (this.isChoiceType(map[q._id].type)) {
                        const choices = Array.isArray(val) ? val : [val];
                        choices.forEach(c => {
                            if (c) map[q._id]._rawChoices[c] = (map[q._id]._rawChoices[c] || 0) + 1;
                        });
                    }
                });
            });

            return order.map(id => {
                const q = map[id];
                const total = q.responses.length;

                if (this.isChoiceType(q.type)) {
                    q.optionCounts = Object.entries(q._rawChoices).map(([label, count], i) => ({
                        label,
                        count,
                        pct: total > 0 ? Math.round((count / total) * 100) : 0,
                        color: PALETTE[i % PALETTE.length]
                    }));
                }

                if (this.isRatingType(q.type)) {
                    const counts = {};
                    q.responses.forEach(r => { const n = Number(r); if (!isNaN(n)) counts[n] = (counts[n] || 0) + 1; });
                    const maxCount = Math.max(1, ...Object.values(counts));
                    const stars = Object.keys(counts).sort((a, b) => a - b);
                    q.ratingBars = stars.map(s => ({
                        label: `${s} ★`,
                        value: counts[s],
                        percentage: Math.round((counts[s] / maxCount) * 100)
                    }));
                    const topCount = Math.max(...Object.values(counts), 1);
                    q.ratingYAxis = [topCount, Math.round(topCount * 0.75), Math.round(topCount * 0.50), Math.round(topCount * 0.25), 0];
                }

                delete q._rawChoices;
                return q;
            });
        }
    }
}
</script>

<style scoped>
.gap-2 {
    gap: 0.5rem;
}

.custom-btn-light {
    background-color: #f1f5f9 !important;
    border: none !important;
    color: #0f172a !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    box-shadow: none !important;
}

.custom-btn-light:hover {
    background-color: #e2e8f0 !important;
}

.custom-btn-dark {
    background-color: #1e293b !important;
    border: none !important;
    color: white !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    box-shadow: none !important;
}

.custom-btn-dark:hover {
    background-color: #0f172a !important;
}

::v-deep .custom-dropdown .dropdown-toggle {
    background-color: #f1f5f9 !important;
    border: none !important;
    color: #475569 !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    border-radius: 50rem !important;
    display: flex;
    align-items: center;
    box-shadow: none !important;
}

::v-deep .custom-dropdown .dropdown-toggle::after {
    display: none;
    /* Hide default dropdown caret */
}

::v-deep .custom-dropdown .dropdown-toggle:hover {
    background-color: #e2e8f0 !important;
}

/* Response Table Styling */
.custom-response-table {
    border-collapse: collapse;
}

.custom-response-table thead th {
    background-color: #ffffff;
    color: #0f172a;
    font-weight: 600;
    font-size: 0.95rem;
    border-bottom: 1px solid #e2e8f0;
    border-top: none;
    padding: 1rem;
}

.custom-response-table tbody td {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background-color: #ffffff;
}

.custom-response-table tbody tr:last-child td {
    border-bottom: none;
}

.index-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: #f1f5f9;
    color: #475569;
    border-radius: 50%;
    font-size: 0.9rem;
    font-weight: 500;
}

/* Pagination styles */
::v-deep .custom-pagination .page-item .page-link {
    border: none !important;
    background-color: transparent !important;
    color: #475569 !important;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 50%;
    margin: 0 4px;
}

::v-deep .custom-pagination .page-item.active .page-link {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    font-weight: 600;
}

::v-deep .custom-pagination .page-item:not(.active) .page-link:hover {
    background-color: #f8fafc !important;
    color: #1e293b !important;
}

::v-deep .custom-pagination .page-item.disabled .page-link {
    color: #94a3b8 !important;
}

/* Donut Chart & Legend */
.donut-chart {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    /* CSS conic-gradient creating the precise donut chart look from the screenshot */
    background: conic-gradient(#a32a29 0deg 57deg,
            white 57deg 60deg,
            #d9a036 60deg 117deg,
            white 117deg 120deg,
            #723469 120deg 177deg,
            white 177deg 180deg,
            #618a44 180deg 237deg,
            white 237deg 240deg,
            #3d5a92 240deg 297deg,
            white 297deg 300deg,
            #a32a29 300deg 357deg,
            white 357deg 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.donut-inner {
    width: 65%;
    height: 65%;
    background: white;
    border-radius: 50%;
}

.legend-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-right: 10px;
}

/* Rating Chart Styles */
.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    width: 45px;
    padding-right: 12px;
    color: #64748b;
    font-size: 0.85rem;
    position: relative;
    top: -9px;
    /* Align text with top of lines */
}

.chart-area {
    border-left: 1px solid #94a3b8;
    border-bottom: 1px solid #94a3b8;
    position: relative;
    padding: 0 5%;
}

.grid-line {
    position: absolute;
    width: 100%;
    border-top: 1px dashed #e2e8f0;
    left: 0;
    z-index: 1;
}

.bars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    padding: 0 5%;
    z-index: 2;
}

.rating-bar-wrapper {
    width: 40%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.rating-bar {
    width: 100%;
    background-color: #a32a29;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.x-axis-labels {
    color: #64748b;
    font-size: 0.85rem;
    margin-top: 5px;
}

/* Individual View Styles */
.pink-circle {
    background-color: #ffe4e6;
    color: #be123c !important;
}

::v-deep .custom-search .form-control {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    height: 48px;
    border-left: none;
    box-shadow: none;
}

::v-deep .custom-search .input-group-text {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-right: none;
    border-top-left-radius: 0.75rem;
    border-bottom-left-radius: 0.75rem;
    color: #94a3b8;
}
</style>
