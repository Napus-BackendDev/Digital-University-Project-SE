<template>
    <div class="create-form">
        <CRow class="mb-4">
            <CCol col="12" class="d-flex justify-content-between align-items-center">
                <ButtonBack path="/editor/dashboard" />
                <div class="d-flex align-items-center">
                    <span class="text-muted small font-weight-bold mr-3">
                        <CIcon v-if="saveStatus === 'Saving...'" name="cil-cloud-upload" class="mr-1" />
                        <CIcon v-else-if="saveStatus === 'Saved'" name="cil-check-alt" class="mr-1 text-success" />
                        <CIcon v-else name="cil-warning" class="mr-1 text-danger" />
                        {{ saveStatus }}
                    </span>
                    <ButtonPreview />
                </div>
            </CCol>
        </CRow>

        <CRow>
            <CCol col="12" class="mb-4">
                <div class="tab-container">
                    <CTabs variant="pills" :active-tab="0" class="custom-tabs-wrapper">
                        <CTab>
                            <template slot="title">
                                <span class="d-flex align-items-center">
                                    <CIcon name="cil-description" class="mr-2" />
                                    Questions
                                </span>
                            </template>
                            <div class="mt-3">
                                <div class="p-4 bg-white border rounded mb-3">
                                    <div class="form-header-section">
                                        <CInput class="form-title-input mb-2" size="lg" placeholder="Form Title"
                                            v-model="formTitle" />
                                        <CTextarea class="form-desc-input" placeholder="Form Description"
                                            v-model="formDescription" />
                                    </div>
                                </div>

                                <CRow>
                                    <!-- Left Column: Form Content -->
                                    <CCol md="9">
                                        <!-- Question List -->
                                        <div v-for="(question, index) in questions" :key="index"
                                            class="p-4 bg-white border rounded mb-3 position-relative">
                                            <div class="d-flex justify-content-between align-items-start mb-3">
                                                <div class="w-75">
                                                    <CInput class="mb-2 font-weight-bold" placeholder="Question Text"
                                                        v-model="question.text" style="background-color: #f8fafc;" />
                                                </div>
                                                <div class="text-right">
                                                    <CButton color="danger" variant="ghost" size="sm"
                                                        @click="removeQuestion(index)">
                                                        <CIcon name="cil-trash" />
                                                    </CButton>
                                                </div>
                                            </div>

                                            <!-- Question Content Preview based on Type -->
                                            <div v-if="question.type === 'short_answer'">
                                                <CInput disabled placeholder="Short answer text" />
                                            </div>
                                            <div v-else-if="question.type === 'paragraph'">
                                                <CTextarea disabled placeholder="Long answer text" rows="3" />
                                            </div>
                                            <div v-else-if="question.type === 'multiple_choice'">
                                                <div v-for="(opt, oIndex) in question.options" :key="oIndex"
                                                    class="d-flex align-items-center mb-2">
                                                    <div class="border rounded-circle mr-2"
                                                        style="width: 18px; height: 18px;"></div>
                                                    <span class="text-muted">Option {{ oIndex + 1 }}</span>
                                                </div>
                                            </div>
                                            <div v-else>
                                                <span class="text-muted font-italic">Preview not available for this
                                                    type</span>
                                            </div>

                                            <div
                                                class="text-right mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                                <small class="text-muted font-weight-bold text-uppercase">{{
                                                    question.type.replace('_', ' ')
                                                }}</small>
                                                <CSwitch class="mx-1" color="dark" :checked.sync="question.required"
                                                    label-on="Req" label-off="Opt" />
                                            </div>
                                        </div>

                                        <div v-if="questions.length === 0"
                                            class="text-center py-5 text-muted bg-white border rounded">
                                            <p>No questions yet. Add one from the sidebar!</p>
                                        </div>

                                    </CCol>

                                    <!-- Right Column: Sticky Sidebar -->
                                    <CCol md="3">
                                        <div class="sticky-sidebar bg-white border rounded p-3">
                                            <h5 class="mb-3 font-weight-bold border-bottom pb-2">Question Types</h5>

                                            <div class="d-flex flex-column">
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('short_answer')">
                                                    <CIcon name="cil-text" class="mr-2" /> Short Answer
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('paragraph')">
                                                    <CIcon name="cil-align-left" class="mr-2" /> Paragraph
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('multiple_choice')">
                                                    <CIcon name="cil-list-rich" class="mr-2" /> Multiple Choice
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('rating')">
                                                    <CIcon name="cil-check-alt" class="mr-2" /> Rating
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('paragraph')">
                                                    <CIcon name="cil-align-left" class="mr-2" /> File Upload
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('title_description')">
                                                    <CIcon name="cil-list-rich" class="mr-2" /> Title & Description
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('image')">
                                                    <CIcon name="cil-image" class="mr-2" /> Image
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('video')">
                                                    <CIcon name="cil-video" class="mr-2" /> Video
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center"
                                                    @click="addQuestion('section_divider')">
                                                    <CIcon name="cil-music" class="mr-2" /> Section Divider
                                                </CButton>
                                                <!-- <hr />
                                                <h6 class="mb-2 text-muted font-weight-bold text-uppercase"
                                                    style="font-size: 0.75rem;">Content
                                                    Elements</h6>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center">
                                                    <CIcon name="cil-text" class="mr-2" /> Title & Description
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center">
                                                    <CIcon name="cil-image" class="mr-2" /> Image
                                                </CButton>
                                                <CButton variant="ghost" color="dark"
                                                    class="text-left mb-2 d-flex align-items-center">
                                                    <CIcon name="cil-video" class="mr-2" /> Video
                                                </CButton> -->
                                            </div>
                                        </div>

                                        <div>

                                        </div>
                                    </CCol>
                                </CRow>
                            </div>

                        </CTab>
                        <CTab>
                            <template slot="title">
                                <span class="d-flex align-items-center">
                                    <CIcon name="cil-chart-pie" class="mr-2" />
                                    Responses
                                    <CBadge color="secondary" shape="pill" class="ml-2">6</CBadge>
                                </span>
                            </template>
                            <div class="p-4 bg-white border rounded mt-3">
                                <h4>Responses</h4>
                            </div>
                        </CTab>
                        <CTab>
                            <template slot="title">
                                <span class="d-flex align-items-center">
                                    <CIcon name="cil-settings" class="mr-2" />
                                    Settings
                                </span>
                            </template>
                            <div class="mt-3">
                                <!-- Card 1: Form Status -->
                                <CCard class="mb-4 border-0 shadow-sm">
                                    <CCardBody class="p-4">
                                        <h5 class="mb-4 font-weight-bold text-dark">Form Status</h5>
                                        <CRow class="mb-4 align-items-center">
                                            <CCol md="3">
                                                <label class="mb-0 font-weight-bold text-muted-dark">Start date
                                                    time</label>
                                            </CCol>
                                            <CCol md="9">
                                                <CInput type="datetime-local" class="mb-0"
                                                    style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                                                    v-model="settings.startDateTime" />
                                            </CCol>
                                        </CRow>
                                        <CRow class="align-items-center">
                                            <CCol md="3">
                                                <label class="mb-0 font-weight-bold text-muted-dark">End date
                                                    time</label>
                                            </CCol>
                                            <CCol md="9">
                                                <CInput type="datetime-local" class="mb-0"
                                                    style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                                                    v-model="settings.endDateTime" />
                                            </CCol>
                                        </CRow>
                                    </CCardBody>
                                </CCard>

                                <!-- Card 2: Access Control -->
                                <CCard class="mb-4 border-0 shadow-sm">
                                    <CCardBody class="p-4">
                                        <h5 class="mb-4 font-weight-bold text-dark">Access Control</h5>

                                        <div class="mb-4">
                                            <h6 class="font-weight-bold mb-2">Who can respond?</h6>
                                            <CSelect :options="['Anyone with the link']" v-model="settings.accessType"
                                                style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" />
                                        </div>

                                        <hr class="my-4" />

                                        <div class="mb-4">
                                            <h6 class="font-weight-bold mb-1">Collaborators</h6>
                                            <p class="text-muted small mb-3">Add people who can help you manage this
                                                form</p>
                                            <CRow>
                                                <CCol md="6" class="mb-2 mb-md-0">
                                                    <CInput placeholder="Email address"
                                                        v-model="settings.newCollaborator.email"
                                                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" />
                                                </CCol>
                                                <CCol md="4" class="mb-2 mb-md-0">
                                                    <CSelect :options="['Editor', 'Viewer']"
                                                        v-model="settings.newCollaborator.role"
                                                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;" />
                                                </CCol>
                                                <CCol md="2">
                                                    <CButton color="primary" block
                                                        style="height: 45px; border-radius: 8px;"
                                                        class="font-weight-bold">Add</CButton>
                                                </CCol>
                                            </CRow>
                                        </div>

                                        <div class="bg-light p-3 rounded">
                                            <div class="mb-1" style="color: #4f4f4f;">
                                                <strong class="text-dark">Editor :</strong> Can edit form and view
                                                responses
                                            </div>
                                            <div style="color: #4f4f4f;">
                                                <strong class="text-dark">Viewer :</strong> Can only view form and view
                                                responses
                                            </div>
                                        </div>
                                    </CCardBody>
                                </CCard>

                                <!-- Card 3: Response Settings -->
                                <CCard class="mb-4 border-0 shadow-sm">
                                    <CCardBody class="p-4">
                                        <h5 class="mb-4 font-weight-bold text-dark">Response Settings</h5>

                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <div>
                                                <h6 class="mb-1 font-weight-bold">Collect email addresses</h6>
                                                <small class="text-muted">Require respondents to enter their
                                                    email</small>
                                            </div>
                                            <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                                                :checked.sync="settings.collectEmails" />
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <div>
                                                <h6 class="mb-1 font-weight-bold">Limit to one response</h6>
                                                <small class="text-muted">Only allow one response per person</small>
                                            </div>
                                            <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                                                :checked.sync="settings.limitOneResponse" />
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center mb-4">
                                            <div>
                                                <h6 class="mb-1 font-weight-bold">Allow response editing</h6>
                                                <small class="text-muted">Let respondents edit their responses after
                                                    submitting</small>
                                            </div>
                                            <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                                                :checked.sync="settings.allowEditing" />
                                        </div>

                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1 font-weight-bold">Show progress bar</h6>
                                                <small class="text-muted">Display completion progress to
                                                    respondents</small>
                                            </div>
                                            <CSwitch class="mx-1" color="dark" shape="pill" variant="opposite"
                                                :checked.sync="settings.showProgressBar" />
                                        </div>
                                    </CCardBody>
                                </CCard>

                                <!-- Card 4: Send Form -->
                                <CCard class="mb-4 border-0 shadow-sm">
                                    <CCardBody class="p-4">
                                        <h5 class="mb-2 font-weight-bold text-dark">Send Form</h5>
                                        <p class="text-muted mb-4">Share this form with respondents via link or email
                                        </p>

                                        <div class="d-flex">
                                            <CButton color="light" class="mr-3 d-flex align-items-center px-3 py-2"
                                                style="border-radius: 6px; background-color: #f8f9fa; border: 1px solid #d8dbe0;">
                                                <CIcon name="cil-share-alt" class="mr-2" />
                                                Copy Link
                                            </CButton>
                                            <CButton color="dark" class="d-flex align-items-center px-3 py-2"
                                                style="border-radius: 6px;">
                                                <CIcon name="cil-envelope-closed" class="mr-2" />
                                                Send via Email
                                            </CButton>
                                        </div>
                                    </CCardBody>
                                </CCard>
                            </div>
                        </CTab>
                    </CTabs>
                </div>
            </CCol>
        </CRow>
    </div>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue'
