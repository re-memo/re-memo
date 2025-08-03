import React from "react";
import { MessageSquareDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ui/chat-bubble";

const RightSidebar = ({ isOpen, onToggle, isMobile }) => {
  const mockTopics = [
    { name: "work" },
    { name: "superiors" },
    { name: "workload" },
    { name: "personal" },
    { name: "family" },
    { name: "future" },
  ];

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
          "w-80 border-l-4 border-black bg-card p-6",
          isMobile && "fixed right-0 top-0 h-full z-50"
        )}
      >
        {/* Topics Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg text-foreground mb-4">help me write about:</h3>
            <div className="flex flex-col">
              {mockTopics.map((tag) => (
                <div
                  key={tag.name}
                  className={cn(
                    "px-4 py-2 rounded-md text-md font-medium cursor-pointer flex space-x-3",
                    tag.color
                  )}
                >
                  <MessageSquareDashed size={24} />
                  <span className="text-foreground font-medium">
                    {tag.name}.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions Section */}
        <div className="mt-6 flex flex-col space-y-4">
          <ChatBubble>
            You could talk about blah blah blah blah blah blah blah blah.
          </ChatBubble>
          <ChatBubble>
            Last week you said...
          </ChatBubble>
        </div>
      </div>
    </>
  );
};

export default RightSidebar;
