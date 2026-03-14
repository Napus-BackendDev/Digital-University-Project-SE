<template>
    <div class="flex-grow-1">
        <Header :title="$t('nav.manage')" :description="$t('description')" :showCreateButton="true" />
        <WidgetsManageForms :forms="mockupForms" />
        <ManagementTables :items="mockupForms" />
    </div>
</template>

<script>
import ManagementTables from '../components/tables/ManagementTables.vue'
import WidgetsManageForms from '../components/widgets/WidgetsManageForms.vue'
import Header from '../components/Util/Header.vue'

export default {
    name: "EditorDashboard",
    components: {
        ManagementTables,
        WidgetsManageForms,
        Header
    },
    data() {
        return {
            mockupForms: [
                {
                    _id: '1',
                    title: '2024 Faculty Satisfaction Survey',
                    description: 'Collecting feedback from all faculty members on facilities and resources.',
                    status: 'Active',
                    organization: 'Faculty of Engineering',
                    createdBy: 'Dr. Sarah Wilson',
                    timeRange: 'Mar 1, 2024 - Mar 31, 2024',
                    daysLeft: '18 days left',
                    responses: [
                        { email: 'user1@example.com', createdAt: '2024-03-05T10:00:00Z', submit: true },
                        { email: 'user2@example.com', createdAt: '2024-03-06T11:00:00Z', submit: true },
                        { email: 'user3@example.com', createdAt: '2024-03-07T12:00:00Z', submit: false }
                    ],
                    updatedAt: '2024-03-13T08:00:00Z'
                },
                {
                    _id: '2',
                    title: 'Course Evaluation - Semester 2',
                    description: 'Standard end-of-semester evaluation for GE courses.',
                    status: 'Closed',
                    organization: 'Department of Computer Science',
                    createdBy: 'Prof. Michael Chen',
                    timeRange: 'Feb 15, 2024 - Mar 15, 2024',
                    daysLeft: 'Closed',
                    responses: [
                        ...Array(38).fill({ submit: true }),
                        ...Array(7).fill({ submit: false })
                    ],
                    updatedAt: '2024-03-12T10:00:00Z'
                },
                {
                    _id: '3',
                    title: 'Research Proposal Feedback',
                    description: 'Optional survey for graduate students to provide feedback on proposal process.',
                    status: 'Pending',
                    organization: 'Graduate School',
                    createdBy: 'Admin Team',
                    timeRange: 'Mar 20, 2024 - Apr 20, 2024',
                    daysLeft: 'Starts in 6 days',
                    responses: [],
                    updatedAt: '2024-03-10T09:00:00Z'
                },
                {
                    _id: '4',
                    title: 'Library Services Annual Review',
                    description: 'Help us improve our library services by sharing your experience.',
                    status: 'Active',
                    organization: 'Central Library',
                    createdBy: 'Librarian Smith',
                    timeRange: 'Feb 20, 2024 - Apr 20, 2024',
                    daysLeft: '38 days left',
                    responses: [
                        ...Array(10).fill({ submit: true }),
                        ...Array(2).fill({ submit: false })
                    ],
                    updatedAt: '2024-03-08T11:00:00Z'
                },
                {
                    _id: '5',
                    title: 'IT Infrastructure Survey',
                    description: 'Feedback on campus WiFi and computing facilities.',
                    status: 'Pending',
                    organization: 'IT Center',
                    createdBy: 'Support Desk',
                    timeRange: 'Apr 1, 2024 - May 1, 2024',
                    daysLeft: 'Starts in 18 days',
                    responses: [],
                    updatedAt: '2024-03-14T14:00:00Z'
                }
            ]
        }
    },
    created() {
        this.onInit();
    },
    methods: {
        onInit() {
            this.$store.dispatch('Forms/get');
        },
    },
    computed: {
    }
}
</script>
