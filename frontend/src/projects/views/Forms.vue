<template>
    <div class="flex-grow-1">
        <Header :title="$t('hero.formsTitle')" :description="$t('hero.formsDesc')" />

        <CAlert
            v-if="showDeniedNotice"
            :show="showDeniedNotice"
            color="warning"
            closeButton
            class="d-flex align-items-center shadow-sm mx-3 mb-3 p-3 text-dark"
            style="border-radius: 12px; font-weight: 500;"
            @update:show="onDismissDeniedNotice"
        >
            <CIcon name="cil-warning" class="mr-2 flex-shrink-0 text-warning" size="lg" />
            <span class="flex-grow-1">{{ $t('forms.manageDeniedNotice') }}</span>
        </CAlert>

        <WidgetsDropdownUser :stats="stats" @filter="(status) => $refs.table.filterStatus(status)" />
        
        <FormTables ref="table" :loading="loading" @update-stats="updateStats" />
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import FormTables from '../components/tables/FormTables.vue'
import WidgetsDropdownUser from '../components/widgets/WidgetsDropdownUser.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "Forms",
    components: {
        FormTables,
        WidgetsDropdownUser,
        Header
    },
    data() {
        return {
            loading: false,
            stats: { total: 0, pending: 0, completed: 0, inProgress: 0 },
            showDeniedNotice: false
        }
    },
    async created() {
        if (this.$route && this.$route.query && (this.$route.query.denied === 'manage' || this.$route.query.denied)) {
            this.showDeniedNotice = true;
        }
        // If user is already loaded, fetch forms immediately
        if (this.user && this.user._id) {
            await this.onInit();
        }
    },
    watch: {
        '$route.query.denied'(val) {
            if (val === 'manage' || val) {
                this.showDeniedNotice = true;
            }
        },
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
                this.$store.commit('Forms/clearForms');
                const isAdmin = this.checkAdmin(this.user);
                
                try {
                    await this.$store.dispatch('Forms/getByUser', {
                        userId: this.user._id,
                        organizationId: orgId,
                        isAdmin: isAdmin
                    });
                    this.loading = false;
                    // Background non-blocking responder status fetch
                    this.$store.dispatch('Responses/get', {
                        responder: this.user._id
                    }).catch(e => console.error("[Forms.vue] Background responses sync error:", e));
                } catch (err) {
                    console.error("[Forms.vue] Error fetching forms:", err);
                } finally {
                    this.loading = false;
                }
            } else {
                console.warn("[Forms.vue] User context not fully resolved. Postponing fetch.");
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
        },
        updateStats(newStats) {
            this.stats = newStats;
        },
        onDismissDeniedNotice(val) {
            this.showDeniedNotice = val;
            if (!val && this.$route && this.$route.query && this.$route.query.denied) {
                const query = { ...this.$route.query };
                delete query.denied;
                this.$router.replace({ query }).catch(() => {});
            }
        }
    },
    computed: {
        ...mapGetters('User', ['user'])
    }
}
</script>

<style scoped></style>
