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
                    <div class="stat-label">{{ $t('widget.total') }}</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3" @click="$emit('filter', 'Completed')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-success-light text-success">
                        <CIcon name="cil-check-circle" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.completed }}</h2>
                    <div class="stat-label">{{ $t('widget.completed') }}</div>
                </div>
            </div>
        </CCol>
        <CCol sm="6" lg="3" @click="$emit('filter', 'Pending')" style="cursor: pointer;">
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
        <CCol sm="6" lg="3" @click="$emit('filter', 'InProgress')" style="cursor: pointer;">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-info-light text-info">
                        <CIcon name="cil-speedometer" size="xl" />
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">{{ stats.inProgress }}</h2>
                    <div class="stat-label">{{ $t('widget.inprogress') }}</div>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
export default {
    name: 'WidgetsDropdownUser',
    props: {
        stats: {
            type: Object,
            default: () => ({ total: 0, pending: 0, completed: 0, inProgress: 0 })
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

.bg-info-light {
    background-color: rgba(57, 181, 255, 0.1);
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
