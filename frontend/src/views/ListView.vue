<template>
  <div class="list-view">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="navbar-container">
        <router-link to="/" class="navbar-logo-link">
          <div class="navbar-logo-icon">
            <img src="https://archives.mfu.ac.th/wp-content/uploads/2019/06/Mae-Fah-Luang-University-2-1.png" alt="MFU Logo" class="logo-image" />
          </div>
          <span class="navbar-logo-text">FormBuilder</span>
        </router-link>

        <div class="navbar-user-section">
          <span class="navbar-user-email">{{ userEmail }}</span>
          <button class="navbar-logout-btn" @click="handleLogout">
            <svg class="icon-16" viewBox="0 0 16 16" fill="none">
              <path d="M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6" stroke="#333333" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Logout</span>
          </button>
        </div>

        <button class="burger-menu" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Page Header -->
      <header class="page-header">
        <h1 class="page-heading">My Forms</h1>
        <p class="page-description">Create and manage your forms</p>
      </header>

      <!-- Toolbar -->
      <div class="toolbar">
        <!-- Search -->
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.66667" stroke="#A3A3A3" stroke-width="1.33333"/>
            <path d="M11.3333 11.3333L14 14" stroke="#A3A3A3" stroke-width="1.33333" stroke-linecap="round"/>
          </svg>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search forms..."
            v-model="searchQuery"
          >
        </div>

        <!-- Actions -->
        <div class="toolbar-actions">
          <div class="filter-dropdown" ref="filterDropdownRef">
            <button class="filter-btn" @click="toggleFilterDropdown">
              <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                <path d="M14 2.66667H2L6.66667 8.10667V12L9.33333 13.3333V8.10667L14 2.66667Z" stroke="#737373" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ filterLabel }}</span>
              <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#737373" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            
            <div v-if="showFilterDropdown" class="dropdown-menu">
              <button 
                class="dropdown-item" 
                :class="{ active: currentFilter === 'all' }"
                @click="selectFilter('all')"
              >
                All Status
              </button>
              <button 
                class="dropdown-item" 
                :class="{ active: currentFilter === 'open' }"
                @click="selectFilter('open')"
              >
                Open
              </button>
              <button 
                class="dropdown-item" 
                :class="{ active: currentFilter === 'draft' }"
                @click="selectFilter('draft')"
              >
                Draft
              </button>
            </div>
          </div>

          <button class="create-form-btn" @click="handleCreateForm">
            <svg class="icon-16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="#FAFAFA" stroke-width="1.33333" stroke-linecap="round"/>
            </svg>
            <span>Create Form</span>
          </button>
        </div>
      </div>

      <!-- Forms Grid -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <div v-else-if="filteredForms.length === 0" class="empty-state">
        <h3>No forms found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>

      <div v-else class="forms-grid">
        <div 
          v-for="form in filteredForms" 
          :key="form.id" 
          class="form-card"
          @click="handleFormClick(form.id)"
        >
          <!-- Card Header -->
          <div class="card-header">
            <div class="card-content">
              <a href="#" class="card-title" @click.prevent>
                {{ form.title }}
              </a>
              <p class="card-description">{{ form.description }}</p>
            </div>
            <button 
              class="card-menu-btn" 
              @click.stop="handleMenuClick(form.id, $event)"
            >
              <svg class="icon-16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="3" r="1" fill="#333333"/>
                <circle cx="8" cy="8" r="1" fill="#333333"/>
                <circle cx="8" cy="13" r="1" fill="#333333"/>
              </svg>
            </button>
          </div>

          <!-- Badges -->
          <div class="card-badges">
            <span :class="['badge', `badge-${form.status}`]">
              {{ form.status === 'open' ? 'Open' : 'Draft' }}
            </span>
            <span :class="['badge', `badge-${form.visibility}`]">
              {{ form.visibility === 'public' ? 'Public' : 'Private' }}
            </span>
          </div>

          <!-- Footer -->
          <div class="card-footer">
            <span class="card-date">Created {{ form.createdDate }}</span>
            <span class="card-responses">
              <strong>{{ form.responses }}</strong>
              <span>responses</span>
            </span>
          </div>

          <!-- Preview -->
          <div v-if="form.hasPreview" class="card-preview">
            <div class="form-preview-container">
              <div class="preview-header">
                <div class="preview-title">{{ form.title }}</div>
                <div class="preview-description">{{ form.description }}</div>
              </div>
              <div class="preview-questions">
                <div class="preview-question">
                  <div class="preview-label">Question 1</div>
                  <div class="preview-input"></div>
                </div>
                <div class="preview-question">
                  <div class="preview-label">Question 2</div>
                  <div class="preview-options">
                    <div class="preview-radio"></div>
                    <div class="preview-radio"></div>
                    <div class="preview-radio"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="statistics">
        <div class="stat-item">
          <strong>{{ statistics.totalForms }}</strong>
          <span> total forms</span>
        </div>
        <div class="stat-item">
          <strong>{{ statistics.activeForms }}</strong>
          <span> active</span>
        </div>
        <div class="stat-item">
          <strong>{{ statistics.totalResponses }}</strong>
          <span> total responses</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Data
