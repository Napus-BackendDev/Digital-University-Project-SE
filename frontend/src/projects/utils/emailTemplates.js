const TEMPLATE_VARIABLE_LABELS = {
  FormTitle: { en: 'Form Title', th: 'ชื่อแบบสอบถาม' },
  FormName: { en: 'Form Title', th: 'ชื่อแบบสอบถาม' },
  Responder: { en: 'Responder Name', th: 'ชื่อผู้ตอบ' },
  ResponderName: { en: 'Responder Name', th: 'ชื่อผู้ตอบ' },
  UserName: { en: 'Recipient Name', th: 'ชื่อผู้รับ' },
  CollaboratorName: { en: 'Collaborator Name', th: 'ชื่อผู้ร่วมจัดการ' },
  InviterName: { en: 'Inviter Name', th: 'ชื่อผู้เชิญ' },
  OrganizationName: { en: 'Organization Name', th: 'ชื่อหน่วยงาน' },
  Organization: { en: 'Organization', th: 'หน่วยงาน' },
  ContactOrganization: { en: 'Form Contact Unit', th: 'หน่วยงานผู้รับผิดชอบฟอร์ม' },
  ContactEmail: { en: 'Form Contact Email', th: 'อีเมลติดต่อของฟอร์ม' },
  Permission: { en: 'Access Role', th: 'สิทธิ์การเข้าถึง' },
  SchedulePeriod: { en: 'Open & Close Dates', th: 'ช่วงวันเปิด-ปิดฟอร์ม' },
  OpenDate: { en: 'Open Date', th: 'วันเริ่มเปิดรับ' },
  CloseDate: { en: 'Closing Date', th: 'วันปิดรับคำตอบ' },
  QRCode: { en: 'Mobile QR Code', th: 'คิวอาร์โค้ดทำแบบสอบถาม' },
  SubmittedAt: { en: 'Submitted Time', th: 'วันเวลาที่ส่ง' },
  ReferenceNo: { en: 'Reference No.', th: 'เลขที่อ้างอิง' },
  EmailMessage: { en: 'Creator Thank-you Note', th: 'ข้อความจากผู้สร้างฟอร์ม' },
  InvitationLink: { en: 'Invitation Link', th: 'ลิงก์คำเชิญ' },
  DashboardLink: { en: 'Dashboard Link', th: 'ลิงก์หน้าแดชบอร์ด' },
  ManageURL: { en: 'Manage Form Link', th: 'ลิงก์จัดการแบบสอบถาม' },
  FormURL: { en: 'Responder Form Link', th: 'ลิงก์เข้าทำแบบสอบถาม' }
}

export const SAMPLE_FORM_URL = 'http://localhost:8080/forms/670000000000000000000001?mode=public'
export const SAMPLE_MANAGE_URL = 'http://localhost:8080/manage/670000000000000000000001'

export const SAMPLE_EMAIL_VALUES = {
  FormTitle: 'Course & Teaching Satisfaction Survey (1/2026)',
  FormName: 'Course & Teaching Satisfaction Survey (1/2026)',
  Responder: 'Somchai Jaidee',
  ResponderName: 'Somchai Jaidee',
  UserName: 'Napus Samuanpho',
  CollaboratorName: 'Dr. Suda Rakdee',
  InviterName: 'Napus Samuanpho',
  OrganizationName: 'School of Information Technology',
  Organization: 'School of Information Technology',
  ContactOrganization: 'School of Information Technology',
  ContactEmail: 'it-survey@mfu.ac.th',
  Permission: 'Editor',
  SchedulePeriod: '18 Nov 2026, 09:00 – 25 Nov 2026, 23:59',
  OpenDate: '18 Nov 2026, 09:00',
  CloseDate: '25 Nov 2026, 23:59',
  SubmittedAt: '14 Nov 2026, 09:30',
  ReferenceNo: 'REF-20261114-001',
  EmailMessage: 'Thank you for sharing your valuable feedback.',
  InvitationLink: SAMPLE_FORM_URL,
  DashboardLink: SAMPLE_MANAGE_URL,
  ManageURL: SAMPLE_MANAGE_URL,
  FormURL: SAMPLE_FORM_URL,
  QRCode: '__QR_PREVIEW__'
}

