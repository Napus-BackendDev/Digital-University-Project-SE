<template>
    <CRow>
        <CCol col="12" class="d-flex justify-content-between align-items-center">
            <div class="back" style="cursor: pointer" @click="$router.back()">
                <CIcon name="cil-chevron-left" class="text-danger" />
                <span class="px-1 text-danger">Back</span>
            </div>
        </CCol>
    </CRow>
</template>

<script>
export default {
    name: "ButtonBack",
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
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s ease;
}

.back:hover {
    background: rgba(0, 0, 0, 0.04);
}
</style>