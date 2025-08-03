import React, { useEffect, useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ui/chat-bubble";
import { useTopics } from "@/hooks/useApi";
import { Button } from "./ui/button";
import api from "@/services/api";

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

const ReviewSidebar = ({ isOpen, onToggle, isMobile, entryID }) => {
  const [review, setReview] = useState(null);

  useEffect(() => {
    // Fetch the review once
    const fetchReview = async () => {
      try {
        const response = await api.ai.reviewEntry(entryID);
        setReview(response);
      } catch (error) {
        console.error("Error fetching review:", error);
        setReview("NO_REVIEW");
      }
    };
    fetchReview();
  }, [entryID]);

  if (!isOpen) return null;

  if (review === "NO_REVIEW") {
    return null;
  }

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
        {/* Review Section */}
        <h3 className="text-2xl text-foreground p-6 font-medium">
          <span className="text-muted-foreground">re:</span>
          <span className="text-foreground">view</span>
        </h3>
        <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden text-sm">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
            {!review && <LoadingBubbles />}
            {review &&
              review.fact_reviews.map((factReview, index) => (
                <>
                  <ChatBubble
                    role="user"
                    key={index}
                    className="bg-secondary text-foreground"
                  >
                    You said: "{factReview.original_snippet}"
                  </ChatBubble>
                  <ChatBubble
                    role="assistant"
                    key={`review-${index}`}
                    className="bg-primary text-foreground"
                  >
                    {factReview.review}
                  </ChatBubble>
                </>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewSidebar;
