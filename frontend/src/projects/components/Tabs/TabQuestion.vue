<template>
    <div>
        <CCard class="mb-4 rounded-20 shadow-sm border">
            <CCardBody>
                <div>
                    <!-- ── Form Title  ── -->
                    <div class="mb-3">
                        <div v-for="(titleItem, tIdx) in (form.title || [])" :key="'ft-' + tIdx"
                            class="d-flex align-items-center mb-1">
                            <div class="lang-key-wrapper flex-shrink-0 mr-2">
                                <CDropdown v-if="isCommonLang(titleItem.key) && !titleItem.isManualMode" color="light"
                                    size="sm" class="lang-key-dropdown">
                                    <template #toggler>
                                        <CButton class="lang-key-btn border shadow-none"
                                            style="width: 3.2rem; min-width: 3.2rem;">
                                            {{ (titleItem.key || 'EN').toUpperCase() }}
                                        </CButton>
                                    </template>
                                    <CDropdownItem v-for="lang in commonLangs" :key="lang.value"
                                        @click="setLangKey(titleItem, lang.value, updateFormMeta)">
                                        {{ lang.label }}
                                    </CDropdownItem>
                                    <CDropdownDivider />
                                    <CDropdownItem
                                        @click="$set(titleItem, 'isManualMode', true); $set(titleItem, 'key', '')">
                                        Other...</CDropdownItem>
                                </CDropdown>
                                <div v-else class="manual-lang-input d-flex align-items-center">
                                    <CInput class="lang-key-input mb-0" v-model="titleItem.key" @change="updateFormMeta"
                                        @blur="checkManualKey(titleItem)" maxlength="3" style="width: 3.2rem;" />
                                    <CButton
                                        @click="$set(titleItem, 'isManualMode', false); setLangKey(titleItem, 'en', updateFormMeta)"
                                        size="sm" variant="ghost" class="p-0 ml-1 text-danger">&times;</CButton>
                                </div>
                            </div>
                            <CInput class="form-title-input flex-grow-1 border-bottom mb-0" v-model="titleItem.value"
                                @change="updateFormMeta" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.title && form.title.length > 1" @click="removeFormTitle(tIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn" style="width: 3.2rem;"
                            @click="addFormTitle" size="sm" v-c-tooltip="'Add language'" aria-label="Add language">
                            <CIcon name="cil-globe-alt" />
                        </CButton>
                    </div>

                    <!-- ── Form Description ── -->
                    <div>
                        <div v-for="(descItem, dIdx) in (form.description || [])" :key="'fd-' + dIdx"
                            class="d-flex align-items-start mb-1">
                            <div class="lang-key-wrapper flex-shrink-0 mr-2">
                                <CDropdown v-if="isCommonLang(descItem.key) && !descItem.isManualMode" color="light"
                                    size="sm" class="lang-key-dropdown">
                                    <template #toggler>
                                        <CButton class="lang-key-btn border shadow-none"
                                            style="width: 3.2rem; min-width: 3.2rem;">
                                            {{ (descItem.key || 'EN').toUpperCase() }}
                                        </CButton>
                                    </template>
                                    <CDropdownItem v-for="lang in commonLangs" :key="lang.value"
                                        @click="setLangKey(descItem, lang.value, updateFormMeta)">
                                        {{ lang.label }}
                                    </CDropdownItem>
                                    <CDropdownDivider />
                                    <CDropdownItem
                                        @click="$set(descItem, 'isManualMode', true); $set(descItem, 'key', '')">
                                        Other...
                                    </CDropdownItem>
                                </CDropdown>
                                <div v-else class="manual-lang-input d-flex align-items-center">
                                    <CInput class="lang-key-input mb-0" v-model="descItem.key" @change="updateFormMeta"
                                        @blur="checkManualKey(descItem)" maxlength="3" style="width: 3.2rem;" />
                                    <CButton
                                        @click="$set(descItem, 'isManualMode', false); setLangKey(descItem, 'en', updateFormMeta)"
                                        size="sm" variant="ghost" class="p-0 ml-1 text-danger">&times;</CButton>
                                </div>
                            </div>
                            <CTextarea class="form-desc-input flex-grow-1 border-bottom mb-0" v-model="descItem.value"
                                @change="updateFormMeta" rows="2" />
                            <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                v-if="form.description && form.description.length > 1" @click="removeFormDesc(dIdx)">
                                <CIcon name="cil-minus" />
                            </CButton>
                        </div>
                        <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn" style="width: 3.2rem;"
                            @click="addFormDesc" size="sm" v-c-tooltip="'Add language'" aria-label="Add language">
                            <CIcon name="cil-globe-alt" />
                        </CButton>
                    </div>

                </div>
            </CCardBody>
        </CCard>

        <GridLayout :layout.sync="layout" :key="gridKey" :cols="{ lg: 12, md: 8, sm: 8, xs: 4, xxs: 4 }"
            :row-height="10" :is-draggable="true" :is-resizable="false" :responsive="true" @layout-updated="onDragStop">
            <GridItem v-for="(question, qIndex) in localQuestions" :key="convertIdToStr(question._id || qIndex)"
                v-bind="getLayoutItem(question, qIndex)">
                <CCard :id="'question-' + (question._id || qIndex)"
                    class="mb-3 position-relative rounded-20 shadow-sm border">
                    <CCardBody class="p-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="number-question" v-if="isCounted(question)">
                                {{ displayQuestionNumber(question, qIndex) }}</div>

                            <div class="flex-grow-1">
                                <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                    class="d-flex align-items-center mb-1">
                                    <div class="lang-key-wrapper flex-shrink-0 mr-1">
                                        <CDropdown v-if="isCommonLang(titleItem.key) && !titleItem.isManualMode"
                                            color="light" size="sm" class="lang-key-dropdown">
                                            <template #toggler>
                                                <CButton class="lang-key-btn border shadow-none"
                                                    style="width: 3.2rem; min-width: 3.2rem;">
                                                    {{ (titleItem.key || 'EN').toUpperCase() }}
                                                </CButton>
                                            </template>
                                            <CDropdownItem v-for="lang in commonLangs" :key="lang.value"
                                                @click="setLangKey(titleItem, lang.value, () => updateQuestionTitle(question))">
                                                {{ lang.label }}
                                            </CDropdownItem>
                                            <CDropdownDivider />
                                            <CDropdownItem
                                                @click="$set(titleItem, 'isManualMode', true); $set(titleItem, 'key', '')">
                                                Other...</CDropdownItem>
                                        </CDropdown>
                                        <div v-else class="manual-lang-input d-flex align-items-center">
                                            <CInput class="lang-key-input mb-0" v-model="titleItem.key"
                                                @change="updateQuestionTitle(question)"
                                                @blur="checkManualKey(titleItem)" maxlength="3"
                                                style="width: 3.2rem;" />
                                            <CButton
                                                @click="$set(titleItem, 'isManualMode', false); setLangKey(titleItem, 'en', () => updateQuestionTitle(question))"
                                                size="sm" variant="ghost" class="p-0 ml-1 text-danger">&times;</CButton>
                                        </div>
                                    </div>
                                    <CInput class="flex-grow-1 mb-0" v-model="titleItem.value"
                                        @change="updateQuestionTitle(question)" style="background-color: #f8fafc;" />
                                    <CButton color="danger" variant="ghost" size="sm" class="ml-1 flex-shrink-0"
                                        v-if="question.title && question.title.length > 1"
                                        @click="removeTitle(question, titleIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>

                                <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn mt-1"
                                    style="width: 3.2rem;" @click="addTitle(question)" size="sm"
                                    v-c-tooltip="$t('builder.addLanguage')" aria-label="Add language">
                                    <CIcon name="cil-globe-alt" />
                                </CButton>
                            </div>

                            <div class="ml-2 flex-shrink-0">
                                <CButton color="danger" variant="ghost" @click="removeQuestion(question._id)">
                                    <CIcon name="cil-trash" />
                                </CButton>
                            </div>
                        </div>

                        <!-- ── Question Type ── -->
                        <div v-if="getQuestionType(question.type).toLowerCase() === 'short_answer'">
                            <CInput disabled style="opacity: 0.55;"
                                :placeholder="$t('builder.shortAnswerPlaceholder')" />
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'paragraph'">
                            <CTextarea disabled style="opacity: 0.55;" :placeholder="$t('builder.paragraphPlaceholder')"
                                rows="3" />
                        </div>

                        <div v-else-if="
                            getQuestionType(question.type).toLowerCase() === 'multiple_choice' ||
                            getQuestionType(question.type).toLowerCase() === 'checkbox'">
                            <div v-for="(choice, choiceIndex) in (question.config && question.config.choices || [])"
                                :key="choice.key || choiceIndex" class="mb-2">
                                <div class="d-flex align-items-center">
                                    <div v-if="getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                        class="border rounded-circle mr-2 flex-shrink-0 mb-1"
                                        style="width: 30px; height: 30px;" />
                                    <div v-else class="border rounded mr-2 flex-shrink-0 mb-1"
                                        style="width: 30px; height: 30px;" />
                                    <div class="option-langs flex-grow-1">
                                        <div v-for="(lang, li) in (choice.lang || [])" :key="li"
                                            class="d-flex align-items-center mb-1">
                                            <div class="lang-key-wrapper flex-shrink-0 mr-2">
                                                <CDropdown v-if="isCommonLang(lang.key) && !lang.isManualMode"
                                                    color="light" size="sm" class="lang-key-dropdown">
                                                    <template #toggler>
                                                        <CButton class="lang-key-btn border shadow-none"
                                                            style="width: 3.2rem; min-width: 3.2rem;">
                                                            {{ (lang.key || 'EN').toUpperCase() }}
                                                        </CButton>
                                                    </template>
                                                    <CDropdownItem v-for="l in commonLangs" :key="l.value"
                                                        @click="setLangKey(lang, l.value, () => putQuestion(question))">
                                                        {{ l.label }}
                                                    </CDropdownItem>
                                                    <CDropdownDivider />
                                                    <CDropdownItem
                                                        @click="$set(lang, 'isManualMode', true); $set(lang, 'key', '')">
                                                        Other...</CDropdownItem>
                                                </CDropdown>
                                                <div v-else class="manual-lang-input d-flex align-items-center">
                                                    <CInput class="lang-key-input mb-0" v-model="lang.key"
                                                        @change="putQuestion(question)" @blur="checkManualKey(lang)"
                                                        maxlength="3" style="width: 3.2rem;" />
                                                    <CButton
                                                        @click="$set(lang, 'isManualMode', false); setLangKey(lang, 'en', () => putQuestion(question))"
                                                        size="sm" variant="ghost" class="p-0 ml-1 text-danger">&times;
                                                    </CButton>
                                                </div>
                                            </div>
                                            <CInput class="flex-grow-1 mb-0" v-model="lang.value"
                                                @input="(e) => updateOption(question, choiceIndex, li, e)" />
                                            <CButton color="danger" variant="ghost" size="sm" class="ml-1 flex-shrink-0"
                                                v-if="choice.lang && choice.lang.length > 1"
                                                @click="removeOptionLanguage(question, choiceIndex, li)">
                                                <CIcon name="cil-minus" />
                                            </CButton>
                                        </div>
                                    </div>


                                    <CButton color="danger" variant="ghost" size="sm" class="ml-1 mb-1"
                                        v-if="question.config && question.config.choices && question.config.choices.length > 1 && (!choice.lang || choice.lang.length <= 1)"
                                        @click="removeOption(question, choiceIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>
                                <div class="d-flex align-items-center mt-1">
                                    <div style="width: 38px;" class="flex-shrink-0" />
                                    <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn"
                                        @click="addOptionLanguage(question, choiceIndex)" size="sm"
                                        v-c-tooltip="'Add language'" aria-label="Add language">
                                        <CIcon name="cil-globe-alt" />
                                    </CButton>

                                    <div v-if="getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                        class="d-flex align-items-center ml-2 flex-shrink-0">
                                        <CDropdown color="light" size="sm">
                                            <template #toggler>
                                                <CButton size="sm"
                                                    class="border shadow-none d-flex align-items-center next-action-btn"
                                                    v-c-tooltip="$t('builder.goTo')">
                                                    <CIcon
                                                        :name="!choice.nextQuestion ? 'cil-ban' : (choice.nextQuestion === 'submit' ? 'cil-check-alt' : 'cil-list-low-priority')"
                                                        class="mr-1" />
                                                    <span>
                                                        {{
                                                            choice.nextQuestion
                                                                ? (choice.nextQuestion === 'submit' ? $t('builder.submitForm') :
                                                                    (function () {
                                                                        const target = localQuestions.find(q => convertIdToStr(q._id)
                                                                            === convertIdToStr(choice.nextQuestion));
                                                                        return target ? (isCounted(target) ? getDisplayNumber(target) +
                                                                            '. ' : '') + getQuestionTitle(target) : '';
                                                                    })())
                                                                : $t('builder.noAction')
                                                        }}
                                                    </span>
                                                </CButton>
                                            </template>
                                            <CDropdownItem
                                                @click="$set(choice, 'nextQuestion', null); putQuestion(question)">
                                                <CIcon name="cil-ban" class="mr-2" />
                                                <span>{{ $t('builder.noAction') }}</span>
                                            </CDropdownItem>
                                            <CDropdownDivider />
                                            <CDropdownItem v-for="q in getAvailableNextQuestions(question)" :key="q._id"
                                                @click="$set(choice, 'nextQuestion', q._id); putQuestion(question)">
                                                <CIcon name="cil-list-low-priority" class="mr-2" />
                                                <span>{{ isCounted(q) ? getDisplayNumber(q) + '.' : '' }} {{
                                                    getQuestionTitle(q)
                                                }}</span>
                                            </CDropdownItem>
                                            <CDropdownItem
                                                @click="$set(choice, 'nextQuestion', 'submit'); putQuestion(question)">
                                                <CIcon name="cil-check-alt" class="mr-2" />
                                                <span>{{ $t('builder.submitForm') }}</span>
                                            </CDropdownItem>
                                        </CDropdown>
                                    </div>
                                </div>
                            </div>
                            <CButton color="primary" variant="ghost" class="icon-btn add-option-btn mt-1"
                                @click="addOption(question)" size="sm" v-c-tooltip="$t('builder.addOption')"
                                aria-label="Add option">
                                <CIcon name="cil-list" />
                            </CButton>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'rating'"
                            class="d-flex align-items-center">
                            <CDropdown class="mr-3" color="secondary" variant="outline">
                                <template #toggler>
                                    <button class="btn d-flex align-items-center text-muted border bg-white"
                                        style="border-radius: 6px;">
                                        {{ (question.config && question.config.maxRating) || 5 }}
                                    </button>
                                </template>
                                <CDropdownItem v-for="n in 10" :key="n" @click="setRating(question, n)">
                                    {{ n }}
                                </CDropdownItem>
                            </CDropdown>
                            <div v-for="n in ((question.config && question.config.maxRating) || 5)" :key="n"
                                class="d-flex flex-grow-1 flex-column align-items-center">
                                <span>{{ n }}</span>
                                <CIcon name="cil-star" :height="22" />
                            </div>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'file_upload'">
                            <div class="mb-3">
                                <span class="d-block mb-2 small text-muted">{{ $t('builder.fileType') }}</span>
                                <div class="d-flex flex-wrap">
                                    <div v-for="ft in fileTypeOptions" :key="ft.key" class="mr-3 mb-2">
                                        <CInputCheckbox :id="`filetype-${qIndex}-${ft.key}`"
                                            :name="`filetype-${qIndex}-${ft.key}`" :label="ft.label" :value="ft.key"
                                            :custom="true"
                                            :checked="question.config && Array.isArray(question.config.fileTypes) && question.config.fileTypes.includes(ft.key)"
                                            @change="toggleFileType(question, ft.key)" />
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="mr-3 small text-muted">{{ $t('builder.maxFiles') }}</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm border">
                                            {{ (question.config && question.config.maxFiles) || 1 }}
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="n in [1, 5, 10]" :key="n" @click="setMaxFiles(question, n)">
                                        {{ n }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="mr-3 small text-muted">{{ $t('builder.maxFileSize') }}</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm border">
                                            {{ (question.config && question.config.maxFileSize) ? question.config.maxFileSize + 'MB'
                                                : '1MB'
                                            }}
                                        </button>
                                    </template>
                                    <CDropdownItem v-for="s in fileSizeOptions" :key="s.value"
                                        @click="setMaxFileSize(question, s.value)">
                                        {{ s.label }}
                                    </CDropdownItem>
                                </CDropdown>
                            </div>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'title_description'">
                            <small class="text-muted font-weight-bold d-block mb-1">
                                {{ $t('builder.description') }}
                            </small>

                            <div v-for="(descItem, dIdx) in (question.config && question.config.description || [])" :key="'qd-' + dIdx"
                                class="d-flex align-items-start">
                                <div class="lang-key-wrapper flex-shrink-0 mr-2">
                                    <CDropdown v-if="isCommonLang(descItem.key) && !descItem.isManualMode" color="light"
                                        size="sm" class="lang-key-dropdown">
                                        <template #toggler>
                                            <CButton class="lang-key-btn border shadow-none"
                                                style="width: 3.2rem; min-width: 3.2rem;">
                                                {{ (descItem.key || 'EN').toUpperCase() }}
                                            </CButton>
                                        </template>
                                        <CDropdownItem v-for="lang in commonLangs" :key="lang.value"
                                            @click="setLangKey(descItem, lang.value, () => putQuestion(question))">
                                            {{ lang.label }}
                                        </CDropdownItem>
                                        <CDropdownDivider />
                                        <CDropdownItem
                                            @click="$set(descItem, 'isManualMode', true); $set(descItem, 'key', '')">
                                            Other...</CDropdownItem>
                                    </CDropdown>
                                    <div v-else class="manual-lang-input d-flex align-items-center">
                                        <CInput class="lang-key-input mb-0" v-model="descItem.key"
                                            @change="putQuestion(question)" @blur="checkManualKey(descItem)"
                                            maxlength="3" style="width: 3.2rem;" />
                                        <CButton
                                            @click="$set(descItem, 'isManualMode', false); setLangKey(descItem, 'en', () => putQuestion(question))"
                                            size="sm" variant="ghost" class="p-0 ml-1 text-danger">&times;</CButton>
                                    </div>
                                </div>
                                <CTextarea class="flex-grow-1" v-model="descItem.value" @change="putQuestion(question)"
                                    rows="2" />
                                <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                    v-if="question.config && question.config.description && question.config.description.length > 1"
                                    @click="removeConfigDesc(question, dIdx)">
                                    <CIcon name="cil-minus" />
                                </CButton>
                            </div>

                            <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn"
                                style="width: 3.2rem;" @click="addConfigDesc(question)" size="sm"
                                v-c-tooltip="'Add language'" aria-label="Add language">
                                <CIcon name="cil-globe-alt" />
                            </CButton>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'image'">
                            <div class="image-drop-zone" @click="openImageModal(qIndex)">
                                <div v-if="!question.config || !question.config.image" class="image-placeholder">
                                    <CIcon name="cil-image-1" :height="40" class="mb-2" />
                                    <span>{{ $t('builder.clickToChooseImage') }}</span>
                                </div>
                                <img v-else :src="question.config.image" class="image-preview" />
                            </div>
                        </div>

                        <div v-else>
                            <span class="text-muted font-italic small">
                                {{ $t('builder.previewNotAvailable') }}
                            </span>
                        </div>

                        <!-- ── Footer: Question Type dropdown + Navigation + Required toggle ── -->
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap">
                            <!-- Left: Question Type -->
                            <div class="d-flex align-items-center mb-2 mb-md-0 flex-shrink-0">
                                <div class="d-flex align-items-center">
                                    <span class="text-muted font-weight-bold mr-2">{{ $t('builder.type') }}</span>
                                    <CDropdown color="light" variant="outline">
                                        <template #toggler>
                                            <button class="btn d-flex align-items-center text-muted border bg-white"
                                                style="border-radius: 6px;">
                                                <CIcon :name="getIconForType(question.type)" class="mr-2" />
                                                <span class="text-capitalize">
                                                    {{ formatTypeLabel(getQuestionType(question.type)) }}
                                                </span>
                                            </button>
                                        </template>
                                        <CDropdownItem v-for="type in typesAll" :key="type._id"
                                            @click="setQuestionType(question, type._id)">
                                            <CIcon :name="getIconForType(type._id)" class="mr-2" />
                                            <span class="text-capitalize">
                                                {{ formatTypeLabel(type.type) }}
                                            </span>
                                        </CDropdownItem>
                                    </CDropdown>
                                </div>
                            </div>

                            <!-- Right: Navigation Dropdown & Required Toggle -->
                            <div v-if="getQuestionType(question.type).toLowerCase() !== 'title_description' && getQuestionType(question.type).toLowerCase() !== 'image'"
                                class="d-flex align-items-center flex-wrap">

                                <!-- Question Navigation Dropdown -->
                                <div class="d-flex align-items-center mr-3 mb-2 mb-md-0">
                                    <span class="text-muted font-weight-bold mr-2">{{ $t('builder.goTo') }}</span>
                                    <CDropdown color="light" variant="outline">
                                        <template #toggler>
                                            <button class="btn d-flex align-items-center text-muted border bg-white"
                                                style="border-radius: 6px;">
                                                <CIcon
                                                    :name="!question.nextQuestion ? 'cil-check-alt' : 'cil-list-low-priority'"
                                                    class="mr-2" />
                                                <span class="text-dark">
                                                    {{
                                                        !question.nextQuestion ? $t('builder.submitForm') :
                                                            (function () {
                                                                const targetQ = localQuestions.find(q => convertIdToStr(q._id) ===
                                                                    convertIdToStr(question.nextQuestion));
                                                                return targetQ ? (isCounted(targetQ) ? getDisplayNumber(targetQ) +
                                                                    '. ' : '') + getQuestionTitle(targetQ) : '';
                                                            })()
                                                    }}
                                                </span>
                                            </button>
                                        </template>
                                        <CDropdownItem v-for="q in getAvailableNextQuestions(question)"
                                            :key="'nav_' + q._id"
                                            @click="setCombinedNavigationValue(question, 'question:' + convertIdToStr(q._id))">
                                            <CIcon name="cil-list-low-priority" class="mr-2" />
                                            <span>
                                                {{ isCounted(q) ? getDisplayNumber(q) + '.' : '' }} {{
                                                    getQuestionTitle(q) }}
                                            </span>
                                        </CDropdownItem>
                                        <CDropdownItem @click="setCombinedNavigationValue(question, 'submit')">
                                            <CIcon name="cil-check-alt" class="mr-2" />
                                            <span>{{ $t('builder.submitForm') }}</span>
                                        </CDropdownItem>
                                    </CDropdown>
                                </div>

                                <!-- Required Toggle -->
                                <div class="d-flex align-items-center mb-2 mb-md-0">
                                    <small class="text-muted font-weight-bold text-uppercase mr-2">{{
                                        $t('builder.requiredLabel') }}</small>
                                    <CSwitch class="mx-1" color="dark" shape="pill" :checked="question.isRequired"
                                        @update:checked="val => { question.isRequired = val; putQuestion(question); }" />
                                </div>
                            </div>
                        </div>
                    </CCardBody>
                </CCard>
            </GridItem>
        </GridLayout>

        <!-- Empty state -->
        <div v-if="!localQuestions || localQuestions.length === 0"
            class="text-center py-5 text-muted bg-white rounded-20 shadow-sm">
            <CIcon name="cil-notes" :height="40" class="mb-3 text-muted" />
            <p class="mb-0">{{ $t('builder.emptyQuestions') }}</p>
        </div>

        <!-- Image Select modal -->
        <CModal :show.sync="showImageModal" :centered="true">
            <template #header-wrapper>
                <div class="d-flex justify-content-between align-items-center font-weight-bold pl-3 border-bottom">
                    <span>{{ $t('builder.modal.chooseImage') }}</span>
                    <CButton color="secondary" variant="ghost" @click="showImageModal = false">
                        <CIcon name="cil-x" />
                    </CButton>
                </div>
            </template>
            <template #body-wrapper>
                <CCardBody class="p-3">
                    <div class="image-drop-zone" @click="$refs.imageFileInput.click()">
                        <div v-if="!modalFiles" class="image-placeholder">
                            <CIcon name="cil-image-1" :height="40" class="mb-2" />
                            <span>{{ $t('builder.modal.chooseImage') }}</span>
                        </div>
                        <img v-else :src="modalFiles" class="image-preview" />
                    </div>
                    <input ref="imageFileInput" type="file" accept="image/*" style="display:none;"
                        @change="onImageSelected($event)" />
                </CCardBody>
            </template>
            <template #footer-wrapper>
                <div class="d-flex justify-content-end p-2 border-top">
                    <CButton color="danger" variant="ghost" @click="showImageModal = false" :disabled="isImageUpdating">
                        {{ $t('builder.modal.cancel') }}
                    </CButton>
                    <CButton color="primary" class="ml-2 px-4 shadow-sm font-weight-bold"
                        @click="confirmImageQuestion()" :disabled="isImageUpdating || !modalFiles">
                        <CSpinner v-if="isImageUpdating" size="sm" class="mr-1" />
                        {{ $t('builder.modal.ok') }}
                    </CButton>
                </div>
            </template>
        </CModal>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { GridLayout, GridItem } from 'vue-grid-layout'
import { loadStoredLayout, saveGridLayout, buildGridLayoutFromQuestions, getLayoutItem as svcGetLayoutItem, onDragStop as svcOnDragStop } from '../../service/draggable'

export default {
    name: 'TabQuestion',
    props: {
        form: { type: Object, required: true }
    },
    components: {
        GridLayout,
        GridItem
    },
    data() {
        return {
            localQuestions: [],
            fileTypeOptions: [
                { key: 'image', label: 'Image' },
                { key: 'pdf', label: 'PDF' },
                { key: 'doc', label: 'DOC' }
            ],
            fileSizeOptions: [
                { value: 1, label: '1MB' },
                { value: 5, label: '5MB' }
            ],
            showImageModal: false,
            modalImageIndex: null,
            modalFiles: '',
            layout: [],
            storedLayout: null,
            gridKey: 0,
            commonLangs: [
                { value: 'th', label: 'TH' },
                { value: 'en', label: 'EN' },
            ],
            isImageUpdating: false,
        };
    },
    watch: {
        form: {
            immediate: true,
            deep: true,
            handler(newForm) {
                if (newForm && Array.isArray(newForm.questions)) {
                    try {
                        const built = Array.isArray(newForm.questions) ? [...newForm.questions] : [];
                        built.forEach(q => { if (q && !q.config) q.config = {}; });
                        built.sort((a, b) => (a.order || 999) - (b.order || 999));

                        const newIds = built.map(x => this.convertIdToStr(x && x._id));
                        const oldIds = (this.localQuestions || []).map(x => this.convertIdToStr(x && x._id));
                        const sameOrder = newIds.length === oldIds.length && newIds.every((id, idx) => id === oldIds[idx]);

                        if (sameOrder && this.localQuestions && this.localQuestions.length > 0) {
                            for (let i = 0; i < built.length; i++) {
                                const src = built[i];
                                const dst = this.localQuestions[i];
                                if (!dst || !src) continue;
                                for (const key of Object.keys(src)) {
                                    this.$set(dst, key, src[key]);
                                }
                            }
                        } else {
                            this.localQuestions = built;
                            try {
                                this.loadStoredLayout();
                                this.buildGridLayoutFromQuestions();
                            } catch (e) {
                                // ignore layout build errors
                            }
                        }
                    } catch (err) {
                        console.error('Failed to merge missing follow-ups:', err);
                    }
                }
                if (newForm && (!Array.isArray(newForm.title) || newForm.title.length === 0)) {
                    this.$nextTick(() => this.addFormTitle());
                }
                if (newForm && (!Array.isArray(newForm.description) || newForm.description.length === 0)) {
                    this.$nextTick(() => this.addFormDesc());
                }
            }
        },
        localQuestions: {
            handler() {
                try {
                    this.buildGridLayoutFromQuestions();
                } catch (e) {
                    // ignore
                }
            }
        }
    },
    created() {
        this.$store.dispatch('Setting/question_type/get');
        try {
            this.loadStoredLayout();
        } catch (e) { }
    },
    mounted() {
        try {
            console.warn('TabQuestion mounted — debug hook installed');
            window.__TABQUESTION_INVOKE_ONDRAG = () => {
                try {
                    console.warn('Invoking onDragStop via window.__TABQUESTION_INVOKE_ONDRAG');
                    return this.onDragStop(this.layout);
                } catch (e) {
                    console.error('invoke onDragStop failed', e);
                }
            };
        } catch (e) {
            /* ignore */
        }
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type: 'item' }),
        questionTypes() {
            if (!this.question_type || !Array.isArray(this.question_type)) return [];
            return JSON.parse(JSON.stringify(this.question_type)).map(type => ({
                _id: type._id,
                type: type.type,
            }));
        },
        typesAll() {
            return [...this.questionTypes];
        },
        formTitleEn: {
            get() {
                if (!this.form || !Array.isArray(this.form.title)) return '';
                const enObj = this.form.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                return enObj ? enObj.value : (this.form.title.length > 0 ? this.form.title[0].value : '');
            },
            set(val) {
                if (!this.form || !Array.isArray(this.form.title)) return;
                let enObj = this.form.title.find(t => t && t.key && t.key.toLowerCase() === 'en');
                if (enObj) {
                    enObj.value = val;
                } else if (this.form.title.length > 0) {
                    this.form.title[0].value = val;
                } else {
                    this.form.title.push({ key: 'en', value: val });
                }
            }
        },
        formDescEn: {
            get() {
                if (!this.form || !Array.isArray(this.form.description)) return '';
                const enObj = this.form.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                return enObj ? enObj.value : (this.form.description.length > 0 ? this.form.description[0].value : '');
            },
            set(val) {
                if (!this.form || !Array.isArray(this.form.description)) return;
                let enObj = this.form.description.find(d => d && d.key && d.key.toLowerCase() === 'en');
                if (enObj) {
                    enObj.value = val;
                } else if (this.form.description.length > 0) {
                    this.form.description[0].value = val;
                } else {
                    this.form.description.push({ key: 'en', value: val });
                }
            }
        }
    },
    methods: {
        saveGrid() {
            try {
                this.storedLayout = this.layout;
                saveGridLayout(this.form, this.layout);
            } catch (e) {
                console.error('saveGrid failed', e);
            }
        },

        loadStoredLayout() {
            try {
                this.storedLayout = loadStoredLayout(this.form);
            } catch (e) {
                this.storedLayout = null;
            }
        },

        buildGridLayoutFromQuestions() {
            try {
                const newLayout = buildGridLayoutFromQuestions(
                    this.localQuestions,
                    this.storedLayout,
                    (t) => this.getQuestionType(t),
                    (q) => false
                );

                if (!this.layout || this.layout.length === 0) {
                    this.layout = newLayout;
                    this.gridKey++;
                } else {
                    for (let i = this.layout.length - 1; i >= 0; i--) {
                        if (!newLayout.find(nl => String(nl.i) === String(this.layout[i].i))) {
                            this.layout.splice(i, 1);
                        }
                    }
                    for (let i = 0; i < newLayout.length; i++) {
                        const newItem = newLayout[i];
                        const oldIndex = this.layout.findIndex(l => String(l.i) === String(newItem.i));
                        if (oldIndex === -1) {
                            this.layout.splice(i, 0, { ...newItem });
                        } else {
                            const oldItem = this.layout[oldIndex];
                            if (oldItem.h !== newItem.h) this.$set(oldItem, 'h', newItem.h);
                            if (oldItem.y !== newItem.y) this.$set(oldItem, 'y', newItem.y);
                            if (oldIndex !== i) {
                                this.layout.splice(oldIndex, 1);
                                this.layout.splice(i, 0, oldItem);
                            }
                        }
                    }
                }
            } catch (e) {
                this.layout = [];
                this.gridKey++;
            }
        },

        getLayoutItem(question, qIndex) {
            return svcGetLayoutItem(this.layout, question, qIndex);
        },

        async onDragStop(newLayout) {
            try {
                let reordered = await svcOnDragStop(newLayout, this.localQuestions, this.convertIdToStr);
                if (!Array.isArray(reordered)) return;

                const oldIds = (this.localQuestions || []).map(q => this.convertIdToStr(q._id || ''));
                const newIds = (reordered || []).map(q => this.convertIdToStr(q._id || ''));
                if (oldIds.join(',') === newIds.join(',')) return;
                if (Array.isArray(reordered)) {
                    this.localQuestions = reordered;
                    try {
                        await this.updateOrdersAndPersist(reordered);
                    } catch (e) { console.error(e); }
                }
            } catch (e) {
                console.error('onDragStop error', e);
            }
        },

        triggerAutoSave() {
            this.$emit('auto-save');
        },

        async updateFormMeta() {
            this.triggerAutoSave();
        },

        async updateOrdersAndPersist(newQuestions) {
            const list = Array.isArray(newQuestions) ? newQuestions : this.localQuestions || [];
            if (!Array.isArray(list)) return;
            const updates = [];
            try {
                for (let i = 0; i < list.length; i++) {
                    const q = list[i];
                    if (!q) continue;
                    const newOrder = i + 1;
                    if (q.order !== newOrder) {
                        this.$set(q, 'order', newOrder);
                        if (q._id && !(String(q._id).startsWith && String(q._id).startsWith('tmp-'))) {
                            updates.push(this.$store.dispatch('Questions/update', { _id: q._id, order: newOrder }));
                        }
                    }
                }
                if (updates.length) await Promise.all(updates);
            } catch (err) {
                console.error('updateOrdersAndPersist failed', err);
            }
        },

        addFormTitle() {
            if (!this.form) return;
            if (!Array.isArray(this.form.title)) {
                this.$set(this.form, 'title', [{ key: 'en', value: 'Untitled Form' }]);
            } else {
                this.form.title.push({ key: '', value: '' });
            }
            this.updateFormMeta();
        },

        removeFormTitle(idx) {
            if (!this.form || !Array.isArray(this.form.title)) return;
            if (this.form.title.length <= 1) return;
            this.form.title.splice(idx, 1);
            this.updateFormMeta();
        },

        addFormDesc() {
            if (!this.form) return;
            if (!Array.isArray(this.form.description)) {
                this.$set(this.form, 'description', [{ key: 'en', value: 'Description' }]);
            } else {
                this.form.description.push({ key: '', value: '' });
            }
            this.updateFormMeta();
        },

        removeFormDesc(idx) {
            if (!this.form || !Array.isArray(this.form.description)) return;
            if (this.form.description.length <= 1) return;
            this.form.description.splice(idx, 1);
            this.updateFormMeta();
        },

        async putQuestion(question) {
            this.buildGridLayoutFromQuestions();
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/update', payload);
            } catch (err) {
                console.error('Failed to update question', err);
            }
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

        async updateQuestionTitle(question) {
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }
                await this.$store.dispatch('Questions/update', {
                    _id: payload._id,
                    title: payload.title,
                    form: payload.form,
                    type: payload.type,
                    order: payload.order,
                    isRequired: payload.isRequired,
                    config: payload.config,
                });
            } catch (err) {
                console.error('Failed to update question title', err);
            }
        },

        async addQuestion(typeId) {
            const foundType = this.questionTypes.find(type => type._id === typeId || type.type === typeId);

            if (!foundType) return;
            const isParagraph = foundType.type === 'paragraph';
            const isMultipleChoice = foundType.type === 'multiple_choice' || foundType.type === 'checkbox';
            const isCheckboxes = foundType.type === 'checkbox';
            const isRating = foundType.type === 'rating';
            const isFileUpload = foundType.type === 'file_upload';
            const isImage = foundType.type === 'image';
            const isTitleDescription = foundType.type === 'title_description';

            const config = {
                choices: (isMultipleChoice || isCheckboxes)
                    ? [{ key: '0', lang: [{ key: 'en', value: 'Option 1' }] }]
                    : [],
                allowMultipleSelect: isCheckboxes,
                maxRating: isRating ? 5 : null,
                maxText: isParagraph ? 300 : null,
                maxFiles: isFileUpload ? 1 : null,
                maxFileSize: isFileUpload ? 1 : null,
                image: isImage ? this.modalFiles : null,
                description: isTitleDescription ? [{ key: 'en', value: 'Description' }] : [],
            };

            const payload = {
                form: this.form && this.form._id ? this.form._id : undefined,
                title: [{ key: 'en', value: 'Untitled Question' }],
                order: this.localQuestions.length + 1,
                type: foundType._id,
                isRequired: false,
                nextQuestion: null,
                config,
            };

            if (!this.form || !this.form._id) {
                const tmp = {
                    _id: 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    ...payload,
                };
                // Chain from the previous "end" question
                const lastQuestion = this.localQuestions[this.localQuestions.length - 1];
                if (lastQuestion) {
                    this.$set(lastQuestion, 'nextQuestion', tmp._id);
                    this.putQuestion(lastQuestion);
                }
                this.localQuestions.push(tmp);
                this.buildGridLayoutFromQuestions();
                return tmp;
            }

            try {
                const res = await this.$store.dispatch('Questions/create', payload);
                const created = res && res.data && res.data.data;
                if (created && created._id) {
                    if (!created.type || typeof created.type === 'string') {
                        const foundType = this.questionTypes.find(t => t._id === typeId);
                        if (foundType) created.type = foundType;
                    }
                    // Chain from the previous "end" question
                    const lastQuestion = this.localQuestions[this.localQuestions.length - 1];
                    if (lastQuestion) {
                        this.$set(lastQuestion, 'nextQuestion', created._id);
                        this.putQuestion(lastQuestion);
                    }

                    this.localQuestions.push(created);
                    if (this.form && Array.isArray(this.form.questions)) {
                        this.form.questions.push(created);
                    }
                    this.buildGridLayoutFromQuestions();
                    return created;
                } else {
                    console.error('addQuestion: backend did not return a created document with _id', res);
                    return null;
                }
            } catch (e) {
                console.error('addQuestion failed:', e);
                return null;
            }
        },

        async removeQuestion(qId) {
            if (!qId) return;
            const index = this.localQuestions.findIndex(q => this.convertIdToStr(q._id) === this.convertIdToStr(qId));
            if (index === -1) return;

            const q = this.localQuestions[index];
            this.localQuestions.splice(index, 1);
            this.buildGridLayoutFromQuestions();

            if (this.form && Array.isArray(this.form.questions)) {
                const fIndex = this.form.questions.findIndex(item => this.convertIdToStr(item && item._id) === this.convertIdToStr(qId));
                if (fIndex !== -1) {
                    this.form.questions.splice(fIndex, 1);
                }
            }

            try {
                if (q && q._id && !String(q._id).startsWith('tmp-')) {
                    await this.$store.dispatch('Questions/delete', { _id: q._id });
                }
            } catch (e) {
                console.error('removeQuestion delete endpoint failed:', e);
            }
            await this.updateOrdersAndPersist();
        },

        setQuestionType(question, typeId) {
            if (!question) return;

            const foundType = this.questionTypes.find(t => t._id === typeId);
            const isMultipleChoice = foundType.type === 'multiple_choice' || foundType.type === 'checkbox';
            const isCheckboxes = foundType.type === 'checkbox';
            const isRating = foundType.type === 'rating';
            const isFileUpload = foundType.type === 'file_upload';
            const isImage = foundType.type === 'image';

            if (!question.config) this.$set(question, 'config', {});

            if ((isMultipleChoice || isCheckboxes) && (!Array.isArray(question.config.choices) || question.config.choices.length === 0)) {
                this.$set(question.config, 'choices', [{ key: '0', lang: [{ key: 'en', value: 'Option 1' }] }]);
            }
            if (isRating && (typeof question.config.maxRating !== 'number' || isNaN(question.config.maxRating))) {
                this.$set(question.config, 'maxRating', 5);
            }
            if (isFileUpload) {
                if (typeof question.config.maxFiles !== 'number') this.$set(question.config, 'maxFiles', 1);
                if (typeof question.config.maxFileSize !== 'number') this.$set(question.config, 'maxFileSize', 1);
            }
            const isTitleDescription = foundType.type === 'title_description';
            if (isTitleDescription) {
                if (!Array.isArray(question.config.description) || question.config.description.length === 0)
                    this.$set(question.config, 'description', [{ key: 'en', value: 'Description' }]);
            }

            if (isImage) {
                const qIndex = this.localQuestions.indexOf(question);
                this.openImageModal(qIndex !== -1 ? qIndex : null);
            }

            this.$set(question, 'type', typeId);
            this.putQuestion(question);
        },

        getQuestionType(typeObjOrId) {
            if (!typeObjOrId) return '';
            if (typeof typeObjOrId === 'object') return typeObjOrId.type || typeObjOrId.label || '';
            const found = this.questionTypes.find(t => t._id === typeObjOrId);
            return found ? (found.type || '') : typeObjOrId;
        },
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            const key = rawType.toLowerCase().replace(/ /g, '_');
            if (this.$te(`types.${key}`)) {
                return this.$t(`types.${key}`);
            }
            return rawType.split('_').join(' ');
        },
        getIconForType(typeObjOrId) {
            const typeStr = (this.getQuestionType(typeObjOrId) || '').toLowerCase().replace(/ /g, '_');
            switch (typeStr) {
                case 'short_answer': return 'cil-minus';
                case 'paragraph': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkbox': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'image': return 'cil-image-1';
                default: return 'cil-question';
            }
        },
        addTitle(question) {
            if (!question) return;
            if (!Array.isArray(question.title) || question.title.length === 0) {
                this.$set(question, 'title', [{ key: 'en', value: '' }]);
            } else {
                question.title.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeTitle(question, tIndex) {
            if (!question || !Array.isArray(question.title)) return;
            if (question.title.length <= 1) return;
            question.title.splice(tIndex, 1);
            this.putQuestion(question);
        },
        updateQuestionDescription(question) {
            if (!question || !question._id) return;
            this.putQuestion(question);
        },
        setRating(question, number) {
            if (!question) return;
            this.$set(question.config, 'maxRating', Number(number) || 5);
            this.putQuestion(question);
        },
        clearField(question, field) {
            if (question) {
                this.$set(question, field, '');
                this.putQuestion(question);
            }
        },
        onImageSelected(event) {
            const file = event.target && event.target.files && event.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return;

            const maxSize = 5 * 1024 * 1024; // 5MB limit
            if (file.size > maxSize) {
                if (this.$toast) this.$toast.error('Image size cannot exceed 5MB');
                else alert('Image size cannot exceed 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.modalFiles = ev.target.result;
            };
            reader.readAsDataURL(file);
        },
        openImageModal(qIndex) {
            this.modalImageIndex = qIndex;
            this.modalFiles = (this.localQuestions[qIndex] && this.localQuestions[qIndex].config && this.localQuestions[qIndex].config.image) || '';
            this.showImageModal = true;
        },
        async confirmImageQuestion() {
            if (!this.modalFiles || this.isImageUpdating) return;
            this.isImageUpdating = true;
            try {
                if (this.modalImageIndex !== null) {
                    const q = this.localQuestions[this.modalImageIndex];
                    if (q) {
                        if (!q.config) this.$set(q, 'config', {});
                        this.$set(q.config, 'image', this.modalFiles);
                        await this.putQuestion(q);
                    }
                } else {
                    await this.addQuestion('image');
                }
                this.showImageModal = false;
            } catch (err) {
                console.error('confirmImageQuestion failed:', err);
            } finally {
                this.isImageUpdating = false;
            }
        },
        scrollToQuestion(questionId) {
            if (!questionId) return;
            this.$nextTick(() => {
                const el = document.getElementById('question-' + questionId);
                if (el && el.scrollIntoView) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        },
        addOption(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.choices)) {
                this.$set(question.config, 'choices', [{ key: "0", lang: [{ key: 'en', value: '' }] }]);
            } else {
                question.config.choices.push({ key: String(question.config.choices.length), lang: [{ key: '', value: '' }] });
            }
            this.putQuestion(question);
        },
        updateOption(question, oIndex, val) {
            if (!question || !Array.isArray(question.config.choices)) return;
            let langIndex = 0;
            let value = '';
            if (arguments.length === 3) {
                value = val ? String(val) : '';
            } else if (arguments.length >= 4) {
                langIndex = val;
                const ev = arguments[3];
                value = ev && ev.target ? String(ev.target.value) : (ev ? String(ev) : '');
            }

            const opt = question.config.choices[oIndex];
            if (!opt) return;
            if (!Array.isArray(opt.lang)) opt.lang = [];
            const existing = opt.lang[langIndex] || { key: '', value: '' };
            this.$set(opt.lang, langIndex, { ...existing, value });
            this.putQuestion(question);
        },
        addOptionLanguage(question, choiceIndex) {
            if (!question || !question.config || !Array.isArray(question.config.choices)) return;
            const choice = question.config.choices[choiceIndex];
            if (!choice) return;
            if (!Array.isArray(choice.lang)) this.$set(choice, 'lang', []);
            choice.lang.push({ key: '', value: '' });
            this.putQuestion(question);
        },
        removeOptionLanguage(question, choiceIndex, langIndex) {
            if (!question || !question.config || !Array.isArray(question.config.choices)) return;
            const choice = question.config.choices[choiceIndex];
            if (!choice || !Array.isArray(choice.lang)) return;
            if (choice.lang.length <= 1) return;
            choice.lang.splice(langIndex, 1);
            this.putQuestion(question);
        },
        removeOption(question, oIndex) {
            if (!question || !Array.isArray(question.config.choices)) return;
            if (question.config.choices.length <= 1) return;
            question.config.choices.splice(oIndex, 1);
            this.putQuestion(question);
        },
        isCounted(question) {
            if (!question) return false;
            const type = (this.getQuestionType(question.type) || '').toLowerCase().replace(/[\s&/]+/g, '_');
            return type !== 'title_description' && type !== 'image';
        },
        getDisplayNumber(question) {
            if (!question) return 0;
            let num = 0;
            for (let i = 0; i < this.localQuestions.length; i++) {
                const item = this.localQuestions[i];
                if (this.isCounted(item)) num++;
                if (item === question) return num;
            }
            return num;
        },
        displayQuestionNumber(question, index) {
            let num = 0;
            for (let i = 0; i <= index && i < this.localQuestions.length; i++) {
                const item = this.localQuestions[i];
                if (this.isCounted(item)) num++;
            }
            return num;
        },
        toggleFileType(question, ftKey) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.fileTypes)) {
                this.$set(question.config, 'fileTypes', [ftKey]);
            } else {
                const idx = question.config.fileTypes.indexOf(ftKey);
                if (idx === -1) {
                    question.config.fileTypes.push(ftKey);
                } else {
                    question.config.fileTypes.splice(idx, 1);
                }
            }
            this.putQuestion(question);
        },
        setMaxFiles(question, n) {
            if (!question) return;
            this.$set(question.config, 'maxFiles', Number(n) || 1);
            this.putQuestion(question);
        },
        setMaxFileSize(question, n) {
            if (!question) return;
            this.$set(question.config, 'maxFileSize', Number(n) || 1);
            this.putQuestion(question);
        },
        addConfigTitle(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.title)) {
                this.$set(question.config, 'title', [{ key: 'en', value: '' }]);
            } else {
                question.config.title.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeConfigTitle(question, idx) {
            if (!question || !Array.isArray(question.config.title)) return;
            if (question.config.title.length <= 1) return;
            question.config.title.splice(idx, 1);
            this.putQuestion(question);
        },
        addConfigDesc(question) {
            if (!question) return;
            if (!question.config) this.$set(question, 'config', {});
            if (!Array.isArray(question.config.description)) {
                this.$set(question.config, 'description', [{ key: 'en', value: '' }]);
            } else {
                question.config.description.push({ key: '', value: '' });
            }
            this.putQuestion(question);
        },
        removeConfigDesc(question, idx) {
            if (!question || !Array.isArray(question.config.description)) return;
            if (question.config.description.length <= 1) return;
            question.config.description.splice(idx, 1);
            this.putQuestion(question);
        },
        getPlaceholder(type, lang) {
            return 'Untitled Question';
        },
        isCommonLang(key) {
            if (!key) return true; // Default to common (EN) if empty
            return this.commonLangs.some(l => l.value.toLowerCase() === key.toLowerCase());
        },
        setLangKey(item, key, updateFn) {
            this.$set(item, 'key', key);
            this.$set(item, 'isManualMode', false);
            if (typeof updateFn === 'function') updateFn();
            else this.updateFormMeta();
        },
        checkManualKey(item) {
            if (!item.key) {
                this.$set(item, 'key', 'en');
                this.$set(item, 'isManualMode', false);
            }
        },
        getAvailableNextQuestions(question) {
            if (!question || !this.localQuestions) return [];
            const myId = this.convertIdToStr(question._id);
            return this.localQuestions.filter(q =>
                q && this.convertIdToStr(q._id) !== myId && this.isCounted(q)
            );
        },
        getQuestionTitle(q) {
            if (!q || !Array.isArray(q.title) || q.title.length === 0) return 'Untitled';
            const enTitle = q.title.find(t => t.key && t.key.toLowerCase() === 'en');
            if (enTitle && enTitle.value) {
                return enTitle.value.length > 50 ? enTitle.value.substring(0, 50) + '...' : enTitle.value;
            }
            return q.title[0].value ? (q.title[0].value.length > 50 ? q.title[0].value.substring(0, 50) + '...' : q.title[0].value) : 'Untitled';
        },
        getCombinedNavigationValue(question) {
            if (!question.nextQuestion) return 'submit';
            return 'question:' + this.convertIdToStr(question.nextQuestion);
        },
        setCombinedNavigationValue(question, val) {
            if (!val) return;
            if (val === 'submit') {
                this.$set(question, 'nextQuestion', null);
            } else if (val.startsWith('question:')) {
                this.$set(question, 'nextQuestion', val.split(':')[1]);
            }
            this.putQuestion(question);
        }
    }
}
</script>

