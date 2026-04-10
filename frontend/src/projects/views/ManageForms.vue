<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.manage')" :description="$t('description')" :showCreateButton="true" />
        <WidgetsManageForms :forms="filteredForms" @filter="(status) => $refs.table.filterStatus(status)" />
        
        <div v-if="loading" class="text-center py-5">
            <CSpinner color="primary" variant="grow" />
            <div class="mt-2 text-muted">{{ $t('common.loading') }}</div>
        </div>
        <ManagementTables v-else ref="table" :items="filteredForms" />
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
        return {
            loading: false
        }
    },
    async created() {
        // If user is already loaded, fetch forms immediately
        if (this.user && this.user._id) {
            await this.onInit();
        }
    },
    watch: {
        user: {
            handler(val, oldVal) {
                // Only trigger if user ID has actually changed to avoid redundant calls
                if (val && val._id && (!oldVal || val._id !== oldVal._id)) {
                    this.onInit();
                }
            },
            immediate: false
        }
    },
    methods: {
        async onInit() {
            // Check if user and its essential nested data (organization) are ready
            if (this.user && this.user._id) {
                // Determine organization ID carefully
                let orgId = null;
                if (this.user.organization) {
                    orgId = this.user.organization._id || this.user.organization;
                }

                // If orgId is an object (legacy populate), extract ID
                if (typeof orgId === 'object' && orgId !== null) {
                    orgId = orgId._id;
                }

                this.loading = true;
                const isAdmin = this.checkAdmin(this.user);
                
                try {
                    await this.$store.dispatch('Forms/getByUser', {
                        userId: this.user._id,
                        organizationId: orgId,
                        isAdmin: isAdmin
                    });
                } finally {
                    this.loading = false;
                }
            } else {
                console.warn("[ManageForms.vue] User context not fully resolved. Postponing fetch.");
            }
        },
        checkAdmin(user) {
            if (user && user.role) {
                const role = user.role;
                if (Array.isArray(role.title)) {
                    return role.title.some(t => t && t.value && t.value.toLowerCase().includes('admin'));
                } else if (typeof role.title === 'string') {
                    return role.title.toLowerCase().includes('admin');
                }
            }
            return false;
        }
    },
    computed: {
        ...mapGetters('Forms', ['forms']),
        ...mapGetters('User', ['user']),
        filteredForms() {
            let raw = this.forms || [];
            const currentUserId = this.user ? this.user._id : null;

            // 1. Identify Admin
            const isAdmin = this.checkAdmin(this.user);

            // 2. Responsibility Filter
            if (currentUserId && !isAdmin) {
                return raw.filter(f => {
                    if (!f) return false;
                    
                    // Creator check
                    const creatorId = f.creator && typeof f.creator === 'object' ? f.creator._id : f.creator;
                    if (String(creatorId) === String(currentUserId)) return true;

                    // Collaborator check
                    if (Array.isArray(f.collaborator)) {
                        if (f.collaborator.some(c => {
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
