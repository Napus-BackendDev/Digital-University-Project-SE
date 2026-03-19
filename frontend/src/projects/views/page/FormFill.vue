<template>
    <div class="flex-grow-1">

        <ButtonBack v-if="!isPublicForm" />

        <!-- Loading -->
        <div v-if="loading" class="fillform-center text-muted">
            <CSpinner color="secondary" />
            <p class="mt-3">{{ $t('common.loading') }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="fillform-center text-danger">
            <p>{{ error }}</p>
        </div>

        <!-- Content -->
        <div v-else-if="form" class="fillform-body">

            <!-- Header Card -->
            <CCard class="mb-3 header-card">
                <div v-if="isPreviewMode" class="preview-banner p-2 text-center text-white font-weight-bold">
                    <CIcon name="cil-magnifying-glass" class="mr-2" />
                    {{ $t('form.previewBanner') }}
                </div>
                <div v-if="isDuplicateMode" class="preview-banner p-2 text-center text-white font-weight-bold">
                    <CIcon name="cil-copy" class="mr-2" />
                    {{ $t('form.duplicateBanner') }}
                </div>
                <CCardBody class="p-4">
                    <h1 class="form-main-title">{{ getLang(form.title) || $t('common.untitled') }}</h1>
                    <p v-if="getLang(form.description)" class="form-main-desc mb-0">
                        {{ getLang(form.description) }}
                    </p>
                </CCardBody>
            </CCard>

            <!-- Question Cards -->
            <CCard v-for="(question, index) in visibleQuestions" :key="question._id || index"
                v-if="isQuestionVisible(question)"
                :id="'question-card-' + question._id" class="mb-3"
                :class="{ 'card-error': errorIds.has(question._id), 'followup-card': isFollowUp(question) }">
                <CCardBody class="p-4">
                    <p v-if="!isType(question, 'title_description', 'image')" :class="['question-index', { 'followup-number': isFollowUp(question) }]">
                        {{ $t('form.question') }} {{ getQuestionNumber(question, index) }}
                    </p>
                    <p v-if="!isType(question, 'title_description', 'image')" class="question-title mb-1">
                        {{ getLang(question.title) }}
                        <span v-if="question.isRequired" class="text-danger ml-1">*</span>
                    </p>
                    <p v-if="!isType(question, 'title_description', 'image') && question.description && question.description.length && getLang(question.description)"
                        class="text-muted small mb-3">
                        {{ getLang(question.description) }}
                    </p>

                    <!-- Short Answer -->
                    <CInput v-if="isType(question, 'short_answer')" v-model="answers[question._id]"
                        :placeholder="$t('form.yourAnswer')" class="mb-0" :disabled="isPreviewMode"
                        @input="(e) => { clearError(question._id); autoSave(); }" />

                    <!-- Paragraph -->
                    <CTextarea v-else-if="isType(question, 'paragraph')" v-model="answers[question._id]"
                        placeholder="Your answer" rows="4" class="mb-0" :disabled="isPreviewMode"
                        @input="(e) => { clearError(question._id); autoSave(); }" />

                    <!-- Multiple Choice / Checkboxes -->
                    <div v-else-if="isType(question, 'multiple_choice', 'checkbox')"
                        class="options-container">
                            <label v-for="(opt, oIdx) in (question.config && question.config.choices || [])" :key="oIdx"
                            class="option-row">
                            <input
                                :type="(question.config && question.config.allowMultipleSelect) ? 'checkbox' : 'radio'"
                                :name="'q_' + question._id" :value="getOptionKey(opt, oIdx)" v-model="answers[question._id]"
                                class="option-input" :disabled="isPreviewMode"
                                @change="(e) => { clearError(question._id); autoSave(); }" />
                            <span>{{ getOptionLabel(opt) }}</span>
                        </label>
                    </div>

                    <!-- Rating -->
                    <div v-else-if="isType(question, 'rating')">
                        <div class="rating-container">
                            <button v-for="n in (question.config && question.config.maxRating || 5)" :key="n"
                                class="star-btn" :class="{ 'star-active': answers[question._id] >= n }"
                                @click="onRate(question._id, n)" type="button" :disabled="isPreviewMode">★</button>
                        </div>
                        <small v-if="answers[question._id]" class="d-block text-center text-muted mt-1">
                            {{ answers[question._id] }} / {{ question.config && question.config.maxRating || 5 }}
                        </small>
                    </div>

                    <!-- File Upload -->
                    <div v-else-if="isType(question, 'file_upload')">
                        <input type="file" :multiple="(question.config && Number(question.config.maxFiles) > 1)"
                            :accept="getAcceptString(question)" class="text-muted" :disabled="isPreviewMode"
                            @change="e => { handleFileChange(question._id, e.target.files, question); clearError(question._id); autoSave(); }" />
                    </div>

                    <!-- Title & Description -->
                    <div v-else-if="isType(question, 'title_description')">
                        <h2 class="section-display-title">{{ getLang(question.title) }}</h2>
                        <p v-if="question.config && question.config.description && question.config.description.length"
                            class="section-display-desc mb-0">{{ getLang(question.config.description) }}</p>
                    </div>

                    <!-- Image -->
                    <img v-else-if="isType(question, 'image') && question.config && question.config.image"
                        :src="question.config.image" class="question-full-image" alt="" />

                    <!-- Fallback -->
                    <CInput v-else v-model="answers[question._id]" :placeholder="$t('form.yourAnswer')" class="mb-0" />
                </CCardBody>
            </CCard>

            <!-- Submit / Duplicate Button -->
            <div v-if="!isPreviewMode" class="p-3 d-flex justify-content-end">
                <CButton v-if="!isDuplicateMode" color="primary" @click="submitForm" :disabled="submitting"
                    class="px-5">
                    <CSpinner v-if="submitting" size="sm" class="mr-1" />
                    {{ submitting ? $t('common.submitting') : $t('form.submit') }}
                </CButton>
                <CButton v-else color="info" @click="duplicateForm" :disabled="submitting"
                    class="px-5 text-white font-weight-bold">
                    <CSpinner v-if="submitting" size="sm" class="mr-1" />
                    <CIcon name="cil-copy" class="mr-2" />
                    {{ submitting ? $t('common.submitting') : $t('form.copyForm') }}
                </CButton>
            </div>

        </div>

        <!-- Modal -->
        <CModal :show.sync="showModal" :centered="true" :close-on-backdrop="true" class="success-modal">
            <template #body-wrapper>
                <div class="success-modal-card">
                    <div class="success-content text-center">
                        <div class="success-icon" aria-hidden="true">
                            <CIcon name="cil-check" size="xl" />
                        </div>

                        <h2 class="success-title">{{ modalTitle }}</h2>
                        <p class="success-message">{{ modalMessage }}</p>

                        <div class="success-actions">
                            <CButton color="success" class="success-ok-button" @click="onModalOk">{{ $t('common.ok') }}</CButton>
                        </div>
                    </div>
                </div>
            </template>
        </CModal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ButtonBack from '../../components/Button/ButtonBack.vue'

export default {
    name: 'Fillform',
    components: {
        ButtonBack
    },
    props: {
        formId: { type: String, required: true },
    },
    data() {
        return {
            form: null,
            answers: {},
            showModal: false,
            modalTitle: '',
            modalMessage: '',
            modalType: '',
            draftResponseId: null,
            submit: false,
            loading: false,
            submitting: false,
            isSaving: false,
            error: null,
            errorIds: new Set(),
            responderId: null
        };
    },
    created() {
        if (this.user && this.user._id) {
            this.responderId = this.user._id;
        }
        this.onInit();
    },
    methods: {
        async onInit() {
            this.loading = true;
            this.error = null;
            try {
                const data = await this.$store.dispatch('Forms/getById', { _id: this.formId });

                this.form = data;

                if (this.isDuplicateMode || this.isPreviewMode) {
                    this.loading = false;
                    return;
                }

                const init = {};
                (data.questions || []).forEach(q => {
                    if (this.isType(q, 'title_description', 'image')) return;
                    const isMulti = (this.isType(q, 'checkboxes', 'checkbox')) ||
                        (this.isType(q, 'multiple_choice') && q.config && q.config.allowMultipleSelect);
                    init[q._id] = isMulti ? [] : null;
                });
                this.answers = init;
                try {
                    await this.$store.dispatch('Responses/get', { form_id: this.form._id });
                    const responses = this.$store.getters['Responses/responses'] || [];
                    const currentResponder = this.user?._id || this.responderId;

                    const draft = (responses || []).find(r => {
                        if (!r) return false;
                        const fId = (typeof r.form === 'object' ? r.form._id : r.form);
                        const rId = (typeof r.responder === 'object' ? r.responder._id : r.responder);
                        return String(fId) === String(this.form._id) && 
                               String(rId) === String(currentResponder) && 
                               !r.submit;
                    });

                    if (draft && draft._id) {
                        this.draftResponseId = draft._id;

                        const questionIds = new Set((this.form.questions || []).map(q => String(q._id)));
                        const map = {};
                        draft.answers.forEach(answer => {
                            if (!answer || !answer.question) return;
                            const qid = JSON.parse(JSON.stringify(answer.question._id));
                            if (!questionIds.has(qid)) return;
                            try {
                                map[qid] = JSON.parse(answer.response);
                            } catch (e) {
                                map[qid] = answer.response;
                            }
                        });
                        this.answers = Object.assign({}, this.answers, map);
                    }
                } catch (e) {
                    console.error('Failed to load draft response:', e);
                }
            } catch (err) {
                this.error = err.message || 'Failed to load form.';
            } finally {
                this.loading = false;
            }
        },

        async saveDraftResponse() {
            if (this.isSaving || this.loading || this.submit || !this.form || !this.form._id || this.isPreviewMode) return;
            this.isSaving = true;
            try {
                const currentResponder = this.user?._id || this.responderId;
                if (!currentResponder && !this.isPreviewMode) return;

                const payload = {
                    responder: currentResponder,
                    form: this.form._id,
                    answers: Object.entries(this.answers).map(([question, response]) => ({ question, response })),
                    submit: this.submit
                };
                if (this.draftResponseId) {
                    await this.$store.dispatch('Responses/update', Object.assign({ _id: this.draftResponseId }, payload));
                } else {
                    const res = await this.$store.dispatch('Responses/create', payload);
                    const created = res && res.data && res.data.data;
                    let id = null;
                    if (!created) {
                        id = null;
                    } else if (Array.isArray(created)) {
                        id = created[0] && created[0]._id;
                    } else if (created._id) {
                        id = created._id;
                    } else if (created.data && created.data._id) {
                        id = created.data._id;
                    }
                    if (id) this.draftResponseId = id;
                }
            } catch (err) {
                console.error('Auto-save failed:', err);
            } finally {
                this.isSaving = false;
            }
        },

        autoSave() {
            if (this.submit) return;
            this.saveDraftResponse().catch(err => {
                console.error('Auto-save failed:', err);
            });
        },

        onRate(questionId, n) {
            this.$set(this.answers, questionId, n);
            this.clearError(questionId);
            this.autoSave();
        },

        getTitle(arr) {
            if (!arr || !arr.length) return '';
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase();
            const match = arr.find(t => t.key && t.key.toUpperCase() === lang);
            return match ? match.value : arr[0].value;
        },

        getType(q) {
            const t = q.type;
            if (!t) return '';
            return (typeof t === 'object' ? (t.type || '') : t).toLowerCase();
        },

        isType(q, ...types) {
            console.log(JSON.parse(JSON.stringify(q)));
            return types.includes(this.getType(q));
        },

        getOptionKey(opt, oIdx) {
            if (opt && (opt.key !== undefined && opt.key !== null)) return String(opt.key);
            return String(oIdx);
        },
        getOptionLabel(opt) {
            if (!opt || !opt.lang || !opt.lang.length) return '';
            return this.getLang(opt.lang);
        },
        convertIdToStr(val) {
            if (!val && val !== 0) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
                if (val._id) return (val._id && val._id.toString) ? val._id.toString() : String(val._id);
                if (val.toString && typeof val.toString === 'function') return val.toString();
            }
            return String(val);
        },
        getFollowUpChildId(entry) {
            if (!entry && entry !== 0) return null;
            if (typeof entry === 'object') {
                if (entry.question !== undefined && entry.question !== null) {
                    if (Array.isArray(entry.question) && entry.question.length) return this.convertIdToStr(entry.question[0]);
                    return this.convertIdToStr(entry.question);
                }
                if (entry._id) return this.convertIdToStr(entry._id);
                return null;
            }
            return this.convertIdToStr(entry);
        },
        getParentForFollowUp(question) {
            try {
                if (!question || !question._id) return null;
                const map = this.followUpMap || {};
                const entries = map[String(question._id)];
                if (!entries || !entries.length) return null;
                const p = entries[0];
                const parentId = p.parentId;
                const parent = (this.form && Array.isArray(this.form.questions)) ? this.form.questions.find(q => String(q._id) === String(parentId)) : null;
                if (!parent) return null;
                return { parent, meta: p };
            } catch (e) {
                return null;
            }
        },
        getAncestorChain(question) {
            const chain = [];
            try {
                let pObj = this.getParentForFollowUp(question);
                while (pObj && pObj.parent) {
                    chain.push(pObj.parent);
                    pObj = this.getParentForFollowUp(pObj.parent);
                }
            } catch (e) {
                // ignore
            }
            return chain.reverse();
        },
        getQuestionNumber(question, index) {
            try {
                // Build ancestor chain root -> immediate parent
                const ancestors = this.getAncestorChain(question);
                const parts = [];

                // Compute numbers for ancestors
                for (let aIdx = 0; aIdx < ancestors.length; aIdx++) {
                    const anc = ancestors[aIdx];
                    const ancParentObj = this.getParentForFollowUp(anc);
                    if (!ancParentObj || !ancParentObj.parent) {
                        // anc is top-level: compute its top-level number among non-followups
                        let topNum = 0;
                        for (let i = 0; i < this.form.questions.length; i++) {
                            const item = this.form.questions[i];
                            if (!this.isFollowUp(item)) topNum++;
                            if (item === anc) break;
                        }
                        parts.push(String(topNum));
                    } else {
                        const parentQ = ancParentObj.parent;
                        let childPos = 0;
                        if (Array.isArray(parentQ.followUp)) {
                            const ancIdStr = this.getFollowUpChildId(anc);
                            for (let i = 0; i < parentQ.followUp.length; i++) {
                                if (this.getFollowUpChildId(parentQ.followUp[i]) === ancIdStr) {
                                    childPos = i + 1;
                                    break;
                                }
                            }
                        }
                        parts.push(String(childPos || 1));
                    }
                }

                const immediateParentObj = this.getParentForFollowUp(question);
                if (immediateParentObj && immediateParentObj.parent) {
                    const parentQ = immediateParentObj.parent;
                    let childPos = 0;
                    if (Array.isArray(parentQ.followUp)) {
                        const myIdStr = this.getFollowUpChildId(question);
                        for (let i = 0; i < parentQ.followUp.length; i++) {
                            if (this.getFollowUpChildId(parentQ.followUp[i]) === myIdStr) {
                                childPos = i + 1;
                                break;
                            }
                        }
                    }
                    parts.push(String(childPos || 1));
                    return parts.join('.');
                }
            } catch (e) {
                // fallback to default numbering
            }

            let num = 0;
            for (let i = 0; i <= index && i < this.visibleQuestions.length; i++) {
                const item = this.visibleQuestions[i];
                if (!this.isFollowUp(item)) num++;
            }
            return num;
        },
        getAcceptString(question) {
            if (!question || !question.config || !Array.isArray(question.config.fileTypes)) return '';
            const map = {
                img: 'image/*',
                pdf: '.pdf',
                docs: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                sheet: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
            const types = question.config.fileTypes.map(t => map[t] || '').filter(Boolean);
            return types.join(',');
        },
        handleFileChange(questionId, files, question) {
            if (!files) return;
            const arr = Array.from(files || []);
            const accept = this.getAcceptString(question);
            let filtered = arr;
            if (accept) {
                const acceptParts = accept.split(',').map(s => s.trim().toLowerCase());
                filtered = arr.filter(f => {
                    const name = (f.name || '').toLowerCase();
                    const type = (f.type || '').toLowerCase();
                    return acceptParts.some(a => {
                        if (a.endsWith('/*')) {
                            const prefix = a.replace('/*', '');
                            return type.startsWith(prefix);
                        }
                        if (a.startsWith('.')) {
                            return name.endsWith(a);
                        }
                        return type === a;
                    });
                });
            }

            const max = question && question.config && Number(question.config.maxFiles) ? Number(question.config.maxFiles) : filtered.length;
            if (max <= 1) {
                this.$set(this.answers, questionId, filtered[0] || null);
            } else {
                this.$set(this.answers, questionId, filtered.slice(0, max));
            }
        },
        clearError(questionId) {
            if (this.errorIds.has(questionId)) {
                const next = new Set(this.errorIds);
                next.delete(questionId);
                this.errorIds = next;
            }
        },
        isFollowUp(question) {
            if (!question || !question._id) return false;
            const map = this.followUpMap || {};
            const entries = map[String(question._id)];
            return Array.isArray(entries) && entries.length > 0;
        },
        isQuestionVisible(question) {
            if (!this.form || !Array.isArray(this.form.questions) || !question || !question._id) return true;
            const childId = String(question._id);
            const map = this.followUpMap || {};
            const parents = map[childId];
            if (!parents || parents.length === 0) return true;
            for (const p of parents) {
                const parentAnswer = this.answers[p.parentId];
                if (parentAnswer === undefined || parentAnswer === null) continue;
                const neededKey = String(p.key);
                if (Array.isArray(parentAnswer)) {
                    if (parentAnswer.map(a => String(a)).includes(neededKey)) return true;
                } else {
                    if (String(parentAnswer) === neededKey) return true;
                }
            }
            return false;
        },
        async duplicateForm() {
            this.submitting = true;
            try {
                // 1. Create a new form without questions
                const formPayload = {
                    title: this.form.title.map(t => ({ ...t, value: (this.getLang(t) || t.value) + ' (Copy)' })),
                    description: [...this.form.description],
                    settings: { ...this.form.settings },
                    status: this.form.status ? (typeof this.form.status === 'object' ? this.form.status._id : this.form.status) : '69b0e3adf864c1088c19da36',
                    originalFormId: this.form._id,
                    creator: 'ewfopkwoefkwoefk'
                };

                const formRes = await this.$store.dispatch('Forms/create', formPayload);
                const newFormId = formRes.data.data._id;

                // 2. Clone each question
                // Since the Questions model has a post-save hook that updates the Form, 
                // creating them one-by-one is sufficient.
                if (this.form.questions && this.form.questions.length > 0) {
                    for (const q of this.form.questions) {
                        const questionPayload = {
                            form: newFormId,
                            title: q.title.map(t => ({ ...t })),
                            description: q.description ? q.description.map(d => ({ ...d })) : [],
                            type: q.type ? (typeof q.type === 'object' ? q.type._id : q.type) : null,
                            config: JSON.parse(JSON.stringify(q.config || {})),
                            isRequired: !!q.isRequired,
                            order: q.order || 1
                        };
                        await this.$store.dispatch('Questions/create', questionPayload);
                    }
                }

                this.modalTitle = this.$t('common.success');
                this.modalMessage = this.$t('form.duplicateSuccess');
                this.modalType = 'success';
                this.showModal = true;

                // Set custom OK handler to go to editor
                this.onModalOk = () => {
                    this.showModal = false;
                    this.$router.push({ name: 'EditorCreateForm', params: { _id: newFormId } });
                };

            } catch (err) {
                console.error('Duplication failed:', err);
                this.modalTitle = this.$t('common.error');
                this.modalMessage = this.$t('common.error'); // Or a more specific key if I add it
                this.modalType = 'error';
                this.showModal = true;
            } finally {
                this.submitting = false;
            }
        },

        async submitForm() {
            const missing = (this.form.questions || []).filter(q => {
                const isGlobalRequired = this.form && this.form.requireResponse;
                if (!isGlobalRequired && !q.isRequired) return false;
                const a = this.answers[q._id];
                return Array.isArray(a) ? a.length === 0 : (a === null || a === '' || a === undefined);
            });
            if (missing.length) {
                this.errorIds = new Set(missing.map(q => q._id));
                this.$nextTick(() => {
                    const el = document.getElementById('question-card-' + missing[0]._id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                return;
            }
            this.errorIds = new Set();
            
            const currentResponder = this.user?._id || this.responderId;

            if (!currentResponder) {
                this.modalTitle = this.$t('form.notAuthenticated');
                this.modalMessage = this.$t('form.loginRequired');
                this.modalType = 'error';
                this.showModal = true;
                return;
            }

            this.submit = true;
            this.submitting = true;
            try {
                const currentResponder = this.user?._id || this.responderId;
                const createPayload = {
                    responder: currentResponder,
                    form: this.form._id,
                    answers: Object.entries(this.answers).map(([question, response]) => ({ question, response }))
                };

                if (!this.draftResponseId) {
                    try {
                        const res = await this.$store.dispatch('Responses/create', Object.assign({}, createPayload, { submit: this.submit }));
                        const created = res && res.data && res.data.data;
                        let id = null;
                        if (created) {
                            if (Array.isArray(created)) id = created[0] && created[0]._id;
                            else if (created._id) id = created._id;
                            else if (created.data && created.data._id) id = created.data._id;
                        }
                        if (id) this.draftResponseId = id;
                    } catch (e) {
                        console.error('Failed to create draft response before final submission:', e);
                    }
                }

                const payload = Object.assign({ _id: this.draftResponseId }, createPayload, { submit: this.submit });

                if (this.draftResponseId) {
                    await this.$store.dispatch('Responses/update', payload);
                } else {
                    await this.$store.dispatch('Responses/create', Object.assign({}, createPayload, { submit: this.submit }));
                }

                this.modalTitle = this.$t('common.success');
                this.modalMessage = this.$t('form.successMessage');
                this.modalType = 'success';
                this.showModal = true;
            } catch (err) {
                this.modalTitle = this.$t('common.error');
                this.modalMessage = this.$t('common.error');
                this.modalType = 'error';
                this.showModal = true;
                console.error('submitForm error:', err);
            } finally {
                this.submitting = false;
            }
            this.autoSave();
        },

        onModalOk() {
            this.showModal = false;
            this.$router.back();
        }
    },
    computed: {
        ...mapGetters('User', ['user']),
        isDuplicateMode() {
            return this.$route.query.mode === 'duplicate';
        },
        isPreviewMode() {
            return this.$route.query.mode === 'preview' || this.$route.name === 'Preview';
        },
        isPublicForm() {
            const isInternalMode = ['preview', 'duplicate'].includes(this.$route.query.mode);
            const isInternalSource = this.$route.query.source === 'internal';
            const isPreviewRoute = this.$route.name === 'Preview';

            return this.$route.name === 'FormFill' && !isInternalMode && !isInternalSource && !isPreviewRoute;
        }
        ,
        followUpMap() {
            const map = {};
            if (!this.form || !Array.isArray(this.form.questions)) return map;

            const qlist = this.form.questions || [];
            for (const q of qlist) {
                if (!q || !Array.isArray(q.followUp)) continue;
                for (const f of q.followUp) {
                    if (!f) continue;
                    const entries = [];
                    // followUp entries may map a key to a question or questions
                    const key = f.key !== undefined && f.key !== null ? String(f.key) : null;
                    if (f.question !== undefined && f.question !== null) {
                        if (Array.isArray(f.question)) {
                            f.question.forEach(qobj => {
                                const cid = (typeof qobj === 'object' && qobj._id) ? String(qobj._id) : String(qobj);
                                if (!map[cid]) map[cid] = [];
                                map[cid].push({ parentId: String(q._id), key });
                            });
                        } else {
                            const cid = (typeof f.question === 'object' && f.question._id) ? String(f.question._id) : String(f.question);
                            if (!map[cid]) map[cid] = [];
                            map[cid].push({ parentId: String(q._id), key });
                        }
                    }
                }
            }
            return map;
        },

        visibleQuestions() {
            if (!this.form || !Array.isArray(this.form.questions)) return [];
            const built = [];
            const pushedIds = new Set();
            const qlist = this.form.questions || [];

            const findQuestionById = id => {
                if (!id && id !== 0) return null;
                const idStr = (typeof id === 'object' && id._id) ? String(id._id) : String(id);
                return qlist.find(q => (q && q._id) && String(q._id) === idStr) || null;
            };

            const pushWithFollow = q => {
                if (!q) return;
                const idStr = (q._id && String(q._id)) || null;
                if (idStr && pushedIds.has(idStr)) return;
                if (idStr) pushedIds.add(idStr);
                built.push(q);

                if (Array.isArray(q.followUp) && q.followUp.length) {
                    for (const f of q.followUp) {
                        try {
                            if (f && typeof f === 'object') {
                                if (f._id) {
                                    const found = findQuestionById(f._id);
                                    if (found) pushWithFollow(found);
                                } else if (f.question !== undefined && f.question !== null) {
                                    if (Array.isArray(f.question) && f.question.length) {
                                        for (const ref of f.question) {
                                            const found = findQuestionById(ref);
                                            if (found) pushWithFollow(found);
                                        }
                                    } else {
                                        const found = findQuestionById(f.question);
                                        if (found) pushWithFollow(found);
                                    }
                                } else {
                                    const found = findQuestionById(f);
                                    if (found) pushWithFollow(found);
                                }
                            } else {
                                const found = findQuestionById(f);
                                if (found) pushWithFollow(found);
                            }
                        } catch (e) {
                            // ignore individual follow-up errors
                        }
                    }
                }
            };

            for (const q of qlist) {
                const qId = (q && q._id) ? String(q._id) : null;
                if (qId && pushedIds.has(qId)) continue;
                pushWithFollow(q);
            }

            return built;
        }
    },
    watch: {
        answers: {
            handler() {
                this.autoSave();
            },
            deep: true
        }
    }
}
</script>

<style scoped>
.back-btn {
    font-weight: 500;
}

.fillform-body {
    margin: 28px auto;
    padding: 0 16px 60px;
}

.fillform-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

.header-card {
    border-top: 8px solid #1a73e8;
    border-radius: 12px !important;
}

.form-main-title {
    font-size: 1.9rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 8px;
}

.form-main-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

.preview-banner {
    background-color: #6366f1;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
}

.form-divider {
    border: none;
    border-top: 1px solid #e8eaed;
    margin: 20px 0 14px;
}

.question-label-hint {
    font-size: 0.82rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.question-index {
    font-size: 0.78rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.question-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f1f1f;
}

.options-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin: 0;
    font-weight: normal;
    width: 100%;
}

.option-input {
    width: 18px;
    height: 18px;
    accent-color: #1a73e8;
    cursor: pointer;
    flex-shrink: 0;
}

/* Rating stars */
.rating-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
}

.star-btn {
    background: none;
    border: none;
    font-size: 1.9rem;
    cursor: pointer;
    color: #dadce0;
    padding: 0;
    line-height: 1;
    flex: 1;
    text-align: center;
    transition: color 0.15s, transform 0.1s;
}

.star-btn:hover,
.star-btn.star-active {
    color: #f9ab00;
}

.star-btn:hover {
    transform: scale(1.15);
}

.star-btn:focus,
.star-btn:focus-visible {
    outline: none;
    box-shadow: none;
}

.section-display-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 6px;
}

.section-display-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

.question-full-image {
    display: block;
    width: 100%;
    border-radius: 4px;
}

.card-error {
    border: 1.5px solid #e55353 !important;
    border-radius: 8px;
}

.success-modal .modal-dialog {
    max-width: 420px;
}

.success-modal-card {
    background: #fff;
    border-radius: 16px;
    padding: 28px 28px 20px;
    position: relative;
    box-shadow: 0 10px 30px rgba(60, 64, 67, 0.15);
}

.success-modal-card .modal-close {
    position: absolute;
    right: 12px;
    top: 10px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #9aa0a6;
    cursor: pointer;
}

.success-content {
    padding-top: 6px;
}

.success-icon {
    width: 72px;
    height: 72px;
    margin: 6px auto 12px;
    border-radius: 50%;
    background-color: #34A853;
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-icon svg {
    color: #fff;
    width: 36px;
    height: 36px;
}

.success-title {
    margin: 8px 0 6px;
    font-size: 1.6rem;
    font-weight: 700;
    color: #202124;
}

.success-message {
    color: #5f6368;
    font-size: 0.98rem;
    margin-bottom: 18px;
}

.success-actions {
    display: flex;
    justify-content: center;
}

.followup-card {
    background-color: #FFFBEB !important;
    border: 1px solid #FDE68A !important;
}

.question-index.followup-number {
    background: #FFF3CD;
    border: 1px solid #F7C948;
    color: #b45309;
    padding: 0.35rem 0.5rem;
    border-radius: 999px;
    display: inline-block;
    font-weight: 600;
}

.success-ok-button {
    min-width: 160px;
    background-color: #34A853 !important;
    border-color: #34A853 !important;
    color: #fff !important;
}

/* Hide default modal header/footer inside our modal */
::v-deep .success-modal .modal-header,
::v-deep .success-modal .modal-footer {
    display: none !important;
}

/* Ensure modal content uses our rounded layout */
::v-deep .success-modal .modal-content {
    background: transparent;
    box-shadow: none;
}
</style>