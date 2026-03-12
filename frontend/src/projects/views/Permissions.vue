<template>
  <div class="flex-grow-1 permissions-page">
    <Header title="Permissions" description="Configure role-based access controls for each page and action" />

    <div class="mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <CInput v-model="searchQuery" placeholder="Search organization..." class="flex-grow-1">
          <template #prepend-content>
            <CIcon name="cil-magnifying-glass" class="text-muted" />
          </template>
        </CInput>
      </div>

      <div class="permissions-matrix bg-white rounded shadow-sm p-3">
        <div class="matrix-grid">
          <!-- Left header blank -->
          <div class="matrix-cell header-cell left-col"></div>

          <!-- Top headers: pages and actions -->
          <div v-for="page in pages" :key="page.key" class="matrix-cell header-cell page-header">
            <div class="page-title">{{ page.title }}</div>
            <div class="actions">
              <span v-for="action in page.actions" :key="action" class="action-pill">{{ action }}</span>
            </div>
          </div>

          <!-- Rows: organizations -->
          <template v-for="org in filteredOrgs" :key="org._id || org.value || org.key">
            <!-- org cell -->
            <div class="matrix-cell role-cell">
              <div class="role-row d-flex align-items-center">
                <div class="avatar mr-3">{{ getInitial(org) }}</div>
                <div>
                  <div class="font-weight-bold">{{ getLabel(org) }}</div>
                  <div class="text-muted small">{{ getMeta(org) }}</div>
                </div>
              </div>
            </div>

            <!-- permission toggles per page -->
            <div v-for="page in pages" :key="(org._id || org.value || org.key) + '-' + page.key"
              class="matrix-cell permissions-cell">
              <div class="d-flex justify-content-between align-items-center w-100">
                <label v-for="action in page.actions" :key="action" class="switch" :title="action">
                  <input type="checkbox" v-model="permissions[getOrgKey(org)][page.key][action]" />
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/Util/Header.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'Permissions',
  components: { Header },
  data() {
    const pages = [
      { key: 'forms', title: 'Forms Page', actions: ['Create', 'Edit', 'Delete', 'View'] },
      { key: 'manage', title: 'Manage Forms Page', actions: ['Create', 'Edit', 'Delete', 'View'] },
      { key: 'analytics', title: 'Analytics Page', actions: ['Create', 'Edit', 'Delete', 'View'] }
    ];

    return {
      searchQuery: '',
      pages,
      orgs: [],
      permissions: {}
    };
  },
  computed: {
    ...mapGetters({
      orgStore: 'organization/organization'
    }),
    filteredOrgs() {
      const q = (this.searchQuery || '').toLowerCase().trim();
      if (!q) return this.orgs;
      return this.orgs.filter(o => (this.getLabel(o) || '').toLowerCase().includes(q) || (this.getMeta(o) || '').toLowerCase().includes(q));
    }
  },
  methods: {
    buildPermissionsFor(orgKey) {
      const obj = {};
      this.pages.forEach(p => {
        obj[p.key] = {};
        p.actions.forEach(a => { obj[p.key][a] = false; });
      });
      return obj;
    },
    getOrgKey(org) {
      return org._id || org.value || org.key || (org.name || org.label || '').toString();
    },
    getLabel(org) {
      return org.label || org.name || (typeof org === 'string' ? org : 'Unknown');
    },
    getMeta(org) {
      return org.meta || (org.members ? org.members + ' members' : '');
    },
    getInitial(org) {
      const label = this.getLabel(org) || '';
      return label.charAt(0).toUpperCase();
    },
    initFromStore() {
      const data = this.orgStore || [];
      if (!Array.isArray(data) || data.length === 0) {
        // fallback: sample orgs
        this.orgs = [
          { key: 'everyone', label: 'Everyone', meta: '150 members' },
          { key: 'admin', label: 'Admin', meta: '5 members' },
          { key: 'developer', label: 'Developer', meta: '12 members' }
        ];
      } else {
        // unify items
        this.orgs = data.map(o => o);
      }

      // initialize permissions map
      this.permissions = {};
      this.orgs.forEach(o => {
        const k = this.getOrgKey(o);
        this.$set(this.permissions, k, this.buildPermissionsFor(k));
      });
    }
  },
  created() {
    // try to load organizations from store
    try {
      this.$store.dispatch('organization/organization', {});
    } catch (e) {
      // ignore
    }
    this.initFromStore();
  },
  watch: {
    orgStore(val) {
      this.initFromStore();
    }
  }
};
</script>

<style scoped>
.text-muted {
  color: #6b7280;
}

.permissions-matrix {
  overflow: auto;
}

.matrix-grid {
  display: grid;
  grid-template-columns: 260px repeat(3, 1fr);
  gap: 12px;
  align-items: start;
}

.matrix-cell {
  padding: 12px;
  min-height: 72px;
  display: flex;
  align-items: center;
}

.header-cell {
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.page-header .page-title {
  font-weight: 700;
  color: #334155;
}

.action-pill {
  display: inline-block;
  margin-right: 6px;
  margin-top: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  color: #475569;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #4c1d95;
}

.permissions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  display: none
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  border-radius: 999px;
  transition: .15s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: .15s;
}

.switch input:checked+.slider {
  background: #dc2626
}

.switch input:checked+.slider:before {
  transform: translateX(20px)
}
</style>
