<template>
    <CRow>
        <!-- Card 1: Total Forms -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-danger-light text-danger">
                        <CIcon name="cil-description" size="xl" />
                    </div>
                    <div class="change-indicator text-success">
                        <CIcon name="cil-arrow-top" size="sm" /> 12.5%
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">7</h2>
                    <div class="stat-label">Total Forms</div>
                </div>
            </div>
        </CCol>

        <!-- Card 2: Total Responses -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-success-light text-success">
                        <CIcon name="cil-people" size="xl" />
                    </div>
                    <div class="change-indicator text-success">
                        <CIcon name="cil-arrow-top" size="sm" /> 8.3%
                    </div>
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">12</h2>
                    <div class="stat-label">Total Responses</div>
                </div>
            </div>
        </CCol>

        <!-- Card 3: Active Forms -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-warning-light text-warning">
                        <CIcon name="cil-chart-line" size="xl" />
                    </div>
                    <!-- No percentage for this card -->
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">5</h2>
                    <div class="stat-label">Active Forms</div>
                </div>
            </div>
        </CCol>

        <!-- Card 4: Avg Responses/Form -->
        <CCol sm="6" lg="3">
            <div class="stat-card">
                <div class="stat-header">
                    <div class="icon-box bg-dark-light text-dark">
                        <CIcon name="cil-chart" size="xl" />
                    </div>
                    <!-- No percentage for this card -->
                </div>
                <div class="stat-content">
                    <h2 class="stat-value">2</h2>
                    <div class="stat-label">Avg Responses/Form</div>
                </div>
            </div>
        </CCol>
    </CRow>
</template>

<script>
export default {
    name: 'WidgetsDropdown',
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
