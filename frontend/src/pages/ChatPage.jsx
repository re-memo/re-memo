import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ChatBubble } from "@/components/ui/chat-bubble";

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

  /**
   * Call the backend route `/api/ai/get-reflection`
   * with the current prompt and update local state.
   */
  const fetchReflection = async () => {
    if (!prompt.trim()) return;

    try {
      setLoading(true);
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

      {/* Horizontal card carousel */}
      <div className="mb-6 flex space-x-4 overflow-x-auto pb-4">
        {cards.map((note, idx) => (
          <div
            key={note.id || idx}
            className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-card p-4 shadow-sm text-foreground"
          >
            <h3 className="text-lg font-semibold text-foreground">
              {note.title || `Note ${idx + 1}`}
            </h3>
          </div>
        ))}
      </div>

      {/* Reflection display block */}
      {reflection && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-lg font-semibold">Reflection</h3>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{reflection}</p>
        </div>
      )}

    </div>
  );
};

export default ChatPage;
