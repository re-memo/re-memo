export const ROUTES = {
  HOME: '/',
  JOURNALS: '/journals',
  JOURNAL_NEW: '/journal/new',
  JOURNAL_DETAIL: '/journal/:id',
  CHAT: '/chat',
  CHAT_SESSION: '/chat/:sessionId',
};

export const API_ENDPOINTS = {
  JOURNAL: '/journal',
  AI: '/ai',
  CHAT: '/chat',
};

export const STORAGE_KEYS = {
  DARK_MODE: 'darkMode',
  LAST_SESSION: 'lastSession',
};

export const QUERY_KEYS = {
  ENTRIES: 'entries',
  ENTRY: 'entry',
  TOPICS: 'topics',
  CHAT_HISTORY: 'chatHistory',
};

export const DEFAULT_VALUES = {
  MARKDOWN: `# Untitled Entry
Write your thoughts here...  

You can use **Markdown** syntax to format your text!  
`,
  AUTO_SAVE_DELAY: 2000,
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
};
