/**
 * useFormSettings - จัดการ Settings ของฟอร์ม
 */
import { ref } from 'vue'

export function useFormSettings() {
  const settings = ref({
    // สถานะฟอร์ม
    formStatus: 'draft',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',

    // การเข้าถึง
    whoCanRespond: 'anyone',
    collaborators: [
      { id: 1, email: 'tanakrit.a@mfu.ac.th', role: 'Editor' },
      { id: 2, email: 'somchai.w@mfu.ac.th', role: 'Viewer' }
    ],

    // ตั้งค่าการตอบกลับ
    collectEmails: false,
    limitResponses: false,
    maxResponses: 100,
    showProgressBar: true,

    // ข้อความยืนยัน
    confirmationMessage: 'Thank you for completing this survey. Your response has been recorded.',
    showAnotherResponseLink: true
  })

  /**
   * เพิ่ม collaborator
   */
  function addCollaborator() {
    const newId = settings.value.collaborators.length + 1
    settings.value.collaborators.push({ id: newId, email: '', role: 'Viewer' })
  }

  /**
   * ลบ collaborator
   */
  function removeCollaborator(id) {
    settings.value.collaborators = settings.value.collaborators.filter(c => c.id !== id)
  }

  /**
   * โหลด settings จาก form data
   */
  function loadSettings(form) {
    if (form.status) {
      settings.value.formStatus = form.status
    }

    // โหลด schedule
    if (form.schedule) {
      if (form.schedule.startAt) {
        const startDate = new Date(form.schedule.startAt)
        settings.value.startDate = startDate.toISOString().split('T')[0]
        settings.value.startTime = startDate.toTimeString().slice(0, 5)
      }
      if (form.schedule.endAt) {
        const endDate = new Date(form.schedule.endAt)
        settings.value.endDate = endDate.toISOString().split('T')[0]
        settings.value.endTime = endDate.toTimeString().slice(0, 5)
      }
    }

    // โหลด settings อื่นๆ
    if (form.settings) {
      const s = form.settings
      if (s.whoCanRespond !== undefined) settings.value.whoCanRespond = s.whoCanRespond
      if (s.collectEmails !== undefined) settings.value.collectEmails = s.collectEmails
      if (s.limitResponses !== undefined) settings.value.limitResponses = s.limitResponses
      if (s.maxResponses !== undefined) settings.value.maxResponses = s.maxResponses
      if (s.showProgressBar !== undefined) settings.value.showProgressBar = s.showProgressBar
      if (s.confirmationMessage !== undefined) settings.value.confirmationMessage = s.confirmationMessage
      if (s.showAnotherResponseLink !== undefined) settings.value.showAnotherResponseLink = s.showAnotherResponseLink
    }
  }

  /**
   * สร้าง schedule object สำหรับบันทึก
   */
  function buildSchedule() {
    const schedule = { startAt: null, endAt: null }
    if (settings.value.formStatus === 'auto') {
      if (settings.value.startDate && settings.value.startTime) {
        schedule.startAt = new Date(`${settings.value.startDate}T${settings.value.startTime}`).toISOString()
      }
      if (settings.value.endDate && settings.value.endTime) {
        schedule.endAt = new Date(`${settings.value.endDate}T${settings.value.endTime}`).toISOString()
      }
    }
    return schedule
  }

  /**
   * สร้าง settings object สำหรับบันทึก
   */
  function buildSettingsPayload() {
    return {
      whoCanRespond: settings.value.whoCanRespond,
      collectEmails: settings.value.collectEmails,
      limitResponses: settings.value.limitResponses,
      maxResponses: settings.value.maxResponses,
      showProgressBar: settings.value.showProgressBar,
      confirmationMessage: settings.value.confirmationMessage,
      showAnotherResponseLink: settings.value.showAnotherResponseLink
    }
  }

  return {
    settings,
    addCollaborator,
    removeCollaborator,
    loadSettings,
    buildSchedule,
    buildSettingsPayload
  }
}
