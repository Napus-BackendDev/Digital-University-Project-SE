<template>
    <div class="mt-3">
        <CCard class="mb-3">
            <CCardBody class="p-4">
                <div class="form-header-section">
                    <CInput class="form-title-input mb-2" size="lg" placeholder="Form Title" :value="title"
                        @input="$emit('update:title', $event)" @change="triggerAutoSave" />
                    <CTextarea class="form-desc-input" placeholder="Form Description" :value="description"
                        @input="$emit('update:description', $event)" @change="triggerAutoSave" />
                </div>
            </CCardBody>
        </CCard>

        <CRow>
            <!-- Left Column: Form Content -->
            <CCol md="9">
                <CCard v-for="(question, index) in questions" :key="index" class="mb-3 position-relative">
                    <CCardBody class="p-4">
                        <!-- Question Titles -->
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="flex-grow-1">
                                <div v-for="(type, typeIndex) in question.title" :key="typeIndex"
                                    class="d-flex align-items-start">
                                    <CInput style="width: 3rem;" :value="type.lang"
                                        @input="updateTitleLang(index, typeIndex, $event)" maxlength="2" />
                                    <CInput class="font-weight-bold flex-grow-1 px-2" :value="type.text"
                                        @input="updateTitleText(index, typeIndex, $event)"
                                        style="background-color: #f8fafc;" />
                                    <CButton color="danger" variant="ghost" v-if="question.title.length > 1"
                                        @click="removeTitle(index, typeIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>
                                <CButton variant="ghost" color="dark" class="d-flex align-items-center p-1"
                                    @click="addTitle(index)">
                                    <CIcon name="cil-plus" class="mr-1" />
                                    <small>Add language</small>
                                </CButton>
                            </div>

                            <div class="text-right ml-3">
                                <CButton color="danger" variant="ghost" @click="removeQuestion(index)">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                        </div>

                        <!-- Short Answer -->
                        <div v-if="question.type === 'short_answer'">
                            <CInput disabled style="opacity: 0.55;" placeholder="Short answer text" />
                        </div>
                        <!-- Paragraph -->
                        <div v-else-if="question.type === 'paragraph'">
                            <CTextarea disabled style="opacity: 0.55;" placeholder="Long answer text" rows="3" />
                        </div>
                        <!-- Multiple Choice -->
                        <div v-else-if="question.type === 'multiple_choice'">
                            <div v-for="(opt, oIndex) in question.options" :key="oIndex"
                                class="d-flex align-items-start">
                                <div class="border rounded-circle mr-2" style="width: 40px; height: 40px;" />
                                <CInput class="flex-grow-1" :value="opt" :placeholder="`Option ${oIndex + 1}`"
                                    @input="updateOption(index, oIndex, $event)" />
                                <CButton color="danger" variant="ghost" class="ml-2" v-if="question.options.length > 1"
                                    @click="removeOption(index, oIndex)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>
                            <CButton color="info" variant="ghost" class="d-flex align-items-center p-1"
                                @click="addOption(index)">
                                <CIcon name="cil-plus" class="mr-1" />
                                <small>Add option</small>
                            </CButton>
                        </div>
                        <!-- Checkboxes -->
                        <!-- Rating -->
                        <div v-else-if="question.type === 'rating'" class="d-flex align-items-center">
                            <CDropdown class="mr-3" color="secondary" variant="outline">
                                <template #toggler>
                                    <button class="btn d-flex align-items-center text-muted border bg-white"
                                        style="border-radius: 6px;">
                                        <span class="mr-2">{{ question.rating || 5 }}</span>
                                    </button>
                                </template>
                                <CDropdownItem v-for="number in 10" :key="number" @click="setRating(index, number)">{{
                                    number }}</CDropdownItem>
                            </CDropdown>
                            <div v-for="number in (question.rating || 5)"
                                class="d-flex flex-grow-1 flex-column align-items-center">
                                <span :key="number">{{ number }}</span>
                                <CIcon :key="number" name="cil-star" :height="25" />
                            </div>
                        </div>
                        <!-- File Upload -->
                        <div v-else-if="question.type === 'file_upload'">
                            <div class="mb-3">
                                <span class="d-block mb-2">File Type</span>
                                <div class="d-flex">
                                    <div v-for="type in fileTypeOptions" :key="type.key"
                                        class="d-flex flex-column flex-grow-1 mb-2">
                                        <CInputCheckbox :id="`filetype-${index}-${type.key}`"
                                            :name="`filetype-${index}-${type.key}`" :label="`${type.label}`"
                                            :value="type.key" :custom="true"
                                            :checked="question.fileTypes && question.fileTypes.includes(type.key)"
                                            @change="toggleFileType(index, type.key)" />
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-3">
                                <span class="mr-3">Number of max file</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm btn-light border">{{ question.maxFiles || 1
                                        }}</button>
                                    </template>
                                    <CDropdownItem v-for="number in [1, 5, 10]" :key="number"
                                        @click="setMaxFiles(index, number)">
                                        {{ number }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="mr-3">File size</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm btn-light border">{{ question.maxFileSize ?
                                            question.maxFileSize + 'MB' : '1MB' }}</button>
                                    </template>
                                    <CDropdownItem v-for="size in fileSizeOptions" :key="size.value"
                                        @click="setMaxFileSize(index, size.value)">
                                        {{ size.label }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                        </div>
                        <!-- Nothing -->
                        <div v-else>
                            <span class="text-muted font-italic">Preview not available for this type</span>
                        </div>

                        <!-- Question Type Dropdown -->
                        <div class="text-right mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <small class="text-muted font-weight-bold text-uppercase">
                                Question Type
                            </small>
                            <CDropdown class="m-2" color="light" variant="outline">
                                <template #toggler>
                                    <button class="btn d-flex align-items-center text-muted border bg-white"
                                        style="border-radius: 6px;">
                                        <CIcon :name="getIconForType(question.type)" class="mr-2" />
                                        <span class="text-capitalize">{{ question.type.split('_').join(' ') }}</span>
                                    </button>
                                </template>
                                <CDropdownItem v-for="type in typesAll" :key="type.key"
                                    @click="setQuestionType(index, type.key)">
                                    <CIcon :name="type.icon" class="mr-2" /> {{ type.label }}
                                </CDropdownItem>
                            </CDropdown>
                        </div>

                        <!-- Required -->
                        <div class="text-right pt-3 d-flex justify-content-between align-items-center">
                            <small class="text-muted font-weight-bold text-uppercase">
                                Required
                            </small>
                            <CSwitch class="mx-1" color="dark" shape="pill" :checked.sync="question.required"
                                @update:checked="triggerAutoSave" />
                        </div>
                    </CCardBody>
                </CCard>

                <div v-if="questions.length === 0" class="text-center py-5 text-muted bg-white border rounded">
                    <p>No questions yet. Add one from the sidebar!</p>
                </div>

            </CCol>

            <!-- Right Column: Sticky Sidebar -->
            <CCol md="3">
                <CCard class="sticky-sidebar">
                    <CCardBody class="p-3">
                        <h5 class="font-weight-bold pb-3">Question Types</h5>
                        <div class="d-flex flex-column">
                            <CButton v-for="type in questionTypes" :key="type.key" variant="ghost" color="dark"
                                class="text-left mb-2 d-flex align-items-center" @click="addQuestion(type.key)">
                                <CIcon :name="type.icon" class="mr-2" /> {{ type.label }}
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
export default {
    name: 'TabQuestion',
    props: {
        title: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        questions: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            questionTypes: [
                { key: 'short_answer', label: 'Short Answer', icon: 'cil-minus' },
                { key: 'paragraph', label: 'Paragraph', icon: 'cil-align-left' },
                { key: 'multiple_choice', label: 'Multiple Choice', icon: 'cil-circle' },
                { key: 'checkboxes', label: 'Checkboxes', icon: 'cil-square' },
                { key: 'rating', label: 'Rating', icon: 'cil-star' },
                { key: 'file_upload', label: 'File Upload', icon: 'cil-cloud-upload' }
            ],
            contentElements: [
                { key: 'title_description', label: 'Title & Description', icon: 'cil-text' },
                { key: 'image', label:  'Image', icon: 'cil-image-1' }
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
    computed: {
        typesAll() {
            return [...this.questionTypes, ...this.contentElements];
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        addQuestion(type) {
            const config = {
                options: (type === 'multiple_choice') ? [{
                    lang: [{
                        key: 'EN',
                        choice: [{
                            key: 'A',
                            value: 'Option 1'
                        }]
                    }],
                }] : [],
                allowMultipleSelect: (type === "checkboxes") ? true : false,
                maxRate: (type === 'rating') ? 5 : null,
                maxText: (type === 'paragraph') ? 300 : null,
                maxFiles: (type === 'file_upload') ? 1 : null,
                maxFileSize: (type === 'file_upload') ? 1 : null
            };
            const newQuestion = {
                title: [{ key: 'EN', value: 'Untitled Question' }],
                type: type,
                isRequired: false,
                config: config
            };
            this.questions.push(newQuestion);
            this.triggerAutoSave();
        },
        removeQuestion(index) {
            this.questions.splice(index, 1);
            this.triggerAutoSave();
        },
        setQuestionType(index, type) {
            // Guard: ensure index exists
            if (typeof this.questions[index] === 'undefined') return;
            this.questions[index].type = type;
            // ensure options array exists for multiple choice-like types
            if (type === 'multiple_choice' && (!Array.isArray(this.questions[index].options) || this.questions[index].options.length === 0)) {
                this.questions[index].options = ['Option 1'];
            }
            // initialize rating default when switching to rating
            if (type === 'rating') {
                const q = this.questions[index];
                if (typeof q.rating !== 'number' || isNaN(q.rating)) {
                    this.$set(q, 'rating', 5);
                }
            }
            // initialize file upload defaults when switching to file_upload
            if (type === 'file_upload') {
                const q = this.questions[index];
                if (!Array.isArray(q.fileTypes)) this.$set(q, 'fileTypes', []);
                if (typeof q.maxFiles !== 'number') this.$set(q, 'maxFiles', 1);
                if (typeof q.maxFileSize !== 'number') this.$set(q, 'maxFileSize', 1);
            }
            this.triggerAutoSave();
        },
        getIconForType(type) {
            switch (type) {
                case 'short_answer': return 'cil-minus'
                case 'paragraph': return 'cil-align-left'
                case 'multiple_choice': return 'cil-circle'
                case 'checkboxes': return 'cil-square'
                case 'rating': return 'cil-star'
                case 'file_upload': return 'cil-cloud-upload'
                case 'title_description': return 'cil-text'
                case 'image': return 'cil-image-1'
                default: return 'cil-question'
            }
        }
        ,
        updateQuestionLang(index, val) {
            // normalize to uppercase string
            const v = val ? String(val).toUpperCase() : '';
            const q = this.questions[index];
            if (!q) return;
            if (!Array.isArray(q.title) || q.title.length === 0) {
                this.$set(q, 'title', [{ lang: v || 'EN', text: q.text || 'Untitled Question' }]);
            } else {
                const first = Object.assign({}, q.title[0], { lang: v || 'EN' });
                this.$set(q.title, 0, first);
            }
            this.triggerAutoSave();
        },
        getQuestionLang(question) {
            return (question && Array.isArray(question.title) && question.title[0] && question.title[0].lang) ? question.title[0].lang : '';
        }
        ,
        updateTitleLang(qIndex, tIndex, val) {
            const v = val ? String(val).toUpperCase() : '';
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.title)) {
                this.$set(q, 'title', [{ lang: v || 'EN', text: q.text || '' }]);
            } else {
                const existing = q.title[tIndex] || { lang: v || 'EN', text: '' };
                const updated = Object.assign({}, existing, { lang: v || 'EN' });
                this.$set(q.title, tIndex, updated);
            }
            this.triggerAutoSave();
        },
        updateTitleText(qIndex, tIndex, val) {
            const v = val ? String(val) : '';
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.title)) {
                this.$set(q, 'title', [{ lang: 'EN', text: v }]);
            } else {
                const existing = q.title[tIndex] || { lang: 'EN', text: v };
                const updated = Object.assign({}, existing, { text: v });
                this.$set(q.title, tIndex, updated);
            }
            this.triggerAutoSave();
        },
        updateOption(qIndex, oIndex, val) {
            const v = val ? String(val) : '';
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.options)) {
                this.$set(q, 'options', [v]);
            } else {
                this.$set(q.options, oIndex, v);
            }
            this.triggerAutoSave();
        },
        addOption(qIndex) {
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.options)) this.$set(q, 'options', ['Option 1']);
            else q.options.push(`Option ${q.options.length + 1}`);
            this.triggerAutoSave();
        },
        removeOption(qIndex, oIndex) {
            const q = this.questions[qIndex];
            if (!q || !Array.isArray(q.options)) return;
            if (q.options.length <= 1) return; // keep at least one option
            q.options.splice(oIndex, 1);
            this.triggerAutoSave();
        },
        toggleFileType(qIndex, typeKey) {
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.fileTypes)) this.$set(q, 'fileTypes', []);
            const idx = q.fileTypes.indexOf(typeKey);
            if (idx === -1) q.fileTypes.push(typeKey);
            else q.fileTypes.splice(idx, 1);
            this.triggerAutoSave();
        },
        setMaxFiles(qIndex, n) {
            const q = this.questions[qIndex];
            if (!q) return;
            this.$set(q, 'maxFiles', Number(n) || 1);
            this.triggerAutoSave();
        },
        setMaxFileSize(qIndex, n) {
            const q = this.questions[qIndex];
            if (!q) return;
            this.$set(q, 'maxFileSize', Number(n) || 1);
            this.triggerAutoSave();
        },
        addTitle(qIndex) {
            const q = this.questions[qIndex];
            if (!q) return;
            if (!Array.isArray(q.title)) {
                this.$set(q, 'title', [{ lang: 'EN', text: '' }]);
            } else {
                q.title.push({ lang: '', text: '' });
            }
            this.triggerAutoSave();
        },
        removeTitle(qIndex, tIndex) {
            const q = this.questions[qIndex];
            if (!q || !Array.isArray(q.title)) return;
            if (q.title.length <= 1) return; // keep at least one
            q.title.splice(tIndex, 1);
            this.triggerAutoSave();
        }
        ,
        setRating(qIndex, number) {
            const q = this.questions[qIndex];
            if (!q) return;
            const n = Number(number) || 0;
            this.$set(q, 'rating', n);
            this.triggerAutoSave();
        }
    }
}
</script>
