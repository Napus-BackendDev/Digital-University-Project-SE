<template>
    <div>
        <div class="text-muted small mb-1">Question {{ index + 1 }}</div>
        <div class="mb-2 font-weight-bold">{{ getLang(question.title) }} <span v-if="question.required"
                class="text-danger">*</span></div>

        <component 
        :is="componentName" 
        :question="question" 
        :getLang="getLang" 
        :getDropdownOptions="getDropdownOptions"
        :getLinearScaleMax="getLinearScaleMax" />
    </div>
</template>

<script>
import ShortAnswer from './ShortAnswer.vue'
import Paragraph from './Paragraph.vue'
import MultipleChoice from './MultipleChoice.vue'
import Checkboxes from './Checkboxes.vue'
import Dropdown from './Dropdown.vue'
import LinearScale from './LinearScale.vue'
import DateQuestion from './DateQuestion.vue'
import TimeQuestion from './TimeQuestion.vue'
import FileUpload from './FileUpload.vue'

export default {
    name: 'QuestionRenderer',
    components: {
        ShortAnswer,
        Paragraph,
        MultipleChoice,
        Checkboxes,
        Dropdown,
        LinearScale,
        DateQuestion,
        TimeQuestion,
        FileUpload
    },
    props: {
        question: { type: Object, required: true },
        index: { type: Number, required: true },
        getLang: { type: Function, required: true },
        getDropdownOptions: { type: Function, required: true },
        getLinearScaleMax: { type: Function, required: true }
    },
    computed: {
        componentName() {
            const t = this.question.type;
            switch (t) {
                case 'short_answer': return 'ShortAnswer'
                case 'paragraph': return 'Paragraph'
                case 'multiple_choice': return 'MultipleChoice'
                case 'checkboxes': return 'Checkboxes'
                case 'dropdown': return 'Dropdown'
                case 'linear_scale': return 'LinearScale'
                case 'date': return 'DateQuestion'
                case 'time': return 'TimeQuestion'
                case 'file_upload': return 'FileUpload'
                default: return 'ShortAnswer'
            }
        }
    }
}
</script>

<style scoped></style>
