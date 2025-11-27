import { ErrorBoundary } from "@/components/ErrorBoundary";
import MainLayout from "@/components/MainLayout";
import { DEFAULT_VALUES } from "@/constants";
import AllJournalsPage from "@/pages/AllJournalsPage";
import ChatPage from "@/pages/ChatPage";
import JournalPage from "@/pages/JournalPage";
import LoginPage from "@/pages/LoginPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserRouter, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

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

// Protected route wrapper
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.auth.isAuthenticated());
  const [user, setUser] = useState(api.auth.getUser());

  // Handle successful login
  const handleLogin = useCallback((userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Clear any cached queries to refetch with new user
    queryClient.clear();
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  }, []);

  // Listen for auth:logout events from API interceptor
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.clear();
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  // Verify token on app load
  useEffect(() => {
    if (isAuthenticated) {
      api.auth.me().catch(() => {
        // Token is invalid, log out
        handleLogout();
      });
    }
  }, [isAuthenticated, handleLogout]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground border-2 border-black">
            <Routes>
              {/* Login route */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <LoginPage onLogin={handleLogin} />
                  )
                }
              />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <MainLayout user={user} onLogout={handleLogout} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AllJournalsPage />} />
                <Route path="journals" element={<AllJournalsPage />} />
                <Route path="journal/new" element={<NewEntry />} />
                <Route path="journal/:id" element={<JournalPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:sessionId" element={<ChatPage />} />
              </Route>

              {/* Catch all - redirect to home or login */}
              <Route
                path="*"
                element={
                  isAuthenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: "card text-foreground",
              }}
            />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
