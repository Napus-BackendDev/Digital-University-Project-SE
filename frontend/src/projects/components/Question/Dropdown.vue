<template>
    <select class="form-control mb-3">
        <option disabled selected value="">Select an option</option>
        <option v-for="opt in question.options" :key="opt._id" :value="opt._id">{{ getLang(opt.text) }}</option>
    </select>
</template>

<script>
export default {
    name: 'Dropdown',
    props: {
        question: { type: Object, required: true },
        getLang: { type: Function, required: true }
    }
}
</script>

<style scoped></style>
