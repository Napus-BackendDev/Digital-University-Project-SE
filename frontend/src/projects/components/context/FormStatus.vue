<template>
    <CCard class="mb-4 border-0 shadow-sm">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">Form Status</h5>
            <CRow class="mb-4 align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">Start date time</label>
                </CCol>
                <CCol md="9">
                    <CInput type="datetime-local" class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        :value="formattedStart" @input="updateStart" @change="triggerAutoSave" />
                </CCol>
            </CRow>
            <CRow class="align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">End date time</label>
                </CCol>
                <CCol md="9">
                    <CInput type="datetime-local" class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        :value="formattedEnd" @input="updateEnd" @change="triggerAutoSave" />
                </CCol>
            </CRow>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'FormStatus',
    props: {
        settings: {
            type: Object,
            required: true
        }
    },
    computed: {
        formattedStart() {
            if (!this.settings || !this.settings.schedule || !this.settings.schedule.startAt) return '';
            return this.formatDateForInput(this.settings.schedule.startAt);
        },
        formattedEnd() {
            if (!this.settings || !this.settings.schedule || !this.settings.schedule.endAt) return '';
            return this.formatDateForInput(this.settings.schedule.endAt);
        }
    },
    methods: {
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
        updateStart(val) {
            if (!this.settings.schedule) {
                this.$set(this.settings, 'schedule', {});
            }
            this.$set(this.settings.schedule, 'startAt', val);
            this.triggerAutoSave();
        },
        updateEnd(val) {
            if (!this.settings.schedule) {
                this.$set(this.settings, 'schedule', {});
            }
            this.$set(this.settings.schedule, 'endAt', val);
            this.triggerAutoSave();
        },
        async triggerAutoSave() {
            try {
                await this.$store.dispatch('Forms/update', this.settings);
                console.log('Form status updated successfully', this.settings.schedule);
            } catch (error) {
                console.error('Error updating form status:', error);
            }
        }
    }
}
</script>
