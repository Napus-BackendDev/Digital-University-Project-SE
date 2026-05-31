<template>
    <div>
        <Header 
            :title="`${$t('email.edit')} : ${displayTitle}`" 
            :description="currentDescription || $t('email.description')" 
            :isSaving="isSaving"
            :isSaved="!!lastSaved"
        >
            <template #actions>
                <CButton 
                    class="d-flex align-items-center px-3 py-2 mr-3 btn-back"
                    @click="$router.push({ name: 'Email' })"
                >
                    <CIcon name="cil-arrow-left" size="sm" class="mr-2" />
                    {{ $t('email.back') }}
                </CButton>
            </template>
        </Header>
        <main class="c-main">
            <CRow>
                <CCol md="9">
                    <!-- Subject Card -->
                    <CCard class="mb-4 rounded-20 shadow-sm border-0 bg-white">
                        <CCardBody class="p-4 d-flex align-items-center">
                            <div class="flex-grow-1">
                                <div class="d-flex align-items-center mb-1">
                                    <div class="text-uppercase font-weight-bold text-muted d-flex align-items-center" style="font-size: 0.75rem; letter-spacing: 1px;">
                                        <span>{{ $t('email.emailSubject') }}</span>
                                        <span class="badge ml-2 px-2 py-1 text-uppercase text-white" style="font-size: 0.65rem; border-radius: 4px; background-color: #ac1515;">
                                            {{ $i18n.locale }}
                                        </span>
                                    </div>
                                    <CIcon name="cil-pencil" size="sm" class="ml-2 text-muted" style="opacity: 0.6; width: 12px;" />
                                </div>
                                <input 
                                    type="text" 
                                    class="w-100 bg-transparent subject-input" 
                                    :placeholder="$t('email.subjectPlaceholder')"
                                    v-model="subjectBody"
                                    @input="handleInput"
                                >
                            </div>
                        </CCardBody>
                    </CCard>
                    <CCard class="mb-4 rounded-20 shadow-sm border overflow-hidden">
                        <!-- Quill Editor -->
                        <CCardBody class="p-0 quill-wrapper">
                            <quill-editor 
                                ref="myQuillEditor"
                                v-model="messageBody"
                                :options="editorOption"
                                @change="handleInput"
                            />
                        </CCardBody>
                    </CCard>
                </CCol>

                <!-- Right Column: Tools -->
                <CCol md="3">
                    <!-- Dynamic Variables -->
                    <CCard class="dynamic-vars-card shadow-sm border-0 mb-4 h-auto">
                        <CCardBody class="p-4">
                            <h6 class="font-weight-bold text-uppercase mb-4" style="letter-spacing: 0.5px;">{{ $t('email.dynamicVariables') }}</h6>
                            
                            <div class="d-flex flex-column">
                                <CButton 
                                    v-for="v in variables" 
                                    :key="v"
                                    class="variable-btn mb-3 text-left shadow-sm d-flex align-items-center"
                                    @click="insertVariable(v)"
                                    v-text="'{{' + v + '}}'"
                                >
                                </CButton>
                            </div>

                            <p class="help-text small text-muted mt-4 mb-0">
                                {{ $t('email.helpText') }}
                            </p>
                        </CCardBody>
                    </CCard>

                    <!-- ShortCut -->
                    <CCard class="shortcut-card shadow-sm border-0 h-auto">
                        <CCardBody class="p-4">
                            <h6 class="font-weight-bold text-uppercase mb-4" style="letter-spacing: 0.5px;">{{ $t('email.shortcut') }}</h6>
                            <p class="small text-muted mb-4">{{ $t('email.switchTemplate') }}</p>
                            <div class="list-group list-group-flush">
                                <a 
                                    v-for="temp in otherTemplates" 
                                    :key="temp._id"
                                    href="#" 
                                    class="list-group-item list-group-item-action border-0 px-3 py-3 mb-2 shortcut-item d-flex align-items-center"
                                    @click.prevent="switchToTemplate(temp._id)"
                                >
                                    <div class="icon-circle mr-3">
                                        <CIcon :name="temp.icon" class="text-primary" />
                                    </div>
                                    <div class="flex-grow-1">
                                        <div class="font-weight-bold small text-dark">{{ temp.name }}</div>
                                    </div>
                                    <CIcon name="cil-chevron-right" size="sm" class="text-muted" />
                                </a>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>
        </main>
    </div>
</template>

<script>
import Header from '../../components/Util/Header.vue'
import { mapGetters, mapActions } from 'vuex'
import 'quill/dist/quill.core.css'
import 'quill/dist/quill.snow.css'
import 'quill/dist/quill.bubble.css'
import { quillEditor } from 'vue-quill-editor'

