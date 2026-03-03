<template>
    <div class="mt-4">
        <!-- Toolbar -->
        <div class="d-flex justify-content-between align-items-center mb-4 px-2">
            <div class="text-muted" style="font-size: 1.1rem; font-weight: 500; color: #475569 !important;">
                {{ responsesCount }} responses
            </div>

            <div class="d-flex align-items-center gap-2">

                <CButton :color="currentView === 'summary' ? 'dark' : 'light'" shape="pill"
                    :class="['d-flex align-items-center mx-1', currentView === 'summary' ? 'custom-btn-dark' : 'custom-btn-light text-muted']"
                    @click="currentView = 'summary'">
                    <CIcon name="cil-chart-pie" size="sm" class="mr-2" />
                    Summary
                </CButton>

                <CButton :color="currentView === 'individual' ? 'dark' : 'light'" shape="pill"
                    :class="['d-flex align-items-center mx-1', currentView === 'individual' ? 'custom-btn-dark' : 'custom-btn-light text-muted']"
                    @click="currentView = 'individual'">
                    <CIcon name="cil-list" size="sm" class="mr-2" />
                    Individual
                </CButton>

                <CDropdown class="mx-1 custom-dropdown">
                    <template #toggler>
                        <CButton color="light" shape="pill"
                            class="d-flex align-items-center custom-btn-light text-muted">
                            Export
                            <CIcon name="cil-chevron-top" size="sm" class="ml-2" />
                        </CButton>
                    </template>
                    <CDropdownItem>Download CSV</CDropdownItem>
                    <CDropdownItem>Download Excel</CDropdownItem>
                </CDropdown>

            </div>
        </div>

        <!-- SUMMARY VIEW -->
        <div v-if="currentView === 'summary'">
            <!-- Content Area - Short Answer -->
            <div class="p-5 bg-white border rounded shadow-sm mb-4">
                <div>
                    <h4 class="mb-1 font-weight-bold" style="color: #334155;">1. What is your full name?</h4>
                    <div class="text-muted mb-4" style="font-size: 0.95rem;">6 responses</div>

                    <div class="table-responsive rounded border mb-4">
                        <table class="table mb-0 custom-response-table">
                            <thead>
                                <tr>
                                    <th scope="col" style="width: 80px;" class="pl-4">#</th>
                                    <th scope="col">Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in shortAnswerData" :key="item.id">
                                    <td class="pl-4 align-middle">
                                        <div class="index-circle">{{ item.id }}</div>
                                    </td>
                                    <td class="align-middle text-dark">{{ item.text }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="d-flex justify-content-center mt-5 mb-2">
                        <CPagination :activePage.sync="activePage" :pages="3" :doubleArrows="false" :align="'center'"
                            class="custom-pagination border-0 mb-0" />
                    </div>
                </div>
            </div>

            <!-- Content Area - Paragraph -->
            <div class="p-5 bg-white border rounded shadow-sm mb-4">
                <div>
                    <h4 class="mb-1 font-weight-bold" style="color: #334155;">2. Tell us about your experience with our
                        platform
                    </h4>
                    <div class="text-muted mb-4" style="font-size: 0.95rem;">6 responses</div>

                    <div class="table-responsive rounded border mb-4">
                        <table class="table mb-0 custom-response-table">
                            <thead>
                                <tr>
                                    <th scope="col" style="width: 80px;" class="pl-4">#</th>
                                    <th scope="col">Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in paragraphData" :key="item.id">
                                    <td class="pl-4 align-middle">
                                        <div class="index-circle">{{ item.id }}</div>
                                    </td>
                                    <td class="align-middle text-dark">{{ item.text }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="d-flex justify-content-center mt-5 mb-2">
                        <CPagination :activePage.sync="activePageParagraph" :pages="3" :doubleArrows="false"
                            :align="'center'" class="custom-pagination border-0 mb-0" />
                    </div>
                </div>
            </div>

            <!-- Content Area - Multiple Choice -->
            <div class="p-5 bg-white border rounded shadow-sm mb-4">
                <div>
                    <h4 class="mb-1 font-weight-bold" style="color: #334155;">3. Which department do you work in?</h4>
                    <div class="text-muted mb-4" style="font-size: 0.95rem;">6 responses</div>

                    <CRow class="align-items-center mb-4 mt-5">
                        <CCol md="4" class="text-center d-flex justify-content-center">
                            <div class="donut-chart">
                                <div class="donut-inner"></div>
                            </div>
                        </CCol>
                        <CCol md="8">
                            <div v-for="item in multipleChoiceData" :key="item.id" class="mb-4 pr-5">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <div class="d-flex align-items-center">
                                        <div class="legend-dot" :style="{ backgroundColor: item.color }"></div>
                                        <span class="text-dark">{{ item.label }}</span>
                                    </div>
                                    <span class="font-weight-bold text-dark">{{ item.count }}</span>
                                </div>
                                <div class="d-flex" style="padding-left: 24px;">
                                    <div class="progress w-100"
                                        style="height: 8px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden;">
                                        <div class="progress-bar" role="progressbar"
                                            :style="{ width: '16.666%', backgroundColor: item.color }"
                                            aria-valuenow="16" aria-valuemin="0" aria-valuemax="100">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CCol>
                    </CRow>
                </div>
            </div>

            <!-- Content Area - Rating -->
            <div class="p-5 bg-white border rounded shadow-sm">
                <div>
                    <h4 class="mb-1 font-weight-bold" style="color: #334155;">6. Rate the user interface</h4>
                    <div class="text-muted mb-4" style="font-size: 0.95rem;">6 responses</div>

                    <div class="mt-5 mb-3 px-3">
                        <div class="d-flex" style="height: 250px;">
                            <!-- Y-Axis Labels -->
                            <div class="y-axis-labels">
                                <span v-for="(val, index) in ratingData.yAxis" :key="index">{{ val }}</span>
                            </div>

                            <!-- Chart Area -->
                            <div class="chart-area w-100 position-relative">
                                <!-- Background Grid Lines -->
                                <div class="grid-line" style="top: 0%"></div>
                                <div class="grid-line" style="top: 25%"></div>
                                <div class="grid-line" style="top: 50%"></div>
                                <div class="grid-line" style="top: 75%"></div>

                                <!-- Bars -->
                                <div class="bars-container">
                                    <div v-for="(bar, index) in ratingData.bars" :key="index"
                                        class="rating-bar-wrapper">
                                        <div class="rating-bar" :style="{ height: bar.percentage + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- X-Axis Labels -->
                        <div class="d-flex x-axis-labels">
                            <div style="width: 45px; padding-right: 12px;"></div> <!-- Offset to match Y-axis -->
                            <div class="d-flex justify-content-around w-100 px-5">
                                <div v-for="(bar, index) in ratingData.bars" :key="index" class="text-center">
                                    {{ bar.label }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- INDIVIDUAL VIEW -->
        <div v-else-if="currentView === 'individual'" class="p-5 bg-white border rounded shadow-sm">
            <!-- Search Bar -->
            <div class="mb-4 custom-search">
                <CInput class="mb-0" placeholder="Search responses by email or date...">
                    <template #prepend-content>
                        <CIcon name="cil-magnifying-glass" />
                    </template>
                </CInput>
            </div>

            <div class="table-responsive rounded border mb-4">
                <table class="table mb-0 custom-response-table">
                    <thead>
                        <tr>
                            <th scope="col" style="width: 80px;" class="pl-4">#</th>
                            <th scope="col">Email</th>
                            <th scope="col">Submitted</th>
                            <th scope="col" class="text-center">Answers</th>
                            <th scope="col" class="text-right pr-5">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in individualData" :key="item.id">
                            <td class="pl-4 align-middle">
                                <div class="index-circle pink-circle">{{ item.id }}</div>
                            </td>
                            <td class="align-middle text-dark font-weight-bold">{{ item.email }}</td>
                            <td class="align-middle" style="color: #64748b;">{{ item.submitted }}</td>
                            <td class="align-middle text-center">
                                <span class="badge badge-light px-3 py-2 rounded-pill font-weight-normal text-dark"
                                    style="background-color: #f1f5f9; font-size: 0.85rem;">{{ item.answers }}
                                    answers</span>
                            </td>
                            <td class="align-middle text-right pr-5">
                                <CButton color="link"
                                    class="text-dark d-flex align-items-center justify-content-end w-100 px-0 text-decoration-none font-weight-bold">
                                    <CIcon name="cil-eye" size="sm" class="mr-2" />
                                    View
                                </CButton>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="d-flex justify-content-center mt-5 mb-2">
                <CPagination :activePage.sync="activePageIndividual" :pages="3" :doubleArrows="false" :align="'center'"
                    class="custom-pagination border-0 mb-0" />
            </div>
        </div>

    </div>
</template>

<script>
export default {
    name: 'TabResponses',
    data() {
        return {
            responsesCount: 6, // Mocked to match design
            currentView: 'individual',
            activePage: 1,
            activePageParagraph: 1,
            activePageIndividual: 1,
            individualData: [
                { id: 1, email: 'alex.chen@university.edu', submitted: '02/12/2024, 09:30:00', answers: 11 },
                { id: 2, email: 'maria.rodriguez@university.edu', submitted: '03/12/2024, 14:20:00', answers: 11 },
                { id: 3, email: 'james.taylor@university.edu', submitted: '04/12/2024, 11:15:00', answers: 11 },
                { id: 4, email: 'priya.patel@university.edu', submitted: '05/12/2024, 16:45:00', answers: 11 },
                { id: 5, email: 'robert.kim@university.edu', submitted: '06/12/2024, 10:00:00', answers: 11 },
                { id: 6, email: 'sophie.anderson@university.edu', submitted: '07/12/2024, 13:30:00', answers: 11 }
            ],
            shortAnswerData: [
                { id: 1, text: 'Alex Chen' },
                { id: 2, text: 'Maria Rodriguez' },
                { id: 3, text: 'James Taylor' },
                { id: 4, text: 'Priya Patel' },
                { id: 5, text: 'Robert Kim' },
                { id: 6, text: 'Sophie Anderson' }
            ],
            paragraphData: [
                { id: 1, text: 'The platform has been incredibly helpful for creating surveys quickly. The interface is intuitive and the analytics features are powerful. I particularly appreciate the real-time response tracking and the ability to customize form themes.' },
                { id: 2, text: 'Great tool for our marketing campaigns! We use it to collect customer feedback and run surveys for product launches. The email notification feature keeps our team updated in real-time.' },
                { id: 3, text: 'As a sales manager, I rely on this platform to gather client feedback after demos and meetings. The mobile-friendly forms make it easy for clients to respond on the go. Would love to see more integration options with CRM systems.' },
                { id: 4, text: 'Perfect for our HR onboarding surveys and employee satisfaction forms. The branching logic feature helps us create personalized survey experiences. The data export functionality saves us hours of manual work.' },
                { id: 5, text: 'We use this for budget approval workflows and financial surveys. The security features give us confidence when handling sensitive data. The reporting dashboard provides excellent insights for stakeholder presentations.' },
                { id: 6, text: 'I manage various projects and this tool helps me collect requirements, track progress, and gather stakeholder feedback efficiently. The template library is a huge time-saver. Looking forward to more advanced automation features!' }
            ],
            multipleChoiceData: [
                { id: 1, label: 'Engineering', count: 1, color: '#a32a29' },
                { id: 2, label: 'Marketing', count: 1, color: '#d9a036' },
                { id: 3, label: 'Sales', count: 1, color: '#723469' },
                { id: 4, label: 'Human Resources', count: 1, color: '#618a44' },
                { id: 5, label: 'Finance', count: 1, color: '#3d5a92' },
                { id: 6, label: 'Other', count: 1, color: '#a32a29' }
            ],
            ratingData: {
                yAxis: [3, 2.25, 1.5, 0.75, 0],
                bars: [
                    { label: '4 ★', value: 3, percentage: 100 },
                    { label: '5 ★', value: 3, percentage: 100 }
                ]
            }
        }
    }
}
</script>

<style scoped>
.gap-2 {
    gap: 0.5rem;
}

.custom-btn-light {
    background-color: #f1f5f9 !important;
    border: none !important;
    color: #0f172a !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    box-shadow: none !important;
}

.custom-btn-light:hover {
    background-color: #e2e8f0 !important;
}

.custom-btn-dark {
    background-color: #1e293b !important;
    border: none !important;
    color: white !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    box-shadow: none !important;
}

.custom-btn-dark:hover {
    background-color: #0f172a !important;
}

::v-deep .custom-dropdown .dropdown-toggle {
    background-color: #f1f5f9 !important;
    border: none !important;
    color: #475569 !important;
    font-weight: 500;
    padding: 0.5rem 1.25rem !important;
    border-radius: 50rem !important;
    display: flex;
    align-items: center;
    box-shadow: none !important;
}

::v-deep .custom-dropdown .dropdown-toggle::after {
    display: none;
    /* Hide default dropdown caret */
}

::v-deep .custom-dropdown .dropdown-toggle:hover {
    background-color: #e2e8f0 !important;
}

/* Response Table Styling */
.custom-response-table {
    border-collapse: collapse;
}

.custom-response-table thead th {
    background-color: #ffffff;
    color: #0f172a;
    font-weight: 600;
    font-size: 0.95rem;
    border-bottom: 1px solid #e2e8f0;
    border-top: none;
    padding: 1rem;
}

.custom-response-table tbody td {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background-color: #ffffff;
}

.custom-response-table tbody tr:last-child td {
    border-bottom: none;
}

.index-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: #f1f5f9;
    color: #475569;
    border-radius: 50%;
    font-size: 0.9rem;
    font-weight: 500;
}

/* Pagination styles */
::v-deep .custom-pagination .page-item .page-link {
    border: none !important;
    background-color: transparent !important;
    color: #475569 !important;
    font-weight: 500;
    padding: 8px 14px;
    border-radius: 50%;
    margin: 0 4px;
}

::v-deep .custom-pagination .page-item.active .page-link {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
    font-weight: 600;
}

::v-deep .custom-pagination .page-item:not(.active) .page-link:hover {
    background-color: #f8fafc !important;
    color: #1e293b !important;
}

::v-deep .custom-pagination .page-item.disabled .page-link {
    color: #94a3b8 !important;
}

/* Donut Chart & Legend */
.donut-chart {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    /* CSS conic-gradient creating the precise donut chart look from the screenshot */
    background: conic-gradient(#a32a29 0deg 57deg,
            white 57deg 60deg,
            #d9a036 60deg 117deg,
            white 117deg 120deg,
            #723469 120deg 177deg,
            white 177deg 180deg,
            #618a44 180deg 237deg,
            white 237deg 240deg,
            #3d5a92 240deg 297deg,
            white 297deg 300deg,
            #a32a29 300deg 357deg,
            white 357deg 360deg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.donut-inner {
    width: 65%;
    height: 65%;
    background: white;
    border-radius: 50%;
}

.legend-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    margin-right: 10px;
}

/* Rating Chart Styles */
.y-axis-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    width: 45px;
    padding-right: 12px;
    color: #64748b;
    font-size: 0.85rem;
    position: relative;
    top: -9px;
    /* Align text with top of lines */
}

.chart-area {
    border-left: 1px solid #94a3b8;
    border-bottom: 1px solid #94a3b8;
    position: relative;
    padding: 0 5%;
}

.grid-line {
    position: absolute;
    width: 100%;
    border-top: 1px dashed #e2e8f0;
    left: 0;
    z-index: 1;
}

.bars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    padding: 0 5%;
    z-index: 2;
}

.rating-bar-wrapper {
    width: 40%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
}

.rating-bar {
    width: 100%;
    background-color: #a32a29;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
}

.x-axis-labels {
    color: #64748b;
    font-size: 0.85rem;
    margin-top: 5px;
}

/* Individual View Styles */
.pink-circle {
    background-color: #ffe4e6;
    color: #be123c !important;
}

::v-deep .custom-search .form-control {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    height: 48px;
    border-left: none;
    box-shadow: none;
}

::v-deep .custom-search .input-group-text {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-right: none;
    border-top-left-radius: 0.75rem;
    border-bottom-left-radius: 0.75rem;
    color: #94a3b8;
}
</style>
