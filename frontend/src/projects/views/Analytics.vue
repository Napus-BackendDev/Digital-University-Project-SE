<template>
  <div>
    <CRow>
        <CCol lg="12">
            <Header :title="$t('analytics.dailyResponsesTrend')" :description="$t('analytics.dailyResponsesDesc')">
                <template #actions>
                    <CButtonGroup>
                        <CButton :color="timeRange === '1d' ? 'primary' : 'outline-primary'" @click="timeRange = '1d'">Today</CButton>
                        <CButton :color="timeRange === '7d' ? 'primary' : 'outline-primary'" @click="timeRange = '7d'">1 Week</CButton>
                        <CButton :color="timeRange === '30d' ? 'primary' : 'outline-primary'" @click="timeRange = '30d'">1 Month</CButton>
                    </CButtonGroup>
                </template>
            </Header>
        </CCol>
    </CRow>

    <WidgetsDropdown class="mb-4" :timeRange="timeRange" />

    <!-- แถวที่ 2: Data Visualizations (กราฟ) -->
    <CRow class="mb-4">
      <!-- ฝั่งซ้าย: กราฟเส้น แสดงเทรนด์ -->
      <CCol lg="8" class="mb-4 mb-lg-0">
        <div class="response-trends-container h-100">
          <div class="header mb-4">
            <h4 class="m-0 font-weight-bold">Submission Activity Trend</h4>
            <div class="text-muted small mt-1">Overview of responses based on {{ timeRangeLabel }}</div>
          </div>
          <CChartLine
            :datasets="computedTrendChartData"
            :labels="computedTrendChartLabels"
            :options="trendChartOptions"
            style="height: 280px"
          />
        </div>
      </CCol>

      <!-- ฝั่งขวา: กราฟโดนัท สัดส่วนผู้ใช้งาน -->
      <CCol lg="4">
        <div class="response-trends-container h-100">
          <div class="header mb-4">
            <h4 class="m-0 font-weight-bold">Users by Role</h4>
            <div class="text-muted small mt-1">Distribution of active roles</div>
          </div>
          <CChartDoughnut
            :datasets="computedRoleChartData"
            :labels="['Students', 'Faculty', 'Admin']"
            :options="doughnutOptions"
            style="height: 280px"
          />
        </div>
      </CCol>
    </CRow>

    <!-- แถวที่ 3: Actionable Insights (ตารางฟอร์มยอดฮิต) -->
    <CRow>
      <CCol lg="12">
        <div class="response-trends-container">
          <div class="header mb-4">
            <h4 class="m-0 font-weight-bold">Top 5 Most Popular Forms</h4>
          </div>
          <CDataTable
            :items="computedTableItems"
            :fields="tableFields"
            hover
            class="mb-0 tables-container"
          >
            <!-- Form Name Slot -->
            <template #formName="{item}">
              <td class="py-3 pl-3 font-weight-bold text-dark">
                {{item.formName}}
              </td>
            </template>

            <!-- Responses Slot -->
            <template #responses="{item}">
              <td class="align-middle py-3">
                <div class="d-flex flex-column" style="gap: 4px;">
                  <div class="d-flex align-items-center">
                    <div class="response-icon-box text-success mr-2">
                      <CIcon name="cil-check" size="sm" />
                    </div>
                    <span class="font-weight-bold mr-1" style="font-size: 0.9rem;">{{ item.responses || 0 }}</span>
                    <span class="text-muted" style="font-size: 0.8rem;">Completed</span>
                  </div>
                  <div class="d-flex align-items-center">
                    <div class="response-icon-box text-primary mr-2">
                      <CIcon name="cil-history" size="sm" />
                    </div>
                    <span class="font-weight-bold mr-1" style="font-size: 0.9rem;">{{ item.ongoing || 0 }}</span>
                    <span class="text-muted" style="font-size: 0.8rem;">Ongoing</span>
                  </div>
                </div>
              </td>
            </template>

            <!-- Access Slot -->
            <template #access="{item}">
              <td class="align-middle py-3">
                <div class="access-stack">
                  <span v-for="(v, idx) in item.access" :key="idx" class="visibility-badge"
                        :class="getVisibilityClass(v)">
                    {{ v.startsWith('Personal: ') ? v.replace('Personal: ', '') : ($te('accessLabel.' + v.toLowerCase()) ? $t('accessLabel.' + v.toLowerCase()) : v) }}
                  </span>
                </div>
              </td>
            </template>

            <!-- Status Slot -->
            <template #status="{item}">
              <td class="align-middle py-3">
                <span class="status-badge" :class="getStatusClass(item.status)">
                  <span class="status-dot"></span>
                  {{item.status}}
                </span>
              </td>
            </template>
          </CDataTable>
        </div>
      </CCol>
    </CRow>
  </div>
