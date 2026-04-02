<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.forms')" :description="$t('table.header')" />
        <WidgetsDropdownUser :stats="stats" @filter="(status) => $refs.table.filterStatus(status)" />
        
        <div v-if="loading" class="text-center py-5">
            <CSpinner color="primary" variant="grow" />
            <div class="mt-2 text-muted">{{ $t('common.loading') }}</div>
        </div>
        <FormTables v-else ref="table" @update-stats="updateStats" />
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
            stats: { total: 0, pending: 0, completed: 0, inProgress: 0 }
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
        }
    },
    computed: {
        ...mapGetters('User', ['user'])
    }
}
</script>

<style scoped></style>