const SAMPLE_QR_PREVIEW_HTML = [
  '<div class="mfu-qr-preview-card" data-qr-preview="true" style="margin: 22px 0 8px; padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">',
  '<p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #8c1515; text-transform: uppercase; letter-spacing: 0.6px;">Scan QR Code via Mobile</p>',
  '<div style="display: inline-block; padding: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">',
  '<svg width="96" height="96" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sample QR Code" style="display:block;">',
  '<rect width="21" height="21" fill="#ffffff"/>',
  '<path fill="#1e293b" d="M1 1h6v6H1V1zm1 1v4h4V2H2zm1 1h2v2H3V3zm11-2h6v6h-6V1zm1 1v4h4V2h-4zm1 1h2v2h-2V3zM1 14h6v6H1v-6zm1 1v4h4v-4H2zm1 1h2v2H3v-2zM9 2h2v2H9V2zm2 2h2v2h-2V4zM9 6h2v2H9V6zm2 2h3v2h-3V8zM8 10h2v2H8v-2zm3 1h2v3h-2v-3zm3 0h2v2h-2v-2zm3-1h2v3h-2v-3zM2 9h3v2H2V9zm4 1h2v2H6v-2zm4 4h2v2h-2v-2zm3 1h2v2h-2v-2zm3 0h2v3h-2v-3zm-6 3h2v2h-2v-2zm4 1h2v1h-2v-1z"/>',
  '</svg>',
  '</div>',
  `<p style="margin: 8px 0 0; font-size: 11px; color: #64748b; word-break: break-all;">${SAMPLE_FORM_URL}</p>`,
  '</div>'
].join('')

