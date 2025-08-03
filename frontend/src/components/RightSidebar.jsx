import React, { useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ui/chat-bubble";
import { useTopics } from "@/hooks/useApi";
import { Button } from "./ui/button";

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
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const suggestTopic = async (topic) => {
    try {
      setSuggestionLoading(true);
      setSuggestion(null); // Clear previous suggestion
      const response = await getSuggestion(topic);
      setSuggestion(response);
    } catch (error) {
      console.error("Error fetching suggestion:", error);
      setSuggestion("Failed to fetch suggestion. Please try again.");
    } finally {
      setSuggestionLoading(false);
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
            {!suggestionLoading && suggestion &&
              (() => {
                // Smart sentence splitting that handles various punctuation
                const sentences = suggestion.prompt
                  .split(/([.!?]+\s+)/)
                  .reduce((acc, part, index, array) => {
                    if (index % 2 === 0) {
                      // Text part
                      const nextPart = array[index + 1];
                      if (nextPart) {
                        // Combine with punctuation
                        acc.push(part + nextPart);
                      } else if (part.trim()) {
                        // Last part without punctuation
                        acc.push(part);
                      }
                    }
                    return acc;
                  }, [])
                  .map(sentence => sentence.trim())
                  .filter(sentence => sentence.length > 0);

                return sentences.map((sentence, index) => (
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
                ));
              })()}
          </div>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;
