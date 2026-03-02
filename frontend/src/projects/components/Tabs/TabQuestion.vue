<template>
    <div class="mt-3">
        <CCard class="mb-3">
            <CCardBody class="p-4">
                <div class="form-header-section">

                    <!-- ── Form Title (multilingual) ── -->
                    <div class="mb-3">
                        <div v-for="(titleItem, tIdx) in (form.title || [])" :key="'ft-' + tIdx"
                            class="d-flex align-items-center mb-1">
                            <CInput class="lang-key-input flex-shrink-0 mb-0 mr-2" v-model="titleItem.key"
                                @change="updateFormMeta" maxlength="3" placeholder="EN" style="width: 3.2rem;" />
                            <CInput class="form-title-input flex-grow-1 mb-0" size="lg" v-model="titleItem.value"
                                @change="updateFormMeta" placeholder="Form Title" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.title && form.title.length > 1" @click="removeFormTitle(tIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="secondary" class="d-flex align-items-center p-1 mt-1"
                            @click="addFormTitle">
                            <CIcon name="cil-plus" class="mr-1" />
                            <small>Add title language</small>
                        </CButton>
                    </div>

                    <!-- ── Form Description (multilingual) ── -->
                    <div>
                        <div v-for="(descItem, dIdx) in (form.description || [])" :key="'fd-' + dIdx"
                            class="d-flex align-items-center mb-1">
                            <CInput class="lang-key-input flex-shrink-0 mb-0 mr-2" v-model="descItem.key"
                                @change="updateFormMeta" maxlength="3" placeholder="EN" style="width: 3.2rem;" />
                            <CTextarea class="form-desc-input flex-grow-1 mb-0" v-model="descItem.value"
                                @change="updateFormMeta" placeholder="Form Description" rows="2" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.description && form.description.length > 1" @click="removeFormDesc(dIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="secondary" class="d-flex align-items-center p-1 mt-1"
                            @click="addFormDesc">
                            <CIcon name="cil-plus" class="mr-1" />
                            <small>Add description language</small>
                        </CButton>
                    </div>

                </div>
            </CCardBody>
        </CCard>

        <CRow>
            <CCol md="9">
                <CCard v-for="(question, index) in localQuestions" :key="question._id || index"
                    class="mb-3 position-relative">
                    <CCardBody class="p-4">

                        <!-- ── HEADER: title inputs (left) + delete button (right) ── -->
                        <div class="d-flex justify-content-between align-items-start mb-2">

                            <!-- Left: multilingual title rows -->
                            <div class="flex-grow-1">
                                <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                    class="d-flex align-items-center mb-1">
                                    <!-- Language key input (EN / TH / etc.) -->
                                    <CInput class="lang-key-input flex-shrink-0 mb-0 mr-1" v-model="titleItem.key"
                                        @change="updateQuestionTitle(question)" maxlength="3" placeholder="EN"
                                        style="width: 3.2rem;" />
                                    <!-- Question title text -->
                                    <CInput class="flex-grow-1 mb-0" v-model="titleItem.value"
                                        @change="updateQuestionTitle(question)" placeholder="Untitled Question"
                                        style="background-color: #f8fafc;" />
                                    <!-- Remove language row (only when more than 1) -->
                                    <CButton color="danger" variant="ghost" size="sm" class="ml-1 flex-shrink-0"
                                        v-if="question.title && question.title.length > 1"
                                        @click="removeTitle(question, titleIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>

                                <!-- Add language button -->
                                <CButton variant="ghost" color="secondary" class="d-flex align-items-center p-1 mt-1"
                                    @click="addTitle(question)">
                                    <CIcon name="cil-plus" class="mr-1" />
                                    <small>Add language</small>
                                </CButton>
                            </div>

                            <!-- Right: delete question -->
                            <div class="ml-2 flex-shrink-0">
                                <CButton color="danger" variant="ghost" @click="removeQuestion(question._id)">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                        </div>
                        <!-- END HEADER -->

                        <!-- ── Description (multilingual, same structure as title) ── -->
                        <div class="mb-2">
                            <div v-for="(descItem, descIndex) in (question.description || [])" :key="descIndex"
                                class="d-flex align-items-center mb-1">
                                <!-- Language key input -->
                                <CInput class="lang-key-input flex-shrink-0 mb-0 mr-1" v-model="descItem.key"
                                    @change="updateQuestionDescription(question)" maxlength="3" placeholder="EN"
                                    style="width: 3.2rem;" />
                                <!-- Description text -->
                                <CInput class="flex-grow-1 mb-0" v-model="descItem.value"
                                    @change="updateQuestionDescription(question)" placeholder="Description (optional)"
                                    style="background-color: #f8fafc;" />
                                <!-- Remove row (only when more than 1) -->
                                <CButton color="danger" variant="ghost" size="sm" class="ml-1 flex-shrink-0"
                                    v-if="question.description && question.description.length > 1"
                                    @click="removeDescription(question, descIndex)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>

                            <!-- Add description language button -->
                            <CButton variant="ghost" color="secondary" class="d-flex align-items-center p-1 mt-1"
                                @click="addDescription(question)">
                                <CIcon name="cil-plus" class="mr-1" />
                                <small>Add description language</small>
                            </CButton>
                        </div>

                        <!-- ── Dashed "add field" placeholder ── -->
                        <div class="mb-3">
                            <CButton block color="light" variant="outline" class="text-muted"
                                style="border-style: dashed; border-color: #ced4da;">
                                <span style="font-size: 1.1rem; line-height: 1;">+</span>
                            </CButton>
                        </div>

                        <!-- ── Question type preview ── -->
                        <div
                            v-if="['short', 'short_answer'].includes(getQuestionTypeString(question.type).toLowerCase())">
                            <CInput disabled style="opacity: 0.55;" placeholder="Short answer text" />
                        </div>

                        <div v-else-if="getQuestionTypeString(question.type).toLowerCase() === 'paragraph'">
                            <CTextarea disabled style="opacity: 0.55;" placeholder="Long answer text" rows="3" />
                        </div>
                        <div
                            v-else-if="getQuestionTypeString(question.type).toLowerCase().replace(' ', '_') === 'multiple_choice'">
                            <div v-for="(opt, oIndex) in question.config.options" :key="oIndex"
                                class="d-flex align-items-center mb-1">
                                <div class="border rounded-circle mr-2 flex-shrink-0"
                                    style="width: 18px; height: 18px;" />
                                <CInput class="flex-grow-1" :value="opt && opt.lang && opt.lang[0] && opt.lang[0].choice && opt.lang[0].choice[0]
                                    ? opt.lang[0].choice[0].value
                                    : (typeof opt === 'string' ? opt : '')" :placeholder="`Option ${oIndex + 1}`"
                                    @input="updateOption(question, oIndex, $event)" />
                                <CButton color="danger" variant="ghost" size="sm" class="ml-1"
                                    v-if="question.config.options.length > 1" @click="removeOption(question, oIndex)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>
                            <CButton color="info" variant="ghost" class="d-flex align-items-center p-1 mt-1"
                                @click="addOption(question)">
                                <CIcon name="cil-plus" class="mr-1" />
                                <small>Add option</small>
                            </CButton>
                        </div>

                        <div v-else-if="getQuestionTypeString(question.type).toLowerCase() === 'checkboxes'">
                            <div v-for="(opt, oIndex) in question.config.options" :key="oIndex"
                                class="d-flex align-items-center mb-1">
                                <div class="border rounded mr-2 flex-shrink-0" style="width: 18px; height: 18px;" />
                                <CInput class="flex-grow-1" :value="opt && opt.lang && opt.lang[0] && opt.lang[0].choice && opt.lang[0].choice[0]
                                    ? opt.lang[0].choice[0].value
                                    : (typeof opt === 'string' ? opt : '')" :placeholder="`Option ${oIndex + 1}`"
                                    @input="updateOption(question, oIndex, $event)" />
                                <CButton color="danger" variant="ghost" size="sm" class="ml-1"
                                    v-if="question.config.options.length > 1" @click="removeOption(question, oIndex)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>
                            <CButton color="info" variant="ghost" class="d-flex align-items-center p-1 mt-1"
                                @click="addOption(question)">
                                <CIcon name="cil-plus" class="mr-1" />
                                <small>Add option</small>
                            </CButton>
                        </div>

                        <div v-else-if="getQuestionTypeString(question.type).toLowerCase() === 'rating'"
                            class="d-flex align-items-center">
                            <CDropdown class="mr-3" color="secondary" variant="outline">
                                <template #toggler>
                                    <button class="btn d-flex align-items-center text-muted border bg-white"
                                        style="border-radius: 6px;">
                                        <span class="mr-2">{{ question.config.maxRate || 5 }}</span>
                                        <CIcon name="cil-chevron-bottom" />
                                    </button>
                                </template>
                                <CDropdownItem v-for="n in 10" :key="n" @click="setRating(question, n)">
                                    {{ n }}
                                </CDropdownItem>
                            </CDropdown>
                            <div v-for="n in (question.config.maxRate || 5)" :key="n"
                                class="d-flex flex-grow-1 flex-column align-items-center">
                                <span>{{ n }}</span>
                                <CIcon name="cil-star" :height="22" />
                            </div>
                        </div>

                        <div v-else-if="getQuestionTypeString(question.type).toLowerCase() === 'file_upload'">
                            <div class="mb-3">
                                <span class="d-block mb-2 font-weight-bold small text-muted text-uppercase">File
                                    Type</span>
                                <div class="d-flex flex-wrap">
                                    <div v-for="ft in fileTypeOptions" :key="ft.key" class="mr-3 mb-2">
                                        <CInputCheckbox :id="`filetype-${index}-${ft.key}`"
                                            :name="`filetype-${index}-${ft.key}`" :label="ft.label" :value="ft.key"
                                            :custom="true" :checked="question.config.allowMultipleSelect"
                                            @change="toggleFileType(question)" />
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="mr-3 small text-muted">Max files</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm btn-light border">
                                            {{ question.config.maxFiles || 1 }}
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="n in [1, 5, 10]" :key="n" @click="setMaxFiles(question, n)">
                                        {{ n }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="mr-3 small text-muted">Max file size</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm btn-light border">
                                            {{ question.config.maxFileSize ? question.config.maxFileSize + 'MB' : '1MB'
                                            }}
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="s in fileSizeOptions" :key="s.value"
                                        @click="setMaxFileSize(question, s.value)">
                                        {{ s.label }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                        </div>

                        <div v-else>
                            <span class="text-muted font-italic small">Preview not available for this type</span>
                        </div>

                        <!-- ── Footer: Question Type dropdown + Required toggle ── -->
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <small class="text-muted font-weight-bold text-uppercase mr-2">Type</small>
                                <CDropdown color="light" variant="outline">
                                    <template #toggler>
                                        <button class="btn d-flex align-items-center text-muted border bg-white"
                                            style="border-radius: 6px;">
                                            <CIcon :name="getIconForType(question.type)" class="mr-2" />
                                            <span class="text-capitalize">
                                                {{ getQuestionTypeString(question.type).split('_').join(' ') }}
                                            </span>
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="type in typesAll" :key="type._id || type.key"
                                        @click="setQuestionType(question, type._id || type.type || type.key)">
                                        <CIcon :name="getIconForType(type.type || type.key)" class="mr-2" />
                                        <span class="text-capitalize">
                                            {{ (type.type || type.label || '').split('_').join(' ') }}
                                        </span>
                                    </CDropdownItem>
                                </CDropdown>
                            </div>

                            <div class="d-flex align-items-center">
                                <small class="text-muted font-weight-bold text-uppercase mr-2">Required</small>
                                <CSwitch class="mx-1" color="dark" shape="pill" :checked="question.isRequired"
                                    @update:checked="val => { question.isRequired = val; putQuestion(question); }" />
                            </div>
                        </div>

                    </CCardBody>
                </CCard>

                <!-- Empty state -->
                <div v-if="!localQuestions || localQuestions.length === 0"
                    class="text-center py-5 text-muted bg-white border rounded">
                    <CIcon name="cil-notes" :height="40" class="mb-3 text-muted" />
                    <p class="mb-0">No questions yet. Add one from the sidebar!</p>
                </div>
            </CCol>


            <CCol md="3">
                <CCard class="sticky-sidebar">
                    <CCardBody class="p-3">
                        <h5 class="font-weight-bold pb-3">Question Types</h5>
                        <div class="d-flex flex-column">
                            <CButton v-for="type in questionTypes" :key="type._id" variant="ghost" color="dark"
                                class="text-left mb-2 d-flex align-items-center" @click="addQuestion(type._id)">
                                <CIcon :name="getIconForType(type.type)" class="mr-2" />
                                <span class="text-capitalize">{{ (type.type || '').split('_').join(' ') }}</span>
                            </CButton>
                        </div>

                        <h5 class="font-weight-bold py-3 border-top">Content Elements</h5>
                        <div class="d-flex flex-column">
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('title_description')">
                                <CIcon name="cil-text" class="mr-2" /> Title & Description
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('image')">
                                <CIcon name="cil-image-1" class="mr-2" /> Image
                            </CButton>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import NestedQuestion from './NestedQuestion.vue'

export default {
    name: 'TabQuestion',
    components: {
        NestedQuestion
    },
    props: {
        form: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            // Local reactive copy of questions — populated from form prop via watcher
            localQuestions: [],
            contentElements: [
                { key: 'title_description', label: 'Title & Description', icon: 'cil-text' },
                { key: 'image', label: 'Image', icon: 'cil-image-1' }
            ],
            fileTypeOptions: [
                { key: 'img', label: 'Image' },
                { key: 'pdf', label: 'PDF' },
                { key: 'docs', label: 'Docs' },
                { key: 'sheet', label: 'Sheet' }
            ],
            fileSizeOptions: [
                { value: 1, label: '1MB' },
                { value: 10, label: '10MB' },
                { value: 100, label: '100MB' }
            ]
        };
    },
    watch: {
        // When form prop arrives (async from API), sync localQuestions
        form: {
            immediate: true,
            deep: false,
            handler(newForm) {
                if (newForm && Array.isArray(newForm.questions)) {
                    // Deep clone so mutations on localQuestions don't bleed into the prop
                    this.localQuestions = JSON.parse(JSON.stringify(newForm.questions));
                }
            }
        }
    },
    created() {
        this.$store.dispatch('Setting/question_type/get');
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type: 'item' }),
        questionTypes() {
            if (!this.question_type || !Array.isArray(this.question_type)) return [];
            return this.question_type.map(t => ({
                _id: t._id,
                type: t.type || '',
            }));
        },
        typesAll() {
            return [...this.questionTypes, ...this.contentElements];
        },
        formTitleEn: {
            get() {
                if (!this.form || !Array.isArray(this.form.title)) return '';
                const enObj = this.form.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                return enObj ? enObj.value : (this.form.title.length > 0 ? this.form.title[0].value : '');
            },
            set(val) {
                if (!this.form || !Array.isArray(this.form.title)) return;
                let enObj = this.form.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                if (enObj) {
                    enObj.value = val;
                } else if (this.form.title.length > 0) {
                    // Fallback to updating the first available if 'en' doesn't exist yet but others do
                    this.form.title[0].value = val;
                } else {
                    this.form.title.push({ key: 'en', value: val });
                }
            }
        },
        formDescEn: {
            get() {
                if (!this.form || !Array.isArray(this.form.description)) return '';
                const enObj = this.form.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                return enObj ? enObj.value : (this.form.description.length > 0 ? this.form.description[0].value : '');
            },
            set(val) {
                if (!this.form || !Array.isArray(this.form.description)) return;
                let enObj = this.form.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                if (enObj) {
                    enObj.value = val;
                } else if (this.form.description.length > 0) {
                    this.form.description[0].value = val;
                } else {
                    this.form.description.push({ key: 'en', value: val });
                }
            }
        }
    },
    methods: {

        // ============================================================
        // Update (PUT) form title & description to the backend
        // Called on @change of the title/description inputs at the top.
        // ============================================================
        async updateFormMeta() {
            if (!this.form || !this.form._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(this.form));
                // Send only the fields the API needs to update
                await this.$store.dispatch('Forms/updateForm', {
                    _id: payload._id,
                    title: payload.title,
                    description: payload.description,
                });
            } catch (err) {
                console.error('Failed to update form meta', err);
            }
        },

        // ── Form Title multilingual helpers ──
        addFormTitle() {
            if (!this.form) return;
            if (!Array.isArray(this.form.title)) {
                this.$set(this.form, 'title', [{ key: 'EN', value: '' }]);
            } else {
                this.form.title.push({ key: '', value: '' });
            }
            this.updateFormMeta();
        },
        removeFormTitle(idx) {
            if (!this.form || !Array.isArray(this.form.title)) return;
            if (this.form.title.length <= 1) return;
            this.form.title.splice(idx, 1);
            this.updateFormMeta();
        },

        // ── Form Description multilingual helpers ──
        addFormDesc() {
            if (!this.form) return;
            if (!Array.isArray(this.form.description)) {
                this.$set(this.form, 'description', [{ key: 'EN', value: '' }]);
            } else {
                this.form.description.push({ key: '', value: '' });
            }
            this.updateFormMeta();
        },
        removeFormDesc(idx) {
            if (!this.form || !Array.isArray(this.form.description)) return;
            if (this.form.description.length <= 1) return;
            this.form.description.splice(idx, 1);
            this.updateFormMeta();
        },

        // ============================================================
        // Update (PUT) a question to the backend
        // Accepts the full question object directly.
        // ============================================================
        async putQuestion(question) {
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                // Normalize type: if type is an object (populated), send only _id
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/updateQuestion', payload);
            } catch (err) {
                console.error('Failed to update question', err);
            }
        },

        // ============================================================
        // Update only the title of a question and send PUT to API
        // Called from @change on the title key/value inputs.
        // ============================================================
        async updateQuestionTitle(question) {
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                // Normalize type field if it's a populated object
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/updateQuestion', {
                    _id: payload._id,
                    title: payload.title,
                    form: payload.form,
                    type: payload.type,
                    order: payload.order,
                    isRequired: payload.isRequired,
                    config: payload.config,
                });
            } catch (err) {
                console.error('Failed to update question title', err);
            }
        },

        // ============================================================
        // Create a new question and add it to the form
        // ============================================================
        async addQuestion(typeId) {
            const foundType = this.questionTypes.find(t => t._id === typeId || t.type === typeId);

            const isMultipleChoice = foundType && foundType.type === 'Multiple Choice';
            const isRating = foundType && foundType.type === 'Rating';
            const isParagraph = foundType && foundType.type === 'Paragraph';
            const isFileUpload = foundType && foundType.type === 'file_upload';
            const isCheckboxes = foundType && foundType.type === 'Checkboxes';

            const config = {
                options: isMultipleChoice ? [{ lang: [{ key: 'en', choice: [{ key: 'A', value: 'Option 1' }] }] }] : [],
                allowMultipleSelect: isCheckboxes ? true : false,
                maxRate: isRating ? 5 : null,
                maxText: isParagraph ? 300 : null,
                maxFiles: isFileUpload ? 1 : null,
                maxFileSize: isFileUpload ? 1 : null,
            };

            const payload = {
                form: this.form._id,
                title: [{ key: 'en', value: 'Untitled Question' }],
                description: [],
                type: typeId,
                isRequired: false,
                config,
                order: this.localQuestions.length + 1
            };

            try {
                const res = await this.$store.dispatch('Questions/createQuestion', payload);
                const created = res && res.data && res.data.data;
                if (created && created._id) {
                    // Populate type so the card renders immediately with the right icon/label
                    if (!created.type || typeof created.type === 'string') {
                        const foundType = this.questionTypes.find(t => t._id === typeId);
                        if (foundType) created.type = foundType;
                    }
                    this.localQuestions.push(created);
                } else {
                    console.error('addQuestion: backend did not return a created document with _id', res);
                }
            } catch (e) {
                console.error('addQuestion failed:', e);
            }
        },

        // ============================================================
        // Delete a question by its _id
        // ============================================================
        async removeQuestion(qId) {
            if (!qId) {
                console.warn('removeQuestion: qId is undefined or null');
                return;
            }
            const index = this.localQuestions.findIndex(
                q => (q._id === qId || (q._id && q._id.toString() === qId.toString()))
            );
            if (index === -1) {
                console.warn('removeQuestion: question not found in localQuestions for qId', qId);
                return;
            }
            try {
                await this.$store.dispatch('Questions/deleteQuestion', { _id: qId });
                this.localQuestions.splice(index, 1);
            } catch (e) {
                console.error('removeQuestion failed:', e);
            }
        },

        // ============================================================
        // Set / change the type of a question
        // ============================================================
        setQuestionType(question, typeId) {
            if (!question) return;
            this.$set(question, 'type', typeId);

            const foundType = this.questionTypes.find(t => t._id === typeId);
            const isMultipleChoice = foundType && foundType.type === 'Multiple Choice';
            const isRating = foundType && foundType.type === 'Rating';
            const isFileUpload = foundType && foundType.type === 'file_upload';

            if (!question.config) this.$set(question, 'config', {});

            if (isMultipleChoice && (!Array.isArray(question.config.options) || question.config.options.length === 0)) {
                this.$set(question.config, 'options', [{ lang: [{ key: 'EN', choice: [{ key: 'A', value: 'Option 1' }] }] }]);
            }
            if (isRating && (typeof question.config.maxRate !== 'number' || isNaN(question.config.maxRate))) {
                this.$set(question.config, 'maxRate', 5);
            }
            if (isFileUpload) {
                if (typeof question.config.maxFiles !== 'number') this.$set(question.config, 'maxFiles', 1);
                if (typeof question.config.maxFileSize !== 'number') this.$set(question.config, 'maxFileSize', 1);
            }
            this.putQuestion(question);
        },

        // ============================================================
        // Helpers: type resolution + icons
        // ============================================================
        getQuestionTypeString(typeObjOrId) {
            if (!typeObjOrId) return '';
            if (typeof typeObjOrId === 'object') return typeObjOrId.type || typeObjOrId.label || '';
            const found = this.questionTypes.find(t => t._id === typeObjOrId);
            return found ? (found.type || '') : typeObjOrId;
        },
        getIconForType(typeObjOrId) {
            const typeStr = (this.getQuestionTypeString(typeObjOrId) || '').toLowerCase().replace(/ /g, '_');
            switch (typeStr) {
                case 'short': case 'short_answer': return 'cil-minus';
                case 'paragraph': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkboxes': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'image': return 'cil-image-1';
                default: return 'cil-question';
            }
        },
        addTitle(question) {
            if (!question) return;
            if (!Array.isArray(question.title)) {
                this.$set(question, 'title', [{ key: 'EN', value: '' }]);
            } else {
                question.title.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeTitle(question, tIndex) {
            if (!question || !Array.isArray(question.title)) return;
            if (question.title.length <= 1) return;
            question.title.splice(tIndex, 1);
            this.putQuestion(question);
        },

        // ── Description multilingual helpers (mirrors title helpers) ──
        updateQuestionDescription(question) {
            if (!question || !question._id) return;
            this.putQuestion(question);
        },
        addDescription(question) {
            if (!question) return;
            if (!Array.isArray(question.description) || question.description.length === 0) {
                this.$set(question, 'description', [{ key: 'EN', value: '' }]);
            } else {
                question.description.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeDescription(question, dIndex) {
            if (!question || !Array.isArray(question.description)) return;
            if (question.description.length <= 1) return;
            question.description.splice(dIndex, 1);
            this.putQuestion(question);
        },
        setRating(question, number) {
            if (!question) return;
            this.$set(question.config, 'maxRate', Number(number) || 5);
            this.putQuestion(question);
        },
        clearField(question, field) {
            if (question) {
                this.$set(question, field, '');
                this.putQuestion(question);
            }
        },
        getPlaceholder(type, lang) {
            return 'Untitled Question';
        }
    }
}
</script>

<style scoped>
/* Language key input: bold uppercase text, faded placeholder */
.lang-key-input>>>input {
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    background-color: #f1f3f5;
    color: #495057;
}

.lang-key-input>>>input::placeholder {
    font-weight: 400;
    color: #adb5bd;
    text-transform: none;
    letter-spacing: 0;
}
</style>