</template>

<script>
import Header from '../components/Util/Header.vue'
import WidgetsDropdown from '../components/widgets/WidgetsDropdown.vue'
import { CChartLine, CChartDoughnut } from '@coreui/vue-chartjs'
import { mapGetters } from 'vuex'
import moment from 'moment'
import localeMixin from '@/mixins/localeMixin'

export default {
  name: 'AnalyticsDashboard',
  mixins: [localeMixin],
  components: {
    Header,
    WidgetsDropdown,
    CChartLine,
    CChartDoughnut
  },
  data () {
    return {
      timeRange: '7d',
      // ตั้งค่าแกนต่างๆ ของกราฟเส้น
      trendChartOptions: {
        maintainAspectRatio: false,
        legend: { display: false },
        tooltips: {
          backgroundColor: '#ffffff',
          titleFontColor: '#1e293b',
          bodyFontColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          xPadding: 16,
          yPadding: 12,
          displayColors: false,
          intersect: false,
          mode: 'index',
        },
        scales: {
          xAxes: [{
            gridLines: { display: false, drawBorder: false },
            ticks: { fontColor: '#64748b', maxTicksLimit: 7 }
          }],
          yAxes: [{
            gridLines: { color: '#f1f5f9', drawBorder: false, zeroLineColor: '#f1f5f9' },
            ticks: { beginAtZero: true, fontColor: '#64748b', maxTicksLimit: 5, padding: 10 }
          }]
        },
        elements: {
          point: { radius: 0, hitRadius: 10, hoverRadius: 4, hoverBorderWidth: 3 }
        }
      },
      doughnutOptions: {
        maintainAspectRatio: false,
        legend: { position: 'bottom', labels: { fontColor: '#64748b', padding: 20, usePointStyle: true } },
        cutoutPercentage: 75,
        tooltips: {
          backgroundColor: '#ffffff',
          titleFontColor: '#1e293b',
          bodyFontColor: '#475569',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          xPadding: 16,
          yPadding: 12,
        }
      },
      
      tableFields: [
        { key: 'formName', label: 'Form Name', _style: 'width:40%' },
        { key: 'access', label: 'Access' },
        { key: 'responses', label: 'Responses' },
        { key: 'lastCreate', label: 'Last Create' },
        { key: 'status', label: 'Status' }
      ]
    }
  },
  computed: {
    ...mapGetters('Forms', ['forms']),
    ...mapGetters('User', ['user', 'users']),
    ...mapGetters('Organizations', ['organizations']),

    timeRangeLabel() {
      if (this.timeRange === '1d') return 'Today';
      if (this.timeRange === '7d') return '7 Days';
      return '30 Days';
    },

    chartDataObj() {
      if (!this.forms || !this.user) return { labels: [], data: [] };

      // คัดเฉพาะ Form ที่สร้างโดย User ที่ล็อคอินอยู่
      const myForms = this.forms.filter(f => {
         const creatorId = f.creator && f.creator._id ? f.creator._id : f.creator;
         // ถ้าต้องการรวม admin อาจเว้นการเช็คตรงนี้ แต่ตามโจทย์คือจาก form ที่สร้างเอง
         return creatorId === this.user._id;
      });

      let formatStr = 'MMM DD';
      let loopCount = 0;
      let unit = 'days';
      
      if (this.timeRange === '1d') {
        formatStr = 'HH:00';
        loopCount = 24;
        unit = 'hours';
      } else if (this.timeRange === '7d') {
        loopCount = 7;
      } else if (this.timeRange === '30d') {
        loopCount = 30;
      }

      const dataMap = {};
      const labels = [];
      
      // สร้าง label แกน X ย้อนหลัง
      for (let i = loopCount - 1; i >= 0; i--) {
        const d = moment().subtract(i, unit);
        const key = d.format(formatStr);
        labels.push(key);
        dataMap[key] = 0;
      }

      // นับ Response
      myForms.forEach(f => {
        if (!f.responses) return;
        f.responses.forEach(r => {
           const isSubmitted = r && (r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true');
           if (!isSubmitted || !r.createdAt) return;

           const rDate = moment(r.createdAt);
           if (this.timeRange === '1d' && !rDate.isSame(moment(), 'day')) return;
           if (this.timeRange !== '1d' && rDate.isBefore(moment().subtract(loopCount, 'days'), 'day')) return;

           const key = rDate.format(formatStr);
           if (dataMap[key] !== undefined) {
             dataMap[key]++;
           }
        });
      });

      return { labels, data: labels.map(l => dataMap[l]) };
    },

    computedTrendChartData() {
      return [{
        label: 'Submissions',
        backgroundColor: 'rgba(50, 31, 219, 0.08)',
        borderColor: '#321fdb',
        pointBackgroundColor: '#321fdb',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#321fdb',
        borderWidth: 3,
        lineTension: 0.4,
        data: this.chartDataObj.data
      }];
    },

    computedTrendChartLabels() {
      return this.chartDataObj.labels;
    },

    computedRoleChartData() {
      if (!this.users) return [{ backgroundColor: ['#321fdb', '#39f3fd', '#f9b115'], borderWidth: 0, data: [0, 0, 0] }];
      
      let student = 0;
      let faculty = 0;
      let admin = 0;
      
      this.users.forEach(u => {
        const role = String(u.role || '').toLowerCase();
        if (role.includes('student') || role.includes('นักศึกษา')) student++;
        else if (role.includes('faculty') || role.includes('teacher') || role.includes('อาจารย์')) faculty++;
        else if (role.includes('admin')) admin++;
        else student++; // default fallback
      });

      return [{
        backgroundColor: ['#321fdb', '#39f3fd', '#f9b115'],
        borderWidth: 0,
        data: [student, faculty, admin]
      }];
    },

    computedTableItems() {
      if (!this.forms || !Array.isArray(this.forms)) return [];
      
      // ฟอลแบ็ค (Fallback): ถ้า user โหลดไม่ทัน ให้แสดฟอร์มทั้งหมดชั่วคราว
      const targetUserId = this.user && this.user._id ? this.user._id : null;
      const myForms = targetUserId
        ? this.forms.filter(f => {
            const creatorId = f.creator && f.creator._id ? f.creator._id : f.creator;
            return String(creatorId) === String(targetUserId);
          })
        : this.forms;
      
      const items = myForms.map(f => {
         // 1. ดึงชื่อฟอร์ม
         const formName = this.getLang(f.title) || this.$t('common.untitled') || 'Untitled Form';
         
         // 2. ดึง Access โทนเดียวกับ FormTables (Array Base)
         const rawOrgs = f.organization || [];
         let access = [];

         const orgNames = (Array.isArray(rawOrgs) ? rawOrgs : [rawOrgs]).map(o => {
             if (!o) return null;
             let orgObj = o;
             // Resolve raw MongoDB ObjectId to actual Organization object
             if (typeof o === 'string' && this.organizations) {
                 const found = this.organizations.find(x => String(x._id) === String(o));
                 if (found) orgObj = found;
             }
             
             if (typeof orgObj === 'string') return orgObj;
             if (typeof orgObj === 'object') {
                 if (Array.isArray(orgObj.title)) {
                     const locale = this.$i18n.locale.toLowerCase();
                     const localTitle = orgObj.title.find(t => t && t.key && t.key.toLowerCase() === locale);
                     return localTitle ? localTitle.value : (orgObj.title[0] ? orgObj.title[0].value : null);
                 }
                 return orgObj.name || orgObj.value || orgObj.title || null;
             }
             return null;
         }).filter(Boolean);

         const isPublicForm = orgNames.some(name => name === 'General' || name === 'ทั่วไป');

         if (isPublicForm) {
             access = ['Public'];
         } else if (orgNames.length > 0) {
             access = orgNames;
         } else {
             access = ['Private'];
         }

         if (f.settings && Array.isArray(f.settings.allowedUser) && f.settings.allowedUser.length > 0) {
             f.settings.allowedUser.forEach(u => {
                 access.push('Personal: ' + this.getUserName(u));
             });
         }
         
         // 3. ดู responses
         let responses = 0;
         let ongoing = 0;
         if (f.responses) {
            f.responses.forEach(r => {
               const isSubmitted = r && (r.submit === true || r.submit === 1 || String(r.submit).toLowerCase() === 'true');
               if (isSubmitted) responses++;
               else ongoing++;
            });
         }
         
         let status = 'Draft';
         const now = new Date();
         const schedule = f.schedule || (f.settings && f.settings.schedule);

         if (schedule && schedule.startAt) {
             const start = new Date(schedule.startAt);
             const end = new Date(schedule.endAt);

             if (!schedule.startAt && !schedule.endAt) {
                 status = 'Draft';
             } else if (start <= now && now <= end) {
                 status = 'Active';
             } else {
                 status = 'Closed';
             }
         } else if (f.status && f.status.title) {
           // กรณีไม่มี schedule ให้ใช้สถานะดิบ
           if (Array.isArray(f.status.title)) {
             status = f.status.title.find(t => t.key === 'en')?.value || f.status.title[0].value;
           } else {
             status = f.status.title;
           }
         }
         
         const lastCreate = f.createdAt ? moment(f.createdAt).format('YYYY-MM-DD') : '-';
         
         return {
            id: f._id,
            formName,
            access,
            responses,
            ongoing,
            lastCreate,
            status
         };
      });
      
      // เรียงตามจำนวนผู้ตอบกลับเยอะที่สุด
      items.sort((a, b) => b.responses - a.responses);
      
      return items.slice(0, 5);
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
    },
    // ฟังก์ชันจัดการสีสถานะรูปแบบใหม่
    getStatusClass(status) {
      const s = status ? String(status).toLowerCase() : '';
      if (s === 'active' || s.includes('open')) return 'status-active';
      if (s === 'closed') return 'status-closed';
      return 'status-pending';
    },
    // ฟังก์ชันช่วยดึงชื่อ User สำหรับ Personal access
    getUserName(userRef) {
      if (!userRef) return 'Unknown';
      if (typeof userRef === 'object' && userRef.email) return userRef.name || userRef.email;
      if (!this.users) return userRef;
      const u = this.users.find(x => String(x._id) === String(userRef));
      return u ? (u.name || u.email) : userRef;
    },
    // ฟังก์ชันจัดการสี Access
    getVisibilityClass(visibility) {
      if (!visibility) return 'visi-default';
      const v = String(visibility).toLowerCase();
      if (v.includes('public') || v.includes('สาธารณะ') || v === 'general') return 'visi-public';
      if (v.includes('private') || v.includes('ส่วนตัว')) return 'visi-private';
      if (v.includes('personal')) return 'visi-personal';
      return 'visi-org';
    }
  }
}
</script>

<style scoped>
.response-trends-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.tables-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0 !important;
    padding: 0;
    overflow: hidden;
}

