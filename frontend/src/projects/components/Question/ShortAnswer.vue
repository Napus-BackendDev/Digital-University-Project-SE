<template>
    <input type="text" class="form-control mb-3" :placeholder="placeholder" />
</template>

<script>
export default {
    name: 'ShortAnswer',
    props: {
        question: { type: Object, required: true },
        getLang: { type: Function, required: true }
    },
    computed: {
        placeholder() {
            return 'Your answer';
        }
    }
}
</script>

<style scoped></style>