export default {
    name: 'EmailDetail',
    components: {
        Header,
        quillEditor
    },
    props: {
        id: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            subjectBody: '',
            messageBody: '',
            subjects: { en: '', th: '' },
            contents: { en: '', th: '' },
            editorOption: {
                placeholder: 'สวัสดีคุณ {{Responder}}, ...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image']
                    ]
                }
            },
            isSaving: false,
            lastSaved: null,
            saveTimeout: null,
            variables: ['FormName', 'UserName', 'Organization', 'Responder', 'QuestionNumber', 'FormURL'],
            iconMap: {
                'invitationCollaboration': 'cil-user-follow',
                'invitationOrganization': 'cil-building',
                'submissionConfirmation': 'cil-check-circle',
                'ResponseNotification': 'cil-bell'
            }
        }
    },
    computed: {
        ...mapGetters('Setting/emailTemplate', ['item']),
        currentDoc() {
            if (!this.item) return null;
            return this.item.find(t => t._id === this.id) || null;
        },
        displayTitle() {
            if (!this.currentDoc || !this.currentDoc.name) return '';
            const currentLang = this.$i18n.locale || 'en';
            const n = this.currentDoc.name.find(x => x.key === currentLang) || this.currentDoc.name.find(x => x.key === 'en') || this.currentDoc.name[0];
            return n ? n.value : this.currentDoc.code;
        },
        currentDescription() {
            if (!this.currentDoc) return '';
            if (this.currentDoc.code && this.$te(`email.templates.${this.currentDoc.code}.desc`)) {
                return this.$t(`email.templates.${this.currentDoc.code}.desc`);
            }
            if (!this.currentDoc.name) return '';
            const currentLang = this.$i18n.locale || 'en';
            const fallbackLang = currentLang === 'en' ? 'th' : 'en';
            const n = this.currentDoc.name.find(x => x.key === fallbackLang) || this.currentDoc.name[1];
            return n ? n.value : '';
        },
        otherTemplates() {
            if (!this.item) return [];
            const currentLang = this.$i18n.locale || 'en';
            return this.item.filter(t => t._id !== this.id).map(t => {
                let nameObj = t.name.find(n => n.key === currentLang) || t.name.find(n => n.key === 'en') || t.name[0] || {};
                return {
                    _id: t._id,
                    name: nameObj.value || t.code,
                    icon: this.iconMap[t.code] || 'cil-envelope-closed'
                }
            });
        },
        saveStatus() {
            if (this.isSaving) return this.$t('email.saveStatus.saving')
            if (this.lastSaved) return this.$t('email.saveStatus.savedAt', { time: this.lastSaved })
            return this.$t('email.saveStatus.draftSaved')
        }
    },
    watch: {
        id: {
            immediate: true,
            handler(newId) {
                if(newId) this.loadData();
            }
        },
        '$i18n.locale'(newLocale, oldLocale) {
            if (oldLocale) {
                this.subjects[oldLocale] = this.subjectBody;
                this.contents[oldLocale] = this.messageBody;
                if (this.saveTimeout) {
                    clearTimeout(this.saveTimeout);
                    this.performSave();
                }
            }
            this.subjectBody = this.subjects[newLocale] || '';
            this.messageBody = this.contents[newLocale] || '';
        }
    },
    methods: {
        ...mapActions('Setting/emailTemplate', ['get', 'put']),
        async loadData() {
            try {
                if (!this.item || this.item.length === 0) {
                    await this.get(); // load all for shortcut menu
                }
                const doc = this.item.find(t => t._id === this.id);
                if (doc) {
                    const getLangVal = (arr, preferredLang) => {
                        if (!Array.isArray(arr)) return arr || '';
                        const found = arr.find(item => item.key === preferredLang);
                        if (found) return found.value;
                        const fallback = arr.find(item => item.key === 'en') || arr[0];
                        return fallback ? fallback.value : '';
                    };

                    this.subjects = {
                        en: getLangVal(doc.subject, 'en'),
                        th: getLangVal(doc.subject, 'th')
                    };
                    this.contents = {
                        en: getLangVal(doc.content, 'en'),
                        th: getLangVal(doc.content, 'th')
                    };

                    const currentLang = this.$i18n.locale || 'en';
                    this.subjectBody = this.subjects[currentLang] || '';
                    this.messageBody = this.contents[currentLang] || '';
                    
                    if (!this.subjectBody && typeof doc.subject === 'string') {
                        this.subjectBody = doc.subject;
                        this.subjects.en = doc.subject;
                        this.subjects.th = doc.subject;
                    }
                    if (!this.messageBody && typeof doc.content === 'string') {
                        this.messageBody = doc.content;
                        this.contents.en = doc.content;
                        this.contents.th = doc.content;
                    }
                }
            } catch (error) {
                console.error("Failed to load template", error);
            }
        },
        handleInput() {
            const currentLang = this.$i18n.locale || 'en';
            this.subjects[currentLang] = this.subjectBody;
            this.contents[currentLang] = this.messageBody;

            this.isSaving = true
            if (this.saveTimeout) clearTimeout(this.saveTimeout)
            this.saveTimeout = setTimeout(() => {
                this.performSave()
            }, 2000) 
        },
        async performSave() {
            try {
                if(!this.currentDoc) return;
                
                const updatedSubject = [
                    { key: 'en', value: this.subjects.en },
                    { key: 'th', value: this.subjects.th }
                ];
                const updatedContent = [
                    { key: 'en', value: this.contents.en },
                    { key: 'th', value: this.contents.th }
                ];

                await this.put({ 
                    _id: this.id, 
                    subject: updatedSubject,
                    content: updatedContent,
                    variables: this.variables
                });
                
                await this.get(); // Refresh local Vuex state to match backend
                
                this.lastSaved = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } catch (error) {
                console.error('Save failed', error)
            } finally {
                this.isSaving = false
            }
        },
        insertVariable(v) {
            const variableStr = `{{${v}}}`;
            if (!this.$refs.myQuillEditor) return;
            const quill = this.$refs.myQuillEditor.quill;
            const range = quill.getSelection(true); // true to focus and get selection
            
            if (range) {
                quill.insertText(range.index, variableStr);
                quill.setSelection(range.index + variableStr.length);
            } else {
                // If editor is not focused, append to the end
                const length = quill.getLength();
                quill.insertText(length, variableStr);
                quill.setSelection(length + variableStr.length);
            }
            this.handleInput(); // Trigger auto-save
        },
        switchToTemplate(newId) {
            this.$router.push({ name: 'EmailDetail', params: { id: newId } })
        }
    },
    beforeDestroy() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout)
    }
}
</script>

