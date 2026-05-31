import Service from "@/service/api";

function buildAccessRow(permissionRow) {
    return {
        page: permissionRow.pageId,
        access: [
            { key: 'create', value: !!permissionRow.create },
            { key: 'read', value: !!permissionRow.read },
            { key: 'update', value: !!permissionRow.update },
            { key: 'delete', value: !!permissionRow.delete }
        ]
    };
}

function upsertPermission(rolePermission, permissionRow) {
    const nextPermission = Array.isArray(rolePermission) ? [...rolePermission] : [];
    const index = nextPermission.findIndex(item => String(item.page) === String(permissionRow.pageId));
    const nextRow = buildAccessRow(permissionRow);

    if (index === -1) {
        nextPermission.push(nextRow);
    } else {
        nextPermission.splice(index, 1, nextRow);
    }

    return nextPermission;
}

const module = {
    namespaced: true,
    actions: {
        async save({ dispatch }, permissionRow) {
            try {
                if (!permissionRow || !permissionRow.roleId || !permissionRow.pageId) {
                    throw new Error('Invalid permission payload');
                }

                console.debug('[permissionMatrix/save] payload:', permissionRow);

                const roleResponse = await Service.roles('get', { _id: permissionRow.roleId });
                const role = roleResponse && roleResponse.data && roleResponse.data.data;

                if (!role) {
                    throw new Error('Role not found');
                }

                const payload = {
                    _id: role._id,
                    permission: upsertPermission(role.permission, permissionRow)
                };

                console.debug('[permissionMatrix/save] updating role:', payload);

                const resp = await Service.roles('update', payload);
                console.debug('[permissionMatrix/save] response:', resp && resp.data);
                return resp && resp.data;
            } catch (err) {
                console.error('[permissionMatrix/save] error:', err && err.message ? err.message : err);
                throw err;
            }
        }
    }
};

export default module;