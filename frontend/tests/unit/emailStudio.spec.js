import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import EmailStudio from '@/projects/views/email/index.vue'
import Service from '@/service/api'
import {
  DEFAULT_EMAIL_TEMPLATES,
  SAMPLE_EMAIL_VALUES,
  parseEmailHtmlForEditor,
  serializeEditorToEmailHtml,
  renderEmailPreviewDocument,
  getVariableDefinitions
} from '@/projects/utils/emailTemplates'

const localVue = createLocalVue()
localVue.use(Vuex)

const baseMocks = {
  $t: (key) => key,
  $te: () => false,
  $i18n: { locale: 'en' }
}

const baseStubs = {
  Header: {
    props: ['title', 'description'],
    template: '<div class="stub-header"><h1>{{ title }}</h1><p>{{ description }}</p></div>'
  },
  CIcon: {
    props: ['name'],
    template: '<i :data-icon="name"></i>'
  },
  CSpinner: {
    props: ['size'],
    template: '<span class="stub-spinner"></span>'
  },
  'quill-editor': {
    props: ['value', 'options'],
    template: '<textarea class="mock-quill-textarea" :value="value" @input="$emit(\'input\', $event.target.value)" @focus="$emit(\'focus\')"></textarea>'
  }
}

function buildSampleDocs() {
  return [
    {
      _id: 'tpl-resp',
      code: 'ResponseNotification',
      name: [{ key: 'en', value: 'Response Notification' }],
      subject: 'New response received for: {{FormTitle}}',
      content:
        '<p>Hello <strong>{{UserName}}</strong>,</p>' +
        '<p>A new response was received for {{FormTitle}}.</p>' +
        '<p class="ql-align-center"><a href="{{DashboardLink}}">View in Dashboard</a></p>',
      variables: ['FormName', 'UserName']
    },
    {
      _id: 'tpl-org',
      code: 'invitationOrganization',
      name: [{ key: 'en', value: 'Organization Form Invitation' }],
      subject: 'New Form Invitation: {{FormTitle}}',
      content:
        '<p>Hello <strong>{{ResponderName}}</strong>,</p>' +
        '<p>An official form from <strong>{{OrganizationName}}</strong> has been shared with you.</p>' +
        '<div style="padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #8c1515; border-radius: 8px; margin: 20px 0;">' +
        '<p style="margin: 0;">New Form</p><p style="margin: 6px 0 0;">{{FormTitle}}</p></div>' +
        '<div style="margin: 28px 0; text-align: center;">' +
        '<a href="{{InvitationLink}}" style="background-color: #8c1515; color: #ffffff;">Start Response</a></div>',
      variables: ['ResponderName', 'OrganizationName', 'FormTitle', 'InvitationLink']
    },
    {
      _id: 'tpl-conf',
      code: 'submissionConfirmation',
      name: [{ key: 'en', value: 'Submission Confirmation' }],
      subject: 'Submission Confirmation: {{FormName}}',
      content: DEFAULT_EMAIL_TEMPLATES.submissionConfirmation.bodyHtml,
      variables: ['Responder', 'FormName']
    }
  ]
}

function createEmailStore(docs = buildSampleDocs(), initialUser = null) {
  const getAction = jest.fn(() => Promise.resolve(docs))
  const putAction = jest.fn(() => Promise.resolve({ code: 20000 }))
  const store = new Vuex.Store({
    modules: {
      User: {
        namespaced: true,
        state: {
          user: initialUser
        },
        getters: {
          user: (s) => s.user
        },
        mutations: {
          setUser(s, nextUser) {
            s.user = nextUser
          }
        }
      },
      Setting: {
        namespaced: true,
        modules: {
          emailTemplate: {
            namespaced: true,
            getters: {
              item: () => docs
            },
            actions: {
              get: getAction,
              put: putAction
            }
          }
        }
      }
    }
  })
  return { store, getAction, putAction }
}

