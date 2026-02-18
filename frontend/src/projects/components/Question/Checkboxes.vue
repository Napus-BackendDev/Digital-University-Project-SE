<template>
    <div>
        <div class="form-check" v-for="option in question.options" :key="option._id">
            <input class="form-check-input" type="checkbox" :id="`chk_${option._id}`" />
            <label class="form-check-label" :for="`chk_${option._id}`">{{ getLang(option.text) }}</label>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Checkboxes',
    props: {
        question: { type: Object, required: true },
        getLang: { type: Function, required: true }
    }
}
</script>

<style scoped></style>
