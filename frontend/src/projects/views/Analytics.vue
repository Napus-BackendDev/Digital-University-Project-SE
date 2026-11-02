<template>
  <div>
    <CRow>
        <CCol lg="12">
            <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')">
                <template #actions>
                    <div class="analytics-segmented-control">
                        <button 
                            type="button"
                            class="segmented-btn"
                            :class="{ active: timeRange === 'all' }"
                            @click="timeRange = 'all'">{{ $t('table.quickDate.all') }}</button>
                        <button 
                            type="button"
                            class="segmented-btn"
                            :class="{ active: timeRange === '1d' }"
                            @click="timeRange = '1d'">{{ $t('table.quickDate.today') }}</button>
                        <button 
                            type="button"
                            class="segmented-btn"
                            :class="{ active: timeRange === '7d' }"
                            @click="timeRange = '7d'">{{ $t('table.quickDate.last7Days') }}</button>
                        <button 
                            type="button"
                            class="segmented-btn"
                            :class="{ active: timeRange === '30d' }"
                            @click="timeRange = '30d'">{{ $t('table.quickDate.last30Days') }}</button>
                    </div>
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
.analytics-segmented-control {
    display: inline-flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
}

.segmented-btn {
    border: none;
    background: transparent;
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
    border-radius: 8px;
    padding: 6px 14px;
    white-space: nowrap;
    transition: all 0.18s ease;
    cursor: pointer;
}

.segmented-btn:hover {
    color: #0f172a;
}

.segmented-btn.active {
    background: #ffffff;
    color: #8c1515;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
