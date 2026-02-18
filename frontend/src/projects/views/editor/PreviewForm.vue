<template>
    <div class="container py-4">
        <div class="mb-3">
            <ButtonBack :path="backToEditPath" label="Back to Edit" />
        </div>

        <CCard v-if="questions.length > 0">
            <CCardBody>
                <h1 class="h4 mb-2">{{ formTitle }}</h1>
                <p class="text-muted mb-4">{{ formDescription }}</p>

                <div v-for="(question, index) in sortedQuestions" :key="question._id" class="mb-4 pb-3">
                    <QuestionRenderer 
                    :question="question" 
                    :index="index" 
                    :getLang="getLang"
                    :getDropdownOptions="getDropdownOptions" :getLinearScaleMax="getLinearScaleMax" 
                    />
                    <hr v-if="index < sortedQuestions.length - 1" 
                    />
                </div>

                <div class="text-muted small mb-3"><span class="text-danger">*</span> Required field</div>

                <div class="text-right">
                    <CButton color="secondary">Submit (Preview Mode)</CButton>
                </div>
            </CCardBody>
        </CCard>

        <CCard v-else class="mt-3">
            <CCardBody class="text-center text-muted">
                <p>No questions found in this form.</p>
                <p>Please add some questions in the editor first.</p>
            </CCardBody>
        </CCard>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ButtonBack from '../../components/Button/ButtonBack.vue'
import QuestionRenderer from '../../components/Question/QuestionRenderer.vue'
import { CCard, CCardBody, CButton } from '@coreui/vue'

export default {
    name: "PreviewForm",
    components: {
        ButtonBack,
        QuestionRenderer,
        CCard,
        CCardBody,
        CButton
    },
    props: {
        formId: { type: String, default: '' }
    },
    data() {
        return {
            formTitle: '',
            formDescription: ''
        }
    },
    async created() {
        await this.loadFormData();
        await this.loadQuestions();
    },
    methods: {

        async loadFormData() {
            const formId = this.$route.params.id;
            const applyForm = (form) => {
                if (!form) return false;
                this.formTitle = this.getLang(form.title) || 'Untitled Form';
                this.formDescription = this.getLang(form.description) || 'No description available';
                return true;
            };

            try {
                // 1) Prefer a cached match to avoid unnecessary backend calls
                const cached = this.$store.getters['Forms/forms'];
                if (formId && cached && Array.isArray(cached) && cached.length > 0) {
                    const matched = cached.find(f => String(f._id) === String(formId));
                    if (matched && applyForm(matched)) return;
                }

                // 2) If we have a valid id, ask backend for that specific form
                if (formId) {
                    const formData = await this.$store.dispatch('Forms/getFormById', { _id: formId });
                    if (applyForm(formData)) return;
                }

                // 3) If no id or still nothing, use first cached item if present
                if (!formId && cached && Array.isArray(cached) && cached.length > 0) {
                    if (applyForm(cached[0])) return;
                }

                // 4) Last resort: fetch list from server and pick match or first
                await this.$store.dispatch('Forms/getForms');
                const loaded = this.$store.getters['Forms/forms'];
                if (loaded && Array.isArray(loaded) && loaded.length > 0) {
                    const pick = formId ? loaded.find(f => String(f._id) === String(formId)) : loaded[0];
                    if (pick && applyForm(pick)) return;
                }

                // nothing found
                this.formTitle = 'No form data available';
            } catch (error) {
                console.error('Error fetching form:', error);
                this.formTitle = 'Error loading form';
            }
        },

        async loadQuestions() {
            const formId = this.$route.params.id;
            if (!formId) {
                // if no id, try to use first cached form's id
                const cached = this.$store.getters['Forms/forms'];
                if (cached && Array.isArray(cached) && cached.length > 0 && cached[0]._id) {
                    try {
                        await this.$store.dispatch('Questions/getQuestions', { form: cached[0]._id });
                    } catch (err) {
                        console.error('Error fetching questions with fallback id:', err);
                    }
                }
                return;
            }
            try {
                await this.$store.dispatch('Questions/getQuestions', { form: formId });
            } catch (error) {
                console.error('Error fetching questions:', error);
            }
        },

        // reload when parent passes a new formId prop


        getLang(data) {
            if (!data) return '';
            if (typeof data === 'string') return data;
            if (!Array.isArray(data)) return '';

            const content = data.find(item => item.key === 'en') || data[0];
            return content ? content.value : '';
        },
        getDropdownOptions(question) {
            if (!question.options || !Array.isArray(question.options)) return [];
            return question.options.map(opt => ({
                value: opt._id,
                label: this.getLang(opt.text)
            }));
        },
        getLinearScaleMax(question) {
            if (question.config && question.config.max) {
                return question.config.max;
            }
            return 5; // default
        }
    },
    watch: {
        formId(newVal) {
            if (newVal && /^[0-9a-fA-F]{24}$/.test(newVal)) {
                this.loadFormData();
                this.loadQuestions();
            }
        }
    },
    computed: {
        ...mapGetters('Questions', ['questions']),
        sortedQuestions() {
            if (!this.questions || !Array.isArray(this.questions)) return [];

            return [...this.questions].sort((a, b) => {
                const orderA = a.order || 0;
                const orderB = b.order || 0;
                return orderA - orderB;
            });
        }
        ,
        backToEditPath() {
            const id = this.formId || this.$route.params.id || this.$route.params._id || (this.$store.getters['Forms/forms'] && this.$store.getters['Forms/forms'][0] && this.$store.getters['Forms/forms'][0]._id) || '';
            return `/editor/create-form/${id}`;
        }
    }
}
</script>