.response-icon-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-color: #f1f5f9;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.35em 0.8em;
    border-radius: 50rem;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
}

.status-active {
    background-color: #d1fae5;
    color: #065f46;
}

.status-active .status-dot {
    background-color: #059669;
}

.status-pending {
    background-color: #fef9c3;
    color: #854d0e;
}

.status-pending .status-dot {
    background-color: #eab308;
}

.status-closed {
    background-color: #fee2e2;
    color: #991b1b;
}

.status-closed .status-dot {
    background-color: #dc2626;
}

.visibility-badge {
    display: inline-flex;
    padding: 0.25em 0.8em;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
}

.visi-public {
    background-color: #ecfdf5;
    color: #059669;
}

.visi-private {
    background-color: #fff1f2;
    color: #e11d48;
}

.visi-org {
    background-color: #f0f7ff;
    color: #1e40af;
}

.visi-default {
    background-color: #f1f5f9;
    color: #64748b;
}

.access-stack {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    max-height: 85px;
    overflow-y: auto;
    padding-right: 4px;
}

.access-stack::-webkit-scrollbar {
    width: 3px;
}

.access-stack::-webkit-scrollbar-track {
    background: transparent;
}

.access-stack::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}

.visi-personal {
    background-color: #f5f3ff;
    color: #7c3aed;
}
</style>
