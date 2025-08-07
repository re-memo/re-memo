import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, Archive, MessageSquare, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboard, useScreenReader, ARIA } from "@/utils/accessibility";
import { ROUTES } from "@/constants";

const LeftSidebar = ({ isOpen = true, onToggle, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const announce = useScreenReader();

  const mockJournals = [
    // { id: "2", title: "My hackathon win!", date: "30/7/2025", isSticky: false },
    // { id: "3", title: "I miss her.", date: "29/7/2025", isSticky: false },
  ];

  const handleNavigation = (path, description) => {
    navigate(path);
    announce(`Navigated to ${description}`, 'polite');
    if (isMobile && onToggle) {
      onToggle();
    }
  };

  // Keyboard navigation for sidebar
  useKeyboard(['Escape'], () => {
    if (isMobile && isOpen && onToggle) {
      onToggle();
      announce('Sidebar closed', 'polite');
    }
  });

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      <div
        className={cn(
          "flex flex-col border-r-4 border-black bg-card",
          isMobile ? "fixed left-0 top-0 h-full z-50 w-80" : "w-80"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-card h-[73px]">
          <div className="flex items-center space-x-0">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-2 mr-3"
              >
                <Menu size={16} />
              </Button>
            )}
            <span className="text-2xl font-semibold text-muted-foreground">
              re:
            </span>
            <span className="text-2xl font-semibold text-foreground">memo</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="py-4">
          <div className="text-sm text-muted-foreground tracking-wide mb-2 px-4">
            need anything?
          </div>
          <Button
            variant="ghost"
            className={cn("w-full justify-start text-left rounded-none")}
            onClick={() => handleNavigation(ROUTES.JOURNAL_NEW, "new entry")}
            {...ARIA.button(false, false, "new-entry-help")}
          >
            <Plus size={16} className="mr-2" />
            new entry.
          </Button>
          <p id="new-entry-help" className="sr-only">Create a new journal entry</p>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left rounded-none",
              (location.pathname === "/" ||
                location.pathname === "/journals") &&
                "bg-accent text-accent-foreground border-l-4 border-blue-500"
            )}
            onClick={() => handleNavigation(ROUTES.JOURNALS, "all journals")}
            {...ARIA.button(
              location.pathname === "/" || location.pathname === "/journals",
              false,
              "all-journals-help"
            )}
          >
            <Archive size={16} className="mr-2" />
            all journals.
          </Button>
          <p id="all-journals-help" className="sr-only">View all journal entries</p>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left rounded-none",
              location.pathname.startsWith("/chat") &&
                "bg-accent text-accent-foreground border-l-4 border-blue-500"
            )}
            onClick={() => handleNavigation(ROUTES.CHAT, "reflection chat")}
            {...ARIA.button(
              location.pathname.startsWith("/chat"),
              false,
              "chat-help"
            )}
          >
            <MessageSquare size={16} className="mr-2" />
            <span className="text-muted-foreground">re:</span>
            <span>flect</span>
          </Button>
          <p id="chat-help" className="sr-only">Open AI reflection chat</p>
        </div>

        {/* Favourite Notes Section */}
        <div className="mt-6">
          <div className="text-sm text-muted-foreground tracking-wide mb-2 px-4">
            favourite notes.
          </div>
          <div className="">
            {mockJournals.map((journal) => (
              <div
                key={journal.id}
                className={cn(
                  "flex items-center space-x-2 py-2 rounded-none cursor-pointer hover:bg-accent hover:text-accent-foreground px-4",
                  location.pathname.includes(`/journal/${journal.id}`) &&
                    "bg-accent text-accent-foreground border-l-4 border-blue-500"
                )}
                onClick={() => navigate(`/journal/${journal.id}`)}
              >
                <Star size={14} className="text-yellow-500" />
                <span className="text-sm text-foreground">
                  {journal.date} - {journal.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftSidebar;
