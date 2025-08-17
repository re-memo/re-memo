import { config } from '@/config/env';
import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error handling class
class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    const status = error.response?.status;
    const code = error.response?.data?.code || error.code;
    const details = error.response?.data?.details;

    console.error('API Response Error:', { message, status, code, details });

    // Handle common errors
    if (status === 401) {
      console.warn('Unauthorized access');
    } else if (status >= 500) {
      console.error('Server error occurred');
    }

    // Create enhanced error object
    const apiError = new ApiError(message, status, code, details);
    return Promise.reject(apiError);
  }
);

/**
 * API client for re:memo backend
 */
const api = {
  // Journal operations
  journal: {
    /**
     * Get all journal entries with pagination
     */
    getEntries: async (page = 1, limit = 20, search = '') => {
      const response = await apiClient.get('/journal/entries', {
        params: { page, limit, search }
      });
      return response.data;
    },

    /**
     * Create a new journal entry
     */
    createEntry: async (entryData) => {
      const response = await apiClient.post('/journal/entries', entryData);
      return response.data;
    },

    /**
     * Get a specific journal entry by ID
     */
    getEntry: async (id) => {
      const response = await apiClient.get(`/journal/entries/${id}`);
      return response.data;
    },

    /**
     * Update a journal entry
     */
    updateEntry: async (id, entryData) => {
      const response = await apiClient.put(`/journal/entries/${id}`, entryData);
      return response.data;
    },

    /**
     * Delete a journal entry
     */
    deleteEntry: async (id) => {
      const response = await apiClient.delete(`/journal/entries/${id}`);
      return response.data;
    },

    /**
     * Mark entry as complete and trigger AI processing
     */
    completeEntry: async (id) => {
      const response = await apiClient.post(`/journal/entries/${id}/complete`);
      return response.data;
    },

    /**
     * Get facts for a specific entry
     */
    getEntryFacts: async (id) => {
      const response = await apiClient.get(`/journal/entries/${id}/facts`);
      return response.data;
    },

    /**
     * Get journal statistics
     */
    getStats: async () => {
      const response = await apiClient.get('/journal/stats');
      return response.data;
    },
  },

  // AI operations
  ai: {
    /**
     * Process an entry to extract facts
     */
    processEntry: async (entryId) => {
      const response = await apiClient.post('/ai/process-entry', {
        entry_id: entryId
      });
      return response.data;
    },

    /**
     * Review an entry
     */
    reviewEntry: async (entryId) => {
      const response = await apiClient.post('/ai/review-entry', {
        entry_id: entryId
      }, { timeout: 60000 });
      return response.data;
    },

    /**
     * Get recent topics for suggestions
     */
    getTopics: async (limit = 6) => {
      const response = await apiClient.get('/ai/topics', {
        params: { limit }
      });
      return response.data;
    },

    /**
     * Generate a writing prompt for a topic
     */
    getSuggestion: async (topic) => {
      const response = await apiClient.post('/ai/suggest-prompt', {
        topic
      });
      return response.data;
    },

    /**
     * Generate an AI review for an entry
     */
    reviewEntry: async (entryId) => {
      const response = await apiClient.post('/ai/review-entry', {
        entry_id: entryId
      });
      return response.data;
    },

    /**
     * Search for similar facts
     */
    searchSimilar: async (query, limit = 10, similarityThreshold = 0.7) => {
      const response = await apiClient.post('/ai/search-similar', {
        query,
        limit,
        similarity_threshold: similarityThreshold
      });
      return response.data;
    },

    /**
     * Get topic clusters
     */
    getTopicClusters: async (topic = null, nClusters = 5) => {
      const response = await apiClient.get('/ai/topic-clusters', {
        params: { topic, n_clusters: nClusters }
      });
      return response.data;
    },

    /**
     * Get suggested topics for exploration
     */
    suggestTopics: async (limit = 5) => {
      const response = await apiClient.get('/ai/suggest-topics', {
        params: { limit }
      });
      return response.data;
    },

    /**
     * Analyze patterns in journaling
     */
    analyzePatterns: async (days = 30) => {
      const response = await apiClient.get('/ai/analyze-patterns', {
        params: { days }
      });
      return response.data;
    },

    /**
     * Check AI services health
     */
    healthCheck: async () => {
      const response = await apiClient.get('/ai/health');
      return response.data;
    },
  },

  // Chat operations
  chat: {
    /**
     * Send a chat message and get AI response
     */
    sendMessage: async (message, sessionId = 'default') => {
      const response = await apiClient.post('/chat/message', {
        message,
        session_id: sessionId
      });
      return response.data;
    },

    /**
     * Get chat history for a session
     */
    getChatHistory: async (sessionId = 'default', limit = 20) => {
      const response = await apiClient.get('/chat/history', {
        params: { session_id: sessionId, limit }
      });
      return response.data;
    },

    /**
     * Get all chat sessions
     */
    getSessions: async () => {
      const response = await apiClient.get('/chat/sessions');
      return response.data;
    },

    /**
     * Delete a chat session
     */
    deleteSession: async (sessionId) => {
      const response = await apiClient.delete(`/chat/sessions/${sessionId}`);
      return response.data;
    },

    /**
     * Get suggested questions based on journal content
     */
    suggestQuestions: async (topic = '') => {
      const response = await apiClient.post('/chat/suggest-questions', {
        topic
      });
      return response.data;
    },

    /**
     * Get quick insights from recent entries
     */
    getQuickInsights: async (days = 7) => {
      const response = await apiClient.get('/chat/quick-insights', {
        params: { days }
      });
      return response.data;
    },

    /**
     * Export chat history
     */
    exportChat: async (sessionId = 'default', format = 'json') => {
      const response = await apiClient.get('/chat/export-chat', {
        params: { session_id: sessionId, format }
      });
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
