<template>
  <div class="email-templates-container">
    <Header 
      :title="$t('email.title')" 
      :description="$t('email.description')" 
    />
    <div>
      <CRow>
        <CCol v-for="(template, index) in templates" :key="index" sm="12" md="6" lg="4" xl="3" class="mb-4">
          <CCard class="template-card h-100">
            <CCardBody class="d-flex flex-column p-4">
              <div class="icon-wrapper mb-4">
                <div class="icon-box">
                  <CIcon :name="template.icon" size="xl" />
                </div>
              </div>
              
              <h4 class="template-title mb-2">{{ template.name }}</h4>
              <p class="template-description text-muted mb-4">{{ template.description }}</p>
              
              <div class="mt-auto">
                <hr class="divider mb-4" />
                <div class="d-flex justify-content-between align-items-center">
                  <div class="modified-info">
                    <div class="label text-uppercase text-muted">{{ $t('email.lastModified') }}</div>
                    <div class="date font-weight-bold">{{ template.lastModified }}</div>
                  </div>
                  <CButton variant="outline" class="edit-btn px-3 py-2" style="border-radius: 8px;" @click="editTemplate(template)">
                    <CIcon name="cil-pencil" class="mr-2" />
                    <span class="font-weight-bold">{{ $t('email.edit') }}</span>
                  </CButton>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
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
      const currentLang = this.$i18n.locale || 'en';
      return this.item.map(t => {
        let nameObj = t.name.find(n => n.key === currentLang) || t.name.find(n => n.key === 'en') || t.name[0] || {};
        let displayTitle = nameObj.value || t.code;
        
        let displayDesc = '';
        if (t.code && this.$te(`email.templates.${t.code}.desc`)) {
          displayDesc = this.$t(`email.templates.${t.code}.desc`);
        } else {
          let nameObjTh = t.name.find(n => n.key === 'th') || {};
          displayDesc = nameObjTh.value || '';
        }

        // Simple formatting for date
        let date = new Date(t.updatedAt || t.createdAt);
        let dateString = date.toLocaleDateString(currentLang === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  background-color: #ffffff;
}

.template-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.icon-box {
  width: 52px;
  height: 52px;
  background-color: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.template-title {
  color: #1e293b;
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.template-description {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #64748b !important;
}

.divider {
  border: 0;
  border-top: 1px solid #f1f5f9;
  margin: 0;
}

.modified-info .label {
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.modified-info .date {
  font-size: 1rem;
  color: #1e293b;
}

.edit-btn {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background-color: #f8fafc;
  border-color: #cbd5e1;
  color: #000000;
}
</style>
