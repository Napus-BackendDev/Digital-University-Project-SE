<template>
    <div>
        <div class="form-check" v-for="option in question.options" :key="option._id">
            <input class="form-check-input" type="radio" :name="`question_${question._id}`" :id="`opt_${option._id}`" />
            <label class="form-check-label" :for="`opt_${option._id}`">{{ getLang(option.text) }}</label>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MultipleChoice',
    props: {
        question: { type: Object, required: true },
        getLang: { type: Function, required: true }
    }
}
</script>

<style scoped></style>
