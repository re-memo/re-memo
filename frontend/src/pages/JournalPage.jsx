import { useAutoSave, useEntry } from "@/hooks/useApi";
import { useAsyncOperation } from "@/hooks/useCommon";
import { useScreenReader } from "@/utils/accessibility";
import { validateJournalEntry } from "@/utils/security";
import { DEFAULT_VALUES } from "@/constants";
import { formatDate, formatTime } from "@/utils/helpers";
import React, { useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { MDXEditor } from "@mdxeditor/editor";
import {
  listsPlugin,
  quotePlugin,
  headingsPlugin,
  imagePlugin,
  tablePlugin,
  frontmatterPlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
} from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";
import { Calendar, Download, Star, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ErrorBoundary";

const defaultMarkdown = `# Untitled Entry
Write your thoughts here...  

You can use **Markdown** syntax to format your text!  

`;

const JournalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { entry, updateEntry, completeEntry, deleteEntry, loading, error } = useEntry(id);
  const { isLoading: isDeleting, execute: executeDelete } = useAsyncOperation();
  const { isLoading: isCompleting, execute: executeComplete } = useAsyncOperation();
  
  const editorRef = useRef(null);
  const announce = useScreenReader();

  const parseTitle = useCallback((markdown) => {
    const titleMatch = markdown.match(/^#\s*(.*)/);
    return titleMatch ? titleMatch[1] : "Untitled Entry";
  }, []);

  const saveChanges = useCallback(async () => {
    if (!entry || !editorRef.current || entry?.status === "complete") return;
    
    try {
      const markdown = editorRef.current.getMarkdown();
      const title = parseTitle(markdown);

      // Validate entry data
      const validation = validateJournalEntry({ title, content: markdown });
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        return;
      }

      await updateEntry({
        title,
        content: markdown,
      });
      
      announce('Entry saved successfully', 'polite');
    } catch (error) {
      toast.error("Failed to save changes");
      announce('Failed to save entry', 'assertive');
      console.error("Save error:", error);
    }
  }, [entry, updateEntry, parseTitle, announce]);

  const handleDeleteEntry = async () => {
    try {
      await executeDelete(async () => {
        await deleteEntry(id);
        toast.success("Entry deleted successfully");
        announce('Entry deleted', 'polite');
        navigate("/journals");
      });
    } catch (error) {
      toast.error("Failed to delete entry");
      announce('Failed to delete entry', 'assertive');
      console.error("Delete error:", error);
    }
  };

  const handleCompleteEntry = async () => {
    if (entry?.status === "complete") return;
    
    try {
      await executeComplete(async () => {
        await completeEntry();
        toast.success("Entry completed successfully");
        announce('Entry marked as complete', 'polite');
      });
    } catch (error) {
      toast.error("Failed to complete entry");
      announce('Failed to complete entry', 'assertive');
      console.error("Complete error:", error);
    }
  };

  const { lastSaved } = useAutoSave(entry?.status === "complete" ? null : saveChanges);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <ErrorMessage error={error} />
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="w-full h-full flex flex-col lg:px-6 max-h-full">
      {/* Top Bar */}
      <div className="flex items-center px-3 py-5 space-x-4 select-none">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground p-0 h-fit"
          disabled={isDeleting || isCompleting}
        >
          <Star size={24} className="text-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground p-0 h-fit"
          disabled={isDeleting || isCompleting}
        >
          <Download size={24} className="text-foreground" />
        </Button>
        <span className="h-6 border-r-2 border-foreground" />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground p-0 h-fit"
          onClick={handleDeleteEntry}
          disabled={isDeleting || isCompleting}
        >
          <Trash size={24} className="text-foreground" />
        </Button>
        <Switch
          checked={entry?.status === "complete"}
          onCheckedChange={entry?.status === "complete" ? null : handleCompleteEntry}
          disabled={entry?.status === "complete" || isDeleting || isCompleting}
          aria-label={`Mark entry as ${entry?.status === "complete" ? "complete" : "draft"}`}
        />
        <span className="text-muted-foreground">
          {entry?.status === "complete" ? "Complete" : "Draft"}
        </span>
      </div>
      <div className="flex items-center px-3 select-none">
        <Calendar size={18} className="text-muted-foreground mr-2" />
        <span className="text-muted-foreground">
          {formatDate(entry?.created_at, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
          })}
        </span>
        {entry?.status !== "complete" && lastSaved && (
          <span className="text-xs text-muted-foreground ml-4">
            Auto-saved at {formatTime(lastSaved)}
          </span>
        )}
      </div>
      {/* Content Area */}
      <MDXEditor
        markdown={entry?.content || DEFAULT_VALUES.MARKDOWN}
        ref={editorRef}
        className="flex-[1_1_0] overflow-y-auto"
        readOnly={entry?.status === "complete"}
        plugins={[
          listsPlugin(),
          quotePlugin(),
          headingsPlugin(),
          imagePlugin(),
          tablePlugin(),
          frontmatterPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "txt" }),
          markdownShortcutPlugin(),
        ]}
      />

      {/* Loading Overlay */}
      {(isDeleting || isCompleting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 flex flex-col items-center space-y-4 border border-border">
            <Spinner size="large" />
            <p className="text-foreground">
              {isDeleting ? "Deleting entry..." : "Completing entry..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalPage;
