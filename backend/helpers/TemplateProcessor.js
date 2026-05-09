'use strict';

/**
 * Processes a template string by replacing {{VARIABLE}} placeholders with values from data object.
 * 
 * @param {string} content - The template string containing placeholders like {{UserName}}
 * @param {object} data - An object where keys match the placeholders
 * @returns {string} - The processed content
 */
exports.processTemplate = function (content, data) {
    if (!content || typeof content !== 'string') return '';
    if (!data || typeof data !== 'object') return content;

    return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // Return the value if it exists, otherwise keep the placeholder or return empty string
        return data.hasOwnProperty(trimmedKey) ? String(data[trimmedKey] ?? '') : match;
    });
};
