<template>
    <div class="collab-input-wrapper">
        <div
            :data-test="chipBoxTestId"
            class="collab-chip-box"
            :class="{ 'is-focused': isInputFocused, 'is-invalid': Boolean(error) }"
            @click="focusInput"
        >
            <span
                v-for="(chip, idx) in value"
                :key="'pending-chip-' + chip.key"
                :data-test="pendingChipTestId"
                class="collab-pill-chip"
                :title="chip.email"
            >
                <img
                    v-if="chip.picture"
                    :src="chip.picture"
                    alt=""
                    class="collab-avatar-img"
                    @error="chip.picture = null"
                />
                <span
                    v-else
                    class="collab-avatar-fallback"
                    :style="{ backgroundColor: getAvatarColor(chip.email || chip.name) }"
                >
                    {{ getAvatarInitial(chip.name || chip.email) }}
                </span>
                <span class="collab-pill-label">{{ chip.displayLabel }}</span>
                <button
                    type="button"
                    :data-test="removeChipTestId"
                    class="collab-pill-remove"
                    :aria-label="$t('editor.settings.access.remove')"
                    @click.stop="removePendingChip(idx)"
                >
                    <CIcon name="cil-x" size="sm" />
                </button>
            </span>

            <input
                ref="tokenInput"
                v-model="query"
                :data-test="inputTestId"
                type="text"
                autocomplete="off"
                role="combobox"
                :aria-expanded="showSuggestionsPopup ? 'true' : 'false'"
                aria-autocomplete="list"
                class="collab-inline-input"
                :placeholder="value.length ? addMorePlaceholder : placeholder"
                @focus="isInputFocused = true"
                @blur="isInputFocused = false"
                @input="onQueryInput"
                @keydown="handleInputKeydown"
                @paste="handleInputPaste"
            />
        </div>

        <!-- Live "Did you mean?" Typeahead Popup (opens only while typing, capped at 5 non-scrolling rows) -->
        <div
            v-if="showSuggestionsPopup"
            :data-test="suggestionsTestId"
            role="listbox"
            class="collab-suggestions-menu"
            @mousedown.prevent
        >
            <div v-if="matchedUsers.length > 0" class="collab-suggestions-header">
                {{ $t('editor.settings.access.suggestionPrompt') }}
            </div>

            <button
                v-for="(item, sIdx) in actionableSuggestions"
                :key="'suggest-' + item.key"
                type="button"
                role="option"
                :aria-selected="activeSuggestionIndex === sIdx ? 'true' : 'false'"
                :data-test="item.kind === 'manual' ? manualOptionTestId : suggestionItemTestId"
                class="collab-suggestion-row"
                :class="{ 'is-active': activeSuggestionIndex === sIdx }"
                @mouseenter="activeSuggestionIndex = sIdx"
                @mousedown.prevent="selectSuggestion(item)"
            >
                <span v-if="item.kind === 'manual'" class="collab-suggestion-avatar collab-suggestion-plus">
                    <CIcon name="cil-plus" size="sm" />
                </span>
                <img
                    v-else-if="item.picture"
                    :src="item.picture"
                    alt=""
                    class="collab-suggestion-avatar collab-suggestion-img"
                    @error="item.picture = null"
                />
                <span
                    v-else
                    class="collab-suggestion-avatar collab-suggestion-initial"
                    :style="{ backgroundColor: getAvatarColor(item.email || item.name) }"
                >
                    {{ getAvatarInitial(item.name || item.email) }}
                </span>

                <span class="collab-suggestion-meta">
                    <span class="collab-suggestion-primary">
                        {{ item.kind === 'manual' ? $t('editor.settings.access.manualEmailAction', { email: item.email }) : item.name }}
                    </span>
                    <span class="collab-suggestion-secondary">
                        {{ item.kind === 'manual' ? $t('editor.settings.access.manualEmailSubtext') : item.email }}
                    </span>
                </span>
            </button>

            <div
                v-if="alreadyAddedHintEmail"
                :data-test="alreadyAddedHintTestId"
                class="collab-suggestion-hint"
            >
                {{ $t('editor.settings.access.alreadyAddedHint', { email: alreadyAddedHintEmail }) }}
            </div>
            <div
                v-else-if="actionableSuggestions.length === 0"
                :data-test="noMatchHintTestId"
                class="collab-suggestion-hint"
            >
                {{ $t('editor.settings.access.noMatchTypeEmailHint') }}
            </div>
        </div>

        <div v-if="error" :data-test="errorTestId" class="text-danger small mt-1 font-weight-bold">
            {{ error }}
        </div>
    </div>
