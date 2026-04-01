<template>
    <CButton color="light" class="d-flex align-items-center px-4 py-2 font-weight-bold btn-preview"
        style="border-radius: 0.5rem;" @click="goToPreview">
        <CIcon name="cil-media-play" class="mr-2 text-dark" />
        <span class="text-dark">Preview</span>
    </CButton>
</template>

<script>
export default {
    name: 'ButtonPreview',
    methods: {
        goToPreview() {
            const formId = this.$route.params._id;
            if (!formId) return;
            this.$router.push({ name: 'Preview', params: { id: formId } });
        }
    }
}
</script>

<style scoped>
.btn-preview {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: all 0.2s ease;
}

.btn-preview:hover {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
}
</style>
