// services/base.service.js
module.exports = function createBaseService(objSchema, defaultPopulate = []) {

    return {
        // ====================================
        // 🔹 Aggregate
        // ====================================
        onAggregate: async (pipeline = [], options = {}) => {
            return objSchema.aggregate(pipeline).option(options);
        },

        // ====================================
        // 🔹 Query One
        // ====================================
        onQuery: async (query, populate = defaultPopulate, select = '') => {
            return objSchema
                .findOne(query)
                .select(select)
                .populate(populate)
                .lean();
        },

        // ====================================
        // 🔹 Query Many
        // ====================================
        onQuerys: async (query, populate = defaultPopulate, select = '', onlyActive = false) => {
            if (onlyActive) query.expired = { $gte: new Date() };

            return objSchema
                .find(query)
                .select(select)
                .sort({ createdAt: -1 })
                .populate(populate)
                .lean();
        },

        // ====================================
        // 🔹 Create
        // ====================================
        onCreate: async (data, populate = defaultPopulate, select = '') => {
            const newObj = await objSchema.create(data);
            const populated = await objSchema.populate(newObj, populate);

            if (!select) return populated;

            // เลือกเฉพาะ fields ที่ต้องการ
            const result = {};
            select.split(' ').forEach(field => {
                if (field && populated[field] !== undefined) {
                    result[field] = populated[field];
                }
            });
            return result;
        },

        // ====================================
        // 🔹 Create Many
        // ====================================
        onCreateMany: async (data, populate = defaultPopulate, select = '') => {
            const newObj = await objSchema.create(data);
            const populated = await objSchema.populate(newObj, populate);

            if (!select) return populated;

            const populatedFields = (populatedData) => {
                // เลือกเฉพาะ fields ที่ต้องการ
                const result = {};
                select.split(' ').forEach(field => {
                    if (field && populatedData[field] !== undefined) {
                        result[field] = populatedData[field];
                    }
                });
                return result;
            }

            if (Array.isArray(populated)) {
                return populated.map(populatedFields);
            } else {
                return populatedFields(populated);
            }

        },

        // ====================================
        // 🔹 Update
        // ====================================
        onUpdate: async (query, data, populate = defaultPopulate, select = '') => {
            return objSchema
                .findOneAndUpdate(query, data, { new: true })
                .select(select)
                .populate(populate)
                .lean();
        },

        // ====================================
        // 🔹 Delete
        // ====================================
        onDelete: async (query) => {
            return objSchema.deleteMany(query);
        }
    };
};