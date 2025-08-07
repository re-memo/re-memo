/**
 * Accessibility utilities and hooks
 */
import { useEffect } from 'react';

/**
 * Hook for managing keyboard navigation
 * @param {Array} keys - Array of key codes to listen for
 * @param {Function} callback - Callback function
 */
export function useKeyboard(keys, callback) {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (keys.includes(event.key) || keys.includes(event.code)) {
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [keys, callback]);
}

/**
 * Hook for screen reader announcements
 * @returns {Function} Announce function
 */
export function useScreenReader() {
  const announce = (message, priority = 'polite') => {
    const announcement = document.createElement('div');
    announcement.textContent = message;
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return announce;
}

/**
 * Get ARIA attributes for better accessibility
 */
export const ARIA = {
  /**
   * Get button attributes
   * @param {boolean} isPressed - Is button pressed
   * @param {boolean} isDisabled - Is button disabled
   * @param {string} describedBy - ID of describing element
   */
  button: (isPressed = false, isDisabled = false, describedBy = null) => ({
    role: 'button',
    'aria-pressed': isPressed,
    'aria-disabled': isDisabled,
    'aria-describedby': describedBy,
    tabIndex: isDisabled ? -1 : 0,
  }),

  /**
   * Get modal attributes
   * @param {string} labelledBy - ID of label element
   * @param {string} describedBy - ID of describing element
   */
  modal: (labelledBy, describedBy = null) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
  }),

  /**
   * Get list attributes
   * @param {number} size - Size of list
   * @param {number} level - Nesting level
   */
  list: (size = null, level = 1) => ({
    role: 'list',
    'aria-level': level,
    'aria-setsize': size,
  }),

  /**
   * Get listitem attributes
   * @param {number} position - Position in list
   * @param {number} setSize - Total size of set
   */
  listItem: (position = null, setSize = null) => ({
    role: 'listitem',
    'aria-posinset': position,
    'aria-setsize': setSize,
  }),

  /**
   * Get form field attributes
   * @param {boolean} isRequired - Is field required
   * @param {boolean} isInvalid - Is field invalid
   * @param {string} describedBy - ID of describing element
   */
  field: (isRequired = false, isInvalid = false, describedBy = null) => ({
    'aria-required': isRequired,
    'aria-invalid': isInvalid,
    'aria-describedby': describedBy,
  }),
};

/**
 * Color contrast utilities
 */
export const ColorContrast = {
  /**
   * Calculate luminance of a color
   * @param {string} color - Color in hex format
   * @returns {number} Luminance value
   */
  getLuminance(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * Convert hex color to RGB
   * @param {string} hex - Hex color
   * @returns {Array|null} RGB array or null
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  },

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First color
   * @param {string} color2 - Second color
   * @returns {number} Contrast ratio
   */
  getContrastRatio(color1, color2) {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    const brightest = Math.max(luminance1, luminance2);
    const darkest = Math.min(luminance1, luminance2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if color combination meets WCAG guidelines
   * @param {string} foreground - Foreground color
   * @param {string} background - Background color
   * @param {string} level - WCAG level ('AA' or 'AAA')
   * @returns {boolean} Meets guidelines
   */
  meetsWCAG(foreground, background, level = 'AA') {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
  },
};
