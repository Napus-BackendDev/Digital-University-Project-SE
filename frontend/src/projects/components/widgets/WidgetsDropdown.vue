<template>
    <CRow>
        <!-- Card 1: Total Active Forms -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-primary-light text-primary">
                        <CIcon name="cil-file" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.activeForms }}</h2>
                    <div class="stat-label">Total Active Forms</div>
                </div>
            </div>
        </CCol>

        <!-- Card 2: Total Responses -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-info-light text-info">
                        <CIcon name="cil-envelope-closed" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.totalResponses }}</h2>
                    <div class="stat-label">Total Responses</div>
                </div>
            </div>
        </CCol>

        <!-- Card 3: Active Users -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-warning-light text-warning">
                        <CIcon name="cil-people" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.totalUsers }}</h2>
                    <div class="stat-label">Active Users</div>
                </div>
            </div>
        </CCol>

        <!-- Card 4: Avg Completion Rate -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-success-light text-success">
                        <CIcon name="cil-chart-line" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.completionRate }}%</h2>
                    <div class="stat-label">Avg. Completion Rate</div>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';

export default {
    name: 'WidgetsDropdown',
    props: {
        timeRange: {
            type: String,
            default: '7d'
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['users']),

        stats() {
            if (!this.forms) return {
                activeForms: 0,
                totalResponses: 0,
                totalUsers: 0,
                completionRate: 0
            };

            let activeForms = 0;
            let totalResponses = 0;
            let totalStarted = 0;
            let totalUsers = (this.users && Array.isArray(this.users)) ? this.users.length : 0;

            this.forms.forEach(form => {
                // Count active forms
                let isActive = false;
                let statusRaw = '';
                if (form.status && form.status.title) {
                    if (Array.isArray(form.status.title)) {
                        const enItem = form.status.title.find(item => item.key === 'en');
                        statusRaw = enItem ? enItem.value : (form.status.title[0]?.value || '');
                    } else {
                        statusRaw = form.status.title;
                    }
                }
                statusRaw = statusRaw.toLowerCase();

                if (statusRaw.includes('open') || statusRaw === 'active') {
                    isActive = true;
                }

                if (isActive) {
                    activeForms++;
                }

                // Count responses within range
                if (form.responses && form.responses.length > 0) {
                    totalStarted += form.responses.length;
                    const filteredResponses = form.responses.filter(r => {
                        const isSubmitted = r && (
                            r.submit === true || 
                            r.submit === 1 || 
                            String(r.submit).toLowerCase() === 'true'
                        );
                        if (!isSubmitted) return false;
                        if (!r.createdAt) return false;

                        // Check if r.createdAt is within timeRange
                        const createdAt = moment(r.createdAt);
                        if (this.timeRange === '1d') {
                            return createdAt.isSameOrAfter(moment().startOf('day'));
                        } else if (this.timeRange === '7d') {
                            return createdAt.isSameOrAfter(moment().subtract(7, 'days'), 'day');
                        } else if (this.timeRange === '30d') {
                            return createdAt.isSameOrAfter(moment().subtract(30, 'days'), 'day');
                        } else if (this.timeRange === '1y') {
                            return createdAt.isSameOrAfter(moment().subtract(1, 'years'), 'day');
                        }
                        return true;
                    });
                    totalResponses += filteredResponses.length;
                }
            });

            const completionRate = totalStarted > 0 ? ((totalResponses / totalStarted) * 100).toFixed(1) : 0;

            return {
                activeForms,
                totalResponses,
                totalUsers,
                completionRate
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

/* Custom light backgrounds for icons */
.bg-primary-light {
    background-color: rgba(50, 31, 219, 0.1);
}
.bg-info-light {
    background-color: rgba(57, 243, 253, 0.1);
}
.bg-danger-light {
    background-color: rgba(229, 83, 83, 0.1);
}

.bg-success-light {
    background-color: rgba(46, 184, 92, 0.1);
}

.bg-warning-light {
    background-color: rgba(249, 177, 21, 0.1);
}

.bg-dark-light {
    background-color: rgba(50, 50, 50, 0.05);
}

/* Text colors override if needed, using CoreUI utility classes usually works but explicit here for safety */
.text-primary {
    color: #321fdb !important;
}
.text-info {
    color: #39f3fd !important;
}
.text-danger {
    color: #e55353 !important;
}

.text-success {
    color: #2eb85c !important;
}

.text-warning {
    color: #f9b115 !important;
}

.text-dark {
    color: #3c4b64 !important;
}

.change-indicator {
    font-weight: 600;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 4px;
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