import ButtonPreview from '../../components/Button/ButtonPreview.vue'

export default {
    name: "CreateForm",
    components: {
        ButtonBack,
        ButtonPreview
    },
    data() {
        return {
            saveStatus: 'Saved',
            saveTimeout: null,
            formTitle: 'Untitled Form',
            formDescription: '',
            settings: {
                startDateTime: '',
                endDateTime: '',
                accessType: 'Anyone with the link',
                newCollaborator: {
                    email: '',
                    role: 'Editor'
                },
                collectEmails: false,
                limitOneResponse: false,
                allowEditing: false,
                showProgressBar: false
            },
            questions: [
                {
                    id: 1,
                    text: 'What is your full name?',
                    type: 'short_answer',
                    required: true,
                    options: []
                }
            ]
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
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
        },
        removeQuestion(index) {
            this.questions.splice(index, 1);
        },
        triggerAutoSave() {
            this.saveStatus = 'Saving...';
            if (this.saveTimeout) clearTimeout(this.saveTimeout);

            // Debounce save by 1.5 seconds
            this.saveTimeout = setTimeout(() => {
                this.saveForm();
            }, 1500);
        },
        async saveForm() {
            try {
                // Here you would usually make an API call
                // const formData = {
                //     title: this.formTitle,
                //     description: this.formDescription,
                //     questions: this.questions,
                //     settings: this.settings
                // };
                // await api.save(formData);

                console.log('Auto-saving form data...');

                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));

                this.saveStatus = 'Saved';
                const now = new Date();
                console.log(`Saved at ${now.toLocaleTimeString()}`);
            } catch (error) {
                console.error('Auto-save failed:', error);
                this.saveStatus = 'Error saving';
            }
        }
    },
    computed: {
    },
    watch: {
        formTitle: 'triggerAutoSave',
        formDescription: 'triggerAutoSave',
        questions: {
            handler: 'triggerAutoSave',
            deep: true
        },
        settings: {
            handler: 'triggerAutoSave',
            deep: true
        }
    }
}
</script>

