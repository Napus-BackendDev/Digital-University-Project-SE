<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.manage')" :description="$t('description')" :showCreateButton="true" />
        <WidgetsManageForms :forms="filteredForms" @filter="(status) => $refs.table.filterStatus(status)" />
        <ManagementTables ref="table" :items="filteredForms" />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ManagementTables from '../components/tables/ManagementTables.vue'
import WidgetsManageForms from '../components/widgets/WidgetsManageForms.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "EditorDashboard",
    components: {
        ManagementTables,
        WidgetsManageForms,
        Header
    },
    data() {
        return {}
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
        },
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user']),
        filteredForms() {
            let raw = this.forms || [];
            const currentUserId = this.user ? this.user._id : null;

            // 1. Identify Admin
            let isAdmin = false;
            if (this.user && this.user.role) {
                const role = this.user.role;
                if (Array.isArray(role.title)) {
                    isAdmin = role.title.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
                } else if (typeof role.title === 'string') {
                    isAdmin = role.title.toLowerCase().includes('admin');
                }
            }

            // 2. Responsibility Filter
            if (currentUserId && !isAdmin) {
                return raw.filter(f => {
                    if (!f) return false;
                    
                    // Creator check
                    const creatorId = f.creator && typeof f.creator === 'object' ? f.creator._id : f.creator;
                    if (String(creatorId) === String(currentUserId)) return true;

                    // Collaborator check
                    if (Array.isArray(f.controll)) {
                        if (f.controll.some(c => {
                            const collabUserId = c.user && typeof c.user === 'object' ? c.user._id : c.user;
                            return String(collabUserId) === String(currentUserId);
                        })) return true;
                    }

                    // Authorized User check (settings.allowedUser)
                    if (f.settings && Array.isArray(f.settings.allowedUser)) {
                        return f.settings.allowedUser.some(u => {
                            const allowedId = u && typeof u === 'object' ? u._id : u;
                            return String(allowedId) === String(currentUserId);
                        });
                    }

                    return false;
                });
            }

            return raw;
        }
    }
}
</script>
