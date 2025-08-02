import React, { useState } from 'react';
import AppSidebar from '@/components/AppSidebar';
import EntryList from '@/components/EntryList';
import JournalEditor from '@/components/JournalEditor';
import ChatInterface from '@/components/ChatInterface';
import { useEntries } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { 
  PanelLeft, 
  MessageSquare, 
  FileText, 
  Brain,
  Moon,
  Sun
} from 'lucide-react';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('journal'); // 'journal', 'chat'
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const { createEntry, updateEntry, completeEntry } = useEntries();

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsEditing(true);
    setActiveView('journal');
  };

  const handleEntrySelect = (entry) => {
    setSelectedEntry(entry);
    setIsEditing(true);
    setActiveView('journal');
  };

  const handleSaveEntry = async (entryData) => {
    try {
      if (selectedEntry) {
        // Update existing entry
        const updatedEntry = await updateEntry(selectedEntry.id, entryData);
        setSelectedEntry(updatedEntry);
      } else {
        // Create new entry
        const newEntry = await createEntry(entryData);
        setSelectedEntry(newEntry);
      }
    } catch (error) {
      console.error('Failed to save entry:', error);
      throw error;
    }
  };

  const handleCompleteEntry = async () => {
    if (!selectedEntry) return;
    
    try {
      await completeEntry(selectedEntry.id);
      // Refresh the entry to get updated status and facts
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to complete entry:', error);
      throw error;
    }
  };

  const handleSuggestionRequest = (prompt, topic) => {
    // If editing, insert the prompt into the editor
    if (isEditing) {
      // This would be better handled by passing the prompt to JournalEditor
      // For now, we'll just create a new entry with the prompt
      setSelectedEntry({
        title: `Writing about ${topic}`,
        content: `${prompt}\n\n`
      });
    } else {
      // Start a new entry with the prompt
      setSelectedEntry({
        title: `Writing about ${topic}`,
        content: `${prompt}\n\n`
      });
      setIsEditing(true);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <AppSidebar
            onTopicSelect={(topic) => console.log('Topic selected:', topic)}
            onSuggestionRequest={handleSuggestionRequest}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <h1 className="text-xl font-bold">re:memo</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={activeView === 'journal' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('journal')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Journal
                  </Button>
                  <Button
                    variant={activeView === 'chat' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveView('chat')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 flex min-h-0">
            {activeView === 'journal' ? (
              <>
                {/* Entry List */}
                <div className="w-80 border-r border-border">
                  <EntryList
                    onEntrySelect={handleEntrySelect}
                    onNewEntry={handleNewEntry}
                    selectedEntryId={selectedEntry?.id}
                  />
                </div>

                {/* Editor */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {isEditing ? (
                    <JournalEditor
                      entry={selectedEntry}
                      onSave={handleSaveEntry}
                      onComplete={handleCompleteEntry}
                      onCancel={() => {
                        setIsEditing(false);
                        setSelectedEntry(null);
                      }}
                      autoSave={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <FileText className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
                        <h2 className="text-2xl font-semibold mb-2">
                          Welcome to re:memo
                        </h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Your AI-powered journaling companion. Start writing to capture your thoughts, 
                          and let AI help you discover patterns and insights.
                        </p>
                        <Button onClick={handleNewEntry} size="lg">
                          <FileText className="h-5 w-5 mr-2" />
                          Start Journaling
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Chat Interface */
              <div className="flex-1 p-6">
                <ChatInterface />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
