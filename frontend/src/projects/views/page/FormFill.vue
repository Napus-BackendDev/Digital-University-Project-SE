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

            <!-- Login Required Overlay -->
            <div v-if="isLoginRequired" class="fillform-center text-center mt-5">
                <CCard class="border-0 shadow p-4 mx-auto" style="border-radius: 20px; max-width: 450px;">
                    <CCardBody>
                        <div class="mb-4">
                            <CIcon name="cil-lock-locked" size="3xl" class="text-primary mb-3"
                                style="width: 60px; height: 60px;" />
                            <h4 class="font-weight-bold">{{ $t('form.loginRequired') }}</h4>
                            <p class="text-muted">{{ $t('form.collectEmail') }}</p>
                        </div>
                        <CButton color="primary" block size="lg" style="border-radius: 12px; font-weight: 600;"
                            @click="onAuthenGoogle">
                            {{ $t('form.signInWithGoogle') }}
                        </CButton>
                    </CCardBody>
                </CCard>
            </div>

            <!-- Content below replaces the blocking overlay -->
            <template v-if="true">
                <CCard class="mb-3 border header-card">
                    <div v-if="isPreviewMode" class="preview-banner p-2 text-center text-white font-weight-bold">
                        <CIcon name="cil-magnifying-glass" class="mr-2" />
                        {{ $t('form.previewBanner') }}
                    </div>
                    <div v-if="isDuplicateMode" class="preview-banner p-2 text-center text-white font-weight-bold">
                        <CIcon name="cil-copy" class="mr-2" />
                        {{ $t('form.duplicateBanner') }}
                    </div>
                    <div v-if="isAlreadySubmitted" class="summary-banner p-2 text-center text-white font-weight-bold">
                        <CIcon name="cil-check-circle" class="mr-2" />
                        {{ $t('form.alreadySubmitted') }}
                    </div>
                    <CCardBody class="p-4">
                        <h1 class="form-main-title">{{ getLang(form.title) || $t('common.untitled') }}</h1>
                        <p v-if="getLang(form.description)" class="form-main-desc mb-0">
                            {{ getLang(form.description) }}
                        </p>
                    </CCardBody>
                </CCard>

                <!-- Question Cards -->
                <transition-group name="fade-slide" tag="div">
                    <CCard v-for="(question, index) in visibleQuestions" :key="convertIdToStr(question._id) || index"
                        v-if="isQuestionVisible(question)" :id="'question-card-' + convertIdToStr(question._id)"
                        class="mb-3"
                        :class="['question-card border', { 'card-error': errorIds.has(question._id), 'followup-card': isFollowUp(question) }]">
                        <CCardBody class="p-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <p v-if="!isType(question, 'title_description', 'image')"
                                    :class="['question-index', { 'followup-number': isFollowUp(question) }]">
                                    {{ $t('form.question') }} {{ getQuestionNumber(question, index) }}
                                </p>
                                <!-- Answered Badge -->
                                <span v-if="hasAnswer(question._id)" class="answered-badge">
                                    <CIcon name="cil-check-circle" size="sm" class="mr-1" />
                                    {{ $t('form.answered') || 'ตอบแล้ว' }}
                                </span>
                            </div>
                            <p v-if="!isType(question, 'title_description', 'image')" class="question-title mb-1">
                                {{ getLang(question.title) }}
                                <span v-if="question.isRequired" class="text-danger ml-1">*</span>
                            </p>
                            <p v-if="!isType(question, 'title_description', 'image') && question.description && question.description.length && getLang(question.description)"
                                class="text-muted small mb-3">
                                {{ getLang(question.description) }}
                            </p>

                            <!-- Short Answer -->
                            <CInput v-if="isType(question, 'short_answer')"
                                v-model="answers[convertIdToStr(question._id)]" :placeholder="$t('form.yourAnswer')"
                                class="mb-0" :disabled="isPreviewMode || isAlreadySubmitted"
                                @input="(e) => { clearError(question._id); autoSave(); }"
                                @change="(e) => { scrollToNextQuestion(question); }" />

                            <!-- Paragraph -->
                            <CTextarea v-else-if="isType(question, 'paragraph')"
                                v-model="answers[convertIdToStr(question._id)]" placeholder="Your answer" rows="4"
                                class="mb-0" :disabled="isPreviewMode || isAlreadySubmitted"
                                @input="(e) => { clearError(question._id); autoSave(); }"
                                @change="(e) => { scrollToNextQuestion(question); }" />

                            <!-- Multiple Choice / Checkboxes -->
                            <div v-else-if="isType(question, 'multiple_choice', 'checkbox')" class="options-container">
                                <label v-for="(opt, oIdx) in (question.config && question.config.choices || [])"
                                    :key="oIdx" class="option-row">
                                    <input
                                        :type="(question.config && question.config.allowMultipleSelect) ? 'checkbox' : 'radio'"
                                        :name="'q_' + convertIdToStr(question._id)" :value="getOptionKey(opt, oIdx)"
                                        v-model="answers[convertIdToStr(question._id)]" class="option-input"
                                        :disabled="isPreviewMode || isAlreadySubmitted"
                                        @change="(e) => { clearError(question._id); autoSave(); scrollToNextQuestion(question); }"
                                        @click="scrollToNextQuestion(question)" />
                                    <span>{{ getOptionLabel(opt) }}</span>
                                </label>
                            </div>

                            <!-- Rating -->
                            <div v-else-if="isType(question, 'rating')">
                                <div class="rating-container">
                                    <button v-for="n in (question.config && question.config.maxRating || 5)" :key="n"
                                        class="star-btn"
                                        :class="{ 'star-active': answers[convertIdToStr(question._id)] >= n }"
                                        @click="{ scrollToNextQuestion(question); onRate(question, n); }" type="button"
                                        :disabled="isPreviewMode || isAlreadySubmitted">★</button>
                                </div>
                                <small v-if="answers[convertIdToStr(question._id)]"
                                    class="d-block text-center text-muted mt-1">
                                    {{ answers[convertIdToStr(question._id)] }} / {{ question.config &&
                                        question.config.maxRating || 5
                                    }}
                                </small>
                            </div>

                            <!-- File Upload -->
                            <div v-else-if="isType(question, 'file_upload')">
                                <input type="file" :multiple="(question.config && Number(question.config.maxFiles) > 1)"
                                    :accept="getAcceptString(question)" class="text-muted"
                                    :disabled="isPreviewMode || isAlreadySubmitted"
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
                            <CInput v-else v-model="answers[question._id]" :placeholder="$t('form.yourAnswer')"
                                class="mb-0" />
                        </CCardBody>
                    </CCard>
                </transition-group>

                <!-- Submit / Duplicate Button -->
                <div v-if="!isPreviewMode && !isAlreadySubmitted" id="submit-section"
                    class="p-3 d-flex justify-content-end">
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

            </template>
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
                            <CButton color="success" class="success-ok-button" @click="onModalOk">{{ $t('common.ok') }}
                            </CButton>
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
            needsSave: false,
            saveTimeout: null,
            error: null,
            isNewMode: false,
            errorIds: new Set(),
            responderId: null,
            isAlreadySubmitted: false, // New state for Limit to One Response
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

                this.form = {
                    ...data,
                    questions: [...(data.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
                };

                // 2. Check for "Limit to One Response" and "Collect Email" requirements
                const settings = this.form.settings || {};
                let currentResponder = this.user?._id || this.responderId;

                // If collectEmail is true and user is not logged in, we stay in a "Login Required" state
                if (settings.collectEmail && !currentResponder && !this.isPreviewMode) {
                    this.loading = false;
                    return;
                }

                if (this.isDuplicateMode || this.isPreviewMode) {
                    this.loading = false;
                    return;
                }

                const init = {};
                (data.questions || []).forEach(q => {
                    if (this.isType(q, 'title_description', 'image')) return;
                    const isMulti = (this.isType(q, 'checkboxes', 'checkbox')) ||
                        (this.isType(q, 'multiple_choice') && q.config && q.config.allowMultipleSelect);
                    init[this.convertIdToStr(q._id)] = isMulti ? [] : null;
                });
                this.answers = init;
                try {
                    // 3. Fetch user responses for this form
                    await this.$store.dispatch('Responses/get', { form_id: this.form._id });
                    const allFormResponses = this.$store.getters['Responses/responses'] || [];

                    // Check if already submitted (for Limit to One Response)
                    if (settings.limitResponse) {
                        const submitted = allFormResponses.find(r => {
                            if (!r) return false;
                            const fId = (typeof r.form === 'object' ? r.form._id : r.form);
                            const rId = (typeof r.responder === 'object' ? r.responder._id : r.responder);
                            return String(fId) === String(this.form._id) &&
                                String(rId) === String(currentResponder) &&
                                r.submit;
                        });
                        if (submitted) {
                            this.isAlreadySubmitted = true;
                            this.loading = false;

                            // Load submitted answers
                            if (submitted.answers) {
                                const submittedInit = {};
                                submitted.answers.forEach(ans => {
                                    if (ans && ans.question) {
                                        const qId = typeof ans.question === 'object' ? ans.question._id : ans.question;
                                        submittedInit[qId] = ans.value;
                                    }
                                });
                                this.answers = { ...this.answers, ...submittedInit };
                            }
                            return; // Stop here as we just want to view
                        }
                    }

                    // 4. Ensure user is loaded (if not already found)
                    if (!currentResponder) {
                        await this.$store.dispatch('User/get', { _id: '69aec1c73996270d703db3aa' });
                        currentResponder = this.user?._id;
                    }

                    // If New Mode is active, we don't load any existing draft
                    if (this.isNewMode) {
                        this.loading = false;
                        return;
                    }

                    // 5. Build/Find draft from the responses we already fetched
                    let responsesToProcess = allFormResponses;
                    // If we need to fetch specifically for THIS user (though dispatching Responses/get with form_id usually gets all for that form)
                    if (!responsesToProcess || responsesToProcess.length === 0) {
                        const res = await this.$store.dispatch('Responses/get', {
                            form: this.form._id,
                            responder: currentResponder
                        });
                        responsesToProcess = this.$store.getters['Responses/responses'] || [];
                        if (res && !Array.isArray(res)) {
                            responsesToProcess = [res];
                        }
                    }

                    let draft = (responsesToProcess || []).find(r => {
                        if (!r) return false;
                        const fId = (typeof r.form === 'object' ? r.form._id : r.form);
                        const rId = (typeof r.responder === 'object' ? r.responder._id : r.responder);
                        return String(fId) === String(this.form._id) &&
                            String(rId) === String(currentResponder) &&
                            !r.submit;
                    });

                    if (!draft) {
                        draft = (responses || []).find(r => {
                            if (!r) return false;
                            const fId = (typeof r.form === 'object' ? r.form._id : r.form);
                            const rId = (typeof r.responder === 'object' ? r.responder._id : r.responder);
                            return String(fId) === String(this.form._id) &&
                                String(rId) === String(currentResponder);
                        });
                    }

                    if (draft && draft._id) {
                        this.draftResponseId = draft._id;

                        const questionIds = new Set((this.form.questions || []).map(q => String(q._id)));
                        const map = {};
                        draft.answers.forEach(answer => {
                            if (!answer || !answer.question) return;
                            const qid = typeof answer.question === 'object' && answer.question !== null
                                ? String(answer.question._id || answer.question)
                                : String(answer.question);
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

        saveDraftResponse() {
            if (this.submit || !this.form || !this.form._id || this.isPreviewMode) return;
            this.performSave();
        },

        async performSave() {
            // Queue save if already in progress
            if (this.isSaving) {
                this.needsSave = true;
                return;
            }

            const currentResponder = this.user?._id || this.responderId;
            if (!currentResponder) return;

            this.isSaving = true;
            this.needsSave = false;

            try {
                // Determine if we actually have anything to save
                const hasAnyAnswer = Object.values(this.answers).some(a => {
                    if (Array.isArray(a)) return a.length > 0;
                    return a !== null && a !== undefined && String(a).trim() !== '';
                });

                if (!this.draftResponseId && !hasAnyAnswer) {
                    this.isSaving = false;
                    return;
                }

                const payload = {
                    responder: currentResponder,
                    form: this.form._id,
                    answers: Object.entries(this.answers).map(([question, response]) => ({ question, response })),
                    submit: this.submit
                };

                // Double check for existing responses if we don't have an ID yet
                // SKIP this check if we are explicitly in New Mode to allow a fresh creation
                if (!this.draftResponseId && !this.isNewMode) {
                    const existing = (this.$store.getters['Responses/responses'] || []).find(r => {
                        if (!r) return false;
                        const fId = (typeof r.form === 'object' ? r.form._id : r.form);
                        const rId = (typeof r.responder === 'object' ? r.responder._id : r.responder);
                        return String(fId) === String(this.form._id) &&
                            String(rId) === String(currentResponder) &&
                            !r.submit; // Only match unsubmitted drafts
                    });
                    if (existing && existing._id) {
                        this.draftResponseId = existing._id;
                    }
                }

                if (this.draftResponseId) {
                    await this.$store.dispatch('Responses/update', Object.assign({ _id: this.draftResponseId }, payload));
                } else {
                    const res = await this.$store.dispatch('Responses/create', payload);
                    const rawData = res && res.data ? res.data : res;
                    const createdNode = rawData && rawData.data ? rawData.data : rawData;

                    let id = null;
                    if (Array.isArray(createdNode)) {
                        id = createdNode[0]?._id;
                    } else {
                        id = createdNode?._id || createdNode?.id;
                    }

                    if (id) {
                        this.draftResponseId = id;
                    }
                }
            } catch (err) {
                console.error('Auto-save failed:', err);
            } finally {
                this.isSaving = false;
                // If a change happened while saving, trigger another save immediately to sync last data
                if (this.needsSave) {
                    this.performSave();
                }
            }
        },

        autoSave() {
            if (this.submit) return;
            this.saveDraftResponse().catch(err => {
                console.error('Auto-save failed:', err);
            });
        },

        onRate(question, n) {
            const qIdStr = this.convertIdToStr(question._id);
            this.$set(this.answers, qIdStr, n);
            this.autoSave();
        },

        async onAuthenGoogle() {
            try {
                const googleUser = await this.$gAuth.signIn();
                if (googleUser) {
                    const profile = googleUser.getBasicProfile();
                    const body = {
                        email: profile.getEmail(),
                        name: profile.getName()
                    };
                    // Sync user with backend and update store
                    const user = await this.$store.dispatch('User/get', body);
                    if (user) {
                        this.responderId = user._id;
                        this.onInit(); // Refresh form state with new user
                    }
                }
            } catch (err) {
                console.error('Google sign-in error:', err);
            }
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
            const qIdStr = this.convertIdToStr(questionId);
            if (max <= 1) {
                this.$set(this.answers, qIdStr, filtered[0] || null);
                if (filtered[0]) this.scrollToNextQuestion(question);
            } else {
                this.$set(this.answers, qIdStr, filtered.slice(0, max));
                if (filtered.length > 0) this.scrollToNextQuestion(question);
            }
        },
        clearError(questionId) {
            const qIdStr = this.convertIdToStr(questionId);
            if (this.errorIds.has(qIdStr)) {
                const next = new Set(this.errorIds);
                next.delete(qIdStr);
                this.errorIds = next;
            }
        },
        isFollowUp(question) {
            if (!question || !question._id) return false;
            const map = this.followUpMap || {};
            const entries = map[String(question._id)];
            return Array.isArray(entries) && entries.length > 0;
        },
        isQuestionVisible(question, _visited = null) {
            if (!this.form || !Array.isArray(this.form.questions) || !question || !question._id) return true;
            const visited = _visited || new Set();
            const childId = String(question._id);
            if (visited.has(childId)) return false;
            visited.add(childId);

            const map = this.followUpMap || {};
            const parents = map[childId];
            if (!parents || parents.length === 0) return true;
            for (const p of parents) {
                const parentQ = this.form.questions.find(q => String(q._id) === String(p.parentId));
                if (!parentQ) continue;

                if (!this.isQuestionVisible(parentQ, visited)) continue;
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
            if (!this.form) return;
            this.submitting = true;
            try {
                const baseData = JSON.parse(JSON.stringify(this.form));

                const clonedQuestions = (baseData.questions || []).map((q, index) => {
                    const newQ = { ...q };

                    newQ._id = `tmp-${Date.now()}-${index}`;

                    delete newQ.id;
                    delete newQ.createdAt;
                    delete newQ.updatedAt;

                    if (newQ.type && typeof newQ.type === 'object') {
                        newQ.type = newQ.type._id || newQ.type.id;
                    }

                    return newQ;
                });

                const duplicateData = {
                    ...baseData,
                    title: baseData.title.map(t => ({ ...t, value: (this.getLang(t) || t.value) + ' (Copy)' })),
                    questions: clonedQuestions,
                    organization: Array.isArray(baseData.organization)
                        ? baseData.organization.map(o => (typeof o === 'object' ? o._id : o))
                        : []
                };

                delete duplicateData._id;
                delete duplicateData.id;
                delete duplicateData.responses;
                delete duplicateData.creator;
                delete duplicateData.createdAt;
                delete duplicateData.updatedAt;

                this.$router.push({
                    name: 'EditorCreateForm',
                    params: { _id: 'new' },
                    query: { mode: 'duplicate' }
                });

                this.$store.commit('Forms/setDuplicateBuffer', duplicateData);

            } catch (err) {
                console.error('Duplication preparation failed:', err);
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
        },
        hasAnswer(questionId) {
            const ans = this.answers[this.convertIdToStr(questionId)];
            if (Array.isArray(ans)) return ans.length > 0;
            return ans !== null && ans !== undefined && String(ans).trim() !== '';
        },
        scrollToNextQuestion(question) {
            if (!question) return;

            setTimeout(() => {
                const qIdStr = this.convertIdToStr(question._id);
                const answer = this.answers[qIdStr];

                let targetId = null;

                if (answer && question.config && Array.isArray(question.config.choices)) {
                    if (!Array.isArray(answer)) {
                        const choice = question.config.choices.find((c, idx) => String(this.getOptionKey(c, idx)) === String(answer));
                        if (choice && choice.nextQuestion) targetId = choice.nextQuestion;
                    }
                }

                if (!targetId && question.nextQuestion) {
                    targetId = question.nextQuestion;
                }

                if (!targetId || targetId === 'submit') {
                    const currentIndex = this.visibleQuestions.findIndex(q => this.convertIdToStr(q._id) === qIdStr);
                    if (currentIndex !== -1 && currentIndex < this.visibleQuestions.length - 1) {
                        if (targetId !== 'submit') targetId = this.visibleQuestions[currentIndex + 1]._id;
                    } else {
                        targetId = 'submit';
                    }
                }

                if (targetId) {
                    const targetIdStr = this.convertIdToStr(targetId);
                    if (targetIdStr === 'submit') {
                        const submitSection = document.getElementById('submit-section');
                        if (submitSection) submitSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    } else {
                        const el = document.getElementById('question-card-' + targetIdStr) ||
                            document.getElementById('question-' + targetIdStr);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 300);
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
        },
        isFirstTime() {
            return !this.draftResponseId;
        },
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
            const qlist = [...(this.form.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

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
        },
        isLoginRequired() {
            const settings = this.form?.settings || {};
            const currentResponder = this.user?._id || this.responderId;
            return settings.collectEmail && !currentResponder && !this.isPreviewMode;
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
    padding: 0 16px 50vh;
    /* Allow enough space for any question to be centered */
}

.fillform-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

.header-card {
    border-radius: 12px !important;
    padding: 0;
    overflow: hidden;
    position: relative;
    transition: border-left-color 0.3s, background 0.3s, box-shadow 0.3s;
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

.answered-badge {
    background-color: #ecfdf5;
    color: #059669;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    border: 1px solid #10b98133;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-3px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.summary-banner {
    background: linear-gradient(90deg, #2eb85c 0%, #1b8d44 100%);
    border-radius: 8px 8px 0 0;
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
    margin-bottom: 8px;
    display: inline-block;
    background: #f8fafc;
    border: 1px solid #e6eef6;
    color: #374151;
    border-radius: 999px;
    padding: 0.35rem 0.5rem;
    font-weight: 600;
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
    padding: 8px 10px;
    border-radius: 6px;
}

.option-input {
    width: 18px;
    height: 18px;
    accent-color: #1a73e8;
    cursor: pointer;
    flex-shrink: 0;
}

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

.question-card {
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #eef3f8;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03);
}

.followup-card {
    background-color: #FFFBEB !important;
    border: 1px solid #FDE68A !important;
}

.followup-card {
    margin-left: 18px;
    padding-left: 6px;
}

/* Transition for follow-up show/hide */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 220ms cubic-bezier(.2, .8, .2, 1);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(-6px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
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