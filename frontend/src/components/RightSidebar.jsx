import React, { useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ui/chat-bubble";
import { useTopics } from "@/hooks/useApi";
import { useAsyncOperation } from "@/hooks/useCommon";
import { useMemoizedValue } from "@/hooks/usePerformance";
import { Button } from "./ui/button";
import { RateLimiter } from "@/utils/security";

// Create rate limiter instance for suggestions
const suggestionRateLimiter = new RateLimiter(5, 60000); // 5 calls per minute

// Loading animation component for animated dots
const LoadingBubbles = () => {
  return (
    <ChatBubble className="bg-secondary text-foreground animate-fade-in">
      <span className="inline-block w-8 text-left">
        <span className="animate-dots">.</span>
      </span>
    </ChatBubble>
  );
};

const RightSidebar = ({ isOpen, onToggle, isMobile }) => {
  const { topics, getSuggestion, topicsLoading } = useTopics();
  const [suggestion, setSuggestion] = useState(null);
  const { isLoading: suggestionLoading, execute: executeSuggestion } = useAsyncOperation();

  // Memoize processed sentences to avoid recalculation
  const processedSuggestion = useMemoizedValue(() => {
    if (!suggestion?.prompt) return [];
    
    // Smart sentence splitting that handles various punctuation
    return suggestion.prompt
      .split(/([.!?]+\s+)/)
      .reduce((acc, part, index, array) => {
        if (index % 2 === 0) {
          const nextPart = array[index + 1];
          if (nextPart) {
            acc.push(part + nextPart);
          } else if (part.trim()) {
            acc.push(part);
          }
        }
        return acc;
      }, [])
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
  }, [suggestion?.prompt]);

  const suggestTopic = async (topic) => {
    // Check rate limiting
    if (!suggestionRateLimiter.canMakeCall()) {
      const waitTime = Math.ceil(suggestionRateLimiter.getTimeUntilReset() / 1000);
      console.warn(`Rate limited. Try again in ${waitTime} seconds.`);
      return;
    }

    try {
      await executeSuggestion(async () => {
        setSuggestion(null); // Clear previous suggestion
        const response = await getSuggestion(topic);
        setSuggestion(response);
      });
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      setSuggestion({ prompt: "Failed to fetch suggestion. Please try again." });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      <div
        className={cn(
          "flex flex-col w-80 border-l-4 border-black bg-card h-full",
          isMobile && "fixed right-0 top-0 h-full z-50"
        )}
      >
        {/* Topics Section */}
        <div className="p-6 space-y-6 flex-shrink-0">
          <div>
            <h3 className="text-lg text-foreground mb-4">
              help me write about
            </h3>
            <div className="flex flex-col">
              {topics.map(({ topic }) => (
                <Button
                  variant="ghost"
                  key={topic}
                  className={cn(
                    "px-4 py-2 rounded-md text-md font-medium cursor-pointer flex space-x-3 justify-start"
                  )}
                  onClick={() => suggestTopic(topic)}
                  disabled={topicsLoading}
                >
                  <MessageSquareDashed size={24} />
                  <span className="text-foreground font-medium">{topic}.</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions Section */}
        <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {suggestionLoading && <LoadingBubbles />}
            {!suggestionLoading && processedSuggestion.length > 0 &&
              processedSuggestion.map((sentence, index) => (
                <ChatBubble 
                  key={index} 
                  className={cn(
                    "bg-secondary text-foreground opacity-0 animate-fade-in"
                  )}
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animationDuration: '400ms',
                    animationFillMode: 'forwards'
                  }}
                >
                  {sentence}
                </ChatBubble>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;