<style lang="scss">
/* We use global style or deep selector because CTabs generates nav structure */
.custom-tabs-wrapper {
    width: 100%;
}

.custom-tabs-wrapper .tab-content {
    width: 100%;
}

/* Add min-height to the white content boxes */
.custom-tabs-wrapper .tab-content>.active {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
}

.custom-tabs-wrapper .nav-pills {
    background-color: #f1f5f9;
    padding: 4px;
    border-radius: 50px;
    display: flex;
    /* Changed from inline-flex to flex for full width */
    width: 100%;
    /* Force full width */
    border: 1px solid #e2e8f0;
    margin-bottom: 1.5rem;
    /* Add spacing below tabs */
}

.custom-tabs-wrapper .nav-item {
    margin-right: 0 !important;
    flex: 1;
    /* Distribute space equally */
    text-align: center;
}

.custom-tabs-wrapper .nav-link {
    border-radius: 50px !important;
    color: #64748b !important;
    padding: 10px 0 !important;
    /* Adjust padding */
    font-weight: 500;
    transition: all 0.2s ease;
    border: none !important;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}


.custom-tabs-wrapper .nav-link:hover {
    color: #334155 !important;
}

.custom-tabs-wrapper .nav-link.active {
    background-color: white !important;
    color: #0f172a !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-weight: 600;
}

.form-title-input input {
    font-size: 2rem !important;
    padding: 0px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: bold;
    color: #1a202c;
    height: auto !important;
}

.form-title-input input:focus {
    border-bottom: 2px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none;
    padding: 0px !important;
    color: #64748b;
    font-size: 1rem;
}

.form-desc-input textarea:focus {
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.sticky-sidebar {
    position: sticky;
    top: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>