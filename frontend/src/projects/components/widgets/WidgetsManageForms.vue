<template>
    <CRow class="mb-4">
        <CCol sm="6" lg="3" @click="$emit('filter', 'All')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-primary-light text-primary">
                        <CIcon name="cil-description" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.total }}</h2>
                    <div class="stat-label">Total Forms</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3" @click="$emit('filter', 'Active')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-success-light text-success">
                        <CIcon name="cil-check-circle" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.active }}</h2>
                    <div class="stat-label">Active Forms</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3" @click="$emit('filter', 'Draft')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-warning-light text-warning">
                        <CIcon name="cil-clock" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.draft }}</h2>
                    <div class="stat-label">Draft Forms</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3" @click="$emit('filter', 'Closed')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-danger-light text-danger">
                        <CIcon name="cil-lock-locked" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.closed }}</h2>
                    <div class="stat-label">Closed Forms</div>
                </div>
            </div>
        </CCol>
    </CRow>
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
    computed: {
        stats() {
            const forms = this.forms || [];
            const now = new Date();
            let active = 0, draft = 0, closed = 0;
            for (const f of forms) {
                let status = 'Draft';
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
                else draft++;
            }

            return {
                total: forms.length,
                active,
                draft,
                closed
            };
        }
    }
}
</script>

<style scoped>
/* Matching WidgetsDropdownUser premium styling */
.stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.3s ease;
}

.stat-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
}

.stat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.icon-box {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bg-primary-light {
    background-color: rgba(37, 99, 235, 0.1);
}

.bg-success-light {
    background-color: rgba(22, 163, 74, 0.1);
}

.bg-warning-light {
    background-color: rgba(234, 179, 8, 0.1);
}

.bg-danger-light {
    background-color: rgba(220, 38, 38, 0.1);
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
    line-height: 1.2;
}

.stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.025em;
}
</style>
