// ====================================
// Helper: Attach uploaded files to answers array
// ====================================
const { getUploadUrl } = require('../../../../../helpers/upload');

const attachFilesToAnswers = function (answers, files, body) {
    if (!files || !files.length) return answers;

    let fileQuestions = body['answers[question]'] || body['answers[0][question]'];
    if (fileQuestions === undefined) fileQuestions = [];
    if (!Array.isArray(fileQuestions)) fileQuestions = [fileQuestions];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadUrl = getUploadUrl(file);
        const questionForFile = fileQuestions[i] || null;
        let attached = false;

        if (questionForFile) {
            for (const ans of answers) {
                if (ans && String(ans.question) === String(questionForFile)) {
                    ans.response = uploadUrl;
                    attached = true;
                    break;
                }
            }
        }

        if (!attached) {
            for (const ans of answers) {
                if (!ans || ans.response === null || ans.response === undefined || ans.response === '') {
                    ans.response = uploadUrl;
                    attached = true;
                    break;
                }
            }
        }

        if (!attached) {
            answers.push({ question: questionForFile || null, response: uploadUrl });
        }
    }

    return answers;
};

module.exports = {
    attachFilesToAnswers,
};