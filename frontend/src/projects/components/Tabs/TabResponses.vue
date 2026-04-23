<template>
        <div class="responses-container">
        <!-- Toolbar -->
        <div class="d-flex justify-content-between align-items-center mb-4 px-3">
            <div>
                <h2 class="section-title mb-1">{{ $t('responses.title') }}</h2>
                <div class="response-count-badge">
                    <div class="pulse-dot"></div>
                    {{ allSubmittedResponses.length }} {{ $t('responses.total') }}
                </div>
            </div>

            <div class="d-flex align-items-center view-toggle-group">
                <div class="toggle-pill-wrapper">
                    <button :class="['toggle-pill', currentView === 'summary' ? 'active' : '']"
                        @click="currentView = 'summary'">
                        <CIcon name="cil-chart-pie" size="sm" class="mr-2" />
                        {{ $t('responses.summary') }}
                    </button>
                    <button :class="['toggle-pill', currentView === 'individual' ? 'active' : '']"
                        @click="currentView = 'individual'">
                        <CIcon name="cil-list" size="sm" class="mr-2" />
                        {{ $t('responses.individual') }}
                    </button>
                </div>

                <div class="divider-vertical mx-3"></div>

                <CDropdown class="custom-export-dropdown">
                    <template #toggler>
                        <CButton class="btn-export-main">
                            <CIcon name="cil-data-transfer-down" size="sm" class="mr-2" />
                            {{ $t('responses.export') }}
                            <CIcon name="cil-chevron-bottom" size="sm" class="ml-2" />
                        </CButton>
                    </template>
                    <CDropdownItem @click="exportXlsx" class="dropdown-item-modern">
                        <CIcon name="cil-spreadsheet" size="sm" class="mr-2 text-success" />
                        {{ $t('responses.excel') }}
                    </CDropdownItem>
                    <CDropdownItem @click="downloadJson" class="dropdown-item-modern">
                        <CIcon name="cil-code" size="sm" class="mr-2 text-primary" />
                        {{ $t('responses.json') }}
                    </CDropdownItem>
                </CDropdown>
            </div>
        </div>

        <!-- SUMMARY VIEW -->
        <div v-if="currentView === 'summary'" class="summary-wrapper">
            <!-- Empty state -->
            <div v-if="allSubmittedResponses.length === 0" class="empty-state-card py-5 shadow-sm rounded-20 bg-white">
                <div class="empty-icon-wrapper mb-3">
                    <CIcon name="cil-coffee" size="xl" class="text-muted opacity-50" />
                </div>
                <h4 class="text-dark font-weight-bold">{{ $t('responses.noData') }}</h4>
                <p class="text-muted">{{ $t('responses.noDataDesc') }}</p>
            </div>

            <!-- Dynamic question cards -->
            <div v-for="(q, qIdx) in summaryByQuestion" :key="q._id" class="question-response-card mb-5">
                <div class="card-inner p-4 p-md-5">
                    <!-- Header Section -->
                    <div class="d-flex justify-content-between align-items-start mb-4 pb-4 border-bottom-soft">
                        <div class="d-flex align-items-center">
                            <div class="q-index-circle mr-3">
                                <span>{{ qIdx + 1 }}</span>
                            </div>
                            <div>
                                <h3 class="q-title-display mb-1">{{ getTitle(q.title) }}</h3>
                                <div class="q-type-badge" :class="'type-' + q.type">
                                    <CIcon :name="getTypeIcon(q.type)" size="sm" class="mr-1" />
                                    {{ formatTypeLabel(q.type) }}
                                </div>
                            </div>
                        </div>
                        <div class="q-stat-pill">
                            <span class="count">{{ q.responses.length }}</span>
                            <span class="label">Responses</span>
                        </div>
                    </div>

                    <!-- ── CONTENT RENDERING ── -->
                    <div class="content-area">
                        <!-- ── SHORT / PARAGRAPH ── -->
                        <template v-if="isTextType(q.type)">
                            <div class="text-responses-list">
                                <div v-for="(r, i) in paginateResponses(q._id, q.responses)" :key="i"
                                    class="text-response-item">
                                    <div class="item-index">{{ ((currentPageMap[q._id] || 1) - 1) * 5 + (i + 1) }}</div>
                                    <div class="item-text">{{ r || '—' }}</div>
                                </div>
                            </div>

                            <!-- Pagination for Text Responses -->
                            <div v-if="q.responses.length > 5">
                                <Pagination :activePage="currentPageMap[q._id] || 1"
                                    :pages="Math.ceil(q.responses.length / 5)"
                                    @update:activePage="(v) => handlePageChange(q._id, v)" />
                            </div>
                        </template>

                        <!-- ── MULTIPLE CHOICE / CHECKBOXES ── -->
                        <template v-else-if="isChoiceType(q.type)">
                            <div class="choices-viz-grid mt-2">
                                <div v-for="(opt, oIdx) in q.optionCounts" :key="oIdx" class="choice-viz-item mb-4">
                                    <div class="d-flex justify-content-between align-items-end mb-2">
                                        <div class="choice-label-group">
                                            <div class="label-text">{{ opt.label }}</div>
                                            <div class="label-pct">{{ opt.pct }}%</div>
                                        </div>
                                        <div class="choice-count">{{ opt.count }}</div>
                                    </div>
                                    <div class="custom-progress-container">
                                        <div class="custom-progress-fill" 
                                            :style="{ width: opt.pct + '%', backgroundColor: opt.color }">
                                            <div class="gloss-overlay"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- ── RATING ── -->
                        <template v-else-if="isRatingType(q.type)">
                            <div class="chart-box-modern">
                                <CChartBar :datasets="q.chartData.datasets" :labels="q.chartData.labels" :options="chartOptions"
                                    style="height: 280px" />
                            </div>
                        </template>

                        <!-- ── FILE UPLOAD ── -->
                        <template v-else-if="isFileType(q.type)">
                            <div class="file-responses-grid">
                                <div v-for="(r, i) in q.responses.slice(0, 6)" :key="i" class="file-response-item">
                                    <div class="item-index">{{ i + 1 }}</div>
                                    <div class="item-content">
                                        <a :href="resolveImageUrl(r)" target="_blank" rel="noopener noreferrer" class="file-link">
                                            <img v-if="isImageResponse(r)" :src="resolveImageUrl(r)" class="file-image-preview" />
                                            <span v-else class="item-text">{{ fileNameFromPath(r) }}</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- ── FALLBACK ── -->
                        <template v-else>
                            <div class="text-responses-list">
                                <div v-for="(r, i) in q.responses.slice(0, 3)" :key="i" class="text-response-item">
                                    <div class="item-index">{{ i + 1 }}</div>
                                    <div class="item-text">{{ r || '—' }}</div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- INDIVIDUAL VIEW -->
        <div v-else-if="currentView === 'individual'" class="individual-responses-wrapper">
            <div class="question-response-card p-4 p-md-5">
                <div class="d-flex align-items-center mb-4 pb-4 border-bottom-soft px-2">
                    <div class="q-index-circle mr-3">
                        <CIcon name="cil-list" size="sm" />
                    </div>
                    <h3 class="mb-0 font-weight-bold section-title-inner" style="color: #0f172a;">{{ $t('responses.individual') }}</h3>
                </div>
                <ResponseTables :responseList="allSubmittedResponses" />
            </div>
        </div>
    </div>
