const getApiId = function (request) {
    const query = (request && request.query) ? request.query : {};
    const body = (request && request.body) ? request.body : {};

    const rawApiId = query.apiId !== undefined ? query.apiId : body.apiId;
    const parsedApiId = Number(rawApiId);

    return Number.isFinite(parsedApiId) ? parsedApiId : 0;
};

const getSuccessCode = function (request) {
    const query = (request && request.query) ? request.query : {};
    const body = (request && request.body) ? request.body : {};

    const rawSuccessCode = query.successCode !== undefined ? query.successCode : body.successCode;
    const parsedSuccessCode = Number(rawSuccessCode);

    if (Number.isFinite(parsedSuccessCode)) {
        return parsedSuccessCode;
    }

    return 20000 + getApiId(request);
};

const getErrorCode = function (request, defaultCode = 50000) {
    const query = (request && request.query) ? request.query : {};
    const body = (request && request.body) ? request.body : {};

    const parsedDefaultCode = Number(defaultCode);
    const safeDefaultCode = Number.isFinite(parsedDefaultCode) ? parsedDefaultCode : 50000;

    const rawErrorCode = query.errorCode !== undefined ? query.errorCode : body.errorCode;
    const parsedErrorCode = Number(rawErrorCode);

    return Number.isFinite(parsedErrorCode) ? parsedErrorCode : safeDefaultCode;
};

module.exports = {
    getApiId,
    getSuccessCode,
    getErrorCode
};
