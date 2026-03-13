<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-2 font-weight-bold text-dark">Send Form</h5>
            <p class="text-muted mb-4">Share this form with respondents via link or email
            </p>

            <div class="d-flex align-items-center">
                <CButton color="light" class="mr-3 d-flex align-items-center px-3 py-2"
                    style="border-radius: 6px; background-color: #f8f9fa; border: 1px solid #d8dbe0;" @click="copyLink">
                    <CIcon name="cil-share-alt" class="mr-2" />
                    Copy Link
                </CButton>
                <CButton color="dark" class="d-flex align-items-center px-3 py-2" style="border-radius: 6px;"
                    @click="sendEmail">
                    <CIcon name="cil-envelope-closed" class="mr-2" />
                    Send via Email
                </CButton>

                <!-- Copied feedback -->
                <transition name="fade">
                    <span v-if="copied" class="ml-3 text-success font-weight-bold" style="font-size: 0.9rem;">
                        <CIcon name="cil-check" size="sm" class="mr-1" />
                        Copied!
                    </span>
                </transition>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'SendForm',
    props: {
        form: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            copied: false
        }
    },
    methods: {
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
            const lang = (navigator.language || 'en').substring(0, 2).toUpperCase();
            const match = arr.find(t => t.key && t.key.toUpperCase() === lang);
            return match ? match.value : arr[0].value;
        }
    }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>
