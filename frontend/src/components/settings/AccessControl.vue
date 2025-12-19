<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  whoCanRespond: { type: String, default: 'anyone' },
  collaborators: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:whoCanRespond', 'update:collaborators', 'add-collaborator', 'remove-collaborator'])

const accessOptions = [
  { value: 'anyone', label: 'Anyone with the link' },
  { value: 'organization', label: 'Only people in my organization' },
  { value: 'specific', label: 'Specific people only' }
]

const roleOptions = ['Editor', 'Viewer']

const updateCollaboratorEmail = (id, email) => {
  const updated = props.collaborators.map(c => 
    c.id === id ? { ...c, email } : c
  )
  emit('update:collaborators', updated)
}

const updateCollaboratorRole = (id, role) => {
  const updated = props.collaborators.map(c => 
    c.id === id ? { ...c, role } : c
  )
  emit('update:collaborators', updated)
}
</script>

<template>
  <div class="settings-section">
    <h3 class="section-title">Access Control</h3>
    <p class="section-description">Control who can access and respond to your form.</p>
    
    <div class="setting-row">
      <label class="input-label">Who can respond</label>
      <select 
        :value="whoCanRespond" 
        @change="emit('update:whoCanRespond', $event.target.value)"
        class="select-input"
      >
        <option v-for="option in accessOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div class="collaborators-section">
      <label class="input-label">Collaborators</label>
      <div class="collaborator-list">
        <div v-for="collaborator in collaborators" :key="collaborator.id" class="collaborator-row">
          <input 
            type="email" 
            :value="collaborator.email"
            @input="updateCollaboratorEmail(collaborator.id, $event.target.value)"
            placeholder="Enter email address"
            class="collaborator-email"
          />
          <select 
            :value="collaborator.role"
            @change="updateCollaboratorRole(collaborator.id, $event.target.value)"
            class="collaborator-role"
          >
            <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
          </select>
          <button class="remove-collaborator-btn" @click="emit('remove-collaborator', collaborator.id)">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="4" x2="12" y2="12"></line>
              <line x1="12" y1="4" x2="4" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <button class="add-collaborator-btn" @click="emit('add-collaborator')">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="8" y1="4" x2="8" y2="12"></line>
          <line x1="4" y1="8" x2="12" y2="8"></line>
        </svg>
        Add Collaborator
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  padding: 24px;
}

.section-title {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.section-description {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  margin: 0 0 20px;
}

.setting-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.input-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.select-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select-input:focus {
  outline: none;
  border-color: #6366f1;
}

.collaborators-section {
  margin-top: 16px;
}

.collaborator-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.collaborator-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.collaborator-email {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
}

.collaborator-email:focus {
  outline: none;
  border-color: #6366f1;
}

.collaborator-role {
  width: 100px;
  padding: 10px 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #333;
  background: #fff;
  cursor: pointer;
}

.remove-collaborator-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}

.remove-collaborator-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.remove-collaborator-btn svg {
  width: 16px;
  height: 16px;
}

.add-collaborator-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: 1px dashed #ccc;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.add-collaborator-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f5f5ff;
}

.add-collaborator-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 640px) {
  .collaborator-row {
    flex-wrap: wrap;
  }
  
  .collaborator-email {
    flex: 1 1 100%;
  }
}
</style>
