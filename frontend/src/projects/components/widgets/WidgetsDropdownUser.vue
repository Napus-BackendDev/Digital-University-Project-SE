<template>
    <CRow class="mb-4">
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-primary-light text-primary">
                        <CIcon name="cil-description" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.total }}</h2>
                    <div class="stat-label">{{ $t('widget.total') }}</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-warning-light text-warning">
                        <CIcon name="cil-clock" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.pending }}</h2>
                    <div class="stat-label">{{ $t('widget.pending') }}</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-success-light text-success">
                        <CIcon name="cil-check-circle" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.finish }}</h2>
                    <div class="stat-label">{{ $t('widget.finish') }}</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-danger-light text-danger">
                        <CIcon name="cil-warning" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.late }}</h2>
                    <div class="stat-label">{{ $t('widget.late') }}</div>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'WidgetsDropdownUser',
    computed: {
        ...mapGetters('Forms', ['forms']),
        stats() {
            if (!this.forms) return { total: 0, pending: 0, finish: 0, late: 0 };

            const now = new Date();
            const responder = '69a50fcc5f1adf15e09b2d86'; 

            let total = 0;
            let pending = 0;
            let finish = 0;
            let late = 0;

            this.forms.forEach(form => {
                total++;

                let hasCompleted = false;
                if (form.responses && Array.isArray(form.responses)) {
                    hasCompleted = form.responses.some(r =>
                        r && typeof r === 'object' &&
                        String(r.responder) === String(responder) &&
                        (r.submit === true || r.submit === 'true')
                    );
                }

                if (hasCompleted) {
                    finish++;
                } else {
                    const schedule = form.schedule;
                    if (schedule && schedule.endAt) {
                        const end = new Date(schedule.endAt);
                        if (now > end) {
                            late++;
                        } else {
                            pending++;
                        }
                    } else {
                        pending++;
                    }
                }
            });

            return { total, pending, finish, late };
        }
    }
}
</script>

<style scoped>
.stat-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: box-shadow 0.3s ease;
}

.stat-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
    background-color: rgba(50, 31, 219, 0.1);
}

.bg-warning-light {
    background-color: rgba(249, 177, 21, 0.1);
}

.bg-success-light {
    background-color: rgba(46, 184, 92, 0.1);
}

.bg-danger-light {
    background-color: rgba(229, 83, 83, 0.1);
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 4px;
    line-height: 1.2;
}

.stat-label {
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 500;
}
</style>