export const DEFAULT_EMAIL_TEMPLATES = {
  ResponseNotification: {
    code: 'ResponseNotification',
    name: [
      { key: 'en', value: 'Response Notification' },
      { key: 'th', value: 'แจ้งเตือนเมื่อมีคำตอบใหม่' }
    ],
    title: {
      en: 'New Response Alert',
      th: 'แจ้งเตือนเมื่อมีคำตอบใหม่'
    },
    triggerDescription: {
      en: 'Sent to the questionnaire owner or collaborators whenever a respondent submits a response.',
      th: 'ส่งให้ผู้จัดทำหรือผู้ร่วมจัดการแบบสอบถามทันที เมื่อมีผู้ตอบส่งแบบสอบถามเข้ามาใหม่'
    },
    recipientPreview: {
      en: 'Form Owner (napus.dev@gmail.com)',
      th: 'เจ้าของแบบสอบถาม (napus.dev@gmail.com)'
    },
    subject: 'New response received for: {{FormTitle}}',
    bodyHtml:
      '<p>Dear <strong>{{UserName}}</strong>,</p>' +
      '<p>A new response has been submitted for your questionnaire <strong>{{FormTitle}}</strong> by <strong>{{Responder}}</strong>.</p>',
    highlightBox: {
      enabled: false,
      eyebrow: 'Submission Details',
      headline: '{{FormTitle}}',
      metaLine: 'Submitted by {{Responder}} · {{SubmittedAt}} (Ref: {{ReferenceNo}})'
    },
    ctaButton: {
      enabled: true,
      label: 'View in Dashboard',
      urlVar: '{{DashboardLink}}'
    },
    qrBlock: {
      enabled: false
    },
    variables: ['UserName', 'FormTitle', 'Responder', 'SubmittedAt', 'ReferenceNo', 'DashboardLink', 'ContactOrganization', 'ContactEmail'],
    linkOptions: [
      { value: '{{DashboardLink}}', en: 'Form Analytics / Manage Dashboard ({{DashboardLink}})', th: 'ลิงก์หน้าจัดการแบบสอบถาม ({{DashboardLink}})' },
      { value: '{{FormURL}}', en: 'Responder Form Page ({{FormURL}})', th: 'ลิงก์ทำแบบสอบถาม ({{FormURL}})' }
    ]
  },
  submissionConfirmation: {
    code: 'submissionConfirmation',
    name: [
      { key: 'en', value: 'Submission Confirmation' },
      { key: 'th', value: 'ยืนยันการส่งแบบสอบถาม' }
    ],
    title: {
      en: 'Submission Receipt',
      th: 'ยืนยันการส่งคำตอบสำเร็จ'
    },
    triggerDescription: {
      en: 'Sent to signed-in respondents as proof immediately after submitting a form.',
      th: 'ส่งให้ผู้ตอบทันทีหลังส่งแบบสอบถาม เพื่อยืนยันว่าระบบได้รับคำตอบเรียบร้อยแล้ว'
    },
    recipientPreview: {
      en: 'Respondent (somchai.j@mfu.ac.th)',
      th: 'ผู้ตอบแบบสอบถาม (somchai.j@mfu.ac.th)'
    },
    subject: 'Submission Confirmation: {{FormName}}',
    bodyHtml:
      '<p>Dear <strong>{{Responder}}</strong>,</p>' +
      '<p>Your response has been successfully submitted to <strong>{{FormName}}</strong>. This email confirms that our system has received your data.</p>' +
      '<p>Please keep this email for your records. Thank you for your participation.</p>',
    highlightBox: {
      enabled: true,
      eyebrow: 'Submission Receipt',
      headline: 'Reference No: {{ReferenceNo}}',
      metaLine: 'Submitted At: {{SubmittedAt}}'
    },
    ctaButton: {
      enabled: false,
      label: 'Open Form',
      urlVar: '{{FormURL}}'
    },
    qrBlock: {
      enabled: false
    },
    variables: ['Responder', 'FormName', 'ReferenceNo', 'SubmittedAt', 'EmailMessage', 'FormURL', 'ContactOrganization', 'ContactEmail'],
    linkOptions: [
      { value: '{{FormURL}}', en: 'Responder Form Link ({{FormURL}})', th: 'ลิงก์ทำแบบสอบถาม ({{FormURL}})' }
    ]
  },
  invitationOrganization: {
    code: 'invitationOrganization',
    name: [
      { key: 'en', value: 'Organization Form Invitation' },
      { key: 'th', value: 'เชิญตอบแบบสอบถามตามหน่วยงาน' }
    ],
    title: {
      en: 'Respondent Form Invite',
      th: 'เชิญผู้ตอบเข้าร่วมทำแบบสอบถาม'
    },
    triggerDescription: {
      en: 'Sent to targeted organization members or invited emails when publishing a Private form (includes fill link, schedule window, and mobile QR code).',
      th: 'ส่งถึงผู้ตอบตามหน่วยงานหรือรายชื่อที่กำหนดเมื่อเผยแพร่แบบสอบถาม Private (แนบลิงก์เข้าทำ ช่วงวันเปิด-หมดอายุ และ QR Code)'
    },
    recipientPreview: {
      en: 'Targeted Respondent (somchai.j@mfu.ac.th)',
      th: 'ผู้ตอบแบบสอบถามกลุ่มเป้าหมาย (somchai.j@mfu.ac.th)'
    },
    subject: 'New Form Invitation: {{FormTitle}}',
    bodyHtml:
      '<p>Dear <strong>{{ResponderName}}</strong>,</p>' +
      '<p>An official questionnaire from <strong>{{OrganizationName}}</strong> has been shared with you.</p>' +
      '<p>Your participation is valuable and helps us improve our university services.</p>',
    highlightBox: {
      enabled: true,
      eyebrow: 'New Questionnaire',
      headline: '{{FormTitle}}',
      metaLine: 'Schedule: {{SchedulePeriod}}'
    },
    ctaButton: {
      enabled: true,
      label: 'Open Questionnaire',
      urlVar: '{{InvitationLink}}'
    },
    qrBlock: {
      enabled: true
    },
    variables: [
      'ResponderName',
      'OrganizationName',
      'FormTitle',
      'SchedulePeriod',
      'OpenDate',
      'CloseDate',
      'InvitationLink',
      'FormURL',
      'QRCode',
      'ContactOrganization',
      'ContactEmail'
    ],
    linkOptions: [
      { value: '{{InvitationLink}}', en: 'Responder Form Link (/forms/:id?mode=public)', th: 'ลิงก์เข้าทำแบบสอบถาม (/forms/:id?mode=public)' },
      { value: '{{FormURL}}', en: 'Responder Form URL ({{FormURL}})', th: 'ลิงก์ทำแบบสอบถาม ({{FormURL}})' }
    ]
  },
  invitationCollaboration: {
    code: 'invitationCollaboration',
    name: [
      { key: 'en', value: 'Collaborator Invitation' },
      { key: 'th', value: 'คำเชิญร่วมจัดการแบบสอบถาม' }
    ],
    title: {
      en: 'Collaborator Access Invite',
      th: 'เชิญผู้ร่วมจัดการแบบสอบถาม'
    },
    triggerDescription: {
      en: 'Sent when a questionnaire owner grants Editor or Viewer management access (/manage/:id) to colleagues.',
      th: 'ส่งเมื่อเจ้าของฟอร์มเชิญผู้ร่วมจัดการแบบสอบถาม (Editor / Viewer) พร้อมลิงก์เข้าไปจัดการฟอร์ม (/manage/:id)'
    },
    recipientPreview: {
      en: 'Invited Collaborator (suda.r@mfu.ac.th)',
      th: 'ผู้ร่วมจัดการแบบสอบถาม (suda.r@mfu.ac.th)'
    },
    subject: 'Invitation to collaborate on: {{FormTitle}}',
    bodyHtml:
      '<p>Dear <strong>{{CollaboratorName}}</strong>,</p>' +
      '<p><strong>{{InviterName}}</strong> has invited you to manage and collaborate on the questionnaire <strong>{{FormTitle}}</strong> with <strong>{{Permission}}</strong> access.</p>' +
      '<p>You can review form questions, monitor submission progress, and manage settings together.</p>',
    highlightBox: {
      enabled: false,
      eyebrow: 'Collaboration Access',
      headline: '{{FormTitle}}',
      metaLine: 'Permission: {{Permission}} · Invited by {{InviterName}}'
    },
    ctaButton: {
      enabled: true,
      label: 'Manage Form',
      urlVar: '{{InvitationLink}}'
    },
    qrBlock: {
      enabled: false
    },
    variables: [
      'CollaboratorName',
      'InviterName',
      'FormTitle',
      'Permission',
      'ManageURL',
      'InvitationLink',
      'ContactOrganization',
      'ContactEmail'
    ],
    linkOptions: [
      { value: '{{InvitationLink}}', en: 'Manage Form Link (/manage/:id)', th: 'ลิงก์เข้าไปจัดการฟอร์ม (/manage/:id)' },
      { value: '{{ManageURL}}', en: 'Manage Dashboard URL ({{ManageURL}})', th: 'ลิงก์หน้าจัดการแบบสอบถาม ({{ManageURL}})' }
    ]
  }
}

