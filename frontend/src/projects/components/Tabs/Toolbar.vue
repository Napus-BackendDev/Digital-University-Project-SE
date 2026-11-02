<template>
    <CCol md="3">
        <CCard
            class="tab-card shadow-sm border"
            :class="{ 'is-spotlight-panel': isWizardActive && wizardStep === 2 }"
        >
            <CCardBody class="p-3 p-lg-4 d-flex flex-column h-100">
                <!-- Navigation Buttons -->
                <div class="d-flex justify-content-between mb-3 align-items-center">
                    <ButtonBack />
                    <ButtonPreview />
                </div>

                <!-- 3-Tab Horizontal Switcher (Matching PAGE 10 Right Panel) -->
                <div class="right-panel-tabs-grid mb-3">
                    <button
                        type="button"
                        class="right-tab-box"
                        :class="{ 'is-active': activeTab === 'question' }"
                        @click="$emit('update:activeTab', 'question')"
                    >
                        <strong class="d-block">Tab 1: Questions</strong>
                        <small>({{ $t('toolbar.questions') || 'ออกแบบคำถาม' }})</small>
                    </button>
                    <button
                        type="button"
                        class="right-tab-box"
                        :class="{ 'is-active': activeTab === 'response' }"
                        @click="$emit('update:activeTab', 'response')"
                    >
                        <strong class="d-block">Tab 2: Responses</strong>
                        <small>({{ $t('toolbar.responses') || 'ดูผลคำตอบ' }})</small>
                    </button>
                    <button
                        type="button"
                        class="right-tab-box"
                        :class="{ 'is-active': activeTab === 'setting' }"
                        @click="$emit('update:activeTab', 'setting')"
                    >
                        <strong class="d-block">Tab 3: Settings</strong>
                        <small>({{ $t('toolbar.settings') || 'ตั้งค่าฟอร์ม' }})</small>
                    </button>
                </div>

                <!-- Sharing Section -->
                <div class="mb-3" v-if="activeTab === 'setting'">
                    <div class="toolbox-group-header mb-2">
                        <CIcon name="cil-share-alt" size="sm" class="mr-1" />
                        <span>{{ $t('toolbar.sharing') || 'แชร์และส่งต่อแบบสอบถาม' }}</span>
                    </div>
                    <CButton
                        variant="ghost"
                        color="dark"
                        class="w-100 mb-2 text-left type-btn d-flex align-items-center border"
                        @click="copyLink"
                    >
                        <div class="icon-circle mr-3">
                            <CIcon :name="copied ? 'cil-check' : 'cil-link'" size="sm" />
                        </div>
                        <span class="font-weight-medium">{{ copied ? $t('toolbar.copied') : $t('toolbar.copyLink') }}</span>
                    </CButton>

                    <CButton
                        variant="ghost"
                        color="dark"
                        class="w-100 mb-1 text-left type-btn d-flex align-items-center border"
                        @click="showQRModal = true"
                    >
                        <div class="icon-circle mr-3">
                            <CIcon name="cil-qr-code" size="sm" />
                        </div>
                        <span class="font-weight-medium">{{ $t('toolbar.qr.scan') }}</span>
                    </CButton>
                </div>

                <!-- Question Types 8-Card Grid Section (Spotlight #2B in Step 2) -->
                <div class="toolbar-scroll-area flex-grow-1 pr-1">
                    <div
                        class="question-types-toolbox"
                        :class="{ 'is-spotlight-2b': isWizardActive && wizardStep === 2 }"
                    >
                        <div class="toolbox-banner mb-2">
                            <CIcon :name="isWizardActive && wizardStep === 2 ? 'cil-bolt' : 'cil-list'" size="sm" class="mr-1" />
                            <span v-if="isWizardActive && wizardStep === 2">
                                SPOTLIGHT #2B: แผงปุ่มเลือกชนิดคำถาม 8 รูปแบบ — คลิกเพื่อเพิ่มข้อคำถาม
                            </span>
                            <span v-else>
                                Question Types Toolbox — ปุ่มเพิ่มข้อคำถาม 8 ชนิด
                            </span>
                        </div>

                        <div class="qtype-grid">
                            <button
                                v-for="(qCard, qIdx) in allEightQuestionCards"
                                :key="qCard.key + '-' + qIdx"
                                type="button"
                                class="qtype-card-btn"
                                :class="{ 'is-highlighted': isWizardActive && wizardStep === 2 }"
                                @click="handleSelectQuestionCard(qCard)"
                            >
                                <div class="d-flex align-items-center justify-content-center mb-1">
                                    <span class="qtype-icon-badge mr-1">
                                        <CIcon :name="qCard.icon" size="sm" />
                                    </span>
                                    <strong class="qtype-title">{{ qIdx + 1 }}. {{ qCard.title }}</strong>
                                </div>
                                <small class="qtype-role">หน้าที่: {{ qCard.roleDesc }}</small>
                            </button>
                        </div>
                    </div>
                </div>
            </CCardBody>
        </CCard>

        <CModal :show.sync="showQRModal" centered class="premium-modal">
            <template #header>
                <div class="w-100 d-flex justify-content-between align-items-center border-bottom-0 pb-0">
                    <h5 class="mb-0 font-weight-bold text-dark d-flex align-items-center">
                        <div class="icon-circle-header mr-3">
                            <CIcon name="cil-qr-code" class="text-primary" size="lg" />
                        </div>
                        {{ $t('toolbar.qr.share') }}
                    </h5>
                    <CButton class="text-secondary p-0 shadow-none border-0" @click="showQRModal = false">
                        <CIcon name="cil-x" size="lg" />
                    </CButton>
                </div>
            </template>
            <div class="d-flex justify-content-center align-items-center flex-column py-4 px-3">
                <div class="qr-wrapper mb-4 text-center">
                    <qr-code v-if="showQRModal" :text="formUrl" :size="200" level="H" render-as="canvas" />
                </div>
                <h4 class="font-weight-bold text-dark text-center mb-2">{{ formTitle }}</h4>
                <p class="text-muted text-center mb-0 px-2" style="font-size: 0.95rem;">
                    {{ $t('toolbar.qr.instruction') }}
                </p>
            </div>
            <template #footer>
                <div class="w-100 d-flex justify-content-center border-top-0 pt-0 pb-2">
                    <CButton color="primary" variant="outline" shape="pill" class="px-5 font-weight-bold btn-done shadow-sm" @click="showQRModal = false">
                        {{ $t('toolbar.qr.done') }}
                    </CButton>
                </div>
            </template>
        </CModal>
    </CCol>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue';
import ButtonPreview from '../../components/Button/ButtonPreview.vue';

export default {
    name: 'Toolbar',
    components: {
        ButtonBack,
        ButtonPreview
    },
    props: {
        activeTab: {
            type: String,
            default: 'question'
        },
        questionTypes: {
            type: Array,
            default: () => []
        },
        form: {
            type: Object,
            default: () => ({})
        },
        isWizardActive: {
            type: Boolean,
            default: false
        },
        wizardStep: {
            type: Number,
            default: 1
        }
    },
    data() {
        return {
            copied: false,
            showQRModal: false
        };
    },
    computed: {
        formUrl() {
            if (!this.form || !this.form._id) return '';
            return `${window.location.origin}/#/forms/${this.form._id}?mode=public`;
        },
        formTitle() {
            return this.getTitle(this.form.title) || 'Form';
        },
        allEightQuestionCards() {
            const definitions = [
                { key: 'short_answer', title: 'Short Text', icon: 'cil-minus', roleDesc: 'เพิ่มโจทย์คำตอบสั้น 1 บรรทัด' },
                { key: 'paragraph', title: 'Paragraph', icon: 'cil-align-left', roleDesc: 'เพิ่มโจทย์คำตอบยาวหลายบรรทัด' },
                { key: 'multiple_choice', title: 'Multiple Choice', icon: 'cil-circle', roleDesc: 'เพิ่มโจทย์ตัวเลือกเดียว (Radio)' },
                { key: 'checkbox', title: 'Checkboxes', icon: 'cil-square', roleDesc: 'เพิ่มโจทย์เลือกได้หลายข้อ' },
                { key: 'rating', title: 'Rating (1-5)', icon: 'cil-star', roleDesc: 'เพิ่มโจทย์ให้คะแนนระดับดาว' },
                { key: 'file_upload', title: 'File Upload', icon: 'cil-cloud-upload', roleDesc: 'เพิ่มโจทย์แนบไฟล์เอกสาร/รูป' },
                { key: 'title_description', title: 'Section Title', icon: 'cil-text', roleDesc: 'เพิ่มป้ายหัวข้อแบ่งตอน' },
                { key: 'image', title: 'Image Banner', icon: 'cil-image-1', roleDesc: 'แทรกรูปภาพประกอบ' }
            ];

            return definitions.map(def => {
                const matched = (this.questionTypes || []).find(qt => {
                    const normalized = String(qt?.type || '').toLowerCase().replace(/ /g, '_');
                    return normalized === def.key;
                });
                return {
                    ...def,
                    typeId: matched ? matched._id : def.key
                };
            });
        }
    },
    methods: {
        handleSelectQuestionCard(qCard) {
            if (qCard.key === 'image') {
                this.$emit('open-image');
            } else {
                this.$emit('add-question', qCard.typeId);
            }
        },
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            const key = rawType.toLowerCase().replace(/ /g, '_');
            if (this.$te(`types.${key}`)) {
                return this.$t(`types.${key}`);
            }
            return rawType
                .split(/[_\s]+/)
                .map(seg => seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : '')
                .join(' ');
        },
        getIconForType(typeStr) {
            const type = (typeStr || '').toLowerCase().replace(/ /g, '_');
            switch (type) {
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
        copyLink() {
            if (!this.form || !this.form._id) return;
            const url = `${window.location.origin}/#/forms/${this.form._id}?mode=public`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => this.showCopied());
            } else {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                this.showCopied();
            }
        },
        showCopied() {
            this.copied = true;
            setTimeout(() => { this.copied = false; }, 2000);
        },
        sendEmail() {
            if (!this.form || !this.form._id) return;
            const url = `${window.location.origin}/#/forms/${this.form._id}?mode=public`;
            const title = this.getTitle(this.form.title) || 'Form';
            const subject = encodeURIComponent(`Please fill out this form: ${title}`);
            const body = encodeURIComponent(`You can access the form here:\n${url}`);
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
        },
        getTitle(arr) {
            if (!arr || !arr.length) return '';
            const lang = (this.$i18n?.locale || 'en').substring(0, 2).toLowerCase();
            const match = arr.find(t => t.key && t.key.toLowerCase() === lang);
            return match ? match.value : arr[0].value;
        }
    }
}
</script>