<style scoped>
.image-drop-zone {
    position: relative;
    width: 100%;
    cursor: pointer;
    border: 2px dashed #adb5bd;
    border-radius: 8px;
    overflow: hidden;
    background: #f8fafc;
    aspect-ratio: 1 / 1;
    min-height: 220px;
}

.image-placeholder {
    position: absolute;
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #adb5bd;
}

.image-preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.lang-key-btn {
    padding: 0.45rem 0.2rem;
    font-weight: 700;
    text-transform: uppercase;
    background-color: #f1f3f5;
    color: #495057;
    border-radius: 6px;
    font-size: 0.875rem;
}

.lang-key-dropdown .dropdown-toggle::after {
    display: none;
}

.lang-key-input>>>input {
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    background-color: #f1f3f5;
    color: #495057;
    padding: 0.45rem 0;
}

.lang-key-input>>>input::placeholder {
    font-weight: 400;
    color: #adb5bd;
    text-transform: none;
    letter-spacing: 0;
}

.questions-wrapper {
    border: none;
    box-shadow: none;
    background: transparent;
}

.rounded-20 {
    border-radius: 20px;
    overflow: visible;
}

.shadow-sm {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.number-question {
    background: #f8fafc;
    border: 1px solid #e6eef6;
    color: #374151;
    border-radius: 999px;
    padding: 0.45rem 0.55rem;
    margin: 0 0.5rem 0.5rem 0;
    font-weight: 600;
}

.icon-btn {
    width: 38px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 6px;
}

.add-lang-btn {
    background: rgba(250, 251, 255, 0.816);
    color: #0ea5e9;
    border: 1px solid rgba(153, 211, 255, 0.289);
}

.add-option-btn {
    background: rgba(139, 174, 255, 0.244);
    color: #150ee9;
    border: 1px solid rgba(14, 54, 233, 0.2);
    width: 100%;
}

.add-option-btn:hover,
.add-lang-btn:hover,
.next-action-btn:hover {
    transform: translateY(-1px);
}

.next-action-btn {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    font-weight: 600;
}

::v-deep .vue-grid-item {
    overflow: visible;
    z-index: 1;
}

::v-deep .vue-grid-item:hover,
::v-deep .vue-grid-item:focus-within {
    z-index: 100;
}

::v-deep .vue-grid-item.vue-grid-placeholder {
    background: gray;
    border-radius: 20px;
}

::v-deep .dropdown-menu.show {
    z-index: 9999;
}
</style>
