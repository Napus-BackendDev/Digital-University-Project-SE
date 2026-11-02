<template>
    <div class="wizard-shell">
        <!-- ── Top Stepper Bar Component (Always visible when Wizard is active) ── -->
        <section v-if="mode === 'stepper'" class="wizard-stepper-card mb-4" aria-label="Form Builder Step-by-Step Wizard">
            <div class="wizard-stepper-top d-flex flex-wrap align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <span class="wizard-brand-pill mr-2">
                        <CIcon name="cil-layers" size="sm" class="mr-1" />
                        Form Builder Wizard
                    </span>
                    <h2 class="wizard-stepper-heading mb-0">
                        ผู้ช่วยสอนสร้างแบบสอบถามทีละขั้นตอน (Step {{ currentStep }} / 4)
                    </h2>
                </div>
                <button
                    type="button"
                    class="wizard-skip-btn"
                    @click="$emit('skip')"
                >
                    <CIcon name="cil-x" size="sm" class="mr-1" />
                    <span>ข้ามโหมดสอน (Skip Wizard)</span>
                </button>
            </div>

            <div class="wizard-steps-grid mt-3">
                <button
                    v-for="step in steps"
                    :key="step.num"
                    type="button"
                    class="wizard-step-pill"
                    :class="{
                        'is-current': currentStep === step.num,
                        'is-done': currentStep > step.num || isStepDone(step.num),
                        'is-pending': currentStep < step.num && !isStepDone(step.num)
                    }"
                    @click="$emit('select-step', step.num)"
                >
                    <span class="step-status-indicator">
                        <CIcon v-if="currentStep > step.num || (isStepDone(step.num) && currentStep !== step.num)" name="cil-check-alt" size="sm" />
                        <span v-else class="step-num-dot">{{ step.num }}</span>
                    </span>
                    <span class="step-text-wrap text-left">
                        <strong class="step-main-label">
                            {{ getStepStatusPrefix(step.num) }}Step {{ step.num }}: {{ step.shortTitle }}
                        </strong>
                        <small class="step-sub-label">{{ step.subtitle }}</small>
                    </span>
                </button>
            </div>
        </section>

        <!-- ── Step 4 Readiness Checklist & Share QR Code Spotlight Component ── -->
        <section v-if="mode === 'step4-workspace'" class="mb-4">
            <div class="wizard-spotlight-frame is-green">
                <div class="wizard-spotlight-banner is-green">
                    <CIcon name="cil-check-circle" size="sm" class="mr-2" />
                    <span>SPOTLIGHT #4: กรอบสรุปความพร้อมของฟอร์ม (Readiness Checklist) &amp; หน้าต่างแชร์ลิงก์ / QR Code</span>
                </div>

                <div class="p-3 p-md-4">
                    <CRow>
                        <!-- Left Box: Form Readiness Checklist Component -->
                        <CCol lg="6" class="mb-3 mb-lg-0">
                            <div class="readiness-panel h-100">
                                <div class="readiness-panel-header">
                                    <CIcon name="cil-task" size="sm" class="mr-2" />
                                    <span>Form Readiness Checklist — สรุปความพร้อมของแบบสอบถาม</span>
                                </div>
                                <div class="p-3">
                                    <div
                                        v-for="(item, idx) in readinessItems"
                                        :key="idx"
                                        class="readiness-check-row"
                                        :class="{ 'is-ready': item.ready, 'is-warn': !item.ready }"
                                    >
                                        <div class="d-flex align-items-center justify-content-between">
                                            <div class="d-flex align-items-center">
                                                <span class="readiness-icon mr-2">
                                                    <CIcon :name="item.ready ? 'cil-check-circle' : 'cil-warning'" size="sm" />
                                                </span>
                                                <span class="font-weight-bold">{{ item.label }}</span>
                                            </div>
                                            <span class="readiness-detail-badge">{{ item.detail }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CCol>

                        <!-- Right Box: Share Link & QR Code Generator Component -->
                        <CCol lg="6">
                            <div class="share-qr-panel h-100">
                                <div class="share-qr-panel-header">
                                    <CIcon name="cil-qr-code" size="sm" class="mr-2" />
                                    <span>Share Link &amp; QR Code Generator — ลิงก์และคิวอาร์โค้ดสำหรับผู้ตอบ</span>
                                </div>
                                <div class="p-3 d-flex flex-column flex-sm-row align-items-center">
                                    <div class="qr-canvas-box mr-sm-3 mb-3 mb-sm-0 text-center" ref="qrBox">
                                        <qr-code
                                            v-if="publicFormUrl"
                                            :text="publicFormUrl"
                                            :size="136"
                                            level="H"
                                            render-as="canvas"
                                        />
                                        <div class="qr-caption mt-1">สแกนเข้าหน้า /forms/:id</div>
                                    </div>

                                    <div class="flex-grow-1 w-100">
                                        <label class="url-field-label mb-1">ลิงก์แบบสอบถามสำหรับส่งต่อให้ผู้ตอบ</label>
                                        <input
                                            type="text"
                                            class="form-control url-readonly-input mb-2"
                                            :value="publicFormUrl"
                                            readonly
                                            @focus="$event.target.select()"
                                        />

                                        <button
                                            type="button"
                                            class="wizard-action-btn is-blue-soft w-100 mb-2 justify-content-center"
                                            @click="copyPublicLink"
                                        >
                                            <CIcon :name="copied ? 'cil-check-alt' : 'cil-link'" size="sm" class="mr-2" />
                                            <span>{{ copied ? 'คัดลอกลิงก์เรียบร้อยแล้ว!' : 'คัดลอกลิงก์แบบสอบถาม (Copy Link)' }}</span>
                                        </button>

                                        <button
                                            type="button"
                                            class="wizard-action-btn is-emerald-soft w-100 justify-content-center"
                                            @click="downloadQrCode"
                                        >
                                            <CIcon name="cil-cloud-download" size="sm" class="mr-2" />
                                            <span>ดาวน์โหลดรูป QR Code (PNG)</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CCol>
                    </CRow>
                </div>
            </div>
        </section>

        <!-- ── Floating Coachmark Popover Component (Steps 1 to 4) ── -->
        <section v-if="mode === 'coachmark'" class="wizard-coachmark-wrapper">
            <div class="coachmark-pointer-row">
                <div class="coachmark-pointer-arrow" :class="{ 'is-green': currentStep === 4 }">
                    <span class="pointer-triangle"></span>
                </div>
            </div>

            <div class="wizard-coachmark-card" :class="{ 'is-green': currentStep === 4 }">
                <div class="wizard-coachmark-header d-flex flex-wrap align-items-center justify-content-between">
                    <div class="d-flex align-items-center">
                        <CIcon :name="currentStep === 4 ? 'cil-check-circle' : 'cil-lightbulb'" size="sm" class="mr-2" />
                        <h3 class="coachmark-title mb-0">{{ activeCoachmark.header }}</h3>
                    </div>
                    <span class="coachmark-gate-pill" :class="{ 'is-valid': isCurrentStepValid }">
                        <CIcon :name="isCurrentStepValid ? 'cil-check-alt' : 'cil-info'" size="sm" class="mr-1" />
                        {{ activeCoachmark.gateText }}
                    </span>
                </div>

                <div class="wizard-coachmark-body">
                    <p class="coachmark-instruction mb-2">{{ activeCoachmark.instruction }}</p>
                    <p class="coachmark-subhint mb-3">{{ activeCoachmark.subhint }}</p>

                    <!-- Step-Specific Action Buttons Bar -->
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top-subtle">
                        <div class="d-flex flex-wrap align-items-center gap-2">
                            <!-- Back Button (Steps 2, 3, 4) -->
                            <button
                                v-if="currentStep > 1"
                                type="button"
                                class="wizard-action-btn is-neutral"
                                @click="$emit('prev-step')"
                            >
                                <CIcon name="cil-arrow-left" size="sm" class="mr-1" />
                                <span>ย้อนกลับ Step {{ currentStep - 1 }}</span>
                            </button>

                            <!-- Step 1 Quick Fill Sample Header Button -->
                            <button
                                v-if="currentStep === 1"
                                type="button"
                                class="wizard-action-btn is-purple-outline"
                                @click="$emit('fill-sample-header')"
                            >
                                <CIcon name="cil-bolt" size="sm" class="mr-1" />
                                <span>กรอกชื่อและคำชี้แจงตัวอย่างให้อัตโนมัติ (TH/EN)</span>
                            </button>

                            <!-- Step 2 Quick Add Sample Question Button -->
                            <button
                                v-if="currentStep === 2"
                                type="button"
                                class="wizard-action-btn is-purple-outline"
                                @click="$emit('add-sample-question')"
                            >
                                <CIcon name="cil-plus" size="sm" class="mr-1" />
                                <span>เพิ่มข้อคำถามตัวอย่างให้อัตโนมัติ</span>
                            </button>

                            <!-- Step 4 Open Live Preview Button -->
                            <button
                                v-if="currentStep === 4"
                                type="button"
                                class="wizard-action-btn is-blue-outline"
                                @click="$emit('open-preview')"
                            >
                                <CIcon name="cil-external-link" size="sm" class="mr-1" />
                                <span>เปิดหน้าทดลองทำจริง (/forms/:id)</span>
                            </button>

                            <!-- Skip Button (Steps 1 & 3) -->
                            <button
                                v-if="currentStep === 1 || currentStep === 3"
                                type="button"
                                class="wizard-action-btn is-neutral"
                                @click="$emit('skip')"
                            >
                                <CIcon name="cil-x" size="sm" class="mr-1" />
                                <span>ข้ามโหมดสอน (Skip)</span>
                            </button>
                        </div>

                        <div>
                            <!-- Next Step Button (Steps 1, 2, 3) -->
                            <button
                                v-if="currentStep < 4"
                                type="button"
                                class="wizard-action-btn is-primary-next"
                                @click="$emit('next-step')"
                            >
                                <span>{{ activeCoachmark.nextLabel }}</span>
                                <CIcon name="cil-arrow-right" size="sm" class="ml-2" />
                            </button>

                            <!-- Finish Button (Step 4) -->
                            <button
                                v-else
                                type="button"
                                class="wizard-action-btn is-success-finish"
                                @click="$emit('finish')"
                            >
                                <CIcon name="cil-check-circle" size="sm" class="mr-2" />
                                <span>เสร็จสิ้นการสร้างฟอร์มแรก (Finish &amp; Publish)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'FormBuilderWizard',
    props: {
        mode: {
            type: String,
            default: 'stepper' // 'stepper' | 'coachmark' | 'step4-workspace'
        },
        currentStep: {
            type: Number,
            default: 1
        },
        form: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            copied: false,
            steps: [
                {
                    num: 1,
                    shortTitle: 'ตั้งชื่อฟอร์ม & ภาษา (TH/EN)',
                    subtitle: 'กรอกหัวเรื่อง คำชี้แจง และเพิ่มภาษาที่ 2'
                },
                {
                    num: 2,
                    shortTitle: 'เพิ่มข้อคำถาม 8 ชนิด & Skip Logic',
                    subtitle: 'เลือกชนิดคำถาม ตั้งตัวเลือก และบังคับตอบ'
                },
                {
                    num: 3,
                    shortTitle: 'ตั้งค่าเวลาเปิด-ปิด & สิทธิ์ผู้ร่วมงาน',
                    subtitle: 'กำหนดวันรับคำตอบ หน่วยงาน และ Collaborator'
                },
                {
                    num: 4,
                    shortTitle: 'พรีวิว ตรวจสอบ & แชร์ QR Code',
                    subtitle: 'ตรวจความพร้อม ทดลองทำ และคัดลอกลิงก์'
                }
            ]
        };
    },
    computed: {
        hasValidTitle() {
            if (!this.form || !Array.isArray(this.form.title) || this.form.title.length === 0) return false;
            return this.form.title.some(t => {
                const v = String(t?.value || '').trim();
                return v.length > 0 && v.toLowerCase() !== 'untitled form';
            });
        },
        formDisplayTitle() {
            if (!this.form || !Array.isArray(this.form.title) || !this.form.title.length) return 'Untitled Form';
            const valid = this.form.title.find(t => t && t.value && String(t.value).trim());
            return valid ? valid.value : 'Untitled Form';
        },
        questionCount() {
            if (!this.form || !Array.isArray(this.form.questions)) return 0;
            return this.form.questions.length;
        },
        hasScheduleOrSettings() {
            if (!this.form) return false;
            const hasSched = !!(this.form.schedule && (this.form.schedule.startAt || this.form.schedule.endAt));
            const hasOrg = Array.isArray(this.form.organization) && this.form.organization.length > 0;
            const hasCollab = Array.isArray(this.form.collaborator) && this.form.collaborator.length > 0;
            return hasSched || hasOrg || hasCollab || true;
        },
        isCurrentStepValid() {
            if (this.currentStep === 1) return this.hasValidTitle;
            if (this.currentStep === 2) return this.questionCount > 0;
            return true;
        },
        publicFormUrl() {
            if (!this.form || !this.form._id) return `${window.location.origin}/#/forms`;
            return `${window.location.origin}/#/forms/${this.form._id}?mode=public`;
        },
        readinessItems() {
            const langCount = Array.isArray(this.form?.title) ? this.form.title.length : 1;
            const hasStart = this.form?.schedule?.startAt ? 'ตั้งเวลาเปิดแล้ว' : 'เปิดรับทันที / Draft';
            return [
                {
                    label: '1. ตั้งชื่อแบบสอบถามและคำชี้แจงครบถ้วน (TH/EN)',
                    ready: this.hasValidTitle,
                    detail: this.hasValidTitle ? `${this.formDisplayTitle} (${langCount} ภาษา)` : 'ยังใช้ชื่อตั้งต้น (Untitled Form)'
                },
                {
                    label: '2. สร้างข้อคำถามและเงื่อนไขการตอบเรียบร้อย',
                    ready: this.questionCount > 0,
                    detail: this.questionCount > 0 ? `มีข้อคำถาม ${this.questionCount} ข้อ` : 'ยังไม่มีข้อคำถาม (คลิกเพิ่มใน Step 2)'
                },
                {
                    label: '3. กำหนดเวลาเปิด-ปิดและสิทธิ์การเข้าถึงแล้ว',
                    ready: true,
                    detail: hasStart
                },
                {
                    label: '4. สถานะฟอร์ม: พร้อมเปิดรับคำตอบและแชร์ลิงก์จริงทันที!',
                    ready: this.hasValidTitle && this.questionCount > 0,
                    detail: (this.hasValidTitle && this.questionCount > 0) ? 'พร้อมใช้งาน 100%' : 'แนะนำให้เติมข้อมูลให้ครบ'
                }
            ];
        },
        activeCoachmark() {
            if (this.currentStep === 1) {
                return {
                    header: '[Component: Floating Coachmark Popover #1 — ชี้บอกวิธีทำ Step 1: ตั้งชื่อแบบสอบถามและภาษา]',
                    gateText: this.hasValidTitle ? 'ผ่านเกณฑ์: ตั้งชื่อแบบสอบถามแล้ว' : 'แนะนำ: กรอกชื่อแบบสอบถามอย่างน้อย 1 ภาษา',
                    instruction: 'คำแนะนำ: "เริ่มต้นด้วยการตั้งชื่อแบบสอบถามและคำชี้แจงในกรอบ Spotlight #1 ด้านบน หากต้องการทำแบบสอบถาม 2 ภาษา (ไทย/อังกฤษ) ให้กดปุ่ม + เพิ่มภาษาที่ 2 ได้ทันที"',
                    subhint: 'เมื่อพิมพ์เสร็จ ระบบจะเรียก triggerAutoSave() ยิง PUT /api/v1/form บันทึกให้อัตโนมัติ หรือกดปุ่ม "กรอกชื่อและคำชี้แจงตัวอย่าง" เพื่อทดลองอย่างรวดเร็ว',
                    nextLabel: 'ถัดไป: เพิ่มข้อคำถาม (Step 2) (บันทึก Auto-Save)'
                };
            }
            if (this.currentStep === 2) {
                return {
                    header: '[Component: Floating Coachmark Popover #2 — ชี้สอนการเลือกชนิดคำถาม 8 แบบ & ตั้งค่าข้อคำถาม]',
                    gateText: this.questionCount > 0 ? `ผ่านเกณฑ์: มีคำถามแล้ว ${this.questionCount} ข้อ` : 'ยังไม่มีข้อคำถามในฟอร์ม',
                    instruction: 'คำแนะนำ: "คลิกปุ่มชนิดคำถามทั้ง 8 แบบที่แผงด้านขวา (Spotlight #2B) เพื่อเพิ่มข้อคำถามลงในฟอร์ม ตั้งค่าตัวเลือกคำตอบ ข้ามข้อ (Skip Logic) และเปิดสวิตช์ Required หากบังคับตอบ"',
                    subhint: 'เงื่อนไขผ่านขั้น: มีข้อคำถามอย่างน้อย 1 ข้อในฟอร์ม (บันทึกอัตโนมัติผ่าน POST / PUT /api/v1/question)',
                    nextLabel: 'ถัดไป: ตั้งค่าฟอร์ม (Step 3)'
                };
            }
            if (this.currentStep === 3) {
                return {
                    header: '[Component: Floating Coachmark Popover #3 — สอนการตั้งเวลาเปิด-ปิด สิทธิ์ผู้ตอบ และผู้ร่วมงาน]',
                    gateText: 'บันทึกการตั้งค่าอัตโนมัติ (Auto-Save)',
                    instruction: 'คำแนะนำ: "ระบบสลับมาที่แท็บ Settings ให้อัตโนมัติ คุณสามารถกำหนดวัน-เวลาเปิดรับคำตอบ เลือกสำนักวิชา/หน่วยงาน ตั้งค่าจำกัดการตอบ 1 ครั้ง และเชิญเพื่อนร่วมงาน (Editor / Viewer) ได้ใน 4 การ์ดด้านบน"',
                    subhint: 'การบันทึกข้อมูล: ทุกการเปลี่ยนแปลงจะถูกส่งไปยัง PUT /api/v1/form ทันทีโดยไม่ต้องกลัวข้อมูลหาย',
                    nextLabel: 'ถัดไป: ตรวจสอบ & แชร์ฟอร์ม (Step 4)'
                };
            }
            return {
                header: '[Component: Floating Coachmark Popover #4 — ขั้นตอนสุดท้าย: ทดสอบ Preview และแชร์ QR Code]',
                gateText: 'พร้อมเผยแพร่แบบสอบถามจริง',
                instruction: 'คำแนะนำ: "แบบสอบถามของคุณพร้อมใช้งานแล้ว! ตรวจสอบสรุปความพร้อมด้านบน กดปุ่ม Preview มุมขวาบนเพื่อทดลองทำจริง หรือคัดลอกลิงก์และดาวน์โหลด QR Code ไปประชาสัมพันธ์ได้ทันที"',
                subhint: 'เมื่อกดปุ่มเสร็จสิ้น: ระบบจะบันทึกสถานะผ่านการสอนลงเครื่อง (localStorage) และคุณสามารถกดปุ่ม "โหมดสอนสร้างฟอร์ม" ด้านบนเพื่อเรียกดูซ้ำได้ตลอดเวลา'
            };
        }
    },
    methods: {
        isStepDone(stepNum) {
            if (stepNum === 1) return this.hasValidTitle;
            if (stepNum === 2) return this.questionCount > 0;
            if (stepNum === 3) return this.currentStep > 3;
            return false;
        },
        getStepStatusPrefix(stepNum) {
            if (this.currentStep === stepNum) return 'กำลังทำ: ';
            if (this.currentStep > stepNum || this.isStepDone(stepNum)) return 'ผ่านแล้ว: ';
            return 'รอทำ: ';
        },
        copyPublicLink() {
            const url = this.publicFormUrl;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    this.copied = true;
                    setTimeout(() => { this.copied = false; }, 2200);
                });
            } else {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
                this.copied = true;
                setTimeout(() => { this.copied = false; }, 2200);
            }
        },
        downloadQrCode() {
            const wrapper = this.$refs.qrBox;
            if (!wrapper) return;
            const canvas = wrapper.querySelector('canvas');
            if (!canvas) return;
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `mfu-questionnaire-${this.form?._id || 'qr'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};
</script>

<style scoped>
/* ── Top Stepper Bar Card ── */
.wizard-stepper-card {
    background-color: #f5f3ff;
    border: 2px solid #7c3aed;
    border-radius: 16px;
    padding: 1rem 1.25rem;
}

.wizard-brand-pill {
    display: inline-flex;
    align-items: center;
    background-color: #7c3aed;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    letter-spacing: -0.01em;
}

.wizard-stepper-heading {
    font-size: 1.05rem;
    font-weight: 700;
    color: #2e1065;
    letter-spacing: -0.02em;
}

.wizard-skip-btn {
    display: inline-flex;
    align-items: center;
    background-color: #fff1f2;
    border: 1.5px solid #f43f5e;
    color: #be123c;
    font-size: 0.84rem;
    font-weight: 700;
    padding: 0.42rem 0.9rem;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color 0.18s ease, transform 0.15s ease;
}

.wizard-skip-btn:hover {
    background-color: #ffe4e6;
    transform: translateY(-1px);
}

/* ── 4 Step Pills Grid ── */
.wizard-steps-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
}

@media (max-width: 1199.98px) {
    .wizard-steps-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 575.98px) {
    .wizard-steps-grid {
        grid-template-columns: 1fr;
    }
}

.wizard-step-pill {
    display: flex;
    align-items: center;
    padding: 0.65rem 0.85rem;
    border-radius: 12px;
    border: 1.5px solid #cbd5e1;
    background-color: #ffffff;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    width: 100%;
}

.wizard-step-pill:hover {
    border-color: #7c3aed;
    transform: translateY(-1px);
}

.wizard-step-pill.is-current {
    background-color: #7c3aed;
    border-color: #4c1d95;
    color: #ffffff;
    box-shadow: 0 6px 16px -4px rgba(124, 58, 237, 0.38);
}

.wizard-step-pill.is-done {
    background-color: #dcfce7;
    border-color: #16a34a;
    color: #14532d;
}

.step-status-indicator {
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.65rem;
    font-weight: 700;
    font-size: 0.85rem;
    background-color: rgba(15, 23, 42, 0.08);
}

.wizard-step-pill.is-current .step-status-indicator {
    background-color: rgba(255, 255, 255, 0.22);
    color: #ffffff;
}

.wizard-step-pill.is-done .step-status-indicator {
    background-color: #16a34a;
    color: #ffffff;
}

.step-text-wrap {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.step-main-label {
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.step-sub-label {
    font-size: 0.74rem;
    line-height: 1.25;
    margin-top: 2px;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.wizard-step-pill.is-current .step-sub-label {
    color: #ede9fe;
}

.wizard-step-pill.is-done .step-sub-label {
    color: #166534;
}

/* ── Spotlight Frame for Step 4 Workspace ── */
.wizard-spotlight-frame {
    border: 2.5px dashed #f59e0b;
    background-color: #fffbeb;
    border-radius: 16px;
    overflow: hidden;
}

.wizard-spotlight-frame.is-green {
    border-color: #16a34a;
    background-color: #f0fdf4;
}

.wizard-spotlight-banner {
    background-color: #fef3c7;
    border-bottom: 1px solid #f59e0b;
    color: #92400e;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
}

.wizard-spotlight-banner.is-green {
    background-color: #dcfce7;
    border-bottom: 1px solid #16a34a;
    color: #14532d;
}

.readiness-panel {
    background-color: #ffffff;
    border: 1.5px solid #16a34a;
    border-radius: 12px;
    overflow: hidden;
}

.readiness-panel-header {
    background-color: #dcfce7;
    border-bottom: 1px solid #16a34a;
    color: #14532d;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
}

.readiness-check-row {
    padding: 0.62rem 0.85rem;
    border-radius: 10px;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    border: 1px solid #bbf7d0;
    background-color: #f0fdf4;
    color: #14532d;
}

.readiness-check-row:last-child {
    margin-bottom: 0;
}

.readiness-check-row.is-warn {
    border-color: #fde68a;
    background-color: #fffbeb;
    color: #78350f;
}

.readiness-detail-badge {
    font-size: 0.76rem;
    font-weight: 600;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    background-color: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.12);
    color: #0f172a;
}

.share-qr-panel {
    background-color: #ffffff;
    border: 1.5px solid #0284c7;
    border-radius: 12px;
    overflow: hidden;
}

.share-qr-panel-header {
    background-color: #e0f2fe;
    border-bottom: 1px solid #0284c7;
    color: #075985;
    font-weight: 700;
    font-size: 0.88rem;
    padding: 0.6rem 1rem;
    display: flex;
    align-items: center;
}

.qr-canvas-box {
    background-color: #f8fafc;
    border: 2px solid #0f172a;
    border-radius: 12px;
    padding: 0.65rem;
    min-width: 162px;
}

.qr-caption {
    font-size: 0.74rem;
    font-weight: 700;
    color: #0f172a;
}

.url-field-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #334155;
    display: block;
}

.url-readonly-input {
    background-color: #f8fafc !important;
    border: 1px solid #94a3b8 !important;
    border-radius: 8px !important;
    color: #0f172a !important;
    font-size: 0.83rem !important;
    font-weight: 600 !important;
}

/* ── Floating Coachmark Popover Card ── */
.wizard-coachmark-wrapper {
    margin-top: 0.25rem;
    margin-bottom: 1.5rem;
}

.coachmark-pointer-row {
    padding-left: 3.5rem;
    height: 14px;
    position: relative;
}

.coachmark-pointer-arrow {
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 14px solid #2563eb;
}

.coachmark-pointer-arrow.is-green {
    border-bottom-color: #16a34a;
}

.wizard-coachmark-card {
    background-color: #eff6ff;
    border: 2px solid #2563eb;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 24px -6px rgba(37, 99, 235, 0.16);
}

.wizard-coachmark-card.is-green {
    background-color: #f0fdf4;
    border-color: #16a34a;
    box-shadow: 0 10px 24px -6px rgba(22, 163, 74, 0.16);
}

.wizard-coachmark-header {
    background-color: #dbeafe;
    border-bottom: 1px solid #93c5fd;
    padding: 0.65rem 1.15rem;
    color: #1e3a8a;
}

.wizard-coachmark-card.is-green .wizard-coachmark-header {
    background-color: #dcfce7;
    border-bottom-color: #86efac;
    color: #14532d;
}

.coachmark-title {
    font-size: 0.94rem;
    font-weight: 700;
    color: inherit;
}

.coachmark-gate-pill {
    display: inline-flex;
    align-items: center;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.24rem 0.7rem;
    border-radius: 999px;
    background-color: #fef3c7;
    border: 1px solid #f59e0b;
    color: #92400e;
}

.coachmark-gate-pill.is-valid {
    background-color: #dcfce7;
    border-color: #16a34a;
    color: #14532d;
}

.wizard-coachmark-body {
    padding: 1rem 1.15rem;
}

.coachmark-instruction {
    font-size: 0.92rem;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.5;
}

.coachmark-subhint {
    font-size: 0.83rem;
    color: #334155;
    line-height: 1.45;
}

.border-top-subtle {
    border-top: 1px solid rgba(15, 23, 42, 0.1);
}

/* ── Action Buttons matching PAGE 10 HEX Palette ── */
.wizard-action-btn {
    display: inline-flex;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.18s ease;
}

.wizard-action-btn:hover {
    transform: translateY(-1px);
}

.wizard-action-btn.is-neutral {
    background-color: #ffffff;
    border: 1.5px solid #64748b;
    color: #334155;
}

.wizard-action-btn.is-neutral:hover {
    background-color: #f8fafc;
}

.wizard-action-btn.is-purple-outline {
    background-color: #ffffff;
    border: 1.5px solid #7c3aed;
    color: #5b21b6;
}

.wizard-action-btn.is-purple-outline:hover {
    background-color: #f5f3ff;
}

.wizard-action-btn.is-blue-outline {
    background-color: #ffffff;
    border: 1.5px solid #2563eb;
    color: #1d4ed8;
}

.wizard-action-btn.is-blue-outline:hover {
    background-color: #eff6ff;
}

.wizard-action-btn.is-blue-soft {
    background-color: #eff6ff;
    border: 1.5px solid #2563eb;
    color: #1d4ed8;
}

.wizard-action-btn.is-emerald-soft {
    background-color: #ecfdf5;
    border: 1.5px solid #059669;
    color: #047857;
}

.wizard-action-btn.is-primary-next {
    background-color: #2563eb;
    border: 2px solid #1d4ed8;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.wizard-action-btn.is-primary-next:hover {
    background-color: #1d4ed8;
}

.wizard-action-btn.is-success-finish {
    background-color: #16a34a;
    border: 2px solid #15803d;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.28);
}

.wizard-action-btn.is-success-finish:hover {
    background-color: #15803d;
}
</style>
