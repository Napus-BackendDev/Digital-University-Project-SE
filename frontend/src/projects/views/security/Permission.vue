<template>
    <div class="security-page">
        <Header title="Permissions"
            description="Review group-to-menu rules, tune access switches, and keep the permission grid controlled." />
        <CRow>
            <CCol col="12">
                <PermissionTable :items="permissionTableRows" :fields="fields"
                    :organization-options="organizationOptions" @toggle="onToggle" />
            </CCol>
        </CRow>
    </div>
</template>

<script>
import Header from '../../components/Util/Header'
import PermissionTable from './components/PermissionTable'

export default {
    name: 'Permission',
    components: { Header, PermissionTable },
    data() {
        return {
            fields: [
                { key: 'organization', label: 'Organization', _style: 'width: 150px; text-align: center;' },
                { key: 'page', label: 'Page' },
                { key: 'create', label: 'Create', _style: 'width: 100px; text-align: center;' },
                { key: 'read', label: 'Read', _style: 'width: 100px; text-align: center;' },
                { key: 'update', label: 'Update', _style: 'width: 100px; text-align: center;' },
                { key: 'delete', label: 'Delete', _style: 'width: 100px; text-align: center;' }
            ],
            organizations: [],
            pages: [],
            permissions: [],
            selectedOrgId: 'all'
        }
    },
    computed: {
        organizationOptions() {
            return [
                { value: 'all', label: 'All Organizations' },
                ...this.organizations.map(org => ({
                    value: org._id,
                    label: this.getText(org.title) || org.name
                }))
            ]
        },
        permissionTableRows() {
            const map = {}
            this.permissions.forEach(row => {
                map[`${row.orgId}:${row.pageId}`] = row
            })
            const rows = []
            this.organizations.forEach(org => {
                this.pages.forEach(page => {
                    const key = `${org._id}:${page._id}`
                    const current = map[key] || {}
                    rows.push({
                        _id: current._id || null,
                        orgId: org._id,
                        pageId: page._id,
                        create: !!current.create,
                        read: !!current.read,
                        update: !!current.update,
                        delete: !!current.delete,
                        organization: this.getText(org.title) || org.name,
                        page: this.getText(page.title) || page.name
                    })
                })
            })
            return rows
        },
        filteredPermissionRows() {
            let rows = this.permissionTableRows
            if (this.selectedOrgId !== 'all') {
                rows = rows.filter(row => row.orgId === this.selectedOrgId)
            }
            return rows
        }
    },
    async created() {
        await this.loadData()
    },
    methods: {
        getText(titleArray) {
            if (!titleArray) return ''
            if (typeof titleArray === 'string') return titleArray
            if (Array.isArray(titleArray)) {
                const en = titleArray.find(t => t && t.key === 'en')
                return en ? en.value : (titleArray[0] ? titleArray[0].value : '')
            }
            return ''
        },
        async loadData() {
            try {
                // Mock pages for UI context
                this.pages = [
                    { _id: 'm1', name: 'Dashboard', title: [{ key: 'en', value: 'Dashboard' }] },
                    { _id: 'm2', name: 'ManageForms', title: [{ key: 'en', value: 'Manage Forms' }] },
                    { _id: 'm3', name: 'Analytics', title: [{ key: 'en', value: 'Analytics' }] },
                    { _id: 'm4', name: 'Permissions', title: [{ key: 'en', value: 'Permissions' }] },
                ]

                // Fetch real organizations from the backend
                const orgs = await this.$store.dispatch('Organizations/getAll')
                this.organizations = orgs || []

                // Initialize empty permissions matrix
                this.permissions = []
            } catch (err) {
                console.error('Failed to load data.', err)
            }
        },
        async onToggle(row, key, checked) {
            const working = {
                _id: row._id || null,
                orgId: row.orgId,
                pageId: row.pageId,
                create: !!row.create,
                read: !!row.read,
                update: !!row.update,
                delete: !!row.delete
            }
            working[key] = checked

            const index = this.permissions.findIndex(p => p.orgId === row.orgId && p.pageId === row.pageId)
            if (index !== -1) {
                this.permissions.splice(index, 1, { ...this.permissions[index], ...working })
            } else {
                this.permissions.push(working)
            }
            try {
                await this.$store.dispatch('security/permissionMatrix/save', working)
            } catch (err) {
                console.error('Failed to save permissions.', err)
            }
        }
    }
}
</script>

<style scoped lang="scss">
@import "./security-page.shared";

.permission-filter {
    min-width: 180px;
}
</style>
