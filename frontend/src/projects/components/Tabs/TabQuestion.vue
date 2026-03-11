<template>
    <div class="mt-3">
        <CCard class="mb-3">
            <CCardBody class="p-4">
                <div class="form-header-section">

                    <!-- ── Form Title  ── -->
                    <div class="mb-3">
                        <div v-for="(titleItem, tIdx) in (form.title || [])" :key="'ft-' + tIdx"
                            class="d-flex align-items-center">
                            <CInput class="lang-key-input flex-shrink-0 mr-2" v-model="titleItem.key"
                                @change="updateFormMeta" maxlength="3" style="width: 3.2rem;" />
                            <CInput class="form-title-input flex-grow-1 border-bottom" size="lg"
                                v-model="titleItem.value" @change="updateFormMeta" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.title && form.title.length > 1" @click="removeFormTitle(tIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="primary" class="d-flex align-items-center"
                            @click="addFormTitle">
                            <CIcon name="cil-plus" class="mr-1" />
                            <small>Add New Language</small>
                        </CButton>
                    </div>

                    <!-- ── Form Description ── -->
                    <div>
                        <div v-for="(descItem, dIdx) in (form.description || [])" :key="'fd-' + dIdx"
                            class="d-flex align-items-center">
                            <CInput class="lang-key-input flex-shrink-0 mr-2" v-model="descItem.key"
                                @change="updateFormMeta" maxlength="3" style="width: 3.2rem;" />
                            <CInput class="form-desc-input flex-grow-1" v-model="descItem.value"
                                @change="updateFormMeta" rows="2" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.description && form.description.length > 1" @click="removeFormDesc(dIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="primary" class="d-flex align-items-center" @click="addFormDesc">
                            <CIcon name="cil-plus" class="mr-1" />
                            <small>Add New Language</small>
                        </CButton>
                    </div>

                </div>
            </CCardBody>
        </CCard>

        <CRow>
            <!-- Left Side Tab -->
            <CCol md="9">
                <CCard v-for="(question, index) in localQuestions" :key="question._id || index"
                    class="mb-3 position-relative">
                    <CCardBody class="p-4">

                        <!-- Question Title -->
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="flex-grow-1">
                                <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                    class="d-flex align-items-center mb-1">
                                    <CInput class="lang-key-input flex-shrink-0 mb-0 mr-1" v-model="titleItem.key"
                                        @change="updateQuestionTitle(question)" maxlength="3" style="width: 3.2rem;" />
                                    <CInput class="flex-grow-1 mb-0" v-model="titleItem.value"
                                        @change="updateQuestionTitle(question)" style="background-color: #f8fafc;" />
                                    <CButton color="danger" variant="ghost" size="sm" class="ml-1 flex-shrink-0"
                                        v-if="question.title && question.title.length > 1"
                                        @click="removeTitle(question, titleIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>

                                <CButton variant="ghost" color="primary" class="d-flex align-items-center p-1 mt-1"
                                    @click="addTitle(question)">
                                    <CIcon name="cil-plus" class="mr-1" />
                                    <small>Add New Language</small>
                                </CButton>
                            </div>

                            <div class="ml-2 flex-shrink-0">
                                <CButton color="danger" variant="ghost" @click="removeQuestion(question._id)">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                        </div>

                        <!-- ── Question Type ── -->
                        <div v-if="getQuestionType(question.type).toLowerCase() === 'short_answer'">
                            <CInput disabled style="opacity: 0.55;" placeholder="Short answer text" />
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'paragraph'">
                            <CTextarea disabled style="opacity: 0.55;" placeholder="Long answer text" rows="3" />
                        </div>

                        <div v-else-if="
                            getQuestionType(question.type).toLowerCase() === 'multiple_choice' ||
                            getQuestionType(question.type).toLowerCase() === 'checkbox'">
                            <div v-for="(choice, choiceIndex) in question.config.choices"
                                class="d-flex align-items-center mb-2">
                                <div v-if="getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                    class="border rounded-circle mr-2 flex-shrink-0"
                                    style="width: 30px; height: 30px;" />
                                <div v-else class="border rounded mr-2 flex-shrink-0"
                                    style="width: 30px; height: 30px;" />
                                <CInput class="flex-grow-1 mb-0" :value="choice.lang[0].value"
                                    @input="updateOption(question, choiceIndex, $event)" />
                                <CButton color="danger" variant="ghost" size="sm" class="ml-1"
                                    v-if="question.config.choices.length > 1"
                                    @click="removeOption(question, choiceIndex)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>
                            <CButton color="primary" variant="ghost" class="d-flex align-items-center p-1 mt-1"
                                @click="addOption(question)">
                                <CIcon name="cil-plus" class="mr-1" />
                                <small>Add New Option</small>
                            </CButton>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'rating'"
                            class="d-flex align-items-center">
                            <CDropdown class="mr-3" color="secondary" variant="outline">
                                <template #toggler>
                                    <button class="btn d-flex align-items-center text-muted border bg-white"
                                        style="border-radius: 6px;">
                                        {{ question.config.maxRating || 5 }}
                                    </button>
                                </template>
                                <CDropdownItem v-for="n in 10" :key="n" @click="setRating(question, n)">
                                    {{ n }}
                                </CDropdownItem>
                            </CDropdown>
                            <div v-for="n in (question.config.maxRating || 5)" :key="n"
                                class="d-flex flex-grow-1 flex-column align-items-center">
                                <span>{{ n }}</span>
                                <CIcon name="cil-star" :height="22" />
                            </div>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'file_upload'">
                            <div class="mb-3">
                                <span class="d-block mb-2 small text-muted">File Type</span>
                                <div class="d-flex flex-wrap">
                                    <div v-for="ft in fileTypeOptions" :key="ft.key" class="mr-3 mb-2">
                                        <CInputCheckbox :id="`filetype-${index}-${ft.key}`"
                                            :name="`filetype-${index}-${ft.key}`" :label="ft.label" :value="ft.key"
                                            :custom="true"
                                            :checked="Array.isArray(question.config.fileTypes) && question.config.fileTypes.includes(ft.key)"
                                            @change="toggleFileType(question, ft.key)" />
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="mr-3 small text-muted">Max files</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm border">
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
                                        <button class="btn btn-sm border">
                                            {{ question.config.maxFileSize ? question.config.maxFileSize + 'MB'
                                                : '1MB'
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

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'title_description'">
                            <div>
                                <small class="text-muted font-weight-bold d-block mb-1">Description</small>
                                <div v-for="(descItem, dIdx) in (question.config.description || [])" :key="'qd-' + dIdx"
                                    class="d-flex align-items-center mb-1">
                                    <CInput class="lang-key-input flex-shrink-0 mr-2" v-model="descItem.key"
                                        @change="putQuestion(question)" maxlength="3" style="width: 3.2rem;" />
                                    <CInput class="flex-grow-1" v-model="descItem.value"
                                        @change="putQuestion(question)" rows="2" />
                                    <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                        v-if="question.config.description && question.config.description.length > 1"
                                        @click="removeConfigDesc(question, dIdx)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>
                                <CButton variant="ghost" color="primary" class="d-flex align-items-center"
                                    @click="addConfigDesc(question)">
                                    <CIcon name="cil-plus" class="mr-1" />
                                    <small>Add New Language</small>
                                </CButton>
                            </div>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'image'">
                            <div class="image-drop-zone" @click="openImageModal(index)">
                                <div v-if="!question.config || !question.config.image" class="image-placeholder">
                                    <CIcon name="cil-image-1" :height="40" class="mb-2" />
                                    <span>Click to choose image</span>
                                </div>
                                <img v-else :src="question.config.image" class="image-preview" />
                            </div>
                        </div>

                        <div v-else>
                            <span class="text-muted font-italic small">
                                Preview not available for this type
                            </span>
                        </div>

                        <!-- ── Footer: Question Type dropdown + Required toggle ── -->
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <span class="text-muted font-weight-bold mr-2">Type</span>
                                <CDropdown color="light" variant="outline">
                                    <template #toggler>
                                        <button class="btn d-flex align-items-center text-muted border bg-white"
                                            style="border-radius: 6px;">
                                            <CIcon :name="getIconForType(question.type)" class="mr-2" />
                                            <span class="text-capitalize">
                                                {{ getQuestionType(question.type).split('_').join(' ') }}
                                            </span>
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="type in typesAll" :key="type._id"
                                        @click="setQuestionType(question, type._id)">
                                        <CIcon :name="getIconForType(type._id)" class="mr-2" />
                                        <span class="text-capitalize">
                                            {{ (type.type || '').split('_').join(' ') }}
                                        </span>
                                    </CDropdownItem>
                                </CDropdown>
                            </div>

                            <div v-if="getQuestionType(question.type).toLowerCase() !== 'title_description' && getQuestionType(question.type).toLowerCase() !== 'image'" class="d-flex align-items-center">
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
                    <p class="mb-0">You haven’t added any questions yet. Try adding one from the sidebar.</p>
                </div>
            </CCol>

            <!-- Right Side Tab -->
            <CCol md="3">
                <CCard class="sticky-sidebar">
                    <CCardBody class="p-3">
                        <h5 class="font-weight-bold">Question Types</h5>
                        <div class="d-flex flex-column">
                            <CButton v-for="type in questionTypes"
                                v-if="type.type !== 'title_description' && type.type !== 'image'" :key="type._id"
                                variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion(type._id)">
                                <CIcon :name="getIconForType(type.type)" class="mr-2" />
                                <span class="text-capitalize">{{ (type.type || '').split('_').join(' ') }}</span>
                            </CButton>
                        </div>

                        <h5 class="font-weight-bold pt-3 border-top">Content Elements</h5>
                        <div class="d-flex flex-column">
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('title_description')">
                                <CIcon name="cil-text" class="mr-2" /> Title & Description
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="modalImageIndex = null; modalFiles = ''; showImageModal = true">
                                <CIcon name="cil-image-1" class="mr-2" /> Image
                            </CButton>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>

        <!-- Image Select modal -->
        <CModal :show.sync="showImageModal" :centered="true">
            <template #header-wrapper>
                <div class="d-flex justify-content-between align-items-center font-weight-bold pl-3 border-bottom">
                    <span>Choose Image</span>
                    <CButton color="secondary" variant="ghost" @click="showImageModal = false">
                        <CIcon name="cil-x" />
                    </CButton>
                </div>
            </template>
            <template #body-wrapper>
                <CCardBody class="p-3">
                    <div class="image-drop-zone" @click="$refs.imageFileInput.click()">
                        <div v-if="!modalFiles"
                            class="image-placeholder">
                            <CIcon name="cil-image-1" :height="40" class="mb-2" />
                            <span>Choose Image</span>
                        </div>
                        <img v-else :src="modalFiles" class="image-preview" />
                    </div>
                    <input ref="imageFileInput" type="file" accept="image/*" style="display:none;"
                        @change="onImageSelected($event)" />
                </CCardBody>
            </template>
            <template #footer-wrapper>
                <div class="d-flex justify-content-end p-2 border-top">
                    <CButton color="danger" variant="ghost" @click="showImageModal = false">
                        Cancel
                    </CButton>
                    <CButton color="primary" class="ml-2" @click="confirmImageQuestion()">
                        OK
                    </CButton>
                </div>
            </template>
        </CModal>

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
            localQuestions: [],
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
            ],
            showImageModal: false,
            modalImageIndex: null,
            modalFiles: '',
            layout: [],
        };
    },
    watch: {
        form: {
            immediate: true,
            deep: false,
            async handler(newForm) {
                if (newForm && Array.isArray(newForm.questions)) {
                    this.localQuestions = JSON.parse(JSON.stringify(newForm.questions));
                }
                if (newForm && (!Array.isArray(newForm.title) || newForm.title.length === 0)) {
                    this.$nextTick(() => this.addFormTitle());
                }
                if (newForm && (!Array.isArray(newForm.description) || newForm.description.length === 0)) {
                    this.$nextTick(() => this.addFormDesc());
                }
            }
        },
    },
    created() {
        this.$store.dispatch('Setting/question_type/get');
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type: 'item' }),
        questionTypes() {
            if (!this.question_type || !Array.isArray(this.question_type)) return [];
            return JSON.parse(JSON.stringify(this.question_type)).map(type => ({
                _id: type._id,
                type: type.type,
            }));
        },
        typesAll() {
            return [...this.questionTypes];
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
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        async updateFormMeta() {
            if (!this.form || !this.form._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(this.form));
                // Send only the fields the API needs to update
                await this.$store.dispatch('Forms/update', {
                    _id: payload._id,
                    title: payload.title,
                    description: payload.description,
                });
            } catch (err) {
                console.error('Failed to update form meta', err);
            }
        },
        addFormTitle() {
            if (!this.form) return;
            if (!Array.isArray(this.form.title)) {
                this.$set(this.form, 'title', [{ key: 'en', value: 'Untitled Form' }]);
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
        addFormDesc() {
            if (!this.form) return;
            if (!Array.isArray(this.form.description)) {
                this.$set(this.form, 'description', [{ key: 'en', value: 'Description' }]);
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
        async putQuestion(question) {
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/update', payload);
            } catch (err) {
                console.error('Failed to update question', err);
            }
        },
        async updateQuestionTitle(question) {
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));                
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/update', {
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
        async addQuestion(typeId) {
            const foundType = this.questionTypes.find(type => type._id === typeId || type.type === typeId);

            if (!foundType) return;
            const isParagraph = foundType.type === 'paragraph';
            const isMultipleChoice = foundType.type === 'multiple_choice' || foundType.type === 'checkbox';
            const isCheckboxes = foundType.type === 'checkbox';
            const isRating = foundType.type === 'rating';
            const isFileUpload = foundType.type === 'file_upload';
            const isImage = foundType.type === 'image';
            const isTitleDescription = foundType.type === 'title_description';

            const config = {
                choices: (isMultipleChoice || isCheckboxes)
                    ? [{ key: '0', lang: [{ key: 'en', value: 'Option 1' }] }]
                    : [],
                allowMultipleSelect: isCheckboxes,
                maxRating: isRating ? 5 : null,
                maxText: isParagraph ? 300 : null,
                maxFiles: isFileUpload ? 1 : null,
                maxFileSize: isFileUpload ? 1 : null,
                image: isImage ? this.modalFiles : null,
                description: isTitleDescription ? [{ key: 'en', value: 'Description' }] : [],
            };

            const payload = {
                form: this.form._id,
                title: [{ key: 'en', value: 'Untitled Question' }],
                order: this.localQuestions.length + 1,
                type: foundType._id,
                isRequired: false,
                config,
            };

            try {
                const res = await this.$store.dispatch('Questions/create', payload);
                const created = res && res.data && res.data.data;
                if (created && created._id) {
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
                await this.$store.dispatch('Questions/delete', { _id: qId });
                this.localQuestions.splice(index, 1);
            } catch (e) {
                console.error('removeQuestion failed:', e);
            }
        },
        setQuestionType(question, typeId) {
            if (!question) return;

            const foundType = this.questionTypes.find(t => t._id === typeId);
            const isMultipleChoice = foundType.type === 'multiple_choice' || foundType.type === 'checkbox';
            const isCheckboxes = foundType.type === 'checkbox';
            const isRating = foundType.type === 'rating';
            const isFileUpload = foundType.type === 'file_upload';
            const isImage = foundType.type === 'image';

            if (!question.config) this.$set(question, 'config', {});

            if ((isMultipleChoice || isCheckboxes) && (!Array.isArray(question.config.choices) || question.config.choices.length === 0)) {
                this.$set(question.config, 'choices', [{ key: '0', lang: [{ key: 'en', value: 'Option 1' }] }]);
            }
            if (isRating && (typeof question.config.maxRating !== 'number' || isNaN(question.config.maxRating))) {
                this.$set(question.config, 'maxRating', 5);
            }
            if (isFileUpload) {
                if (typeof question.config.maxFiles !== 'number') this.$set(question.config, 'maxFiles', 1);
                if (typeof question.config.maxFileSize !== 'number') this.$set(question.config, 'maxFileSize', 1);
            }
            const isTitleDescription = foundType.type === 'title_description';
            if (isTitleDescription) {
                if (!Array.isArray(question.config.description) || question.config.description.length === 0)
                    this.$set(question.config, 'description', [{ key: 'en', value: 'Description' }]);
            }

            if (isImage) {
                const qIndex = this.localQuestions.indexOf(question);
                this.openImageModal(qIndex !== -1 ? qIndex : null);
            }

            this.$set(question, 'type', typeId);
            this.putQuestion(question);
        },
        getQuestionType(typeObjOrId) {
            if (!typeObjOrId) return '';
            if (typeof typeObjOrId === 'object') return typeObjOrId.type || typeObjOrId.label || '';
            const found = this.questionTypes.find(t => t._id === typeObjOrId);
            return found ? (found.type || '') : typeObjOrId;
        },
        getIconForType(typeObjOrId) {
            const typeStr = (this.getQuestionType(typeObjOrId) || '').toLowerCase().replace(/ /g, '_');
            switch (typeStr) {
                case 'short_answer': return 'cil-minus';
                case 'paragraph': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkbox': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'image': return 'cil-image-1';
                default: return 'cil-question';
            }
        },
        addTitle(question) {
            if (!question) return;
            if (!Array.isArray(question.title) || question.title.length === 0) {
                this.$set(question, 'title', [{ key: 'en', value: '' }]);
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
        updateQuestionDescription(question) {
            if (!question || !question._id) return;
            this.putQuestion(question);
        },
        setRating(question, number) {
            if (!question) return;
            this.$set(question.config, 'maxRating', Number(number) || 5);
            this.putQuestion(question);
        },
        clearField(question, field) {
            if (question) {
                this.$set(question, field, '');
                this.putQuestion(question);
            }
        },
        onImageSelected(event) {
            const file = event.target && event.target.files && event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.modalFiles = ev.target.result;
            };
            reader.readAsDataURL(file);
        },
        openImageModal(qIndex) {
            this.modalImageIndex = qIndex;
            this.modalFiles = (this.localQuestions[qIndex] && this.localQuestions[qIndex].config && this.localQuestions[qIndex].config.image) || '';
            this.showImageModal = true;
        },
        async confirmImageQuestion() {
            if (!this.modalFiles) return;
            if (this.modalImageIndex !== null) {
                const q = this.localQuestions[this.modalImageIndex];
                if (q) {
                    if (!q.config) this.$set(q, 'config', {});
                    this.$set(q.config, 'image', this.modalFiles);
                    await this.putQuestion(q);
                }
            } else {
                await this.addQuestion('image');
            }
            this.showImageModal = false;
        },
        addOption(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.choices)) {
                this.$set(question.config, 'choices', [{ key: "0", lang: [{ key: 'en', value: '' }] }]);
            } else {
                question.config.choices.push({ key: String(question.config.choices.length), lang: [{ key: '', value: '' }] });
            }
            this.putQuestion(question);
        },
        updateOption(question, oIndex, val) {
            const v = val ? String(val) : '';
            if (!question || !Array.isArray(question.config.choices)) return;
            const opt = question.config.choices[oIndex];
            if (opt && Array.isArray(opt.lang) && opt.lang[0]) {
                this.$set(opt.lang, 0, { ...opt.lang[0], value: v });
            } else {
                this.$set(question.config.choices, oIndex, {
                    key: String(oIndex),
                    lang: [{ key: 'en', value: v }]
                });
            }
            this.putQuestion(question);
        },
        removeOption(question, oIndex) {
            if (!question || !Array.isArray(question.config.choices)) return;
            if (question.config.choices.length <= 1) return;
            question.config.choices.splice(oIndex, 1);
            this.putQuestion(question);
        },
        toggleFileType(question, ftKey) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.fileTypes)) {
                this.$set(question.config, 'fileTypes', [ftKey]);
            } else {
                const idx = question.config.fileTypes.indexOf(ftKey);
                if (idx === -1) {
                    question.config.fileTypes.push(ftKey);
                } else {
                    question.config.fileTypes.splice(idx, 1);
                }
            }
            this.putQuestion(question);
        },
        setMaxFiles(question, n) {
            if (!question) return;
            this.$set(question.config, 'maxFiles', Number(n) || 1);
            this.putQuestion(question);
        },
        setMaxFileSize(question, n) {
            if (!question) return;
            this.$set(question.config, 'maxFileSize', Number(n) || 1);
            this.putQuestion(question);
        },
        addConfigTitle(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.title)) {
                this.$set(question.config, 'title', [{ key: 'en', value: '' }]);
            } else {
                question.config.title.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeConfigTitle(question, idx) {
            if (!question || !Array.isArray(question.config.title)) return;
            if (question.config.title.length <= 1) return;
            question.config.title.splice(idx, 1);
            this.putQuestion(question);
        },
        addConfigDesc(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.description)) {
                this.$set(question.config, 'description', [{ key: 'en', value: '' }]);
            } else {
                question.config.description.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeConfigDesc(question, idx) {
            if (!question || !Array.isArray(question.config.description)) return;
            if (question.config.description.length <= 1) return;
            question.config.description.splice(idx, 1);
            this.putQuestion(question);
        },
        getPlaceholder(type, lang) {
            return 'Untitled Question';
        }
    }
}
</script>

<style scoped>
.image-drop-zone {
    position: relative;
    width: 100%;
    cursor: pointer;
    border: 2px dashed #adb5bd;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    aspect-ratio: 1 / 1;
    min-height: 220px;
}

.image-placeholder {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #adb5bd;
}

.image-preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

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