export const TEMPLATE_ORDER = [
  'ResponseNotification',
  'submissionConfirmation',
  'invitationOrganization',
  'invitationCollaboration'
]

export function getTemplateMeta(code) {
  return DEFAULT_EMAIL_TEMPLATES[code] || DEFAULT_EMAIL_TEMPLATES.ResponseNotification
}

export function getDefaultTemplateDraft(code) {
  const meta = getTemplateMeta(code)
  return {
    code: meta.code,
    subject: meta.subject,
    bodyHtml: meta.bodyHtml,
    highlightBox: { ...meta.highlightBox },
    ctaButton: { ...meta.ctaButton },
    qrBlock: { enabled: Boolean(meta.qrBlock && meta.qrBlock.enabled) },
    variables: [...meta.variables]
  }
}

export function getLocalizedText(localized, locale = 'en') {
  if (!localized) return ''
  if (typeof localized === 'string') return localized
  if (Array.isArray(localized)) {
    const exact = localized.find((item) => item && item.key === locale && item.value)
    if (exact) return exact.value
    const en = localized.find((item) => item && item.key === 'en' && item.value)
    if (en) return en.value
    const first = localized.find((item) => item && item.value)
    return first ? first.value : ''
  }
  return localized[locale] || localized.en || localized.th || ''
}

