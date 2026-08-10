<template>
  <div>
    <CRow>
        <CCol lg="12">
            <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')">
                <template #actions>
                    <CButtonGroup class="analytics-filter-group">
                        <CButton 
                            :color="timeRange === 'all' ? 'primary' : 'secondary'"
                            :variant="timeRange === 'all' ? null : 'outline'"
                            style="border-radius: 8px;"
                            @click="timeRange = 'all'">{{ $t('table.quickDate.all') }}</CButton>
                        <CButton 
                            :color="timeRange === '1d' ? 'primary' : 'secondary'"
                            :variant="timeRange === '1d' ? null : 'outline'"
                            style="border-radius: 8px;"
                            @click="timeRange = '1d'">{{ $t('table.quickDate.today') }}</CButton>
                        <CButton 
                            :color="timeRange === '7d' ? 'primary' : 'secondary'"
                            :variant="timeRange === '7d' ? null : 'outline'"
                            style="border-radius: 8px;"
                            @click="timeRange = '7d'">{{ $t('table.quickDate.last7Days') }}</CButton>
                        <CButton 
                            :color="timeRange === '30d' ? 'primary' : 'secondary'"
                            :variant="timeRange === '30d' ? null : 'outline'"
                            style="border-radius: 8px;"
                            @click="timeRange = '30d'">{{ $t('table.quickDate.last30Days') }}</CButton>
                    </CButtonGroup>
                </template>
            </Header>
        </CCol>
    </CRow>

    <WidgetsDropdown class="mb-4" :timeRange="timeRange" />
    <SubmissionTrendChart :timeRange="timeRange" />
    <PopularFormsTable :timeRange="timeRange" />
  </div>
</template>

<script>
import Header from '../components/Util/Header.vue'
import WidgetsDropdown from '../components/widgets/WidgetsDropdown.vue'
import SubmissionTrendChart from '../components/analytics/SubmissionTrendChart.vue'
import PopularFormsTable from '../components/analytics/PopularFormsTable.vue'
import localeMixin from '@/mixins/localeMixin'
import { mapGetters } from 'vuex'

export default {
    name: "Analytics",
    mixins: [localeMixin],
    components: {
        Header,
        WidgetsDropdown,
        SubmissionTrendChart,
        PopularFormsTable
    },
    computed: {
        ...mapGetters('User', ['user'])
    },
    data() {
        return {
            timeRange: 'all'
        }
    },
    watch: {
        user: {
            handler(val) {
                if (val && val._id) {
                    this.onInit();
                }
            },
            immediate: true
        }
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
            this.$store.dispatch('User/getAll');
            this.$store.dispatch('Organizations/getAll');
        },
        handleTimeRangeChange(newRange) {
            this.timeRange = newRange;
        }
    }
}
</script>

<style scoped>
</style>
