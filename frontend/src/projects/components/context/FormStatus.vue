<template>
    <CCard :class="embedded ? 'mb-0 border-0 shadow-none bg-transparent' : 'mb-4 border-0 shadow-sm rounded-20'">
        <CCardBody :class="embedded ? 'px-3 px-md-4 pt-1 pb-3 pb-md-4' : 'p-3 p-md-4'">
            <div class="d-flex flex-wrap align-items-center justify-content-between mb-3 pb-3 border-bottom status-header-row">
                <div>
                    <h5 v-if="!embedded" class="mb-1 font-weight-bold text-dark">{{ $t('editor.settings.status.title') }}</h5>
                    <p class="mb-0 small text-muted">
                        {{ isPublished ? $t('editor.settings.status.publishedNote') : $t('editor.settings.status.draftNote') }}
                    </p>
                </div>
                <span
                    class="publish-state-pill mt-2 mt-sm-0"
                    :class="isPublished ? 'is-published' : 'is-draft'"
                    data-testid="formstatus-publish-pill"
                >
                    <span class="publish-state-dot"></span>
                    <span>{{ isPublished ? $t('editor.settings.status.publishedBadge') : $t('editor.settings.status.draftBadge') }}</span>
                </span>
            </div>

            <!-- 4 Categorized Availability Modes -->
            <div class="mb-4">
                <label class="d-block font-weight-bold text-muted-dark mb-3">
                    {{ $t('editor.settings.status.modeSectionLabel') }}
                </label>
                <div class="schedule-mode-grid" role="radiogroup" :aria-label="$t('editor.settings.status.modeSectionLabel')">
                    <button
                        v-for="mode in modeOptions"
                        :key="mode.key"
                        type="button"
                        role="radio"
                        :aria-checked="selectedMode === mode.key ? 'true' : 'false'"
                        :data-schedule-mode="mode.key"
                        class="schedule-mode-card"
                        :class="{ 'is-selected': selectedMode === mode.key }"
                        @click="selectMode(mode.key)"
                    >
                        <div class="d-flex align-items-start justify-content-between mb-2">
                            <div class="d-flex align-items-center">
                                <span class="mode-radio-circle mr-2" :class="{ 'is-checked': selectedMode === mode.key }"></span>
                                <CIcon :name="mode.icon" size="sm" class="mr-2 mode-icon" />
                                <span class="font-weight-bold mode-title">{{ mode.title }}</span>
                            </div>
                            <span class="mode-badge">{{ mode.badge }}</span>
                        </div>
                        <p class="mb-0 small mode-desc">{{ mode.desc }}</p>
                    </button>
                </div>
            </div>

            <!-- Mode 1: Always Open -->
            <div v-if="selectedMode === 'always'" class="mode-config-box info-hint hint-secondary mb-0" data-testid="mode-config-always">
                <CIcon name="cil-check-circle" size="lg" class="mr-3 text-secondary flex-shrink-0" />
                <p class="mb-0 small" style="line-height: 1.5;">
                    {{ $t('editor.settings.status.modes.always.hint') }}
                </p>
            </div>

            <!-- Mode 2 / 3 / 4 Date Inputs -->
            <div v-else class="mode-config-panel p-3 rounded-12">
                <!-- Mode 3 auto-start note -->
                <div v-if="selectedMode === 'end_only'" class="d-flex align-items-start mb-3 pb-2 border-bottom text-muted small" data-testid="mode-config-end-only-note">
                    <CIcon name="cil-clock" size="sm" class="mr-2 mt-1 text-primary flex-shrink-0" />
                    <span>
                        {{ isPublished && formattedStartDisplay
                            ? $t('editor.settings.status.modes.end_only.autoStartActive', { date: formattedStartDisplay })
                            : $t('editor.settings.status.modes.end_only.autoStartPending') }}
                    </span>
                </div>

                <!-- Start Date (for range & scheduled) -->
                <CRow v-if="selectedMode === 'range' || selectedMode === 'scheduled'" class="mb-3 align-items-center">
                    <CCol md="4">
                        <label class="mb-1 mb-md-0 font-weight-bold text-muted-dark small">
                            {{ selectedMode === 'scheduled' ? $t('editor.settings.status.startAtFuture') : $t('editor.settings.status.startAt') }}
                            <span class="text-danger">*</span>
                        </label>
                    </CCol>
                    <CCol md="8">
                        <div class="picker-field-wrap">
                            <input
                                type="datetime-local"
                                data-testid="schedule-start-input"
                                class="form-control schedule-dt-input-el picker-only-input"
                                :class="{ 'is-invalid-input': liveValidation.field === 'startAt', 'has-picker-clear': Boolean(formattedStart) }"
                                :value="formattedStart"
                                @input="updateStart($event.target.value)"
                                @mousedown.prevent
                                @click="onPickerClick($event)"
                                @keydown="onPickerKeydown"
                                @beforeinput="onPickerBeforeInput"
                                @paste.prevent
                                @drop.prevent
                            />
                            <button
                                v-if="formattedStart"
                                type="button"
                                class="picker-clear-btn"
                                data-testid="schedule-start-clear"
                                :title="$t('editor.settings.access.remove')"
                                :aria-label="$t('editor.settings.access.remove')"
                                @click.stop="updateStart('')"
                            >
                                ×
                            </button>
                            <CIcon name="cil-calendar" size="sm" class="picker-field-icon" />
                        </div>
                    </CCol>
                </CRow>

                <!-- End Date (for range, end_only, & optional in scheduled) -->
                <CRow class="align-items-center">
                    <CCol md="4">
                        <label class="mb-1 mb-md-0 font-weight-bold text-muted-dark small">
                            {{ selectedMode === 'scheduled' ? $t('editor.settings.status.endAtOptional') : $t('editor.settings.status.endAt') }}
                            <span v-if="selectedMode !== 'scheduled'" class="text-danger">*</span>
                        </label>
                    </CCol>
                    <CCol md="8">
                        <div class="picker-field-wrap">
                            <input
                                type="datetime-local"
                                data-testid="schedule-end-input"
                                class="form-control schedule-dt-input-el picker-only-input"
                                :class="{ 'is-invalid-input': liveValidation.field === 'endAt', 'has-picker-clear': Boolean(formattedEnd) }"
                                :value="formattedEnd"
                                @input="updateEnd($event.target.value)"
                                @mousedown.prevent
                                @click="onPickerClick($event)"
                                @keydown="onPickerKeydown"
                                @beforeinput="onPickerBeforeInput"
                                @paste.prevent
                                @drop.prevent
                            />
                            <button
                                v-if="formattedEnd"
                                type="button"
                                class="picker-clear-btn"
                                data-testid="schedule-end-clear"
                                :title="$t('editor.settings.access.remove')"
                                :aria-label="$t('editor.settings.access.remove')"
                                @click.stop="updateEnd('')"
                            >
                                ×
                            </button>
                            <CIcon name="cil-calendar" size="sm" class="picker-field-icon" />
                        </div>
                        <small v-if="selectedMode === 'scheduled'" class="text-muted d-block mt-1">
                            {{ $t('editor.settings.status.endAtOptionalHint') }}
                        </small>
                    </CCol>
                </CRow>
            </div>

            <!-- Date Validation Error Alert (Past End Date / Reversed Range / Past Future-Start) -->
            <div
                v-if="!liveValidation.valid"
                class="info-hint hint-danger mt-3 mb-0 status-range-warning"
                role="alert"
                data-testid="schedule-validation-error"
            >
                <CIcon name="cil-warning" size="xl" class="mr-3 text-danger flex-shrink-0" />
                <div>
                    <p class="mb-0 small font-weight-bold text-danger" style="line-height: 1.45;">
                        {{ validationMessage }}
                    </p>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
