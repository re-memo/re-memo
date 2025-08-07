/**
 * Input validation utilities
 */

/**
 * Sanitize HTML to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(input) {
  if (!input) return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate journal entry data
 * @param {Object} entry - Entry data
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateJournalEntry(entry) {
  const errors = [];
  
  if (!entry.title || entry.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (entry.title && entry.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  if (!entry.content || entry.content.trim().length === 0) {
    errors.push('Content is required');
  }
  
  if (entry.content && entry.content.length > 50000) {
    errors.push('Content must be less than 50,000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {{isValid: boolean, sanitized: string}}
 */
export function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return { isValid: false, sanitized: '' };
  }
  
  // Remove potentially dangerous characters
  const sanitized = query.replace(/[<>\"'&]/g, '').trim();
  
  return {
    isValid: sanitized.length > 0 && sanitized.length <= 100,
    sanitized,
  };
}

/**
 * Rate limiting for API calls
 */
export class RateLimiter {
  constructor(maxCalls = 10, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  canMakeCall() {
    const now = Date.now();
    
    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.windowMs);
    
    // Check if we can make a new call
    if (this.calls.length < this.maxCalls) {
      this.calls.push(now);
      return true;
    }
    
    return false;
  }

  getTimeUntilReset() {
    if (this.calls.length === 0) return 0;
    
    const oldestCall = Math.min(...this.calls);
    const resetTime = oldestCall + this.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }
}

/**
 * Content Security Policy helpers
 */
export const CSP = {
  /**
   * Check if URL is safe for external resources
   * @param {string} url - URL to check
   * @returns {boolean} Is safe
   */
  isSafeUrl(url) {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'data:'];
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        window.location.hostname,
      ];
      
      return allowedProtocols.includes(parsed.protocol) &&
             (allowedDomains.includes(parsed.hostname) || parsed.protocol === 'data:');
    } catch {
      return false;
    }
  },

  /**
   * Sanitize URL for safe usage
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    if (!this.isSafeUrl(url)) {
      return '#';
    }
    return url;
  },
};
