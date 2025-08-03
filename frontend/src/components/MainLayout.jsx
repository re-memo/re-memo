import React, { useState, useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import ReviewSidebar from "./ReviewSidebar";

const MainLayout = () => {
  const { id: entryID } = useParams();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-card h-[73px] relative">
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

          {/* Right Sidebar if route isn't a journal entry */}
          {!window.location.pathname.startsWith("/journal/") && (
            <RightSidebar
              isOpen={rightSidebarOpen}
              onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
              isMobile={isMobile}
            />
          )}

          {/* Review Sidebar for journal entries, bit hacky 30 mins left */}
          {window.location.pathname.startsWith("/journal/") && (
            <ReviewSidebar
              isOpen={rightSidebarOpen}
              onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
              isMobile={isMobile}
              entryID={entryID}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
