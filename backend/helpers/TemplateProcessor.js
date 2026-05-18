'use strict';

const config = require('../config/email.config');

/**
 * Escapes HTML characters to prevent XSS or layout breaking.
 * 
 * @param {string} unsafe - The string to escape
 * @returns {string} - The escaped string
 */
exports.escapeHtml = function (unsafe) {
    if (!unsafe || typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

/**
 * Processes a template string by replacing {{VARIABLE}} placeholders with values from data object.
 * 
 * @param {string} content - Template string
 * @param {object} data - Variable mappings
 * @returns {string} - Processed content
 */
exports.processTemplate = function (content, data) {
    if (!content || typeof content !== 'string') return '';
    if (!data || typeof data !== 'object') return content;

    return content.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const trimmedKey = key.trim();
        // Return the value if it exists, otherwise keep the placeholder
        return data.hasOwnProperty(trimmedKey) ? String(data[trimmedKey] ?? '') : match;
    });
};

/**
 * Generates a styled HTML button for emails.
 * 
 * @param {string} text - Button text
 * @param {string} url - Destination URL
 * @param {object} options - Custom styling options
 * @returns {string} - HTML string
 */
exports.generateButton = function (text, url, options = {}) {
    const color = options.color || config.branding.primaryColor;
    return `
    <div style="margin: 30px 0; text-align: center;">
        <a href="${url}" style="background-color: ${color}; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${text}
        </a>
    </div>`;
};

/**
 * Generates a simple divider line.
 * 
 * @returns {string} - HTML string
 */
exports.generateDivider = function () {
    return `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">`;
};

/**
 * Generates a styled card/section for key-value data using table-based layout for compatibility.
 * 
 * @param {Array} items - List of {label, value} objects
 * @param {object} options - Custom options (title, etc.)
 * @returns {string} - HTML string
 */
exports.generateDataCard = function (items, options = {}) {
    if (!Array.isArray(items)) return '';

    const title = options.title ? `<p style="margin: 0 0 12px; font-size: 12px; font-weight: bold; color: ${config.branding.primaryColor}; text-transform: uppercase; letter-spacing: 1px;">${options.title}</p>` : '';
    
    const rows = items.map(item => `
        <tr>
            <td width="120" valign="top" style="padding-bottom: 8px; color: #718096; font-size: 14px; font-weight: 500;">${this.escapeHtml(item.label)}:</td>
            <td valign="top" style="padding-bottom: 8px; color: #2d3748; font-size: 14px; font-weight: 600;">${this.escapeHtml(item.value)}</td>
        </tr>
    `).join('');

    return `
    <div style="padding: 20px; background-color: #f7fafc; border-left: 4px solid ${config.branding.primaryColor}; border-radius: 8px; margin: 25px 0;">
        ${title}
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            ${rows}
        </table>
    </div>`;
};

/**
 * Processes a template and wraps it in a layout.
 * 
 * @param {string} content - Template content
 * @param {object} data - Variable mappings
 * @param {function} layoutFn - Function to wrap content in a layout
 * @param {object} options - Custom options for layout
 * @returns {string} - Complete HTML email
 */
exports.processWithLayout = function (content, data, layoutFn, options = {}) {
    let processed = this.processTemplate(content, data);
    
    // Improved HTML detection: wrap in <p> if it looks like plain text
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(processed);
    
    if (!hasHtmlTags) {
        processed = processed.split('\n')
            .filter(l => l.trim())
            .map(l => `<p style="margin: 0 0 15px;">${l}</p>`)
            .join('');
    }

    if (typeof layoutFn === 'function') {
        return layoutFn(processed, {
            title: data.Subject || options.title,
            ...options
        });
    }
    return processed;
};
