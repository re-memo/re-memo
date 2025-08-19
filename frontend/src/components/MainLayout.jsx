import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { STORAGE_KEYS } from "@/constants";
import { useDebounce, useLocalStorage, useResponsive } from "@/hooks/useCommon";
import { useThrottle } from "@/hooks/usePerformance";
import { cn } from "@/lib/utils";
import { validateSearchQuery } from "@/utils/security";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import LeftSidebar from "./LeftSidebar";
import ReviewSidebar from "./ReviewSidebar";
import RightSidebar from "./RightSidebar";

const MainLayout = () => {
  const { id: entryID } = useParams();
  const location = useLocation();
  const { isMobile } = useResponsive();

  const [darkMode, setDarkMode] = useLocalStorage(
    STORAGE_KEYS.DARK_MODE,
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Throttled search handler to prevent excessive API calls
  const throttledSearch = useThrottle((query) => {
    const { isValid, sanitized } = validateSearchQuery(query);
    if (isValid && sanitized.length > 2) {
      // Trigger search API call here if needed
      console.log("Searching for:", sanitized);
    }
  }, 1000);

  // Handle search query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      throttledSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, throttledSearch]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      setLeftSidebarOpen(true);
    }
  }, [isMobile]);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const isJournalRoute = location.pathname.startsWith("/journal/");

  return (
    <div className={cn("flex h-screen", darkMode ? "dark" : "")}>
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={leftSidebarOpen}
        onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b-4 border-border bg-card h-[73px] relative">
          {/* Hacky hide the left sidebar border with the background color */}
          {!isMobile && (
            <div className="absolute inset-0 -left-3 w-4 z-50 bg-card" />
          )}
          <div className="flex items-center space-x-4">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                className="p-2"
              >
                <Menu size={16} />
              </Button>
            )}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  placeholder="search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 bg-transparent focus:ring-0 focus:border-0 text-md"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              className="p-2"
            >
              <Menu size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="p-2"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex dark:bg-neutral-900">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Review Sidebar for journal entries */}
          {isJournalRoute && (
            <ReviewSidebar
              isOpen={rightSidebarOpen}
              onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
              isMobile={isMobile}
              entryID={entryID}
            />
          )}

          {/* Right Sidebar */}
          <RightSidebar
            isOpen={rightSidebarOpen}
            onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
