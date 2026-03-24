<template>
    <div>
        <CCard class="mb-4 rounded-20 shadow-sm border">
            <CCardBody>
                <div>
                    <!-- ── Form Title  ── -->
                    <div class="mb-3">
                        <div v-for="(titleItem, tIdx) in (form.title || [])" :key="'ft-' + tIdx"
                            class="d-flex align-items-center mb-1">
                            <CInput class="lang-key-input flex-shrink-0  mb-0 mr-2" v-model="titleItem.key"
                                @change="updateFormMeta" maxlength="3" style="width: 3.2rem;" />
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
                            <CInput class="lang-key-input flex-shrink-0 mb-0 mr-2" v-model="descItem.key"
                                @change="updateFormMeta" maxlength="3" style="width: 3.2rem;" />
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
                :is-draggable="!getParentForFollowUp(question)" v-bind="getLayoutItem(question, qIndex)">
                <CCard :id="'question-' + (question._id || qIndex)"
                    class="mb-3 position-relative rounded-20 shadow-sm border"
                    :class="{ 'followup-card': getParentForFollowUp(question) }"
                    :style="getParentForFollowUp(question) ? { backgroundColor: '#FFF3CD', border: '1px solid #F7C948' } : {}">
                    <CCardBody class="p-4">
                        <!-- Question Title -->
                        <div v-if="getParentForFollowUp(question)" class="mb-2 d-flex align-items-center">
                            <div class="followup-header">{{ $t('builder.followUpHeader') }}</div>
                            <small class="text-muted ml-3 followup-from">
                                {{ $t('builder.followUpFrom') }} {{ getParentForFollowUp(question).meta.parentChoiceLabel }}
                            </small>
                        </div>
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div :class="['number-question', { 'followup-number': getParentForFollowUp(question) }]">
                                {{ displayQuestionNumber(question, qIndex) }}</div>

                            <div class="flex-grow-1">
                                <div v-for="(titleItem, titleIndex) in (question.title || [])" :key="titleIndex"
                                    class="d-flex align-items-center mb-1">
                                    <CInput class="lang-key-input flex-shrink-0 mb-0 mr-1" v-model="titleItem.key"
                                        @change="updateQuestionTitle(question)" maxlength="3" style="width: 3.2rem;" />
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
                            <CInput disabled style="opacity: 0.55;" :placeholder="$t('builder.shortAnswerPlaceholder')" />
                        </div>

                        <div v-else-if="getQuestionType(question.type).toLowerCase() === 'paragraph'">
                            <CTextarea disabled style="opacity: 0.55;" :placeholder="$t('builder.paragraphPlaceholder')" rows="3" />
                        </div>

                        <div v-else-if="
                            getQuestionType(question.type).toLowerCase() === 'multiple_choice' ||
                            getQuestionType(question.type).toLowerCase() === 'checkbox'">
                            <div v-for="(choice, choiceIndex) in question.config.choices"
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
                                            <CInput class="lang-key-input flex-shrink-0 mr-2 mb-0" v-model="lang.key"
                                                @change="putQuestion(question)" maxlength="3" style="width: 3.2rem;" />
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
                                        v-if="question.config.choices.length > 1 && (!choice.lang || choice.lang.length <= 1)"
                                        @click="removeOption(question, choiceIndex)">
                                        <CIcon name="cil-minus" />
                                    </CButton>
                                </div>

                                <div class="d-flex align-items-start mt-1">
                                    <div v-if="!findFollowUp(question, choiceIndex) && getQuestionType(question.type).toLowerCase() === 'multiple_choice'"
                                        class="mb-2 mr-1">
                                        <CButton size="sm" variant="ghost" color="warning"
                                            class="icon-btn followup-add-btn"
                                            @click="addFollowUp(question, choiceIndex)"
                                            v-c-tooltip="$t('builder.addFollowUp')" aria-label="Add follow-up question">
                                            <CIcon name="cil-speech" />
                                        </CButton>
                                    </div>

                                    <div v-else-if="findFollowUp(question, choiceIndex)" class="mb-2 mr-1">
                                        <CButton size="sm" variant="ghost" color="info" class="icon-btn followup-go-btn"
                                            @click="goToFollowUp(question, choiceIndex)"
                                            v-c-tooltip="$t('builder.goToFollowUp')"
                                            aria-label="Go to follow-up question">
                                            <CIcon name="cil-arrow-right" />
                                        </CButton>
                                    </div>

                                    <CButton variant="ghost" color="primary" class="icon-btn add-lang-btn"
                                        style="width: 3.2rem;" @click="addOptionLanguage(question, choiceIndex)"
                                        size="sm" v-c-tooltip="'Add language'" aria-label="Add language">
                                        <CIcon name="cil-globe-alt" />
                                    </CButton>
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
                                        {{ question.config.maxRating || 5 }}
                                    </button>
                                </template>
                                <CDropdownItem v-for="n in 10" :key="n" @click="setRating(question, n)">
                                    {{ n }}
                                </CDropdownItem>
                            </CDropdown>
                            <div v-for="n in (question.config.maxRating || 5)" :key="n"
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
                                            :checked="Array.isArray(question.config.fileTypes) && question.config.fileTypes.includes(ft.key)"
                                            @change="toggleFileType(question, ft.key)" />
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <span class="mr-3 small text-muted">{{ $t('builder.maxFiles') }}</span>
                                <CDropdown color="secondary" variant="outline">
                                    <template #toggler>
                                        <button class="btn btn-sm border">
                                            {{ question.config.maxFiles || 1 }}
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
                                            {{ question.config.maxFileSize ? question.config.maxFileSize + 'MB'
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
                            <small class="text-muted font-weight-bold d-block mb-1">{{ $t('builder.description') }}</small>

                            <div v-for="(descItem, dIdx) in (question.config.description || [])" :key="'qd-' + dIdx"
                                class="d-flex align-items-start">
                                <CInput class="lang-key-input flex-shrink-0 mr-2" v-model="descItem.key"
                                    @change="putQuestion(question)" maxlength="3" style="width: 3.2rem;" />
                                <CTextarea class="flex-grow-1" v-model="descItem.value" @change="putQuestion(question)"
                                    rows="2" />
                                <CButton color="danger" variant="ghost" size="sm" class="ml-2 flex-shrink-0"
                                    v-if="question.config.description && question.config.description.length > 1"
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

                        <!-- ── Footer: Question Type dropdown + Required toggle ── -->
                        <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <div v-if="!getParentForFollowUp(question)" class="d-flex align-items-center">
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

                            <div v-if="getQuestionType(question.type).toLowerCase() !== 'title_description' && getQuestionType(question.type).toLowerCase() !== 'image'"
                                class="d-flex align-items-center">
                                <small class="text-muted font-weight-bold text-uppercase mr-2">{{ $t('builder.requiredLabel') }}</small>
                                <CSwitch class="mx-1" color="dark" shape="pill" :checked="question.isRequired"
                                    @update:checked="val => { question.isRequired = val; putQuestion(question); }" />
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
                    <CButton color="danger" variant="ghost" @click="showImageModal = false">
                        {{ $t('builder.modal.cancel') }}
                    </CButton>
                    <CButton color="primary" class="ml-2" @click="confirmImageQuestion()">
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
                { value: 5, label: '5MB' },
                { value: 10, label: '10MB' }
            ],
            showImageModal: false,
            modalImageIndex: null,
            modalFiles: '',
            layout: [],
            storedLayout: null,
            gridKey: 0,
        };
    },
    watch: {
        form: {
            immediate: true,
            deep: true,
            handler(newForm) {
                if (newForm && Array.isArray(newForm.questions)) {
                    try {
                        const built = [];
                        const pushedIds = new Set();

                        const findQuestionById = id => {
                            if (!id) return null;
                            const idStr = this.convertIdToStr(id);
                            return (newForm.questions || []).find(q => this.convertIdToStr(q && q._id) === idStr) || null;
                        };

                        const pushWithFollow = q => {
                            if (!q) return;
                            const idStr = this.convertIdToStr(q._id || q);
                            if (idStr && pushedIds.has(idStr)) return;
                            if (idStr) pushedIds.add(idStr);
                            built.push(q);

                            if (Array.isArray(q.followUp) && q.followUp.length) {
                                for (const f of q.followUp) {
                                    try {
                                        if (f && typeof f === 'object') {
                                            if (f._id) {
                                                pushWithFollow(f);
                                            } else if (f.question !== undefined && f.question !== null) {
                                                if (Array.isArray(f.question) && f.question.length) {
                                                    const found = findQuestionById(f.question[0]);
                                                    if (found) pushWithFollow(found);
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

                        for (const q of newForm.questions) {
                            const qId = this.convertIdToStr(q && q._id);
                            if (qId && pushedIds.has(qId)) continue;
                            pushWithFollow(q);
                        }
                        built.sort((a, b) => {
                            const orderA = typeof a.order === 'number' ? a.order : 9999;
                            const orderB = typeof b.order === 'number' ? b.order : 9999;
                            return orderA - orderB;
                        });

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
                    (q) => !!this.getParentForFollowUp(q)
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

                const grouped = [];
                const added = new Set();
                const addWithChildren = (q) => {
                    if (!q) return;
                    const qId = this.convertIdToStr(q._id);
                    if (added.has(qId)) return;
                    grouped.push(q);
                    added.add(qId);

                    if (Array.isArray(q.followUp)) {
                        for (const childRef of q.followUp) {
                            if (!childRef) continue;
                            const childId = this.getFollowUpChildId(childRef);
                            if (childId) {
                                const childQ = reordered.find(x => this.convertIdToStr(x._id) === childId)
                                    || this.localQuestions.find(x => this.convertIdToStr(x._id) === childId);
                                if (childQ) addWithChildren(childQ);
                            }
                        }
                    }
                };

                for (const q of reordered) {
                    if (!this.getParentForFollowUp(q)) addWithChildren(q);
                }
                for (const q of reordered) {
                    const qId = this.convertIdToStr(q._id);
                    if (!added.has(qId)) addWithChildren(q);
                }
                reordered = grouped;

                const oldIds = (this.localQuestions || []).map(q => this.convertIdToStr(q._id || ''));
                const newIds = (reordered || []).map(q => this.convertIdToStr(q._id || ''));
                if (oldIds.join(',') === newIds.join(',')) {
                    return;
                }
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
            console.log(newQuestions)
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

        getFollowUpChildId(entry) {
            if (!entry && entry !== 0) return null;
            if (typeof entry === 'object') {
                // If schema uses a single ObjectId on `question`
                if (entry.question !== undefined && entry.question !== null) {
                    if (Array.isArray(entry.question) && entry.question.length > 0) return this.convertIdToStr(entry.question[0]);
                    return this.convertIdToStr(entry.question);
                }
                // If entry is actually an embedded question object
                if (entry._id) return this.convertIdToStr(entry._id);
                return null;
            }
            return this.convertIdToStr(entry);
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
                config,
            };

            if (!this.form || !this.form._id) {
                const tmp = {
                    _id: 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    ...payload,
                };
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
            if (!qId) {
                console.warn('removeQuestion: qId is undefined or null');
                return;
            }
            const index = this.localQuestions.findIndex(
                q => (q._id === qId || (q._id && q._id.toString() === qId.toString()))
            );
            if (index === -1) {
                console.warn('removeQuestion: question not found in localQuestions for qId', qId);
                return;
            }

            const rootQ = this.localQuestions[index];
            const toDelete = [];
            const stack = [rootQ];
            while (stack.length) {
                const cur = stack.pop();
                if (!cur) continue;
                if (!toDelete.includes(cur)) toDelete.push(cur);
                if (Array.isArray(cur.followUp)) {
                    for (const fid of cur.followUp) {
                        if (!fid) continue;
                        const fidStr = this.getFollowUpChildId(fid);
                        if (!fidStr) continue;
                        const childIdx = this.localQuestions.findIndex(q => q && q._id && this.convertIdToStr(q._id) === fidStr);
                        if (childIdx !== -1) {
                            const child = this.localQuestions[childIdx];
                            if (child && !toDelete.includes(child)) stack.push(child);
                        }
                    }
                }
            }

            const indices = toDelete.map(item => this.localQuestions.findIndex(q => q === item || (q._id && item._id && String(q._id) === String(item._id)))).filter(i => i !== -1).sort((a, b) => b - a);
            const remainingQuestions = [...this.localQuestions];
            for (const i of indices) remainingQuestions.splice(i, 1);
            this.localQuestions = remainingQuestions; // ทริกเกอร์ Watcher ตี UI ใหม่ทันที
            this.buildGridLayoutFromQuestions();

            if (this.form && Array.isArray(this.form.questions)) {
                for (const item of toDelete) {
                    const idStr = this.convertIdToStr(item._id || item);
                    if (idStr) {
                        const formIdx = this.form.questions.findIndex(q => this.convertIdToStr(q && q._id) === idStr);
                        if (formIdx !== -1) {
                            this.form.questions.splice(formIdx, 1);
                        }
                    }
                }
            }

            const deletedIdSet = new Set(toDelete.map(d => this.convertIdToStr(d._id || d)));
            const parentsToPersist = [];
            for (const parent of this.localQuestions) {
                if (!parent || !Array.isArray(parent.followUp)) continue;
                let changed = false;
                for (let i = 0; i < parent.followUp.length; i++) {
                    const fid = parent.followUp[i];
                    if (!fid) continue;
                    const childIdStr = this.getFollowUpChildId(fid);
                    if (childIdStr && deletedIdSet.has(childIdStr)) {
                        parent.followUp[i] = null;
                        changed = true;
                    }
                }
                if (changed && parent._id) parentsToPersist.push(parent);
            }
            try {
                for (const item of toDelete) {
                    if (item && item._id && !String(item._id).startsWith('tmp-')) {
                        await this.$store.dispatch('Questions/delete', { _id: item._id });
                    }
                }
            } catch (e) {
                console.error('removeQuestion delete endpoint failed:', e);
            }
            for (const p of parentsToPersist) {
                try {
                    await this.$store.dispatch('Questions/update', { _id: p._id, followUp: p.followUp });
                } catch (err) {
                    console.error('Failed to persist parent.followUp cleanup', err);
                }
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
            if (!this.modalFiles) return;
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
        async addFollowUp(question, choiceIndex) {
            if (!question || !question.config || !Array.isArray(question.config.choices)) return;
            const choice = question.config.choices[choiceIndex];
            if (!choice) return;

            const mcType = this.questionTypes.find(t => t.type === 'multiple_choice');
            const typeId = mcType ? mcType._id : (typeof question.type === 'object' ? question.type._id : question.type);

            const parentIndex = this.localQuestions.findIndex(q => q === question || (q._id && question._id && q._id.toString() === question._id.toString()));
            const newQ = {
                _id: this.form && this.form._id ? undefined : ('tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
                form: this.form && this.form._id ? this.form._id : undefined,
                title: [{ key: this.$i18n.locale, value: this.$t('builder.followUpHeader') }],
                type: typeId,
                isRequired: false,
                config: {
                    choices: [{ key: '0', lang: [{ key: this.$i18n.locale, value: this.$t('builder.addOption') }] }]
                }
            };

            const insertAt = (function () {
                if (parentIndex === -1) return this.localQuestions.length;
                let lastIdx = parentIndex;
                for (let i = parentIndex + 1; i < this.localQuestions.length; i++) {
                    const q2 = this.localQuestions[i];
                    if (!q2) break;

                    // If q2 is a descendant of the parent (any depth), advance past it
                    try {
                        const ancestors = this.getAncestorChain(q2) || [];
                        const isDescendant = ancestors.some(a => this.convertIdToStr(a._id || a) === (question._id && question._id.toString ? question._id.toString() : question._id));
                        if (isDescendant) {
                            lastIdx = i;
                            continue;
                        }
                    } catch (e) {
                        // ignore and fallthrough
                    }

                    if (Array.isArray(question.followUp)) {
                        const q2IdStr = this.convertIdToStr(q2._id || q2);
                        if (q2IdStr && question.followUp.some(entry => this.getFollowUpChildId(entry) === q2IdStr)) {
                            lastIdx = i;
                            continue;
                        }
                    }

                    break;
                }
                return lastIdx + 1;
            }).call(this);
            this.localQuestions.splice(insertAt, 0, newQ);
            this.buildGridLayoutFromQuestions();
            if (!this.form || !this.form._id) {
                const parentLocal = this.localQuestions[parentIndex];
                if (parentLocal) {
                    if (!Array.isArray(parentLocal.followUp)) parentLocal.followUp = [];
                    while (parentLocal.followUp.length <= choiceIndex) parentLocal.followUp.push(null);
                    parentLocal.followUp[choiceIndex] = { key: (choice && choice.key) ? choice.key : String(choiceIndex), question: newQ._id };
                }
            }

            if (this.form && this.form._id) {
                try {
                    const payload = JSON.parse(JSON.stringify(newQ));
                    if (payload.type && typeof payload.type === 'object') payload.type = payload.type._id;
                    const res = await this.$store.dispatch('Questions/create', payload);
                    const created = res && res.data && res.data.data;
                    if (created && created._id) {
                        // replace the inserted temp/newQ at insertAt with created
                        this.$set(this.localQuestions, insertAt, created);
                        if (this.form && Array.isArray(this.form.questions)) {
                            this.form.questions.push(created);
                        }
                        this.buildGridLayoutFromQuestions();

                        // update parent locally and persist: push created._id into parent.followUp
                        const parentLocal = this.localQuestions[parentIndex];
                        if (parentLocal) {
                            if (!Array.isArray(parentLocal.followUp)) parentLocal.followUp = [];
                            while (parentLocal.followUp.length <= choiceIndex) parentLocal.followUp.push(null);
                            const followEntry = { key: (choice && choice.key) ? choice.key : String(choiceIndex), question: created._id };
                            parentLocal.followUp[choiceIndex] = followEntry;

                            try {
                                await this.$store.dispatch('Questions/update', {
                                    _id: parentLocal._id,
                                    followUp: parentLocal.followUp
                                });
                            } catch (err) {
                                console.error('Failed to persist parent.followUp', err);
                            }
                        }
                    }
                } catch (e) {
                    console.error('create follow-up failed', e);
                }
            }

            await this.updateOrdersAndPersist();
        },
        async removeFollowUp(question, choiceIndex) {
            if (!question || !Array.isArray(question.followUp)) return;
            let childId = null;
            let fIndex = -1;
            let fq = null;
            const parentIdStr = question._id && question._id.toString ? question._id.toString() : question._id;
            if (Array.isArray(question.followUp)) {
                const fid = question.followUp[choiceIndex];
                if (fid) {
                    const fidStr = this.getFollowUpChildId(fid);
                    if (fidStr) {
                        fIndex = this.localQuestions.findIndex(q => q && q._id && this.convertIdToStr(q._id) === fidStr);
                        if (fIndex !== -1) {
                            fq = this.localQuestions[fIndex];
                            childId = fq && fq._id;
                        }
                    }
                }
            }
            if (!childId) return;
            try {
                if (fq && fq._id) {
                    await this.$store.dispatch('Questions/delete', { _id: fq._id });
                }
            } catch (e) {
                console.error('delete follow-up failed', e);
            }
            if (fIndex !== -1) {
                this.localQuestions.splice(fIndex, 1);
                this.buildGridLayoutFromQuestions();
            }

            try {
                const parentLocal = question;
                if (Array.isArray(parentLocal.followUp)) {
                    const entry = parentLocal.followUp[choiceIndex];
                    const entryChildId = this.getFollowUpChildId(entry);
                    if (entry && entryChildId && this.convertIdToStr(entryChildId) === this.convertIdToStr(childId)) {
                        parentLocal.followUp[choiceIndex] = null;
                    } else {
                        parentLocal.followUp = parentLocal.followUp.filter(id => {
                            const idChild = this.getFollowUpChildId(id);
                            return !(idChild && this.convertIdToStr(idChild) === this.convertIdToStr(childId));
                        });
                    }
                }
                if (parentLocal && parentLocal._id) {
                    await this.$store.dispatch('Questions/update', {
                        _id: parentLocal._id,
                        followUp: parentLocal.followUp
                    });
                }
            } catch (err) {
                console.error('Failed to persist parent followUp removal', err);
            }

            await this.updateOrdersAndPersist();
        },

        findFollowUp(question, choiceIndex) {
            if (!question) return null;
            if (!Array.isArray(question.followUp)) return null;
            const fid = question.followUp[choiceIndex];
            if (fid) {
                const fidStr = this.getFollowUpChildId(fid);
                if (fidStr) {
                    const child = this.localQuestions.find(q => q && q._id && this.convertIdToStr(q._id) === fidStr);
                    if (child) return child;
                }
            }
            return null;
        },
        goToFollowUp(question, choiceIndex) {
            const fq = this.findFollowUp(question, choiceIndex);
            if (!fq) return;
            const idx = this.localQuestions.findIndex(q => q === fq);
            const idToScroll = fq._id || idx;
            this.scrollToQuestion(idToScroll);
        },
        getParentForFollowUp(child) {
            if (!child) return null;
            const childIdStr = this.convertIdToStr(child._id || child);
            if (!childIdStr) return null;
            for (const parent of this.localQuestions) {
                if (!parent || !Array.isArray(parent.followUp) || parent.followUp.length === 0) continue;
                for (let i = 0; i < parent.followUp.length; i++) {
                    const fidStr = this.getFollowUpChildId(parent.followUp[i]);
                    if (fidStr && fidStr === childIdStr) {
                        let parentChoiceLabel = '';
                        try {
                            if (parent.config && Array.isArray(parent.config.choices)) {
                                const choice = parent.config.choices[i] || parent.config.choices[0];
                                if (choice && Array.isArray(choice.lang) && choice.lang[0]) parentChoiceLabel = choice.lang[0].value || '';
                            }
                        } catch (e) {
                            // ignore
                        }
                        return { parent, meta: { parentChoiceLabel } };
                    }
                }
            }
            return null;
        },
        getAncestorChain(question) {
            const chain = [];
            try {
                let p = this.getParentForFollowUp(question);
                while (p && p.parent) {
                    chain.push(p.parent);
                    p = this.getParentForFollowUp(p.parent);
                }
            } catch (e) {
                // ignore
            }
            return chain.reverse();
        },
        displayQuestionNumber(question, index) {
            try {
                const ancestors = this.getAncestorChain(question);
                const parts = [];

                for (let aIdx = 0; aIdx < ancestors.length; aIdx++) {
                    const anc = ancestors[aIdx];
                    const ancParentObj = this.getParentForFollowUp(anc);
                    if (!ancParentObj || !ancParentObj.parent) {
                        let topNum = 0;
                        for (let i = 0; i < this.localQuestions.length; i++) {
                            const item = this.localQuestions[i];
                            if (!this.getParentForFollowUp(item)) topNum++;
                            if (item === anc) break;
                        }
                        parts.push(String(topNum));
                    } else {
                        const parentQ = ancParentObj.parent;
                        let childPos = 0;
                        if (Array.isArray(parentQ.followUp)) {
                            const ancIdStr = this.convertIdToStr(anc._id || anc);
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
                        const myIdStr = this.convertIdToStr(question._id || question);
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

            let num = 0;
            for (let i = 0; i <= index && i < this.localQuestions.length; i++) {
                const item = this.localQuestions[i];
                if (!this.getParentForFollowUp(item)) num++;
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

.lang-key-input>>>input {
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    background-color: #f1f3f5;
    color: #495057;
}

.lang-key-input>>>input::placeholder {
    font-weight: 400;
    color: #adb5bd;
    text-transform: none;
    letter-spacing: 0;
}

.questions-wrapper {
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
}

.rounded-20 {
    border-radius: 20px !important;
    overflow: visible;
}

.shadow-sm {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}

.followup-card {
    background-color: #FFFBEB !important;
    border: 1px solid #FDE68A !important;
}

.followup-header {
    background: #FFF3CD;
    border: 1px solid #F7C948;
    color: #b45309;
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1;
}

.followup-from {
    font-size: 0.95rem;
    color: #6b7280;
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

.number-question.followup-number {
    background: #FFF3CD;
    border: 1px solid #F7C948;
    color: #b45309;
}

.icon-btn {
    width: 34px;
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

.followup-add-btn {
    background: rgba(245, 158, 11, 0.06);
    color: #b45309;
    border: 1px solid rgba(244, 206, 130, 0.6);
}

.followup-go-btn {
    background: rgba(14, 165, 233, 0.06);
    color: #0369a1;
    border: 1px solid rgba(14, 165, 233, 0.12);
}

.followup-add-btn:hover,
.followup-go-btn:hover,
.add-option-btn:hover,
.add-lang-btn:hover {
    transform: translateY(-1px);
}

::v-deep .vue-grid-item.vue-grid-placeholder {
    background: gray;
    border-radius: 20px;
}
</style>
