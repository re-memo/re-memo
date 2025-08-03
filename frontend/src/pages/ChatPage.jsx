import React from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

const ChatPage = () => {
  const { sessionId } = useParams();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <MessageSquare size={24} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          Chat Interface
        </h2>
        <p className="text-muted-foreground">
          {sessionId ? `Chat session: ${sessionId}` : 'New chat session'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          This page will contain the chat interface with AI.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