const userEmail = ref('user@example.com');
const searchQuery = ref('');
const currentFilter = ref('all');
const loading = ref(false);
const showFilterDropdown = ref(false);
const filterDropdownRef = ref(null);

const forms = ref([
  {
    id: 1,
    title: "Customer Satisfaction Survey",
    description: "Help us improve our services by sharing your feedback",
    status: "open",
    visibility: "public",
    createdDate: "15/11/2024",
    responses: 156,
    hasPreview: true,
    questions: [
      {
        id: 1,
        label: "What is your name?",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "How satisfied are you with our service?",
        type: "radio",
        required: true,
        options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
      },
      {
        id: 3,
        label: "Rate your overall experience",
        type: "rating",
        required: true
      },
      {
        id: 4,
        label: "What can we do to improve?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 2,
    title: "Event Registration Form",
    description: "Register for our upcoming webinar on December 15th",
    status: "open",
    visibility: "public",
    createdDate: "10/11/2024",
    responses: 89,
    hasPreview: true,
    questions: [
      {
        id: 1,
        label: "Full Name",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "Email Address",
        type: "text",
        required: true
      },
      {
        id: 3,
        label: "Which session are you interested in?",
        type: "radio",
        required: true,
        options: ["Morning Session (9:00 AM)", "Afternoon Session (2:00 PM)", "Both Sessions"]
      },
      {
        id: 4,
        label: "Any dietary restrictions?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: 3,
    title: "Employee Feedback Q4 2024",
    description: "Internal feedback survey for team members",
    status: "draft",
    visibility: "private",
    createdDate: "01/12/2024",
    responses: 0,
    hasPreview: true,
    questions: [
      {
        id: 1,
        label: "Employee ID",
        type: "text",
        required: true
      },
      {
        id: 2,
        label: "How would you rate the work environment?",
        type: "rating",
        required: true
      },
      {
        id: 3,
        label: "What improvements would you suggest?",
        type: "textarea",
        required: true
      }
    ]
  }
]);

// Computed
const filteredForms = computed(() => {
  return forms.value.filter(form => {
    const matchesSearch = 
      form.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const matchesFilter = 
      currentFilter.value === 'all' || 
      form.status === currentFilter.value;
    
    return matchesSearch && matchesFilter;
  });
});

const filterLabel = computed(() => {
  const labels = {
    all: 'All Status',
    open: 'Open',
    draft: 'Draft'
  };
  return labels[currentFilter.value] || 'All Status';
});

const statistics = computed(() => ({
  totalForms: forms.value.length,
  activeForms: forms.value.filter(f => f.status === 'open').length,
  totalResponses: forms.value.reduce((sum, f) => sum + f.responses, 0)
}));

// Methods
const toggleFilterDropdown = () => {
  showFilterDropdown.value = !showFilterDropdown.value;
};

const selectFilter = (filter) => {
  currentFilter.value = filter;
  showFilterDropdown.value = false;
};

const handleClickOutside = (event) => {
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(event.target)) {
    showFilterDropdown.value = false;
  }
};

const handleFormClick = (formId) => {
  console.log('Form clicked:', formId);
  router.push({ name: 'FormPreview', params: { id: formId } });
};

const handleMenuClick = (formId, event) => {
  console.log('Menu clicked:', formId);
};

const handleCreateForm = () => {
  console.log('Create form');
  // router.push({ name: 'FormBuilder' });
};

const handleLogout = () => {
  if (confirm('Are you sure you want to logout?')) {
    console.log('Logging out...');
  }
};

const toggleMenu = () => {
  console.log('Toggle mobile menu');
};

// Lifecycle
onMounted(() => {
  loading.value = false;
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ==================== BASE ==================== */
.list-view {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background: #FAFAFA;
  font-family: 'Inter', sans-serif;
}

/* ==================== NAVBAR ==================== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E5E5;
  z-index: 1000;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1216px;
  height: 64px;
  margin: 0 auto;
  padding: 0;
}

.navbar-logo-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.navbar-logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.navbar-logo-text {
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #1A1A1A;
}

.navbar-user-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-user-email {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #525252;
}

.navbar-logout-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.navbar-logout-btn:hover {
  background: #F5F5F5;
}

.burger-menu {
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.burger-menu span {
  width: 24px;
  height: 2px;
  background: #000000;
  border-radius: 20px;
}

/* ==================== MAIN CONTENT ==================== */
.main-content {
  max-width: 1216px;
  margin: 0 auto;
  padding: 97px 0 40px 0;
}

/* ==================== PAGE HEADER ==================== */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 32px;
}

.page-heading {
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  letter-spacing: -0.530859px;
  color: #333333;
  margin: 0;
}

.page-description {
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.3125px;
  color: #525252;
  margin: 0;
}

/* ==================== TOOLBAR ==================== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 8px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 914px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 4px 12px 4px 40px;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  outline: none;
}

.search-input:focus {
  border-color: #BA0C2F;
}

.search-input::placeholder {
  color: #737373;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  min-width: 140px;
  height: 36px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.filter-btn:hover {
  background: rgba(229, 229, 229, 0.5);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 140px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  z-index: 100;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #333333;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #F5F5F5;
}

.dropdown-item.active {
  background: rgba(23, 23, 23, 0.05);
  font-weight: 500;
}

.create-form-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  background: #171717;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #FAFAFA;
  cursor: pointer;
  transition: background-color 0.2s;
}

.create-form-btn:hover {
  background: #0a0a0a;
}

/* ==================== FORMS GRID ==================== */
.forms-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 389px));
  gap: 24px;
  margin-bottom: 40px;
  justify-content: flex-start;
}

.form-card {
  display: flex;
  flex-direction: column;
  padding: 25px 25px 1px;
  gap: 16px;
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.form-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-content {
  flex: 1;
}

.card-title {
  display: block;
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  letter-spacing: 0.0703125px;
  color: #333333;
  margin: 0 0 8px 0;
  text-decoration: none;
  transition: color 0.2s;
}

.card-title:hover {
  color: #BA0C2F;
}

.card-description {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #525252;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-menu-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.card-menu-btn:hover {
  background: #F5F5F5;
}

.card-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.badge {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 2px 8px;
  gap: 4px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
}

.badge-open {
  background: rgba(34, 197, 94, 0.1);
  color: #16A34A;
}

.badge-draft {
  background: #F5F5F5;
  color: #404040;
}

.badge-public {
  background: #FEE2E2;
  color: #9A0A27;
}

.badge-private {
  background: transparent;
  color: #333333;
  border: 1px solid #E5E5E5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #F5F5F5;
}

.card-date {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
  color: #737373;
}

.card-responses {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
}

.card-responses strong {
  color: #1A1A1A;
  font-weight: 400;
}

.card-responses span {
  color: #737373;
}

.card-preview {
  width: 100%;
  height: 167px;
  background: #FAFAFA;
  border-radius: 0px;
  overflow: hidden;
}

.form-preview-container {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: scale(0.85);
  transform-origin: top left;
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E5E5E5;
}

.preview-title {
  font-weight: 600;
  font-size: 11px;
  line-height: 14px;
  color: #333333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-description {
  font-size: 8px;
  line-height: 10px;
  color: #737373;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-questions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-question {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 8px;
  line-height: 10px;
  color: #525252;
  font-weight: 500;
}

.preview-input {
  width: 100%;
  height: 16px;
  background: rgba(229, 229, 229, 0.3);
  border: 1px solid #E5E5E5;
  border-radius: 4px;
}

.preview-options {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.preview-radio {
  display: flex;
  align-items: center;
  height: 12px;
  gap: 4px;
}

.preview-radio::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #D4D4D4;
  background: rgba(229, 229, 229, 0.3);
  flex-shrink: 0;
}

.preview-radio::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #E5E5E5;
}

/* ==================== STATISTICS ==================== */
.statistics {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px 0;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.150391px;
}

.stat-item strong {
  color: #1A1A1A;
  font-weight: 500;
}

.stat-item span {
  color: #525252;
}

/* ==================== LOADING & EMPTY ==================== */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E5E5;
  border-top-color: #BA0C2F;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #525252;
}

.empty-state h3 {
  font-size: 20px;
  margin-bottom: 8px;
  color: #333333;
}

/* ==================== UTILITIES ==================== */
.icon-16 {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1280px) {
  .forms-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 20px;
  }
  
  .main-content {
    padding: 97px 20px 40px 20px;
  }
  
  .burger-menu {
    display: flex;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-btn {
    flex: 1;
  }

  .create-form-btn {
    flex: 1;
  }
  
  .forms-grid {
    grid-template-columns: 1fr;
  }
  
  .page-heading {
    font-size: 28px;
    line-height: 36px;
  }
  
  .statistics {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 80px 16px 24px 16px;
  }
  
  .navbar-container {
    padding: 0 16px;
  }
  
  .navbar-user-email {
    display: none;
  }
  
  .form-card {
    padding: 20px 20px 1px;
  }

  .card-title {
    font-size: 20px;
    line-height: 28px;
  }

  .page-heading {
    font-size: 24px;
    line-height: 32px;
  }
}
</style>