export function getVariableDefinitions(code, extraVariables = []) {
  const meta = getTemplateMeta(code)
  const keys = Array.isArray(meta.variables) && meta.variables.length
    ? [...meta.variables]
    : [...(extraVariables || [])]

  return keys.map((key) => {
    const labels = TEMPLATE_VARIABLE_LABELS[key] || { en: key, th: key }
    let sample = SAMPLE_EMAIL_VALUES[key] || key
    if (key === 'InvitationLink') {
      sample = code === 'invitationCollaboration' ? SAMPLE_MANAGE_URL : SAMPLE_FORM_URL
    }
    return {
      key,
      token: `{{${key}}}`,
      en: labels.en,
      th: labels.th,
      sample
    }
  })
}

export function escapeHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function cleanParagraphNodes(nodes) {
  return nodes
    .map((node) => {
      if (node.nodeType === 3) {
        const text = node.textContent.trim()
        return text ? `<p>${escapeHtml(text)}</p>` : ''
      }
      if (node.nodeType !== 1) return ''
      return node.outerHTML
    })
    .filter(Boolean)
    .join('')
}

function isVariableLinkHref(href) {
  return /\{\{\s*(?:InvitationLink|DashboardLink|ManageURL|FormURL)\s*\}\}/i.test(String(href || ''))
}

function looksLikeQrContainer(el) {
  if (!el || el.nodeType !== 1 || el.tagName !== 'DIV') return false
  if (el.getAttribute('data-qr-section') === 'true' || el.getAttribute('data-qr-block') === 'true') {
    return true
  }
  return String(el.textContent || '').trim() === '{{QRCode}}'
}

function looksLikeCtaContainer(el, defaultUrlVar) {
  if (!el || el.nodeType !== 1) return null
  const anchor = el.tagName === 'A' ? el : (el.children.length === 1 && el.children[0].tagName === 'A' ? el.children[0] : null)
  if (!anchor) return null
  const anchorText = anchor.textContent.trim()
  const outerText = el.textContent.trim()
  if (!anchorText || outerText !== anchorText) return null

  const href = (anchor.getAttribute('href') || '').trim()
  const style = (anchor.getAttribute('style') || '').toLowerCase()
  const parentStyle = (el.getAttribute('style') || '').toLowerCase()
  const isButtonStyled = style.includes('background') || parentStyle.includes('text-align: center') || (el.className || '').includes('ql-align-center')

  if (isVariableLinkHref(href) || isButtonStyled) {
    return {
      enabled: true,
      label: anchorText,
      urlVar: isVariableLinkHref(href) ? href : (defaultUrlVar || '{{FormURL}}')
    }
  }
  return null
}

function looksLikeHighlightBox(el) {
  if (!el || el.nodeType !== 1 || el.tagName !== 'DIV') return null
  if (el.querySelector('a') && looksLikeCtaContainer(el, '')) return null

  const style = (el.getAttribute('style') || '').toLowerCase()
  if (!style.includes('background') && !style.includes('border-left') && !style.includes('border:')) {
    return null
  }

  const lines = Array.from(el.querySelectorAll('p, div'))
    .map((node) => node.textContent.trim())
    .filter(Boolean)

  if (!lines.length) {
    const rawText = el.textContent.trim()
    if (!rawText) return null
    return {
      enabled: true,
      eyebrow: '',
      headline: rawText,
      metaLine: ''
    }
  }

  if (lines.length === 1) {
    return {
      enabled: true,
      eyebrow: '',
      headline: lines[0],
      metaLine: ''
    }
  }

  if (lines[0].startsWith('Reference No:') || lines[0].includes('{{ReferenceNo}}')) {
    return {
      enabled: true,
      eyebrow: 'Submission Receipt',
      headline: lines[0],
      metaLine: lines.slice(1).join(' · ')
    }
  }

  return {
    enabled: true,
    eyebrow: lines[0],
    headline: lines[1],
    metaLine: lines.slice(2).join(' · ')
  }
}

