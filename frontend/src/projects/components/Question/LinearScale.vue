<template>
    <div class="d-flex align-items-center mb-3">
        <div class="mr-2">Rating:</div>
        <div>
            <span v-for="i in max" :key="i" class="mx-1">☆</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LinearScale',
    props: {
        question: { type: Object, required: true },
        getLinearScaleMax: { type: Function, required: true }
    },
    computed: {
        max() {
            return this.getLinearScaleMax(this.question) || 5;
        }
    }
}
</script>

<style scoped></style>
