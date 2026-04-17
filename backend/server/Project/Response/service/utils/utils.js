// ====================================
// Helper: Attach uploaded files to answers array
// ====================================
const { getUploadUrl } = require('../../../../../helpers/upload');
const fs = require('fs');
const path = require('path');

const cleanUpOrphanedFile = function (fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.includes('/uploads/')) return;
    try {
        // Strip leading slash if present safely
        const relativeUrl = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
        const filePath = path.join(__dirname, '../../../../../public', relativeUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Auto-Cleanup] Successfully deleted orphaned file at: ${fileUrl}`);
        }
    } catch (e) {
        console.error(`[Auto-Cleanup] Failed to delete file ${fileUrl}:`, e.message);
    }
};

const attachFilesToAnswers = function (answers, files, body) {
    if (!files || !files.length) return answers;

    let fileQuestions = [];
    try {
        if (body.fileQuestions) {
            fileQuestions = JSON.parse(body.fileQuestions);
        } else {
            fileQuestions = body['answers[question]'] || body['answers[0][question]'];
            if (!Array.isArray(fileQuestions)) fileQuestions = [fileQuestions];
        }
    } catch(e) {}

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
    cleanUpOrphanedFile
};