<style scoped>
.tab-card {
    position: sticky;
    top: 75px;
    max-height: calc(100vh - 90px);
    border-radius: 16px !important;
    background: #ffffff;
    z-index: 10;
    transition: all 0.2s ease;
}

.tab-card.is-spotlight-panel {
    border: 2.5px solid #f59e0b !important;
    background-color: #fffbeb !important;
}

.toolbar-scroll-area {
    overflow-y: auto;
    overflow-x: hidden;
}

.toolbar-scroll-area::-webkit-scrollbar {
    width: 4px;
}

.toolbar-scroll-area::-webkit-scrollbar-track {
    background: transparent;
}

.toolbar-scroll-area::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

/* 3-Tab Switcher Boxes */
.right-panel-tabs-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.4rem;
}

.right-tab-box {
    background-color: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.45rem 0.35rem;
    text-align: center;
    color: #334155;
    cursor: pointer;
    transition: all 0.16s ease;
    line-height: 1.2;
}

.right-tab-box strong {
    font-size: 0.74rem;
    font-weight: 700;
}

.right-tab-box small {
    font-size: 0.68rem;
    color: #475569;
}

.right-tab-box:hover {
    border-color: #8b1f1f;
}

.right-tab-box.is-active {
    background-color: #8b1f1f;
    border-color: #7f1d1d;
    color: #ffffff;
}

