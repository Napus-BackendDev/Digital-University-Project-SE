<template>
    <div class="tab-setting-root">
        <section
            v-for="sectionKey in visibleSections"
            :key="sectionKey"
            :data-test="`setting-section-${sectionKey}`"
            class="setting-accordion-card mb-3"
            :class="{ 'is-expanded': isSectionExpanded(sectionKey), 'is-configured': isSectionActive(sectionKey) }"
        >
            <button
                type="button"
                :data-test="`setting-toggle-${sectionKey}`"
                class="setting-accordion-header"
                :aria-expanded="isSectionExpanded(sectionKey) ? 'true' : 'false'"
                @click="toggleSection(sectionKey)"
            >
                <div class="setting-header-main">
                    <span class="setting-header-icon" :class="{ 'is-active': isSectionActive(sectionKey) }" aria-hidden="true">
                        <svg v-if="sectionKey === 'status'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <polyline points="12 7 12 12 15 14" />
                        </svg>
                        <svg v-else-if="sectionKey === 'access'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <svg v-else-if="sectionKey === 'organization'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="4" y="3" width="16" height="18" rx="2" />
                            <path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M9 21v-3h6v3" />
                        </svg>
                        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="4" y1="7" x2="20" y2="7" />
                            <line x1="4" y1="17" x2="20" y2="17" />
                            <circle cx="9" cy="7" r="2.5" fill="currentColor" />
                            <circle cx="15" cy="17" r="2.5" fill="currentColor" />
                        </svg>
                    </span>

                    <div class="setting-header-text">
                        <div class="d-flex flex-wrap align-items-center" style="gap: 8px;">
                            <h5 class="setting-header-title mb-0">{{ getSectionTitle(sectionKey) }}</h5>
                            <span
                                class="setting-usage-pill"
                                :class="isSectionActive(sectionKey) ? 'is-used' : 'is-unused'"
                            >
                                {{ isSectionActive(sectionKey)
                                    ? $t('editor.settings.collapse.configuredBadge')
                                    : $t('editor.settings.collapse.defaultBadge') }}
                            </span>
                        </div>

                        <div
                            v-if="!isSectionExpanded(sectionKey)"
                            :data-test="`setting-summary-${sectionKey}`"
                            class="setting-collapsed-summary mt-2"
                        >
                            <span
                                v-for="(chip, cIdx) in getSectionSummaryChips(sectionKey)"
                                :key="`${sectionKey}-chip-${cIdx}`"
                                class="setting-summary-chip"
                                :class="`tone-${chip.tone || 'neutral'}`"
                            >
                                {{ chip.label }}
                            </span>
                        </div>
                    </div>
                </div>

                <span class="setting-chevron-wrap" aria-hidden="true">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="setting-chevron-svg"
                        :class="{ 'is-rotated': isSectionExpanded(sectionKey) }"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </span>
            </button>

            <div
                v-show="isSectionExpanded(sectionKey)"
                :data-test="`setting-body-${sectionKey}`"
                class="setting-accordion-body"
            >
                <component
                    :is="sectionComponentMap[sectionKey]"
                    :settings="settings"
                    :embedded="true"
                    @auto-save="triggerAutoSave"
                />
            </div>
        </section>
    </div>
</template>

<script>
import OrganizationControl from '../context/OrganizationControl.vue';
import FormStatus from '../context/FormStatus.vue';
import AccessControl from '../context/AccessControl.vue';
import ResponseSettings from '../context/ResponseSettings.vue';
import { buildSettingSectionSummary, isSettingSectionUsed } from '@/projects/utils/formPolicy';

const SECTION_COMPONENT_MAP = {
    status: 'FormStatus',
    access: 'AccessControl',
    organization: 'OrganizationControl',
    response: 'ResponseSettings'
};

const SECTION_TITLE_KEYS = {
    status: { key: 'editor.settings.status.title' },
    access: { key: 'editor.settings.access.title' },
    organization: { key: 'editor.settings.organization.title' },
    response: { key: 'editor.settings.response.title' }
};

const DEFAULT_SECTION_ORDER = ['status', 'access', 'organization', 'response'];

