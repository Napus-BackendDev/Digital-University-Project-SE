<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-4 font-weight-bold text-dark">{{ $t('editor.settings.status.title') }}</h5>
            <CRow class="mb-4 align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">{{ $t('editor.settings.status.startAt') }}</label>
                </CCol>
                <CCol md="9">
                    <CInput type="datetime-local" class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        :value="formattedStart" @input="updateStart" @change="triggerAutoSave" />
                </CCol>
            </CRow>
            <CRow class="align-items-center">
                <CCol md="3">
                    <label class="mb-0 font-weight-bold text-muted-dark">{{ $t('editor.settings.status.endAt') }}</label>
                </CCol>
                <CCol md="9">
                    <CInput type="datetime-local" class="mb-0"
                        style="height: 45px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;"
                        :value="formattedEnd" @input="updateEnd" @change="triggerAutoSave" />
                </CCol>
            </CRow>

            <div class="info-hint mb-0 mt-4" :class="statusColorClass">
                <CIcon name="cil-info" size="xl" class="mr-3" :class="statusIconColor" />
                <div>
                    <h6 class="mb-1 font-weight-bold">{{ $t('editor.settings.status.statusLabel') }}: {{ currentStatusText }}</h6>
                    <p class="mb-0 small" style="line-height: 1.4;">{{ currentStatusDescription }}</p>
                </div>
            </div>
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
        },
        currentStatus() {
            const start = this.settings?.schedule?.startAt;
            const end = this.settings?.schedule?.endAt;
            
            if (!start || !end) return 'draft';
            
            const now = new Date().getTime();
            const startTime = new Date(start).getTime();
            const endTime = new Date(end).getTime();
            
            if (now >= startTime && now <= endTime) return 'open';
            if (now < startTime) return 'scheduled';
            return 'closed';
        },
        currentStatusText() {
            switch(this.currentStatus) {
                case 'draft': return this.$t('editor.settings.status.draft');
                case 'open': return this.$t('editor.settings.status.open');
                case 'scheduled': return this.$t('editor.settings.status.scheduled');
                case 'closed': return this.$t('editor.settings.status.closed');
                default: return this.$t('editor.settings.status.draft');
            }
        },
        currentStatusDescription() {
            switch(this.currentStatus) {
                case 'draft': return this.$t('editor.settings.status.draftDesc');
                case 'open': return this.$t('editor.settings.status.openDesc');
                case 'scheduled': return this.$t('editor.settings.status.scheduledDesc');
                case 'closed': return this.$t('editor.settings.status.closedDesc');
                default: return "";
            }
        },
        statusColorClass() {
            switch(this.currentStatus) {
                case 'draft': return 'hint-secondary';
                case 'open': return 'hint-success';
                case 'scheduled': return 'hint-info';
                case 'closed': return 'hint-danger';
                default: return 'hint-info';
            }
        },
        statusIconColor() {
            switch(this.currentStatus) {
                case 'draft': return 'text-secondary';
                case 'open': return 'text-success';
                case 'scheduled': return 'text-info';
                case 'closed': return 'text-danger';
                default: return 'text-info';
            }
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
            this.$emit('auto-save');
        }
    }
}
</script>

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}
.info-hint {
    display: flex;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    transition: all 0.3s ease;
}
.hint-secondary {
    background-color: #f8fafc;
    border-left: 4px solid #94a3b8;
    color: #475569;
}
.hint-success {
    background-color: #f0fdf4;
    border-left: 4px solid #22c55e;
    color: #166534;
}
.hint-info {
    background-color: #f0f9ff;
    border-left: 4px solid #3b82f6;
    color: #1e40af;
}
.hint-danger {
    background-color: #fef2f2;
    border-left: 4px solid #ef4444;
    color: #991b1b;
}
</style>
