<template>
    <CCard class="mb-4 border-0 shadow-sm publish-card">
        <CCardBody class="p-4">
            <h5 class="font-weight-bold mb-2">{{ $t('flow.publish.title') }}</h5>
            <p class="text-muted small mb-4">{{ $t('flow.publish.description') }}</p>
            <div class="publish-options">
                <button type="button" class="publish-option" :class="{ active: mode === 'internal' }" @click="setMode('internal')">
                    <CIcon name="cil-building" size="xl" />
                    <span><strong>{{ $t('flow.publish.internal') }}</strong><small>{{ $t('flow.publish.internalDesc') }}</small></span>
                    <CIcon v-if="mode === 'internal'" name="cil-check-circle" class="ml-auto text-success" />
                </button>
                <button type="button" class="publish-option" :class="{ active: mode === 'public' }" @click="setMode('public')">
                    <CIcon name="cil-globe-alt" size="xl" />
                    <span><strong>{{ $t('flow.publish.public') }}</strong><small>{{ $t('flow.publish.publicDesc') }}</small></span>
                    <CIcon v-if="mode === 'public'" name="cil-check-circle" class="ml-auto text-success" />
                </button>
            </div>
            <div class="share-link-box mt-4">
                <code>{{ formUrl }}</code>
                <CButton color="secondary" variant="outline" class="ml-3 flex-shrink-0" @click="showQr = true">
                    <CIcon name="cil-qr-code" class="mr-2" />{{ $t('flow.publish.generateQr') }}
                </CButton>
                <CButton color="primary" class="ml-3 flex-shrink-0" @click="copyLink">
                    {{ copied ? $t('flow.publish.copied') : $t('flow.publish.copy') }}
                </CButton>
            </div>
            <div v-if="showQr" class="qr-share-card mt-4">
                <div ref="qrContainer" class="qr-canvas-wrap">
                    <qr-code :text="formUrl" :size="220" level="H" render-as="canvas" />
                </div>
                <div class="qr-share-details">
                    <h6 class="font-weight-bold mb-2">{{ $t('flow.publish.qrTitle') }}</h6>
                    <p class="text-muted small mb-3">{{ $t('flow.publish.qrDescription') }}</p>
                    <CButton color="primary" variant="outline" @click="downloadQr">
                        <CIcon name="cil-cloud-download" class="mr-2" />{{ $t('flow.publish.downloadQr') }}
                    </CButton>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'PublishSettings',
    props: { form: { type: Object, required: true } },
    data() { return { copied: false, showQr: false }; },
    computed: {
        mode() { return this.form.settings && this.form.settings.allowPublicResponses ? 'public' : 'internal'; },
        formUrl() {
            if (!this.form._id) return '';
            return this.mode === 'public'
                ? `${window.location.origin}/public/forms/${this.form._id}`
                : `${window.location.origin}/forms/${this.form._id}`;
        }
    },
    methods: {
        setMode(mode) {
            if (!this.form.settings) this.$set(this.form, 'settings', {});
            this.$set(this.form.settings, 'allowPublicResponses', mode === 'public');
            this.$emit('auto-save');
        },
        async copyLink() {
            if (!this.formUrl) return;
            await navigator.clipboard.writeText(this.formUrl);
            this.copied = true;
            setTimeout(() => { this.copied = false; }, 2000);
        },
        downloadQr() {
            const canvas = this.$refs.qrContainer && this.$refs.qrContainer.querySelector('canvas');
            if (!canvas) return;
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `form-${this.form._id || 'qr'}.png`;
            link.click();
        }
    }
};
</script>

<style scoped>
.publish-card { border-radius: 20px; }
.publish-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.publish-option { min-height: 104px; padding: 18px; border: 2px solid #e2e8f0; border-radius: 14px; background: #fff; color: #475569; display: flex; align-items: center; gap: 16px; text-align: left; }
.publish-option.active { border-color: #22c55e; background: #f0fdf4; }
.publish-option span { display: flex; flex-direction: column; gap: 5px; }
.publish-option small { color: #64748b; }
.share-link-box { padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; }
.share-link-box code { flex: 1; overflow-wrap: anywhere; color: #334155; }
.qr-share-card { display: flex; align-items: center; gap: 28px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; }
.qr-canvas-wrap { flex-shrink: 0; padding: 14px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; line-height: 0; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08); }
.qr-share-details { max-width: 520px; }
@media (max-width: 768px) {
    .publish-options { grid-template-columns: 1fr; }
    .share-link-box { align-items: stretch; flex-direction: column; gap: 10px; }
    .share-link-box .btn { margin-left: 0 !important; }
    .qr-share-card { align-items: center; flex-direction: column; text-align: center; }
}
</style>
