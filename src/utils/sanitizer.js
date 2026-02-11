/**
 * Input Sanitization Utilities
 * 
 * Sanitize user input before passing to AI services and
 * sanitize AI output before sending to clients.
 * 
 * @module utils/sanitizer
 */

/**
 * Sanitize user input before passing to AI
 * Removes potential prompt injection patterns, HTML, and control characters.
 * 
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
export const sanitizeAIInput = (input) => {
    if (typeof input !== 'string') return '';

    return input
        // Remove potential prompt injection delimiters
        .replace(/```/g, '')
        .replace(/---/g, '')
        // Remove system/assistant role injection attempts
        .replace(/\b(system|assistant)\s*:/gi, '')
        // Remove HTML/script tags
        .replace(/<[^>]*>/g, '')
        // Remove control characters (keep newlines and tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Limit length to prevent token abuse
        .substring(0, 10000)
        .trim();
};

/**
 * Sanitize AI output before sending to client
 * Escapes HTML entities to prevent XSS.
 * 
 * @param {string} output - Raw AI output
 * @returns {string} Sanitized output
 */
export const sanitizeAIOutput = (output) => {
    if (typeof output !== 'string') return '';

    return output
        // Escape HTML entities to prevent XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

export default { sanitizeAIInput, sanitizeAIOutput };
