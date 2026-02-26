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
                <!-- Question List -->
                <CCard v-for="(question, index) in questions" :key="index" class="mb-3 position-relative">
                    <CCardBody class="p-4">
                        <div class="mb-4">
                            <!-- Thai Label & Input -->
                            <div class="d-flex mb-2">
                                <div class="bg-light d-flex align-items-center justify-content-center mr-2 rounded"
                                    style="width: 60px; height: 38px; min-width: 60px;">
                                    <span class="text-muted font-weight-bold">TH</span>
                                </div>
                                <div class="flex-grow-1 mr-2">
                                    <CInput v-model="question.text_th"
                                        :placeholder="getPlaceholder(question.type, 'th')" @change="triggerAutoSave" />
                                </div>
                                <CButton color="danger" variant="ghost" size="sm" class="align-self-center"
                                    @click="clearField(question, 'text_th')">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>

                            <!-- English Label & Input -->
                            <div class="d-flex mb-2">
                                <div class="bg-light d-flex align-items-center justify-content-center mr-2 rounded"
                                    style="width: 60px; height: 38px; min-width: 60px;">
                                    <span class="text-muted font-weight-bold">EN</span>
                                </div>
                                <div class="flex-grow-1 mr-2">
                                    <CInput v-model="question.text_en"
                                        :placeholder="getPlaceholder(question.type, 'en')" @change="triggerAutoSave" />
                                </div>
                                <CButton color="danger" variant="ghost" size="sm" class="align-self-center"
                                    @click="clearField(question, 'text_en')">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>

                            <!-- Description Input (Empty Label) -->
                            <div class="d-flex mb-2">
                                <div class="bg-light d-flex align-items-center justify-content-center mr-2 rounded"
                                    style="width: 60px; height: 38px; min-width: 60px;">
                                    <!-- Empty placeholder as per design -->
                                </div>
                                <div class="flex-grow-1 mr-2">
                                    <CInput v-model="question.description" placeholder="Description (Optional)"
                                        @change="triggerAutoSave" />
                                </div>
                                <CButton color="danger" variant="ghost" size="sm" class="align-self-center"
                                    @click="clearField(question, 'description')">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>

                            <!-- Add Button -->
                            <div class="mb-3">
                                <CButton block color="light" variant="outline" class="border-dashed text-muted"
                                    style="border-style: dashed;">
                                    <span style="font-size: 1.2rem; line-height: 1;">+</span>
                                </CButton>
                            </div>
                        </div>

                        <!-- Question Content Preview based on Type -->
                        <div v-if="question.type === 'short_answer'" class="mb-3">
                            <CInput disabled placeholder="Short answer text" />
                        </div>
                        <div v-else-if="question.type === 'paragraph'" class="mb-3">
                            <CTextarea disabled placeholder="Long answer text" rows="3" />
                        </div>
                        <div v-else-if="question.type === 'multiple_choice'" class="mb-3">
                            <div v-for="(opt, oIndex) in question.options" :key="oIndex" class="mb-3">
                                <div class="d-flex align-items-center mb-2">
                                    <div class="mr-2 text-muted">
                                        <div class="border rounded-circle" style="width: 20px; height: 20px;"></div>
                                    </div>
                                    <!-- Check if opt is object (new structure) or string (legacy/simple) -->
                                    <CInput v-if="typeof opt === 'object'" class="mb-0 flex-grow-1" v-model="opt.label"
                                        @change="triggerAutoSave" placeholder="Option"
                                        style="background-color: #f8fafc;" />
                                    <CInput v-else class="mb-0 flex-grow-1" v-model="question.options[oIndex]"
                                        @change="triggerAutoSave" placeholder="Option"
                                        style="background-color: #f8fafc;" />

                                    <span v-if="typeof opt === 'object' && opt.followUp"
                                        class="badge badge-info ml-2">Has follow-up</span>

                                    <CButton @click="removeOption(question, oIndex)" color="danger" variant="ghost"
                                        size="sm" class="ml-2">
                                        <CIcon name="cil-trash" />
                                    </CButton>
                                </div>

                                <!-- Follow Up Section for Multiple Choice -->
                                <div v-if="typeof opt === 'object'" class="ml-4 pl-1">
                                    <div v-if="!opt.followUp" class="mb-2">
                                        <CButton size="sm" variant="ghost" color="danger"
                                            class="p-0 text-decoration-none" @click="addFollowUp(opt)">
                                            <span class="font-weight-bold">+ Add follow-up question</span>
                                        </CButton>
                                    </div>

                                    <NestedQuestion v-if="opt.followUp" :question="opt.followUp"
                                        :level="(index + 1) + '.' + (oIndex + 1)" @update="triggerAutoSave"
                                        @remove="removeFollowUp(opt)" />
                                </div>
                            </div>
                            <div class="mt-2 pl-4">
                                <CButton color="danger" variant="ghost" size="sm" class="font-weight-bold"
                                    @click="addOption(question)">
                                    + Add option
                                </CButton>
                            </div>
                        </div>

                        <div v-else-if="question.type === 'checkbox'" class="mb-3">
                            <div v-for="(opt, oIndex) in question.options" :key="oIndex"
                                class="d-flex align-items-center mb-2">
                                <div class="mr-2 text-muted">
                                    <div class="border rounded" style="width: 20px; height: 20px;"></div>
                                </div>
                                <CInput class="mb-0 flex-grow-1" v-model="question.options[oIndex]"
                                    @change="triggerAutoSave" placeholder="Option" style="background-color: #f8fafc;" />
                                <CButton @click="removeOption(question, oIndex)" color="danger" variant="ghost"
                                    size="sm" class="ml-2">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                            <div class="mt-2 pl-4">
                                <CButton color="danger" variant="ghost" size="sm" class="font-weight-bold"
                                    @click="addOption(question)">
                                    + Add option
                                </CButton>
                            </div>
                        </div>
                        <div v-else-if="question.type === 'file_upload'" class="mb-3">
                            <div class="border rounded p-3 text-center text-muted"
                                style="border-style: solid; border-width: 1px;">
                                File upload area
                            </div>
                        </div>
                        <div v-else-if="question.type === 'rating'" class="mb-3">
                            <div class="d-flex align-items-center">
                                <label class="mr-3 mb-0 font-weight-bold">Max rating:</label>
                                <CInput type="number" class="mb-0" style="max-width: 100px;"
                                    v-model.number="question.max_rating" @change="triggerAutoSave" min="1" max="10" />
                            </div>
                        </div>
                        <div v-else class="mb-3">
                            <span class="text-muted font-italic">Preview not available for this type</span>
                        </div>

                        <!-- Footer: Type & Required -->
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <div class="d-flex align-items-center flex-grow-1">
                                <label class="mb-0 mr-3 font-weight-bold text-nowrap">Question Type</label>
                                <CSelect :value.sync="question.type" :options="questionTypeOptions"
                                    @change="triggerAutoSave" custom class="mb-0" style="max-width: 200px;" />
                            </div>

                            <div class="d-flex align-items-center">
                                <label class="mb-0 mr-2 font-weight-bold">Required</label>
                                <CSwitch class="mx-1" color="dark" shape="pill" :checked.sync="question.required"
                                    @update:checked="triggerAutoSave" />

                                <div class="ml-3 border-left pl-3">
                                    <CButton color="danger" variant="ghost" size="sm" @click="removeQuestion(index)">
                                        <CIcon name="cil-trash" />
                                    </CButton>
                                </div>
                            </div>
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
                        <h5 class="mb-3 font-weight-bold border-bottom pb-2">Question Types</h5>

                        <div class="d-flex flex-column">
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('short_answer')">
                                <CIcon name="cil-text" class="mr-2" /> Short Answer
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('paragraph')">
                                <CIcon name="cil-align-left" class="mr-2" /> Paragraph
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('multiple_choice')">
                                <CIcon name="cil-circle" class="mr-2" /> Multiple Choice
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('checkbox')">
                                <CIcon name="cil-check-alt" class="mr-2" /> Checkbox
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('rating')">
                                <CIcon name="cil-check-alt" class="mr-2" /> Rating
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('file_upload')">
                                <CIcon name="cil-cloud-upload" class="mr-2" /> File Upload
                            </CButton>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    </div>