</template>

<script>
import moment from 'moment'
import * as XLSX from 'xlsx'
import { CChartBar } from '@coreui/vue-chartjs'
import ResponseTables from '@/projects/components/tables/ResponseTables.vue'
import Pagination from '@/projects/components/Util/Pagination.vue'

export default {
    name: 'TabResponses',
    components: { ResponseTables, CChartBar, Pagination },
    props: {
        responses: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            currentView: 'summary',
            currentPageMap: {}, // Track current page per question { qId: 1 }
            activePage: 1,
            activePageParagraph: 1,
            activePageIndividual: 1,
            loading: false,
            error: null,
            copied: false,
        }
    },
    watch: {
    },
    methods: {
        handlePageChange(qId, page) {
            this.$set(this.currentPageMap, qId, page);
        },
        paginateResponses(qId, responses) {
            const page = this.currentPageMap[qId] || 1;
            const size = 5;
            const start = (page - 1) * size;
            return responses.slice(start, start + size);
        },
        getTypeIcon(type) {
            const t = (type || '').toLowerCase();
            if (t.includes('choice')) return 'cil-circle';
            if (t.includes('check')) return 'cil-square';
            if (t.includes('rating')) return 'cil-star';
            if (t.includes('short')) return 'cil-minus';
            if (t.includes('para')) return 'cil-align-left';
            return 'cil-question';
        },
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            return rawType
                .split(/[_\s]+/)
                .map(seg => seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : '')
                .join(' ');
        },
        exportXlsx() {
            if (!this.allSubmittedResponses.length) {
                alert(this.$t('responses.noExportData'));
                return;
            }

            // 1. Identify "Department" question index to avoid duplicates
            const firstAnswers = this.allSubmittedResponses[0].answers || [];
            let deptQuestionIdx = -1;
            
            firstAnswers.forEach((a, i) => {
                const title = a.question && Array.isArray(a.question.title) && a.question.title.length
                    ? this.getTitle(a.question.title).toLowerCase()
                    : '';
                if (title === 'department' || title.includes('แผนก') || title.includes('ฝ่าย') || title.includes('สังกัด')) {
                    deptQuestionIdx = i;
                }
            });

            // 2. Prepare Headers (Responder, Department, Submitted, then Others)
            const headers = ['Responder', 'Department', 'Submitted'];
            const questionHeaders = [];
            firstAnswers.forEach((a, i) => {
                if (i === deptQuestionIdx) return; // Skip because it's promoted to the 2nd column
                const title = a.question && Array.isArray(a.question.title) && a.question.title.length
                    ? this.getTitle(a.question.title)
                    : `Question ${i + 1}`;
                questionHeaders.push(title);
            });
            headers.push(...questionHeaders);

            // 3. Prepare Rows
            const rows = this.allSubmittedResponses.map(r => {
                let responderName = '-';
                let departmentValue = '-';

                const getOrganizationLabel = (org) => {
                    if (!org) return '-';
                    if (typeof org === 'string') return org;
                    if (Array.isArray(org.title)) {
                        return this.getTitle(org.title) || '-';
                    }
                    return org.name || org.title || org.organizationName || '-';
                };
                
                // Extract responder name
                if (r.responder && typeof r.responder === 'object') {
                    responderName = r.responder.name || r.responder.fullname || r.responder.username || r.responder.email || 'Anonymous';
                } else if (r.responderName) {
                    responderName = r.responderName;
                } else if (typeof r.responder === 'string') {
                    responderName = r.responder;
                }

                // Extract Department value (Priority: Question answer > Responder metadata)
                const ansList = r.answers || [];
                if (deptQuestionIdx !== -1 && ansList[deptQuestionIdx]) {
                    const deptAns = ansList[deptQuestionIdx].response;
                    departmentValue = Array.isArray(deptAns) ? deptAns.join(', ') : (deptAns || '-');
                } else {
                    if (r.responder && typeof r.responder === 'object' && r.responder.organization) {
                        departmentValue = getOrganizationLabel(r.responder.organization);
                    } else {
                        departmentValue = r.department || r.organization || r.responderDepartment || '-';
                    }
                }

                const row = [
                    responderName,
                    departmentValue,
                    this.formatDate(r.createdAt)
                ];

                // Add other question answers
                ansList.forEach((a, i) => {
                    if (i === deptQuestionIdx) return; // Skip promoted column
                    
                    let val = a.response;
                    const qType = a.question && a.question.type 
                        ? (a.question.type.type || a.question.type).toString().toLowerCase() 
                        : '';
                    
                    if (this.isChoiceType(qType) && a.question) {
                        const options = (a.question.config && a.question.config.choices) 
                            ? a.question.config.choices 
                            : (a.question.options || []);
                        const choices = Array.isArray(val) ? val : (val !== null && val !== undefined ? [val] : []);
                        const labels = choices.map(c => {
                            let opt = options.find(o => o && (o.key === c || (o._id && o._id.toString() === c) || (o.value === c)));
                            if (!opt && !isNaN(c) && options[Number(c)]) opt = options[Number(c)];
                            if (opt) return (opt.lang && Array.isArray(opt.lang)) ? this.getTitle(opt.lang) : (opt.label ? this.getTitle(opt.label) : (opt.value || c));
                            return c;
                        });
                        val = labels.join(', ');
                    } else {
                        val = Array.isArray(val) ? val.join(', ') : (val === null || val === undefined ? '' : String(val));
                    }
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

            // Generate filename: [Form Title]_[Timestamp].xlsx
            const formTitle = this.getTitle(this.responses.title) || 'responses';
            const timestamp = moment().format('YYYY-MM-DD');
            const filename = `${formTitle}(${timestamp}).xlsx`;
            
            XLSX.writeFile(workbook, filename);
        },

        // ── Download JSON ─────────────────────────────────────────────────
        downloadJson() {
            if (!this.allSubmittedResponses.length) {
                alert(this.$t('responses.noExportData'));
                return;
            }

            const formTitle = this.getTitle(this.responses.title) || 'responses';
            const formDescription = this.getTitle(this.responses.description) || '';
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

            // Wrap in a metadata object for better context
            const exportData = {
                formTitle: formTitle,
                description: formDescription,
                exportedAt: timestamp,
                totalResponses: this.allSubmittedResponses.length,
                responses: this.allSubmittedResponses.map(r => {
                    const responseObj = {
                        responder: r.responder?.name || r.responderName || 'Anonymous',
                        email: r.responder?.email || '',
                        submittedAt: this.formatDate(r.createdAt),
                        answers: {}
                    };

                    (r.answers || []).forEach((a, i) => {
                        const questionTitle = a.question && Array.isArray(a.question.title) 
                            ? this.getTitle(a.question.title) 
                            : `Question ${i + 1}`;
                        
                        let val = a.response;
                        const qType = a.question && a.question.type 
                            ? (a.question.type.type || a.question.type).toString().toLowerCase() 
                            : '';
                        
                        // Robust choice label resolution
                        if (this.isChoiceType(qType) && a.question) {
                            const options = (a.question.config && Array.isArray(a.question.config.choices)) 
                                ? a.question.config.choices 
                                : (a.question.options || []);
                            
                            const choices = Array.isArray(val) ? val : (val !== null && val !== undefined ? [val] : []);
                            const labels = choices.map(c => {
                                // Try to find the option by key, id, or value
                                let opt = options.find(o => o && (o.key === String(c) || (o._id && o._id.toString() === String(c)) || (o.value === String(c))));
                                if (!opt && !isNaN(c) && options[Number(c)]) opt = options[Number(c)];
                                
                                if (opt) {
                                    return (opt.lang && Array.isArray(opt.lang)) 
                                        ? this.getTitle(opt.lang) 
                                        : (opt.label ? this.getTitle(opt.label) : (opt.value || c));
                                }
                                return c;
                            });
                            val = labels.length ? labels.join(', ') : (val || '');
                        } else {
                            val = Array.isArray(val) ? val.join(', ') : (val === null || val === undefined ? '' : val);
                        }
                        
                        responseObj.answers[questionTitle] = val;
                    });

                    return responseObj;
                })
            };

            const filename = `${formTitle}(${moment().format('YYYY-MM-DD')}).json`;
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", filename);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
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
            return ['rating', 'rating'].includes((type || '').toLowerCase());
        },
        isFileType(type) {
            const t = (type || '').toLowerCase();
            return t.includes('file');
        },
        isImageResponse(value) {
            if (!value || typeof value !== 'string') return false;
            const lower = value.toLowerCase();
            return lower.startsWith('data:image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(lower);
        },
        resolveImageUrl(value) {
            if (!value || typeof value !== 'string') return '#';
            if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
                return value;
            }

            const apiBase = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1/';
            const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
            if (value.startsWith('/')) {
                return `${backendOrigin}${value}`;
            }

            return `${backendOrigin}/${value}`;
        },
        fileNameFromPath(value) {
            if (!value || typeof value !== 'string') return 'Attachment';
            const clean = value.split('?')[0];
            const parts = clean.split('/');
            return parts[parts.length - 1] || 'Attachment';
        },
        choiceColor(idx) {
            const PALETTE = ['#a32a29', '#d9a036', '#723469', '#618a44', '#3d5a92', '#e55353', '#f9c74f', '#90be6d'];
            return PALETTE[idx % PALETTE.length];
        },
    },
    computed: {
        allSubmittedResponses() {
            const list = (this.responses && this.responses.responses) || [];
            const unique = [];
            const seen = new Set();

            const isMeaningful = (r) => {
                if (!r) return false;
                if (r.submit === true || r.submit === 'true') return true;
                return Array.isArray(r.answers) && r.answers.some(a => a && a.response !== null && a.response !== undefined && a.response !== '');
            };

            list.forEach(r => {
                if (r && r._id && !seen.has(r._id)) {
                    if (isMeaningful(r)) {
                        unique.push(r);
                        seen.add(r._id);
                    }
                }
            });
            return unique;
        },
        
        chartOptions() {
            return {
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1, // Ensure integer labels
                            precision: 0,
                            fontColor: '#64748b'
                        },
                        gridLines: {
                            color: '#e2e8f0',
                            borderDash: [2, 4],
                            drawBorder: false
                        }
                    }],
                    xAxes: [{
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            fontColor: '#64748b',
                            fontSize: 12
                        }
                    }]
                },
                tooltips: {
                    backgroundColor: '#1e293b',
                    titleFontSize: 14,
                    bodyFontSize: 14,
                    displayColors: false,
                    callbacks: {
                        label: (tooltipItem) => {
                            return `Responses: ${tooltipItem.yLabel}`;
                        }
                    }
                }
            }
        },

        summaryByQuestion() {
            const PALETTE = ['#a32a29', '#d9a036', '#723469', '#618a44', '#3d5a92', '#e55353', '#f9c74f', '#90be6d'];
            const map = {};
            const order = [];

            this.allSubmittedResponses.forEach(resp => {
                (resp.answers || []).forEach(ans => {
                    // ans.question may be a populated object or just an id
                    let qRaw = ans.question;
                    let qId = null;
                    let qObj = null;

                    if (!qRaw) return;

                    if (typeof qRaw === 'string' || typeof qRaw === 'number') {
                        qId = qRaw.toString();
                    } else if (qRaw._id) {
                        qId = qRaw._id.toString();
                        qObj = qRaw;
                    } else if (qRaw.id) {
                        qId = qRaw.id.toString();
                    }

                    // Try to resolve question metadata from the form prop if available
                    if (!qObj && this.responses && Array.isArray(this.responses.questions)) {
                        qObj = this.responses.questions.find(qq => qq && (qq._id && qq._id.toString && qq._id.toString() === qId) || (qq.id && qq.id.toString && qq.id.toString() === qId));
                    }

                    // If still no qId but qObj found, set qId
                    if (!qId && qObj && qObj._id) qId = qObj._id.toString();

                    if (!qId) return;

                    if (!map[qId]) {
                        const title = (qObj && qObj.title) ? qObj.title : (qRaw && qRaw.title) ? qRaw.title : [{ key: 'en', value: 'Unknown question' }];
                        const typeVal = (qObj && qObj.type) ? (qObj.type.type || qObj.type) : (qRaw && qRaw.type ? (qRaw.type.type || qRaw.type) : 'short');
                        
                        // Handle both standard options array and config.choices from your JSON
                        let options = [];
                        if (qObj && qObj.config && Array.isArray(qObj.config.choices)) options = qObj.config.choices;
                        else if (qObj && Array.isArray(qObj.options)) options = qObj.options;

                        map[qId] = {
                            _id: qId,
                            title,
                            type: (typeVal || 'short').toString().toLowerCase(),
                            responses: [],
                            _rawChoices: {},
                            options: options
                        };
                        order.push(qId);
                    }

                    const val = ans.response;
                    map[qId].responses.push(val);

                    if (this.isChoiceType(map[qId].type)) {
                        const choices = Array.isArray(val) ? val : (val !== null && val !== undefined ? [val] : []);
                        choices.forEach(c => {
                            if (c !== null && c !== undefined) map[qId]._rawChoices[c] = (map[qId]._rawChoices[c] || 0) + 1;
                        });
                    }
                });
            });

            return order.map(id => {
                const q = map[id];
                const total = q.responses.length;

                if (this.isChoiceType(q.type)) {
                    q.optionCounts = Object.entries(q._rawChoices).map(([respKey, count], i) => {
                        let label = respKey;
                        // Map key to option label if possible
                        if (q.options && q.options.length > 0) {
                            // Try finding by key string (from your JSON: { "key": "0", "lang": [...] })
                            let opt = q.options.find(o => o && (o.key === respKey || (o._id && o._id.toString() === respKey) || (o.value === respKey)));
                            
                            // If not found by key, try by numeric index
                            if (!opt && !isNaN(respKey) && q.options[Number(respKey)]) {
                                opt = q.options[Number(respKey)];
                            }

                            if (opt) {
                                // Extract title using multilingual lang array or label field
                                label = (opt.lang && Array.isArray(opt.lang)) 
                                    ? this.getTitle(opt.lang) 
                                    : (opt.label ? this.getTitle(opt.label) : (opt.value || respKey));
                            }
                        }

                        return {
                            label,
                            count,
                            pct: total > 0 ? Math.round((count / total) * 100) : 0,
                            color: PALETTE[i % PALETTE.length]
                        };
                    });
                }

                if (this.isRatingType(q.type)) {
                    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                    q.responses.forEach(r => { 
                        const n = Math.round(Number(r)); 
                        if (n >= 1 && n <= 5) counts[n] = (counts[n] || 0) + 1; 
                    });

                    q.chartData = {
                        labels: ['1 ★', '2 ★', '3 ★', '4 ★', '5 ★'],
                        datasets: [
                            {
                                label: 'Responses',
                                backgroundColor: '#a32a29',
                                data: [counts[1], counts[2], counts[3], counts[4], counts[5]],
                                barPercentage: 0.6,
                                categoryPercentage: 0.8
                            }
                        ]
                    };
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

.file-responses-grid {
    display: grid;
    gap: 12px;
}

.file-response-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
}

.file-response-item .item-content {
    flex: 1;
}

.file-link {
    display: inline-flex;
    align-items: center;
    color: inherit;
    text-decoration: none;
}

.file-image-preview {
    max-width: 220px;
    max-height: 120px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    object-fit: cover;
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

/* Pagination styles are now handled by Util/Pagination.vue component */

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

/* Premium Dashboard CSS */
.responses-container {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.section-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #1e293b;
    letter-spacing: -0.02em;
}

.response-count-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 14px;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 600;
    border: 1px solid #e2e8f0;
}

.pulse-dot {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    margin-right: 10px;
    box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* View Toggle Pills */
.toggle-pill-wrapper {
    background: #f1f5f9;
    padding: 4px;
    border-radius: 14px;
    display: flex;
    border: 1px solid #e2e8f0;
}

.toggle-pill {
    padding: 8px 18px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
}

.toggle-pill:hover:not(.active) {
    background: rgba(0,0,0,0.03);
    color: #1e293b;
}

.toggle-pill.active {
    background: white;
    color: #1e293b;
    box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.divider-vertical {
    width: 1px;
    height: 24px;
    background: #cbd5e1;
}

/* Export Button Modern */
.btn-export-main {
    background: white !important;
    border: 1px solid #e2e8f0 !important;
    color: #1e293b !important;
    padding: 10px 20px !important;
    border-radius: 12px !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    transition: all 0.2s ease !important;
}

.btn-export-main:hover {
    background: #f8fafc !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
}

.dropdown-item-modern {
    padding: 12px 20px !important;
    font-weight: 500 !important;
    font-size: 0.9rem !important;
}

/* Empty State Card */
.empty-state-card {
    border: 1px dashed #cbd5e1;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 200px;
}

/* Question Response Card Elite */
.question-response-card {
    background: white;
    border-radius: 24px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
    border: 1px solid rgba(241, 245, 249, 1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: hidden;
}

.question-response-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02);
}

.card-inner {
    border-top: 1px solid #f8fafc;
}

.border-bottom-soft {
    border-bottom: 1px solid #f1f5f9;
}

.q-index-circle {
    min-width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1e293b;
    font-weight: 800;
    font-size: 1.1rem;
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.8);
}

.q-title-display {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
}

.q-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.q-stat-pill {
    background: #f1f5f9;
    padding: 8px 16px;
    border-radius: 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
}

.q-stat-pill .count {
    color: #1e293b;
    font-weight: 800;
    font-size: 1.1rem;
    line-height: 1;
}

.q-stat-pill .label {
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
}

/* Text List Clean Modern */
.text-responses-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.text-response-item {
    display: flex;
    padding: 14px 18px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
    transition: all 0.2s ease;
}

.text-response-item:hover {
    background: white;
    border-color: #e2e8f0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.03);
    transform: translateX(4px);
}

.item-index {
    color: #94a3b8;
    font-weight: 700;
    font-size: 0.85rem;
    min-width: 24px;
}

.item-text {
    color: #1e293b;
    font-weight: 500;
    line-height: 1.5;
}

/* Custom Progress Visualization Elite */
.choice-viz-item {
    padding-left: 2px;
}

.choice-label-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.label-text {
    font-weight: 700;
    color: #1e293b;
    font-size: 1rem;
}

.label-pct {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
}

.choice-count {
    color: #64748b;
    font-weight: 600;
    font-size: 0.9rem;
}

.custom-progress-container {
    height: 10px;
    background: #f1f5f9;
    border-radius: 50rem;
    overflow: hidden;
    position: relative;
    border: 1px solid #e2e8f0;
}

.custom-progress-fill {
    height: 100%;
    border-radius: 50rem;
    position: relative;
    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.gloss-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: rgba(255,255,255,0.15);
    border-radius: 50rem;
}

.chart-box-modern {
    padding-top: 20px;
}

/* Individual Table Card Elite */
.table-card-premium {
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
    border: 1px solid #f1f5f9;
}

/* Custom Pagination Modern Styles */
.custom-pagination-modern {
    gap: 5px;
}

::v-deep .custom-pagination-modern .page-item .page-link {
    border: none !important;
    background-color: #f1f5f9 !important;
    border-radius: 10px !important;
    color: #64748b !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    padding: 8px 14px !important;
    transition: all 0.2s ease;
    min-width: 40px;
    display: flex;
    justify-content: center;
}

::v-deep .custom-pagination-modern .page-item.active .page-link {
    background: #1e293b !important;
    color: white !important;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

::v-deep .custom-pagination-modern .page-item:not(.active):hover .page-link {
    background-color: #e2e8f0 !important;
    color: #1e293b !important;
    transform: translateY(-2px);
}

::v-deep .custom-pagination-modern .page-item.disabled .page-link {
    opacity: 0.5;
    background-color: #f8fafc !important;
}

@media (max-width: 768px) {
    .view-toggle-group {
        flex-direction: column;
        width: 100%;
        gap: 15px;
    }
    .toggle-pill-wrapper {
        width: 100%;
    }
    .toggle-pill {
        flex: 1;
        justify-content: center;
    }
    .divider-vertical {
        display: none;
    }
}
</style>
