<template>
    <div class="mt-3">
        <CCard class="mb-3">
            <CCardBody class="p-4">
                <div class="form-header-section">
                    <CInput 
                        class="form-title-input mb-2" 
                        size="lg" 
                        placeholder="Form Title" 
                        :value="title"
                        @input="$emit('update:title', $event)" 
                        @change="triggerAutoSave" 
                    />
                    <CTextarea 
                        class="form-desc-input" 
                        placeholder="Form Description" 
                        :value="description"
                        @input="$emit('update:description', $event)" 
                        @change="triggerAutoSave" 
                    />
                </div>
            </CCardBody>
        </CCard>

        <CRow>
            <!-- Left Column: Form Content -->
            <CCol md="9">
                <!-- Question List -->
                <CCard v-for="(question, index) in questions" :key="index" class="mb-3 position-relative">
                    <CCardBody class="p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div class="w-75">
                                <CInput 
                                    class="mb-2 font-weight-bold" 
                                    placeholder="Question Text"
                                    v-model="question.text" 
                                    style="background-color: #f8fafc;"
                                    @change="triggerAutoSave" 
                                />
                            </div>
                            <div class="text-right">
                                <CButton 
                                    color="danger" 
                                    variant="ghost" 
                                    size="sm" 
                                    @click="removeQuestion(index)"
                                >
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                        </div>

                        <!-- Question Content Preview based on Type -->
                        <div v-if="question.type === 'short_answer'">
                            <CInput 
                                disabled 
                                placeholder="Short answer text" 
                            />
                        </div>
                        <div v-else-if="question.type === 'paragraph'">
                            <CTextarea 
                                disabled 
                                placeholder="Long answer text" 
                                rows="3" 
                            />
                        </div>
                        <div v-else-if="question.type === 'multiple_choice'">
                            <div v-for="(opt, oIndex) in question.options" :key="oIndex"
                                class="d-flex align-items-center mb-2">
                                <div class="border rounded-circle mr-2" style="width: 18px; height: 18px;"/>
                                <span class="text-muted">Option {{ oIndex + 1 }}</span>
                            </div>
                        </div>
                        <div v-else>
                            <span class="text-muted font-italic">Preview not available for this type</span>
                        </div>

                        <div class="text-right mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <small class="text-muted font-weight-bold text-uppercase">{{
                                question.type.replace('_', ' ')
                            }}</small>
                            <CSwitch class="mx-1" color="dark" :checked.sync="question.required" label-on="Req"
                                label-off="Opt" @update:checked="triggerAutoSave" />
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
                                <CIcon name="cil-list-rich" class="mr-2" /> Multiple Choice
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('rating')">
                                <CIcon name="cil-check-alt" class="mr-2" /> Rating
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('paragraph')">
                                <CIcon name="cil-align-left" class="mr-2" /> File Upload
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('title_description')">
                                <CIcon name="cil-list-rich" class="mr-2" /> Title & Description
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('image')">
                                <CIcon name="cil-image" class="mr-2" /> Image
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('video')">
                                <CIcon name="cil-video" class="mr-2" /> Video
                            </CButton>
                            <CButton variant="ghost" color="dark" class="text-left mb-2 d-flex align-items-center"
                                @click="addQuestion('section_divider')">
                                <CIcon name="cil-music" class="mr-2" /> Section Divider
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
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        },
        addQuestion(type) {
            const newQuestion = {
                id: Date.now(),
                text: '',
                type: type,
                required: false,
                options: type === 'multiple_choice' || type === 'checkbox' ? ['Option 1'] : []
            };
            this.questions.push(newQuestion);
            this.triggerAutoSave();
        },
        removeQuestion(index) {
            this.questions.splice(index, 1);
            this.triggerAutoSave();
        }
    }
}
</script>
