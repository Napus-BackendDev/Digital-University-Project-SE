<template>
    <div>
        <CCard class="mb-3 rounded-20 shadow-sm border">
            <CCardBody class="p-3 p-md-4">
                <div>
                    <!-- ── Form Title  ── -->
                    <div class="mb-4">
                        <span class="d-block field-section-label form-header-section-label mb-2">{{ $t('builder.formTitleLabel') }}</span>
                        <div v-for="(titleItem, tIdx) in (form.title || [])" :key="'ft-' + tIdx"
                            class="d-flex align-items-start mb-2">
                            <span class="lang-key-badge mr-2 mt-1 flex-shrink-0">
                                {{ (titleItem.key || 'EN').toUpperCase() }}
                            </span>
                            <CTextarea
                                class="form-title-input auto-resize-field flex-grow-1 border-bottom mb-0"
                                v-model="titleItem.value"
                                rows="1"
                                @input.native="onAutoResizeInput($event.target, false)"
                                @keydown.native.enter.prevent="updateFormMeta"
                                @change="updateFormMeta"
                            />
                        </div>
                    </div>

                    <!-- ── Form Description ── -->
                    <div v-if="!hasFormDescription" class="add-desc-box mt-4 p-3 rounded-12 d-flex align-items-center justify-content-between" @click="expandFormDesc">
                        <div class="d-flex align-items-center text-muted font-weight-bold">
                            <CIcon name="cil-notes" class="mr-2 text-primary" />
                            <span>{{ $t('builder.addDescriptionPrompt') }}</span>
                        </div>
                        <CButton size="sm" color="primary" variant="ghost" class="font-weight-bold">
                            <CIcon name="cil-plus" class="mr-1" />
                            {{ $t('builder.add') }}
                        </CButton>
                    </div>

                    <div v-else class="mt-4 pt-1">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="field-section-label form-header-section-label">
                                {{ $t('builder.formDescription') }}
                            </span>
                            <CButton size="sm" color="danger" variant="ghost" class="p-0 font-weight-bold d-flex align-items-center text-danger"
                                @click="removeFormDescBox" v-c-tooltip="($te && $te('builder.remove')) ? $t('builder.remove') : 'ลบ'">
                                <CIcon name="cil-trash" size="sm" class="mr-1" />
                                <small>{{ $t('builder.remove') }}</small>
                            </CButton>
                        </div>

                        <div v-for="(descItem, dIdx) in (form.description || [])" :key="'fd-' + dIdx"
                            class="d-flex align-items-start mb-2">
                            <span class="lang-key-badge mr-2 flex-shrink-0">
                                {{ (descItem.key || 'EN').toUpperCase() }}
                            </span>
                            <CTextarea
                                class="form-desc-input auto-resize-field flex-grow-1 border-bottom mb-0"
                                v-model="descItem.value"
                                rows="1"
                                @input.native="onAutoResizeInput($event.target, false)"
                                @change="updateFormMeta"
                            />
                        </div>
                    </div>

                </div>
            </CCardBody>
        </CCard>

        <GridLayout :layout.sync="layout" :key="gridKey" :cols="{ lg: 12, md: 8, sm: 8, xs: 4, xxs: 4 }"
            :row-height="10" :margin="[0, 20]" :is-draggable="!isMobileViewport" :is-resizable="false" :responsive="true" @layout-updated="onDragStop">
            <GridItem v-for="{ question, qIndex } in visibleGridEntries" :key="convertIdToStr(question._id || qIndex)"
                v-bind="getLayoutItem(question, qIndex)"
                drag-allow-from=".question-drag-handle"
                class="question-grid-item">
                <div v-if="!isMobileViewport" class="question-drag-handle" aria-hidden="true">
                    <svg width="24" height="10" viewBox="0 0 24 10" fill="currentColor">
                        <circle cx="5" cy="2.5" r="1.5" />
                        <circle cx="12" cy="2.5" r="1.5" />
                        <circle cx="19" cy="2.5" r="1.5" />
                        <circle cx="5" cy="7.5" r="1.5" />
                        <circle cx="12" cy="7.5" r="1.5" />
                        <circle cx="19" cy="7.5" r="1.5" />
                    </svg>
                </div>

                <!-- Section Card -->
                <CCard v-if="isSectionQuestion(question)" :id="'question-' + (question._id || qIndex)"
                    class="question-item-card section-card position-relative rounded-20 shadow-sm border mb-0 h-100"
                    :class="{ 'is-active-section': isSectionActive(question), 'is-collapsed-section': isSectionCollapsed(question) }"
                    @click.native="setActiveSection(question)">
                    <CCardBody class="p-3 p-md-4">
                        <div class="section-divider-content">
                            <div class="section-divider-bar d-flex align-items-center justify-content-between flex-wrap"
                                :class="{ 'mb-3': !isSectionCollapsed(question) }">
                                <div class="d-flex align-items-center flex-wrap">
                                    <span class="section-tab-pill d-inline-flex align-items-center mr-2">
                                        <CIcon name="cil-view-stream" size="sm" class="mr-1" />
                                        <span>
                                            {{ isSectionCollapsed(question)
                                                ? $t('builder.sectionCollapsedSummary', { section: getSectionNumber(question, qIndex), count: getSectionQuestionCount(qIndex) })
                                                : `${$t('builder.sectionBadge')} ${getSectionNumber(question, qIndex)}` }}
                                        </span>
                                    </span>
                                    <span v-if="!isSectionCollapsed(question)" class="section-count-badge mr-2">
                                        {{ $t('builder.sectionQuestionCount', { count: getSectionQuestionCount(qIndex) }) }}
                                    </span>
                                    <span v-if="isSectionActive(question) && !isSectionCollapsed(question)" class="section-active-badge">
                                        {{ $t('builder.activeSectionTag') }}
                                    </span>
                                </div>
                                <div class="section-tab-actions d-flex align-items-center flex-wrap mt-1 mt-sm-0" @click.stop>
                                    <CButton size="sm" color="light" variant="ghost" class="section-collapse-btn mr-1 d-inline-flex align-items-center"
                                        :aria-label="isSectionCollapsed(question) ? $t('builder.expandSection') : $t('builder.collapseSection')"
                                        @click.stop="toggleSectionCollapse(question)">
                                        <CIcon :name="isSectionCollapsed(question) ? 'cil-chevron-right' : 'cil-chevron-bottom'" size="sm" class="mr-1" />
                                        <span>{{ isSectionCollapsed(question) ? $t('builder.expandSection') : $t('builder.collapseSection') }}</span>
                                    </CButton>
                                    <CButton size="sm" color="light" variant="ghost" class="section-move-btn mr-1"
                                        :disabled="!canMoveSection(qIndex, -1)" :aria-label="$t('builder.moveUp')"
                                        v-c-tooltip="$t('builder.moveUp')"
                                        @click.stop="moveSectionGroup(qIndex, -1)">
                                        &uarr;
                                    </CButton>
                                    <CButton size="sm" color="light" variant="ghost" class="section-move-btn mr-1"
                                        :disabled="!canMoveSection(qIndex, 1)" :aria-label="$t('builder.moveDown')"
                                        v-c-tooltip="$t('builder.moveDown')"
                                        @click.stop="moveSectionGroup(qIndex, 1)">
                                        &darr;
                                    </CButton>
                                    <CButton size="sm" color="danger" variant="ghost"
                                        :aria-label="$t('builder.remove')"
                                        :title="$t('builder.removeSectionDividerTip')"
                                        v-c-tooltip="$t('builder.removeSectionDividerTip')"
                                        @click.stop="removeQuestion(question._id)">
                                        <CIcon name="cil-trash" />
                                    </CButton>
                                </div>
                            </div>

                            <div v-if="isSectionCollapsed(question) && (getSectionSummaryTitle(question) || getSectionSummaryDescription(question))"
                                class="section-collapsed-summary-body mt-3">
                                <div v-if="getSectionSummaryTitle(question)"
                                    class="section-collapsed-title line-clamp-2"
                                    :title="getSectionSummaryTitle(question)">
                                    {{ getSectionSummaryTitle(question) }}
                                </div>
                                <div v-if="getSectionSummaryDescription(question)"
                                    class="section-collapsed-desc line-clamp-2 mt-1"
                                    :title="getSectionSummaryDescription(question)">
                                    {{ getSectionSummaryDescription(question) }}
                                </div>
                            </div>

                            <div v-if="!isSectionCollapsed(question)">
                                <!-- Section Title (styled identically to Question Title) -->
                                <div class="flex-grow-1 mb-3">
                                    <span class="d-block field-section-label mb-2">{{ $t('builder.questionTitleLabel') }}</span>
                                    <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                        class="d-flex align-items-start mb-2">
                                        <span class="lang-key-badge mr-2 flex-shrink-0">
                                            {{ (titleItem.key || 'EN').toUpperCase() }}
                                        </span>
                                        <CTextarea class="flex-grow-1 mb-0 auto-resize-field question-title-input"
                                            v-model="titleItem.value"
                                            rows="1"
                                            :placeholder="$t('builder.sectionTitlePlaceholder')"
                                            @input.native="onAutoResizeInput($event.target, true)"
                                            @keydown.native.enter.prevent="updateQuestionTitle(question)"
                                            @change="updateQuestionTitle(question)" />
                                    </div>
                                </div>

                                <!-- Section Description (identical dashed .add-desc-box UX as regular questions) -->
                                <div class="question-desc-section mt-3">
                                    <div v-if="!hasQuestionDescription(question)"
                                        class="add-desc-box question-add-desc-box p-3 rounded-12 d-flex align-items-center justify-content-between"
                                        @click.stop="expandQuestionDesc(question)">
                                        <div class="d-flex align-items-center text-muted font-weight-bold">
                                            <CIcon name="cil-notes" class="mr-2 text-primary" />
                                            <span>{{ $t('builder.addSectionDescPrompt') }}</span>
                                        </div>
                                        <CButton size="sm" color="primary" variant="ghost" class="font-weight-bold">
                                            <CIcon name="cil-plus" class="mr-1" />
                                            {{ $t('builder.add') }}
                                        </CButton>
                                    </div>
                                    <div v-else>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span class="field-section-label">{{ $t('builder.questionDescLabel') }}</span>
                                            <CButton size="sm" color="danger" variant="ghost"
                                                class="p-0 font-weight-bold d-flex align-items-center text-danger"
                                                @click.stop="removeQuestionDescBox(question)">
                                                <CIcon name="cil-trash" size="sm" class="mr-1" />
                                                <small>{{ $t('builder.remove') }}</small>
                                            </CButton>
                                        </div>
                                        <div v-for="(descItem, dIdx) in (question.config && question.config.description || [])" :key="'sd-' + dIdx"
                                            class="d-flex align-items-start mb-2">
                                            <span class="lang-key-badge mr-2 flex-shrink-0">
                                                {{ (descItem.key || 'EN').toUpperCase() }}
                                            </span>
                                            <CTextarea class="flex-grow-1 mb-0 auto-resize-field question-desc-input"
                                                v-model="descItem.value"
                                                rows="1"
                                                :placeholder="$t('builder.sectionDescPlaceholder')"
                                                @input.native="onAutoResizeInput($event.target, true)"
                                                @change="putQuestion(question)" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CCardBody>
                </CCard>

                <CCard v-else :id="'question-' + (question._id || qIndex)"
                    class="question-item-card position-relative rounded-20 shadow-sm border mb-0 h-100"
                    :class="{ 'section-member-card': hasSections }"
                    @click.native="setActiveSectionByQuestionIndex(qIndex)">
                    <CCardBody class="p-3 p-md-4">
                        <div class="question-card-content">
                            <!-- ── Prompt Zone (Question Badge + Question Title + Question Description) ── -->
                            <div :class="isCounted(question) ? 'question-prompt-zone mb-4' : 'mb-3'">
                                <div v-if="isCounted(question)" class="d-flex align-items-center mb-3">
                                    <span class="question-badge-pill">
                                        {{ $t('builder.questionBadgePrefix') }} {{ displayQuestionNumber(question, qIndex) }}
                                    </span>
                                </div>

                                <div class="flex-grow-1 mb-4">
                                    <span v-if="isCounted(question)" class="d-block field-section-label mb-2">{{ $t('builder.questionTitleLabel') }}</span>
                                    <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                        class="d-flex align-items-start mb-2">
                                        <span class="lang-key-badge mr-2 flex-shrink-0">
                                            {{ (titleItem.key || 'EN').toUpperCase() }}
                                        </span>
                                        <CTextarea class="flex-grow-1 mb-0 auto-resize-field"
                                            :class="isCounted(question) ? 'question-title-input' : 'non-counted-title-input'"
                                            v-model="titleItem.value"
                                            rows="1"
                                            :placeholder="isCounted(question) ? $t('builder.questionTitlePlaceholder') : ''"
                                            @input.native="onAutoResizeInput($event.target, true)"
                                            @keydown.native.enter.prevent="updateQuestionTitle(question)"
                                            @change="updateQuestionTitle(question)" />
                                    </div>
                                </div>

                                <!-- Regular Question Description (Multilingual) -->
                                <div v-if="isCounted(question)" class="question-desc-section mt-3">
                                    <div v-if="!hasRegularQuestionDescription(question)"
                                        class="add-desc-box question-add-desc-box p-3 rounded-12 d-flex align-items-center justify-content-between"
                                        @click="expandRegularQuestionDesc(question)">
                                        <div class="d-flex align-items-center text-muted font-weight-bold">
                                            <CIcon name="cil-notes" class="mr-2 text-primary" />
                                            <span>{{ $t('builder.addRegularQuestionDescPrompt') }}</span>
                                        </div>
                                        <CButton size="sm" color="primary" variant="ghost" class="font-weight-bold">
                                            <CIcon name="cil-plus" class="mr-1" />
                                            {{ $t('builder.add') }}
                                        </CButton>
                                    </div>
                                    <div v-else>
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <span class="field-section-label">{{ $t('builder.questionDescLabel') }}</span>
                                            <CButton size="sm" color="danger" variant="ghost"
                                                class="p-0 font-weight-bold d-flex align-items-center text-danger"
                                                @click="removeRegularQuestionDescBox(question)">
                                                <CIcon name="cil-trash" size="sm" class="mr-1" />
                                                <small>{{ $t('builder.remove') }}</small>
                                            </CButton>
                                        </div>
                                        <div v-for="(descItem, rdIdx) in (question.description || [])" :key="'rqd-' + rdIdx"
                                            class="d-flex align-items-start mb-2">
                                            <span class="lang-key-badge mr-2 flex-shrink-0">
                                                {{ (descItem.key || 'EN').toUpperCase() }}
                                            </span>
                                            <CTextarea class="flex-grow-1 mb-0 auto-resize-field question-desc-input"
                                                v-model="descItem.value"
                                                rows="1"
                                                :placeholder="$t('builder.questionDescPlaceholder')"
                                                @input.native="onAutoResizeInput($event.target, true)"
                                                @change="putQuestion(question)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ── Answer / Choices Zone Header ── -->
                            <div v-if="isCounted(question)" class="question-answer-header d-flex align-items-center mb-3">
                                <span class="answer-zone-label">
                                    {{ (getQuestionType(question.type).toLowerCase() === 'multiple_choice' || getQuestionType(question.type).toLowerCase() === 'checkbox')
                                        ? $t('builder.choicesZoneLabel')
                                        : $t('builder.answerZoneLabel') }}
                                </span>
                                <div class="answer-zone-line flex-grow-1 ml-3"></div>
                            </div>

                        <!-- ── Question Type ── -->
                        <div class="question-answer-zone">
                        <div v-if="isFreeTextType(question.type)">
                            <CTextarea disabled style="opacity: 0.55;" :placeholder="$t('builder.freeTextPlaceholder')"
                                rows="3" />
                        </div>

                        <div v-else-if="
                            getQuestionType(question.type).toLowerCase() === 'multiple_choice' ||
                            getQuestionType(question.type).toLowerCase() === 'checkbox'">
                            <div v-for="(choice, choiceIndex) in (question.config && question.config.choices || [])"
                                :key="choice.key || choiceIndex" class="mb-3">
                                <div class="d-flex align-items-center">
                                    <div v-if="getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                        class="border rounded-circle mr-2 flex-shrink-0 mb-1"
                                        style="width: 30px; height: 30px;" />
                                    <div v-else class="border rounded mr-2 flex-shrink-0 mb-1"
                                        style="width: 30px; height: 30px;" />
                                    <div class="option-langs flex-grow-1">
                                        <div v-for="(lang, li) in (choice.lang || [])" :key="li"
                                            class="d-flex align-items-center mb-1">
                                            <span class="lang-key-badge mr-2 flex-shrink-0">
                                                {{ (lang.key || 'EN').toUpperCase() }}
                                            </span>
                                            <CInput class="flex-grow-1 mb-0 choice-option-input" v-model="lang.value"
                                                :placeholder="$t('builder.optionPlaceholder', { n: choiceIndex + 1 })"
                                                @input="(e) => updateOption(question, choiceIndex, li, e)" />
                                        </div>
                                    </div>

                                    <CButton color="danger" variant="ghost" size="sm" class="ml-1 mb-1"
                                        v-if="question.config && question.config.choices && question.config.choices.length > 1"
                                        :aria-label="$t('builder.remove')"
                                        @click="removeOption(question, choiceIndex)">
                                        <CIcon name="cil-x" />
                                    </CButton>
                                </div>
                                <div v-if="getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                    class="d-flex align-items-center mt-1">
                                    <div style="width: 38px;" class="flex-shrink-0" />
                                    <div class="d-flex align-items-center flex-shrink-0" style="max-width: 75%; min-width: 0;">
                                        <CDropdown color="light" size="sm" class="mw-100 goto-dropdown">
                                            <template #toggler>
                                                <CButton size="sm"
                                                    class="border shadow-none d-flex align-items-center next-action-btn"
                                                    style="max-width: 100%; min-width: 0;"
                                                    v-c-tooltip="$t('builder.goTo')">
                                                    <CIcon
                                                        :name="!choice.nextQuestion ? 'cil-ban' : (choice.nextQuestion === 'submit' ? 'cil-check-alt' : 'cil-list-low-priority')"
                                                        class="mr-1 flex-shrink-0" />
                                                    <span class="text-truncate">
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
                                            <div class="goto-questions-scroll">
                                                <template v-for="grp in getGroupedNextQuestions(question)">
                                                    <div v-if="grp.label" :key="'ch-hdr-' + grp.key" class="goto-section-header">
                                                        {{ grp.label }}
                                                    </div>
                                                    <CDropdownItem v-for="q in grp.questions" :key="q._id"
                                                        :class="{ 'goto-item-indented': Boolean(grp.label) }"
                                                        @click="$set(choice, 'nextQuestion', q._id); putQuestion(question)">
                                                        <CIcon name="cil-list-low-priority" class="mr-2 flex-shrink-0" />
                                                        <span class="text-truncate">{{ isCounted(q) ? getDisplayNumber(q) + '.' : '' }} {{
                                                            getQuestionTitle(q)
                                                        }}</span>
                                                    </CDropdownItem>
                                                </template>
                                            </div>
                                            <CDropdownDivider />
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
                                        style="border-radius: 12px;">
                                        {{ (question.config && question.config.maxRating) || 5 }}
                                    </button>
                                </template>
                                <CDropdownItem v-for="n in 10" :key="n" @click="setRating(question, n)">
                                    {{ n }}
                                </CDropdownItem>
                            </CDropdown>
                            <div v-for="n in ((question.config && question.config.maxRating) || 5)" :key="n"
                                class="d-flex flex-grow-1 flex-column align-items-center">
                                <span class="mb-1 font-weight-semibold text-muted">{{ n }}</span>
                                <CIcon name="cil-star" :height="30" class="text-warning" />
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
                                        <button class="btn btn-sm border file-config-btn">
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
                                        <button class="btn btn-sm border file-config-btn">
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
                            <div v-if="!hasQuestionDescription(question)" class="add-desc-box p-3 rounded-12 d-flex align-items-center justify-content-between" @click="expandQuestionDesc(question)">
                                <div class="d-flex align-items-center text-muted font-weight-bold">
                                    <CIcon name="cil-notes" class="mr-2 text-primary" />
                                    <span>{{ $t('builder.addQuestionDescriptionPrompt') }}</span>
                                </div>
                                <CButton size="sm" color="primary" variant="ghost" class="font-weight-bold">
                                    <CIcon name="cil-plus" class="mr-1" />
                                    {{ $t('builder.add') }}
                                </CButton>
                            </div>

                            <div v-else>
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <small class="text-muted font-weight-bold">
                                        {{ $t('builder.description') }}
                                    </small>
                                    <CButton size="sm" color="danger" variant="ghost" class="p-0 font-weight-bold d-flex align-items-center text-danger"
                                        @click="removeQuestionDescBox(question)" v-c-tooltip="($te && $te('builder.remove')) ? $t('builder.remove') : 'ลบ'">
                                        <CIcon name="cil-trash" size="sm" class="mr-1" />
                                        <small>{{ $t('builder.remove') }}</small>
                                    </CButton>
                                </div>

                                <div v-for="(descItem, dIdx) in (question.config && question.config.description || [])" :key="'qd-' + dIdx"
                                    class="d-flex align-items-start mb-1">
                                    <span class="lang-key-badge mr-2 flex-shrink-0">
                                        {{ (descItem.key || 'EN').toUpperCase() }}
                                    </span>
                                    <CTextarea class="flex-grow-1" v-model="descItem.value" @change="putQuestion(question)"
                                        rows="2" />
                                </div>
                            </div>
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'image'">
                            <div class="image-drop-zone" @click="openImageModal(qIndex)">
                                <div v-if="!question.config || !question.config.image" class="image-placeholder">
                                    <CIcon name="cil-image-1" :height="40" class="mb-2" />
                                    <span>{{ $t('builder.clickToChooseImage') }}</span>
                                </div>
                                <img v-else :src="resolveImageUrl(question.config.image)" class="image-preview" />
                            </div>
                        </div>

                        <div v-else>
                            <span class="text-muted font-italic small">
                                {{ $t('builder.previewNotAvailable') }}
                            </span>
                        </div>
                        </div>

                        <!-- ── Footer: Question Type dropdown + Section selector + Navigation + Required toggle + Delete card ── -->
                        <div class="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap">
                            <!-- Left: Question Type + Section Selector -->
                            <div class="d-flex align-items-center flex-wrap mb-2 mb-md-0" style="gap: 10px 14px;">
                                <div class="d-flex align-items-center">
                                    <span class="text-muted font-weight-bold mr-2">{{ $t('builder.type') }}</span>
                                    <CDropdown color="light" variant="outline">
                                        <template #toggler>
                                            <button class="btn d-flex align-items-center text-muted border bg-white"
                                                style="border-radius: 12px;">
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

                                <!-- Section Switcher (when form is divided into sections) -->
                                <div v-if="hasSections && sectionGroups.length > 0" class="d-flex align-items-center question-footer-section-select" @click.stop>
                                    <span class="text-muted font-weight-bold mr-2">{{ $t('builder.moveToSection') }}</span>
                                    <CDropdown color="light" variant="outline" class="question-section-dropdown">
                                        <template #toggler>
                                            <button class="btn d-flex align-items-center text-muted border bg-white"
                                                style="border-radius: 12px;">
                                                <CIcon name="cil-view-stream" class="mr-2" />
                                                <span class="text-dark font-weight-medium">{{ getCurrentQuestionSectionLabel(qIndex) }}</span>
                                                <CIcon name="cil-chevron-bottom" size="sm" class="ml-2 text-muted" />
                                            </button>
                                        </template>
                                        <CDropdownItem v-for="(grp, gIdx) in sectionGroups" :key="'mv-sec-' + gIdx"
                                            @click="moveQuestionToSection(qIndex, gIdx)">
                                            <div class="d-flex align-items-center justify-content-between" style="min-width: 170px;">
                                                <span class="text-truncate mr-2">{{ getSectionGroupDisplayTitle(grp) }}</span>
                                                <CIcon v-if="getQuestionSectionIdx(qIndex) === gIdx" name="cil-check-alt" size="sm" class="text-success flex-shrink-0" />
                                            </div>
                                        </CDropdownItem>
                                    </CDropdown>
                                </div>

                                <small
                                    v-if="getChoiceTypeHint(question.type)"
                                    class="choice-type-hint d-inline-flex align-items-center"
                                    data-test="choice-type-hint"
                                >
                                    <span class="choice-type-hint-star" aria-hidden="true">*</span>
                                    <span>{{ getChoiceTypeHint(question.type) }}</span>
                                </small>
                            </div>

                            <!-- Right: Navigation Dropdown, Required Toggle & Delete Card -->
                            <div class="d-flex align-items-center flex-wrap ml-auto">
                                <template v-if="getQuestionType(question.type).toLowerCase() !== 'title_description' && getQuestionType(question.type).toLowerCase() !== 'image'">
                                    <!-- Question Navigation Dropdown -->
                                    <div class="d-flex align-items-center mr-sm-3 mb-2 mb-md-0" style="min-width: 0; max-width: 100%;">
                                        <span class="text-muted font-weight-bold mr-2 flex-shrink-0">{{ $t('builder.goTo') }}</span>
                                        <CDropdown color="light" variant="outline" class="mw-100 goto-dropdown">
                                            <template #toggler>
                                                <button class="btn d-flex align-items-center text-muted border bg-white question-goto-btn"
                                                    style="border-radius: 12px; max-width: 100%; min-width: 0;">
                                                    <CIcon
                                                        :name="!question.nextQuestion ? 'cil-check-alt' : 'cil-list-low-priority'"
                                                        class="mr-2 flex-shrink-0" />
                                                    <span class="text-dark text-truncate">
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
                                            <div class="goto-questions-scroll">
                                                <template v-for="grp in getGroupedNextQuestions(question)">
                                                    <div v-if="grp.label" :key="'nav-hdr-' + grp.key" class="goto-section-header">
                                                        {{ grp.label }}
                                                    </div>
                                                    <CDropdownItem v-for="q in grp.questions"
                                                        :key="'nav_' + q._id"
                                                        :class="{ 'goto-item-indented': Boolean(grp.label) }"
                                                        @click="setCombinedNavigationValue(question, 'question:' + convertIdToStr(q._id))">
                                                        <CIcon name="cil-list-low-priority" class="mr-2 flex-shrink-0" />
                                                        <span class="text-truncate">
                                                            {{ isCounted(q) ? getDisplayNumber(q) + '.' : '' }} {{
                                                                getQuestionTitle(q) }}
                                                        </span>
                                                    </CDropdownItem>
                                                </template>
                                            </div>
                                            <CDropdownDivider />
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

                                    <div class="border-left mx-2 mx-sm-3 d-none d-sm-block mb-2 mb-md-0" style="height: 20px;" />
                                </template>

                                <button
                                    type="button"
                                    class="q-action-btn q-action-btn--copy mb-2 mb-md-0 mr-2 flex-shrink-0"
                                    :aria-label="$t('builder.duplicateQuestion')"
                                    :data-tooltip="$t('builder.duplicateQuestion')"
                                    data-test="duplicate-question-btn"
                                    @click="duplicateQuestion(question, qIndex)"
                                >
                                    <CIcon name="cil-copy" size="sm" />
                                </button>

                                <button
                                    type="button"
                                    class="q-action-btn q-action-btn--delete mb-2 mb-md-0 flex-shrink-0"
                                    :aria-label="$t('builder.deleteQuestion')"
                                    :data-tooltip="$t('builder.deleteQuestion')"
                                    data-test="delete-question-btn"
                                    @click="removeQuestion(question._id)"
                                >
                                    <CIcon name="cil-trash" size="sm" />
                                </button>
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

        <!-- Modal Confirm Delete Language -->
        <CModal :show.sync="showDeleteLangModal" :centered="true" size="sm">
            <template #header-wrapper>
                <div class="modal-header border-bottom">
                    <h5 class="modal-title font-weight-bold text-danger">
                        <CIcon name="cil-warning" class="mr-2" />
                        {{ $t('builder.deleteLanguageTitle') }}
                    </h5>
                </div>
            </template>
            <template #default>
                <div class="p-3">
                    <p class="mb-0 text-dark">
                        {{ $t('builder.deleteLanguageConfirm', { lang: (langToDelete || '').toUpperCase() }) }}
                    </p>
                </div>
            </template>
            <template #footer-wrapper>
                <div class="d-flex justify-content-end p-2 border-top">
                    <CButton color="secondary" variant="ghost" @click="showDeleteLangModal = false">
                        {{ $t('builder.modal.cancel') }}
                    </CButton>
                    <CButton color="danger" class="ml-2 px-3 shadow-sm font-weight-bold" @click="confirmRemoveLanguageGlobally">
                        <CIcon name="cil-trash" class="mr-1" />
                        {{ $t('builder.delete') }}
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
import {
    buildQuestionSectionGroups,
    consolidateQuestionTypes,
    extractFormLanguages,
    getQuestionNumberInSection,
    getQuestionSectionIndex,
    isFreeTextQuestionType,
    isNonInputQuestionType,
    isSectionQuestionType,
    mergeVisibleOrderWithHiddenSections,
    normalizeQuestionTypeKey,
    reorderMoveQuestionToSection,
    reorderMoveSectionGroup
} from '@/projects/utils/formPolicy'
import localeMixin from '@/mixins/localeMixin';