export function parseEmailHtmlForEditor(html, code) {
  const defaults = getDefaultTemplateDraft(code)
  const rawHtml = String(html || '').trim()
  if (!rawHtml) {
    return defaults
  }

  const hasExplicitQrHidden = rawHtml.includes('<!-- qr-hidden -->')
  const hasExplicitQrToken = /\{\{\s*QRCode\s*\}\}/i.test(rawHtml)

  if (typeof DOMParser === 'undefined') {
    return {
      ...defaults,
      bodyHtml: rawHtml,
      qrBlock: {
        enabled: code === 'invitationOrganization' ? !hasExplicitQrHidden : hasExplicitQrToken
      }
    }
  }

  const doc = new DOMParser().parseFromString(`<div>${rawHtml}</div>`, 'text/html')
  const container = doc.body.firstElementChild
  const children = container ? Array.from(container.childNodes) : []

  let ctaButton = { ...defaults.ctaButton, enabled: false }
  let highlightBox = { ...defaults.highlightBox, enabled: false }
  let detectedQrBlock = false
  const proseNodes = []

  for (let i = 0; i < children.length; i += 1) {
    const node = children[i]
    if (node.nodeType !== 1) {
      if (node.nodeType === 3 && node.textContent.trim()) {
        proseNodes.push(node)
      }
      continue
    }

    if (looksLikeQrContainer(node)) {
      detectedQrBlock = true
      continue
    }

    const detectedCta = looksLikeCtaContainer(node, defaults.ctaButton.urlVar)
    if (detectedCta && !ctaButton.enabled) {
      ctaButton = detectedCta
      continue
    }

    const detectedHighlight = looksLikeHighlightBox(node)
    if (detectedHighlight && !highlightBox.enabled) {
      highlightBox = detectedHighlight
      continue
    }

    if (
      !highlightBox.enabled &&
      node.tagName === 'P' &&
      node.textContent.trim() === 'New Form' &&
      children[i + 1] &&
      children[i + 1].nodeType === 1 &&
      children[i + 1].textContent.trim().includes('{{FormTitle}}')
    ) {
      highlightBox = {
        enabled: true,
        eyebrow: 'New Form',
        headline: children[i + 1].textContent.trim(),
        metaLine: code === 'invitationOrganization' ? 'Schedule: {{SchedulePeriod}}' : ''
      }
      i += 1
      continue
    }

    proseNodes.push(node)
  }

  const bodyHtml = cleanParagraphNodes(proseNodes) || '<p></p>'
  const qrEnabled = code === 'invitationOrganization'
    ? !hasExplicitQrHidden && (detectedQrBlock || hasExplicitQrToken || !rawHtml.includes('<!-- qr-hidden -->'))
    : (detectedQrBlock || hasExplicitQrToken)

  return {
    code: defaults.code,
    bodyHtml,
    highlightBox,
    ctaButton,
    qrBlock: { enabled: qrEnabled },
    variables: defaults.variables
  }
}

