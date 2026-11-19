<template>
    <div class="flex-grow-1">

        <div v-if="isPublicForm" class="public-lang-header d-flex justify-content-end align-items-center py-2 px-3 mx-auto">
            <div class="public-lang-toggle btn-group shadow-sm" role="group" aria-label="Language switcher" style="border-radius: 20px; overflow: hidden;">
                <button type="button" class="btn btn-sm"
                    :class="currentLocale === 'th' ? 'btn-primary font-weight-bold active' : 'btn-light'"
                    @click="setLanguage('th')">
                    ไทย
                </button>
                <button type="button" class="btn btn-sm"
                    :class="currentLocale === 'en' ? 'btn-primary font-weight-bold active' : 'btn-light'"
                    @click="setLanguage('en')">
                    EN
                </button>
            </div>
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="py-4">
            <SkeletonLoader type="form-fill" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="fillform-center text-center mt-5">
            <CCard class="border-0 shadow p-4 mx-auto" style="border-radius: 20px; max-width: 480px;">
                <CCardBody>
                    <CIcon name="cil-warning" size="3xl" class="text-danger mb-3" style="width: 56px; height: 56px;" />
                    <p class="text-danger font-weight-bold mb-3">{{ error }}</p>
                    <CButton v-if="errorCanSwitchAccount" color="outline-primary" style="border-radius: 10px; font-weight: 600;"
                        data-test="switch-account-btn" @click="switchGoogleAccount">
                        {{ $t('form.switchGoogleAccount') }}
                    </CButton>
                </CCardBody>
            </CCard>
        </div>

        <!-- Content -->
        <div v-else-if="form" class="fillform-body">

            <!-- Form Submission Success State (Public Form) -->
            <div v-if="isSubmissionComplete" class="fillform-center text-center mt-5">
                <CCard class="border-0 shadow p-4 mx-auto" style="border-radius: 20px; max-width: 520px;">
                    <CCardBody>
                        <div class="mb-4">
                            <div class="success-icon mb-3 mx-auto" style="width: 64px; height: 64px; border-radius: 50%; background: #e6f4ea; display: flex; align-items: center; justify-content: center;">
                                <CIcon name="cil-check" size="xl" class="text-success" style="font-size: 2rem;" />
                            </div>
                            <h3 class="font-weight-bold mb-2">{{ $t('form.submissionSuccessTitle') || (currentLocale === 'en' ? 'Submission Completed' : 'ส่งแบบสอบถามเรียบร้อยแล้ว') }}</h3>
                            <p class="text-muted mb-3">{{ submissionSuccessText }}</p>
                            <div v-if="canEditFromSuccessModal" class="mt-3">
                                <CButton color="outline-primary" style="border-radius: 8px; font-weight: 600;" @click="onEditSubmittedResponse">
                                    <CIcon name="cil-pencil" size="sm" class="mr-1" />
                                    {{ $t('form.editResponse') || (currentLocale === 'en' ? 'Edit Response' : 'แก้ไขคำตอบ') }}
                                </CButton>
                            </div>
                        </div>
                    </CCardBody>
                </CCard>
            </div>

            <!-- Form Unavailable Card (Draft / Scheduled / Closed / Quota) -->
            <div v-else-if="unavailableReason && !isPreviewMode && !isDuplicateMode" class="fillform-center text-center mt-5">
                <CCard class="border-0 shadow p-4 mx-auto" style="border-radius: 20px; max-width: 480px;">
                    <CCardBody>
                        <div class="mb-3">
                            <CIcon :name="unavailableIcon" size="3xl" class="mb-3"
                                :class="unavailableReason === 'scheduled' ? 'text-warning' : 'text-danger'"
                                style="width: 60px; height: 60px;" />
                            <h4 class="font-weight-bold">{{ unavailableTitle }}</h4>
                            <p class="text-muted mb-2">{{ unavailableDescription }}</p>
                            <p v-if="unavailableReason === 'scheduled' && scheduleOpenAtText" class="font-weight-bold text-dark mb-0">
                                {{ scheduleOpenAtText }}
                            </p>
                            <p v-if="unavailableReason === 'closed' && scheduleCloseAtText" class="small text-muted mb-0">
                                {{ $t('form.formClosedEndAtLabel') }} {{ scheduleCloseAtText }}
                            </p>
                        </div>
                    </CCardBody>
                </CCard>
            </div>

            <!-- Login Required Overlay -->
            <div v-else-if="isLoginRequired" class="fillform-center text-center mt-5">
                <CCard class="border-0 shadow p-4 mx-auto" style="border-radius: 20px; max-width: 450px;">
                    <CCardBody>
                        <div class="mb-4">
                            <CIcon name="cil-lock-locked" size="3xl" class="text-primary mb-3"
                                style="width: 60px; height: 60px;" />
                            <h4 class="font-weight-bold">{{ $t('form.loginRequired') }}</h4>
                            <p class="text-muted">{{ loginPromptMessage }}</p>
                            <p v-if="supportsExternalEmailLogin" data-test="external-login-hint"
                                class="small text-muted bg-light border rounded px-3 py-2 mb-0">
                                {{ $t('form.externalLoginSupportedHint') }}
                            </p>
                        </div>
                        <CButton color="primary" block size="lg" style="border-radius: 12px; font-weight: 600;"
                            @click="onAuthenGoogle">
                            {{ $t('form.signInWithGoogle') }}
                        </CButton>
                    </CCardBody>
                </CCard>
            </div>

            <!-- Content below replaces the blocking overlay -->
            <template v-else>
                <CRow class="fillform-layout-row align-items-start justify-content-center">
                    <CCol cols="12" lg="9" xl="8" class="fillform-main-col">
                        <CCard class="mb-3 border header-card">
                            <div v-if="isPreviewMode" class="preview-banner p-2 px-3 d-flex flex-wrap align-items-center justify-content-center text-white font-weight-bold" style="gap: 10px;">
                                <span class="d-inline-flex align-items-center">
                                    <CIcon name="cil-eye" class="mr-2" />
                                    {{ $t('form.previewBanner') }}
                                </span>
                                <CButton v-if="hasAnyPreviewAnswer" size="sm" color="light" variant="outline"
                                    class="preview-reset-btn py-0 px-2" @click="resetPreviewAnswers">
                                    {{ $t('form.previewReset') }}
                                </CButton>
                            </div>
                            <div v-if="isDuplicateMode" class="preview-banner p-2 text-center text-white font-weight-bold">
                                <CIcon name="cil-copy" class="mr-2" />
                                {{ $t('form.duplicateBanner') }}
                            </div>
                            <CCardBody class="p-3 p-md-4">
                                <h1 class="form-main-title">{{ getLang(form.title) || $t('common.untitled') }}</h1>
                                <p v-if="getLang(form.description)" class="form-main-desc mb-0">
                                    {{ getLang(form.description) }}
                                </p>
                                <div v-if="!isPreviewMode && !isDuplicateMode && user && user.email && ((form.settings && (form.settings.collectEmail || form.settings.requireLogin)) || hasIndividualAccessRestriction)"
                                    data-test="signed-in-respondent-bar"
                                    class="mt-3 pt-2 border-top d-flex flex-wrap align-items-center justify-content-between small text-muted"
                                    style="gap: 8px;">
                                    <span>
                                        <CIcon name="cil-envelope-closed" size="sm" class="mr-1 text-primary" />
                                        {{ $t('form.signedInRespondentLabel') }}
                                        <strong class="text-dark">{{ user.email }}</strong>
                                    </span>
                                    <button type="button" class="btn btn-link btn-sm p-0 font-weight-bold switch-account-btn" @click="switchGoogleAccount">
                                        {{ $t('form.switchGoogleAccount') }}
                                    </button>
                                </div>
                            </CCardBody>
                        </CCard>

                        <!-- Before You Start Notice Card (Requirement 2.1) -->
                        <CCard class="border before-start-notice-card mb-3" data-test="before-start-notice-card">
                            <div class="response-settings-card-header p-3">
                                <div class="d-flex align-items-center" style="gap: 10px;">
                                    <div class="settings-header-icon">
                                        <CIcon name="cil-info" size="sm" />
                                    </div>
                                    <div>
                                        <h2 class="response-settings-card-title mb-0">{{ $t('form.responseSummary.beforeStartTitle') }}</h2>
                                        <p class="response-settings-card-subtitle mb-0">{{ $t('form.responseSummary.subtitle') }}</p>
                                    </div>
                                </div>
                            </div>
                            <CCardBody class="p-3 pt-3">
                                <div class="response-rule-list">
                                    <div v-for="rule in responseSettingItems" :key="rule.key" class="response-rule-item" :data-test="'before-start-rule-' + rule.key">
                                        <div class="rule-item-icon" :class="rule.iconClass">
                                            <CIcon :name="rule.icon" size="sm" class="rule-badge-icon" />
                                        </div>
                                        <div class="rule-item-content">
                                            <div class="rule-item-title">{{ rule.title }}</div>
                                            <div v-if="rule.description" class="rule-item-desc">{{ rule.description }}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="before-start-notes mt-3 pt-2 border-top">
                                    <ul class="response-note-list mb-0">
                                        <li>{{ isPreviewMode ? $t('form.responseNote.previewAutoSave') : $t('form.responseNote.autoSave') }}</li>
                                        <li>{{ isPreviewMode ? $t('form.responseNote.previewSkipTest') : $t('form.responseNote.submitRequired') }}</li>
                                    </ul>
                                </div>
                            </CCardBody>
                        </CCard>

                        <!-- Submission / Edit Status Notice -->
                        <div v-if="isAlreadySubmitted" class="side-status-notice side-status-notice--done mb-3">
                            <CIcon name="cil-check-circle" size="sm" class="mr-2 flex-shrink-0" />
                            <span>{{ $t('form.alreadySubmitted') }}</span>
                        </div>
                        <div v-else-if="isEditingSubmitted" class="side-status-notice side-status-notice--edit mb-3">
                            <CIcon name="cil-pencil" size="sm" class="mr-2 flex-shrink-0" />
                            <span>{{ $t('form.editingSubmittedBanner') }}</span>
                        </div>

                        <!-- Required Question Validation Summary Banner -->
                        <div v-if="missingRequiredCount > 0" class="alert alert-danger shadow-sm d-flex align-items-center mb-3" style="border-radius: 12px;">
                            <CIcon name="cil-warning" class="mr-2 flex-shrink-0" size="lg" />
                            <div>
                                <strong>{{ currentLocale === 'en' ? 'Please complete all required questions before submitting' : 'กรุณาตอบคำถามที่จำเป็นให้ครบถ้วนก่อนส่งแบบสอบถาม' }}</strong>
                                <span class="ml-1">({{ currentLocale === 'en' ? `Missing ${missingRequiredCount} required questions` : `ขาดอีก ${missingRequiredCount} ข้อ` }})</span>
                            </div>
                        </div>

                <!-- Question Cards -->
                <transition-group name="fade-slide" tag="div">
                    <div v-for="(question, index) in visibleQuestions" :key="convertIdToStr(question._id) || index"
                        v-if="isQuestionVisible(question)" :id="'question-card-' + convertIdToStr(question._id)">
                        <!-- Section Divider Tab -->
                        <div v-if="isType(question, 'section')" class="section-divider-public my-4">
                            <div class="section-divider-public-header d-flex align-items-center mb-2">
                                <span class="section-divider-public-pill">
                                    {{ $t('form.sectionLabel') }} {{ getSectionNumber(question, index) }}
                                </span>
                                <div class="section-divider-public-line flex-grow-1 ml-3"></div>
                            </div>
                            <h2 v-if="getLang(question.title)" class="section-display-title mb-1">
                                {{ getLang(question.title) }}
                            </h2>
                            <p v-if="question.config && question.config.description && question.config.description.length && getLang(question.config.description)"
                                class="section-display-desc mb-0">
                                {{ getLang(question.config.description) }}
                            </p>
                        </div>

                        <CCard v-else
                            class="mb-3"
                            :class="['question-card border', { 'card-error': hasError(question._id), 'followup-card': isFollowUp(question) }]">
                            <CCardBody class="p-3 p-md-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <p v-if="!isType(question, 'section', 'title_description', 'image')"
                                        :class="['question-index', { 'followup-number': isFollowUp(question) }]">
                                        {{ $t('form.question') }} {{ getQuestionNumber(question, index) }}
                                    </p>
                                    <!-- Answered Badge -->
                                    <span v-if="hasAnswer(question._id)" class="answered-badge">
                                        <CIcon name="cil-check-circle" size="sm" class="mr-1" />
                                        {{ $t('form.answered') || 'ตอบแล้ว' }}
                                    </span>
                                </div>
                                <p v-if="!isType(question, 'section', 'title_description', 'image')" class="question-title mb-1">
                                    {{ getLang(question.title) }}
                                    <span v-if="question.isRequired" class="text-danger ml-1">*</span>
                                </p>
                                <p v-if="!isType(question, 'section', 'title_description', 'image') && question.description && question.description.length && getLang(question.description)"
                                    class="text-muted small mb-3">
                                    {{ getLang(question.description) }}
                                </p>

                            <!-- Free Text -->
                            <CTextarea v-if="isType(question, 'free_text', 'short_answer', 'paragraph')"
                                v-model="answers[convertIdToStr(question._id)]" :placeholder="$t('form.yourAnswer') || 'คำตอบของคุณ'" rows="3"
                                class="mb-0" :disabled="isAlreadySubmitted"
                                :lazy="false" :maxlength="getMaxTextLength(question)"
                                @input="(val, e) => onTextAnswerInput(question, val, e)"
                                @update:value="(val) => clampTextAnswer(question, val)"
                                @change="(e) => { autoSave(true); scrollToNextQuestion(question); }"
                                @blur="() => autoSave(true)" />

                            <!-- Multiple Choice / Checkboxes -->
                            <div v-else-if="isType(question, 'multiple_choice', 'checkbox')" class="options-container">
                                <label v-for="(opt, oIdx) in (question.config && question.config.choices || [])"
                                    :key="'opt-' + convertIdToStr(question._id) + '-' + getOptionKey(opt, oIdx)"
                                    class="option-row">
                                    <input
                                        :type="(question.config && question.config.allowMultipleSelect) ? 'checkbox' : 'radio'"
                                        :name="'q_' + convertIdToStr(question._id)" :value="getOptionKey(opt, oIdx)"
                                        v-model="answers[convertIdToStr(question._id)]" class="option-input"
                                        :disabled="isAlreadySubmitted"
                                        @change="(e) => { clearError(question._id); autoSave(true); if (!(question.config && question.config.allowMultipleSelect)) { scrollToNextQuestion(question); } }" />
                                    <span>{{ getOptionLabel(opt) }}</span>
                                </label>
                            </div>

                            <!-- Rating -->
                            <div v-else-if="isType(question, 'rating')">
                                <div class="rating-scale-wrapper">
                                    <div class="rating-container">
                                        <button v-for="n in (question.config && question.config.maxRating || 5)" :key="n"
                                            class="star-btn"
                                            :class="{ 'star-active': answers[convertIdToStr(question._id)] >= n }"
                                            @click="onRate(question, n)" type="button"
                                            :disabled="isAlreadySubmitted">★</button>
                                    </div>
                                    <div class="rating-anchors d-flex justify-content-between align-items-center text-muted small mt-1 px-1">
                                        <span>{{ currentLocale === 'en' ? '1 = Lowest' : '1 = น้อยที่สุด' }}</span>
                                        <small v-if="answers[convertIdToStr(question._id)]" class="font-weight-bold text-dark rating-score-counter">
                                            {{ answers[convertIdToStr(question._id)] }} / {{ question.config && question.config.maxRating || 5 }}
                                        </small>
                                        <span>{{ currentLocale === 'en' ? `${question.config && question.config.maxRating || 5} = Highest` : `${question.config && question.config.maxRating || 5} = มากที่สุด` }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- File Upload -->
                            <div v-else-if="isType(question, 'file_upload')">
                                <div class="d-flex flex-wrap" style="gap: 12px;">
                                    <template v-for="n in (question.config && Number(question.config.maxFiles) || 1)">
                                        <div class="file-upload-slot"
                                            :class="{ 'has-file': getAnswerAsArray(question._id)[n - 1] }"
                                            @click="!isAlreadySubmitted && triggerUpload(question._id)">

                                            <template v-if="getAnswerAsArray(question._id)[n - 1]">
                                                <div
                                                    class="file-slot-preview w-100 h-100 d-flex flex-column align-items-center justify-content-center position-relative">

                                                    <div class="remove-btn bg-danger rounded-circle text-white d-flex align-items-center justify-content-center shadow-sm"
                                                        style="width: 22px; height: 22px; position: absolute; top: 6px; right: 6px; cursor: pointer; z-index: 2;"
                                                        @click.stop="removeFile(question._id, n - 1)">
                                                        <span
                                                            style="font-size: 14px; font-weight: bold; line-height: 1;">&times;</span>
                                                    </div>
                                                    <template
                                                        v-if="isPreviewableImage(getAnswerAsArray(question._id)[n - 1])">
                                                        <img :src="resolveAnswerFileUrl(getAnswerAsArray(question._id)[n - 1])"
                                                            class="slot-image" />
                                                    </template>
                                                    <template
                                                        v-else-if="isPreviewablePdf(getAnswerAsArray(question._id)[n - 1])">
                                                        <CIcon name="cil-description" height="40"
                                                            class="text-danger mb-1" />
                                                        <span class="small text-truncate w-100 px-2 text-center">{{
                                                            getAnswerFileName(getAnswerAsArray(question._id)[n - 1])
                                                            }}</span>
                                                    </template>
                                                    <template v-else>
                                                        <CIcon name="cil-paperclip" height="40"
                                                            class="text-primary mb-1" />
                                                        <span class="small text-truncate w-100 px-2 text-center">{{
                                                            getAnswerFileName(getAnswerAsArray(question._id)[n - 1])
                                                            }}</span>
                                                    </template>
                                                </div>
                                            </template>

                                            <template v-else>
                                                <div
                                                    class="file-slot-empty d-flex flex-column align-items-center justify-content-center h-100">
                                                    <CIcon name="cil-cloud-upload" height="32"
                                                        class="text-muted mb-2" />
                                                    <span class="small text-muted font-weight-bold">{{ $t('common.upload') || (currentLocale === 'en' ? 'Upload' : 'อัปโหลดไฟล์') }}</span>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                                </div>

                                <input :ref="'fileInput-' + question._id" type="file"
                                    :multiple="(question.config && Number(question.config.maxFiles) > 1)"
                                    :accept="getAcceptString(question)" class="d-none"
                                    :disabled="isAlreadySubmitted"
                                    @change="e => { handleFileChange(question._id, e.target.files, question); clearError(question._id); autoSave(true); }" />
                            </div>

                            <!-- Title & Description -->
                            <div v-else-if="isType(question, 'title_description')">
                                <h2 class="section-display-title">{{ getLang(question.title) }}</h2>
                                <p v-if="question.config && question.config.description && question.config.description.length"
                                    class="section-display-desc mb-0">{{ getLang(question.config.description) }}</p>
                            </div>

                            <!-- Image -->
                            <div v-else-if="isType(question, 'image')">
                                <img v-if="question.config && question.config.image"
                                    :src="resolveImageUrl(question.config.image)" class="question-full-image" alt="" />
                                <div v-else class="image-question-placeholder">
                                    <CIcon name="cil-image-1" :height="40" class="mb-2" />
                                </div>
                            </div>

                            <!-- Fallback -->
                            <CInput v-else v-model="answers[question._id]" :placeholder="$t('form.yourAnswer')"
                                class="mb-0" @input="() => autoSave()" @change="() => autoSave(true)"
                                @blur="() => autoSave(true)" />

                            <!-- Inline Required Error Indicator -->
                            <div v-if="hasError(question._id)" class="required-error-feedback text-danger mt-2 font-weight-bold d-flex align-items-center">
                                <CIcon name="cil-warning" size="sm" class="mr-1 text-danger" />
                                <span>{{ $t('form.fieldRequired') || (currentLocale === 'en' ? 'This question is required' : 'กรุณาตอบคำถามนี้') }}</span>
                            </div>

                        </CCardBody>
                    </CCard>
                    </div>
                </transition-group>

                        <!-- Submit / Duplicate Button -->
                        <div v-if="!isAlreadySubmitted && visibleQuestions && visibleQuestions.length > 0"
                            id="submit-section" class="px-0 px-sm-3 py-3 d-flex justify-content-end mb-3">
                            <CButton v-if="!isDuplicateMode" color="primary" @click="submitForm" :disabled="submitting"
                                class="px-5 submit-action-btn">
                                <CSpinner v-if="submitting" size="sm" class="mr-1" />
                                {{ submitting ? $t('common.submitting') : (isPreviewMode ? $t('form.previewTestSubmit') : (isEditingSubmitted ? $t('form.updateResponse') : $t('form.submit'))) }}
                            </CButton>
                            <CButton v-else color="info" @click="duplicateForm" :disabled="submitting"
                                class="px-5 text-white font-weight-bold submit-action-btn">
                                <CSpinner v-if="submitting" size="sm" class="mr-1" />
                                <CIcon name="cil-copy" class="mr-2" />
                                {{ submitting ? $t('common.submitting') : $t('form.copyForm') }}
                            </CButton>
                        </div>
                    </CCol>
                </CRow>

            </template>
        </div>

        <!-- Modal -->
        <CModal :show.sync="showModal" :centered="true" :close-on-backdrop="true" class="success-modal"
            @update:show="val => { if (!val) onModalHidden(); }">
            <template #body-wrapper>
                <div class="success-modal-card">
                    <div class="success-content text-center">
                        <div :class="modalType === 'error' ? 'modal-icon-error' : 'success-icon'" aria-hidden="true">
                            <CIcon :name="modalType === 'error' ? 'cil-warning' : 'cil-check'" size="xl" />
                        </div>

                        <h2 class="success-title">{{ modalTitle }}</h2>
                        <p class="success-message">{{ modalMessage }}</p>

                        <div class="success-actions">
                            <CButton v-if="canEditFromSuccessModal" color="outline-secondary" class="mr-2 font-weight-bold"
                                @click="onEditSubmittedResponse">
                                <CIcon name="cil-pencil" size="sm" class="mr-1" />
                                {{ $t('form.editResponse') }}
                            </CButton>
                            <CButton :color="modalType === 'error' ? 'danger' : 'success'"
                                :class="modalType === 'error' ? 'error-ok-button' : 'success-ok-button'"
                                @click="onModalOk">{{ $t('common.ok') }}
                            </CButton>
                        </div>
                    </div>
                </div>
            </template>
        </CModal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SkeletonLoader from '../../components/Util/SkeletonLoader.vue'
import {
    getScheduleStatus,
    resolveFormAccessMode,
    isMfuInstitutionalEmail,
    isLoginRequiredByForm,
    isGeneralOrgEntry,
    isUserAllowedByIndividualAccess,
    isUserAllowedByOrganizationAndRole,
    normalizeAllowedEmails,
    isQuotaReached,
    findMissingRequiredQuestions,
    getOrCreateGuestSessionId,
    extractPolicyErrorReason,
    getReachableQuestionIds,
    buildResponseRuleDetails,
    isNonInputQuestionType,
    getQuestionNumberInSection
} from '@/projects/utils/formPolicy'
import { isUserAdmin } from '@/projects/utils/analytics'
import { clearClientSession } from '@/projects/utils/authSession'
import api from '@/service/api'

export default {
    name: 'Fillform',
    components: {
        SkeletonLoader
    },
    props: {
        formId: { type: String, required: true },
    },
    data() {
        return {
            form: null,
            answers: {},
            showModal: false,
            modalTitle: '',
            modalMessage: '',
            modalType: '',
            draftResponseId: null,
            submit: false,
            loading: false,
            submitting: false,
            isSaving: false,
            needsSave: false,
            savePromise: null,
            saveTimeout: null,
            saveTimer: null,
            error: null,
            errorCanSwitchAccount: false,
            isNewMode: this.$route.query.new === 'true',
            errorIds: new Set(),
            missingRequiredCount: 0,
            isSubmissionComplete: false,
            responderId: null,
            guestSessionId: null,
            isAlreadySubmitted: false,
            isEditingSubmitted: false,
            unavailableReason: null,
            scheduleOpenAtText: '',
            scheduleCloseAtText: '',
            filePreviewUrlCache: null,
            filePreviewUrls: [],
            isHydrating: false,
            hydratedUserId: null,
            pendingUserRefresh: false,
        };
    },
    created() {
        this.filePreviewUrlCache = new WeakMap();
        if (this.user && this.user._id) {
            this.responderId = this.user._id;
        }
    },
    mounted() {
        this.onInit();
    },
    beforeDestroy() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        this.filePreviewUrls.forEach((url) => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                // no-op
            }
        });
        this.filePreviewUrls = [];
    },
    methods: {
        getAnswerAsArray(questionId) {
            const ans = this.answers[this.convertIdToStr(questionId)];
            if (ans === undefined || ans === null || ans === '') return [];
            if (Array.isArray(ans)) return ans;
            return [ans];
        },
        extractResponseDoc(res) {
            const rawData = res && res.data ? res.data : res;
            const node = rawData && rawData.data ? rawData.data : rawData;
            return Array.isArray(node) ? node[0] : node;
        },
        parseAnswerUrls(val) {
            if (!val) return [];
            let list = val;
            if (typeof val === 'string') {
                const trimmed = val.trim();
                if (trimmed.startsWith('[')) {
                    try {
                        list = JSON.parse(trimmed);
                    } catch (e) {
                        list = [val];
                    }
                } else {
                    list = [val];
                }
            }
            if (!Array.isArray(list)) list = [list];
            return list.filter((u) => typeof u === 'string' && u.trim());
        },
        snapshotFileAnswers() {
            const snapshot = {};
            Object.keys(this.answers || {}).forEach((qId) => {
                const val = this.answers[qId];
                if (!Array.isArray(val)) return;
                const hasFile = val.some((item) => typeof File !== 'undefined' && item instanceof File);
                if (hasFile) {
                    snapshot[qId] = val.slice();
                }
            });
            return snapshot;
        },
        syncUploadedFileAnswers(savedDoc, snapshot) {
            if (!savedDoc || !Array.isArray(savedDoc.answers) || !snapshot) return;
            const answerByQuestion = {};
            savedDoc.answers.forEach((ans) => {
                if (!ans) return;
                const qId = this.convertIdToStr(typeof ans.question === 'object' ? ans.question._id : ans.question);
                if (qId) answerByQuestion[qId] = ans.response;
            });
            Object.keys(snapshot).forEach((qId) => {
                const sentItems = snapshot[qId];
                if (!Array.isArray(sentItems) || !Object.prototype.hasOwnProperty.call(answerByQuestion, qId)) return;
                const serverUrls = this.parseAnswerUrls(answerByQuestion[qId]);
                if (serverUrls.length === 0) return;

                const existingSentUrls = new Set(sentItems.filter((x) => typeof x === 'string'));
                const newlyUploadedUrls = serverUrls.filter((u) => !existingSentUrls.has(u));
                const currentItems = Array.isArray(this.answers[qId]) ? this.answers[qId].slice() : [];
                if (currentItems.length === 0) return;

                let uploadIdx = 0;
                let changed = false;
                const nextItems = currentItems.map((item) => {
                    if (typeof File !== 'undefined' && item instanceof File && sentItems.includes(item)) {
                        const replacement = newlyUploadedUrls[uploadIdx] || serverUrls[uploadIdx];
                        if (replacement) {
                            uploadIdx += 1;
                            changed = true;
                            return replacement;
                        }
                    }
                    return item;
                });
                if (changed) {
                    this.$set(this.answers, qId, nextItems);
                }
            });
        },
        getResponderStorageKey() {
            return `du.formfill.responder.${this.formId}`;
        },
        loadStoredResponderId() {
            try {
                if (typeof window === 'undefined' || !window.localStorage) return null;
                return window.localStorage.getItem(this.getResponderStorageKey());
            } catch (e) {
                return null;
            }
        },
        persistResponderId(id) {
            try {
                if (!id || typeof window === 'undefined' || !window.localStorage) return;
                window.localStorage.setItem(this.getResponderStorageKey(), String(id));
            } catch (e) {
                // ignore storage errors
            }
        },
        async ensureResponderId() {
            if (this.user && this.user._id) {
                this.responderId = this.user._id;
                this.guestSessionId = null;
                this.persistResponderId(this.responderId);
                return this.responderId;
            }
            const activeUserId = (typeof window !== 'undefined' && window.localStorage)
                ? window.localStorage.getItem('activeUserId')
                : null;
            if (activeUserId) {
                try {
                    const activeUser = await this.$store.dispatch('User/get', { _id: activeUserId });
                    const resolvedId = (activeUser && activeUser._id) || (this.user && this.user._id);
                    if (resolvedId) {
                        this.responderId = resolvedId;
                        this.guestSessionId = null;
                        this.persistResponderId(this.responderId);
                        return this.responderId;
                    }
                } catch (e) {
                    // continue cleanly to guest session below
                }
            }

            this.responderId = null;
            if (!this.guestSessionId) {
                this.guestSessionId = getOrCreateGuestSessionId(this.formId);
            }
            return null;
        },
        isSameResponseActor(r, currentResponder, guestId) {
            if (!r) return false;
            const fId = (typeof r.form === 'object' && r.form ? r.form._id : r.form);
            if (String(fId) !== String(this.form._id)) return false;
            const rId = (typeof r.responder === 'object' && r.responder ? r.responder._id : r.responder);
            if (currentResponder) {
                return Boolean(rId && String(rId) === String(currentResponder));
            }
            return !rId && Boolean(guestId && String(r.guestSessionId || '') === String(guestId));
        },
        formatScheduleDate(dateVal) {
            if (!dateVal) return '';
            const d = new Date(dateVal);
            if (Number.isNaN(d.getTime())) return '';
            const locale = (this.$i18n && this.$i18n.locale === 'th') ? 'th-TH' : 'en-GB';
            return d.toLocaleString(locale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        resolveImageUrl(value) {
            if (!value || typeof value !== 'string') return '';
            if (value.startsWith('data:') || value.startsWith('http://') || value.startsWith('https://')) {
                return value;
            }

            const apiBase = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8081/api/v1/';
            const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '');
            if (value.startsWith('/')) {
                return `${backendOrigin}${value}`;
            }

            return `${backendOrigin}/${value}`;
        },
        resolveAnswerFileUrl(value) {
            if (!value) return '';

            if (value instanceof File) {
                if (this.filePreviewUrlCache && this.filePreviewUrlCache.has(value)) {
                    return this.filePreviewUrlCache.get(value);
                }
                const objUrl = URL.createObjectURL(value);
                if (this.filePreviewUrlCache) this.filePreviewUrlCache.set(value, objUrl);
                this.filePreviewUrls.push(objUrl);
                return objUrl;
            }

            if (typeof value === 'string') {
                if (value.startsWith('blob:')) return value;
                return this.resolveImageUrl(value);
            }

            if (value && typeof value === 'object') {
                if (value.url) return this.resolveImageUrl(value.url);
                if (value.path) return this.resolveImageUrl(value.path);
            }

            return '';
        },
        restoreAnswersFromResponse(responseDoc) {
            if (!responseDoc || !Array.isArray(responseDoc.answers)) return;

            const questionIds = new Set((this.form && this.form.questions || []).map(q => String(q._id)));
            const restored = {};

            responseDoc.answers.forEach(answer => {
                if (!answer || !answer.question) return;
                const qid = typeof answer.question === 'object' && answer.question !== null
                    ? String(answer.question._id || answer.question)
                    : String(answer.question);

                if (!questionIds.has(qid)) return;

                let val = answer.response;
                try {
                    if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                        val = JSON.parse(val);
                    }
                } catch (e) {
                    // Keep raw value if parsing fails.
                }
                restored[qid] = val;
            });

            this.answers = { ...this.answers, ...restored };
        },
        getAnswerFileName(value) {
            if (!value) return '-';
            if (value instanceof File) return value.name || 'Attachment';
            if (typeof value === 'string') return value.split('/').pop() || 'Attachment';
            return value.name || value.filename || value.originalname || 'Attachment';
        },
        getAnswerFileType(value) {
            if (!value) return '';
            if (value instanceof File) return String(value.type || '').toLowerCase();
            if (value && typeof value === 'object') {
                return String(value.type || value.mimeType || value.mimetype || '').toLowerCase();
            }
            return '';
        },
        getAnswerFileExt(value) {
            const filename = this.getAnswerFileName(value);
            const idx = filename.lastIndexOf('.');
            return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
        },
        isPreviewableImage(value) {
            const type = this.getAnswerFileType(value);
            const ext = this.getAnswerFileExt(value);
            return type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
        },
        isPreviewablePdf(value) {
            const type = this.getAnswerFileType(value);
            const ext = this.getAnswerFileExt(value);
            return type === 'application/pdf' || ext === 'pdf';
        },
        isPreviewableVideo(value) {
            const type = this.getAnswerFileType(value);
            const ext = this.getAnswerFileExt(value);
            return type.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogg'].includes(ext);
        },
        async onInit() {
            this.loading = true;
            this.isHydrating = true;
            this.error = null;
            this.errorCanSwitchAccount = false;
            this.unavailableReason = null;
            this.isAlreadySubmitted = false;
            this.isEditingSubmitted = false;
            try {
                const data = await this.$store.dispatch('Forms/getById', { _id: this.formId });

                this.form = {
                    ...data,
                    questions: [...(data.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
                };

                if (!this.isPreviewMode && !this.isDuplicateMode) {
                    const schedStatus = getScheduleStatus(this.form.schedule);
                    if (schedStatus === 'draft' || schedStatus === 'scheduled' || schedStatus === 'closed' || schedStatus === 'closed_forever') {
                        this.unavailableReason = schedStatus;
                        this.scheduleOpenAtText = this.formatScheduleDate(this.form.schedule?.startAt);
                        this.scheduleCloseAtText = this.formatScheduleDate(this.form.schedule?.endAt);
                        this.loading = false;
                        return;
                    }
                }

                const settings = this.form.settings || {};
                let currentResponder = (this.user && this.user._id) || await this.ensureResponderId();
                const currentUser = this.user || {};
                const isAdmin = isUserAdmin(currentUser);
                this.hydratedUserId = currentResponder ? String(currentResponder) : null;
                const currentGuestId = currentResponder ? null : (this.guestSessionId || getOrCreateGuestSessionId(this.form._id));
                if (!currentResponder) {
                    this.guestSessionId = currentGuestId;
                }

                const accessMode = resolveFormAccessMode(this.form);

                if (accessMode === 'private' && !this.isPreviewMode && !isAdmin) {
                    const allowedEmails = normalizeAllowedEmails(settings.allowedEmails);
                    const hasIndividualAccess = (Array.isArray(settings.allowedUser) && settings.allowedUser.length > 0) || allowedEmails.length > 0;
                    const formOrgs = Array.isArray(this.form.organization) ? this.form.organization.filter(Boolean) : [];
                    const hasSelectedOrgs = formOrgs.length > 0;
                    const hasAllowedRoles = Array.isArray(settings.allowedRoles) && settings.allowedRoles.length > 0;
                    const hasOrgOrRoleScope = hasSelectedOrgs || hasAllowedRoles;
                    const isOpenPublicGeneral = hasSelectedOrgs
                        && formOrgs.some(isGeneralOrgEntry)
                        && !hasAllowedRoles
                        && !isLoginRequiredByForm(this.form);

                    if (!isOpenPublicGeneral) {
                        if (!currentUser || !currentUser._id) {
                            this.loading = false;
                            return;
                        }

                        const isAllowedIndividual = hasIndividualAccess
                            && isUserAllowedByIndividualAccess(settings, currentUser._id, currentUser.email);

                        if (!isAllowedIndividual) {
                            if (hasOrgOrRoleScope) {
                                if (!isMfuInstitutionalEmail(currentUser.email)) {
                                    this.error = this.$t('form.accessDenied');
                                    this.errorCanSwitchAccount = true;
                                    this.loading = false;
                                    return;
                                }
                                const orgRoleCheck = isUserAllowedByOrganizationAndRole(this.form, currentUser);
                                if (!orgRoleCheck.allowed) {
                                    this.error = orgRoleCheck.reason === 'ACCESS_DENIED_ROLE'
                                        ? this.$t('form.accessDeniedRole')
                                        : this.$t('form.accessDenied');
                                    this.errorCanSwitchAccount = true;
                                    this.loading = false;
                                    return;
                                }
                            } else if (hasIndividualAccess) {
                                this.error = this.$t('form.accessDeniedPersonal');
                                this.errorCanSwitchAccount = true;
                                this.loading = false;
                                return;
                            } else {
                                if (!isMfuInstitutionalEmail(currentUser.email)) {
                                    this.error = this.$t('form.accessDenied');
                                    this.errorCanSwitchAccount = true;
                                    this.loading = false;
                                    return;
                                }
                            }
                        }
                    }
                }

                if (isLoginRequiredByForm(this.form) && (!currentUser || !currentUser._id) && !this.isPreviewMode) {
                    this.loading = false;
                    return;
                }

                const init = {};
                (data.questions || []).forEach(q => {
                    if (isNonInputQuestionType(q)) return;
                    const isMulti = (this.isType(q, 'checkboxes', 'checkbox')) ||
                        (this.isType(q, 'multiple_choice') && q.config && q.config.allowMultipleSelect);
                    init[this.convertIdToStr(q._id)] = isMulti ? [] : null;
                });
                this.answers = init;

                if (this.isDuplicateMode || this.isPreviewMode) {
                    this.loading = false;
                    return;
                }
                try {
                    const filterParams = { form: this.form._id };
                    if (currentResponder) {
                        filterParams.responder = currentResponder;
                    } else {
                        filterParams.responder = 'null';
                        filterParams.guestSessionId = currentGuestId;
                    }

                    const fetchedList = await this.$store.dispatch('Responses/findForForm', filterParams);
                    const allFormResponses = Array.isArray(fetchedList) ? fetchedList : [];

                    const submitted = allFormResponses
                        .filter(r => this.isSameResponseActor(r, currentResponder, currentGuestId) && r.submit)
                        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];

                    // Existing submission takes precedence under Limit to One Response (view or edit)
                    if (settings.limitResponse && submitted) {
                        this.draftResponseId = submitted._id;
                        this.submit = true;
                        if (submitted.answers) {
                            this.restoreAnswersFromResponse(submitted);
                        }
                        if (settings.allowEditAfterSubmit) {
                            this.isEditingSubmitted = true;
                            this.isAlreadySubmitted = false;
                        } else {
                            this.isAlreadySubmitted = true;
                            this.isEditingSubmitted = false;
                        }
                        this.loading = false;
                        return;
                    }

                    const hasEditableExistingSubmission = Boolean(settings.allowEditAfterSubmit && submitted);
                    if (isQuotaReached(this.form, hasEditableExistingSubmission)) {
                        this.unavailableReason = 'quota';
                        this.loading = false;
                        return;
                    }

                    // If New Mode is active (and limitResponse is off), start a blank submission
                    if (this.isNewMode) {
                        this.draftResponseId = null;
                        this.submit = false;
                        this.loading = false;
                        return;
                    }

                    // Restore latest unsubmitted draft for this form and responder/guest
                    const draft = allFormResponses
                        .filter(r => this.isSameResponseActor(r, currentResponder, currentGuestId) && !r.submit)
                        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())[0];

                    if (draft && draft._id) {
                        this.draftResponseId = draft._id;
                        this.restoreAnswersFromResponse(draft);
                    }
                } catch (e) {
                    console.error('Failed to load draft response:', e);
                }
            } catch (err) {
                this.error = err.message || 'Failed to load form.';
            } finally {
                this.loading = false;
                this.isHydrating = false;
                const latestUserId = this.user && this.user._id ? String(this.user._id) : null;
                if (this.pendingUserRefresh && latestUserId && latestUserId !== this.hydratedUserId && !this.isPreviewMode && !this.isDuplicateMode) {
                    this.pendingUserRefresh = false;
                    await this.onInit();
                } else {
                    this.pendingUserRefresh = false;
                }
            }
        },

        saveDraftResponse() {
            if (this.submit || this.isEditingSubmitted || this.unavailableReason || !this.form || !this.form._id || this.isPreviewMode) return;
            this.performSave();
        },

        async performSave() {
            // Queue save if already in progress
            if (this.isSaving) {
                this.needsSave = true;
                return this.savePromise;
            }

            const currentResponder = (this.user && this.user._id) || await this.ensureResponderId();
            const currentGuestId = currentResponder ? null : (this.guestSessionId || getOrCreateGuestSessionId(this.form._id));
            if (isLoginRequiredByForm(this.form) && !currentResponder) return;
            if (!currentResponder && !currentGuestId) return;

            this.isSaving = true;
            this.needsSave = false;

            const runPromise = (async () => {
                try {
                    // Determine if we actually have anything to save
                    const hasAnyAnswer = Object.values(this.answers).some(a => {
                        if (Array.isArray(a)) return a.length > 0;
                        return a !== null && a !== undefined && String(a).trim() !== '';
                    });

                    if (!this.draftResponseId && !hasAnyAnswer) {
                        return;
                    }

                    const payload = {
                        responder: currentResponder || null,
                        guestSessionId: currentGuestId,
                        form: this.form._id,
                        answers: Object.entries(this.answers).map(([question, response]) => ({ question, response })),
                        submit: false
                    };

                    const sentFilesSnapshot = this.snapshotFileAnswers();
                    if (this.draftResponseId) {
                        const res = await this.$store.dispatch('Responses/update', Object.assign({ _id: this.draftResponseId }, payload));
                        const savedDoc = this.extractResponseDoc(res);
                        this.syncUploadedFileAnswers(savedDoc, sentFilesSnapshot);
                    } else {
                        const res = await this.$store.dispatch('Responses/create', payload);
                        const savedDoc = this.extractResponseDoc(res);
                        this.syncUploadedFileAnswers(savedDoc, sentFilesSnapshot);

                        const id = savedDoc?._id || savedDoc?.id;
                        if (id) {
                            this.draftResponseId = id;
                        }
                    }
                } catch (err) {
                    console.error('Auto-save failed:', err);
                } finally {
                    this.isSaving = false;
                    if (this.savePromise === runPromise) {
                        this.savePromise = null;
                    }
                }
            })();

            this.savePromise = runPromise;
            await runPromise;

            if (this.needsSave && !this.submit) {
                await this.performSave();
            }
        },

        autoSave(force = false) {
            if (this.submit || this.isPreviewMode) return;

            if (force) {
                if (this.saveTimeout) clearTimeout(this.saveTimeout);
                if (this.saveTimer) clearTimeout(this.saveTimer);
                this.saveTimeout = null;
                this.saveTimer = null;
                this.saveDraftResponse();
                return;
            }

            // Match CreateForm autosave style: single timer with debounce.
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            if (this.saveTimer) clearTimeout(this.saveTimer);
            this.saveTimer = setTimeout(() => {
                this.saveDraftResponse();
            }, 2000); // Wait 2 seconds after last input
        },

        onRate(question, n) {
            const qIdStr = this.convertIdToStr(question._id);
            this.$set(this.answers, qIdStr, n);
            this.clearError(question._id);
            this.autoSave(true);
        },

        onAuthenGoogle() {
            const redirectUrl = this.$route.fullPath;
            const query = { redirect: redirectUrl };
            if (this.supportsExternalEmailLogin) {
                query.allowExternal = '1';
            }
            this.$router.push({
                path: '/pages/login',
                query
            });
        },
        async switchGoogleAccount() {
            try {
                await api.auth('logout');
            } catch (e) {
                // Proceed cleanly even if backend logout request fails
            }
            clearClientSession(this.$store);
            this.onAuthenGoogle();
        },

        getType(q) {
            const t = q.type;
            if (!t) return '';
            return (typeof t === 'object' ? (t.type || '') : t).toLowerCase();
        },

        isType(q, ...types) {
            return types.includes(this.getType(q));
        },

        getOptionKey(opt, oIdx) {
            if (opt && (opt.key !== undefined && opt.key !== null)) return String(opt.key);
            return String(oIdx);
        },
        getOptionLabel(opt) {
            if (!opt || !opt.lang || !opt.lang.length) return '';
            return this.getLang(opt.lang);
        },
        getMaxTextLength(question) {
            const raw = Number(question && question.config && question.config.maxText);
            return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
        },
        clampTextValue(val, maxLen) {
            if (!maxLen || typeof val !== 'string' || val.length <= maxLen) return val;
            let sliced = val.slice(0, maxLen);
            // Avoid leaving an unpaired UTF-16 high surrogate at the boundary.
            const lastCode = sliced.charCodeAt(sliced.length - 1);
            if (lastCode >= 0xD800 && lastCode <= 0xDBFF) {
                sliced = sliced.slice(0, -1);
            }
            return sliced;
        },
        clampTextAnswer(question, val) {
            const qIdStr = this.convertIdToStr(question && question._id);
            if (!qIdStr) return;
            const maxLen = this.getMaxTextLength(question);
            if (!maxLen || typeof val !== 'string' || val.length <= maxLen) return;
            const clamped = this.clampTextValue(val, maxLen);
            if (this.answers[qIdStr] !== clamped) {
                this.$set(this.answers, qIdStr, clamped);
            }
        },
        onTextAnswerInput(question, val, e) {
            this.clearError(question._id);
            const qIdStr = this.convertIdToStr(question && question._id);
            const maxLen = this.getMaxTextLength(question);
            let nextVal = val;
            if (maxLen && typeof val === 'string' && val.length > maxLen) {
                nextVal = this.clampTextValue(val, maxLen);
                if (e && e.target && e.target.value !== nextVal) {
                    e.target.value = nextVal;
                }
            }
            if (qIdStr && this.answers[qIdStr] !== nextVal) {
                this.$set(this.answers, qIdStr, nextVal);
            }
            this.autoSave();
        },
        convertIdToStr(val) {
            if (!val && val !== 0) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
                if (val._id) return (val._id && val._id.toString) ? val._id.toString() : String(val._id);
                if (val.toString && typeof val.toString === 'function') return val.toString();
            }
            return String(val);
        },
        getFollowUpChildId(entry) {
            if (!entry && entry !== 0) return null;
            if (typeof entry === 'object') {
                if (entry.question !== undefined && entry.question !== null) {
                    if (Array.isArray(entry.question) && entry.question.length) return this.convertIdToStr(entry.question[0]);
                    return this.convertIdToStr(entry.question);
                }
                if (entry._id) return this.convertIdToStr(entry._id);
                return null;
            }
            return this.convertIdToStr(entry);
        },
        getParentForFollowUp(question) {
            try {
                if (!question || !question._id) return null;
                const map = this.followUpMap || {};
                const entries = map[String(question._id)];
                if (!entries || !entries.length) return null;
                const p = entries[0];
                const parentId = p.parentId;
                const parent = (this.form && Array.isArray(this.form.questions)) ? this.form.questions.find(q => String(q._id) === String(parentId)) : null;
                if (!parent) return null;
                return { parent, meta: p };
            } catch (e) {
                return null;
            }
        },
        getAncestorChain(question) {
            const chain = [];
            try {
                let pObj = this.getParentForFollowUp(question);
                while (pObj && pObj.parent) {
                    chain.push(pObj.parent);
                    pObj = this.getParentForFollowUp(pObj.parent);
                }
            } catch (e) {
                // ignore
            }
            return chain.reverse();
        },
        getQuestionNumber(question, index) {
            try {
                // Build ancestor chain root -> immediate parent
                const ancestors = this.getAncestorChain(question);
                const parts = [];

                // Compute numbers for ancestors
                for (let aIdx = 0; aIdx < ancestors.length; aIdx++) {
                    const anc = ancestors[aIdx];
                    const ancParentObj = this.getParentForFollowUp(anc);
                    if (!ancParentObj || !ancParentObj.parent) {
                        // anc is top-level: compute its top-level number within its Section among non-followups
                        const topNum = getQuestionNumberInSection(this.form.questions, anc, {
                            isSkipFn: (item) => this.isFollowUp(item)
                        });
                        parts.push(String(topNum));
                    } else {
                        const parentQ = ancParentObj.parent;
                        let childPos = 0;
                        if (Array.isArray(parentQ.followUp)) {
                            const ancIdStr = this.getFollowUpChildId(anc);
                            for (let i = 0; i < parentQ.followUp.length; i++) {
                                if (this.getFollowUpChildId(parentQ.followUp[i]) === ancIdStr) {
                                    childPos = i + 1;
                                    break;
                                }
                            }
                        }
                        parts.push(String(childPos || 1));
                    }
                }

                const immediateParentObj = this.getParentForFollowUp(question);
                if (immediateParentObj && immediateParentObj.parent) {
                    const parentQ = immediateParentObj.parent;
                    let childPos = 0;
                    if (Array.isArray(parentQ.followUp)) {
                        const myIdStr = this.getFollowUpChildId(question);
                        for (let i = 0; i < parentQ.followUp.length; i++) {
                            if (this.getFollowUpChildId(parentQ.followUp[i]) === myIdStr) {
                                childPos = i + 1;
                                break;
                            }
                        }
                    }
                    parts.push(String(childPos || 1));
                    return parts.join('.');
                }
            } catch (e) {
                // fallback to default numbering
            }

            return getQuestionNumberInSection(this.visibleQuestions, index, {
                isSkipFn: (item) => this.isFollowUp(item)
            });
        },
        getSectionNumber(question, index) {
            let count = 0;
            const list = this.visibleQuestions || [];
            const limit = typeof index === 'number' ? index : list.length - 1;
            for (let i = 0; i <= limit && i < list.length; i++) {
                if (this.isType(list[i], 'section')) count++;
            }
            return count || 1;
        },
        getAcceptString(question) {
            if (!question || !question.config || !Array.isArray(question.config.fileTypes)) return '';
            const map = {
                image: 'image/*',
                pdf: '.pdf',
                doc: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                sheet: '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
            const types = question.config.fileTypes.map(t => map[t] || '').filter(Boolean);
            return types.join(',');
        },
        handleFileChange(questionId, files, question) {
            if (!files) return;
            const arr = Array.from(files || []);
            const accept = this.getAcceptString(question);
            let filtered = arr;
            if (accept) {
                const acceptParts = accept.split(',').map(s => s.trim().toLowerCase());
                filtered = arr.filter(f => {
                    const name = (f.name || '').toLowerCase();
                    const type = (f.type || '').toLowerCase();
                    return acceptParts.some(a => {
                        if (a.endsWith('/*')) {
                            const prefix = a.replace('/*', '');
                            return type.startsWith(prefix);
                        }
                        if (a.startsWith('.')) {
                            return name.endsWith(a);
                        }
                        return type === a;
                    });
                });
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            const validFiles = filtered.filter(f => f.size <= maxSize);
            if (validFiles.length < filtered.length) {
                this.modalTitle = 'Error';
                this.modalMessage = this.$t('form.fileTooLarge') || 'File size cannot exceed 5MB';
                this.modalType = 'error';
                this.showModal = true;
            }

            const max = question && question.config && Number(question.config.maxFiles) ? Number(question.config.maxFiles) : validFiles.length;
            const qIdStr = this.convertIdToStr(questionId);

            const currentFiles = [...this.getAnswerAsArray(questionId)];

            for (let f of validFiles) {
                if (currentFiles.length < max) {
                    currentFiles.push(f);
                }
            }

            this.$set(this.answers, qIdStr, currentFiles.length > 0 ? currentFiles : null);
            if (currentFiles.length > 0) this.scrollToNextQuestion(question);
        },
        removeFile(questionId, index) {
            const qIdStr = this.convertIdToStr(questionId);
            const currentFiles = [...this.getAnswerAsArray(questionId)];
            if (index >= 0 && index < currentFiles.length) {
                currentFiles.splice(index, 1);
                this.$set(this.answers, qIdStr, currentFiles.length > 0 ? currentFiles : null);
                this.autoSave(true);
            }
        },
        triggerUpload(questionId) {
            const refName = 'fileInput-' + questionId;
            const inputElements = this.$refs[refName];
            if (inputElements) {
                const el = Array.isArray(inputElements) ? inputElements[0] : inputElements;
                if (el) {
                    el.value = '';
                    el.click();
                }
            }
        },
        hasError(questionId) {
            if (!this.errorIds) return false;
            const qIdStr = this.convertIdToStr(questionId);
            if (typeof this.errorIds.has === 'function') {
                return this.errorIds.has(questionId) || this.errorIds.has(qIdStr);
            }
            if (Array.isArray(this.errorIds)) {
                return this.errorIds.includes(questionId) || this.errorIds.includes(qIdStr);
            }
            return false;
        },
        clearError(questionId) {
            if (!this.errorIds) return;
            const qIdStr = this.convertIdToStr(questionId);
            if (this.hasError(questionId)) {
                const next = new Set(this.errorIds);
                next.delete(questionId);
                next.delete(qIdStr);
                this.errorIds = next;
                this.missingRequiredCount = next.size;
            }
        },
        setLanguage(lang) {
            if (!this.$i18n) return;
            this.$i18n.locale = lang;
            try {
                localStorage.setItem('lang', lang);
            } catch (e) {}
            try {
                this.$store.commit('Setting/lang', lang);
            } catch (e) {}
        },
        isFollowUp(question) {
            if (!question || !question._id) return false;
            const map = this.followUpMap || {};
            const entries = map[String(question._id)];
            return Array.isArray(entries) && entries.length > 0;
        },
        isQuestionVisible(question, _visited = null) {
            if (!this.form || !Array.isArray(this.form.questions) || !question || !question._id) return true;
            const visited = _visited || new Set();
            const childId = String(question._id);
            if (visited.has(childId)) return false;
            visited.add(childId);

            const map = this.followUpMap || {};
            const parents = map[childId];
            if (!parents || parents.length === 0) {
                return this.reachableQuestionIds.has(childId);
            }
            for (const p of parents) {
                const parentQ = this.form.questions.find(q => String(q._id) === String(p.parentId));
                if (!parentQ) continue;

                if (!this.isQuestionVisible(parentQ, visited)) continue;
                const parentAnswer = this.answers[p.parentId];
                if (parentAnswer === undefined || parentAnswer === null) continue;
                const neededKey = String(p.key);
                if (Array.isArray(parentAnswer)) {
                    if (parentAnswer.map(a => String(a)).includes(neededKey)) return true;
                } else {
                    if (String(parentAnswer) === neededKey) return true;
                }
            }
            return false;
        },
        async duplicateForm() {
            if (!this.form) return;
            this.submitting = true;
            try {
                const baseData = JSON.parse(JSON.stringify(this.form));

                const clonedQuestions = (baseData.questions || []).map((q, index) => {
                    const newQ = { ...q };

                    newQ._id = `tmp-${Date.now()}-${index}`;

                    delete newQ.id;
                    delete newQ.createdAt;
                    delete newQ.updatedAt;

                    if (newQ.type && typeof newQ.type === 'object') {
                        newQ.type = newQ.type._id || newQ.type.id;
                    }

                    return newQ;
                });

                const duplicateData = {
                    ...baseData,
                    originalFormId: baseData._id || baseData.id || this.formId || null,
                    title: baseData.title.map(t => ({ ...t, value: (this.getLang(t) || t.value) + ' (Copy)' })),
                    questions: clonedQuestions,
                    organization: Array.isArray(baseData.organization)
                        ? baseData.organization.map(o => (typeof o === 'object' ? o._id : o))
                        : []
                };

                delete duplicateData._id;
                delete duplicateData.id;
                delete duplicateData.responses;
                delete duplicateData.creator;
                delete duplicateData.createdAt;
                delete duplicateData.updatedAt;

                this.$store.commit('Forms/setDuplicateBuffer', duplicateData);

                this.$router.push({
                    name: 'EditorCreateForm',
                    params: { _id: 'new' },
                    query: { mode: 'duplicate' }
                });

            } catch (err) {
                console.error('Duplication preparation failed:', err);
            } finally {
                this.submitting = false;
            }
        },

        async submitForm() {
            const missing = findMissingRequiredQuestions({
                questions: this.visibleQuestions || this.form.questions || [],
                answers: this.answers,
                isTypeFn: this.isType,
                isVisibleFn: this.isQuestionVisible,
                convertIdToStrFn: this.convertIdToStr
            });
            if (missing.length) {
                this.errorIds = new Set(missing.map(q => this.convertIdToStr(q._id)));
                this.missingRequiredCount = missing.length;
                this.$nextTick(() => {
                    const el = document.getElementById('question-card-' + this.convertIdToStr(missing[0]._id));
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
                return;
            }
            this.errorIds = new Set();
            this.missingRequiredCount = 0;

            if (this.isPreviewMode) {
                this.modalTitle = this.$t('form.previewCompleteTitle');
                this.modalMessage = this.$t('form.previewCompleteMessage');
                this.modalType = 'success';
                this.showModal = true;
                return;
            }

            const currentResponder = (this.user && this.user._id) || await this.ensureResponderId();
            const currentGuestId = currentResponder ? null : (this.guestSessionId || getOrCreateGuestSessionId(this.form._id));

            if (isLoginRequiredByForm(this.form) && !currentResponder) {
                this.modalTitle = this.$t('form.notAuthenticated');
                this.modalMessage = this.$t('form.loginRequired');
                this.modalType = 'error';
                this.showModal = true;
                return;
            }

            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
                this.saveTimeout = null;
            }
            if (this.saveTimer) {
                clearTimeout(this.saveTimer);
                this.saveTimer = null;
            }
            this.needsSave = false;

            const wasEditingSubmitted = this.isEditingSubmitted;
            this.submit = true;
            this.submitting = true;
            try {
                if (this.savePromise) {
                    await this.savePromise;
                }

                const payload = {
                    responder: currentResponder || null,
                    guestSessionId: currentGuestId,
                    form: this.form._id,
                    answers: Object.entries(this.answers).map(([question, response]) => ({ question, response })),
                    submit: true
                };

                const sentFilesSnapshot = this.snapshotFileAnswers();
                const res = this.draftResponseId
                    ? await this.$store.dispatch('Responses/update', Object.assign({ _id: this.draftResponseId }, payload))
                    : await this.$store.dispatch('Responses/create', payload);
                const savedDoc = this.extractResponseDoc(res);
                if (!this.draftResponseId && savedDoc && (savedDoc._id || savedDoc.id)) {
                    this.draftResponseId = savedDoc._id || savedDoc.id;
                }
                this.syncUploadedFileAnswers(savedDoc, sentFilesSnapshot);

                const customConfirm = String(this.form?.settings?.confirmMessage || '').trim();
                this.modalTitle = this.$t('common.success');
                this.modalMessage = wasEditingSubmitted
                    ? this.$t('form.updateSuccessMessage')
                    : (customConfirm || this.$t('form.successMessage'));
                this.modalType = 'success';
                this.showModal = true;
            } catch (err) {
                if (!wasEditingSubmitted) {
                    this.submit = false;
                }
                this.modalTitle = this.$t('common.error');
                this.modalMessage = this.resolveSubmissionErrorMessage(err);
                this.modalType = 'error';
                this.showModal = true;
                console.error('submitForm error:', err);
            } finally {
                this.submitting = false;
            }
        },

        resolveSubmissionErrorMessage(err) {
            const reason = extractPolicyErrorReason(err);
            switch (reason) {
                case 'QUOTA_REACHED': return this.$t('form.quotaError');
                case 'LIMIT_RESPONSE_REACHED': return this.$t('form.limitReachedError');
                case 'EDIT_NOT_ALLOWED': return this.$t('form.editNotAllowedError');
                case 'FORM_CLOSED': return this.$t('form.formClosedDesc');
                case 'FORM_SCHEDULED': return this.$t('form.formScheduledDesc');
                case 'FORM_DRAFT': return this.$t('form.formDraftDesc');
                case 'LOGIN_REQUIRED': return this.$t('form.loginRequired');
                default: return this.$t('common.error');
            }
        },

        initEmptyAnswers(questionsList) {
            const init = {};
            (questionsList || []).forEach(q => {
                if (isNonInputQuestionType(q)) return;
                const isMulti = (this.isType(q, 'checkboxes', 'checkbox')) ||
                    (this.isType(q, 'multiple_choice') && q.config && q.config.allowMultipleSelect);
                init[this.convertIdToStr(q._id)] = isMulti ? [] : null;
            });
            this.answers = init;
        },
        onEditSubmittedResponse() {
            this.showModal = false;
            this.isSubmissionComplete = false;
            this.isEditingSubmitted = true;
            this.isAlreadySubmitted = false;
            this.submit = true;
        },

        onModalHidden() {
            if (this.modalType !== 'success') return;
            if (this.isPublicForm) {
                this.isSubmissionComplete = true;
                return;
            }
            const settings = this.form?.settings || {};
            if (settings.allowEditAfterSubmit) {
                this.isEditingSubmitted = true;
                this.isAlreadySubmitted = false;
                this.submit = true;
            } else if (settings.limitResponse) {
                this.isAlreadySubmitted = true;
                this.isEditingSubmitted = false;
            } else {
                this.draftResponseId = null;
                this.submit = false;
                this.isEditingSubmitted = false;
                this.initEmptyAnswers(this.form?.questions);
            }
        },

        onModalOk() {
            const wasError = this.modalType === 'error';
            this.showModal = false;
            if (wasError || this.isPreviewMode) return;

            if (!this.isPublicForm) {
                this.$router.push('/forms');
                return;
            }
            this.isSubmissionComplete = true;
            this.onModalHidden();
        },
        resetPreviewAnswers() {
            this.errorIds = new Set();
            this.missingRequiredCount = 0;
            this.initEmptyAnswers(this.form && this.form.questions);
        },
        hasAnswer(questionId) {
            const ans = this.answers[this.convertIdToStr(questionId)];
            if (Array.isArray(ans)) return ans.length > 0;
            return ans !== null && ans !== undefined && String(ans).trim() !== '';
        },
        scrollToNextQuestion(question) {
            if (!question) return;

            setTimeout(() => {
                const qIdStr = this.convertIdToStr(question._id);
                const answer = this.answers[qIdStr];

                let targetId = null;

                if (answer && question.config && Array.isArray(question.config.choices)) {
                    if (!Array.isArray(answer)) {
                        const choice = question.config.choices.find((c, idx) => String(this.getOptionKey(c, idx)) === String(answer));
                        if (choice && choice.nextQuestion) targetId = choice.nextQuestion;
                    }
                }

                if (!targetId && question.nextQuestion) {
                    targetId = question.nextQuestion;
                }

                if (!targetId || targetId === 'submit') {
                    const currentIndex = this.visibleQuestions.findIndex(q => this.convertIdToStr(q._id) === qIdStr);
                    if (currentIndex !== -1 && currentIndex < this.visibleQuestions.length - 1) {
                        if (targetId !== 'submit') targetId = this.visibleQuestions[currentIndex + 1]._id;
                    } else {
                        targetId = 'submit';
                    }
                }

                if (targetId) {
                    const targetIdStr = this.convertIdToStr(targetId);
                    if (targetIdStr === 'submit') {
                        const submitSection = document.getElementById('submit-section');
                        if (submitSection) submitSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    } else {
                        const el = document.getElementById('question-card-' + targetIdStr) ||
                            document.getElementById('question-' + targetIdStr);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 300);
        }
    },
    computed: {
        ...mapGetters('User', ['user']),
        currentLocale() {
            return (this.$i18n && this.$i18n.locale) || 'th';
        },
        submissionSuccessText() {
            const customConfirm = String(this.form?.settings?.confirmMessage || '').trim();
            if (customConfirm) return customConfirm;
            return this.currentLocale === 'en'
                ? 'Thank you for your response. Your submission has been recorded successfully.'
                : 'ขอบคุณสำหรับการตอบแบบสอบถาม ระบบได้บันทึกคำตอบของคุณเรียบร้อยแล้ว';
        },
        isDuplicateMode() {
            return this.$route.query.mode === 'duplicate';
        },
        isPreviewMode() {
            return this.$route.query.mode === 'preview' || this.$route.name === 'Preview';
        },
        isPublicForm() {
            const isInternalMode = ['preview', 'duplicate'].includes(this.$route.query.mode);
            const isInternalSource = this.$route.query.source === 'internal';
            const isPreviewRoute = this.$route.name === 'Preview';

            return this.$route.name === 'FormFill' && !isInternalMode && !isInternalSource && !isPreviewRoute;
        },
        isFirstTime() {
            return !this.draftResponseId;
        },
        followUpMap() {
            const map = {};
            if (!this.form || !Array.isArray(this.form.questions)) return map;

            const qlist = this.form.questions || [];
            for (const q of qlist) {
                if (!q || !Array.isArray(q.followUp)) continue;
                for (const f of q.followUp) {
                    if (!f) continue;
                    const entries = [];
                    // followUp entries may map a key to a question or questions
                    const key = f.key !== undefined && f.key !== null ? String(f.key) : null;
                    if (f.question !== undefined && f.question !== null) {
                        if (Array.isArray(f.question)) {
                            f.question.forEach(qobj => {
                                const cid = (typeof qobj === 'object' && qobj._id) ? String(qobj._id) : String(qobj);
                                if (!map[cid]) map[cid] = [];
                                map[cid].push({ parentId: String(q._id), key });
                            });
                        } else {
                            const cid = (typeof f.question === 'object' && f.question._id) ? String(f.question._id) : String(f.question);
                            if (!map[cid]) map[cid] = [];
                            map[cid].push({ parentId: String(q._id), key });
                        }
                    }
                }
            }
            return map;
        },

        reachableQuestionIds() {
            return getReachableQuestionIds({
                questions: (this.form && this.form.questions) || [],
                answers: this.answers || {},
                followUpMap: this.followUpMap || {}
            });
        },

        visibleQuestions() {
            if (!this.form || !Array.isArray(this.form.questions)) return [];
            const built = [];
            const pushedIds = new Set();
            const qlist = [...(this.form.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

            const findQuestionById = id => {
                if (!id && id !== 0) return null;
                const idStr = (typeof id === 'object' && id._id) ? String(id._id) : String(id);
                return qlist.find(q => (q && q._id) && String(q._id) === idStr) || null;
            };

            const pushWithFollow = q => {
                if (!q) return;
                const idStr = (q._id && String(q._id)) || null;
                if (idStr && pushedIds.has(idStr)) return;
                if (idStr) pushedIds.add(idStr);
                built.push(q);

                if (Array.isArray(q.followUp) && q.followUp.length) {
                    for (const f of q.followUp) {
                        try {
                            if (f && typeof f === 'object') {
                                if (f._id) {
                                    const found = findQuestionById(f._id);
                                    if (found) pushWithFollow(found);
                                } else if (f.question !== undefined && f.question !== null) {
                                    if (Array.isArray(f.question) && f.question.length) {
                                        for (const ref of f.question) {
                                            const found = findQuestionById(ref);
                                            if (found) pushWithFollow(found);
                                        }
                                    } else {
                                        const found = findQuestionById(f.question);
                                        if (found) pushWithFollow(found);
                                    }
                                } else {
                                    const found = findQuestionById(f);
                                    if (found) pushWithFollow(found);
                                }
                            } else {
                                const found = findQuestionById(f);
                                if (found) pushWithFollow(found);
                            }
                        } catch (e) {
                            // ignore individual follow-up errors
                        }
                    }
                }
            };

            for (const q of qlist) {
                const qId = (q && q._id) ? String(q._id) : null;
                if (qId && pushedIds.has(qId)) continue;
                pushWithFollow(q);
            }

            return built;
        },
        hasIndividualAccessRestriction() {
            if (resolveFormAccessMode(this.form) !== 'private') return false;
            const settings = this.form?.settings || {};
            const hasUsers = Array.isArray(settings.allowedUser) && settings.allowedUser.length > 0;
            const hasEmails = normalizeAllowedEmails(settings.allowedEmails).length > 0;
            return hasUsers || hasEmails;
        },
        supportsExternalEmailLogin() {
            const settings = this.form?.settings || {};
            if (resolveFormAccessMode(this.form) === 'public') {
                return Boolean(settings.collectEmail || settings.requireLogin);
            }
            return normalizeAllowedEmails(settings.allowedEmails).length > 0;
        },
        loginPromptMessage() {
            const settings = this.form?.settings || {};
            if (resolveFormAccessMode(this.form) === 'private') {
                if (settings.allowedRoles && Array.isArray(settings.allowedRoles) && settings.allowedRoles.length > 0) {
                    return this.$t('form.loginRequiredRole');
                }
                if (this.hasIndividualAccessRestriction) {
                    return this.$t('form.loginRequiredPersonal');
                }
                return this.$t('form.loginRequired');
            }
            if (settings.collectEmail) {
                return this.$t('form.responseSummary.collectEmailDesc');
            }
            return this.$t('form.loginRequired');
        },
        isLoginRequired() {
            const isLoggedIn = !!(this.user && this.user._id);
            const accessMode = resolveFormAccessMode(this.form);
            const formOrgs = Array.isArray(this.form?.organization) ? this.form.organization.filter(Boolean) : [];
            const requiresOrgSignIn = accessMode === 'private' && formOrgs.length > 0 && !formOrgs.some(isGeneralOrgEntry);
            const mustLogin = isLoginRequiredByForm(this.form) || requiresOrgSignIn;
            return mustLogin && !isLoggedIn && !this.isPreviewMode && !this.isDuplicateMode;
        },
        canEditFromSuccessModal() {
            return Boolean(this.modalType === 'success' && this.form?.settings?.allowEditAfterSubmit && !this.unavailableReason && !this.isPreviewMode);
        },
        hasAnyPreviewAnswer() {
            return Object.values(this.answers || {}).some((val) => {
                if (Array.isArray(val)) return val.length > 0;
                return val !== null && val !== undefined && String(val).trim() !== '';
            });
        },
        responseSettingItems() {
            const hasSignedInUser = Boolean(this.user && (this.user.email || this.user._id));
            return buildResponseRuleDetails(
                (this.form && this.form.settings) || {},
                (key, params) => this.$t(key, params),
                {
                    isSignedIn: hasSignedInUser,
                    schedule: this.form && this.form.schedule,
                    form: this.form,
                    locale: this.currentLocale
                }
            );
        },
        unavailableIcon() {
            if (this.unavailableReason === 'scheduled') return 'cil-clock';
            if (this.unavailableReason === 'draft') return 'cil-notes';
            return 'cil-ban';
        },
        unavailableTitle() {
            switch (this.unavailableReason) {
                case 'draft': return this.$t('form.formDraftTitle');
                case 'scheduled': return this.$t('form.formScheduledTitle');
                case 'quota': return this.$t('form.quotaReachedTitle');
                default: return this.$t('form.formClosedTitle');
            }
        },
        unavailableDescription() {
            switch (this.unavailableReason) {
                case 'draft': return this.$t('form.formDraftDesc');
                case 'scheduled': return this.$t('form.formScheduledDesc');
                case 'quota': return this.$t('form.quotaReachedDesc');
                default: return this.$t('form.formClosedDesc');
            }
        }
    },
    watch: {
        user: {
            async handler(val, oldVal) {
                const newId = val && val._id ? String(val._id) : null;
                const oldId = oldVal && oldVal._id ? String(oldVal._id) : null;
                if (!newId || newId === oldId) return;

                this.responderId = newId;
                this.guestSessionId = null;
                this.persistResponderId(newId);

                // If initial render loaded with a different responder, refresh once with the real user id.
                if (this.form && !this.isPreviewMode && !this.isDuplicateMode && !this.isSaving) {
                    if (this.loading) {
                        this.pendingUserRefresh = true;
                    } else {
                        await this.onInit();
                    }
                }
            },
            immediate: false
        }
    }
}
</script>

<style scoped>
.back-btn {
    font-weight: 500;
}

.fillform-back-wrap {
    width: 100%;
    max-width: 1360px;
    margin: 0 auto;
    padding: 0 16px;
}

.fillform-body {
    width: 100%;
    max-width: 1360px;
    margin: 28px auto;
    padding: 0 16px 40px;
}

.fillform-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
}

.header-card {
    border-radius: 12px !important;
    padding: 0;
    overflow: hidden;
    position: relative;
    transition: border-left-color 0.3s, background 0.3s, box-shadow 0.3s;
}

.form-main-title {
    font-size: 1.9rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 8px;
}

.form-main-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

.before-start-notice-card,
.response-settings-side-card {
    border-radius: 14px !important;
    background: #ffffff;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
    overflow: hidden;
}

.response-settings-card-header {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.settings-header-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #fef2f2;
    color: #8c1515;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.response-settings-card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
}

.response-settings-card-subtitle {
    font-size: 0.85rem;
    color: #64748b;
    line-height: 1.35;
}

.response-rule-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.response-rule-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 15px;
}

.response-rule-item:last-child {
    padding-bottom: 0;
    border-bottom: none;
}

.rule-item-icon {
    width: 34px;
    height: 34px;
    border-radius: 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.rule-badge-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.rule-item-content {
    min-width: 0;
    flex: 1;
}

.rule-item-title {
    font-size: 15px;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.4;
}

.rule-item-desc {
    font-size: 15px;
    color: #475569;
    line-height: 1.45;
    margin-top: 2px;
}

@media (min-width: 992px) {
    .fillform-settings-col {
        position: sticky;
        top: 84px;
    }
}

.side-status-notice {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.side-status-notice--edit {
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #92400e;
}

.side-status-notice--done {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
}

.response-note-card {
    border-radius: 14px !important;
    background: #f8fafc;
    border: 1px solid #e2e8f0 !important;
}

.note-header-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #eff6ff;
    color: #1d4ed8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.response-note-list {
    padding-left: 18px;
    color: #475569;
    font-size: 15px;
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.setting-icon-period {
    background-color: #f0fdf4;
    color: #15803d;
}

.setting-icon-login {
    background-color: #eef2ff;
    color: #4338ca;
}

.setting-icon-limit {
    background-color: #ecfdf5;
    color: #047857;
}

.setting-icon-edit {
    background-color: #fffbeb;
    color: #b45309;
}

.setting-icon-quota {
    background-color: #f3e8ff;
    color: #6b21a8;
}

.setting-icon-email {
    background-color: #eff6ff;
    color: #1d4ed8;
}

.setting-icon-notify {
    background-color: #fef2f2;
    color: #b91c1c;
}

.answered-badge {
    background-color: #ecfdf5;
    color: #065f46;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    border: 1px solid #10b98133;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-3px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.summary-banner {
    background: linear-gradient(90deg, #2eb85c 0%, #1b8d44 100%);
    border-radius: 12px 12px 0 0;
}

.preview-banner {
    background-color: #6366f1;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
}

.form-divider {
    border: none;
    border-top: 1px solid #e8eaed;
    margin: 20px 0 14px;
}

.question-label-hint {
    font-size: 0.82rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.question-index {
    font-size: 0.8125rem;
    color: #9aa0a6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    display: inline-block;
    background: #f8fafc;
    border: 1px solid #e6eef6;
    color: #374151;
    border-radius: 999px;
    padding: 0.35rem 0.5rem;
    font-weight: 600;
}

.question-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f1f1f;
}

.options-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.option-row {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    margin: 0;
    font-weight: normal;
    width: 100%;
    padding: 8px 10px;
    border-radius: 12px;
}

.option-input {
    width: 18px;
    height: 18px;
    accent-color: #1a73e8;
    cursor: pointer;
    flex-shrink: 0;
}

.rating-container {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: clamp(6px, 2vw, 16px);
    padding: 10px 0;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
}

.rating-container::-webkit-scrollbar {
    display: none;
}

.star-btn {
    flex: 0 0 auto;
    background: none;
    border: none;
    font-size: 2.15rem;
    cursor: pointer;
    color: #dadce0;
    padding: 4px 8px;
    line-height: 1;
    text-align: center;
    transition: color 0.15s, transform 0.1s;
}

.star-btn:first-child {
    margin-left: auto;
}

.star-btn:last-child {
    margin-right: auto;
}

.star-btn:hover,
.star-btn.star-active {
    color: #f9ab00;
}

.file-preview-wrapper {
    margin-left: 1.25rem;
}

.answer-upload-preview {
    max-width: 280px;
    max-height: 180px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    object-fit: contain;
    background: #fff;
}

.answer-upload-pdf-preview {
    width: 280px;
    height: 180px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
}

.answer-upload-media-preview {
    width: 280px;
    max-height: 180px;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    background: #fff;
}

.star-btn:hover {
    transform: scale(1.15);
}

.star-btn:focus,
.star-btn:focus-visible {
    outline: none;
    box-shadow: none;
}

.section-divider-public {
    padding: 0.75rem 0 0.25rem;
}

.section-divider-public-pill {
    display: inline-flex;
    align-items: center;
    background: #475569;
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 0.28rem 0.85rem;
    border-radius: 999px;
    letter-spacing: 0.02em;
    flex-shrink: 0;
}

.section-divider-public-line {
    height: 1px;
    background: #cbd5e1;
    border-radius: 999px;
}

.section-display-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: #1f1f1f;
    line-height: 1.3;
    margin-bottom: 6px;
}

.section-display-desc {
    font-size: 0.95rem;
    color: #5f6368;
}

.question-full-image {
    display: block;
    width: 100%;
    border-radius: 12px;
}

.image-question-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 120px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: #f9fafb;
    color: #64748b;
    font-size: 0.85rem;
}

.card-error {
    border: 1.5px solid #e55353 !important;
    border-radius: 12px;
}

.success-modal .modal-dialog {
    max-width: 420px;
}

.success-modal-card {
    background: #fff;
    border-radius: 16px;
    padding: 28px 28px 20px;
    position: relative;
    box-shadow: 0 10px 30px rgba(60, 64, 67, 0.15);
}

.success-modal-card .modal-close {
    position: absolute;
    right: 12px;
    top: 10px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #9aa0a6;
    cursor: pointer;
}

.success-content {
    padding-top: 6px;
}

.success-icon {
    width: 72px;
    height: 72px;
    margin: 6px auto 12px;
    border-radius: 50%;
    background-color: #34A853;
    display: flex;
    align-items: center;
    justify-content: center;
}

.success-icon svg,
.modal-icon-error svg {
    color: #fff;
    width: 36px;
    height: 36px;
}

.modal-icon-error {
    width: 72px;
    height: 72px;
    margin: 6px auto 12px;
    border-radius: 50%;
    background-color: #e55353;
    display: flex;
    align-items: center;
    justify-content: center;
}

.editing-banner {
    background-color: #fef3c7;
    border-bottom: 1px solid #fde68a;
}

.success-title {
    margin: 8px 0 6px;
    font-size: 1.6rem;
    font-weight: 700;
    color: #202124;
}

.success-message {
    color: #5f6368;
    font-size: 0.98rem;
    margin-bottom: 18px;
}

.success-actions {
    display: flex;
    justify-content: center;
}

.question-card {
    border-radius: 12px;
    background: #ffffff;
    border: 1px solid #eef3f8;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.03);
}

.followup-card {
    background-color: #FFFBEB !important;
    border: 1px solid #FDE68A !important;
}

.followup-card {
    margin-left: 18px;
    padding-left: 6px;
}

/* Transition for follow-up show/hide */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 220ms cubic-bezier(.2, .8, .2, 1);
}

.fade-slide-enter-from {
    opacity: 0;
    transform: translateY(-6px);
}

.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.question-index.followup-number {
    background: #FFF3CD;
    border: 1px solid #F7C948;
    color: #b45309;
    padding: 0.35rem 0.5rem;
    border-radius: 999px;
    display: inline-block;
    font-weight: 600;
}

.success-ok-button {
    min-width: 160px;
    background-color: #34A853 !important;
    border-color: #34A853 !important;
    color: #fff !important;
}

/* Hide default modal header/footer inside our modal */
::v-deep .success-modal .modal-header,
::v-deep .success-modal .modal-footer {
    display: none !important;
}

/* Ensure modal content uses our rounded layout */
::v-deep .success-modal .modal-content {
    background: transparent;
    box-shadow: none;
}

.file-upload-slot {
    width: 140px;
    height: 140px;
    border: 2px dashed #d8dbe0;
    border-radius: 12px;
    background-color: #f8f9fa;
    cursor: pointer;
    overflow: hidden;
    position: relative;
    transition: all 0.2s ease-in-out;
}

.file-upload-slot:hover {
    border-color: #321fdb;
    background-color: #ebedef;
}

.file-upload-slot.has-file {
    border-style: solid;
    border-color: #c4c9d0;
    background-color: #ffffff;
}

.file-slot-preview {
    background-color: #fff;
    border-radius: 12px;
}

.slot-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

@media (max-width: 767.98px) {
    .fillform-back-wrap {
        padding: 0 4px;
    }

    .fillform-body {
        margin: 12px auto;
        padding: 0 8px 40px;
    }

    .form-main-title {
        font-size: 1.4rem;
    }

    .section-display-title {
        font-size: 1.3rem;
    }

    .star-btn {
        font-size: 1.9rem;
        padding: 4px 6px;
    }

    .followup-card {
        margin-left: 8px;
        padding-left: 2px;
    }

    .file-preview-wrapper {
        margin-left: 0;
    }

    .answer-upload-preview,
    .answer-upload-pdf-preview,
    .answer-upload-media-preview {
        max-width: 100%;
        width: 100%;
    }

    .file-upload-slot {
        width: min(140px, calc(50% - 6px));
        height: 120px;
    }

    .submit-action-btn {
        width: 100%;
        min-height: 44px;
    }

    .success-modal-card {
        padding: 22px 18px 16px;
    }
}

.public-lang-header {
    width: 100%;
    max-width: 1360px;
}

.public-lang-toggle .btn {
    min-width: 48px;
    padding: 4px 12px;
    font-size: 0.8125rem;
}

.switch-account-btn {
    font-size: 0.8125rem;
}

.rating-scale-wrapper {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
}

.rating-anchors {
    font-size: 0.8125rem;
}

.rating-anchors small,
.rating-score-counter {
    font-size: 0.8125rem;
}

.required-error-feedback {
    font-size: 0.875rem;
}
</style>