</template>

<script>
import { isValidEmailAddress, parseEmailInputList } from '@/projects/utils/formPolicy';

const AVATAR_COLORS = ['#8c1515', '#1d4ed8', '#0f766e', '#6d28d9', '#b45309', '#be185d'];

/**
 * Shared Google-Forms-style tokenized pill-chip input with a 5-row non-scrolling live user typeahead
 * and free-text email locking via Spacebar / Enter / delimiter / paste.
 */
export default {
    name: 'UserEmailTokenInput',
    props: {
        value: {
            type: Array,
            default: () => []
        },
        users: {
            type: Array,
            default: () => []
        },
        excludedUserIds: {
            type: Array,
            default: () => []
        },
        excludedEmails: {
            type: Array,
            default: () => []
        },
        placeholder: {
            type: String,
            default: ''
        },
        addMorePlaceholder: {
            type: String,
            default: ''
        },
        error: {
            type: String,
            default: ''
        },
        invalidErrorKey: {
            type: String,
            default: 'editor.settings.access.invalidCollaboratorEmails'
        },
        chipBoxTestId: {
            type: String,
            default: 'collaborator-chip-box'
        },
        pendingChipTestId: {
            type: String,
            default: 'pending-collaborator-chip'
        },
        removeChipTestId: {
            type: String,
            default: 'remove-pending-chip'
        },
        inputTestId: {
            type: String,
            default: 'collaborator-email-input'
        },
        suggestionsTestId: {
            type: String,
            default: 'collaborator-suggestions'
        },
        suggestionItemTestId: {
            type: String,
            default: 'collaborator-suggestion-item'
        },
        manualOptionTestId: {
            type: String,
            default: 'collaborator-manual-option'
        },
        alreadyAddedHintTestId: {
            type: String,
            default: 'collaborator-already-added-hint'
        },
        noMatchHintTestId: {
            type: String,
            default: 'collaborator-no-match-hint'
        },
        errorTestId: {
            type: String,
            default: 'collaborator-email-error'
        }
    },
    data() {
        return {
            query: '',
            isInputFocused: false,
            activeSuggestionIndex: 0
        };
    },
    watch: {
        query() {
            this.activeSuggestionIndex = 0;
        }
    },
    computed: {
        existingIdentifiers() {
            const ids = new Set((this.excludedUserIds || []).filter(Boolean).map(id => String(id)));
            const emails = new Set((this.excludedEmails || []).filter(Boolean).map(em => String(em).trim().toLowerCase()));

            (this.value || []).forEach(chip => {
                if (!chip) return;
                if (chip.userId) ids.add(String(chip.userId));
                if (chip.email) emails.add(String(chip.email).trim().toLowerCase());
            });

            return { ids, emails };
        },
        matchedUsers() {
            const q = String(this.query || '').trim().toLowerCase();
            if (!q || !Array.isArray(this.users)) return [];

            const { ids, emails } = this.existingIdentifiers;
            const filtered = this.users.filter(u => {
                if (!u) return false;
                const uid = u._id ? String(u._id) : '';
                const email = String(u.email || '').trim().toLowerCase();
                if ((uid && ids.has(uid)) || (email && emails.has(email))) {
                    return false;
                }
                const name = String(u.name || u.fullname || '').toLowerCase();
                return name.includes(q) || email.includes(q);
            });

            return filtered
                .sort((a, b) => {
                    const aEmail = String(a.email || '').trim().toLowerCase();
                    const bEmail = String(b.email || '').trim().toLowerCase();
                    const aName = String(a.name || a.fullname || '').toLowerCase();
                    const bName = String(b.name || b.fullname || '').toLowerCase();
                    const aPrefix = aEmail.startsWith(q) || aName.startsWith(q) ? 0 : 1;
                    const bPrefix = bEmail.startsWith(q) || bName.startsWith(q) ? 0 : 1;
                    return aPrefix - bPrefix;
                })
                .slice(0, 5);
        },
        manualEmailCandidate() {
            const raw = String(this.query || '').trim().toLowerCase();
            if (!raw || !isValidEmailAddress(raw)) return '';
            if (this.existingIdentifiers.emails.has(raw)) return '';
            const exactInMatches = this.matchedUsers.some(
                u => String(u.email || '').trim().toLowerCase() === raw
            );
            return exactInMatches ? '' : raw;
        },
        alreadyAddedHintEmail() {
            const raw = String(this.query || '').trim().toLowerCase();
            if (!raw || !isValidEmailAddress(raw)) return '';
            return this.existingIdentifiers.emails.has(raw) ? raw : '';
        },
        actionableSuggestions() {
            const items = this.matchedUsers.map(u => this.buildCandidateFromUser(u));
            if (this.manualEmailCandidate) {
                items.push({
                    kind: 'manual',
                    key: `manual:${this.manualEmailCandidate}`,
                    userId: null,
                    name: this.manualEmailCandidate,
                    displayLabel: this.manualEmailCandidate,
                    email: this.manualEmailCandidate,
                    picture: null
                });
            }
            return items;
        },
        showSuggestionsPopup() {
            if (this.error) return false;
            return Boolean(this.isInputFocused && String(this.query || '').trim().length > 0);
        }
    },
    methods: {
        getAvatarInitial(text) {
            const clean = String(text || '?').trim();
            return clean ? clean.charAt(0).toUpperCase() : '?';
        },
        getAvatarColor(seed) {
            const str = String(seed || '');
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
            }
            return AVATAR_COLORS[hash % AVATAR_COLORS.length];
        },
        buildCandidateFromUser(userObj) {
            const email = String(userObj.email || '').trim().toLowerCase();
            const name = String(userObj.name || userObj.fullname || email).trim();
            return {
                kind: 'user',
                key: email || String(userObj._id),
                userId: userObj._id,
                name,
                displayLabel: name || email,
                email,
                picture: userObj.picture || null
            };
        },
        resolveCandidateByEmail(email) {
            const cleanEmail = String(email || '').trim().toLowerCase();
            const usersList = Array.isArray(this.users) ? this.users : [];
            const matched = usersList.find(
                u => u && typeof u.email === 'string' && u.email.trim().toLowerCase() === cleanEmail
            );
            if (matched) {
                return this.buildCandidateFromUser(matched);
            }
            return {
                kind: 'manual',
                key: cleanEmail,
                userId: null,
                name: cleanEmail,
                displayLabel: cleanEmail,
                email: cleanEmail,
                picture: null
            };
        },
        focusInput() {
            if (this.$refs.tokenInput && typeof this.$refs.tokenInput.focus === 'function') {
                this.$refs.tokenInput.focus();
            }
        },
        clearQueryInput() {
            this.query = '';
            this.$emit('update:error', '');
            this.activeSuggestionIndex = 0;
            if (this.$refs.tokenInput) {
                this.$refs.tokenInput.value = '';
            }
        },
        lockCandidates(candidateList) {
            const next = Array.isArray(this.value) ? [...this.value] : [];
            const { ids, emails } = this.existingIdentifiers;
            let changed = false;

            candidateList.forEach(candidate => {
                if (!candidate) return;
                if ((candidate.userId && ids.has(String(candidate.userId))) || (candidate.email && emails.has(candidate.email))) {
                    return;
                }
                if (candidate.userId) ids.add(String(candidate.userId));
                if (candidate.email) emails.add(candidate.email);
                next.push({
                    key: candidate.key || candidate.email || String(candidate.userId),
                    userId: candidate.userId || null,
                    name: candidate.name || candidate.email,
                    displayLabel: candidate.displayLabel || candidate.name || candidate.email,
                    email: candidate.email,
                    picture: candidate.picture || null
                });
                changed = true;
            });

            if (changed) {
                this.$emit('input', next);
            }
        },
        tryCommitTrailingDelimitedEmail(rawText) {
            const raw = String(rawText || '');
            if (!/\s$/.test(raw) && !/[,;]$/.test(raw)) return false;
            const stripped = raw.replace(/[\s,;]+$/, '').trim().toLowerCase();
            if (!stripped) {
                this.clearQueryInput();
                return true;
            }
            if (isValidEmailAddress(stripped)) {
                this.lockCandidates([this.resolveCandidateByEmail(stripped)]);
                this.clearQueryInput();
                return true;
            }
            return false;
        },
        onQueryInput() {
            this.$emit('update:error', '');
            this.isInputFocused = true;
            this.tryCommitTrailingDelimitedEmail(this.query);
        },
        selectSuggestion(item) {
            this.lockCandidates([item]);
            this.clearQueryInput();
            this.$nextTick(() => {
                this.focusInput();
            });
        },
        removePendingChip(index) {
            if (Array.isArray(this.value) && index >= 0 && index < this.value.length) {
                const next = this.value.slice();
                next.splice(index, 1);
                this.$emit('input', next);
            }
            this.$nextTick(() => {
                this.focusInput();
            });
        },
        handleInputPaste(event) {
            const pasted = event && event.clipboardData ? event.clipboardData.getData('text') : '';
            if (!pasted || !/[\s,;]+/.test(pasted.trim())) return;

            event.preventDefault();
            const { validEmails, invalidEntries } = parseEmailInputList(pasted);
            this.lockCandidates(validEmails.map(email => this.resolveCandidateByEmail(email)));

            if (invalidEntries.length > 0) {
                this.query = invalidEntries.join(', ');
                this.$emit('update:error', this.$t(this.invalidErrorKey, {
                    emails: invalidEntries.join(', ')
                }));
            } else {
                this.clearQueryInput();
            }
        },
        handleInputKeydown(event) {
            if (!event) return;
            const key = event.key;

            if (key === 'ArrowDown') {
                if (this.showSuggestionsPopup && this.actionableSuggestions.length > 0) {
                    event.preventDefault();
                    this.activeSuggestionIndex = (this.activeSuggestionIndex + 1) % this.actionableSuggestions.length;
                }
                return;
            }

            if (key === 'ArrowUp') {
                if (this.showSuggestionsPopup && this.actionableSuggestions.length > 0) {
                    event.preventDefault();
                    const total = this.actionableSuggestions.length;
                    this.activeSuggestionIndex = (this.activeSuggestionIndex - 1 + total) % total;
                }
                return;
            }

            if (key === 'Escape') {
                this.isInputFocused = false;
                return;
            }

            if (key === 'Backspace') {
                if (!this.query && Array.isArray(this.value) && this.value.length > 0) {
                    const next = this.value.slice(0, -1);
                    this.$emit('input', next);
                }
                return;
            }

            const isSpaceKey = key === ' ' || key === 'Spacebar' || event.code === 'Space';
            if (isSpaceKey || key === ',' || key === ';') {
                const raw = String(this.query || '').trim();
                if (!raw) {
                    if (isSpaceKey) event.preventDefault();
                    return;
                }
                const lower = raw.toLowerCase();
                if (isValidEmailAddress(lower)) {
                    event.preventDefault();
                    this.lockCandidates([this.resolveCandidateByEmail(lower)]);
                    this.clearQueryInput();
                    return;
                }
                if (key === ',' || key === ';') {
                    const { validEmails, invalidEntries } = parseEmailInputList(raw);
                    if (validEmails.length > 0 && invalidEntries.length === 0) {
                        event.preventDefault();
                        this.lockCandidates(validEmails.map(email => this.resolveCandidateByEmail(email)));
                        this.clearQueryInput();
                    }
                }
                return;
            }

            if (key === 'Enter') {
                event.preventDefault();
                const trimmed = String(this.query || '').trim();
                if (trimmed) {
                    if (this.showSuggestionsPopup && this.actionableSuggestions.length > 0) {
                        const chosen = this.actionableSuggestions[this.activeSuggestionIndex] || this.actionableSuggestions[0];
                        this.selectSuggestion(chosen);
                        return;
                    }
                    if (this.alreadyAddedHintEmail) {
                        this.query = '';
                        return;
                    }
                    this.$emit('submit');
                    return;
                }
                if (Array.isArray(this.value) && this.value.length > 0) {
                    this.$emit('submit');
                }
            }
        },
        /**
         * Collects all locked chips and valid typed emails for parent submission, leaving invalid tokens in place.
         */
        consumeCandidatesForSubmit() {
            const rawQuery = String(this.query || '').trim();
            const { validEmails, invalidEntries } = parseEmailInputList(rawQuery);
            const candidates = Array.isArray(this.value) ? [...this.value] : [];
            const queuedKeys = new Set(candidates.map(c => c.email || String(c.userId || '')));

            validEmails.forEach(email => {
                if (!queuedKeys.has(email)) {
                    queuedKeys.add(email);
                    candidates.push(this.resolveCandidateByEmail(email));
                }
            });

            this.$emit('input', []);
            if (invalidEntries.length > 0) {
                this.query = invalidEntries.join(', ');
            } else {
                this.query = '';
                if (this.$refs.tokenInput) {
                    this.$refs.tokenInput.value = '';
                }
            }
            this.activeSuggestionIndex = 0;

            return { candidates, invalidEntries };
        }
    }
};
</script>