export default {
    name: 'TabSetting',
    components: {
        OrganizationControl,
        FormStatus,
        AccessControl,
        ResponseSettings
    },
    props: {
        settings: {
            type: Object,
            required: true
        },
        sections: {
            type: Array,
            default: null
        }
    },
    data() {
        return {
            userToggledMap: {}
        };
    },
    watch: {
        'settings._id'() {
            this.userToggledMap = {};
        }
    },
    computed: {
        sectionComponentMap() {
            return SECTION_COMPONENT_MAP;
        },
        visibleSections() {
            if (Array.isArray(this.sections) && this.sections.length > 0) {
                return this.sections.filter(key => Boolean(SECTION_COMPONENT_MAP[key]));
            }
            return DEFAULT_SECTION_ORDER;
        },
        hasExplicitSectionsSubset() {
            return Array.isArray(this.sections) && this.sections.length > 0;
        },
        currentLocale() {
            const storeLang = this.$store && this.$store.getters && this.$store.getters['Setting/lang'];
            const i18nLang = this.$i18n && this.$i18n.locale;
            return storeLang || i18nLang || 'th';
        }
    },
    methods: {
        translate(key) {
            if (typeof this.$t === 'function') {
                return this.$t(key);
            }
            return key;
        },
        storeList(getterKey) {
            const getters = this.$store && this.$store.getters;
            const list = getters ? getters[getterKey] : null;
            return Array.isArray(list) ? list : [];
        },
        getSectionTitle(sectionKey) {
            const meta = SECTION_TITLE_KEYS[sectionKey] || { key: sectionKey };
            return this.$t(meta.key);
        },
        isSectionActive(sectionKey) {
            return isSettingSectionUsed(sectionKey, this.settings);
        },
        isSectionExpanded(sectionKey) {
            if (Object.prototype.hasOwnProperty.call(this.userToggledMap, sectionKey)) {
                return Boolean(this.userToggledMap[sectionKey]);
            }
            if (this.hasExplicitSectionsSubset) {
                return true;
            }
            return sectionKey === 'status';
        },
        toggleSection(sectionKey) {
            const nextState = !this.isSectionExpanded(sectionKey);
            this.$set(this.userToggledMap, sectionKey, nextState);
        },
        getSectionSummaryChips(sectionKey) {
            return buildSettingSectionSummary(sectionKey, this.settings, {
                users: this.storeList('User/users'),
                organizations: this.storeList('Organizations/organizations'),
                roles: this.storeList('Roles/roles'),
                collaboratorTypes: this.storeList('Setting/collaborator/item'),
                locale: this.currentLocale,
                t: (k) => this.translate(k, k)
            });
        },
        triggerAutoSave() {
            this.$emit('auto-save');
        }
    }
};
</script>

<style scoped>
.tab-setting-root {
    padding-bottom: 220px;
}

.setting-accordion-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    overflow: visible;
}

.setting-accordion-card.is-expanded {
    border-color: transparent;
    box-shadow: 0 6px 20px -4px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
}

.setting-accordion-header {
    width: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 20px;
    border: none;
    border-radius: 18px;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.16s ease;
}

.setting-accordion-card.is-expanded .setting-accordion-header {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
}

.setting-accordion-header:hover {
    background-color: #f8fafc;
}

.setting-accordion-header:focus-visible {
    outline: 2px solid #8c1515;
    outline-offset: -2px;
}

.setting-header-main {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
    flex: 1;
}

.setting-header-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background-color: #f1f5f9;
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.setting-header-icon.is-active {
    background-color: #fef2f2;
    color: #8c1515;
}

.setting-header-text {
    min-width: 0;
    flex: 1;
}

.setting-header-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
}

.setting-usage-pill {
    display: inline-flex;
    align-items: center;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 700;
}

.setting-usage-pill.is-used {
    background-color: #fef2f2;
    color: #8c1515;
}

.setting-usage-pill.is-unused {
    background-color: #f1f5f9;
    color: #475569;
}

.setting-collapsed-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.setting-summary-chip {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
}

.setting-summary-chip.tone-neutral {
    background-color: #f1f5f9;
    color: #334155;
}

.setting-summary-chip.tone-accent {
    background-color: #fef2f2;
    color: #8c1515;
}

.setting-summary-chip.tone-info {
    background-color: #eff6ff;
    color: #1d4ed8;
}

.setting-summary-chip.tone-success {
    background-color: #ecfdf5;
    color: #047857;
}

.setting-summary-chip.tone-warning {
    background-color: #fffbeb;
    color: #b45309;
}

.setting-chevron-wrap {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background-color: #f8fafc;
    color: #475569;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.setting-accordion-header:hover .setting-chevron-wrap {
    background-color: #e2e8f0;
    color: #0f172a;
}

.setting-chevron-svg {
    transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.setting-chevron-svg.is-rotated {
    transform: rotate(180deg);
}

.setting-accordion-body {
    border-top: 1px solid #f1f5f9;
    overflow: visible;
}
</style>
