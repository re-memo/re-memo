import React, { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/MainLayout";
import JournalPage from "@/pages/JournalPage";
import ChatPage from "@/pages/ChatPage";
import AllJournalsPage from "@/pages/AllJournalsPage";

import api from "@/services/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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
          <Toaster />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