</template>

<script>
import NestedQuestion from './NestedQuestion.vue'

export default {
    name: 'TabQuestion',
    components: {
        NestedQuestion
    },
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
            questionTypeOptions: [
                { value: 'short_answer', label: 'Short Answer' },
                { value: 'paragraph', label: 'Paragraph' },
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'checkbox', label: 'Checkbox' },
                { value: 'rating', label: 'Rating' },
                { value: 'file_upload', label: 'File Upload' },
            ]
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        addQuestion(type) {
            let options = [];
            if (type === 'multiple_choice') {
                options = [{ label: 'Option 1', followUp: null }];
            } else if (type === 'checkbox') {
                options = ['Option 1'];
            }

            const newQuestion = {
                id: Date.now(),
                text: '',
                text_th: '',
                text_en: '',
                description: '',
                type: type,
                required: false,
                options: options,
                max_rating: 5
            };
            this.questions.push(newQuestion);
            this.triggerAutoSave();
        },
        removeQuestion(index) {
            this.questions.splice(index, 1);
            this.triggerAutoSave();
        },
        clearField(question, field) {
            if (question[field]) {
                question[field] = '';
                this.triggerAutoSave();
            }
        },
        getPlaceholder(type, lang) {
            if (type === 'short_answer') {
                return lang === 'th' ? 'คำถามตอบสั้น' : 'Short Answer Question';
            }
            // Default placeholder
            return lang === 'th' ? 'ชื่อ-นามสกุล?' : 'What is your full name?';
        },
        addOption(question) {
            if (question.type === 'multiple_choice') {
                // Ensure we push an object if type is multiple_choice
                question.options.push({ label: `Option ${question.options.length + 1}`, followUp: null });
            } else {
                question.options.push(`Option ${question.options.length + 1}`);
            }
            this.triggerAutoSave();
        },
        removeOption(question, index) {
            question.options.splice(index, 1);
            this.triggerAutoSave();
        },
        addFollowUp(option) {
            // option is the object inside options array
            this.$set(option, 'followUp', {
                id: Date.now(),
                text: '',
                description: '',
                type: 'multiple_choice',
                required: false,
                options: [{ label: 'Option 1', followUp: null }]
            });
            this.triggerAutoSave();
        },
        removeFollowUp(option) {
            this.$set(option, 'followUp', null);
            this.triggerAutoSave();
        }
    }
}
</script>
