<template>
    <textarea class="form-control mb-3" rows="4" :placeholder="placeholder"></textarea>
</template>

<script>
export default {
    name: 'Paragraph',
    props: {
        question: { type: Object, required: true },
        getLang: { type: Function, required: true }
    },
    computed: {
        placeholder() { return 'Your answer'; }
    }
}
</script>

<style scoped></style>
