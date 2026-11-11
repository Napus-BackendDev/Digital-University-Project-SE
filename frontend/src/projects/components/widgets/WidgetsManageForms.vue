<template>
    <div class="widgets-wrapper">
        <CRow class="mb-4">
            <CCol sm="6" lg="3" @click="$emit('filter', 'All')" style="cursor: pointer;">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="icon-box icon-box--primary">
                            <CIcon name="cil-description" size="xl" />
                        </div>
                        <span class="stat-badge stat-badge--primary">{{ $t('status.all') }}</span>
                    </div>
                    <div class="stat-content">
                        <h2 class="stat-value">{{ stats.total }}</h2>
                        <div class="stat-label">{{ $t('widget.manage.total') }}</div>
                    </div>
                </div>
            </CCol>
            <CCol sm="6" lg="3" @click="$emit('filter', 'Active')" style="cursor: pointer;">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="icon-box icon-box--success">
                            <CIcon name="cil-check-circle" size="xl" />
                        </div>
                        <span class="stat-badge stat-badge--success">{{ $t('status.active') }}</span>
                    </div>
                    <div class="stat-content">
                        <h2 class="stat-value">{{ stats.active }}</h2>
                        <div class="stat-label">{{ $t('widget.manage.active') }}</div>
                    </div>
                </div>
            </CCol>
            <CCol sm="6" lg="3" @click="$emit('filter', 'Pending')" style="cursor: pointer;">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="icon-box icon-box--warning">
                            <CIcon name="cil-clock" size="xl" />
                        </div>
                        <span class="stat-badge stat-badge--warning">{{ $t('status.pending') }}</span>
                    </div>
                    <div class="stat-content">
                        <h2 class="stat-value">{{ stats.pending }}</h2>
                        <div class="stat-label">{{ $t('widget.pending') }}</div>
                    </div>
                </div>
            </CCol>
            <CCol sm="6" lg="3" @click="$emit('filter', 'Closed')" style="cursor: pointer;">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="icon-box icon-box--info">
                            <CIcon name="cil-lock-locked" size="xl" />
                        </div>
                        <span class="stat-badge stat-badge--info">{{ $t('status.closed') }}</span>
                    </div>
                    <div class="stat-content">
                        <h2 class="stat-value">{{ stats.closed }}</h2>
                        <div class="stat-label">{{ $t('widget.manage.closed') }}</div>
                    </div>
                </div>
            </CCol>
        </CRow>
    </div>
</template>

<script>
export default {
    name: 'WidgetsManageForms',
    props: {
        forms: {
            type: Array,
            default: () => []
        }
    },
    methods: {},
    computed: {
        stats() {
            const forms = this.forms || [];
            const now = new Date();
            let active = 0, pending = 0, closed = 0;
            for (const f of forms) {
                let status = 'Pending';
                if (f) {
                    const hasStart = f.schedule && f.schedule.startAt;
                    const hasEnd = f.schedule && f.schedule.endAt;
                    if (hasStart || hasEnd) {
                        const start = hasStart ? new Date(f.schedule.startAt) : null;
                        const end = hasEnd ? new Date(f.schedule.endAt) : null;
                        
                        // Outside range = Closed (matching ManagementTables)
                        if ((start && now < start) || (end && now > end)) {
                            status = 'Closed';
                        } else {
                            status = 'Active';
                        }
                    }
                }

                // Align with derived status strings
                if (status === 'Active') active++;
                else if (status === 'Closed') closed++;
                else pending++;
            }

            return {
                total: forms.length,
                active,
                pending,
                closed
            };
        }
    }
}
</script>

<style scoped>
.stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03);
    border-color: #cbd5e1;
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.icon-box {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
}

.stat-card:hover .icon-box {
    transform: scale(1.05);
}

.icon-box--primary {
    background-color: rgba(140, 21, 21, 0.08);
    color: #8c1515;
}

.icon-box--success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #059669;
}

.icon-box--warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: #d97706;
}

.icon-box--info {
    background-color: rgba(100, 116, 139, 0.1);
    color: #475569;
}

.stat-badge {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.stat-badge--primary {
    background: #fef2f2;
    color: #8c1515;
}

.stat-badge--success {
    background: #ecfdf5;
    color: #059669;
}

.stat-badge--warning {
    background: #fffbeb;
    color: #b45309;
}

.stat-badge--info {
    background: #f1f5f9;
    color: #475569;
}

.stat-value {
    font-size: 2.15rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2px;
    line-height: 1.15;
    letter-spacing: -0.02em;
}

.stat-label {
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 600;
}
</style>
