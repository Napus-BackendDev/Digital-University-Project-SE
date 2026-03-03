<template>
    <div class="nested-question-container mt-3 pl-4 border-left ml-3 mb-3">
        <CCard class="bg-light border mb-0">
            <CCardBody class="p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge badge-warning text-white">Question {{ level }}</span>
                    <CButton color="danger" variant="ghost" size="sm" class="text-danger" @click="$emit('remove')">
                        <CIcon name="cil-trash" class="mr-1" /> Remove follow-up
                    </CButton>
                </div>

                <!-- Nested Question Title -->
                <CInput class="mb-2 bg-white" placeholder="Follow-up question title" v-model="question.text"
                    @change="triggerUpdate" />
                <CInput class="mb-3 bg-white" size="sm" placeholder="Description (optional)"
                    v-model="question.description" @change="triggerUpdate" />

                <!-- Nested Options -->
                <div v-for="(opt, oIndex) in question.options" :key="oIndex" class="mb-3">
                    <div class="d-flex align-items-center mb-2">
                        <div class="border rounded-circle mr-2 bg-white" style="width: 18px; height: 18px;"></div>
                        <CInput class="mb-0 flex-grow-1 bg-white" v-model="opt.label" @change="triggerUpdate"
                            placeholder="Option" />

                        <span v-if="opt.followUp" class="badge badge-info ml-2">Has follow-up</span>

                        <CButton @click="removeOption(oIndex)" color="danger" variant="ghost" size="sm" class="ml-2">
                            <CIcon name="cil-trash" />
                        </CButton>
                    </div>

                    <!-- Add Follow Up Logic -->
                    <div class="ml-4 pl-1">
                        <div v-if="!opt.followUp" class="mb-2">
                            <CButton size="sm" variant="ghost" color="danger" class="p-0 text-decoration-none"
                                @click="addFollowUp(opt)">
                                <span class="font-weight-bold">+ Add follow-up question</span>
                            </CButton>
                        </div>

                        <!-- Recursive Nesting -->
                        <NestedQuestion v-if="opt.followUp" :question="opt.followUp" :level="level + '.' + (oIndex + 1)"
                            @update="triggerUpdate" @remove="removeFollowUp(opt)" />
                    </div>
                </div>

                <!-- Add Option Button -->
                <div class="pl-4 mb-3">
                    <CButton color="danger" variant="ghost" size="sm" class="font-weight-bold" @click="addOption">
                        + Add option
                    </CButton>
                </div>

                <!-- Required Toggle -->
                <div class="d-flex justify-content-between align-items-center border-top pt-2">
                    <span class="font-weight-bold small">Required</span>
                    <CSwitch class="mx-1" color="dark" size="sm" shape="pill" :checked.sync="question.required"
                        @update:checked="triggerUpdate" />
                </div>
            </CCardBody>
        </CCard>
    </div>
</template>

<script>
export default {
    name: 'NestedQuestion',
    props: {
        question: {
            type: Object,
            required: true
        },
        level: {
            type: String,
            default: '1.1'
        }
    },
    methods: {
        triggerUpdate() {
            this.$emit('update');
        },
        addOption() {
            this.question.options.push({ label: `Option ${this.question.options.length + 1}`, followUp: null });
            this.triggerUpdate();
        },
        removeOption(index) {
            this.question.options.splice(index, 1);
            this.triggerUpdate();
        },
        addFollowUp(option) {
            this.$set(option, 'followUp', {
                id: Date.now(),
                text: '',
                description: '',
                type: 'multiple_choice',
                required: false,
                options: [{ label: 'Option 1', followUp: null }]
            });
            this.triggerUpdate();
        },
        removeFollowUp(option) {
            this.$set(option, 'followUp', null);
            this.triggerUpdate();
        }
    }
}
</script>

<style scoped>
.nested-question-container {
    border-left: 2px solid #f9b115 !important;
    /* Warning color for hierarchy line */
}
</style>
