import { ErrorMessage } from "@/components/ErrorBoundary";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAsyncOperation } from "@/hooks/useCommon";
import { useMemoizedValue, useThrottle } from "@/hooks/usePerformance";
import { useKeyboard, useScreenReader } from "@/utils/accessibility";
import { formatDate } from "@/utils/helpers";
import { RateLimiter, validateSearchQuery } from "@/utils/security";
import { eachDayOfInterval, endOfToday, format, subDays } from 'date-fns';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';

// Rate limiting for reflections
const reflectionRateLimiter = new RateLimiter(10, 60000); // 10 calls per minute

const LoadingBubbles = () => (
  <ChatBubble className="bg-secondary text-foreground animate-fade-in">
    <span className="inline-block w-8 text-left">
      <span className="animate-dots">.</span>
    </span>
  </ChatBubble>
);

const ChatPage = () => {
  const { sessionId } = useParams();
  
  // State management
  const [prompt, setPrompt] = useState('');
  const [cards, setCards] = useState([]);
  const [reflection, setReflection] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Async operations
  const { isLoading, error, execute: executeReflection } = useAsyncOperation();
  const announce = useScreenReader();

  // Memoized heatmap data generation for performance
  const generateHeatmapData = useMemoizedValue(() => {
    if (!cards.length) return [];
    
    const endDate = endOfToday();
    const startDate = subDays(endDate, 34); // 35 days = 5 weeks
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const noteCounts = cards.reduce((acc, note) => {
      const key = format(new Date(note.date), 'yyyy-MM-dd');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const heatmap = days.map((date) => ({
      date,
      count: noteCounts[format(date, 'yyyy-MM-dd')] || 0,
    }));

    while (heatmap.length < 35) {
      const padDate = subDays(heatmap[0].date, 1);
      heatmap.unshift({ date: padDate, count: 0 });
    }

    return heatmap;
  }, [cards]);

  const getColorClass = useCallback((count) => {
    if (count === 0) return 'bg-muted';
    if (count < 2) return 'bg-green-100';
    if (count < 4) return 'bg-green-300';
    if (count < 6) return 'bg-green-500';
    return 'bg-green-700';
  }, []);

  // Throttled fetch function to prevent spam
  const throttledFetch = useThrottle(async (query) => {
    const { isValid, sanitized } = validateSearchQuery(query);
    if (!isValid) {
      announce('Invalid search query', 'assertive');
      return;
    }

    // Check rate limiting
    if (!reflectionRateLimiter.canMakeCall()) {
      const waitTime = Math.ceil(reflectionRateLimiter.getTimeUntilReset() / 1000);
      announce(`Rate limited. Please wait ${waitTime} seconds.`, 'assertive');
      return;
    }

    try {
      await executeReflection(async () => {
        // Clear previous results
        setReflection('');
        setCards([]);

        const resp = await fetch(
          `/ai/get-reflection`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sanitized, limit: 5 }),
          },
        );
        
        if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
        const data = await resp.json();

        setReflection(data.reflection || '');
        setCards(data.notes || []);
        announce(`Found ${data.notes?.length || 0} related notes`, 'polite');
      });
    } catch (err) {
      console.error('Error fetching reflection:', err);
      announce('Failed to fetch reflection', 'assertive');
    }
  }, 2000);

  const fetchReflection = useCallback(() => {
    if (!prompt.trim()) return;
    throttledFetch(prompt);
  }, [prompt, throttledFetch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReflection();
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
    setModalOpen(true);
    announce(`Opened note: ${note.title || 'Untitled'}`, 'polite');
  };

  // Keyboard shortcuts
  useKeyboard(['Enter'], (e) => {
    if (e.target.tagName === 'INPUT' && e.ctrlKey) {
      e.preventDefault();
      fetchReflection();
    }
  });

  useKeyboard(['Escape'], () => {
    if (modalOpen) {
      setModalOpen(false);
      announce('Note dialog closed', 'polite');
    }
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Error Display */}
      {error && (
        <ErrorMessage error={error} onRetry={fetchReflection} className="mb-6" />
      )}

      {/* Prompt input */}
      <div className="py-6">
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Find accurate notes, explore or bet on serendipity (Ctrl+Enter to search)"
            className="w-full"
            disabled={isLoading}
            aria-label="Search query"
            aria-describedby="search-help"
          />
          <p id="search-help" className="text-xs text-muted-foreground mt-1">
            Use Ctrl+Enter to search, or press Enter in the input field
          </p>
        </form>
      </div>

      {/* Loading indicator */}
      {isLoading && <LoadingBubbles />}

      {cards.length > 0 && (
        <div className="mb-6 flex flex-row gap-6 overflow-x-auto">
          {/* Heatmap block */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">
              Note activity (last 5 weeks)
            </h3>

            <div className="flex justify-center">
              <div className="grid grid-cols-7 grid-rows-5 gap-1" role="img" aria-label="Activity heatmap">
                {(() => {
                  const data = generateHeatmapData;
                  const weeks = Array.from({ length: 5 }, (_, i) =>
                    data.slice(i * 7, i * 7 + 7)
                  );
                  const transposed = Array.from({ length: 7 }, (_, dayIdx) =>
                    weeks.map((week) => week[dayIdx])
                  );

                  return transposed.flat().map((day, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-sm ${getColorClass(day?.count || 0)}`}
                      title={day ? `${formatDate(day.date)}: ${day.count} notes` : 'No data'}
                    />
                  ));
                })()}
              </div>
            </div>

            <div className="mt-2 flex justify-center items-center text-[10px] text-muted-foreground gap-2">
              <span>Less</span>
              <div className="flex space-x-1">
                <span className="w-3 h-3 rounded-sm bg-muted"></span>
                <span className="w-3 h-3 rounded-sm bg-green-100"></span>
                <span className="w-3 h-3 rounded-sm bg-green-300"></span>
                <span className="w-3 h-3 rounded-sm bg-green-500"></span>
                <span className="w-3 h-3 rounded-sm bg-green-700"></span>
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Horizontal card carousel */}
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {cards.map((note, idx) => (
              <div
                key={note.id || idx}
                onClick={() => handleNoteClick(note)}
                className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm text-foreground cursor-pointer hover:shadow-md transition"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNoteClick(note);
                  }
                }}
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {note.title || `Note ${idx + 1}`}
                </h3>
                {note.date && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(note.date, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
      </div>
    )}

      {/* Reflection display block */}
      {reflection && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-lg font-semibold">Reflection</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
            {reflection
              .split('.')
              .map((sentence) => sentence.trim())
              .filter(Boolean)
              .map((sentence, idx) => (
                <li key={idx}>{sentence}.</li>
              ))}
          </ul>
        </div>
      )}

      {/* --- Note Modal --- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl" aria-labelledby="note-title">
          {selectedNote && (
            <div className="space-y-4">
              <h2 id="note-title" className="text-xl font-semibold text-foreground">
                {selectedNote.title || 'Untitled Note'}
              </h2>
              {selectedNote.date && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedNote.date, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              )}
              <div className="whitespace-pre-wrap text-sm text-foreground max-h-96 overflow-y-auto">
                {selectedNote.content}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ChatPage;
