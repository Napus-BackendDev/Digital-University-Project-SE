<template>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th class="col-title">Form Title</th>
                    <th class="col-status">Status</th>
                    <th class="col-access">Access</th>
                    <th class="col-responses">Responses</th>
                    <th class="col-created">Created</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="form in forms" :key="form._id || form.id" @click="$emit('form-click', form)">
                    <td class="cell-title">
                        <div class="title-wrapper">
                            <span class="form-title">{{ form.title }}</span>
                            <span class="form-desc">{{ form.description || 'No description provided' }}</span>
                        </div>
                    </td>
                    <td class="cell-status">
                        <div class="status-badge" :class="form.status ? form.status.toLowerCase() : 'draft'">
                            <Icon :icon="getStatusIcon(form.status)" width="18" height="18" />
                            <span>{{ capitalize(form.status || 'Draft') }}</span>
                        </div>
                    </td>
                    <td class="cell-access">
                        <span class="access-pill">
                            {{ form.access || 'Private' }}
                        </span>
                    </td>
                    <td class="cell-responses">
                        <div class="response-badge">
                            {{ form.responsesCount || 0 }}
                        </div>
                    </td>
                    <td class="cell-created">
                        {{ formatDate(form.createdAt) }}
                    </td>
                </tr>
                <tr v-if="forms.length === 0">
                    <td colspan="5" class="empty-state">
                        No forms found
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    name: 'FormTableAdmin',
    props: {
        forms: {
            type: Array,
            required: true
        }
    },
    emits: ['form-click', 'toggle-dropdown', 'retry'],
    methods: {
        getStatusIcon(status) {
            const s = status ? status.toLowerCase() : 'draft';
            switch (s) {
                case 'open': return 'material-symbols:check-circle-outline-rounded';
                case 'closed': return 'material-symbols:cancel-outline-rounded';
                case 'draft': return 'material-symbols:edit-document-outline-rounded';
                default: return 'material-symbols:circle-outline';
            }
        },
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        formatDate(dateString) {
            if (!dateString) return '-';
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (e) {
                return dateString;
            }
        }
    }
}
</script>

<style scoped>
.table-container {
    width: 100%;
    overflow-x: auto;
    background: #ffffff;
    border-radius: 12px;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

th {
    text-align: left;
    padding: 16px 24px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #F3F4F6;
}

td {
    padding: 16px 24px;
    vertical-align: top;
    border-bottom: 1px solid #F9FAFB;
}

tr:hover {
    background-color: #F9FAFB;
    cursor: pointer;
}

tr:last-child td {
    border-bottom: none;
}

/* Column Specifics */
.col-title {
    width: 40%;
}

.col-status {
    width: 15%;
}

.col-access {
    width: 15%;
}

.col-responses {
    width: 15%;
    text-align: center;
}

.col-created {
    width: 15%;
    text-align: right;
}

.cell-responses {
    text-align: center;
}

.cell-created {
    text-align: right;
    color: #6B7280;
    font-size: 14px;
}

/* Title Cell */
.title-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.form-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
}

.form-desc {
    font-size: 13px;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
}

/* Status */
.status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
}

.status-badge.open {
    color: #16A34A;
}

.status-badge.closed {
    color: #DC2626;
}

.status-badge.draft {
    color: #4B5563;
}

/* Access Pill */
.access-pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 9999px;
    border: 1px solid #E5E7EB;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    background: #FFFFFF;
}

/* Response Badge */
.response-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #FEE2E2;
    color: #991B1B;
    font-weight: 700;
    font-size: 13px;
}

.empty-state {
    text-align: center;
    color: #9CA3AF;
    padding: 32px;
}
</style>