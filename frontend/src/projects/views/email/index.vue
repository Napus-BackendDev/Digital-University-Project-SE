<template>
  <div class="email-templates-container">
    <Header 
      :title="($te && $te('nav.email')) ? $t('nav.email') : 'Email Templates'" 
      :description="($te && $te('email.description')) ? $t('email.description') : 'Manage and deploy system email notifications and responses.'" 
    />
    <div>
      <CRow v-if="templates && templates.length > 0">
        <CCol v-for="(template, index) in templates" :key="index" sm="12" md="6" lg="4" xl="3" class="mb-4">
          <CCard class="template-card h-100 border-0">
            <CCardBody class="d-flex flex-column p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <div class="icon-box">
                  <CIcon :name="template.icon" size="xl" />
                </div>
                <span class="system-badge">System</span>
              </div>
              
              <h5 class="template-title mb-2">{{ template.name }}</h5>
              <p class="template-description text-muted mb-4">{{ template.description }}</p>
              
              <div class="mt-auto">
                <hr class="divider mb-3" />
                <div class="d-flex justify-content-between align-items-center">
                  <div class="modified-info">
                    <div class="label text-uppercase text-muted">Last Modified</div>
                    <div class="date font-weight-bold">{{ template.lastModified }}</div>
                  </div>
                  <button class="btn edit-btn px-3 py-2" @click="editTemplate(template)">
                    <CIcon name="cil-pencil" class="mr-2" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard v-else class="empty-state-card border-0 py-5 text-center">
        <CCardBody>
          <div class="empty-icon-box mx-auto mb-3">
            <CIcon name="cil-envelope-closed" size="xl" />
          </div>
          <h5 class="font-weight-bold text-dark mb-1">ยังไม่มีเทมเพลตอีเมล</h5>
          <p class="text-muted small mb-0">รายการเทมเพลตอีเมลจะแสดงขึ้นที่นี่</p>
        </CCardBody>
      </CCard>
    </div>
  </div>
</template>

<script>
import Header from '../../components/Util/Header.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'EmailView',
  components: {
    Header
  },
  data() {
    return {
      iconMap: {
        'invitationCollaboration': 'cil-user-follow',
        'invitationOrganization': 'cil-building',
        'submissionConfirmation': 'cil-check-circle',
        'ResponseNotification': 'cil-bell'
      }
    }
  },
  computed: {
    ...mapGetters('Setting/emailTemplate', ['item']),
    templates() {
      if (!this.item) return [];
      return this.item.map(t => {
        let nameObjEn = (t.name && t.name.find(n => n.key === 'en')) || {};
        let nameObjTh = (t.name && t.name.find(n => n.key === 'th')) || {};
        
        let displayTitle = nameObjEn.value || t.code;
        let displayDesc = nameObjTh.value || '';

        let date = new Date(t.updatedAt || t.createdAt);
        let dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        return {
          _id: t._id,
          name: displayTitle,
          description: displayDesc,
          icon: this.iconMap[t.code] || 'cil-envelope-closed',
          lastModified: dateString
        }
      });
    }
  },
  mounted() {
    this.get();
  },
  methods: {
    ...mapActions('Setting/emailTemplate', ['get']),
    editTemplate(template) {
      this.$router.push({ name: 'EmailDetail', params: { id: template._id } })
    }
  }
}
</script>

<style scoped>
.template-card {
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #ffffff;
}

.template-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03);
  border-color: #cbd5e1 !important;
}

.icon-box {
  width: 48px;
  height: 48px;
  background-color: rgba(140, 21, 21, 0.08);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c1515;
  transition: transform 0.2s ease;
}

.template-card:hover .icon-box {
  transform: scale(1.05);
}

.system-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #64748b;
}

.template-title {
  color: #0f172a;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.015em;
  margin-top: 4px;
}

.template-description {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #64748b !important;
  min-height: 40px;
}

.divider {
  border: 0;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.modified-info .label {
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
}

.modified-info .date {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 600;
}

.edit-btn {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #334155;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.18s ease;
}

.edit-btn:hover {
  background-color: #fef2f2;
  border-color: rgba(140, 21, 21, 0.3);
  color: #8c1515;
}

.empty-state-card {
  background: white;
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px;
}

.empty-icon-box {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
