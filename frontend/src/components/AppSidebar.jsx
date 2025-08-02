import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTopics } from '@/hooks/useApi';
import { Lightbulb, RefreshCw, Clock, Hash, TrendingUp } from 'lucide-react';

const AppSidebar = ({ onTopicSelect, onSuggestionRequest }) => {
  const { topics, loading, fetchTopics, getSuggestion } = useTopics();
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic.topic);
    if (onTopicSelect) {
      onTopicSelect(topic.topic);
    }
  };

  const handleGetSuggestion = async (topic) => {
    if (!topic && !selectedTopic) return;
    
    try {
      setLoadingSuggestion(true);
      const topicToUse = topic || selectedTopic;
      const response = await getSuggestion(topicToUse);
      
      if (onSuggestionRequest) {
        onSuggestionRequest(response.prompt, topicToUse);
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Writing Inspiration
        </h2>
        <p className="text-sm text-sidebar-foreground/80">
          Explore your recent topics and get AI-powered writing suggestions.
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="bg-sidebar-accent/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleGetSuggestion('reflection')}
            disabled={loadingSuggestion}
          >
            {loadingSuggestion ? (
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="h-3 w-3 mr-2" />
            )}
            Get Random Prompt
          </Button>
          
          {selectedTopic && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={() => handleGetSuggestion()}
              disabled={loadingSuggestion}
            >
              <TrendingUp className="h-3 w-3 mr-2" />
              Explore "{selectedTopic}"
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Topics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Recent Topics
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTopics}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && topics.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No topics yet. Start journaling to see your themes!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {topics.slice(0, 10).map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicClick(topic)}
                  className={`w-full text-left p-2 rounded-md transition-colors hover:bg-accent group ${
                    selectedTopic === topic.topic ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize truncate">
                        {topic.topic}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{topic.fact_count} facts</span>
                        {topic.latest_timestamp && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(topic.latest_timestamp)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetSuggestion(topic.topic);
                      }}
                      disabled={loadingSuggestion}
                    >
                      <Lightbulb className="h-3 w-3" />
                    </Button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Writing Prompts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Daily Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "What am I most grateful for today?",
              "What challenged me and how did I grow?",
              "What would I tell my past self?",
              "What small win can I celebrate?",
              "What am I looking forward to?"
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => onSuggestionRequest && onSuggestionRequest(prompt, 'daily-prompt')}
                className="w-full text-left p-2 rounded-md text-sm hover:bg-accent transition-colors group"
              >
                <p className="text-muted-foreground group-hover:text-foreground">
                  {prompt}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-2">💡 Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click topics to explore related prompts</li>
            <li>• AI analyzes completed entries for insights</li>
            <li>• Use prompts as starting points for reflection</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSidebar;