export default {
    name: 'TabQuestion',
    mixins: [localeMixin],
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
            modalImageFile: null,
            layout: [],
            storedLayout: null,
            gridKey: 0,
            commonLangs: [
                { value: 'th', label: 'TH' },
                { value: 'en', label: 'EN' },
            ],
            isImageUpdating: false,
            showDeleteLangModal: false,
            langToDelete: '',
            isFormDescExpanded: false,
            isMobileViewport: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
            activeSectionId: null,
            collapsedSectionIds: [],
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
                        built.sort((a, b) => (a.order != null ? a.order : 999) - (b.order != null ? b.order : 999));

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

                if (newForm) {
                    this.$nextTick(() => {
                        this.reconcileFormLanguages();
                        this.syncAutoResizeFields();
                    });
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
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', this.handleViewportResize);
        }
        this.$nextTick(() => {
            this.syncCardHeights();
            this.syncAutoResizeFields();
        });
    },
    beforeDestroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', this.handleViewportResize);
        }
    },
    computed: {
        ...mapGetters('Setting/question_type', { question_type: 'item' }),
        hasMultipleLanguages() {
            return this.getFormLanguages().length > 1;
        },
        hasFormDescription() {
            if (this.isFormDescExpanded) return true;
            if (!this.form || !Array.isArray(this.form.description) || this.form.description.length === 0) return false;
            return this.form.description.some(d => d && d.value && typeof d.value === 'string' && d.value.trim().length > 0);
        },
        questionTypes() {
            if (!this.question_type || !Array.isArray(this.question_type)) return [];
            return JSON.parse(JSON.stringify(this.question_type)).map(type => ({
                _id: type._id,
                type: type.type,
            }));
        },
        typesAll() {
            return consolidateQuestionTypes(this.questionTypes);
        },
        sectionGroups() {
            return buildQuestionSectionGroups(this.localQuestions);
        },
        hasSections() {
            return this.sectionGroups.length > 0;
        },
        visibleGridEntries() {
            const list = this.localQuestions || [];
            const collapsed = new Set((this.collapsedSectionIds || []).map(id => String(id)));
            const entries = [];
            let currentSectionCollapsed = false;
            for (let i = 0; i < list.length; i++) {
                const q = list[i];
                if (!q) continue;
                if (this.isSectionQuestion(q)) {
                    const secKey = this.convertIdToStr(q._id || i);
                    currentSectionCollapsed = collapsed.has(secKey);
                    entries.push({ question: q, qIndex: i });
                } else if (!currentSectionCollapsed) {
                    entries.push({ question: q, qIndex: i });
                }
            }
            return entries;
        },
        visibleLocalQuestions() {
            return this.visibleGridEntries.map(e => e.question);
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
        handleViewportResize() {
            this.isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
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

        buildGridLayoutFromQuestions(useStoredOrder = true) {
            try {
                const newLayout = buildGridLayoutFromQuestions(
                    this.visibleLocalQuestions,
                    useStoredOrder ? this.storedLayout : null,
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
                this.syncCardHeights();
            } catch (e) {
                this.layout = [];
                this.gridKey++;
            }
        },

        syncCardHeights() {
            this.$nextTick(() => {
                this.syncAutoResizeFields();
                if (!this.layout || this.layout.length === 0 || !this.localQuestions) return;
                const ROW_HEIGHT = 10;
                const MARGIN_Y = 20;
                const UNIT = ROW_HEIGHT + MARGIN_Y; // 30px per grid unit

                let currentY = 0;
                for (let i = 0; i < this.layout.length; i++) {
                    const item = this.layout[i];
                    const cardEl = document.getElementById('question-' + item.i);
                    let actualPx = 0;
                    let minGridUnits = 5;
                    if (cardEl) {
                        const dividerWrapper = cardEl.querySelector('.section-divider-content');
                        const contentWrapper = cardEl.querySelector('.question-card-content');
                        if (dividerWrapper) {
                            actualPx = dividerWrapper.offsetHeight + 48 + 2;
                            minGridUnits = cardEl.classList.contains('is-collapsed-section') ? 3 : 4;
                        } else if (contentWrapper) {
                            actualPx = contentWrapper.offsetHeight + 48 + 2; // p-4 (24px*2) + border
                        } else {
                            const body = cardEl.querySelector('.card-body');
                            actualPx = body ? body.scrollHeight : cardEl.offsetHeight;
                        }
                    }

                    const h = actualPx > 50
                        ? Math.max(minGridUnits, Math.ceil((actualPx + MARGIN_Y) / UNIT))
                        : item.h;

                    if (item.h !== h) this.$set(item, 'h', h);
                    if (item.y !== currentY) this.$set(item, 'y', currentY);
                    currentY += h;
                }
            });
        },

        getLayoutItem(question, qIndex) {
            return svcGetLayoutItem(this.layout, question, qIndex);
        },

        async commitReorderedQuestions(reordered) {
            if (!Array.isArray(reordered)) return;
            this.storedLayout = null;
            this.localQuestions = reordered;
            if (this.form && Array.isArray(this.form.questions)) {
                this.form.questions.splice(0, this.form.questions.length, ...reordered);
            }
            this.buildGridLayoutFromQuestions(false);
            this.saveGrid();
            try {
                await this.updateOrdersAndPersist(reordered);
            } catch (e) {
                console.error(e);
            }
        },

        async onDragStop(newLayout) {
            try {
                let reorderedVisible = await svcOnDragStop(newLayout, this.visibleLocalQuestions, this.convertIdToStr);
                if (!Array.isArray(reorderedVisible)) return;

                const reordered = mergeVisibleOrderWithHiddenSections(this.localQuestions, reorderedVisible);
                const oldIds = (this.localQuestions || []).map(q => this.convertIdToStr(q._id || ''));
                const newIds = (reordered || []).map(q => this.convertIdToStr(q._id || ''));
                if (oldIds.join(',') === newIds.join(',')) {
                    this.syncCardHeights();
                    this.saveGrid();
                    return;
                }
                await this.commitReorderedQuestions(reordered);
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

        scrollToTop() {
            if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                } catch (e) {
                    window.scrollTo(0, 0);
                    return;
                }
            }
            if (typeof document !== 'undefined') {
                if (document.documentElement) document.documentElement.scrollTop = 0;
                if (document.body) document.body.scrollTop = 0;
            }
        },

        getFormLanguages() {
            return extractFormLanguages(this.form, this.localQuestions);
        },

        getNextFormLang() {
            const priority = ['en', 'th', 'cn', 'jp'];
            const active = this.getFormLanguages();
            const next = priority.find(k => !active.includes(k));
            return next || '';
        },

        reconcileFormLanguages() {
            if (!this.form) return;
            const activeLangs = this.getFormLanguages();
            if (!activeLangs || activeLangs.length === 0) return;

            let formChanged = false;
            if (!Array.isArray(this.form.title) || this.form.title.length === 0) {
                this.$set(this.form, 'title', activeLangs.map(k => ({ key: k, value: k === 'en' ? 'Untitled Form' : '' })));
                formChanged = true;
            } else {
                activeLangs.forEach(k => {
                    if (!this.form.title.some(t => (t.key || '').toLowerCase() === k)) {
                        this.form.title.push({ key: k, value: '' });
                        formChanged = true;
                    }
                });
            }

            if (!Array.isArray(this.form.description) || this.form.description.length === 0) {
                this.$set(this.form, 'description', activeLangs.map(k => ({ key: k, value: '' })));
                formChanged = true;
            } else {
                activeLangs.forEach(k => {
                    if (!this.form.description.some(d => (d.key || '').toLowerCase() === k)) {
                        this.form.description.push({ key: k, value: '' });
                        formChanged = true;
                    }
                });
            }

            (this.localQuestions || []).forEach(q => {
                let qChanged = false;
                if (!Array.isArray(q.title) || q.title.length === 0) {
                    this.$set(q, 'title', activeLangs.map(k => ({ key: k, value: '' })));
                    qChanged = true;
                } else {
                    activeLangs.forEach(k => {
                        if (!q.title.some(t => (t.key || '').toLowerCase() === k)) {
                            q.title.push({ key: k, value: '' });
                            qChanged = true;
                        }
                    });
                }

                if (Array.isArray(q.description)) {
                    activeLangs.forEach(k => {
                        if (!q.description.some(d => (d.key || '').toLowerCase() === k)) {
                            q.description.push({ key: k, value: '' });
                            qChanged = true;
                        }
                    });
                }

                if (q.config && Array.isArray(q.config.description)) {
                    activeLangs.forEach(k => {
                        if (!q.config.description.some(d => (d.key || '').toLowerCase() === k)) {
                            q.config.description.push({ key: k, value: '' });
                            qChanged = true;
                        }
                    });
                }

                if (q.config && Array.isArray(q.config.choices)) {
                    q.config.choices.forEach(c => {
                        if (!Array.isArray(c.lang) || c.lang.length === 0) {
                            this.$set(c, 'lang', activeLangs.map(k => ({ key: k, value: '' })));
                            qChanged = true;
                        } else {
                            activeLangs.forEach(k => {
                                if (!c.lang.some(l => (l.key || '').toLowerCase() === k)) {
                                    c.lang.push({ key: k, value: '' });
                                    qChanged = true;
                                }
                            });
                        }
                    });
                }

                if (qChanged && q._id && !String(q._id).startsWith('tmp-')) {
                    this.putQuestion(q);
                }
            });

            if (formChanged) {
                this.updateFormMeta();
            }
            this.$nextTick(() => this.syncCardHeights());
        },

        async addLanguageGlobally(specifiedKey = null) {
            const active = this.getFormLanguages();
            const newKey = (specifiedKey || this.getNextFormLang() || 'other').toLowerCase();
            if (active.includes(newKey)) return;

            if (!this.form) return;
            if (!Array.isArray(this.form.title)) {
                this.$set(this.form, 'title', [{ key: 'en', value: 'Untitled Form' }]);
            }
            if (!this.form.title.some(t => (t.key || '').toLowerCase() === newKey)) {
                this.form.title.push({ key: newKey, value: '' });
            }

            if (!Array.isArray(this.form.description)) {
                this.$set(this.form, 'description', [{ key: 'en', value: '' }]);
            }
            if (!this.form.description.some(d => (d.key || '').toLowerCase() === newKey)) {
                this.form.description.push({ key: newKey, value: '' });
            }

            const promises = [];
            (this.localQuestions || []).forEach(q => {
                let changed = false;
                if (!Array.isArray(q.title)) {
                    this.$set(q, 'title', [{ key: 'en', value: '' }]);
                    changed = true;
                }
                if (!q.title.some(t => (t.key || '').toLowerCase() === newKey)) {
                    q.title.push({ key: newKey, value: '' });
                    changed = true;
                }

                if (Array.isArray(q.description)) {
                    if (!q.description.some(d => (d.key || '').toLowerCase() === newKey)) {
                        q.description.push({ key: newKey, value: '' });
                        changed = true;
                    }
                }

                if (q.config && Array.isArray(q.config.description)) {
                    if (!q.config.description.some(d => (d.key || '').toLowerCase() === newKey)) {
                        q.config.description.push({ key: newKey, value: '' });
                        changed = true;
                    }
                }

                if (q.config && Array.isArray(q.config.choices)) {
                    q.config.choices.forEach(c => {
                        if (!Array.isArray(c.lang)) {
                            this.$set(c, 'lang', [{ key: 'en', value: '' }]);
                            changed = true;
                        }
                        if (!c.lang.some(l => (l.key || '').toLowerCase() === newKey)) {
                            c.lang.push({ key: newKey, value: '' });
                            changed = true;
                        }
                    });
                }

                if (changed && q._id && !String(q._id).startsWith('tmp-')) {
                    promises.push(this.putQuestion(q));
                }
            });

            this.updateFormMeta();
            this.$nextTick(() => {
                this.syncAutoResizeFields();
                this.syncCardHeights();
                this.scrollToTop();
            });
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        },

        requestRemoveLanguageGlobally(langKey) {
            const active = this.getFormLanguages();
            if (active.length <= 1) return;
            this.langToDelete = (langKey || '').toLowerCase();
            this.showDeleteLangModal = true;
        },

        async confirmRemoveLanguageGlobally() {
            const targetKey = this.langToDelete;
            this.showDeleteLangModal = false;
            this.langToDelete = '';
            if (!targetKey) return;

            if (this.form && Array.isArray(this.form.title)) {
                const filteredTitle = this.form.title.filter(t => (t.key || '').toLowerCase() !== targetKey);
                this.$set(this.form, 'title', filteredTitle.length > 0 ? filteredTitle : [{ key: 'en', value: 'Untitled Form' }]);
            }

            if (this.form && Array.isArray(this.form.description)) {
                this.$set(this.form, 'description', this.form.description.filter(d => (d.key || '').toLowerCase() !== targetKey));
            }

            const promises = [];
            (this.localQuestions || []).forEach(q => {
                let changed = false;
                if (Array.isArray(q.title)) {
                    const filtered = q.title.filter(t => (t.key || '').toLowerCase() !== targetKey);
                    if (filtered.length !== q.title.length) {
                        this.$set(q, 'title', filtered.length > 0 ? filtered : [{ key: 'en', value: '' }]);
                        changed = true;
                    }
                }

                if (Array.isArray(q.description)) {
                    const filtered = q.description.filter(d => (d.key || '').toLowerCase() !== targetKey);
                    if (filtered.length !== q.description.length) {
                        this.$set(q, 'description', filtered);
                        changed = true;
                    }
                }

                if (q.config && Array.isArray(q.config.description)) {
                    const filtered = q.config.description.filter(d => (d.key || '').toLowerCase() !== targetKey);
                    if (filtered.length !== q.config.description.length) {
                        this.$set(q.config, 'description', filtered);
                        changed = true;
                    }
                }

                if (q.config && Array.isArray(q.config.choices)) {
                    q.config.choices.forEach(c => {
                        if (Array.isArray(c.lang)) {
                            const filtered = c.lang.filter(l => (l.key || '').toLowerCase() !== targetKey);
                            if (filtered.length !== c.lang.length) {
                                this.$set(c, 'lang', filtered.length > 0 ? filtered : [{ key: 'en', value: '' }]);
                                changed = true;
                            }
                        }
                    });
                }

                if (changed && q._id && !String(q._id).startsWith('tmp-')) {
                    promises.push(this.putQuestion(q));
                }
            });

            this.updateFormMeta();
            this.$nextTick(() => {
                this.syncAutoResizeFields();
                this.syncCardHeights();
                this.scrollToTop();
            });
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        },

        async changeLanguageKeyGlobally(oldKey, newKey) {
            if (!oldKey || !newKey || oldKey.toLowerCase() === newKey.toLowerCase()) return;
            const oldK = oldKey.toLowerCase();
            const newK = newKey.toLowerCase();

            if (this.form && Array.isArray(this.form.title)) {
                this.form.title.forEach(t => {
                    if ((t.key || '').toLowerCase() === oldK) {
                        this.$set(t, 'key', newK);
                        this.$set(t, 'isManualMode', false);
                    }
                });
            }

            if (this.form && Array.isArray(this.form.description)) {
                this.form.description.forEach(d => {
                    if ((d.key || '').toLowerCase() === oldK) {
                        this.$set(d, 'key', newK);
                        this.$set(d, 'isManualMode', false);
                    }
                });
            }

            const promises = [];
            (this.localQuestions || []).forEach(q => {
                let changed = false;
                if (Array.isArray(q.title)) {
                    q.title.forEach(t => {
                        if ((t.key || '').toLowerCase() === oldK) {
                            this.$set(t, 'key', newK);
                            this.$set(t, 'isManualMode', false);
                            changed = true;
                        }
                    });
                }

                if (Array.isArray(q.description)) {
                    q.description.forEach(d => {
                        if ((d.key || '').toLowerCase() === oldK) {
                            this.$set(d, 'key', newK);
                            this.$set(d, 'isManualMode', false);
                            changed = true;
                        }
                    });
                }

                if (q.config && Array.isArray(q.config.description)) {
                    q.config.description.forEach(d => {
                        if ((d.key || '').toLowerCase() === oldK) {
                            this.$set(d, 'key', newK);
                            this.$set(d, 'isManualMode', false);
                            changed = true;
                        }
                    });
                }

                if (q.config && Array.isArray(q.config.choices)) {
                    q.config.choices.forEach(c => {
                        if (Array.isArray(c.lang)) {
                            c.lang.forEach(l => {
                                if ((l.key || '').toLowerCase() === oldK) {
                                    this.$set(l, 'key', newK);
                                    this.$set(l, 'isManualMode', false);
                                    changed = true;
                                }
                            });
                        }
                    });
                }

                if (changed && q._id && !String(q._id).startsWith('tmp-')) {
                    promises.push(this.putQuestion(q));
                }
            });

            this.updateFormMeta();
            if (promises.length > 0) {
                await Promise.all(promises);
            }
        },

        addFormTitle() {
            this.addLanguageGlobally();
        },

        removeFormTitle(idx) {
            const item = this.form && this.form.title && this.form.title[idx];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
        },

        hasQuestionDescription(question) {
            if (question && question.isDescExpanded) return true;
            if (!question || !question.config || !Array.isArray(question.config.description) || question.config.description.length === 0) return false;
            return question.config.description.some(d => d && d.value && typeof d.value === 'string' && d.value.trim().length > 0);
        },

        hasRegularQuestionDescription(question) {
            if (question && question.isRegularDescExpanded) return true;
            if (!question || !Array.isArray(question.description) || question.description.length === 0) return false;
            return question.description.some(d => d && d.value && typeof d.value === 'string' && d.value.trim().length > 0);
        },

        expandRegularQuestionDesc(question) {
            this.$set(question, 'isRegularDescExpanded', true);
            const activeLangs = this.getFormLanguages();
            if (!Array.isArray(question.description) || question.description.length === 0) {
                this.$set(question, 'description', activeLangs.map(k => ({ key: k, value: '' })));
            } else {
                activeLangs.forEach(k => {
                    if (!question.description.some(d => (d.key || '').toLowerCase() === k)) {
                        question.description.push({ key: k, value: '' });
                    }
                });
            }
            this.$nextTick(() => {
                this.syncAutoResizeFields();
                this.syncCardHeights();
                const card = document.getElementById('question-' + question._id);
                const el = card && card.querySelector('.question-desc-input textarea');
                if (el) el.focus();
            });
        },

        removeRegularQuestionDescBox(question) {
            this.$set(question, 'isRegularDescExpanded', false);
            if (question && Array.isArray(question.description)) {
                question.description.forEach(d => {
                    d.value = '';
                });
            }
            this.putQuestion(question);
            this.syncCardHeights();
        },

        removeRegularQuestionDescLang(question, idx) {
            const item = question && question.description && question.description[idx];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
        },

        autoResizeEl(el) {
            if (!el || !el.style) return false;
            const prevHeight = el.style.height;
            el.style.height = 'auto';
            const nextHeight = el.scrollHeight ? `${el.scrollHeight}px` : 'auto';
            el.style.height = nextHeight;
            return prevHeight !== nextHeight;
        },

        onAutoResizeInput(el, shouldSyncCards = true) {
            const changed = this.autoResizeEl(el);
            if (shouldSyncCards && changed) {
                this.syncCardHeights();
            }
        },

        syncAutoResizeFields() {
            if (!this.$el || typeof this.$el.querySelectorAll !== 'function') return;
            const fields = this.$el.querySelectorAll('.auto-resize-field textarea');
            fields.forEach(el => this.autoResizeEl(el));
        },

        expandFormDesc() {
            this.isFormDescExpanded = true;
            if (!this.form) return;
            const activeLangs = this.getFormLanguages();
            if (!Array.isArray(this.form.description) || this.form.description.length === 0) {
                this.$set(this.form, 'description', activeLangs.map(k => ({ key: k, value: '' })));
            } else {
                activeLangs.forEach(k => {
                    if (!this.form.description.some(d => (d.key || '').toLowerCase() === k)) {
                        this.form.description.push({ key: k, value: '' });
                    }
                });
            }
            this.$nextTick(() => {
                this.syncAutoResizeFields();
                const el = this.$el.querySelector('.form-desc-input textarea');
                if (el) el.focus();
            });
        },

        removeFormDescBox() {
            this.isFormDescExpanded = false;
            if (this.form && Array.isArray(this.form.description)) {
                this.form.description.forEach(d => {
                    d.value = '';
                });
            }
            this.updateFormMeta();
        },

        expandQuestionDesc(question) {
            this.$set(question, 'isDescExpanded', true);
            if (!question.config) this.$set(question, 'config', {});
            const activeLangs = this.getFormLanguages();
            if (!Array.isArray(question.config.description) || question.config.description.length === 0) {
                this.$set(question.config, 'description', activeLangs.map(k => ({ key: k, value: '' })));
            } else {
                activeLangs.forEach(k => {
                    if (!question.config.description.some(d => (d.key || '').toLowerCase() === k)) {
                        question.config.description.push({ key: k, value: '' });
                    }
                });
            }
            this.syncCardHeights();
        },

        removeQuestionDescBox(question) {
            this.$set(question, 'isDescExpanded', false);
            if (question && question.config && Array.isArray(question.config.description)) {
                question.config.description.forEach(d => {
                    d.value = '';
                });
            }
            this.putQuestion(question);
            this.syncCardHeights();
        },

        addFormDesc() {
            this.addLanguageGlobally();
        },

        removeFormDesc(idx) {
            const item = this.form && this.form.description && this.form.description[idx];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
        },

        async putQuestion(question, imageFile = null) {
            this.buildGridLayoutFromQuestions();
            if (!question || !question._id) return;
            try {
                const payload = JSON.parse(JSON.stringify(question));
                if (payload.type && typeof payload.type === 'object') {
                    payload.type = payload.type._id;
                }

                let response;
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('payload', JSON.stringify(payload));
                    formData.append('image', imageFile);
                    response = await this.$store.dispatch('Questions/update', formData);
                } else {
                    response = await this.$store.dispatch('Questions/update', payload);
                }

                const updated = response && response.data && response.data.data;
                if (updated && updated.config && updated.config.image) {
                    if (!question.config) this.$set(question, 'config', {});
                    this.$set(question.config, 'image', updated.config.image);
                }
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
                    description: payload.description,
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

        async ensureQuestionType(typeId) {
            const lookup = () => this.questionTypes.find(type => type._id === typeId || type.type === typeId)
                || (isFreeTextQuestionType(typeId) ? this.typesAll.find(t => t.type === 'free_text') : null);
            let foundType = lookup();
            if (!foundType && this.$store && typeof this.$store.dispatch === 'function') {
                try {
                    await this.$store.dispatch('Setting/question_type/get');
                    foundType = lookup();
                } catch (e) {
                    // ignore fetch error
                }
            }
            return foundType || null;
        },

        async insertQuestionAt(typeId, insertIndex = null, sourceQuestion = null) {
            let foundType = null;
            if (sourceQuestion && sourceQuestion.type && typeof sourceQuestion.type === 'object' && sourceQuestion.type._id) {
                foundType = { _id: sourceQuestion.type._id, type: sourceQuestion.type.type };
            }
            if (!foundType) {
                const lookupKey = (typeId && typeof typeId === 'object') ? (typeId._id || typeId.type) : typeId;
                foundType = await this.ensureQuestionType(lookupKey);
            }
            if (!foundType && sourceQuestion) {
                const rawType = this.getQuestionType(sourceQuestion.type);
                const fallbackId = (sourceQuestion.type && typeof sourceQuestion.type === 'object')
                    ? sourceQuestion.type._id
                    : sourceQuestion.type;
                if (fallbackId || rawType) {
                    foundType = { _id: fallbackId || rawType, type: rawType || String(fallbackId) };
                }
            }
            if (!foundType) return null;

            const isMultipleChoice = foundType.type === 'multiple_choice' || foundType.type === 'checkbox';
            const isCheckboxes = foundType.type === 'checkbox';
            const isRating = foundType.type === 'rating';
            const isFileUpload = foundType.type === 'file_upload';
            const isImage = foundType.type === 'image';
            const isTitleDescription = foundType.type === 'title_description';
            const isSection = foundType.type === 'section';

            const activeLangs = this.getFormLanguages();
            let config;
            if (sourceQuestion && sourceQuestion.config && typeof sourceQuestion.config === 'object') {
                config = JSON.parse(JSON.stringify(sourceQuestion.config));
                delete config._id;
                if (Array.isArray(config.choices)) {
                    config.choices = config.choices.map((c, cIdx) => {
                        const clonedChoice = { ...(c || {}) };
                        delete clonedChoice._id;
                        delete clonedChoice.nextQuestion;
                        if (clonedChoice.key === undefined || clonedChoice.key === null) {
                            clonedChoice.key = String(cIdx);
                        }
                        if (Array.isArray(clonedChoice.lang)) {
                            clonedChoice.lang = clonedChoice.lang.map(l => ({
                                key: l && l.key ? l.key : 'en',
                                value: l && l.value !== undefined ? l.value : ''
                            }));
                        }
                        return clonedChoice;
                    });
                }
                if (Array.isArray(config.description)) {
                    config.description = config.description.map(d => ({
                        key: d && d.key ? d.key : 'en',
                        value: d && d.value !== undefined ? d.value : ''
                    }));
                }
            } else {
                config = {
                    choices: (isMultipleChoice || isCheckboxes)
                        ? [{ key: '0', lang: activeLangs.map(k => ({ key: k, value: k === 'en' ? 'Option 1' : '' })) }]
                        : [],
                    allowMultipleSelect: isCheckboxes,
                    maxRating: isRating ? 5 : null,
                    maxText: null,
                    maxFiles: isFileUpload ? 5 : null,
                    maxFileSize: isFileUpload ? 1 : null,
                    fileTypes: isFileUpload ? ['image', 'pdf', 'doc'] : [],
                    image: null,
                    description: isTitleDescription
                        ? activeLangs.map(k => ({ key: k, value: k === 'en' ? 'Description' : '' }))
                        : (isSection ? activeLangs.map(k => ({ key: k, value: '' })) : []),
                };
            }

            const currentLen = (this.localQuestions || []).length;
            const targetIdx = typeof insertIndex === 'number'
                ? Math.max(0, Math.min(insertIndex, currentLen))
                : currentLen;

            const defaultTitleEn = isSection ? '' : 'Untitled Question';
            const clonedTitle = (sourceQuestion && Array.isArray(sourceQuestion.title))
                ? JSON.parse(JSON.stringify(sourceQuestion.title)).map(t => ({
                    key: t && t.key ? t.key : 'en',
                    value: t && t.value !== undefined ? t.value : ''
                }))
                : activeLangs.map(k => ({ key: k, value: k === 'en' ? defaultTitleEn : '' }));

            const clonedDescription = (sourceQuestion && Array.isArray(sourceQuestion.description))
                ? JSON.parse(JSON.stringify(sourceQuestion.description)).map(d => ({
                    key: d && d.key ? d.key : 'en',
                    value: d && d.value !== undefined ? d.value : ''
                }))
                : (!isSection && !isTitleDescription && !isImage
                    ? activeLangs.map(k => ({ key: k, value: '' }))
                    : []);

            const payload = {
                form: this.form && this.form._id ? this.form._id : undefined,
                title: clonedTitle,
                description: clonedDescription,
                order: targetIdx + 1,
                type: foundType._id,
                isRequired: sourceQuestion ? Boolean(sourceQuestion.isRequired) : false,
                nextQuestion: null,
                config,
            };

            let created = null;
            if (!this.form || !this.form._id) {
                created = {
                    _id: 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    ...payload,
                    type: foundType,
                };
            } else {
                try {
                    const res = await this.$store.dispatch('Questions/create', payload);
                    created = res && res.data && res.data.data;
                    if (!created || !created._id) {
                        console.error('addQuestion: backend did not return a created document with _id', res);
                        return null;
                    }
                    if (!created.type || typeof created.type === 'string') {
                        created.type = foundType;
                    }
                } catch (e) {
                    console.error('addQuestion failed:', e);
                    return null;
                }
            }

            if (targetIdx > 0) {
                const prevQ = this.localQuestions[targetIdx - 1];
                if (prevQ && this.isCounted(prevQ) && !isSection && !prevQ.nextQuestion) {
                    this.$set(prevQ, 'nextQuestion', created._id);
                    if (this.form && this.form._id && prevQ._id && !String(prevQ._id).startsWith('tmp-')) {
                        this.putQuestion(prevQ);
                    }
                }
            }

            const nextList = [...(this.localQuestions || [])];
            nextList.splice(targetIdx, 0, created);

            this.storedLayout = null;
            this.localQuestions = nextList;
            if (this.form && Array.isArray(this.form.questions)) {
                this.form.questions.splice(0, this.form.questions.length, ...nextList);
            }
            this.buildGridLayoutFromQuestions(false);
            this.saveGrid();

            if (targetIdx < currentLen) {
                await this.updateOrdersAndPersist(nextList);
            }
            if (isSection) {
                this.setActiveSection(created);
            }
            return created;
        },

        async ensureLeadingSection() {
            const list = this.localQuestions || [];
            if (list.length === 0 || this.isSectionQuestion(list[0])) return false;
            const created = await this.insertQuestionAt('section', 0);
            return Boolean(created);
        },

        getActiveSectionTargetEndIndex() {
            const groups = this.sectionGroups;
            if (!groups || groups.length === 0) return null;
            if (this.activeSectionId) {
                const matched = groups.find(g => g.headerQuestion && this.convertIdToStr(g.headerQuestion._id) === this.convertIdToStr(this.activeSectionId));
                if (matched) return matched.endIndex + 1;
            }
            return groups[groups.length - 1].endIndex + 1;
        },

        async addQuestion(typeId) {
            const foundType = await this.ensureQuestionType(typeId);
            if (!foundType) return null;

            if (foundType.type === 'section') {
                if (!this.hasSections && (this.localQuestions || []).length > 0) {
                    await this.ensureLeadingSection();
                }
                const createdSection = await this.insertQuestionAt(foundType._id, (this.localQuestions || []).length);
                return createdSection;
            }

            if (this.hasSections) {
                const targetIdx = this.getActiveSectionTargetEndIndex();
                if (typeof targetIdx === 'number') {
                    return await this.insertQuestionAt(foundType._id, targetIdx);
                }
            }

            return await this.insertQuestionAt(foundType._id, (this.localQuestions || []).length);
        },

        async moveQuestionToSection(qIndex, targetSectionIdx) {
            const { questions: nextList, newIndex } = reorderMoveQuestionToSection(
                this.localQuestions,
                qIndex,
                targetSectionIdx
            );
            if (newIndex === qIndex) return;
            await this.commitReorderedQuestions(nextList);
            const movedItem = nextList[newIndex];
            this.setActiveSectionByQuestionIndex(newIndex);
            if (movedItem && movedItem._id) {
                this.scrollToQuestion(movedItem._id);
            }
        },

        async moveSectionGroup(qIndex, delta) {
            const { questions: nextList, newHeaderIndex } = reorderMoveSectionGroup(
                this.localQuestions,
                qIndex,
                delta
            );
            if (newHeaderIndex === qIndex && nextList.length === this.localQuestions.length) return;
            await this.commitReorderedQuestions(nextList);
            const movedHeader = nextList[newHeaderIndex];
            if (movedHeader && movedHeader._id) {
                this.setActiveSection(movedHeader);
                this.scrollToQuestion(movedHeader._id);
            }
        },

        setActiveSection(sectionQuestion) {
            if (!sectionQuestion || !sectionQuestion._id) return;
            this.activeSectionId = this.convertIdToStr(sectionQuestion._id);
        },

        setActiveSectionByQuestionIndex(qIndex) {
            if (!this.hasSections) return;
            const secIdx = getQuestionSectionIndex(this.localQuestions, qIndex);
            const grp = secIdx >= 0 ? this.sectionGroups[secIdx] : null;
            if (grp && grp.headerQuestion) {
                this.setActiveSection(grp.headerQuestion);
            }
        },

        isSectionActive(sectionQuestion) {
            if (!sectionQuestion || !this.hasSections) return false;
            if (!this.activeSectionId) {
                const lastGroup = this.sectionGroups[this.sectionGroups.length - 1];
                return Boolean(lastGroup && lastGroup.headerQuestion === sectionQuestion);
            }
            return this.convertIdToStr(sectionQuestion._id) === this.convertIdToStr(this.activeSectionId);
        },

        isSectionCollapsed(sectionQuestion) {
            if (!sectionQuestion) return false;
            const key = this.convertIdToStr(sectionQuestion._id);
            if (!key) return false;
            return (this.collapsedSectionIds || []).some(id => String(id) === String(key));
        },

        toggleSectionCollapse(sectionQuestion) {
            if (!sectionQuestion) return;
            const key = this.convertIdToStr(sectionQuestion._id);
            if (!key) return;
            const next = [...(this.collapsedSectionIds || [])];
            const idx = next.findIndex(id => String(id) === String(key));
            if (idx === -1) {
                next.push(key);
            } else {
                next.splice(idx, 1);
            }
            this.collapsedSectionIds = next;
            this.storedLayout = null;
            this.buildGridLayoutFromQuestions(false);
        },

        getSectionSummaryTitle(sectionQuestion) {
            if (!sectionQuestion || !Array.isArray(sectionQuestion.title)) return '';
            const raw = this.getLang(sectionQuestion.title);
            const clean = raw ? String(raw).trim() : '';
            if (!clean || clean === 'Untitled' || clean === 'Untitled Question' || clean === 'Untitled Section') return '';
            return clean;
        },

        getSectionSummaryDescription(sectionQuestion) {
            const descArr = sectionQuestion && sectionQuestion.config && sectionQuestion.config.description;
            if (!Array.isArray(descArr) || descArr.length === 0) return '';
            const raw = this.getLang(descArr);
            return raw ? String(raw).trim() : '';
        },

        getSectionQuestionCount(sectionIndex) {
            const grp = this.sectionGroups.find(g => g.headerIndex === sectionIndex || g.startIndex === sectionIndex);
            return grp ? grp.questionCount : 0;
        },

        canMoveSection(qIndex, delta) {
            const grpIdx = this.sectionGroups.findIndex(g => g.headerIndex === qIndex || g.startIndex === qIndex);
            if (grpIdx === -1) return false;
            return delta < 0 ? grpIdx > 0 : grpIdx < this.sectionGroups.length - 1;
        },

        getQuestionSectionIdx(qIndex) {
            return getQuestionSectionIndex(this.localQuestions, qIndex);
        },

        getCurrentQuestionSectionLabel(qIndex) {
            const idx = this.getQuestionSectionIdx(qIndex);
            const grp = idx >= 0 ? this.sectionGroups[idx] : null;
            const num = grp ? grp.sectionNumber : 1;
            return `${this.$t('builder.sectionBadge')} ${num}`;
        },

        getSectionGroupDisplayTitle(grp) {
            if (!grp) return '';
            const base = `${this.$t('builder.sectionBadge')} ${grp.sectionNumber}`;
            const clean = grp.headerQuestion ? this.getSectionSummaryTitle(grp.headerQuestion) : '';
            const shortClean = clean && clean.length > 40 ? `${clean.slice(0, 40)}...` : clean;
            return shortClean ? `${base} · ${shortClean}` : base;
        },

        async duplicateQuestion(question, qIndex = null) {
            if (!question || this.isSectionQuestion(question)) return null;
            const currentIdx = (typeof qIndex === 'number' && qIndex >= 0 && this.localQuestions[qIndex] === question)
                ? qIndex
                : (this.localQuestions || []).findIndex(q => q === question || (q && question._id && this.convertIdToStr(q._id) === this.convertIdToStr(question._id)));
            const insertIdx = currentIdx !== -1 ? currentIdx + 1 : (this.localQuestions || []).length;
            const typeRef = (question.type && typeof question.type === 'object')
                ? (question.type._id || question.type.type)
                : (question.type || this.getQuestionType(question.type));
            const created = await this.insertQuestionAt(typeRef, insertIdx, question);
            if (created && created._id) {
                this.scrollToQuestion(created._id);
            }
            return created;
        },

        async removeQuestion(qId) {
            if (!qId) return;
            const index = this.localQuestions.findIndex(q => this.convertIdToStr(q._id) === this.convertIdToStr(qId));
            if (index === -1) return;

            const q = this.localQuestions[index];
            if (this.convertIdToStr(this.activeSectionId) === this.convertIdToStr(qId)) {
                this.activeSectionId = null;
            }
            this.storedLayout = null;
            this.localQuestions.splice(index, 1);
            this.buildGridLayoutFromQuestions(false);
            this.saveGrid();

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
                if (typeof question.config.maxFiles !== 'number') this.$set(question.config, 'maxFiles', 5);
                if (typeof question.config.maxFileSize !== 'number') this.$set(question.config, 'maxFileSize', 1);
                if (!Array.isArray(question.config.fileTypes) || question.config.fileTypes.length === 0) {
                    this.$set(question.config, 'fileTypes', ['image', 'pdf', 'doc']);
                }
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
        isFreeTextType(typeObjOrId) {
            return isFreeTextQuestionType(this.getQuestionType(typeObjOrId));
        },
        formatTypeLabel(rawType) {
            if (!rawType) return '';
            const key = normalizeQuestionTypeKey(rawType);
            if (this.$te(`types.${key}`)) {
                return this.$t(`types.${key}`);
            }
            return rawType.split('_').join(' ');
        },
        getChoiceTypeHint(typeObjOrId) {
            const key = normalizeQuestionTypeKey(this.getQuestionType(typeObjOrId));
            if (key === 'multiple_choice' || key === 'checkbox') {
                const hintKey = `types.hints.${key}`;
                if (this.$te && this.$te(hintKey)) {
                    return this.$t(hintKey);
                }
            }
            return '';
        },
        getIconForType(typeObjOrId) {
            const typeStr = normalizeQuestionTypeKey(this.getQuestionType(typeObjOrId));
            switch (typeStr) {
                case 'free_text': return 'cil-align-left';
                case 'multiple_choice': return 'cil-circle';
                case 'checkbox': return 'cil-square';
                case 'rating': return 'cil-star';
                case 'file_upload': return 'cil-cloud-upload';
                case 'title_description': return 'cil-text';
                case 'section': return 'cil-view-stream';
                case 'image': return 'cil-image-1';
                default: return 'cil-notes';
            }
        },
        addTitle(question) {
            this.addLanguageGlobally();
        },
        removeTitle(question, tIndex) {
            const item = question && question.title && question.title[tIndex];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
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
                const msg = (this.$te && this.$te('builder.imageSizeLimit'))
                    ? this.$t('builder.imageSizeLimit')
                    : 'Image file size must not exceed 5 MB.';
                if (this.$toast) this.$toast.error(msg);
                else alert(msg);
                return;
            }
            this.modalImageFile = file;

            const reader = new FileReader();
            reader.onload = (ev) => {
                this.modalFiles = ev.target.result;
            };
            reader.readAsDataURL(file);
        },
        openImageModal(qIndex) {
            this.modalImageIndex = qIndex;
            this.modalImageFile = null;
            const imagePath = (this.localQuestions[qIndex] && this.localQuestions[qIndex].config && this.localQuestions[qIndex].config.image) || '';
            this.modalFiles = this.resolveImageUrl(imagePath);
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
                        if (this.modalImageFile) {
                            await this.putQuestion(q, this.modalImageFile);
                        }
                    }
                } else {
                    const created = await this.addQuestion('image');
                    if (created) {
                        if (!created.config) this.$set(created, 'config', {});
                        this.$set(created.config, 'image', this.modalFiles);
                        if (this.modalImageFile) {
                            await this.putQuestion(created, this.modalImageFile);
                        }
                    }
                }
                this.showImageModal = false;
                this.modalImageFile = null;
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
            const activeLangs = this.getFormLanguages();
            const optionLangs = activeLangs.map(k => ({ key: k, value: '' }));
            if (!Array.isArray(question.config.choices)) {
                this.$set(question.config, 'choices', [{ key: "0", lang: optionLangs }]);
            } else {
                question.config.choices.push({ key: String(question.config.choices.length), lang: optionLangs });
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
            this.addLanguageGlobally();
        },
        removeOptionLanguage(question, choiceIndex, langIndex) {
            const choice = question && question.config && question.config.choices && question.config.choices[choiceIndex];
            const item = choice && choice.lang && choice.lang[langIndex];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
        },
        removeOption(question, oIndex) {
            if (!question || !Array.isArray(question.config.choices)) return;
            if (question.config.choices.length <= 1) return;
            question.config.choices.splice(oIndex, 1);
            this.putQuestion(question);
        },
        isSectionQuestion(question) {
            return isSectionQuestionType(question && question.type);
        },
        getSectionNumber(question, index) {
            let count = 0;
            const limit = typeof index === 'number' ? index : (this.localQuestions || []).length - 1;
            for (let i = 0; i <= limit && i < (this.localQuestions || []).length; i++) {
                if (this.isSectionQuestion(this.localQuestions[i])) count++;
            }
            return count || 1;
        },
        async moveQuestionStep(index, delta) {
            const list = this.localQuestions || [];
            const targetIndex = index + delta;
            if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return;
            const reordered = [...list];
            const [moved] = reordered.splice(index, 1);
            reordered.splice(targetIndex, 0, moved);
            await this.commitReorderedQuestions(reordered);
        },
        isCounted(question) {
            if (!question) return false;
            return !isNonInputQuestionType(this.getQuestionType(question.type));
        },
        getDisplayNumber(question) {
            if (!question) return 0;
            return getQuestionNumberInSection(this.localQuestions, question);
        },
        displayQuestionNumber(question, index) {
            return getQuestionNumberInSection(this.localQuestions, index);
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
            this.addLanguageGlobally();
        },
        removeConfigDesc(question, idx) {
            const item = question && question.config && question.config.description && question.config.description[idx];
            if (item && item.key) this.requestRemoveLanguageGlobally(item.key);
        },
        getPlaceholder(type, lang) {
            return 'Untitled Question';
        },
        isCommonLang(key) {
            if (!key) return true; // Default to common (EN) if empty
            return this.commonLangs.some(l => l.value.toLowerCase() === key.toLowerCase());
        },
        setLangKey(item, key, updateFn) {
            if (!item) return;
            const oldKey = item.key;
            if (oldKey && key && oldKey.toLowerCase() !== key.toLowerCase()) {
                this.changeLanguageKeyGlobally(oldKey, key);
            } else {
                this.$set(item, 'key', key);
                this.$set(item, 'isManualMode', false);
                if (typeof updateFn === 'function') updateFn();
                else this.updateFormMeta();
            }
        },
        checkManualKey(item) {
            if (!item || !item.key) {
                this.$set(item, 'key', 'en');
                this.$set(item, 'isManualMode', false);
            } else {
                this.$set(item, 'key', item.key.toLowerCase().trim());
            }
            this.reconcileFormLanguages();
        },
        // Returns the next unused language key given an array of existing lang items
        getNextLang(existingItems) {
            const priority = ['en', 'th'];
            const usedKeys = (existingItems || []).map(i => (i.key || '').toLowerCase());
            const next = priority.find(k => !usedKeys.includes(k));
            return next || '';
        },
        getAvailableNextQuestions(question) {
            if (!question || !this.localQuestions) return [];
            const myId = this.convertIdToStr(question._id);
            return this.localQuestions.filter(q =>
                q && this.convertIdToStr(q._id) !== myId && this.isCounted(q)
            );
        },
        getGroupedNextQuestions(question) {
            const available = this.getAvailableNextQuestions(question);
            if (!available.length) return [];
            if (!this.hasSections || !this.sectionGroups.length) {
                return [{ key: 'all', label: '', questions: available }];
            }
            const availableIds = new Set(available.map(q => this.convertIdToStr(q._id)));
            const groups = [];
            this.sectionGroups.forEach((grp, gIdx) => {
                const list = (this.localQuestions || [])
                    .slice(grp.startIndex, grp.endIndex + 1)
                    .filter(q => q && availableIds.has(this.convertIdToStr(q._id)));
                if (!list.length) return;
                const cleanTitle = grp.headerQuestion ? this.getSectionSummaryTitle(grp.headerQuestion) : '';
                const shortTitle = cleanTitle && cleanTitle.length > 36 ? `${cleanTitle.slice(0, 36)}...` : cleanTitle;
                const fallbackLabel = `${this.$t('builder.sectionBadge')} ${grp.sectionNumber}`;
                groups.push({
                    key: `sec-${gIdx}-${grp.sectionNumber}`,
                    label: `${grp.sectionNumber}. ${shortTitle || fallbackLabel}`,
                    questions: list
                });
            });
            return groups;
        },
        getQuestionTitle(q) {
            if (!q || !Array.isArray(q.title) || q.title.length === 0) return 'Untitled';
            const resolved = this.getLang(q.title);
            if (resolved) {
                return resolved.length > 50 ? resolved.substring(0, 50) + '...' : resolved;
            }
            return 'Untitled';
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
    border-radius: 12px;
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
    color: #64748b;
}

.image-preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.lang-key-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    min-width: 3rem;
    height: 34px;
    padding: 0 0.45rem;
    font-weight: 700;
    font-size: 0.8125rem;
    text-transform: uppercase;
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}

.lang-key-btn {
    padding: 0.45rem 0.2rem;
    font-weight: 700;
    text-transform: uppercase;
    background-color: #f1f3f5;
    color: #495057;
    border-radius: 12px;
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
    color: #64748b;
    text-transform: none;
    letter-spacing: 0;
}

.question-drag-handle {
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 18px;
    border-radius: 999px;
    color: #64748b;
    opacity: 0;
    cursor: grab;
    touch-action: none;
    pointer-events: auto;
    transition: opacity 0.16s ease, color 0.16s ease, background-color 0.16s ease;
}

.question-drag-handle svg {
    pointer-events: none;
}

::v-deep .question-grid-item:hover .question-drag-handle,
::v-deep .vue-grid-item.vue-draggable-dragging .question-drag-handle {
    opacity: 1;
}

.question-drag-handle:hover {
    color: #475569;
    background-color: rgba(148, 163, 184, 0.16);
}

.question-drag-handle:active {
    cursor: grabbing;
}

.question-prompt-zone {
    background: transparent;
    border: none;
    padding: 0;
}

.field-section-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.01em;
}

.form-header-section-label {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
}

.form-title-input >>> textarea {
    font-size: 1.45rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.35;
}

.form-desc-input >>> textarea {
    font-size: 1.05rem;
    color: #334155;
    line-height: 1.5;
}

.question-badge-pill {
    display: inline-flex;
    align-items: center;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.28rem 0.85rem;
}

.auto-resize-field >>> textarea {
    resize: none !important;
    overflow: hidden !important;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.question-title-input >>> textarea,
.non-counted-title-input >>> textarea {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 1.02rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.45;
    padding: 0.5rem 0.75rem;
    min-height: 40px;
}

.question-title-input >>> textarea:focus,
.non-counted-title-input >>> textarea:focus {
    border-color: #94a3b8;
    box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.16);
}

.question-desc-section {
    border-top: none;
}

.question-desc-input >>> textarea {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.5;
    padding: 0.45rem 0.75rem;
    min-height: 36px;
}

.question-add-desc-btn {
    font-size: 0.84rem;
    font-weight: 500;
    color: #64748b;
    text-decoration: none;
}

.question-add-desc-btn:hover {
    color: #334155;
    text-decoration: none;
}

.answer-zone-label {
    font-size: 0.84rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #475569;
    flex-shrink: 0;
}

.answer-zone-line {
    height: 1px;
    background: #e2e8f0;
}

.question-answer-zone {
    padding: 0.25rem 0 0 0.25rem;
}

.choice-option-input >>> input {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.92rem;
    font-weight: 400;
    color: #334155;
}

.section-card {
    background: #ffffff;
    border-top: 3px solid #64748b !important;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.section-card.is-active-section {
    border-top-color: #334155 !important;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06) !important;
}

.section-card.is-collapsed-section {
    background: #f8fafc;
}

.section-tab-pill {
    background: #475569;
    color: #ffffff;
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 0.28rem 0.75rem;
    border-radius: 999px;
    letter-spacing: 0.01em;
}

.section-count-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #64748b;
}

.section-collapsed-summary-body {
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
}

.section-collapsed-title {
    font-size: 1.08rem;
    font-weight: 700;
    line-height: 1.4;
    color: #1e293b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.section-collapsed-desc {
    font-size: 0.9rem;
    line-height: 1.45;
    color: #64748b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.section-active-badge {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #334155;
    background: #e2e8f0;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
}

.section-collapse-btn {
    border: 1px solid #e2e8f0 !important;
    background: #ffffff !important;
    color: #475569 !important;
    font-weight: 600;
    font-size: 0.8125rem;
    border-radius: 8px !important;
    padding: 0.22rem 0.6rem;
}

.section-collapse-btn:hover {
    background: #f1f5f9 !important;
    color: #0f172a !important;
}

.section-member-card {
    border-left: 3px solid #cbd5e1 !important;
}

.section-move-btn {
    min-width: 28px;
    height: 28px;
    padding: 0;
    font-weight: 700;
    color: #475569;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    border-radius: 8px;
}

.section-title-input >>> textarea {
    background-color: #ffffff;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.45;
    min-height: 38px;
}

.section-add-desc-btn {
    font-size: 0.85rem;
    text-decoration: none;
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

.add-desc-box {
    border: 1.5px dashed #cbd5e1;
    background-color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
}

.add-desc-box:hover {
    border-color: #3b82f6;
    background-color: #f0f7ff;
    transform: translateY(-1px);
}

.icon-btn {
    width: 38px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 12px;
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

.add-desc-box .btn,
.add-option-btn {
    font-size: 0.8125rem;
}

.file-config-btn {
    font-size: 0.8125rem;
}

.next-action-btn {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
    font-weight: 600;
    font-size: 0.8125rem;
}

.q-action-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.q-action-btn:focus-visible {
    outline: 2px solid #8c1515;
    outline-offset: 2px;
}

.q-action-btn--copy {
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #334155;
}

.q-action-btn--copy:hover,
.q-action-btn--copy:focus-visible {
    background-color: #e2e8f0;
    border-color: #64748b;
    color: #0f172a;
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.1);
}

.q-action-btn--delete {
    background-color: #fff5f5;
    border: 1px solid #fecaca;
    color: #dc2626;
}

.q-action-btn--delete:hover,
.q-action-btn--delete:focus-visible {
    background-color: #fee2e2;
    border-color: #dc2626;
    color: #b91c1c;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.16);
}

.q-action-btn[data-tooltip]::before,
.q-action-btn[data-tooltip]::after {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease, transform 0.15s ease;
    z-index: 300;
}

.q-action-btn[data-tooltip]::after {
    content: attr(data-tooltip);
    bottom: calc(100% + 9px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    background-color: #0f172a;
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.2;
    padding: 6px 10px;
    border-radius: 6px;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}

.q-action-btn[data-tooltip]::before {
    content: '';
    bottom: calc(100% + 3px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    border: 5px solid transparent;
    border-top-color: #0f172a;
}

.q-action-btn--delete[data-tooltip]::after {
    left: auto;
    right: 0;
    transform: translateY(4px);
}

.q-action-btn[data-tooltip]:hover::before,
.q-action-btn[data-tooltip]:focus-visible::before {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.q-action-btn[data-tooltip]:hover::after,
.q-action-btn[data-tooltip]:focus-visible::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.q-action-btn--delete[data-tooltip]:hover::after,
.q-action-btn--delete[data-tooltip]:focus-visible::after {
    transform: translateY(0);
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

::v-deep .goto-dropdown .dropdown-menu {
    min-width: 260px;
    max-width: 340px;
    padding: 6px 0;
}

.goto-questions-scroll {
    max-height: 205px;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.goto-section-header {
    padding: 6px 14px 4px;
    font-size: 0.78rem;
    font-weight: 700;
    color: #8c1515;
    background-color: #fef2f2;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #fee2e2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.goto-questions-scroll > .goto-section-header:first-child {
    border-top: none;
}

::v-deep .goto-item-indented .dropdown-item {
    padding-left: 24px;
}

::v-deep .goto-dropdown .dropdown-item {
    display: flex;
    align-items: center;
    max-width: 100%;
    font-size: 0.875rem;
}

.choice-type-hint {
    color: #dc2626;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.3;
    gap: 4px;
}

.choice-type-hint-star {
    color: #dc2626;
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1;
}

@media (max-width: 767.98px) {
    .question-card-content,
    .question-goto-btn,
    .next-action-btn {
        min-width: 0;
        max-width: 100%;
    }

    ::v-deep .dropdown-menu {
        max-width: calc(100vw - 32px);
    }

    ::v-deep .dropdown-item span {
        white-space: normal;
        word-break: break-word;
    }
}
</style>
