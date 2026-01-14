/**
 * useFormStatus - Composable สำหรับจัดการสถานะของฟอร์มแบบ dynamic
 * รองรับการแสดงสถานะ Auto ที่เปลี่ยนเป็น Open/Closed ตามเวลาที่ตั้งไว้
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'

export function useFormStatus() {
    const currentTime = ref(new Date())
    let interval = null

    /**
     * คำนวณสถานะปัจจุบันของฟอร์ม
     * @param {object} form - ออบเจ็คฟอร์ม
     * @returns {string} สถานะปัจจุบัน (draft, open, close)
     */
    function getCurrentStatus(form) {
        if (!form) return 'draft'

        // ถ้าไม่ใช่โหมด auto ให้ใช้สถานะจาก database
        if (form.status !== 'auto') {
            return form.status
        }

        // ถ้าเป็นโหมด auto ให้คำนวณสถานะตามเวลา
        const now = currentTime.value
        const startAt = form.schedule?.startAt ? new Date(form.schedule.startAt) : null
        const endAt = form.schedule?.endAt ? new Date(form.schedule.endAt) : null

        // Debug logging
        console.log('Form Status Calculation:', {
            formTitle: form.title?.[0]?.value || 'Unknown',
            status: form.status,
            currentTime: now.toISOString(),
            startAt: startAt?.toISOString(),
            endAt: endAt?.toISOString(),
            hasSchedule: !!form.schedule
        })

        // ถ้าไม่มีการตั้งเวลา ให้แสดงเป็น draft
        if (!startAt && !endAt) {
            console.log('No schedule found, returning draft')
            return 'draft'
        }

        // ตรวจสอบว่าช่วงเวลาถูกต้องหรือไม่ (startAt ต้องมาก่อน endAt)
        if (startAt && endAt && startAt >= endAt) {
            console.log('Invalid schedule: start time is after end time, returning draft')
            return 'draft'
        }

        // ถ้ายังไม่ถึงเวลาเริ่ม
        if (startAt && now < startAt) {
            console.log('Before start time, returning draft')
            return 'draft'
        }

        // ถ้าเลยเวลาสิ้นสุดแล้ว
        if (endAt && now > endAt) {
            console.log('After end time, returning close')
            return 'close'
        }

        // ถ้าอยู่ในช่วงเวลาที่เปิด
        if (startAt && now >= startAt && (!endAt || now <= endAt)) {
            console.log('Within active time, returning open')
            return 'open'
        }

        console.log('Default case, returning draft')
        return 'draft'
    }

    /**
     * ได้ข้อความแสดงสถานะ
     * @param {object} form - ออบเจ็คฟอร์ม
     * @returns {string} ข้อความแสดงสถานะ
     */
    function getStatusText(form) {
        const status = getCurrentStatus(form)
        switch (status) {
            case 'open':
                return 'Open'
            case 'draft':
                return 'Draft'
            case 'close':
                return 'Closed'
            default:
                return 'Draft'
        }
    }

    /**
     * ได้คลาส CSS สำหรับสถานะ
     * @param {object} form - ออบเจ็คฟอร์ม
     * @returns {string} คลาส CSS
     */
    function getStatusClass(form) {
        const status = getCurrentStatus(form)
        return `status-${status}`
    }

    /**
     * เริ่มต้นการอัพเดทเวลาอัตโนมัติ
     */
    function startTimeUpdate() {
        // อัพเดททุกนาที
        interval = setInterval(() => {
            currentTime.value = new Date()
        }, 60000)
    }

    /**
     * หยุดการอัพเดทเวลาอัตโนมัติ
     */
    function stopTimeUpdate() {
        if (interval) {
            clearInterval(interval)
            interval = null
        }
    }

    // เริ่มการอัพเดทเวลาเมื่อ mount
    onMounted(() => {
        startTimeUpdate()
    })

    // หยุดการอัพเดทเวลาเมื่อ unmount
    onUnmounted(() => {
        stopTimeUpdate()
    })

    return {
        currentTime: computed(() => currentTime.value),
        getCurrentStatus,
        getStatusText,
        getStatusClass,
        startTimeUpdate,
        stopTimeUpdate
    }
}