import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { eachDayOfInterval, endOfToday, subDays, format, isSameDay, startOfWeek } from 'date-fns';

const LoadingBubbles = () => (
  <ChatBubble className="bg-secondary text-foreground animate-fade-in">
    <span className="inline-block w-8 text-left">
      <span className="animate-dots">.</span>
    </span>
  </ChatBubble>
);

const ChatPage = () => {
  const { sessionId } = useParams();
  // --- State block ---
  const [prompt, setPrompt] = useState('');
  const [cards, setCards] = useState([]);          // Notes returned from the API
  const [reflection, setReflection] = useState(''); // Reflection text returned from the API
  const [loading, setLoading] = useState(false);    // Simple loading flag
  // --- Modal state ---
  const [selectedNote, setSelectedNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

const generateHeatmapData = (notes) => {
  const endDate = endOfToday();
  const startDate = subDays(endDate, 34); // 35 days = 5 weeks
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const noteCounts = notes.reduce((acc, note) => {
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
};

  const getColorClass = (count) => {
    if (count === 0) return 'bg-muted';
    if (count < 2) return 'bg-green-100';
    if (count < 4) return 'bg-green-300';
    if (count < 6) return 'bg-green-500';
    return 'bg-green-700';
  };

  /**
   * Call the backend route `/api/ai/get-reflection`
   * with the current prompt and update local state.
   */
  const fetchReflection = async () => {
    if (!prompt.trim()) return;

    // Clear previous results before fetching new ones
    setReflection('');
    setCards([]);
    setLoading(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/ai/get-reflection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: prompt, limit: 5 }),
        },
      );
      if (!resp.ok) throw new Error('Request failed');
      const data = await resp.json();

      // Expected: { reflection: string, notes: [...] }
      setReflection(data.reflection || '');
      setCards(data.notes || []);
    } catch (err) {
      console.error('Error fetching reflection:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Prompt input */}
      <div className="py-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Find accurate notes, explore or bet on serindipity"
          className="w-full rounded-md border border-border bg-background text-foreground px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              fetchReflection();
            }
          }}
        />
      </div>

      {/* Loader indicator */}
      {/*loading && (
        <p className="mb-4 text-center text-sm text-muted-foreground">Fetching reflection…</p>
      )*/}

      {loading && <LoadingBubbles />}

    {cards.length > 0 && (
      <div className="mb-6 flex flex-row gap-6 overflow-x-auto">
        {/* Heatmap block */}
        <div className="flex-shrink-0">
          <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">
            Note activity (last 5 weeks)
          </h3>

          <div className="flex justify-center">
            <div className="grid grid-cols-7 grid-rows-5 gap-1">
              {(() => {
                const data = generateHeatmapData(cards);
                const weeks = Array.from({ length: 5 }, (_, i) =>
                  data.slice(i * 7, i * 7 + 7)
                );
                const transposed = Array.from({ length: 7 }, (_, dayIdx) =>
                  weeks.map((week) => week[dayIdx])
                );

                return transposed.flat().map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-sm ${getColorClass(day.count)}`}
                    title={`${format(day.date, 'EEE, MMM d')}: ${day.count} note${day.count !== 1 ? 's' : ''}`}
                  />
                ));
              })()}
            </div>
          </div>

          <div className="mt-2 flex justify-center items-center text-[10px] text-muted-foreground gap-2">
            <span>Less</span>
            <div className="flex space-x-1">
              <span className="w-3.5 h-3.5 rounded-sm bg-muted"></span>
              <span className="w-3.5 h-3.5 rounded-sm bg-green-100"></span>
              <span className="w-3.5 h-3.5 rounded-sm bg-green-300"></span>
              <span className="w-3.5 h-3.5 rounded-sm bg-green-500"></span>
              <span className="w-3.5 h-3.5 rounded-sm bg-green-700"></span>
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Horizontal card carousel */}
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {cards.map((note, idx) => (
            <div
              key={note.id || idx}
              onClick={() => {
                setSelectedNote(note);
                setModalOpen(true);
              }}
              className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm text-foreground cursor-pointer hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {note.title || `Note ${idx + 1}`}
              </h3>
              {note.date && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(note.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
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
        <DialogContent className="max-w-2xl">
          {selectedNote && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedNote.title}
              </h2>
              {selectedNote.date && (
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedNote.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
              <div className="whitespace-pre-wrap text-sm text-foreground">
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