export function serializeEditorToEmailHtml({ code, bodyHtml, highlightBox, ctaButton, qrBlock }) {
  const parts = []
  const cleanedBody = String(bodyHtml || '').trim()
  if (cleanedBody && cleanedBody !== '<p><br></p>') {
    parts.push(cleanedBody)
  }

  if (highlightBox && highlightBox.enabled) {
    const eyebrow = String(highlightBox.eyebrow || '').trim()
    const headline = String(highlightBox.headline || '').trim()
    const metaLine = String(highlightBox.metaLine || '').trim()

    if (eyebrow || headline || metaLine) {
      const inner = []
      if (eyebrow) {
        inner.push(
          `<p style="margin: 0; font-size: 12px; color: #8c1515; font-weight: bold; text-transform: uppercase;">${escapeHtml(eyebrow)}</p>`
        )
      }
      if (headline) {
        const marginTop = eyebrow ? '6px 0 0' : '0'
        inner.push(
          `<p style="margin: ${marginTop}; font-size: 16px; font-weight: bold; color: #0f172a;">${escapeHtml(headline)}</p>`
        )
      }
      if (metaLine) {
        inner.push(
          `<p style="margin: 6px 0 0; font-size: 13px; color: #475569;">${escapeHtml(metaLine)}</p>`
        )
      }
      parts.push(
        `<div style="padding: 16px 20px; background-color: #f8fafc; border-left: 4px solid #8c1515; border-radius: 8px; margin: 20px 0;">${inner.join('')}</div>`
      )
    }
  }

  if (ctaButton && ctaButton.enabled) {
    const label = escapeHtml(String(ctaButton.label || 'Open').trim() || 'Open')
    const urlVar = escapeHtml(String(ctaButton.urlVar || '{{FormURL}}').trim() || '{{FormURL}}')
    parts.push(
      '<div style="margin: 26px 0 8px; text-align: center;">' +
        `<a href="${urlVar}" style="background-color: #8c1515; color: #ffffff; padding: 12px 26px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">${label}</a>` +
      '</div>'
    )
  }

  if (qrBlock && qrBlock.enabled) {
    if (!parts.join('').includes('{{QRCode}}')) {
      parts.push('<div data-qr-section="true">{{QRCode}}</div>')
    }
  } else if (code === 'invitationOrganization') {
    parts.push('<!-- qr-hidden -->')
  }

  return parts.join('')
}

export function substitutePreviewVariables(input, { useSampleData = true, asHtml = false, code = '' } = {}) {
  const source = String(input || '')
  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (key === 'QRCode' && useSampleData && asHtml) {
      return SAMPLE_QR_PREVIEW_HTML
    }
    if (useSampleData) {
      let val = SAMPLE_EMAIL_VALUES[key]
      if (key === 'InvitationLink' && code) {
        val = code === 'invitationCollaboration' ? SAMPLE_MANAGE_URL : SAMPLE_FORM_URL
      }
      if (val !== undefined) {
        return asHtml ? escapeHtml(val) : val
      }
    }
    if (asHtml) {
      return `<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#fef2f2;color:#8c1515;border:1px solid #fecaca;font-family:monospace;font-size:0.88em;font-weight:600;">{{${escapeHtml(key)}}}</span>`
    }
    return `{{${key}}}`
  })
}

export function renderEmailPreviewDocument({
  code = '',
  subject,
  bodyHtml,
  highlightBox,
  ctaButton,
  qrBlock,
  useSampleData = true
}) {
  const serializedContent = serializeEditorToEmailHtml({ code, bodyHtml, highlightBox, ctaButton, qrBlock })
  const renderedSubject = substitutePreviewVariables(subject, { useSampleData, asHtml: false, code })
  const renderedBody = substitutePreviewVariables(serializedContent, { useSampleData, asHtml: true, code })

  return {
    subject: renderedSubject,
    contentHtml: renderedBody,
    serializedContent
  }
}

export function normalizeTemplateRecord(doc, fallbackCode) {
  const code = (doc && doc.code) || fallbackCode || 'ResponseNotification'
  const meta = getTemplateMeta(code)
  const parsed = doc && doc.content ? parseEmailHtmlForEditor(doc.content, code) : getDefaultTemplateDraft(code)

  return {
    _id: (doc && doc._id) || '',
    code,
    name: (doc && doc.name) || meta.name,
    subject: (doc && doc.subject) || meta.subject,
    bodyHtml: parsed.bodyHtml,
    highlightBox: parsed.highlightBox,
    ctaButton: parsed.ctaButton,
    qrBlock: parsed.qrBlock || { enabled: false },
    variables: [...meta.variables],
    rawContent: serializeEditorToEmailHtml({
      code,
      bodyHtml: parsed.bodyHtml,
      highlightBox: parsed.highlightBox,
      ctaButton: parsed.ctaButton,
      qrBlock: parsed.qrBlock
    })
  }
}
