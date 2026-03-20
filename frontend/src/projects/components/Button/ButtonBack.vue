<template>
    <CRow>
        <CCol col="12" class="d-flex justify-content-between align-items-center">
            <div class="back" @click="$router.back()">
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
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
    background-color: #ffffff;
    border: 1px solid #e6eef6;
    cursor: pointer;
    transition: all 0.12s ease;
    font-size: 0.95rem;
    font-weight: 600;
}

.back:hover {
    background-color: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
}
</style>