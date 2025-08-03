import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

/**
 * Custom hook for managing journal entries
 */
export function useEntries() {
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total_pages: 0,
    has_prev: false,
    has_next: false
  });

  const fetchEntries = useCallback(async (page = 1, limit = 20, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.getEntries(page, limit, search);
      setEntries(response.entries);
      setPagination({
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        has_prev: response.has_prev,
        has_next: response.has_next
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (entryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.createEntry(entryData);
      // Add new entry to the beginning of the list
      setEntries(prev => [response.entry, ...prev]);
      return response.entry;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEntry = useCallback(async (id, entryData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.updateEntry(id, entryData);
      // Update entry in the list
      setEntries(prev => prev.map(entry =>
        entry.id === id ? response.entry : entry
      ));
      return response.entry;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await api.journal.deleteEntry(id);
      // Remove entry from the list
      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeEntry = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.completeEntry(id);
      // Update entry status
      setEntries(prev => prev.map(entry =>
        entry.id === id ? response.entry : entry
      ));
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial entries
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    pagination,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    completeEntry
  };
}

/**
 * Custom hook for managing a single journal entry
 */
export function useEntry(id) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEntry = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.getEntry(id);
      setEntry(response.entry);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateEntry = useCallback(async (entryData) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.updateEntry(id, entryData);
      setEntry(response.entry);
      return response.entry;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const completeEntry = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.journal.completeEntry(id);
      setEntry(response.entry);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const deleteEntry = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      await api.journal.deleteEntry(id);
      setEntry(null); // Clear entry after deletion
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  return {
    entry,
    loading,
    error,
    refetch: fetchEntry,
    updateEntry,
    deleteEntry,
    completeEntry
  };
}

/**
 * Custom hook for managing chat functionality
 */
export function useChat(sessionId = 'default') {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const loadChatHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.chat.getChatHistory(sessionId);
      setMessages(response.messages);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (message) => {
    try {
      setIsTyping(true);
      setError(null);

      // Add user message immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await api.chat.sendMessage(message, sessionId);

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        context_facts_used: response.context_facts_used,
        relevant_facts: response.relevant_facts
      };
      setMessages(prev => [...prev, aiMessage]);

      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setIsTyping(false);
    }
  }, [sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  // Load initial chat history
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  return {
    messages,
    loading,
    error,
    isTyping,
    sendMessage,
    clearChat,
    refetch: loadChatHistory
  };
}

/**
 * Custom hook for managing topics and suggestions
 */
export function useTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.getTopics();
      setTopics(response);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestion = useCallback(async (topic) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.getSuggestion(topic);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const suggestTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.suggestTopics();
      return response.suggested_topics;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial topics
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,
    loading,
    error,
    fetchTopics,
    getSuggestion,
    suggestTopics
  };
}

/**
 * Custom hook for AI insights and analytics
 */
export function useInsights() {
  const [insights, setInsights] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getQuickInsights = useCallback(async (days = 7) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.chat.getQuickInsights(days);
      setInsights(response.insights);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzePatterns = useCallback(async (days = 30) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.analyzePatterns(days);
      setPatterns(response);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reviewEntry = useCallback(async (entryId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.reviewEntry(entryId);
      return response;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    insights,
    patterns,
    loading,
    error,
    getQuickInsights,
    analyzePatterns,
    reviewEntry
  };
}

/**
 * Custom hook for auto-saving functionality
 */
export function useAutoSave(saveFunction, delay = 2000) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!saveFunction) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSaving(true);
        await saveFunction();
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [saveFunction, delay]);

  return {
    isSaving,
    lastSaved
  };
}
