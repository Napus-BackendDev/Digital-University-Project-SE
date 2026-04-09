export const getApiId = function (request) {
    return Number(request.query.apiId || request.body.apiId) || 0;
};

export  const getSuccessCode = function (request) {
    return 20000 + getApiId(request);
};
