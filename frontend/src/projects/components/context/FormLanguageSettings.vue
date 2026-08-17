<template>
    <CCard class="mb-4 border-0 shadow-sm rounded-20">
        <CCardBody class="p-4">
            <h5 class="mb-2 font-weight-bold text-dark">{{ $t('flow.language.title') }}</h5>
            <p class="text-muted small mb-4">{{ $t('flow.language.description') }}</p>
            <div class="language-options mb-4">
                <button v-for="language in coreLanguages" :key="language.key" type="button"
                    class="language-option language-choice" :class="{ active: isSelected(language.key) }"
                    :aria-pressed="isSelected(language.key)" @click="toggleLanguage(language.key)">
                    <span class="language-code">{{ language.key.toUpperCase() }}</span>
                    <span class="font-weight-bold">{{ getLanguageLabel(language.key) }}</span>
                    <CIcon :name="isSelected(language.key) ? 'cil-check-circle' : 'cil-circle'" class="ml-auto" />
                </button>
            </div>
            <label class="small font-weight-bold text-muted mb-2 d-block">{{ $t('flow.language.otherLanguages') }}</label>
            <div class="d-flex align-items-start language-add-row mb-4">
                <CInput v-model.trim="newLanguage" :placeholder="$t('flow.language.placeholder')" class="mb-0 flex-grow-1"
                    maxlength="20" @keyup.enter="addLanguage" />
                <CButton color="primary" class="ml-2" @click="addLanguage">{{ $t('flow.language.add') }}</CButton>
            </div>
            <div v-if="customLanguages.length" class="language-options">
                <div v-for="key in customLanguages" :key="key" class="language-option active">
                    <span class="language-code">{{ key.toUpperCase() }}</span>
                    <span class="font-weight-bold">{{ getLanguageLabel(key) }}</span>
                    <button type="button" class="remove-language ml-auto" :disabled="selectedLanguages.length === 1"
                        @click="removeLanguage(key)" :aria-label="$t('flow.language.remove')">&times;</button>
                </div>
            </div>
            <div v-if="languageError" class="text-danger small mt-3">{{ languageError }}</div>
        </CCardBody>
    </CCard>
</template>

<script>
export default {
    name: 'FormLanguageSettings',
    props: { form: { type: Object, required: true } },
    data() {
        return {
            newLanguage: '',
            languageError: '',
            coreLanguages: [{ key: 'en' }, { key: 'th' }]
        };
    },
    created() {
        this.ensureSettings();
        this.syncAllLanguageFields();
    },
    computed: {
        selectedLanguages() {
            return this.form.settings && Array.isArray(this.form.settings.languages)
                ? this.form.settings.languages
                : [];
        },
        customLanguages() {
            return this.selectedLanguages.filter(key => !['en', 'th'].includes(key));
        }
    },
    methods: {
        ensureSettings() {
            if (!this.form.settings) this.$set(this.form, 'settings', {});
            if (!Array.isArray(this.form.settings.languages) || !this.form.settings.languages.length) {
                const inferred = Array.isArray(this.form.title)
                    ? this.form.title.map(item => String(item.key || '').toLowerCase()).filter(Boolean)
                    : [];
                this.$set(this.form.settings, 'languages', [...new Set(inferred.length ? inferred : ['en'])]);
            }
        },
        normalizeLanguage(value) {
            return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        },
        isSelected(key) {
            return this.selectedLanguages.includes(key);
        },
        toggleLanguage(key) {
            this.languageError = '';
            if (this.isSelected(key)) {
                if (this.selectedLanguages.length === 1) {
                    this.languageError = this.$t('flow.language.minimum');
                    return;
                }
                this.$set(this.form.settings, 'languages', this.selectedLanguages.filter(item => item !== key));
            } else {
                this.$set(this.form.settings, 'languages', [...this.selectedLanguages, key]);
            }
            this.syncAllLanguageFields();
            this.$emit('auto-save');
        },
        getLanguageLabel(key) {
            try {
                return new Intl.DisplayNames([this.$i18n.locale], { type: 'language' }).of(key)
                    || this.$t('flow.language.generic', { language: key.toUpperCase() });
            } catch (e) {
                return this.$t('flow.language.generic', { language: key.toUpperCase() });
            }
        },
        addLanguage() {
            this.languageError = '';
            const key = this.normalizeLanguage(this.newLanguage);
            if (!key) { this.languageError = this.$t('flow.language.empty'); return; }
            if (this.selectedLanguages.includes(key)) { this.languageError = this.$t('flow.language.duplicate'); return; }
            const next = [...this.selectedLanguages, key];
            this.$set(this.form.settings, 'languages', next);
            this.newLanguage = '';
            this.syncAllLanguageFields();
            this.$emit('auto-save');
        },
        removeLanguage(key) {
            this.languageError = '';
            if (this.selectedLanguages.length === 1) { this.languageError = this.$t('flow.language.minimum'); return; }
            if (!window.confirm(this.$t('flow.language.removeConfirm', { language: key.toUpperCase() }))) return;
            this.$set(this.form.settings, 'languages', this.selectedLanguages.filter(item => item !== key));
            this.syncAllLanguageFields();
            this.$emit('auto-save');
        },
        syncArray(items) {
            const current = Array.isArray(items) ? items : [];
            const synced = this.selectedLanguages.map(key => {
                const existing = current.find(item => String(item && item.key).toLowerCase() === key);
                return existing || { key, value: '' };
            });
            current.splice(0, current.length, ...synced);
        },
        syncQuestion(question) {
            if (!question) return;
            if (!Array.isArray(question.title)) this.$set(question, 'title', []);
            this.syncArray(question.title);
            if (Array.isArray(question.description)) this.syncArray(question.description);
            if (question.config && Array.isArray(question.config.description)) this.syncArray(question.config.description);
            const choices = question.config && Array.isArray(question.config.choices) ? question.config.choices : [];
            choices.forEach(choice => {
                if (!Array.isArray(choice.lang)) this.$set(choice, 'lang', []);
                this.syncArray(choice.lang);
            });
        },
        syncAllLanguageFields() {
            if (!Array.isArray(this.form.title)) this.$set(this.form, 'title', []);
            if (!Array.isArray(this.form.description)) this.$set(this.form, 'description', []);
            this.syncArray(this.form.title);
            this.syncArray(this.form.description);
            (this.form.questions || []).forEach(this.syncQuestion);
        }
    }
};
</script>

<style scoped>
.rounded-20 { border-radius: 20px !important; overflow: hidden; }
.language-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.language-option { min-height: 64px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; gap: 12px; background: #fff; }
.language-option.active { border-color: #22c55e; background: #f0fdf4; }
.language-choice { width: 100%; color: #334155; text-align: left; cursor: pointer; }
.language-choice:not(.active):hover { border-color: #94a3b8; background: #f8fafc; }
.language-code { min-width: 34px; padding: 5px; border-radius: 7px; background: #f1f5f9; text-align: center; font-size: .75rem; font-weight: 800; }
.remove-language { width: 30px; height: 30px; border: 0; border-radius: 50%; background: #fee2e2; color: #b91c1c; font-size: 1.2rem; line-height: 1; }
.remove-language:disabled { opacity: .35; cursor: not-allowed; }
@media (max-width: 576px) { .language-options { grid-template-columns: 1fr; } }
</style>
