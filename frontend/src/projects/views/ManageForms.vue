<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.manage')" :description="$t('description')" :showCreateButton="true" />
        <WidgetsManageForms :forms="filteredForms" @filter="(status) => $refs.table.filterStatus(status)" />
        
        <ManagementTables ref="table" :items="filteredForms" :loading="loading" />
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
        const userId = this.user ? (this.user._id || this.user.id) : null;
        if (userId) {

            await this.onInit();
        } else {

        }
    },
    watch: {
        user: {
            handler(val, oldVal) {


                const newId = val ? (val._id || val.id) : null;
                const oldId = oldVal ? (oldVal._id || oldVal.id) : null;

                // Only trigger if user ID has actually changed to avoid redundant calls
                if (newId && (!oldId || newId !== oldId)) {

                    this.onInit();
                }
            },
            immediate: false
        }
    },
    methods: {
        async onInit() {
            const userId = this.user ? (this.user._id || this.user.id) : null;

            
            // Check if user and its essential nested data (organization) are ready
            if (userId) {
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
                        userId: userId,
                        organizationId: orgId,
                        isAdmin: isAdmin,
                        mode: 'manage'
                    });
                    this.loading = false;
                    // Background non-blocking response counts fetch
                    this.$store.dispatch('Responses/exp').catch(e => console.error("[ManageForms.vue] Background responses sync error:", e));
                } catch (err) {
                    console.error("[ManageForms.vue] Error fetching forms:", err);
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

            const currentUserId = this.user ? (this.user._id || this.user.id) : null;

            // 1. Identify Admin
            const isAdmin = this.checkAdmin(this.user);

            // 2. Responsibility Filter
            // Non-admin users in Manage Forms can ONLY see forms they created or collaborate on
            if (currentUserId && !isAdmin) {
                const filtered = raw.filter(f => {
                    if (!f) return false;
                    
                    const creatorId = f.creator && typeof f.creator === 'object' ? (f.creator._id || f.creator.id) : f.creator;
                    const isCreator = String(creatorId) === String(currentUserId);
                    if (isCreator) return true;

                    // Collaborator check
                    if (Array.isArray(f.collaborator)) {
                        return f.collaborator.some(c => {
                            const collabUserId = c.user && typeof c.user === 'object' ? (c.user._id || c.user.id) : c.user;
                            return String(collabUserId) === String(currentUserId);
                        });
                    }

                    return false;
                });

                return filtered;
            }

            return raw;
        }
    }
}
</script>