describe('emailTemplates helper utilities', () => {
  test('extracts Quill-damaged CTA link and pristine Highlight Card cleanly without keeping button inside Quill bodyHtml', () => {
    const parsedResp = parseEmailHtmlForEditor(
      '<p>Hello <strong>{{UserName}}</strong></p><p class="ql-align-center"><a href="{{DashboardLink}}">View in Dashboard</a></p>',
      'ResponseNotification'
    )
    expect(parsedResp.ctaButton.enabled).toBe(true)
    expect(parsedResp.ctaButton.label).toBe('View in Dashboard')
    expect(parsedResp.ctaButton.urlVar).toBe('{{DashboardLink}}')
    expect(parsedResp.bodyHtml).toContain('{{UserName}}')
    expect(parsedResp.bodyHtml).not.toContain('View in Dashboard')

    const parsedOrg = parseEmailHtmlForEditor(
      '<p>Hello {{ResponderName}}</p>' +
        '<div style="padding: 18px 20px; background-color: #f8fafc; border-left: 4px solid #8c1515;">' +
        '<p>New Form</p><p>{{FormTitle}}</p></div>' +
        '<div style="text-align: center;"><a href="{{InvitationLink}}" style="background-color: #8c1515;">Start Response</a></div>',
      'invitationOrganization'
    )
    expect(parsedOrg.highlightBox.enabled).toBe(true)
    expect(parsedOrg.highlightBox.eyebrow).toBe('New Form')
    expect(parsedOrg.highlightBox.headline).toBe('{{FormTitle}}')
    expect(parsedOrg.ctaButton.enabled).toBe(true)
    expect(parsedOrg.ctaButton.urlVar).toBe('{{InvitationLink}}')
  })

  test('serializes protected inline CTA styles and renders Sample Data vs Raw Variables preview', () => {
    const serialized = serializeEditorToEmailHtml({
      bodyHtml: '<p>Hello {{ResponderName}}</p>',
      highlightBox: { enabled: true, eyebrow: 'New Form', headline: '{{FormTitle}}', metaLine: '' },
      ctaButton: { enabled: true, label: 'Start Response', urlVar: '{{InvitationLink}}' }
    })
    expect(serialized).toContain('background-color: #8c1515')
    expect(serialized).toContain('border-radius: 8px')
    expect(serialized).toContain('{{InvitationLink}}')

    const samplePreview = renderEmailPreviewDocument({
      subject: 'Invite: {{FormTitle}}',
      bodyHtml: '<p>Hi {{ResponderName}}</p>',
      highlightBox: { enabled: false },
      ctaButton: { enabled: false },
      useSampleData: true
    })
    expect(samplePreview.subject).toContain(SAMPLE_EMAIL_VALUES.FormTitle)
    expect(samplePreview.contentHtml).toContain(SAMPLE_EMAIL_VALUES.ResponderName)

    const tokenPreview = renderEmailPreviewDocument({
      subject: 'Invite: {{FormTitle}}',
      bodyHtml: '<p>Hi {{ResponderName}}</p>',
      highlightBox: { enabled: false },
      ctaButton: { enabled: false },
      useSampleData: false
    })
    expect(tokenPreview.subject).toBe('Invite: {{FormTitle}}')
    expect(tokenPreview.contentHtml).toContain('{{ResponderName}}')
  })

  test('returns accurate per-template variable definitions matching backend callers and separates #3 vs #4 links', () => {
    const orgVars = getVariableDefinitions('invitationOrganization').map((v) => v.key)
    expect(orgVars).toEqual([
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
    ])

    const collabVars = getVariableDefinitions('invitationCollaboration').map((v) => v.key)
    expect(collabVars).toEqual([
      'CollaboratorName',
      'InviterName',
      'FormTitle',
      'Permission',
      'ManageURL',
      'InvitationLink',
      'ContactOrganization',
      'ContactEmail'
    ])

    const orgInviteSample = getVariableDefinitions('invitationOrganization').find((v) => v.key === 'InvitationLink')
    const collabInviteSample = getVariableDefinitions('invitationCollaboration').find((v) => v.key === 'InvitationLink')
    expect(orgInviteSample.sample).toContain('/forms/')
    expect(orgInviteSample.sample).toContain('?mode=public')
    expect(collabInviteSample.sample).toContain('/manage/')

    const qrPreview = renderEmailPreviewDocument({
      code: 'invitationOrganization',
      subject: 'Invite {{FormTitle}}',
      bodyHtml: '<p>Schedule {{SchedulePeriod}}</p>',
      highlightBox: { enabled: false },
      ctaButton: { enabled: true, label: 'Open Questionnaire', urlVar: '{{InvitationLink}}' },
      qrBlock: { enabled: true },
      useSampleData: true
    })
    expect(qrPreview.contentHtml).toContain('data-qr-preview="true"')
    expect(qrPreview.contentHtml).toContain('Scan QR Code via Mobile')
    expect(qrPreview.serializedContent).toContain('data-qr-section="true"')

    const hiddenQrSerialized = serializeEditorToEmailHtml({
      code: 'invitationOrganization',
      bodyHtml: '<p>Invite</p>',
      highlightBox: { enabled: false },
      ctaButton: { enabled: false },
      qrBlock: { enabled: false }
    })
    expect(hiddenQrSerialized).toContain('<!-- qr-hidden -->')
  })
})

