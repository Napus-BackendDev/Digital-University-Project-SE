<template>
    <div 
        class="empty-state-card py-5 px-4 text-center" 
        :class="[
            cardClass, 
            borderless ? 'empty-state-borderless' : 'bg-white shadow-sm border',
            !borderless && rounded === '20' ? 'rounded-20' : '', 
            !borderless && rounded === '12' ? 'rounded-12' : ''
        ]"
    >
        <div class="empty-icon-wrapper mx-auto mb-3" :class="iconWrapperClass">
            <slot name="icon">
                <CIcon :name="icon" size="xl" />
            </slot>
        </div>
        <h4 class="empty-title text-dark font-weight-bold mb-2">{{ displayTitle }}</h4>
        <p v-if="displayDescription" class="empty-desc text-muted mb-0 mx-auto" style="max-width: 480px;">
            {{ displayDescription }}
        </p>
        <div v-if="$slots.action" class="empty-action mt-4">
            <slot name="action"></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'EmptyState',
    props: {
        icon: {
            type: String,
            default: 'cil-coffee'
        },
        title: {
            type: String,
            default: ''
        },
        description: {
            type: String,
            default: ''
        },
        rounded: {
            type: String,
            default: '20'
        },
        borderless: {
            type: Boolean,
            default: false
        },
        cardClass: {
            type: String,
            default: ''
        },
        iconWrapperClass: {
            type: String,
            default: ''
        }
    },
    computed: {
        displayTitle() {
            if (this.title) return this.title;
            return this.$t('responses.noData') || 'ยังไม่มีข้อมูลในขณะนี้';
        },
        displayDescription() {
            if (this.description) return this.description;
            return this.$t('responses.noDataDesc') || '';
        }
    }
}
</script>

<style scoped>
.empty-state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    width: 100%;
}

.empty-state-card:not(.empty-state-borderless) {
    border: 1px solid #e2e8f0 !important;
    background: #ffffff !important;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.empty-state-card:not(.empty-state-borderless):hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}

.empty-state-card:not(.empty-state-borderless):hover .empty-icon-wrapper {
    transform: scale(1.05);
}

.empty-state-borderless {
    border: none !important;
    background: transparent !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    pointer-events: none;
    user-select: none;
}

.empty-icon-wrapper {
    width: 60px;
    height: 60px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    transition: transform 0.2s ease;
}

.empty-icon-wrapper .c-icon,
.empty-icon-wrapper svg {
    color: #64748b !important;
}

.empty-title {
    font-size: 1.15rem;
    letter-spacing: -0.01em;
}

.empty-desc {
    font-size: 0.9rem;
    line-height: 1.5;
}

.rounded-20 {
    border-radius: 20px !important;
}

.rounded-12 {
    border-radius: 12px !important;
}
</style>