<style scoped>
.collab-input-wrapper {
    position: relative;
    min-width: 0;
    width: 100%;
}

.collab-chip-box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-height: 45px;
    padding: 5px 10px;
    border-radius: 12px;
    border: 1px solid #cbd5e1;
    background-color: #f8fafc;
    cursor: text;
    transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.collab-chip-box.is-focused {
    background-color: #ffffff;
    border-color: #8c1515;
    box-shadow: 0 2px 6px rgba(140, 21, 21, 0.14);
}

.collab-chip-box.is-invalid {
    border-color: #dc2626;
}

.collab-pill-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    padding: 3px 6px 3px 4px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #0f172a;
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.2;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

.collab-avatar-img,
.collab-avatar-fallback {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
}

.collab-avatar-img {
    object-fit: cover;
}

.collab-avatar-fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 700;
}

.collab-pill-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: min(220px, 100%);
}

.collab-pill-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: #475569;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}

.collab-pill-remove:hover,
.collab-pill-remove:focus-visible {
    background-color: #fee2e2;
    color: #b91c1c;
    outline: none;
}

.collab-inline-input {
    flex: 1 1 160px;
    min-width: 120px;
    height: 32px;
    border: none;
    outline: none;
    background: transparent;
    color: #0f172a;
    caret-color: #8c1515;
    font-size: 0.92rem;
    padding: 2px 4px;
}

.collab-inline-input::placeholder {
    color: #64748b;
}

.collab-suggestions-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 990;
    overflow: visible;
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 6px 0;
    box-shadow: 0 10px 26px -4px rgba(15, 23, 42, 0.14), 0 4px 10px -2px rgba(15, 23, 42, 0.06);
}

.collab-suggestions-header {
    padding: 6px 14px 4px;
    font-size: 0.8125rem;
    font-weight: 700;
    color: #475569;
}

.collab-suggestion-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.14s ease;
}

.collab-suggestion-row:hover,
.collab-suggestion-row.is-active {
    background-color: #eff6ff;
}

.collab-suggestion-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex-shrink: 0;
}

.collab-suggestion-img {
    object-fit: cover;
}

.collab-suggestion-initial {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 0.875rem;
    font-weight: 700;
}

.collab-suggestion-plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #fef2f2;
    color: #8c1515;
    border: 1px solid #fecaca;
}

.collab-suggestion-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.collab-suggestion-primary {
    font-size: 0.9rem;
    font-weight: 600;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.collab-suggestion-secondary {
    font-size: 0.8125rem;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.collab-suggestion-hint {
    padding: 10px 14px;
    font-size: 0.83rem;
    color: #475569;
}
</style>
