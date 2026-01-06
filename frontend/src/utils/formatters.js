/**
 * Utility functions for formatting data
 * ฟังก์ชันสำหรับจัดรูปแบบข้อมูล
 */

/**
 * Format date string to readable format (DD/MM/YYYY, HH:MM)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '-'
  
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format date to short format (Mon DD, YYYY)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDateShort(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) return 'N/A'
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format response value based on question type
 * @param {object} answer - Answer object
 * @param {object} question - Question object
 * @returns {string} Formatted response
 */
export function formatResponse(answer, question) {
  if (!answer || answer.response === null || answer.response === undefined) {
    return '-'
  }

  const value = answer.response

  // Handle array (checkbox, multiple files)
  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    
    // For file uploads
    if (question?.type === 'file-upload' || question?.type === 'file') {
      return `${value.length} file(s)`
    }
    
    return value.join(', ')
  }

  // Handle object
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}
