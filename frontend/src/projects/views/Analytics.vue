<template>
  <div>
    <CRow>
        <CCol lg="12">
            <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')">
                <template #actions>
                    <CButtonGroup>
                        <CButton :color="timeRange === '1d' ? 'primary' : 'outline-primary'" @click="timeRange = '1d'">{{ $t('analytics.today') }}</CButton>
                        <CButton :color="timeRange === '7d' ? 'primary' : 'outline-primary'" @click="timeRange = '7d'">{{ $t('analytics.oneWeek') }}</CButton>
                        <CButton :color="timeRange === '30d' ? 'primary' : 'outline-primary'" @click="timeRange = '30d'">{{ $t('analytics.oneMonth') }}</CButton>
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

export default {
    name: "Dashboard",
    components: {
        AdminLineCharts,
        WidgetsDropdown,
        AdminTables,
        AdminDoughnutCharts,
        AdminBarCharts,
        Header
    },
    data() {
        return {
            timeRange: '30d'
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
            this.$store.dispatch('User/getAll');
        },
        handleTimeRangeChange(newRange) {
            this.timeRange = newRange;
        }
    },
    computed: {
    },
    watch: {
        forms: {
            handler(val) {
            },
            deep: true,
            immediate: true
        }
    }
  },
  created() {
    this.onInit();
  },
  methods: {
    onInit() {
      this.$store.dispatch('Forms/get');
      this.$store.dispatch('User/getAll');
      this.$store.dispatch('Organizations/getAll');
    }
  }
}
</script>

<style scoped>
</style>
