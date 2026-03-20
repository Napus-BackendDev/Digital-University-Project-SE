<template>
    <CButton size="sm" color="light" class="btn-preview"
        style="border-radius: 0.5rem;" @click="goToPreview">
        <CIcon name="cil-magnifying-glass" class="mr-2 text-primary" />
        <span class="text-primary preview-text">Preview</span>
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
    display: flex;
    align-items: center;
    padding: 0.25rem 0.6rem;
    background-color: #ffffff;
    border: 1px solid #e6eef6;
    transition: all 0.12s ease;
}

.btn-preview:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}

.preview-text {
    font-size: 0.95rem;
    font-weight: 600;
}
</style>