<style scoped>
.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Quill Editor Premium Styles */
::v-deep .quill-wrapper .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid #e2e8f0;
    background-color: #f8fafc;
    padding: 12px 20px;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
}
::v-deep .quill-wrapper .ql-container.ql-snow {
    border: none;
    font-family: inherit;
    font-size: 1.05rem;
    color: #2d3748;
    background-color: #ffffff;
    min-height: 500px;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
}
::v-deep .quill-wrapper .ql-editor {
    padding: 1.5rem;
    min-height: 500px;
}
::v-deep .quill-wrapper .ql-editor:focus {
    box-shadow: none;
}

.vr {
    display: inline-block;
    align-self: stretch;
    width: 1px;
    min-height: 1em;
    background-color: #e2e8f0;
    opacity: 1;
}

.rounded-20 {
    border-radius: 20px !important;
}

.subject-input {
    border: none;
    border-bottom: 2px solid #e2e8f0;
    color: #1e293b;
    font-size: 1.25rem;
    font-weight: 700;
    padding-bottom: 4px;
    transition: border-color 0.2s ease;
    outline: none;
}

.subject-input:hover {
    border-bottom-color: #cbd5e1;
}

.subject-input:focus {
    border-bottom-color: #ac1515;
}

.btn-back {
    background-color: #fff1f1;
    color: #ac1515;
    border: 1px solid #fecaca;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
}

.btn-back:hover {
    background-color: #ac1515;
    color: #ffffff;
    border-color: #ac1515;
    box-shadow: 0 4px 12px rgba(172, 21, 21, 0.2);
    transform: translateY(-1px);
    text-decoration: none;
}

.dynamic-vars-card, .shortcut-card {
    background-color: #fff6f6 !important;
    border-radius: 20px !important;
}

.variable-btn, .shortcut-item {
    background-color: #ffffff !important;
    border: 1px solid #f1caca !important;
    border-radius: 12px !important;
    transition: all 0.2s ease;
}

.variable-btn {
    padding: 12px 20px !important;
    color: #ac1515 !important;
    font-size: 1.1rem;
    font-weight: 700;
}

.shortcut-item:hover, .variable-btn:hover {
    background-color: #ffffff !important;
    border-color: #ac1515 !important;
    box-shadow: 0 4px 12px rgba(172, 21, 21, 0.1) !important;
    transform: translateY(-2px);
    text-decoration: none;
}

.icon-circle {
    width: 32px;
    height: 32px;
    background-color: #fff1f1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.text-primary {
    color: #ac1515 !important;
}

.help-text {
    line-height: 1.6;
    font-size: 0.85rem;
}

.editor-textarea {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    font-size: 1rem;
    line-height: 1.6;
    resize: none;
    transition: border-color 0.2s ease;
}

.editor-textarea:focus {
    border-color: #8c1515;
    box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.1);
}

.list-group-item-action:hover {
    background-color: #f8fafc;
    border-radius: 8px;
}
</style>