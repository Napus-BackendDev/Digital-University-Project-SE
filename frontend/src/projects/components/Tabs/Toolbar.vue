<template>
    <CCol md="3">
        <CCard class="tab-card shadow-sm border">
            <CCardBody class="p-4 d-flex flex-column h-100">
                <!-- Navigation Buttons -->
                <div class="d-flex justify-content-between mb-4 align-items-center">
                    <ButtonBack />
                    <ButtonPreview />
                </div>

                <!-- Tab Selectors -->
                <div class="tab-buttons mb-4">
                    <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">Main Navigation</label>
                    <CButton class="w-100 mb-2 text-left nav-btn" color="primary"
                        :variant="activeTab === 'question' ? 'solid' : 'ghost'"
                        @click="$emit('update:activeTab', 'question')">
                        <CIcon name="cil-description" class="mr-2" /> Questions
                    </CButton>
                    <CButton class="w-100 mb-2 text-left nav-btn" color="primary"
                        :variant="activeTab === 'response' ? 'solid' : 'ghost'"
                        @click="$emit('update:activeTab', 'response')">
                        <CIcon name="cil-chart-pie" class="mr-2" /> Responses
                    </CButton>
                    <CButton class="w-100 mb-2 text-left nav-btn" color="primary"
                        :variant="activeTab === 'setting' ? 'solid' : 'ghost'"
                        @click="$emit('update:activeTab', 'setting')">
                        <CIcon name="cil-settings" class="mr-2" /> Settings
                    </CButton>
                </div>



                <!-- Sharing Section (New) -->
                <div class="mb-4" v-if="activeTab === 'setting'">
                    <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">Form Sharing</label>
                    <CButton variant="ghost" color="dark" class="w-100 mb-1 text-left type-btn d-flex align-items-center"
                        @click="copyLink">
                        <div class="icon-circle mr-3">
                            <CIcon :name="copied ? 'cil-check' : 'cil-link'" size="sm" />
                        </div>
                        <span class="font-weight-medium">{{ copied ? 'Copied!' : 'Copy link' }}</span>
                    </CButton>  

                    <CButton variant="ghost" color="dark" class="w-100 mb-1 text-left type-btn d-flex align-items-center"
                        @click="sendEmail">
                        <div class="icon-circle mr-3">
                            <CIcon name="cil-envelope-closed" size="sm" />
                        </div>
                        <span class="font-weight-medium">Send Email</span>
                    </CButton>
                </div>

                <!-- Question Types Section -->
                <div class="toolbar-scroll-area flex-grow-1 pr-2" v-if="activeTab === 'question'">
                    <div class="mb-4">
                        <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">
                            Question Types
                        </label>
                        <div class="d-flex flex-column">
                            <CButton v-for="type in questionTypes" :key="type._id"
                                v-if="type.type !== 'title_description' && type.type !== 'image'" variant="ghost"
                                color="dark" class="w-100 mb-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('add-question', type._id)">
                                <div class="icon-circle mr-3">
                                    <CIcon :name="getIconForType(type.type)" size="sm" />
                                </div>
                                <span class="font-weight-medium">{{ formatTypeLabel(type.type) }}</span>
                            </CButton>
                        </div>
                    </div>

                    <div class="pt-3 border-top">
                        <label class="small text-uppercase font-weight-bold text-muted mb-2 d-block">
                            Content Elements
                        </label>
                        <div class="d-flex flex-column">
                            <CButton variant="ghost" color="dark"
                                class="w-100 mb-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('add-question', 'title_description')">
                                <div class="icon-circle mr-3">
                                    <CIcon name="cil-text" size="sm" />
                                </div>
                                <span class="font-weight-medium">Title & Description</span>
                            </CButton>
                            <CButton variant="ghost" color="dark"
                                class="w-100 mb-1 text-left type-btn d-flex align-items-center"
                                @click="$emit('open-image')">
                                <div class="icon-circle mr-3">
                                    <CIcon name="cil-image-1" size="sm" />
                                </div>
                                <span class="font-weight-medium">Image</span>
                            </CButton>
                        </div>
                    </div>
                </div>
            </CCardBody>
        </CCard>
    </CCol>
</template>

<script>
import ButtonBack from '../../components/Button/ButtonBack.vue';
import ButtonPreview from '../../components/Button/ButtonPreview.vue';
import SendForm from '../../components/context/SendForm.vue';

export default {
    name: 'Toolbar',
    components: {
        ButtonBack,
        ButtonPreview,
        SendForm
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
        }
    },
    data() {
        return {
            copied: false
        }
    },
    methods: {
        formatTypeLabel(rawType) {
            if (!rawType) return '';
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
            const url = `${window.location.origin}/forms/${this.form._id}`;

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
            const url = `${window.location.origin}/forms/${this.form._id}`;
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
    height: calc(100vh - 100px);
    border-radius: 20px !important;
    background: #ffffff;
    z-index: 10;
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
    background: #e2e8f0;
    border-radius: 10px;
}

.nav-btn {
    border-radius: 12px !important;
    padding: 10px 16px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease;
}

.type-btn {
    border-radius: 12px !important;
    padding: 8px 12px !important;
    color: #475569 !important;
    transition: all 0.2s ease;
}

.type-btn:hover,
.type-btn:focus,
.type-btn:active {
    background-color: #f1f5f9 !important;
    color: #1e293b !important;
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
    color: #64748b;
    transition: all 0.2s ease;
}

.type-btn:hover .icon-circle {
    background: #ffffff;
    color: #2563eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.font-weight-medium {
    font-weight: 500;
}

.btn-send {
    border-radius: 8px !important;
    background-color: #2563eb !important;
    border: none !important;
    font-size: 0.9rem !important;
    transition: all 0.2s ease;
}

.btn-send:hover {
    background-color: #1d4ed8 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>