describe('EmailStudio redesigned single-screen UI', () => {
  let settingSpy

  beforeEach(() => {
    jest.clearAllMocks()
    settingSpy = jest.spyOn(Service, 'setting').mockResolvedValue({
      data: {
        data: {
          sent: false,
          to: 'alice@mfu.ac.th',
          reason: 'Credentials not configured',
          renderedSubject: 'New response received for: Course & Teaching Satisfaction Survey (1/2026)'
        }
      }
    })
  })

  afterEach(() => {
    localStorage.removeItem('userData')
    if (settingSpy) settingSpy.mockRestore()
  })

  test('renders 3-pane studio, switches trigger templates, and shows accurate variables per template', async () => {
    const { store } = createEmailStore()
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    const triggers = wrapper.findAll('.trigger-item')
    expect(triggers.length).toBe(3)
    expect(wrapper.find('.editor-title').text()).toContain('New Response Alert')

    // ResponseNotification variable chips contain DashboardLink & Responder
    expect(wrapper.find('.variables-chip-list').text()).toContain('{{DashboardLink}}')
    expect(wrapper.find('.variables-chip-list').text()).not.toContain('{{OrganizationName}}')

    // Click invitationOrganization trigger explicitly
    const orgTrigger = triggers.wrappers.find((w) => w.text().includes('Respondent Form Invite'))
    await orgTrigger.trigger('click')
    expect(wrapper.find('.editor-title').text()).toContain('Respondent Form Invite')
    expect(wrapper.find('.variables-chip-list').text()).toContain('{{OrganizationName}}')
    expect(wrapper.find('.variables-chip-list').text()).toContain('{{SchedulePeriod}}')
    expect(wrapper.find('.variables-chip-list').text()).toContain('{{QRCode}}')
    expect(wrapper.find('.variables-chip-list').text()).toContain('{{InvitationLink}}')
    expect(wrapper.find('[data-test="email-qr-block-panel"]').exists()).toBe(true)
    expect(wrapper.find('.mfu-email-card').html()).toContain('data-qr-preview="true"')
  })

  test('inserts variable chips into Subject when Subject target is active and updates preview live', async () => {
    const { store } = createEmailStore()
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    const subjectInput = wrapper.find('#email-subject-input')
    await subjectInput.trigger('focus')
    await subjectInput.setValue('Alert ')
    wrapper.vm.subjectCursor = { start: 6, end: 6 }

    const responderChip = wrapper.findAll('.var-chip').wrappers.find((w) => w.text().includes('{{Responder}}'))
    await responderChip.trigger('mousedown')

    expect(wrapper.vm.activeDraft.subject).toBe('Alert {{Responder}}')
    expect(wrapper.find('.envelope-subject').text()).toContain(SAMPLE_EMAIL_VALUES.Responder)
  })

  test('renders sample-data live preview without variable-code or device toggles', () => {
    const { store } = createEmailStore()
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    expect(wrapper.find('.preview-frame').exists()).toBe(true)
    expect(wrapper.find('.segmented-group').exists()).toBe(false)
    expect(wrapper.find('.seg-btn').exists()).toBe(false)
    expect(wrapper.find('.preview-frame').classes()).not.toContain('is-mobile')
    expect(wrapper.find('.preview-frame').classes()).not.toContain('is-desktop')
    expect(wrapper.find('.envelope-subject').text()).toContain(SAMPLE_EMAIL_VALUES.FormTitle)
    expect(wrapper.find('.envelope-subject').text()).not.toContain('{{FormTitle}}')
  })

  test('Reset to Default and Save Changes sends protected HTML and correct template variables array', async () => {
    const { store, putAction } = createEmailStore()
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    await wrapper.find('#email-subject-input').setValue('Custom Subject {{FormTitle}}')
    expect(wrapper.find('.status-pill').classes()).toContain('status-unsaved')

    const saveBtn = wrapper.find('.btn-studio-primary')
    expect(saveBtn.attributes('disabled')).toBeUndefined()
    await saveBtn.trigger('click')

    expect(putAction).toHaveBeenCalledTimes(1)
    const sentPayload = putAction.mock.calls[0][1]
    expect(sentPayload._id).toBe('tpl-resp')
    expect(sentPayload.subject).toBe('Custom Subject {{FormTitle}}')
    expect(sentPayload.content).toContain('background-color: #8c1515')
    expect(sentPayload.variables).toEqual(DEFAULT_EMAIL_TEMPLATES.ResponseNotification.variables)
  })

  test('Send Test posts current edited template directly to signed-in owner email without a modal', async () => {
    localStorage.setItem('userData', JSON.stringify({ _id: 'u-alice', name: 'Alice', email: 'alice@mfu.ac.th' }))
    const { store } = createEmailStore()
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    const sendTestBtn = wrapper.findAll('.btn-studio-secondary').wrappers.find((w) => w.text().includes('Send Test'))
    await sendTestBtn.trigger('click')
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.email-test-dialog').exists()).toBe(false)
    expect(Service.setting).toHaveBeenCalledWith(
      'email-template-test',
      expect.objectContaining({
        to: 'alice@mfu.ac.th',
        code: 'ResponseNotification'
      })
    )
    expect(wrapper.find('.studio-banner').text()).toContain('alice@mfu.ac.th')
  })

  test('hides per-account scope badge in UI while keeping drafts isolated per account', async () => {
    const { store, getAction } = createEmailStore(buildSampleDocs(), {
      _id: 'u-alice',
      name: 'Alice',
      email: 'alice@mfu.ac.th'
    })
    const wrapper = mount(EmailStudio, {
      localVue,
      store,
      mocks: baseMocks,
      stubs: baseStubs
    })

    expect(wrapper.find('.account-scope-pill').exists()).toBe(false)
    expect(wrapper.vm.currentAccountInfo.email).toBe('alice@mfu.ac.th')
    expect(wrapper.vm.signedInAccountKey).toBe('u-alice')

    await wrapper.find('#email-subject-input').setValue('Alice Custom Subject')
    expect(wrapper.vm.activeDraft.subject).toBe('Alice Custom Subject')

    store.commit('User/setUser', { _id: 'u-bob', name: 'Bob', email: 'bob@mfu.ac.th' })
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.signedInAccountKey).toBe('u-bob')
    expect(getAction).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.activeDraft.subject).not.toBe('Alice Custom Subject')
  })

  test('hides SMTP tab for non-admin staff and allows Admin users to configure & test SMTP settings', async () => {
    const { store: staffStore } = createEmailStore(buildSampleDocs(), {
      _id: 'u-staff',
      name: 'Staff User',
      email: 'staff@mfu.ac.th',
      role: { title: [{ key: 'en', value: 'Lecturer' }] }
    })
    const staffWrapper = mount(EmailStudio, {
      localVue,
      store: staffStore,
      mocks: baseMocks,
      stubs: baseStubs
    })
    expect(staffWrapper.find('[data-test="email-admin-tabs"]').exists()).toBe(false)
    expect(Service.setting).not.toHaveBeenCalledWith('smtp-get', expect.anything())

    settingSpy.mockImplementation((method, payload) => {
      if (method === 'smtp-get') {
        return Promise.resolve({
          data: {
            data: {
              source: 'env',
              host: 'env-smtp.mfu.ac.th',
              port: 587,
              secureMode: 'auto',
              username: 'env@mfu.ac.th',
              hasPassword: false,
              appName: 'Digital University',
              senderEmail: 'env@mfu.ac.th',
              devRedirectTo: ''
            }
          }
        })
      }
      if (method === 'smtp-update') {
        return Promise.resolve({
          data: {
            data: {
              source: 'database',
              host: payload.host,
              port: payload.port,
              secureMode: payload.secureMode,
              username: payload.username,
              hasPassword: true,
              appName: payload.appName,
              senderEmail: payload.senderEmail,
              devRedirectTo: ''
            }
          }
        })
      }
      if (method === 'smtp-test') {
        return Promise.resolve({
          data: {
            data: {
              verified: true,
              sent: true,
              to: payload.testTo,
              effectiveFrom: `"${payload.appName}" <${payload.senderEmail}>`,
              messageId: 'smtp-live-1'
            }
          }
        })
      }
      return Promise.resolve({ data: { data: {} } })
    })

    const { store: adminStore } = createEmailStore(buildSampleDocs(), {
      _id: 'u-admin',
      name: 'Admin MFU',
      email: 'admin@mfu.ac.th',
      role: { title: [{ key: 'en', value: 'Admin' }] }
    })
    const adminWrapper = mount(EmailStudio, {
      localVue,
      store: adminStore,
      mocks: baseMocks,
      stubs: baseStubs
    })

    expect(adminWrapper.find('[data-test="email-admin-tabs"]').exists()).toBe(true)
    await adminWrapper.find('[data-test="email-tab-smtp"]').trigger('click')
    await Promise.resolve()
    await adminWrapper.vm.$nextTick()

    expect(adminWrapper.find('[data-test="smtp-settings-panel"]').exists()).toBe(true)
    await adminWrapper.find('#smtp-host-input').setValue('smtp.custom.ac.th')
    await adminWrapper.find('#smtp-appname-input').setValue('MFU Survey App')
    await adminWrapper.find('#smtp-sender-input').setValue('surveys@custom.ac.th')
    await adminWrapper.find('form').trigger('submit.prevent')
    await Promise.resolve()
    await adminWrapper.vm.$nextTick()

    expect(Service.setting).toHaveBeenCalledWith(
      'smtp-update',
      expect.objectContaining({
        host: 'smtp.custom.ac.th',
        appName: 'MFU Survey App',
        senderEmail: 'surveys@custom.ac.th'
      })
    )
    expect(adminWrapper.find('[data-test="smtp-source-badge"]').classes()).toContain('source-database')
    expect(adminWrapper.vm.liveBranding.appName).toBe('MFU Survey App')

    await adminWrapper.find('[data-test="smtp-test-btn"]').trigger('click')
    await Promise.resolve()
    await adminWrapper.vm.$nextTick()

    expect(Service.setting).toHaveBeenCalledWith(
      'smtp-test',
      expect.objectContaining({
        host: 'smtp.custom.ac.th',
        appName: 'MFU Survey App',
        testTo: 'admin@mfu.ac.th'
      })
    )
    expect(adminWrapper.find('[data-test="smtp-test-result"]').classes()).toContain('is-ok')
  })
})
