<template>
    <CCard class="header-card mb-4">
        <CCardBody class="p-4">
            <div class="d-flex align-items-center">
                <!-- Decorative icon moved to front -->
                <div class="header-icon-box mr-3 d-none d-sm-flex">
                    <CIcon name="cil-layers" size="xl" />
                </div>
                <div class="flex-grow-1">
                    <h1 class="header-title mb-1">{{ title }}</h1>
                    <p class="header-description mb-0 text-muted-custom">{{ description }}</p>
                </div>
            </div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: "Header",
    props: {
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        }
    }
}
</script>

<style scoped>
.header-card {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    position: relative;
    border-left: 5px solid #3c4b64;
}

.header-title {
    color: #1e293b;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.025em;
}

.text-muted-custom {
    color: #64748b;
    font-size: 0.95rem;
    font-weight: 400;
}

.header-icon-box {
    width: 56px;
    height: 56px;
    background: #f1f5f9;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3c4b64;
}

/* Subtle background decoration */
.header-card::after {
    content: "";
    position: absolute;
    top: -20px;
    right: -20px;
    width: 100px;
    height: 100px;
    background: rgba(60, 75, 100, 0.03);
    border-radius: 50%;
    z-index: 0;
}
</style>