<template>
  <div class="smtp-panel-wrap" data-test="smtp-settings-panel">
    <div v-if="statusBanner.message" class="studio-banner mb-3" :class="'banner-' + statusBanner.type" role="status">
      <div class="d-flex align-items-center">
        <CIcon :name="statusBanner.type === 'error' ? 'cil-warning' : 'cil-check-circle'" size="sm" class="mr-2 flex-shrink-0" />
        <span>{{ statusBanner.message }}</span>
      </div>
      <button type="button" class="banner-close" aria-label="Dismiss" @click="statusBanner.message = ''">
        &times;
      </button>
    </div>

    <div v-if="devRedirectTo" class="smtp-dev-notice mb-3" role="note" data-test="smtp-dev-redirect-notice">
      <CIcon name="cil-info" size="sm" class="mr-2 flex-shrink-0" />
      <span>{{ tr('email.smtp.devRedirectNotice', 'Developer mode safeguard active: all outgoing emails redirect to {email}.').replace('{email}', devRedirectTo) }}</span>
    </div>

    <div class="smtp-grid">
      <!-- LEFT / MAIN: SMTP Server & Sender Configuration Form -->
      <section class="studio-pane smtp-form-pane">
        <div class="editor-topbar">
          <div>
            <div class="d-flex align-items-center flex-wrap" style="gap: 8px;">
              <h2 class="editor-title mb-0">{{ tr('email.smtp.title', 'SMTP Mail Server Configuration') }}</h2>
              <span class="smtp-source-pill" :class="'source-' + sourceMode" data-test="smtp-source-badge">
                {{ sourceBadgeLabel }}
              </span>
            </div>
            <p class="editor-trigger-hint mb-0 mt-1">
              {{ tr('email.smtp.subtitle', 'Configure outgoing mail server credentials, Application Name, and Sender address without editing .env files.') }}
            </p>
          </div>
        </div>

        <div v-if="loadingConfig" class="smtp-loading-state">
          <CSpinner size="sm" color="danger" class="mr-2" />
          <span>{{ tr('common.loading', 'Loading configuration...') }}</span>
        </div>

        <form v-else class="editor-scroll-body" @submit.prevent="saveSmtpConfig" novalidate>
          <!-- Group 1: Connection & Credentials -->
          <div class="smtp-section">
            <h3 class="smtp-section-heading">{{ tr('email.smtp.connectionHeading', 'Mail Server & Credentials') }}</h3>

            <div class="smtp-fields-row">
              <div class="field-block mb-0 smtp-col-grow">
                <label class="field-label" for="smtp-host-input">
                  {{ tr('email.smtp.hostLabel', 'SMTP Host') }} <span class="text-danger">*</span>
                </label>
                <input
                  id="smtp-host-input"
                  v-model.trim="form.host"
                  type="text"
                  class="studio-input"
                  :class="{ 'is-invalid-input': errors.host }"
                  :placeholder="tr('email.smtp.hostPlaceholder', 'e.g. smtp.gmail.com or mail.mfu.ac.th')"
                />
                <span v-if="errors.host" class="field-error-text">{{ errors.host }}</span>
              </div>

              <div class="field-block mb-0 smtp-col-port">
                <label class="field-label" for="smtp-port-input">{{ tr('email.smtp.portLabel', 'Port') }}</label>
                <input
                  id="smtp-port-input"
                  v-model.trim="form.port"
                  type="number"
                  min="1"
                  max="65535"
                  class="studio-input studio-num"
                  :class="{ 'is-invalid-input': errors.port }"
                  placeholder="587"
                />
                <span v-if="errors.port" class="field-error-text">{{ errors.port }}</span>
              </div>

              <div class="field-block mb-0 smtp-col-sec">
                <label class="field-label" for="smtp-secure-select">{{ tr('email.smtp.secureModeLabel', 'Encryption / Security') }}</label>
                <select id="smtp-secure-select" v-model="form.secureMode" class="studio-input">
                  <option value="auto">{{ tr('email.smtp.secureAuto', 'Auto (TLS on 465 / STARTTLS)') }}</option>
                  <option value="tls">{{ tr('email.smtp.secureTls', 'SSL / TLS (Implicit)') }}</option>
                  <option value="starttls">{{ tr('email.smtp.secureStarttls', 'STARTTLS') }}</option>
                  <option value="none">{{ tr('email.smtp.secureNone', 'None (Unencrypted)') }}</option>
                </select>
              </div>
            </div>

            <div class="smtp-fields-row mt-3">
              <div class="field-block mb-0 smtp-col-half">
                <label class="field-label" for="smtp-user-input">{{ tr('email.smtp.usernameLabel', 'SMTP Username') }}</label>
                <input
                  id="smtp-user-input"
                  v-model.trim="form.username"
                  type="text"
                  autocomplete="username"
                  class="studio-input"
                  :placeholder="tr('email.smtp.usernamePlaceholder', 'e.g. noreply@mfu.ac.th')"
                />
              </div>

              <div class="field-block mb-0 smtp-col-half">
                <div class="field-label-row">
                  <label class="field-label" for="smtp-pass-input">{{ tr('email.smtp.passwordLabel', 'SMTP Password / App Password') }}</label>
                  <span v-if="hasSavedPassword && !form.clearPassword" class="saved-secret-pill" data-test="smtp-password-saved-badge">
                    {{ tr('email.smtp.passwordSavedBadge', 'Encrypted Password Stored') }}
                  </span>
                </div>
                <div class="password-input-wrap">
                  <input
                    id="smtp-pass-input"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    class="studio-input pr-password"
                    :disabled="form.clearPassword"
                    :placeholder="hasSavedPassword ? tr('email.smtp.passwordPlaceholderSaved', 'Saved password encrypted on server — leave blank to keep') : tr('email.smtp.passwordPlaceholderNew', 'Enter SMTP password')"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    @click="showPassword = !showPassword"
                  >
                    <CIcon :name="showPassword ? 'cil-low-vision' : 'cil-lock-unlocked'" size="sm" />
                  </button>
                </div>
                <label v-if="hasSavedPassword" class="clear-secret-check mt-2">
                  <input v-model="form.clearPassword" type="checkbox" class="switch-checkbox" />
                  <span>{{ tr('email.smtp.clearPasswordLabel', 'Remove stored password') }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Group 2: Application Name & Sender Identity -->
          <div class="smtp-section mt-4">
            <h3 class="smtp-section-heading">{{ tr('email.smtp.brandingHeading', 'Sender Identity & Application Branding') }}</h3>

            <div class="smtp-fields-row">
              <div class="field-block mb-0 smtp-col-half">
                <div class="field-label-row">
                  <label class="field-label" for="smtp-appname-input">{{ tr('email.smtp.appNameLabel', 'Application Name') }}</label>
                </div>
                <input
                  id="smtp-appname-input"
                  v-model.trim="form.appName"
                  type="text"
                  class="studio-input"
                  placeholder="Digital University"
                />
                <span class="field-hint d-block mt-1">{{ tr('email.smtp.appNameHint', 'Shown as sender display name and email header title') }}</span>
              </div>

              <div class="field-block mb-0 smtp-col-half">
                <div class="field-label-row">
                  <label class="field-label" for="smtp-sender-input">{{ tr('email.smtp.senderEmailLabel', 'Sender Email Address') }}</label>
                </div>
                <input
                  id="smtp-sender-input"
                  v-model.trim="form.senderEmail"
                  type="email"
                  class="studio-input"
                  :class="{ 'is-invalid-input': errors.senderEmail }"
                  placeholder="no-reply@mfu.ac.th"
                />
                <span v-if="errors.senderEmail" class="field-error-text d-block mt-1">{{ errors.senderEmail }}</span>
                <span v-else class="field-hint d-block mt-1">{{ tr('email.smtp.senderEmailHint', 'Address used in the From header; per-form contact emails use Reply-To') }}</span>
              </div>
            </div>

            <div class="effective-from-box mt-3">
              <span class="effective-from-label">{{ tr('email.smtp.previewFromLabel', 'Active Sender Preview') }}</span>
              <code class="effective-from-value" data-test="smtp-effective-from">{{ effectiveFromPreview }}</code>
            </div>
          </div>

          <!-- Save / Reset Actions -->
          <div class="smtp-form-footer mt-4">
            <div v-if="sourceMode === 'database'" class="reset-action-group">
              <button
                v-if="!confirmingReset"
                type="button"
                class="btn-studio-ghost"
                :disabled="saving || resetting"
                data-test="smtp-reset-trigger"
                @click="confirmingReset = true"
              >
                {{ tr('email.smtp.resetBtn', 'Reset to .env Default') }}
              </button>
              <div v-else class="inline-confirm-bar">
                <span class="small text-dark font-weight-medium mr-2">{{ tr('email.smtp.resetConfirm', 'Remove custom web SMTP settings and fall back to server .env variables?') }}</span>
                <button
                  type="button"
                  class="btn-studio-danger-sm"
                  :disabled="resetting"
                  data-test="smtp-reset-confirm"
                  @click="resetToEnvDefault"
                >
                  {{ resetting ? tr('email.smtp.resettingBtn', 'Resetting...') : tr('email.smtp.resetBtn', 'Reset to .env Default') }}
                </button>
                <button
                  type="button"
                  class="btn-studio-ghost"
                  :disabled="resetting"
                  @click="confirmingReset = false"
                >
                  {{ tr('button.cancel', 'Cancel') }}
                </button>
              </div>
            </div>
            <div v-else />

            <button
              type="submit"
              class="btn-studio-primary"
              :disabled="saving || resetting"
              data-test="smtp-save-btn"
            >
              <CIcon name="cil-save" size="sm" class="mr-1" />
              <span>{{ saving ? tr('email.smtp.savingBtn', 'Saving...') : tr('email.smtp.saveBtn', 'Save SMTP Config') }}</span>
            </button>
          </div>
        </form>
      </section>

      <!-- RIGHT: Live Connection Test & Envelope Check -->
      <aside class="studio-pane smtp-test-pane">
        <div class="preview-toolbar">
          <span class="pane-kicker">{{ tr('email.smtp.testHeading', 'Verify Connection & Send Test Mail') }}</span>
        </div>

        <div class="smtp-test-body">
          <div class="field-block">
            <label class="field-label" for="smtp-test-recipient">{{ tr('email.smtp.testRecipientLabel', 'Test Recipient Email') }}</label>
            <input
              id="smtp-test-recipient"
              v-model.trim="testRecipient"
              type="email"
              class="studio-input"
              :class="{ 'is-invalid-input': errors.testRecipient }"
              :placeholder="tr('email.smtp.testRecipientPlaceholder', 'admin@mfu.ac.th')"
            />
            <span v-if="errors.testRecipient" class="field-error-text d-block mt-1">{{ errors.testRecipient }}</span>
          </div>

          <button
            type="button"
            class="btn-studio-secondary w-100 justify-content-center"
            :disabled="testing || saving"
            data-test="smtp-test-btn"
            @click="runSmtpTest"
          >
            <CSpinner v-if="testing" size="sm" class="mr-2" />
            <CIcon v-else name="cil-paper-plane" size="sm" class="mr-2" />
            <span>{{ testing ? tr('email.smtp.testingBtn', 'Verifying SMTP...') : tr('email.smtp.testBtn', 'Verify & Send Test') }}</span>
          </button>

          <div
            v-if="testOutcome"
            class="smtp-test-result mt-3"
            :class="testOutcome.ok ? 'is-ok' : 'is-fail'"
            data-test="smtp-test-result"
          >
            <div class="font-weight-bold mb-1">{{ testOutcome.title }}</div>
            <div class="small">{{ testOutcome.detail }}</div>
          </div>

          <div class="smtp-envelope-summary mt-4">
            <div class="summary-row">
              <span class="summary-k">{{ tr('email.smtp.hostLabel', 'SMTP Host') }}</span>
              <span class="summary-v studio-num">{{ form.host || '—' }}:{{ form.port || '—' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-k">{{ tr('email.smtp.appNameLabel', 'Application Name') }}</span>
              <span class="summary-v">{{ form.appName || 'Digital University' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-k">{{ tr('email.smtp.senderEmailLabel', 'Sender Email') }}</span>
              <span class="summary-v">{{ effectiveSenderEmail }}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script>
import Service from '@/service/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export default {
  name: 'SmtpSettingsPanel',
  props: {
    adminEmail: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loadingConfig: false,
      saving: false,
      resetting: false,
      testing: false,
      confirmingReset: false,
      showPassword: false,
      sourceMode: 'unconfigured',
      hasSavedPassword: false,
      devRedirectTo: '',
      testRecipient: this.adminEmail || '',
      testOutcome: null,
      statusBanner: {
        type: 'success',
        message: ''
      },
      errors: {},
      form: {
        host: '',
        port: '587',
        secureMode: 'auto',
        username: '',
        password: '',
        clearPassword: false,
        appName: 'Digital University',
        senderEmail: ''
      }
    }
  },
  computed: {
    sourceBadgeLabel() {
      if (this.sourceMode === 'database') {
        return this.tr('email.smtp.sourceDb', 'Active: Admin Web Config')
      }
      if (this.sourceMode === 'env') {
        return this.tr('email.smtp.sourceEnv', 'Active: .env Fallback')
      }
      return this.tr('email.smtp.sourceUnconfigured', 'Not Configured')
    },
    effectiveSenderEmail() {
      return (this.form.senderEmail || this.form.username || 'no-reply@mfu.ac.th').trim()
    },
    effectiveFromPreview() {
      const name = (this.form.appName || 'Digital University').replace(/"/g, '').trim()
      return `"${name}" <${this.effectiveSenderEmail}>`
    }
  },
  watch: {
    adminEmail(nextVal) {
      if (!this.testRecipient && nextVal) {
        this.testRecipient = nextVal
      }
    }
  },
  mounted() {
    this.loadSmtpConfig()
  },
  methods: {
    tr(key, fallback) {
      if (this.$te && this.$te(key)) {
        return this.$t(key)
      }
      return fallback
    },
    applyResponseConfig(data) {
      if (!data) return
      this.sourceMode = data.source || 'unconfigured'
      this.hasSavedPassword = Boolean(data.hasPassword)
      this.devRedirectTo = data.devRedirectTo || ''
      this.form = {
        host: data.host || '',
        port: String(data.port || 587),
        secureMode: data.secureMode || 'auto',
        username: data.username || '',
        password: '',
        clearPassword: false,
        appName: data.appName || 'Digital University',
        senderEmail: data.senderEmail || ''
      }
      this.$emit('branding-updated', {
        appName: this.form.appName,
        senderEmail: data.senderEmail || this.effectiveSenderEmail
      })
    },
    async loadSmtpConfig() {
      this.loadingConfig = true
      try {
        const res = await Service.setting('smtp-get', {})
        const data = res && res.data && res.data.data ? res.data.data : null
        this.applyResponseConfig(data)
      } catch (err) {
        this.statusBanner = {
          type: 'error',
          message: (err && err.response && err.response.data && err.response.data.message) ||
            this.tr('email.smtp.saveError', 'Could not load SMTP configuration.')
        }
      } finally {
        this.loadingConfig = false
      }
    },
    validateForm({ requireTestRecipient = false } = {}) {
      const errs = {}
      if (!String(this.form.host || '').trim()) {
        errs.host = this.tr('email.smtp.hostRequired', 'SMTP Host is required.')
      }
      const parsedPort = Number.parseInt(String(this.form.port || '').trim(), 10)
      if (!Number.isFinite(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
        errs.port = this.tr('email.smtp.invalidPort', 'Port must be an integer between 1 and 65535.')
      }
      if (this.form.senderEmail && !EMAIL_REGEX.test(this.form.senderEmail)) {
        errs.senderEmail = this.tr('email.smtp.invalidEmail', 'Please enter a valid email address.')
      }
      if (requireTestRecipient && !EMAIL_REGEX.test(String(this.testRecipient || '').trim())) {
        errs.testRecipient = this.tr('email.smtp.invalidEmail', 'Please enter a valid email address.')
      }
      this.errors = errs
      return Object.keys(errs).length === 0
    },
    async saveSmtpConfig() {
      this.statusBanner.message = ''
      if (!this.validateForm()) return

      this.saving = true
      try {
        const payload = {
          host: this.form.host,
          port: Number.parseInt(this.form.port, 10),
          secureMode: this.form.secureMode,
          username: this.form.username,
          password: this.form.password,
          clearPassword: this.form.clearPassword,
          appName: this.form.appName || 'Digital University',
          senderEmail: this.form.senderEmail || this.form.username,
          enabled: true
        }
        const res = await Service.setting('smtp-update', payload)
        const data = res && res.data && res.data.data ? res.data.data : null
        this.applyResponseConfig(data)
        this.statusBanner = {
          type: 'success',
          message: this.tr('email.smtp.saveSuccess', 'SMTP settings saved securely.')
        }
      } catch (err) {
        this.statusBanner = {
          type: 'error',
          message: (err && err.response && err.response.data && err.response.data.message) ||
            this.tr('email.smtp.saveError', 'Could not save SMTP settings.')
        }
      } finally {
        this.saving = false
      }
    },
    async resetToEnvDefault() {
      this.resetting = true
      this.statusBanner.message = ''
      try {
        const res = await Service.setting('smtp-reset', {})
        const data = res && res.data && res.data.data ? res.data.data : null
        this.confirmingReset = false
        this.applyResponseConfig(data)
        this.statusBanner = {
          type: 'success',
          message: this.tr('email.smtp.resetSuccess', 'Reverted to .env SMTP configuration.')
        }
      } catch (err) {
        this.statusBanner = {
          type: 'error',
          message: (err && err.response && err.response.data && err.response.data.message) ||
            this.tr('email.smtp.saveError', 'Could not reset SMTP settings.')
        }
      } finally {
        this.resetting = false
      }
    },
    async runSmtpTest() {
      this.testOutcome = null
      this.statusBanner.message = ''
      if (!this.validateForm({ requireTestRecipient: true })) return

      this.testing = true
      try {
        const payload = {
          host: this.form.host,
          port: Number.parseInt(this.form.port, 10),
          secureMode: this.form.secureMode,
          username: this.form.username,
          password: this.form.password,
          clearPassword: this.form.clearPassword,
          appName: this.form.appName || 'Digital University',
          senderEmail: this.form.senderEmail || this.form.username,
          testTo: this.testRecipient
        }
        const res = await Service.setting('smtp-test', payload)
        const data = res && res.data && res.data.data ? res.data.data : {}
        if (data.verified && data.sent) {
          this.testOutcome = {
            ok: true,
            title: this.tr('email.smtp.testSuccess', 'SMTP handshake verified and test mail dispatched to {email}.')
              .replace('{email}', data.to || this.testRecipient),
            detail: `${data.effectiveFrom || this.effectiveFromPreview}${data.messageId ? ` · ID: ${data.messageId}` : ''}`
          }
        } else {
          this.testOutcome = {
            ok: false,
            title: this.tr('email.smtp.testFailed', 'SMTP verification failed: {reason}')
              .replace('{reason}', data.error || 'Unknown error'),
            detail: data.effectiveFrom || this.effectiveFromPreview
          }
        }
      } catch (err) {
        const reason = (err && err.response && err.response.data && err.response.data.message) || (err && err.message) || 'Connection error'
        this.testOutcome = {
          ok: false,
          title: this.tr('email.smtp.testFailed', 'SMTP verification failed: {reason}').replace('{reason}', reason),
          detail: `${this.form.host}:${this.form.port}`
        }
      } finally {
        this.testing = false
      }
    }
  }
}
</script>

<style scoped>
.smtp-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(300px, 0.85fr);
  gap: 1rem;
  align-items: start;
}

.studio-pane {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.editor-topbar {
  padding: 0.95rem 1.2rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #ffffff;
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

.editor-scroll-body {
  padding: 1.15rem 1.2rem;
}

.smtp-source-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.smtp-source-pill.source-database {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.smtp-source-pill.source-env {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.smtp-source-pill.source-unconfigured {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.smtp-dev-notice {
  display: flex;
  align-items: center;
  padding: 0.65rem 0.95rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  color: #1e40af;
  font-size: 0.82rem;
  font-weight: 500;
}

.smtp-section-heading {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid #f1f5f9;
}

.smtp-fields-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.smtp-col-grow {
  flex: 1 1 220px;
}

.smtp-col-port {
  flex: 0 0 110px;
}

.smtp-col-sec {
  flex: 1 1 190px;
}

.smtp-col-half {
  flex: 1 1 230px;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.35rem;
}

.field-label-row .field-label {
  margin-bottom: 0;
}

.field-hint {
  font-size: 0.8125rem;
  color: #64748b;
}

.field-error-text {
  font-size: 0.8125rem;
  color: #b91c1c;
  font-weight: 500;
}

.studio-input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.52rem 0.75rem;
  font-size: 0.86rem;
  color: #0f172a;
  background-color: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.studio-input:focus {
  outline: none;
  border-color: #8c1515;
  box-shadow: 0 0 0 3px rgba(140, 21, 21, 0.12);
}

.studio-input.is-invalid-input {
  border-color: #dc2626;
}

.studio-num {
  font-variant-numeric: tabular-nums;
}

.password-input-wrap {
  position: relative;
}

.pr-password {
  padding-right: 2.3rem;
}

.password-toggle-btn {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #64748b;
  padding: 0.25rem;
  cursor: pointer;
}

.password-toggle-btn:hover {
  color: #0f172a;
}

.saved-secret-pill {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
}

.clear-secret-check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: #475569;
  cursor: pointer;
  margin-bottom: 0;
}

.effective-from-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.effective-from-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.effective-from-value {
  font-size: 0.8125rem;
  color: #8c1515;
  background: #fef2f2;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
}

.smtp-form-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
}

.inline-confirm-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
}

.preview-toolbar {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.pane-kicker {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.smtp-test-body {
  padding: 1rem;
}

.smtp-test-result {
  padding: 0.75rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  border: 1px solid transparent;
}

.smtp-test-result.is-ok {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.smtp-test-result.is-fail {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.smtp-envelope-summary {
  border-top: 1px solid #e2e8f0;
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8125rem;
}

.summary-k {
  color: #64748b;
}

.summary-v {
  color: #0f172a;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}

.smtp-loading-state {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-size: 0.86rem;
}

.btn-studio-primary,
.btn-studio-secondary,
.btn-studio-ghost,
.btn-studio-danger-sm {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.48rem 0.9rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.btn-studio-primary {
  background: #8c1515;
  color: #ffffff;
}

.btn-studio-primary:hover:not(:disabled) {
  background: #731111;
}

.btn-studio-secondary {
  background: #ffffff;
  color: #1e293b;
  border-color: #cbd5e1;
}

.btn-studio-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.btn-studio-ghost {
  background: transparent;
  color: #475569;
}

.btn-studio-ghost:hover:not(:disabled) {
  background: #f1f5f9;
}

.btn-studio-danger-sm {
  background: #dc2626;
  color: #ffffff;
  padding: 0.35rem 0.7rem;
  font-size: 0.8125rem;
}

.btn-studio-primary:disabled,
.btn-studio-secondary:disabled,
.btn-studio-ghost:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 980px) {
  .smtp-grid {
    grid-template-columns: 1fr;
  }
}
</style>
