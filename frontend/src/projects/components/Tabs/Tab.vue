<template>
    <div class="form-tabs">
        <div class="form-tabs__nav">
            <button 
                v-for="(tab, i) in tabs" 
                :key="tab.key"
                class="form-tabs__nav-item"
                :class="{ 'form-tabs__nav-item--active': activeTab === i }"
                @click="activeTab = i"
            >
                {{ tab.label }}
                <span v-if="tab.badge !== undefined" class="form-tabs__badge">{{ tab.badge }}</span>
            </button>
        </div>

        <div class="form-tabs__content">
            <TabQuestion 
                v-if="activeTab === 0"
                :title="title" 
                :description="description" 
                :questions="questions"
                @update:title="$emit('update:title', $event)" 
                @update:description="$emit('update:description', $event)"
                @auto-save="triggerAutoSave" 
            />
            <TabResponses 
                v-else-if="activeTab === 1"
                :settings="settings" 
                @auto-save="triggerAutoSave" 
            />
            <TabSetting 
                v-else-if="activeTab === 2"
                :settings="settings" 
                @auto-save="triggerAutoSave" 
            />
        </div>
    </div>
</template>

<script>
import TabQuestion from './TabQuestion.vue';
import TabResponses from './TabResponses.vue';
import TabSetting from './TabSetting.vue';

export default {
    name: 'Tab',
    components: {
        TabQuestion,
        TabResponses,
        TabSetting
    },
    props: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        questions: { type: Array, default: () => [] },
        settings: { type: Object, required: true }
    },
    data() {
        return {
            activeTab: 0
        }
    },
    computed: {
        tabs() {
            return [
                { key: 'questions', label: 'Questions' },
                { key: 'responses', label: 'Responses', badge: 0 },
                { key: 'settings', label: 'Settings' }
            ]
        }
    },
    methods: {
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
}
</script>

<style scoped lang="scss">
.form-tabs {
    &__nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        background: #f5f5f5;
        border: 1px solid #e5e5e5;
        border-radius: 16px;
        padding: 4px;
        margin-bottom: 24px;
    }

    &__nav-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 10px 16px;
        border: none;
        border-radius: 12px;
        background: transparent;
        color: #737373;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        line-height: 20px;
        letter-spacing: -0.15px;

        &:hover {
            color: #333;
        }

        &--active {
            background: #fff;
            color: #333;
            font-weight: 600;
            box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
        }
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 10px;
        background: #e5e5e5;
        color: #737373;
        font-size: 12px;
        font-weight: 600;
    }

    &__content {
        min-height: 60vh;
    }
}
</style>
