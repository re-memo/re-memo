import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DEFAULT_VALUES } from "@/constants";
import MainLayout from "@/components/MainLayout";
import JournalPage from "@/pages/JournalPage";
import ChatPage from "@/pages/ChatPage";
import AllJournalsPage from "@/pages/AllJournalsPage";

import api from "@/services/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_VALUES.QUERY_STALE_TIME,
      cacheTime: DEFAULT_VALUES.QUERY_CACHE_TIME,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const NewEntry = () => {
  const navigate = useNavigate();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (hasCreated.current) return;

    const createNewEntry = async () => {
      hasCreated.current = true;
      try {
        const response = await api.journal.createEntry({
          title: "New Journal Entry",
          content: "Start writing your thoughts here...",
        });
        navigate(`/journal/${response.entry.id}`);
      } catch (error) {
        console.error("Failed to create new entry:", error);
        hasCreated.current = false; // Reset on error so user can retry
      }
    };
    createNewEntry();
  }, [navigate]);

  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground border-2 border-black">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<AllJournalsPage />} />
                <Route path="journals" element={<AllJournalsPage />} />
                <Route path="journal/new" element={<NewEntry />} />
                <Route path="journal/:id" element={<JournalPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:sessionId" element={<ChatPage />} />
              </Route>
            </Routes>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: "card text-foreground"
              }}
            />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
