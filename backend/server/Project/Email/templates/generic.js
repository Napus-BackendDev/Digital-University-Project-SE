'use strict';

const baseLayout = require('./baseLayout');

/**
 * Generates a generic notification email.
 */
exports.buildGenericHtml = function (title, message, options = {}) {
    const content = `
        <p style="font-size: 16px; font-weight: bold; color: #1a202c; margin-bottom: 15px;">${title}</p>
        <div style="font-size: 15px; color: #4a5568; line-height: 1.6;">
            ${message}
        </div>
        ${options.buttonUrl ? `
        <div style="margin: 30px 0; text-align: center;">
            <a href="${options.buttonUrl}" style="background-color: #ac1515; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
                ${options.buttonText || 'View Details'}
            </a>
        </div>` : ''}
    `;

    return baseLayout.wrapInLayout(content, {
        title: title,
        preheader: options.preheader || title
    });
};

exports.buildGenericText = function (title, message) {
    return `${title}\n\n${message.replace(/<[^>]*>?/gm, '')}`;
};
