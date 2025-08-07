import React, { useEffect, useState } from "react";
import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ui/chat-bubble";
import { useAsyncOperation } from "@/hooks/useCommon";
import { Button } from "./ui/button";
import { ErrorMessage } from "./ErrorBoundary";
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
  const { isLoading, error, execute: executeReview } = useAsyncOperation();

  useEffect(() => {
    if (!entryID) return;

    const fetchReview = async () => {
      try {
        await executeReview(async () => {
          const response = await api.ai.reviewEntry(entryID);
          setReview(response);
        });
      } catch (error) {
        console.error("Error fetching review:", error);
        setReview("NO_REVIEW");
      }
    };

    fetchReview();
  }, [entryID]);

  const handleRetry = () => {
    setReview(null);
    const fetchReview = async () => {
      try {
        await executeReview(async () => {
          const response = await api.ai.reviewEntry(entryID);
          setReview(response);
        });
      } catch (error) {
        console.error("Error fetching review:", error);
        setReview("NO_REVIEW");
      }
    };
    fetchReview();
  };

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
        {/* Review Section Header */}
        <div className="p-6 flex-shrink-0">
          <h3 className="text-2xl text-foreground font-medium">
            <span className="text-muted-foreground">re:</span>
            <span className="text-foreground">view</span>
          </h3>
        </div>

        {/* Scrollable Review Content */}
        <div className="flex-[1_1_0] flex flex-col px-6 pb-6 overflow-hidden">
          <div className="flex-1 flex flex-col space-y-4 overflow-y-auto text-sm pr-2">
            {error && (
              <ErrorMessage error={error} onRetry={handleRetry} />
            )}
            {isLoading && <LoadingBubbles />}
            {!isLoading && !error && review && review.fact_reviews &&
              review.fact_reviews.map((factReview, index) => (
                <React.Fragment key={index}>
                  <ChatBubble
                    role="user"
                    className="bg-secondary text-foreground opacity-0 animate-fade-in"
                    style={{
                      animationDelay: `${index * 400 - 200}ms`,
                      animationDuration: "300ms",
                      animationFillMode: "forwards",
                    }}
                  >
                    "{factReview.original_snippet}"
                  </ChatBubble>
                  <ChatBubble
                    role="assistant"
                    className="bg-primary text-foreground opacity-0 animate-fade-in"
                    style={{
                      animationDelay: `${index * 400}ms`,
                      animationDuration: "300ms",
                      animationFillMode: "forwards",
                    }}
                  >
                    {factReview.review}
                  </ChatBubble>
                </React.Fragment>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewSidebar;
