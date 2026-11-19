<template>
  <div class="email-studio-page">
    <Header
      :title="tr('email.pageTitle', 'Email Templates')"
      :description="tr('email.pageSubtitle', 'Customize notification email subjects and wording for your forms, and preview how they look before saving.')"
    />

    <!-- Admin View Switcher (Email Templates | SMTP Settings) -->
    <div v-if="isAdminAccount" class="studio-mode-tabs mb-3" role="tablist" data-test="email-admin-tabs">
      <button
        type="button"
        role="tab"
        :aria-selected="activeWorkspaceTab === 'templates'"
        class="studio-mode-tab"
        :class="{ 'is-active': activeWorkspaceTab === 'templates' }"
        data-test="email-tab-templates"
        @click="activeWorkspaceTab = 'templates'"
      >
        <CIcon name="cil-envelope-open" size="sm" class="mr-2" />
        <span>{{ tr('email.tabTemplates', 'Email Templates') }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeWorkspaceTab === 'smtp'"
        class="studio-mode-tab"
        :class="{ 'is-active': activeWorkspaceTab === 'smtp' }"
        data-test="email-tab-smtp"
        @click="activeWorkspaceTab = 'smtp'"
      >
        <CIcon name="cil-settings" size="sm" class="mr-2" />
        <span>{{ tr('email.tabSmtpAdmin', 'SMTP Settings (Admin)') }}</span>
      </button>
    </div>

    <!-- Admin SMTP Settings Workspace -->
    <SmtpSettingsPanel
      v-if="isAdminAccount && activeWorkspaceTab === 'smtp'"
      :admin-email="currentAdminEmail"
      @branding-updated="onBrandingUpdated"
    />

    <!-- Global Status Banner -->
    <template v-else>
    <div v-if="feedbackBanner.message" class="studio-banner mb-3" :class="'banner-' + feedbackBanner.type" role="status">
      <div class="d-flex align-items-center">
        <CIcon :name="feedbackBanner.type === 'error' ? 'cil-warning' : 'cil-check-circle'" size="sm" class="mr-2" />
        <span>{{ feedbackBanner.message }}</span>
      </div>
      <button type="button" class="banner-close" aria-label="Dismiss" @click="feedbackBanner.message = ''">
        &times;
      </button>
    </div>

    <!-- Load Error State -->
    <div v-if="loadError && !orderedTemplates.length" class="studio-state-card">
      <CIcon name="cil-warning" size="xl" class="text-danger mb-2" />
      <h5 class="mb-1">{{ tr('email.loadError', 'Could not load email templates.') }}</h5>
      <button type="button" class="btn-studio-secondary mt-3" @click="loadTemplates">
        {{ tr('email.retry', 'Retry') }}
      </button>
    </div>

    <!-- 3-Pane Email Studio Workspace -->
    <div v-else class="email-studio-grid">
      <!-- LEFT PANE: Trigger List -->
      <aside class="studio-pane sidebar-pane" aria-label="Email Triggers">
        <div class="pane-header">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="pane-kicker">{{ tr('email.triggersHeading', 'Email Triggers') }}</span>
            <span class="count-pill">{{ filteredTemplates.length }}</span>
          </div>
          <div class="search-box">
            <CIcon name="cil-magnifying-glass" size="sm" class="search-icon" />
            <input
              v-model.trim="searchQuery"
              type="text"
              class="trigger-search-input"
              :placeholder="tr('email.searchPlaceholder', 'Search templates...')"
            />
          </div>
        </div>

        <div class="trigger-list" role="tablist">
          <button
            v-for="tpl in filteredTemplates"
            :key="tpl._id || tpl.code"
            type="button"
            role="tab"
            :aria-selected="activeKey === (tpl._id || tpl.code)"
            class="trigger-item"
            :class="{ 'is-active': activeKey === (tpl._id || tpl.code) }"
            @click="selectTemplate(tpl)"
          >
            <div class="trigger-icon-wrap">
              <CIcon :name="iconForCode(tpl.code)" size="sm" />
            </div>
            <div class="trigger-copy">
              <div class="trigger-title-row">
                <span class="trigger-title">{{ templateDisplayTitle(tpl) }}</span>
                <span
                  v-if="isTemplateKeyDirty(tpl._id || tpl.code)"
                  class="dirty-dot"
                  :title="tr('email.unsavedStatus', 'Unsaved changes')"
                />
              </div>
              <div class="trigger-desc">{{ templateTriggerDesc(tpl.code) }}</div>
            </div>
          </button>

          <div v-if="!filteredTemplates.length" class="trigger-empty">
            {{ tr('email.noMatchingTemplates', 'No matching email templates found.') }}
          </div>
        </div>
      </aside>

      <!-- CENTER PANE: Guided Editor -->
      <section class="studio-pane editor-pane">
        <template v-if="activeDraft">
          <div class="editor-topbar">
            <div class="editor-heading">
              <div class="d-flex align-items-center flex-wrap">
                <h2 class="editor-title mb-0 mr-2">{{ templateDisplayTitle(activeSavedRecord) }}</h2>
                <span
                  class="status-pill"
                  :class="isActiveDirty ? 'status-unsaved' : 'status-saved'"
                >
                  {{ isActiveDirty ? tr('email.unsavedStatus', 'Unsaved changes') : tr('email.savedStatus', 'Saved') }}
                </span>
              </div>
              <p class="editor-trigger-hint mb-0 mt-1">{{ templateTriggerDesc(activeDraft.code) }}</p>
            </div>

            <div class="editor-actions">
              <button
                v-if="isActiveDirty"
                type="button"
                class="btn-studio-ghost"
                :disabled="isSaving"
                @click="discardActiveDraft"
              >
                {{ tr('email.discardChanges', 'Discard') }}
              </button>
              <button
                type="button"
                class="btn-studio-secondary"
                :disabled="isSaving"
                @click="resetToRecommendedDefault"
              >
                <CIcon name="cil-reload" size="sm" class="mr-1" />
                <span>{{ tr('email.resetDefault', 'Reset to Default') }}</span>
              </button>
              <button
                type="button"
                class="btn-studio-secondary"
                :disabled="isSaving || isSendingTest"
                @click="sendTestToOwner"
              >
                <CIcon name="cil-paper-plane" size="sm" class="mr-1" />
                <span>{{ isSendingTest ? tr('email.sendingTest', 'Sending...') : tr('email.sendTest', 'Send Test') }}</span>
              </button>
              <button
                type="button"
                class="btn-studio-primary"
                :disabled="!isActiveDirty || isSaving"
                @click="saveActiveDraft"
              >
                <CIcon name="cil-save" size="sm" class="mr-1" />
                <span>{{ isSaving ? tr('email.saving', 'Saving...') : tr('email.saveChanges', 'Save Changes') }}</span>
              </button>
            </div>
          </div>

          <div class="editor-scroll-body">
            <!-- 1. Subject Line -->
            <div class="field-block">
              <div class="field-label-row">
                <label class="field-label" for="email-subject-input">{{ tr('email.subjectLabel', 'Email Subject') }}</label>
                <span class="field-hint">{{ tr('email.subjectHint', 'Shown in recipient inbox') }}</span>
              </div>
              <input
                id="email-subject-input"
                ref="subjectInput"
                v-model="activeDraft.subject"
                type="text"
                class="studio-input"
                @focus="handleSubjectFocus"
                @click="captureSubjectSelection"
                @keyup="captureSubjectSelection"
              />
            </div>

            <!-- 2. Shared Quick Dynamic Data Chips -->
            <div class="variables-toolbar">
              <div class="variables-header">
                <span class="field-label mb-0">{{ tr('email.variablesLabel', 'Insert Dynamic Data') }}</span>
                <div class="target-toggle">
                  <button
                    type="button"
                    class="target-chip"
                    :class="{ 'is-selected': lastFocusedTarget === 'subject' }"
                    @click="setInsertTarget('subject')"
                  >
                    {{ tr('email.targetSubject', 'Subject') }}
                  </button>
                  <button
                    type="button"
                    class="target-chip"
                    :class="{ 'is-selected': lastFocusedTarget === 'body' }"
                    @click="setInsertTarget('body')"
                  >
                    {{ tr('email.targetBody', 'Message Body') }}
                  </button>
                </div>
              </div>
              <p class="variables-caption mb-2">
                {{ variablesTargetHint }}
              </p>
              <div class="variables-chip-list">
                <button
                  v-for="variable in activeVariableDefs"
                  :key="variable.key"
                  type="button"
                  class="var-chip"
                  :title="variable.token + ' — ' + variable.sample"
                  @mousedown.prevent="insertVariable(variable.key)"
                >
                  <span class="var-chip-label">{{ currentLocale === 'th' ? variable.th : variable.en }}</span>
                  <code class="var-chip-code">{{ variable.token }}</code>
                </button>
              </div>
            </div>

            <!-- 3. Message Body (Safe Prose Quill Editor) -->
            <div class="field-block">
              <div class="field-label-row">
                <label class="field-label">{{ tr('email.bodyLabel', 'Message Body') }}</label>
                <span class="field-hint">{{ tr('email.bodyHint', 'Edit text without breaking email styling.') }}</span>
              </div>
              <div class="studio-quill-shell">
                <quill-editor
                  ref="emailQuill"
                  v-model="activeDraft.bodyHtml"
                  :options="editorOptions"
                  @focus="handleQuillFocus"
                  @blur="handleQuillBlur"
                />
              </div>
            </div>

            <!-- 4. Guided Building Blocks: Highlight Card & CTA Button -->
            <div class="blocks-grid">
              <!-- Highlight Callout Card -->
              <div class="block-panel">
                <div class="block-panel-head">
                  <div>
                    <div class="block-title">{{ tr('email.highlightSectionTitle', 'Highlight Callout Card') }}</div>
                    <div class="block-subtitle">{{ tr('email.highlightSectionHint', 'Optional summary card inside email') }}</div>
                  </div>
                  <label class="switch-label">
                    <input
                      v-model="activeDraft.highlightBox.enabled"
                      type="checkbox"
                      class="switch-checkbox"
                    />
                    <span>{{ tr('email.enableHighlight', 'Show card') }}</span>
                  </label>
                </div>

                <div v-if="activeDraft.highlightBox.enabled" class="block-fields">
                  <div class="block-field-row">
                    <label class="sub-label">{{ tr('email.highlightEyebrowLabel', 'Small Label') }}</label>
                    <input v-model="activeDraft.highlightBox.eyebrow" type="text" class="studio-input studio-input-sm" />
                  </div>
                  <div class="block-field-row">
                    <label class="sub-label">{{ tr('email.highlightHeadlineLabel', 'Main Highlight') }}</label>
                    <input v-model="activeDraft.highlightBox.headline" type="text" class="studio-input studio-input-sm" />
                  </div>
                  <div class="block-field-row">
                    <label class="sub-label">{{ tr('email.highlightMetaLabel', 'Secondary Details') }}</label>
                    <input v-model="activeDraft.highlightBox.metaLine" type="text" class="studio-input studio-input-sm" />
                  </div>
                </div>
              </div>

              <!-- Protected Action Button (CTA) -->
              <div class="block-panel">
                <div class="block-panel-head">
                  <div>
                    <div class="block-title">{{ tr('email.ctaSectionTitle', 'Action Button (CTA)') }}</div>
                    <div class="block-subtitle">{{ tr('email.ctaSectionHint', 'Safe MFU button styling across mail apps') }}</div>
                  </div>
                  <label class="switch-label">
                    <input
                      v-model="activeDraft.ctaButton.enabled"
                      type="checkbox"
                      class="switch-checkbox"
                    />
                    <span>{{ tr('email.enableCta', 'Show button') }}</span>
                  </label>
                </div>

                <div v-if="activeDraft.ctaButton.enabled" class="block-fields">
                  <div class="block-field-row">
                    <label class="sub-label">{{ tr('email.ctaTextLabel', 'Button Text') }}</label>
                    <input v-model="activeDraft.ctaButton.label" type="text" class="studio-input studio-input-sm" />
                  </div>
                  <div class="block-field-row">
                    <label class="sub-label">{{ tr('email.ctaLinkLabel', 'Button Destination') }}</label>
                    <select v-model="activeDraft.ctaButton.urlVar" class="studio-input studio-input-sm">
                      <option
                        v-for="opt in activeLinkOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ currentLocale === 'th' ? opt.th : opt.en }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Mobile QR Code Card (Email #3 Respondent Invite) -->
              <div
                v-if="activeDraft.code === 'invitationOrganization'"
                class="block-panel"
                data-test="email-qr-block-panel"
              >
                <div class="block-panel-head">
                  <div>
                    <div class="block-title">{{ tr('email.qrSectionTitle', 'Mobile QR Code Block') }}</div>
                    <div class="block-subtitle">{{ tr('email.qrSectionHint', 'Automatically embeds a crisp scannable QR code pointing to this questionnaire link') }}</div>
                  </div>
                  <label class="switch-label">
                    <input
                      v-model="activeDraft.qrBlock.enabled"
                      type="checkbox"
                      class="switch-checkbox"
                      data-test="email-qr-toggle"
                    />
                    <span>{{ tr('email.enableQr', 'Include QR Code in email') }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="studio-state-card border-0">
          <CIcon name="cil-envelope-open" size="xl" class="text-muted mb-2" />
          <h5 class="mb-1">{{ tr('email.emptyStateTitle', 'Select an email trigger on the left') }}</h5>
          <p class="text-muted small mb-0">{{ tr('email.emptyStateDesc', 'Choose a template to edit subject, message, and preview.') }}</p>
        </div>
      </section>

      <!-- RIGHT PANE: Sticky MFU Live Preview -->
      <aside class="studio-pane preview-pane" aria-label="Live Email Preview">
        <div class="preview-toolbar">
          <span class="pane-kicker">{{ tr('email.previewTitle', 'Inbox Live Preview') }}</span>
        </div>

        <div v-if="activeDraft" class="preview-stage">
          <div class="preview-frame">
            <!-- Inbox Header Metadata -->
            <div class="inbox-envelope">
              <div class="envelope-row">
                <span class="env-key">{{ tr('email.inboxFromLabel', 'From') }}:</span>
                <span class="env-val">{{ liveBranding.appName }} &middot; Forms &amp; Services &lt;{{ liveBranding.senderEmail }}&gt;</span>
              </div>
              <div class="envelope-row">
                <span class="env-key">{{ tr('email.inboxToLabel', 'To') }}:</span>
                <span class="env-val">{{ activeRecipientPreview }}</span>
              </div>
              <div class="envelope-row envelope-subject">
                <span class="env-key">{{ tr('email.inboxSubjectLabel', 'Subject') }}:</span>
                <span class="env-val font-weight-bold">{{ previewDoc.subject || '—' }}</span>
              </div>
            </div>

            <!-- Authentic MFU Email Canvas matching backend baseLayout.js -->
            <div class="mfu-email-shell">
              <div class="mfu-email-card">
                <div class="mfu-email-header">
                  <div class="mfu-brand-title">{{ liveBranding.appName }}</div>
                  <div class="mfu-brand-sub">Forms &amp; Services</div>
                </div>
                <div class="mfu-email-body" v-html="previewDoc.contentHtml" />
                <div class="mfu-email-contact-strip">
                  <div class="mfu-contact-label">{{ tr('email.contactPreviewPrefix', 'Form Contact / Coordinator') }}</div>
                  <div class="mfu-contact-val">{{ previewContactLine }}</div>
                </div>
                <div class="mfu-email-footer">
                  <div class="font-weight-bold mb-1">{{ liveBranding.appName }} Form Service</div>
                  <div>Mae Fah Luang University</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
    </template>
  </div>
</template>

<script>
import Header from '../../components/Util/Header.vue'
import SmtpSettingsPanel from '../../components/email/SmtpSettingsPanel.vue'
import Service from '../../../service/api'
import { isUserAdmin } from '../../utils/analytics'
import { quillEditor } from 'vue-quill-editor'
import { mapGetters, mapActions } from 'vuex'
import {
  TEMPLATE_ORDER,
  SAMPLE_EMAIL_VALUES,
  getTemplateMeta,
  getDefaultTemplateDraft,
  getLocalizedText,
  getVariableDefinitions,
  normalizeTemplateRecord,
  serializeEditorToEmailHtml,
  renderEmailPreviewDocument
} from '../../utils/emailTemplates'

export default {
  name: 'EmailStudio',
  components: {
    Header,
    SmtpSettingsPanel,
    quillEditor
  },
  props: {
    initialId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activeWorkspaceTab: 'templates',
      liveBranding: {
        appName: 'Digital University',
        senderEmail: 'no-reply@mfu.ac.th'
      },
      searchQuery: '',
      activeKey: '',
      draftsByKey: {},
      lastFocusedTarget: 'body',
      subjectCursor: { start: null, end: null },
      quillLastIndex: null,
      isSaving: false,
      loadError: false,
      isSendingTest: false,
      feedbackBanner: {
        type: 'success',
        message: ''
      },
      editorOptions: {
        placeholder: 'Write your email message here...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
          ]
        }
      },
      iconMap: {
        ResponseNotification: 'cil-bell',
        submissionConfirmation: 'cil-check-circle',
        invitationOrganization: 'cil-building',
        invitationCollaboration: 'cil-user-follow'
      }
    }
  },
  computed: {
    ...mapGetters('Setting/emailTemplate', ['item']),
    currentLocale() {
      return (this.$i18n && this.$i18n.locale) || 'en'
    },
    currentAccountInfo() {
      const storeUser = this.$store && this.$store.getters ? this.$store.getters['User/user'] : null
      if (storeUser && (storeUser._id || storeUser.email)) {
        return storeUser
      }
      try {
        const raw = localStorage.getItem('userData')
        return raw ? JSON.parse(raw) : null
      } catch (_err) {
        return null
      }
    },
    signedInAccountKey() {
      const user = this.currentAccountInfo
      return user ? String(user._id || user.id || user.email || '') : ''
    },
    isAdminAccount() {
      return isUserAdmin(this.currentAccountInfo)
    },
    currentAdminEmail() {
      return String((this.currentAccountInfo && this.currentAccountInfo.email) || '').trim()
    },
    previewContactLine() {
      return `${SAMPLE_EMAIL_VALUES.ContactOrganization} · ${SAMPLE_EMAIL_VALUES.ContactEmail}`
    },
    orderedTemplates() {
      const list = Array.isArray(this.item) ? [...this.item] : []
      return list.sort((a, b) => {
        const idxA = TEMPLATE_ORDER.indexOf(a.code)
        const idxB = TEMPLATE_ORDER.indexOf(b.code)
        const rankA = idxA === -1 ? 99 : idxA
        const rankB = idxB === -1 ? 99 : idxB
        return rankA - rankB
      })
    },
    filteredTemplates() {
      const q = this.searchQuery.toLowerCase()
      if (!q) return this.orderedTemplates
      return this.orderedTemplates.filter((tpl) => {
        const title = this.templateDisplayTitle(tpl).toLowerCase()
        const desc = this.templateTriggerDesc(tpl.code).toLowerCase()
        const code = String(tpl.code || '').toLowerCase()
        return title.includes(q) || desc.includes(q) || code.includes(q)
      })
    },
    activeSavedRecord() {
      if (!this.orderedTemplates.length) return null
      return (
        this.orderedTemplates.find((tpl) => (tpl._id || tpl.code) === this.activeKey) ||
        this.orderedTemplates[0]
      )
    },
    activeDraft() {
      if (!this.activeSavedRecord) return null
      const key = this.activeSavedRecord._id || this.activeSavedRecord.code
      return this.draftsByKey[key] || null
    },
    isActiveDirty() {
      return this.isTemplateKeyDirty(this.activeKey)
    },
    activeVariableDefs() {
      if (!this.activeDraft) return []
      return getVariableDefinitions(this.activeDraft.code, this.activeDraft.variables)
    },
    activeLinkOptions() {
      if (!this.activeDraft) return []
      return getTemplateMeta(this.activeDraft.code).linkOptions || []
    },
    activeRecipientPreview() {
      if (!this.activeDraft) return ''
      const meta = getTemplateMeta(this.activeDraft.code)
      return (meta.recipientPreview && meta.recipientPreview[this.currentLocale]) || meta.recipientPreview.en
    },
    variablesTargetHint() {
      const targetName = this.lastFocusedTarget === 'subject'
        ? this.tr('email.targetSubject', 'Subject')
        : this.tr('email.targetBody', 'Message Body')
      const template = this.tr('email.variablesHint', 'Click any chip to insert at cursor in {target}')
      return template.replace('{target}', targetName)
    },
    previewDoc() {
      if (!this.activeDraft) {
        return { subject: '', contentHtml: '' }
      }
      return renderEmailPreviewDocument({
        code: this.activeDraft.code,
        subject: this.activeDraft.subject,
        bodyHtml: this.activeDraft.bodyHtml,
        highlightBox: this.activeDraft.highlightBox,
        ctaButton: this.activeDraft.ctaButton,
        qrBlock: this.activeDraft.qrBlock,
        useSampleData: true
      })
    }
  },
  watch: {
    orderedTemplates: {
      immediate: true,
      handler(list) {
        if (!Array.isArray(list) || !list.length) return
        list.forEach((doc) => {
          const key = doc._id || doc.code
          if (!this.draftsByKey[key]) {
            const normalized = normalizeTemplateRecord(doc, doc.code)
            this.$set(this.draftsByKey, key, {
              _id: normalized._id,
              code: normalized.code,
              subject: normalized.subject,
              bodyHtml: normalized.bodyHtml,
              highlightBox: { ...normalized.highlightBox },
              ctaButton: { ...normalized.ctaButton },
              qrBlock: { ...(normalized.qrBlock || { enabled: false }) },
              variables: [...normalized.variables]
            })
          }
        })

        const matchInitial = this.initialId
          ? list.find((tpl) => tpl._id === this.initialId || tpl.code === this.initialId)
          : null

        if (matchInitial) {
          this.activeKey = matchInitial._id || matchInitial.code
        } else if (!this.activeKey || !list.some((tpl) => (tpl._id || tpl.code) === this.activeKey)) {
          this.activeKey = list[0]._id || list[0].code
        }
      }
    },
    initialId(nextId) {
      if (!nextId || !this.orderedTemplates.length) return
      const target = this.orderedTemplates.find((tpl) => tpl._id === nextId || tpl.code === nextId)
      if (target) {
        this.activeKey = target._id || target.code
      }
    },
    signedInAccountKey(nextKey, prevKey) {
      if (nextKey !== prevKey) {
        this.draftsByKey = {}
        this.activeKey = ''
        this.loadTemplates({ forceReset: true })
      }
    }
  },
  mounted() {
    this.loadTemplates()
    this.loadEmailBranding()
  },
  methods: {
    ...mapActions('Setting/emailTemplate', ['get', 'put']),
    async loadEmailBranding() {
      try {
        const res = await Service.setting('email-branding-get')
        const data = res && res.data && res.data.data ? res.data.data : null
        if (data && (data.appName || data.senderEmail)) {
          this.liveBranding = {
            appName: data.appName || 'Digital University',
            senderEmail: data.senderEmail || 'no-reply@mfu.ac.th'
          }
        }
      } catch (_err) {
        // Ignore silently on unconfigured or mocked environments
      }
    },
    onBrandingUpdated(branding) {
      if (!branding) return
      this.liveBranding = {
        appName: branding.appName || 'Digital University',
        senderEmail: branding.senderEmail || 'no-reply@mfu.ac.th'
      }
    },
    tr(key, fallback) {
      if (this.$te && this.$te(key)) {
        return this.$t(key)
      }
      return fallback
    },
    syncDraftsFromList(list, { forceReset = false } = {}) {
      const nextDrafts = {}
      list.forEach((doc) => {
        const key = doc._id || doc.code
        const existingDraft = this.draftsByKey[key]
        if (!forceReset && existingDraft && this.isTemplateKeyDirty(key)) {
          nextDrafts[key] = existingDraft
          return
        }
        const normalized = normalizeTemplateRecord(doc, doc.code)
        nextDrafts[key] = {
          _id: normalized._id,
          code: normalized.code,
          subject: normalized.subject,
          bodyHtml: normalized.bodyHtml,
          highlightBox: { ...normalized.highlightBox },
          ctaButton: { ...normalized.ctaButton },
          qrBlock: { ...(normalized.qrBlock || { enabled: false }) },
          variables: [...normalized.variables]
        }
      })
      this.draftsByKey = nextDrafts
      const matchInitial = this.initialId
        ? list.find((tpl) => tpl._id === this.initialId || tpl.code === this.initialId)
        : null
      if (matchInitial) {
        this.activeKey = matchInitial._id || matchInitial.code
      } else if (list.length && (!this.activeKey || !list.some((tpl) => (tpl._id || tpl.code) === this.activeKey))) {
        this.activeKey = list[0]._id || list[0].code
      }
    },
    async loadTemplates({ forceReset = false } = {}) {
      this.loadError = false
      try {
        const fetched = await this.get()
        const sourceList = this.orderedTemplates.length ? this.orderedTemplates : fetched
        if (Array.isArray(sourceList) && sourceList.length) {
          this.syncDraftsFromList(sourceList, { forceReset })
        }
      } catch (_err) {
        this.loadError = true
      }
    },
    iconForCode(code) {
      return this.iconMap[code] || 'cil-envelope-closed'
    },
    templateDisplayTitle(tpl) {
      if (!tpl) return ''
      const meta = getTemplateMeta(tpl.code)
      if (meta && meta.title && meta.title[this.currentLocale]) {
        return meta.title[this.currentLocale]
      }
      return getLocalizedText(tpl.name, this.currentLocale) || tpl.code
    },
    templateTriggerDesc(code) {
      const meta = getTemplateMeta(code)
      if (meta && meta.triggerDescription) {
        return meta.triggerDescription[this.currentLocale] || meta.triggerDescription.en
      }
      return ''
    },
    isTemplateKeyDirty(key) {
      if (!key) return false
      const draft = this.draftsByKey[key]
      const savedDoc = this.orderedTemplates.find((tpl) => (tpl._id || tpl.code) === key)
      if (!draft || !savedDoc) return false
      const savedNorm = normalizeTemplateRecord(savedDoc, savedDoc.code)
      const draftContent = serializeEditorToEmailHtml(draft)
      const savedContent = serializeEditorToEmailHtml(savedNorm)
      return (
        String(draft.subject || '').trim() !== String(savedNorm.subject || '').trim() ||
        draftContent !== savedContent
      )
    },
    selectTemplate(tpl) {
      const key = tpl._id || tpl.code
      this.activeKey = key
      this.feedbackBanner.message = ''
      if (this.initialId && tpl._id && tpl._id !== this.initialId && this.$router) {
        this.$router.replace({ name: 'EmailDetail', params: { id: tpl._id } }).catch(() => {})
      }
    },
    setInsertTarget(target) {
      this.lastFocusedTarget = target
      if (target === 'subject' && this.$refs.subjectInput) {
        this.$refs.subjectInput.focus()
      } else if (target === 'body' && this.$refs.emailQuill && this.$refs.emailQuill.quill) {
        this.$refs.emailQuill.quill.focus()
      }
    },
    handleSubjectFocus() {
      this.lastFocusedTarget = 'subject'
      this.captureSubjectSelection()
    },
    captureSubjectSelection() {
      const input = this.$refs.subjectInput
      if (!input) return
      this.subjectCursor = {
        start: typeof input.selectionStart === 'number' ? input.selectionStart : this.activeDraft.subject.length,
        end: typeof input.selectionEnd === 'number' ? input.selectionEnd : this.activeDraft.subject.length
      }
    },
    handleQuillFocus() {
      this.lastFocusedTarget = 'body'
      const quill = this.$refs.emailQuill && this.$refs.emailQuill.quill
      if (quill) {
        const sel = quill.getSelection()
        if (sel) this.quillLastIndex = sel.index
      }
    },
    handleQuillBlur() {
      const quill = this.$refs.emailQuill && this.$refs.emailQuill.quill
      if (quill) {
        const sel = quill.getSelection()
        if (sel) this.quillLastIndex = sel.index
      }
    },
    insertVariable(varKey) {
      if (!this.activeDraft) return
      const token = `{{${varKey}}}`

      if (this.lastFocusedTarget === 'subject') {
        const current = String(this.activeDraft.subject || '')
        const start = this.subjectCursor.start !== null ? this.subjectCursor.start : current.length
        const end = this.subjectCursor.end !== null ? this.subjectCursor.end : start
        this.activeDraft.subject = current.slice(0, start) + token + current.slice(end)
        const nextPos = start + token.length
        this.subjectCursor = { start: nextPos, end: nextPos }
        this.$nextTick(() => {
          const input = this.$refs.subjectInput
          if (input && typeof input.setSelectionRange === 'function') {
            input.focus()
            input.setSelectionRange(nextPos, nextPos)
          }
        })
        return
      }

      const quill = this.$refs.emailQuill && this.$refs.emailQuill.quill
      if (quill) {
        const range = quill.getSelection(true)
        const index = range ? range.index : (this.quillLastIndex !== null ? this.quillLastIndex : Math.max(0, quill.getLength() - 1))
        quill.insertText(index, token, 'user')
        quill.setSelection(index + token.length, 0, 'silent')
        this.quillLastIndex = index + token.length
        this.activeDraft.bodyHtml = quill.root.innerHTML
      } else {
        this.activeDraft.bodyHtml = String(this.activeDraft.bodyHtml || '') + token
      }
    },
    discardActiveDraft() {
      if (!this.activeSavedRecord) return
      const key = this.activeSavedRecord._id || this.activeSavedRecord.code
      const normalized = normalizeTemplateRecord(this.activeSavedRecord, this.activeSavedRecord.code)
      this.$set(this.draftsByKey, key, {
        _id: normalized._id,
        code: normalized.code,
        subject: normalized.subject,
        bodyHtml: normalized.bodyHtml,
        highlightBox: { ...normalized.highlightBox },
        ctaButton: { ...normalized.ctaButton },
        qrBlock: { ...(normalized.qrBlock || { enabled: false }) },
        variables: [...normalized.variables]
      })
      this.feedbackBanner = {
        type: 'success',
        message: this.tr('email.discardDone', 'Reverted to last saved version.')
      }
    },
    resetToRecommendedDefault() {
      if (!this.activeDraft || !this.activeSavedRecord) return
      const defaults = getDefaultTemplateDraft(this.activeDraft.code)
      const key = this.activeSavedRecord._id || this.activeSavedRecord.code
      this.$set(this.draftsByKey, key, {
        _id: this.activeSavedRecord._id || '',
        code: defaults.code,
        subject: defaults.subject,
        bodyHtml: defaults.bodyHtml,
        highlightBox: { ...defaults.highlightBox },
        ctaButton: { ...defaults.ctaButton },
        qrBlock: { ...(defaults.qrBlock || { enabled: false }) },
        variables: [...defaults.variables]
      })
      this.feedbackBanner = {
        type: 'success',
        message: this.tr('email.resetDone', 'Restored recommended MFU default wording. Click Save Changes to apply.')
      }
    },
    async saveActiveDraft() {
      if (!this.activeDraft || !this.activeSavedRecord || !this.activeSavedRecord._id) return
      this.isSaving = true
      this.feedbackBanner.message = ''
      try {
        const serializedContent = serializeEditorToEmailHtml(this.activeDraft)
        const meta = getTemplateMeta(this.activeDraft.code)
        const payload = {
          _id: this.activeSavedRecord._id,
          subject: this.activeDraft.subject,
          content: serializedContent,
          variables: [...meta.variables]
        }
        await this.put(payload)
        await this.get()
        const key = this.activeSavedRecord._id || this.activeSavedRecord.code
        const freshDoc = this.orderedTemplates.find((tpl) => (tpl._id || tpl.code) === key) || {
          ...this.activeSavedRecord,
          ...payload
        }
        const normalized = normalizeTemplateRecord(freshDoc, freshDoc.code)
        this.$set(this.draftsByKey, key, {
          _id: normalized._id,
          code: normalized.code,
          subject: normalized.subject,
          bodyHtml: normalized.bodyHtml,
          highlightBox: { ...normalized.highlightBox },
          ctaButton: { ...normalized.ctaButton },
          qrBlock: { ...(normalized.qrBlock || { enabled: false }) },
          variables: [...normalized.variables]
        })
        this.feedbackBanner = {
          type: 'success',
          message: this.tr('email.saveSuccess', 'Email template saved successfully.')
        }
      } catch (_err) {
        this.feedbackBanner = {
          type: 'error',
          message: this.tr('email.saveError', 'Could not save changes. Please try again.')
        }
      } finally {
        this.isSaving = false
      }
    },
    async sendTestToOwner() {
      if (!this.activeDraft || this.isSendingTest) return
      const ownerEmail = String((this.currentAccountInfo && this.currentAccountInfo.email) || '').trim()
      if (ownerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
        this.feedbackBanner = {
          type: 'error',
          message: this.tr('email.testNoOwnerEmail', 'Could not find your signed-in account email. Please sign in again.')
        }
        return
      }
      this.isSendingTest = true
      this.feedbackBanner.message = ''
      try {
        const serializedContent = serializeEditorToEmailHtml(this.activeDraft)
        const payload = {
          code: this.activeDraft.code,
          subject: this.activeDraft.subject,
          content: serializedContent
        }
        if (ownerEmail) {
          payload.to = ownerEmail
        }
        const response = await Service.setting('email-template-test', payload)
        const result = response && response.data && response.data.data ? response.data.data : {}
        const targetEmail = result.to || ownerEmail
        const renderedSubject = result.renderedSubject || this.previewDoc.subject
        if (result.sent) {
          this.feedbackBanner = {
            type: 'success',
            message: this.tr('email.testSentSuccess', 'Test email sent to {email} ({subject}).')
              .replace('{email}', targetEmail)
              .replace('{subject}', renderedSubject)
          }
        } else {
          this.feedbackBanner = {
            type: 'success',
            message: this.tr('email.testRenderedNoSmtp', 'Preview verified for {email} ([TEST] {subject}), but SMTP credentials are not configured on this server.')
              .replace('{email}', targetEmail)
              .replace('{subject}', renderedSubject)
          }
        }
      } catch (_err) {
        this.feedbackBanner = {
          type: 'error',
          message: this.tr('email.testError', 'Could not send test email.')
        }
      } finally {
        this.isSendingTest = false
      }
    }
  }
}
</script>

