/**
 * Markdown utility functions for the journal editor.
 */

/**
 * Convert plain text to markdown-friendly format
 */
export function textToMarkdown(text) {
  if (!text) return '';
  
  // Basic auto-formatting
  let markdown = text;
  
  // Convert URLs to markdown links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  markdown = markdown.replace(urlRegex, '[$1]($1)');
  
  // Convert email addresses to mailto links
  const emailRegex = /(\S+@\S+\.\S+)/g;
  markdown = markdown.replace(emailRegex, '[mailto:$1]($1)');
  
  return markdown;
}

/**
 * Extract plain text from markdown
 */
export function markdownToText(markdown) {
  if (!markdown) return '';
  
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic
    .replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Count words in text (ignoring markdown syntax)
 */
export function countWords(text) {
  if (!text) return 0;
  
  const plainText = markdownToText(text);
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Count characters in text (ignoring markdown syntax)
 */
export function countCharacters(text) {
  if (!text) return 0;
  
  const plainText = markdownToText(text);
  return plainText.length;
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(text) {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = countWords(text);
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, minutes);
}

/**
 * Generate a preview/excerpt from markdown text
 */
export function generatePreview(text, maxLength = 150) {
  if (!text) return '';
  
  const plainText = markdownToText(text);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find a good break point (word boundary)
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0 && lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Validate markdown syntax (basic check)
 */
export function validateMarkdown(text) {
  const errors = [];
  
  if (!text) return { isValid: true, errors };
  
  // Check for unclosed code blocks
  const codeBlocks = (text.match(/```/g) || []).length;
  if (codeBlocks % 2 !== 0) {
    errors.push('Unclosed code block detected');
  }
  
  // Check for unmatched brackets in links
  const openBrackets = (text.match(/\[/g) || []).length;
  const closeBrackets = (text.match(/\]/g) || []).length;
  const openParens = (text.match(/\(/g) || []).length;
  const closeParens = (text.match(/\)/g) || []).length;
  
  if (openBrackets !== closeBrackets) {
    errors.push('Unmatched square brackets in links');
  }
  
  if (openParens !== closeParens) {
    errors.push('Unmatched parentheses in links');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Add common markdown shortcuts
 */
export function insertMarkdown(text, cursorPosition, type) {
  const before = text.slice(0, cursorPosition);
  const after = text.slice(cursorPosition);
  
  let insertion = '';
  let newCursorPosition = cursorPosition;
  
  switch (type) {
    case 'bold':
      insertion = '**bold text**';
      newCursorPosition = cursorPosition + 2;
      break;
    case 'italic':
      insertion = '*italic text*';
      newCursorPosition = cursorPosition + 1;
      break;
    case 'link':
      insertion = '[link text](url)';
      newCursorPosition = cursorPosition + 1;
      break;
    case 'code':
      insertion = '`code`';
      newCursorPosition = cursorPosition + 1;
      break;
    case 'heading1':
      insertion = '# Heading 1';
      newCursorPosition = cursorPosition + 2;
      break;
    case 'heading2':
      insertion = '## Heading 2';
      newCursorPosition = cursorPosition + 3;
      break;
    case 'heading3':
      insertion = '### Heading 3';
      newCursorPosition = cursorPosition + 4;
      break;
    case 'list':
      insertion = '- List item';
      newCursorPosition = cursorPosition + 2;
      break;
    case 'quote':
      insertion = '> Quote text';
      newCursorPosition = cursorPosition + 2;
      break;
    default:
      return { text, cursorPosition };
  }
  
  return {
    text: before + insertion + after,
    cursorPosition: newCursorPosition
  };
}
