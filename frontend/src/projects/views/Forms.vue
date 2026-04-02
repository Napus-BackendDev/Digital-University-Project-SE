<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.forms')" :description="$t('table.header')" />
        <WidgetsDropdownUser :stats="stats" @filter="(status) => $refs.table.filterStatus(status)" />
        <FormTables ref="table" @update-stats="updateStats" />
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
            stats: { total: 0, pending: 0, completed: 0, inProgress: 0 }
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            if (this.user) {
                const isAdmin = this.checkAdmin(this.user);
                this.$store.dispatch('Forms/get', {
                    userId: this.user._id,
                    organizationId: this.user.organization ? (this.user.organization._id || this.user.organization) : null,
                    isAdmin: isAdmin
                });
            } else {
                this.$store.dispatch('Forms/get');
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
