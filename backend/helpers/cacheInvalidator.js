const redisClient = require("./redis");

/**
 * Helper module for purging cached Redis keys on mutations (Create/Update/Delete).
 */
module.exports = {
    async invalidateFormCache(formId = null) {
        await redisClient.delPattern("cache:*form*");
        if (formId) {
            await redisClient.delete(`cache:form:${formId}`);
        }
    },

    async invalidateUserCache(userId = null) {
        await redisClient.delPattern("cache:*user*");
        if (userId) {
            await redisClient.delete(`cache:user:${userId}`);
        }
    },

    async invalidateOrgCache(orgId = null) {
        await redisClient.delPattern("cache:*organization*");
        if (orgId) {
            await redisClient.delete(`cache:org:${orgId}`);
        }
    }
};
