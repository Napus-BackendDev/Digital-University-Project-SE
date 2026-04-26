<template>
    <div class="security-page">
        <Header title="Permissions"
            description="Review group-to-menu rules, tune access switches, and keep the permission grid controlled." />
        <CRow>
            <CCol col="12">
                <PermissionTable :items="filteredPermissionRows" :fields="fields"
                    :role-options="roleOptions" @toggle="onToggle" />
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
                { key: 'role', label: 'Role', _style: 'width: 150px; text-align: left;' },
                { key: 'page', label: 'Page' },
                { key: 'read', label: 'Read', _style: 'width: 100px; text-align: center;' },
                { key: 'create', label: 'Create', _style: 'width: 100px; text-align: center;' },
                { key: 'update', label: 'Update', _style: 'width: 100px; text-align: center;' },
                { key: 'delete', label: 'Delete', _style: 'width: 100px; text-align: center;' }
            ],
            roles: [],
            pages: [],
            permissions: [],
            selectedRoleId: 'all'
        }
    },
    computed: {
        roleOptions() {
            return [
                { value: 'all', label: 'All Roles' },
                ...this.roles.map(role => ({
                    value: role._id,
                    label: this.getText(role.title) || role.name
                }))
            ]
        },
        permissionTableRows() {
            const map = {}
            this.permissions.forEach(row => {
                map[`${row.roleId}:${row.pageId}`] = row
            })
            const rows = []
            this.roles.forEach(role => {
                this.pages.forEach(page => {
                    const key = `${role._id}:${page._id}`
                    const current = map[key] || {}
                    rows.push({
                        _id: current._id || null,
                        roleId: role._id,
                        pageId: page._id,
                        create: !!current.create,
                        read: !!current.read,
                        update: !!current.update,
                        delete: !!current.delete,
                        role: this.getText(role.title) || role.name,
                        page: this.getText(page.title) || page.name
                    })
                })
            })
            return rows
        },
        filteredPermissionRows() {
            let rows = this.permissionTableRows
            if (this.selectedRoleId !== 'all') {
                rows = rows.filter(row => row.roleId === this.selectedRoleId)
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
                this.pages = [
                    { _id: 'Forms', name: 'Forms', title: [{ key: 'en', value: 'Forms' }] },
                    { _id: 'Manage Forms', name: 'Manage Forms', title: [{ key: 'en', value: 'Manage Forms' }] },
                    { _id: 'Analytics', name: 'Analytics', title: [{ key: 'en', value: 'Analytics' }] },
                    { _id: 'Permissions', name: 'Permissions', title: [{ key: 'en', value: 'Permissions' }] },
                ]

                const roles = await this.$store.dispatch('Roles/getAll')
                this.roles = roles || []

                const extractedPerms = []
                this.roles.forEach(role => {
                    if (role.permission && Array.isArray(role.permission)) {
                        role.permission.forEach(p => {
                            const permObj = {
                                roleId: role._id,
                                pageId: p.page,
                                create: false,
                                read: false,
                                update: false,
                                delete: false
                            }
                            if (p.access && Array.isArray(p.access)) {
                                p.access.forEach(a => {
                                    if (['create', 'read', 'update', 'delete'].includes(a.key)) {
                                        permObj[a.key] = a.value
                                    }
                                })
                            }
                            extractedPerms.push(permObj)
                        })
                    }
                })
                this.permissions = extractedPerms
            } catch (err) {
                console.error('Failed to load data.', err)
            }
        },
        async onToggle(row, key, checked) {
            const working = {
                _id: row._id || null,
                roleId: row.roleId,
                pageId: row.pageId,
                create: !!row.create,
                read: !!row.read,
                update: !!row.update,
                delete: !!row.delete
            }
            working[key] = checked

            const index = this.permissions.findIndex(p => p.roleId === row.roleId && p.pageId === row.pageId)
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
