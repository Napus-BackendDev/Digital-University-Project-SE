<template>
    <div class="flex-grow-1">
        <Header :title="headerTitle" :description="headerDescription" />
        <Container>
            <Tab :form="formData" :activeTab.sync="activeTab" @auto-save="triggerAutoSave" />
        </Container>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Tab from '../../components/Tabs/Tab.vue';
import Header from '../../components/Util/Header.vue';

export default {
    name: "CreateForm",
    components: {
        Tab,
        Header
    },
    data() {
        return {
            formData: {},
            activeTab: 'question'
        };
    },
    created() {
        this.onInit();
    },
    methods: {
        async onInit() {
            const formId = this.$route.params._id;
            try {
                this.formData = await this.$store.dispatch('Forms/getById', { _id: formId });
            } catch (error) {
                console.error("Error fetching form:", error);
            }
        },
        async triggerAutoSave() {
            try {
                await this.$store.dispatch('Forms/update', this.formData);
            } catch (error) {
                console.error("Error auto-saving form:", error);
            }
        }
    },
    computed: {
        ...mapGetters('User', ['user']),
        headerTitle() {
            if (this.activeTab === 'question') return "Form Questions";
            if (this.activeTab === 'response') return "Form Responses";
            if (this.activeTab === 'setting') return "Form Settings";
            
            // Default: show form title for 'question' tab
            if (!this.formData || !this.formData.title) return "Loading...";
            if (Array.isArray(this.formData.title)) {
                return this.formData.title[0]?.value || "Untitled Form";
            }
            return this.formData.title || "Untitled Form";
        },
        headerDescription() {
            if (this.activeTab === 'question') return "Add and organize questions to collect responses";
            if (this.activeTab === 'response') return "View and analyze form submissions and performance data";
            if (this.activeTab === 'setting') return "Configure form access, schedule, and organization controls";

            // Default: show form description for 'question' tab
            if (!this.formData || !this.formData.description) return "";
            if (Array.isArray(this.formData.description)) {
                return this.formData.description[0]?.value || "";
            }
            return this.formData.description || "";
        }
    }
}
</script>

<style lang="scss">
.form-title-input input {
    font-size: 2rem !important;
    padding: 0px !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    font-weight: bold;
    color: #1a202c;
    height: auto !important;
}

.form-title-input input:focus {
    border-bottom: 2px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.form-desc-input textarea {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    resize: none;
    padding: 0px !important;
    color: #64748b;
    font-size: 1rem;
}

.form-desc-input textarea:focus {
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 0 !important;
}

.sticky-sidebar {
    position: sticky;
    top: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>