import {
    resolveScheduleMode,
    isSchedulePublished,
    getScheduleStatus,
    validateScheduleConfig,
    getScheduleValidationMessageKey,
    tryOpenDatePicker,
    handleDatePickerKeydown,
    blockFreeTextBeforeInput
} from '@/projects/utils/formPolicy';

export default {
    name: 'FormStatus',
    props: {
        settings: {
            type: Object,
            required: true
        },
        embedded: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            nowMs: Date.now(),
            clockTimer: null
        };
    },
    mounted() {
        this.clockTimer = setInterval(() => {
            this.nowMs = Date.now();
        }, 15000);
    },
    beforeDestroy() {
        if (this.clockTimer) {
            clearInterval(this.clockTimer);
            this.clockTimer = null;
        }
    },
    computed: {
        scheduleObj() {
            return (this.settings && this.settings.schedule) || {};
        },
        nowDate() {
            return new Date(this.nowMs);
        },
        isPublished() {
            return isSchedulePublished(this.scheduleObj);
        },
        selectedMode() {
            return resolveScheduleMode(this.scheduleObj, this.nowDate);
        },
        modeOptions() {
            return [
                {
                    key: 'always',
                    icon: 'cil-infinity',
                    title: this.$t('editor.settings.status.modes.always.title'),
                    badge: this.$t('editor.settings.status.modes.always.badge'),
                    desc: this.$t('editor.settings.status.modes.always.desc')
                },
                {
                    key: 'range',
                    icon: 'cil-calendar',
                    title: this.$t('editor.settings.status.modes.range.title'),
                    badge: this.$t('editor.settings.status.modes.range.badge'),
                    desc: this.$t('editor.settings.status.modes.range.desc')
                },
                {
                    key: 'end_only',
                    icon: 'cil-clock',
                    title: this.$t('editor.settings.status.modes.end_only.title'),
                    badge: this.$t('editor.settings.status.modes.end_only.badge'),
                    desc: this.$t('editor.settings.status.modes.end_only.desc')
                },
                {
                    key: 'scheduled',
                    icon: 'cil-av-timer',
                    title: this.$t('editor.settings.status.modes.scheduled.title'),
                    badge: this.$t('editor.settings.status.modes.scheduled.badge'),
                    desc: this.$t('editor.settings.status.modes.scheduled.desc')
                }
            ];
        },
        formattedStart() {
            if (!this.scheduleObj.startAt) return '';
            return this.formatDateForInput(this.scheduleObj.startAt);
        },
        formattedStartDisplay() {
            if (!this.scheduleObj.startAt) return '';
            const d = new Date(this.scheduleObj.startAt);
            if (Number.isNaN(d.getTime())) return '';
            return d.toLocaleString();
        },
        formattedEnd() {
            if (!this.scheduleObj.endAt) return '';
            return this.formatDateForInput(this.scheduleObj.endAt);
        },
        currentStatus() {
            return getScheduleStatus(this.scheduleObj, this.nowDate);
        },
        liveValidation() {
            return validateScheduleConfig(this.scheduleObj, { now: this.nowDate, requireComplete: false });
        },
        validationMessage() {
            const key = getScheduleValidationMessageKey(this.liveValidation.reason);
            return key ? this.$t(key) : '';
        }
    },
    methods: {
        ensureScheduleObject() {
            if (!this.settings.schedule || typeof this.settings.schedule !== 'object') {
                this.$set(this.settings, 'schedule', {
                    isPublished: false,
                    mode: 'always',
                    startAt: null,
                    endAt: null
                });
            } else if (typeof this.settings.schedule.isPublished !== 'boolean') {
                this.$set(this.settings.schedule, 'isPublished', this.isPublished);
            }
        },
        formatDateForInput(date) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const pad = (num) => num.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        },
        toIsoOrNull(val) {
            if (!val) return null;
            const d = new Date(val);
            return Number.isNaN(d.getTime()) ? null : d.toISOString();
        },
        selectMode(modeKey) {
            this.nowMs = Date.now();
            this.ensureScheduleObject();
            const published = Boolean(this.settings.schedule.isPublished === true);
            const existingStart = this.settings.schedule.startAt || null;
            const existingEnd = this.settings.schedule.endAt || null;

            this.$set(this.settings.schedule, 'mode', modeKey);
            this.$set(this.settings.schedule, 'isPublished', published);

            if (modeKey === 'always') {
                this.$set(this.settings.schedule, 'startAt', published ? (existingStart || new Date().toISOString()) : null);
                this.$set(this.settings.schedule, 'endAt', null);
            } else if (modeKey === 'end_only') {
                this.$set(this.settings.schedule, 'startAt', published ? (existingStart || new Date().toISOString()) : null);
                this.$set(this.settings.schedule, 'endAt', existingEnd);
            } else {
                this.$set(this.settings.schedule, 'startAt', existingStart);
                this.$set(this.settings.schedule, 'endAt', existingEnd);
            }
            this.triggerAutoSave();
        },
        updateStart(val) {
            this.nowMs = Date.now();
            this.ensureScheduleObject();
            this.$set(this.settings.schedule, 'mode', this.selectedMode);
            this.$set(this.settings.schedule, 'startAt', this.toIsoOrNull(val));
            this.triggerAutoSave();
        },
        updateEnd(val) {
            this.nowMs = Date.now();
            this.ensureScheduleObject();
            this.$set(this.settings.schedule, 'mode', this.selectedMode);
            this.$set(this.settings.schedule, 'endAt', this.toIsoOrNull(val));
            this.triggerAutoSave();
        },
        async triggerAutoSave() {
            this.$emit('auto-save');
        },
        onPickerClick(event) {
            if (event && event.currentTarget) {
                tryOpenDatePicker(event.currentTarget);
            }
        },
        onPickerKeydown(event) {
            handleDatePickerKeydown(event);
        },
        onPickerBeforeInput(event) {
            blockFreeTextBeforeInput(event);
        }
    }
};
</script>

