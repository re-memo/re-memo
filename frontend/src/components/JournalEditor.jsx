import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { countWords, countCharacters, estimateReadingTime, generatePreview } from '@/utils/markdown';
import { useAutoSave } from '@/hooks/useApi';
import { Save, Eye, EyeOff, FileText, CheckCircle, Clock } from 'lucide-react';

const JournalEditor = ({ 
  entry = null, 
  onSave, 
  onComplete, 
  onCancel,
  autoSave = true 
}) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(entry?.updated_at ? new Date(entry.updated_at) : null);

  // Auto-save functionality
  const saveData = useCallback(async (data) => {
    if (!onSave || (!data.title.trim() && !data.content.trim())) return;
    
    try {
      setIsSaving(true);
      await onSave(data);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const { isSaving: autoSaving } = useAutoSave(
    autoSave && (title || content) ? { title, content } : null,
    saveData,
    3000 // Save after 3 seconds of inactivity
  );

  // Manual save
  const handleSave = async () => {
    if (!onSave) return;
    await saveData({ title, content });
  };

  // Complete entry
  const handleComplete = async () => {
    if (!onComplete) return;
    
    try {
      setIsCompleting(true);
      // Save first if there are changes
      if (title || content) {
        await saveData({ title, content });
      }
      await onComplete();
    } catch (error) {
      console.error('Complete failed:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleComplete();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [title, content]);

  // Stats
  const wordCount = countWords(content);
  const charCount = countCharacters(content);
  const readingTime = estimateReadingTime(content);
  const preview = generatePreview(content, 100);

  return (
    <div className="space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Entry title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Edit' : 'Preview'}
          </Button>

          {/* Save button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || autoSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving || autoSaving ? 'Saving...' : 'Save'}
          </Button>

          {/* Complete button */}
          <Button
            onClick={handleComplete}
            disabled={isCompleting || !title.trim() || !content.trim()}
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isCompleting ? 'Processing...' : 'Complete & Analyze'}
          </Button>

          {/* Cancel button */}
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {wordCount} words, {charCount} characters
          </span>
          <span>~{readingTime} min read</span>
          {entry?.status && (
            <span className={`px-2 py-1 rounded text-xs ${
              entry.status === 'complete' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }`}>
              {entry.status}
            </span>
          )}
        </div>
        
        {lastSaved && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Editor/Preview */}
      <div className="grid grid-cols-1 gap-4">
        {showPreview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{title || 'Untitled Entry'}</CardTitle>
            </CardHeader>
            <CardContent>
              {content ? (
                <div className="prose-custom">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  Start writing to see the preview...
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Textarea
            placeholder="Start writing your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] resize-none"
            style={{ fontSize: '16px', lineHeight: '1.6' }}
          />
        )}
      </div>

      {/* Markdown toolbar */}
      {!showPreview && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Markdown:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = content.substring(start, end);
              const newText = content.substring(0, start) + `**${selectedText || 'bold text'}**` + content.substring(end);
              setContent(newText);
            }}
            className="h-6 px-2 text-xs"
          >
            Bold
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const selectedText = content.substring(start, end);
              const newText = content.substring(0, start) + `*${selectedText || 'italic text'}*` + content.substring(end);
              setContent(newText);
            }}
            className="h-6 px-2 text-xs"
          >
            Italic
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              const start = textarea.selectionStart;
              const newText = content.substring(0, start) + `\n\n## Heading\n\n` + content.substring(start);
              setContent(newText);
            }}
            className="h-6 px-2 text-xs"
          >
            Heading
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              const start = textarea.selectionStart;
              const newText = content.substring(0, start) + `\n- List item\n` + content.substring(start);
              setContent(newText);
            }}
            className="h-6 px-2 text-xs"
          >
            List
          </Button>
        </div>
      )}

      {/* Tips */}
      {!content && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Writing Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Write naturally about your day, thoughts, or experiences</li>
              <li>• Use **bold** and *italic* text for emphasis</li>
              <li>• Press Ctrl/Cmd + S to save, Ctrl/Cmd + Enter to complete</li>
              <li>• When you complete an entry, AI will extract insights and facts</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JournalEditor;
