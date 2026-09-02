const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes user input strings to prevent XSS attacks using DOMPurify
 */
function sanitizeInput(str) {
    if (typeof str !== "string") return str;
    return DOMPurify.sanitize(str.trim());
}

module.exports = { sanitizeInput, DOMPurify };
