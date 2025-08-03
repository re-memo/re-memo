import { useAutoSave, useEntry } from "@/hooks/useApi";
import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const defaultMarkdown = `# Untitled Entry
Write your thoughts here...  

You can use **Markdown** syntax to format your text!  

`;

const JournalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { entry, updateEntry, completeEntry, deleteEntry, loading } = useEntry(id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const editorRef = useRef(null);

  const saveChanges = async () => {
    if (!entry || !editorRef.current) return;
    if (entry?.status === "complete") return;
    const markdown = editorRef.current.getMarkdown();

    // parse title from first line
    const titleMatch = markdown.match(/^#\s*(.*)/);
    const title = titleMatch ? titleMatch[1] : "Untitled Entry";

    await updateEntry({
      title,
      content: markdown,
    });
  };

  const handleDeleteEntry = async () => {
    setIsDeleting(true);
    try {
      await deleteEntry(id);
      navigate("/journals");
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCompleteEntry = async () => {
    if (entry?.status === "complete") return;
    setIsCompleting(true);
    try {
      await completeEntry();
    } catch (error) {
      console.error("Failed to complete entry:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const { lastSaved } = useAutoSave(entry?.status === "complete" ? null : saveChanges);

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
        />
        <span className="text-muted-foreground">
          {entry?.status === "complete" ? "Complete" : "Draft"}
        </span>
        {entry?.status !== "complete" && (
          <span className="text-sm text-muted-foreground ml-auto">
            Last saved:{" "}
            {lastSaved
              ? lastSaved.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })
              : "Never"}
          </span>
        )}
      </div>
      <div className="flex items-center px-3 select-none">
        <Calendar size={18} className="text-muted-foreground mr-2" />
        <span className="text-muted-foreground">
          {new Date(entry?.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })}
        </span>
      </div>
      {/* Content Area */}
      <MDXEditor
        markdown={entry?.content || defaultMarkdown}
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
