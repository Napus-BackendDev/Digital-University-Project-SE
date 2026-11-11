<template>
    <CRow>
        <!-- Card 1: Total Forms -->
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box icon-box--primary">
                        <CIcon name="cil-file" size="xl" />
                    </div>
                    <span class="stat-badge stat-badge--primary">{{ $t('widget.total') }}</span>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.totalForms }}</h2>
                    <div class="stat-label">{{ $t('widget.total') }}</div>
                </div>
            </div>
        </CCol>

        <!-- Card 2: Active Forms -->
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box icon-box--success">
                        <CIcon name="cil-chart-line" size="xl" />
                    </div>
                    <span class="stat-badge stat-badge--success">{{ $t('widget.active') }}</span>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.activeForms }}</h2>
                    <div class="stat-label">{{ $t('widget.active') }}</div>
                </div>
            </div>
        </CCol>

        <!-- Card 3: Total Responses -->
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box icon-box--warning">
                        <CIcon name="cil-envelope-closed" size="xl" />
                    </div>
                    <span class="stat-badge stat-badge--warning">{{ $t('widget.totalResponses') }}</span>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.totalResponses }}</h2>
                    <div class="stat-label">{{ $t('widget.totalResponses') }}</div>
                </div>
            </div>
        </CCol>

        <!-- Card 4: Active Users -->
        <CCol sm="6" lg="3" class="mb-3 mb-lg-0">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box icon-box--info">
                        <CIcon name="cil-people" size="xl" />
                    </div>
                    <span class="stat-badge stat-badge--info">{{ $t('widget.activeUsers') }}</span>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.totalUsers }}</h2>
                    <div class="stat-label">{{ $t('widget.activeUsers') }}</div>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
import { mapGetters } from 'vuex';
import moment from 'moment';
import { getFilteredResponses, getTableStatusLabel } from '@/projects/utils/analytics';

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
            if (!this.forms || !Array.isArray(this.forms)) return {
                totalForms: 0,
                totalResponses: 0,
                totalUsers: 0,
                activeForms: 0
            };

            let totalForms = this.forms.length;
            let activeForms = 0;
            let totalResponses = 0;
            let totalUsers = (this.users && Array.isArray(this.users)) ? this.users.length : 0;

            const now = moment();

            this.forms.forEach(form => {
                const status = getTableStatusLabel(form, now);
                if (status === 'Active') {
                    activeForms++;
                }

                if (form.responses && form.responses.length > 0) {
                    const filteredResponses = getFilteredResponses(form, this.timeRange, now);
                    totalResponses += filteredResponses.length;
                }
            });

            return {
                totalForms,
                totalResponses,
                totalUsers,
                activeForms
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
    background-color: rgba(14, 165, 233, 0.1);
    color: #0284c7;
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
    background: #f0f9ff;
    color: #0369a1;
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
