<template>
    <div class="mt-3 mb-2 px-1">
        <div class="back-pill" @click="handleBack">
            <CIcon name="cil-chevron-left" size="sm" class="mr-1" />
            <span>{{ $t('button.back') }}</span>
        </div>
    </div>
</template>

<script>
export default {
    name: "ButtonBack",
    props: {
        to: {
            type: [String, Object],
            default: null
        }
    },
    methods: {
        handleBack() {
            const currentRouteName = this.$route?.name;
            if (currentRouteName === 'CreateForm' || currentRouteName === 'EditorCreateForm') {
                this.$router.push({ name: 'ManageForms' });
                return;
            }

            if (this.to) {
                this.$router.push(this.to);
            } else {
                this.$router.back();
            }
        }
    }
}
</script>

<style scoped>
.back-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    background-color: #8B1A1A;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 600;
    box-shadow: 0 4px 6px -1px rgba(139, 26, 26, 0.2), 0 2px 4px -1px rgba(139, 26, 26, 0.1);
    border: none;
}

.back-pill:hover {
    background-color: #6e1515;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px -2px rgba(139, 26, 26, 0.3);
}

.back-pill:active {
    transform: translateY(0);
    background-color: #364fc7;
}

.back-pill span {
    line-height: 1;
}
</style>