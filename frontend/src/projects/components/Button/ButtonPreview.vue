<template>
    <div class="preview-bar-wrapper">
        <div class="preview-pill" @click="goToPreview">
            <CIcon name="cil-magnifying-glass" size="sm" class="mr-1" />
            <span>{{ $t('button.preview') }}</span>
        </div>
    </div>
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
.preview-pill {
    width: 100%;
    min-height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1.25rem;
    border-radius: 12px;
    background-color: #8B1A1A;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(139, 26, 26, 0.2), 0 2px 4px -1px rgba(139, 26, 26, 0.1);
    border: none;
}

.preview-pill:hover {
    background-color: #6e1515;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -2px rgba(139, 26, 26, 0.3);
}

.preview-pill:active {
    transform: translateY(0);
    background-color: #6e1515;
}

.preview-pill span {
    line-height: 1;
}
</style>
