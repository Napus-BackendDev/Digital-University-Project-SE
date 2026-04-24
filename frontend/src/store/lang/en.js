const en = {
    campus: "University Name",
    faculty: "Faculty",
    department: "Department",
    academicYear: "Academic Year",
    semester: "Semester",
    course: "Choose Course",

    nav: {
        forms: "Forms",
        manage: "Manage Forms",
        analytics: "Analytics",
        permissions: "Permissions",
        logout: "Logout",
        selectUser: "Select User",
        welcome: "Welcome to E-Questionnaires"
    },
    accessLabel: {
        public: "Public",
        private: "Private",
        general: "General"
    },

    table: {
        title: "All Forms",
        access: "Access",
        noForms: "No questionnaires yet. Create one to get started.",
        emailRequired: "Email required",
        addAnswer: "Add Answer",
        viewAnswer: "View Answer",
        continueForm: "Continue Form",
        startForm: "Start Form",
        daysLeft: "days left",
        closed: "Closed",
        completedResponse: "Completed",
        ongoingResponse: "Ongoing",
        duplicate: "Duplicate",
        questionnaire: "Questionnaire",
        status: "Status",
        timeRange: "Time Range",
        progress: "Progress",
        createdBy: "Created By",
        action: "Action",
        header: "Response Trends",
        responses: "Responses",
        lastUpdated: "Last Updated",
        created: "Last Updated",
        actions: "Actions",
        view: "View",
        duplicate: "Duplication",
        edit: "Edit",
        delete: "Delete",
        search: "Search...",
        searchPlaceholder: "Search forms...",
        allStatus: "All Status",
        noItems: "No questionnaires yet. Create one to get started.",
        daysLeft: "{count} days left",
        completed: "Completed",
        ongoing: "Ongoing",
        viewSummary: "View Summary",
        submitAgain: "Submit Again",
        continueForm: "Continue Form",
        startForm: "Start Form",
        visibility: "Visibility",
        dateFrom: "From",
        dateTo: "To",
        rangeShortcuts: "Quick Range",
        quickDate: {
            all: "All",
            today: "Today",
            thisWeek: "This Week",
            last7Days: "Last 7 Days",
            last30Days: "Last 30 Days"
        },
        submittedCount: "Submitted {count} times"
    },

    modal: {
        deleteTitle: "Delete Confirmation",
        deleteMessage: "Do you really need this? after deleting you can't undone",
        confirm: "OK",
        cancel: "Cancel"
    },

    common: {
        refresh: "Refresh",
        error: "Error",
        success: "Success",
        loading: "Loading...",
        submitting: "Submitting...",
        ok: "OK",
        untitled: "Untitled Form"
    },

    form: {
        yourAnswer: "Your answer",
        submit: "Submit",
        copyForm: "Copy Form",
        previewBanner: "Preview Mode - Read Only",
        duplicateBanner: "Duplicate Mode - Copy Form",
        successMessage: "Thank you for your submission!",
        duplicateSuccess: "Form has been duplicated successfully!",
        question: "Question",
        answered: "Answered",
        notAuthenticated: "Not authenticated",
        loginRequired: "You must be logged in to submit this form.",
        alreadySubmitted: "You have already submitted this form.",
        accessDenied: "Access denied. This form is restricted to specific organizations.",
        accessDeniedPersonal: "Access denied. This form is restricted to specific users.",
        loginRequiredPersonal: "This form is restricted to specific users. Please sign in to verify your access.",
        signInWithGoogle: "Sign in with Google",
        collectEmail: "Collect email addresses",
        limitResponse: "Limit to one response",
        emailNotifications: "Email Notifications",
        requireResponse: "Require Response"
    },

    chart: {
        formsByStatus: "Forms by Status",
        distribution: "Current form distribution"
    },

    button: {
        setting: "Setting",
        create: "Create",
        start: "Start",
        edit: "Edit",
        save: "Save",
        cancel: "Cancel",
        back: "Back",
        preview: "Preview"
    },

    status: {
        draft: "Draft",
        active: "Active",
        closed: "Closed",
        pending: "Pending",
        inprogress: "In Progress",
        completed: "Completed",
        all: "All Status"
    },

    widget: {
        total: "Total Forms",
        active: "Active Forms",
        draft: "Draft Forms",
        closed: "Closed Forms",
        pending: "Pending",
        completed: "Completed",
        inprogress: "In Progress",
        totalResponses: "Total Responses",
        totalUsers: "Total Users",
        avgResponses: "Avg Responses/Form",
        manage: {
            total: "Total Forms",
            active: "Active Forms",
            draft: "Draft Forms",
            closed: "Closed Forms"
        },
        activeUsers: "Active Users",
        completionRate: "Avg. Completion Rate"
    },
    description: "Description",
    editor: {
        header: {
            questionTitle: "Form Questions",
            questionDesc: "Add and organize questions to collect responses",
            responseTitle: "Form Responses",
            responseDesc: "View and analyze form submissions and performance data",
            settingTitle: "Form Settings",
            settingDesc: "Configure form access, schedule, and organization controls"
        },
        settings: {
            access: {
                title: "Access Control",
                collaborators: "Collaborators",
                collaboratorsDesc: "Add people who can help you manage this form",
                emailPlaceholder: "Email address",
                add: "Add",
                selectedCollaborators: "Selected Collaborators",
                noCollaborators: "No collaborators added.",
                remove: "Remove",
                editor: "Editor",
                viewer: "Viewer",
                editorDesc: "Can edit form and view responses",
                viewerDesc: "Can only view form and view responses",
                role: "Role",
                accessLevel: "Access Level",
                accessLevelDesc: "Select the access permission level for this form.",
                selectLevel: "Select Level..."
            },
            status: {
                title: "Form Status",
                startAt: "Start date time",
                endAt: "End date time",
                statusLabel: "Status",
                draft: "Draft",
                open: "Open",
                openForever: "Open (Forever)",
                closedForever: "Closed (Forever)",
                scheduled: "Scheduled",
                closed: "Closed",
                draftDesc: "Start and end dates are not defined. The form is not actively accepting responses yet.",
                openDesc: "The current time is within the start and end dates. The form is actively accepting responses.",
                openForeverDesc: "The form will be open all the time until you set it to close.",
                closedForeverDesc: "The form will be closed all the time until you set it to open.",
                scheduledDesc: "The start date is in the future. The form will open automatically at the specified time.",
                closedDesc: "The current time is not within the specified dates. The form is closed and no longer accepting responses."
            },
            organization: {
                title: "Organization Control",
                selectedOrgs: "Selected Organizations",
                noOrgs: "No organizations selected. Form will be private.",
                canResponse: "Organization Can Response",
                name: "Organization Name",
                selectPlaceholder: "Select organization",
                generalHint: "If you choose General, every department will be able to do the form.",
                allowedEmails: "Authorized Users", // Updated key
                noEmails: "No authorized users selected.", // Updated key
                specifyUser: "Specify User Access",
                emailPlaceholder: "Select or search for users to allow access", // Updated key
                userHint: "If you specify individual users, only those users will be able to access the form. This is useful for sensitive or personal questionnaires."
            },
            response: {
                title: "Response Settings",
                collectEmail: "Collect email addresses",
                collectEmailDesc: "Require respondents to enter their email",
                notifications: "Email Notifications",
                notificationsDesc: "Send email notifications to respondents after submission",
                message: "Email Message",
                messagePlaceholder: "Write the message that will be sent to respondents",
                messageTip: "Tip: You can use {name} or {email} to personalize the message.",
                limitOne: "Limit to one response",
                limitOneDesc: "Only allow one response per person",
                requireAll: "Require Response",
                requireAllDesc: "Ensure all questions have a response before submission"
            }
        }
    },
    toolbar: {
        mainNav: "Main Navigation",
        questions: "Questions",
        responses: "Responses",
        settings: "Settings",
        sharing: "Form Sharing",
        copyLink: "Copy link",
        copied: "Copied!",
        sendEmail: "Send Email",
        questionTypes: "Question Types",
        contentElements: "Content Elements",
        qr: {
            scan: "QR Code Scan",
            share: "QR Code Share",
            instruction: "Scan this QR code with your phone's camera to easily access and fill out this form.",
            done: "Done"
        }
    },
    analytics: {
        title: "Admin Dashboard",
        description: "Overview of all forms and responses",
        dailyResponsesTrend: "Daily Responses Trend",
        dailyResponsesDesc: "Visualizing questionnaire responses for the selected period",
        responsesOverTime: "Responses Over Time",
        responsesOverTimeDesc: "Daily responses monitored for the selected period",
        sevenDaysView: "7 DAYS VIEW",
        timeRange: {
            "all": "All",
            "7d": "7 Days",
            "30d": "30 Days",
            "1y": "1 Year"
        },
        mostRespondedForm: "Most Responded Form",
        mostRespondedDesc: "Forms with the most responses in the selected period",
        widgets: {
            totalForms: "Total Forms",
            totalResponses: "Total Responses",
            totalUsers: "Total Users",
            avgResponses: "Avg Responses/Form"
        },
        submissionTrend: "Submission Activity Trend",
        popularForms: "Most Responses Form",
        today: "Today",
        oneWeek: "1 Week",
        oneMonth: "1 Month",
        submissions: "Submissions",
        overviewBasedOn: "Overview of responses based on {range}"
    },
    types: {
        short_answer: "Short Answer",
        paragraph: "Paragraph",
        multiple_choice: "Multiple Choice",
        checkbox: "Checkbox",
        rating: "Rating",
        file_upload: "File Upload",
        title_description: "Title & Description",
        image: "Image"
    },
    responses: {
        title: "Response Summary",
        total: "Total Responses",
        summary: "Summary",
        individual: "Individual",
        noData: "No data yet",
        noDataDesc: "Wait for participants to complete the questionnaire.",
        export: "Export",
        excel: "Excel (.xlsx)",
        json: "Download JSON",
        noExportData: "No responses to export."
    },
    builder: {
        addLanguage: "Add Language",
        shortAnswerPlaceholder: "Short Paragraph Text",
        paragraphPlaceholder: "Long Answer Text",
        addOption: "Add Option",
        noAction: "No Action",
        fileType: "File Type",
        maxFiles: "Max Files",
        maxFileSize: "Max File Size",
        description: "Description",
        clickToChooseImage: "Click to choose image",
        type: "Type",
        previewNotAvailable: "Preview not available for this type",
        emptyQuestions: "You haven’t added any questions yet. Try adding one from the sidebar.",
        requiredLabel: "Required",
        modal: {
            chooseImage: "Choose Image",
            cancel: "Cancel",
            ok: "OK"
        },
        goTo: "Next Action",
        nextQuestion: "Next Question",
        submitForm: "Submit Form",
        questionLabel: "Question"
    }
}
export default en