<style scoped>
.email-studio-page {
  padding-bottom: 1.5rem;
}

.studio-mode-tabs {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.studio-mode-tab {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 0.84rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}

.studio-mode-tab:hover {
  color: #0f172a;
}

.studio-mode-tab.is-active {
  background: #ffffff;
  color: #8c1515;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.mfu-email-contact-strip {
  padding: 14px 20px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  text-align: left;
}

.mfu-contact-label {
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #8c1515;
  margin-bottom: 2px;
}

.mfu-contact-val {
  font-size: 0.8125rem;
  color: #334155;
}

.studio-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid transparent;
}

.banner-success {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.banner-error {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.banner-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: inherit;
  cursor: pointer;
  padding: 0 0.25rem;
}

.email-studio-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1.15fr) minmax(320px, 0.95fr);
  gap: 1rem;
  align-items: start;
}

.studio-pane {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

/* Left Sidebar */
.pane-header {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.pane-kicker {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #475569;
}

.count-pill {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.trigger-search-input {
  width: 100%;
  padding: 0.45rem 0.65rem 0.45rem 2rem;
  font-size: 0.84rem;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
}

.trigger-search-input:focus {
  border-color: #8c1515;
}

.trigger-list {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.trigger-item {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.7rem 0.75rem;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.trigger-item:hover {
  background-color: #f8fafc;
}

.trigger-item.is-active {
  background-color: #fef2f2;
  border-color: #fecaca;
}

.trigger-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trigger-item.is-active .trigger-icon-wrap {
  background-color: #8c1515;
  color: #ffffff;
}

.trigger-copy {
  min-width: 0;
  flex: 1;
}

.trigger-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.trigger-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.3;
}

.trigger-desc {
  font-size: 0.8125rem;
  color: #475569;
  margin-top: 0.2rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dirty-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background-color: #d97706;
  flex-shrink: 0;
}

.trigger-empty {
  padding: 1.25rem 0.75rem;
  text-align: center;
  font-size: 0.84rem;
  color: #64748b;
}

/* Center Editor */
.editor-topbar {
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.editor-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.editor-trigger-hint {
  font-size: 0.8125rem;
  color: #64748b;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.status-saved {
  background-color: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-unsaved {
  background-color: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.editor-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.btn-studio-primary,
.btn-studio-secondary,
.btn-studio-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-studio-primary {
  background-color: #8c1515;
  color: #ffffff;
}

.btn-studio-primary:hover:not(:disabled) {
  background-color: #701010;
}

.btn-studio-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-studio-secondary {
  background-color: #ffffff;
  border-color: #cbd5e1;
  color: #1e293b;
}

.btn-studio-secondary:hover:not(:disabled) {
  background-color: #f8fafc;
  border-color: #94a3b8;
}

.btn-studio-ghost {
  background-color: transparent;
  color: #64748b;
}

.btn-studio-ghost:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #0f172a;
}

.editor-scroll-body {
  padding: 1.1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.35rem;
  gap: 0.5rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0;
}

.field-hint {
  font-size: 0.8125rem;
  color: #64748b;
}

.studio-input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  color: #0f172a;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
}

.studio-input:focus {
  border-color: #8c1515;
}

.studio-input-sm {
  padding: 0.42rem 0.65rem;
  font-size: 0.84rem;
}

.variables-toolbar {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.75rem 0.85rem;
}

.variables-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.target-toggle {
  display: inline-flex;
  background: #e2e8f0;
  border-radius: 6px;
  padding: 2px;
}

.target-chip {
  border: none;
  background: transparent;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  cursor: pointer;
}

.target-chip.is-selected {
  background: #ffffff;
  color: #8c1515;
}

.variables-caption {
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.variables-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.var-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  padding: 0.3rem 0.55rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.var-chip:hover {
  border-color: #8c1515;
  background-color: #fef2f2;
}

.var-chip-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
}

.var-chip-code {
  font-size: 0.8125rem;
  color: #8c1515;
  background-color: #fef2f2;
  padding: 0.05rem 0.3rem;
  border-radius: 4px;
}

.studio-quill-shell {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.studio-quill-shell >>> .ql-toolbar.ql-snow {
  border: none;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.studio-quill-shell >>> .ql-container.ql-snow {
  border: none;
  min-height: 190px;
  font-family: inherit;
  font-size: 0.92rem;
}

.blocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.85rem;
}

.block-panel {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.8rem 0.9rem;
  background-color: #f8fafc;
}

.block-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.block-title {
  font-size: 0.83rem;
  font-weight: 700;
  color: #0f172a;
}

.block-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.1rem;
}

.switch-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;
  margin-bottom: 0;
}

.switch-checkbox {
  accent-color: #8c1515;
  cursor: pointer;
}

.block-fields {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.sub-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.2rem;
}

/* Right Preview Pane */
.preview-pane {
  position: sticky;
  top: 1rem;
}

.preview-toolbar {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.preview-stage {
  padding: 0.9rem;
  background-color: #f1f5f9;
}

.preview-frame {
  width: 100%;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.inbox-envelope {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
  font-size: 0.8125rem;
}

.envelope-row {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
}

.envelope-row:last-child {
  margin-bottom: 0;
}

.env-key {
  color: #64748b;
  min-width: 48px;
}

.env-val {
  color: #0f172a;
  word-break: break-word;
}

.envelope-subject {
  margin-top: 0.3rem;
  padding-top: 0.3rem;
  border-top: 1px dashed #e2e8f0;
}

.mfu-email-shell {
  padding: 1rem;
  background-color: #f6f9fc;
}

.mfu-email-card {
  background-color: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.mfu-email-header {
  padding: 20px 24px;
  text-align: center;
  background: linear-gradient(135deg, #ac1515 0%, #8a1111 100%);
  color: #ffffff;
}

.mfu-brand-title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mfu-brand-sub {
  font-size: 0.8125rem;
  opacity: 0.85;
  margin-top: 2px;
}

.mfu-email-body {
  padding: 20px 22px;
  font-size: 0.88rem;
  line-height: 1.6;
  color: #333333;
  word-break: break-word;
}

.mfu-email-body >>> p {
  margin-bottom: 0.75rem;
}

.mfu-email-body >>> p:last-child {
  margin-bottom: 0;
}

.mfu-email-footer {
  padding: 16px 20px;
  background-color: #fafbfc;
  border-top: 1px solid #f0f2f5;
  text-align: center;
  font-size: 0.8125rem;
  color: #8898aa;
}

.studio-state-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

@media (max-width: 1360px) {
  .email-studio-grid {
    grid-template-columns: 235px minmax(0, 1fr);
  }
  .preview-pane {
    grid-column: 1 / -1;
    position: static;
  }
}

@media (max-width: 820px) {
  .email-studio-grid {
    grid-template-columns: 1fr;
  }

  .trigger-list {
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0.5rem;
    padding: 0.55rem;
  }

  .trigger-item {
    flex: 0 0 auto;
    width: 220px;
    border-color: #e2e8f0;
    background-color: #f8fafc;
  }
}

@media (max-width: 575.98px) {
  .editor-topbar {
    padding: 0.85rem;
  }

  .editor-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .editor-scroll-body {
    padding: 0.85rem;
  }

  .mfu-email-header {
    padding: 16px;
  }

  .mfu-email-body {
    padding: 16px;
  }
}
</style>

<style>
@import '~quill/dist/quill.core.css';
@import '~quill/dist/quill.snow.css';
</style>
