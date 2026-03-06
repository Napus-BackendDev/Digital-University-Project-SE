<template>

    <CRow class="mb-4">
        <CCol col="12" class="d-flex justify-content-between align-items-center">
            <div class="back" style="cursor: pointer" @click="$router.back()">
                <CIcon name="cil-chevron-left" />
                <span class="px-1">Back</span>
            </div>
            <div class="d-flex align-items-center">
                <ButtonPreview />
            </div>
        </CCol>
    </CRow>
</template>

<script>
import ButtonPreview from '@/projects/components/Button/ButtonPreview.vue'

export default {
    name: "ButtonBack",
    components: {
        ButtonPreview
    },
    data() {
        return {
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
        },
    },
    computed: {
    }
}
</script>

<style>
.back {
    display: flex;
    align-items: center;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.back:hover {
    background: rgba(0, 0, 0, 0.04);
}
</style>