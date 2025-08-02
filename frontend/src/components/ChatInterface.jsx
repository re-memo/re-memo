import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChat, useInsights } from '@/hooks/useApi';
import { 
  Send, 
  MessageSquare, 
  Bot, 
  User, 
  Lightbulb, 
  Loader2,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';

const ChatInterface = ({ sessionId = 'default', className = '' }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { 
    messages, 
    loading, 
    error, 
    isTyping, 
    sendMessage, 
    clearChat, 
    refetch 
  } = useChat(sessionId);
  
  const { getQuickInsights } = useInsights();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load quick insights for suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await getQuickInsights(7);
        setSuggestions([
          "What patterns do you notice in your recent entries?",
          "How have you grown this week?",
          "What insights can you share about my journaling habits?",
          "What topics should I explore more deeply?",
          "Can you help me reflect on my recent experiences?"
        ]);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };
    
    if (messages.length === 0) {
      loadSuggestions();
    }
  }, [messages.length, getQuickInsights]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isTyping) return;

    setInput('');
    setSuggestions([]); // Clear suggestions after first message
    
    try {
      await sendMessage(message);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI Chat Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me about your journal entries, get insights, or just chat about your thoughts.
              </p>
              
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="block w-full text-left p-2 rounded-md text-sm bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Lightbulb className="h-3 w-3 inline mr-2" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto inline-block'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatTime(message.timestamp)}</span>
                      {message.context_facts_used > 0 && (
                        <span className="flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {message.context_facts_used} facts used
                        </span>
                      )}
                    </div>
                    
                    {/* Show relevant facts */}
                    {message.relevant_facts && message.relevant_facts.length > 0 && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                        <p className="font-medium mb-1">Related from your journal:</p>
                        {message.relevant_facts.slice(0, 2).map((fact, factIndex) => (
                          <p key={factIndex} className="text-muted-foreground">
                            • {fact.content}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask me anything about your journal..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="sm"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Quick suggestions when input is focused */}
        {input === '' && suggestions.length > 0 && messages.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestions.slice(3, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs bg-muted/50 hover:bg-muted px-2 py-1 rounded transition-colors"
              >
                {suggestion.length > 30 ? suggestion.substring(0, 30) + '...' : suggestion}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
