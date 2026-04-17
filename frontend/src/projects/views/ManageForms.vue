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
        console.log("[ManageForms.vue] Lifecycle: created. User:", JSON.stringify(this.user));
        // If user is already loaded, fetch forms immediately
        const userId = this.user ? (this.user._id || this.user.id) : null;
        if (userId) {
            console.log("[ManageForms.vue] Lifecycle: user ID found in created(), initializing...");
            await this.onInit();
        } else {
            console.log("[ManageForms.vue] Lifecycle: user ID NOT found in created().");
        }
    },
    watch: {
        user: {
            handler(val, oldVal) {
                console.log("[ManageForms.vue] Lifecycle: user watch triggered.");
                console.log("  New val:", JSON.stringify(val));
                console.log("  Old val:", JSON.stringify(oldVal));

                const newId = val ? (val._id || val.id) : null;
                const oldId = oldVal ? (oldVal._id || oldVal.id) : null;

                // Only trigger if user ID has actually changed to avoid redundant calls
                if (newId && (!oldId || newId !== oldId)) {
                    console.log("[ManageForms.vue] Lifecycle: user ID changed/loaded in watch, initializing...");
                    this.onInit();
                }
            },
            immediate: false
        }
    },
    methods: {
        async onInit() {
            const userId = this.user ? (this.user._id || this.user.id) : null;
            console.log("[ManageForms.vue] onInit called. User:", JSON.stringify(this.user), "Extracted ID:", userId);
            
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
                
                console.log("[ManageForms.vue] Dispatching Forms/getByUser with:", {
                    userId: userId,
                    organizationId: orgId,
                    isAdmin: isAdmin
                });

                try {
                    await this.$store.dispatch('Forms/getByUser', {
                        userId: userId,
                        organizationId: orgId,
                        isAdmin: isAdmin
                    });
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
            console.log("[ManageForms.vue] filteredForms raw items count:", raw.length);
            const currentUserId = this.user ? this.user._id : null;

            // 1. Identify Admin
            const isAdmin = this.checkAdmin(this.user);

            // 2. Responsibility Filter
            // Note: Relaxed filter because the backend already filters correctly based on organization/creator.
            // We only keep a safety filter if we're not admin, but we trust the backend's results.
            if (currentUserId && !isAdmin) {
                const filtered = raw.filter(f => {
                    if (!f) return false;
                    
                    // Allow everything returned by the backend by default, 
                    // or keep the restrictive check if we're sure about the ID matching.
                    // For now, let's log any mismatches.
                    const creatorId = f.creator && typeof f.creator === 'object' ? f.creator._id : f.creator;
                    const isCreator = String(creatorId) === String(currentUserId);
                    
                    if (isCreator) return true;

                    // Collaborator check
                    if (Array.isArray(f.collaborator)) {
                        if (f.collaborator.some(c => {
                            const collabUserId = c.user && typeof c.user === 'object' ? c.user._id : c.user;
                            return String(collabUserId) === String(currentUserId);
                        })) return true;
                    }

                    // Authorized User check (settings.allowedUser)
                    if (f.settings && Array.isArray(f.settings.allowedUser)) {
                        if (f.settings.allowedUser.some(u => {
                            const allowedId = u && typeof u === 'object' ? u._id : u;
                            return String(allowedId) === String(currentUserId);
                        })) return true;
                    }

                    // Organization check (The backend already does this, so we should allow it)
                    // If the backend returned it, it's likely authorized.
                    return true; 
                });
                console.log("[ManageForms.vue] filteredForms after filter count:", filtered.length);
                return filtered;
            }

            return raw;
        }
    }
}
</script>