<style scoped>
.rounded-20 {
    border-radius: 20px !important;
    overflow: hidden;
}
.rounded-12 {
    border-radius: 12px;
}
.status-header-row {
    gap: 12px;
}
.publish-state-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 0.85rem;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 700;
    white-space: nowrap;
}
.publish-state-pill.is-draft {
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
}
.publish-state-pill.is-published {
    background-color: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}
.publish-state-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    margin-right: 7px;
    background-color: currentColor;
}
.schedule-mode-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
@media (max-width: 767.98px) {
    .schedule-mode-grid {
        grid-template-columns: 1fr;
    }
}
.schedule-mode-card {
    text-align: left;
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 0.9rem 1rem;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
    display: flex;
    flex-direction: column;
}
.schedule-mode-card:hover {
    border-color: #cbd5e1;
    background-color: #f8fafc;
}
.schedule-mode-card.is-selected {
    border-color: #8c1515;
    background-color: #fff8f8;
    box-shadow: 0 2px 10px rgba(140, 21, 21, 0.08);
}
.mode-radio-circle {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #94a3b8;
    display: inline-block;
    position: relative;
    flex-shrink: 0;
}
.mode-radio-circle.is-checked {
    border-color: #8c1515;
}
.mode-radio-circle.is-checked::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background-color: #8c1515;
}
.mode-icon {
    color: #64748b;
    flex-shrink: 0;
}
.schedule-mode-card.is-selected .mode-icon,
.schedule-mode-card.is-selected .mode-title {
    color: #8c1515;
}
.mode-title {
    font-size: 0.92rem;
    color: #1e293b;
}
.mode-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    background-color: #f1f5f9;
    color: #475569;
    white-space: nowrap;
    margin-left: 8px;
}
.schedule-mode-card.is-selected .mode-badge {
    background-color: #fee2e2;
    color: #8c1515;
}
.mode-desc {
    color: #64748b;
    line-height: 1.45;
}
.mode-config-panel {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
}
.schedule-dt-input-el {
    height: 44px;
    background-color: #ffffff;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
}
.schedule-dt-input-el.is-invalid-input {
    border-color: #dc2626 !important;
    background-color: #fef2f2 !important;
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
    border: 1px solid #cbd5e1;
    color: #475569;
}
.hint-danger {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
}
</style>