.right-tab-box.is-active small {
    color: #fecdd3;
}

/* 8 Question Types Toolbox Grid */
.question-types-toolbox {
    background-color: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 14px;
    padding: 0.7rem;
}

.question-types-toolbox.is-spotlight-2b {
    background-color: #fef3c7;
    border: 2.5px dashed #f59e0b;
}

.toolbox-banner {
    font-size: 0.78rem;
    font-weight: 700;
    color: #334155;
    display: flex;
    align-items: center;
    line-height: 1.3;
}

.question-types-toolbox.is-spotlight-2b .toolbox-banner {
    color: #92400e;
}

.toolbox-group-header {
    font-size: 0.78rem;
    font-weight: 700;
    color: #334155;
    display: flex;
    align-items: center;
}

.qtype-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
}

.qtype-card-btn {
    background-color: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.55rem 0.45rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.16s ease;
    min-height: 68px;
}

.qtype-card-btn.is-highlighted {
    border-color: #d97706;
    border-width: 2px;
}

.qtype-card-btn:hover {
    border-color: #2563eb;
    background-color: #eff6ff;
    transform: translateY(-1px);
}

.qtype-icon-badge {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background-color: #f1f5f9;
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.qtype-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
}

.qtype-role {
    font-size: 0.68rem;
    color: #334155;
    line-height: 1.25;
}

.type-btn {
    border-radius: 12px !important;
    padding: 8px 12px !important;
    color: #334155 !important;
    transition: all 0.2s ease;
}

.type-btn:hover,
.type-btn:focus,
.type-btn:active {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    box-shadow: none !important;
    outline: none !important;
}

.icon-circle {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    transition: all 0.2s ease;
}

.type-btn:hover .icon-circle {
    background: #ffffff;
    color: #2563eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.font-weight-medium {
    font-weight: 600;
}

.premium-modal /deep/ .modal-content {
    border-radius: 16px;
    border: none;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.icon-circle-header {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.qr-wrapper {
    background: #ffffff;
    padding: 24px;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01) !important;
}

.btn-done {
    border-width: 2px !important;
    transition: all 0.2s ease;
}

.btn-done:hover {
    background-color: #e0e7ff !important;
    border-color: #4f46e5 !important;
    color: #4f46e5 !important;
    transform: translateY(-1px);
}
</style>
