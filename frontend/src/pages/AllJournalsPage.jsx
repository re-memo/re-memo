import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Star, Calendar } from "lucide-react";
import { useEntries } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";

const AllJournalsPage = () => {
  const navigate = useNavigate();

  const { entries } = useEntries();

  return (
    <div className="max-w-4xl mx-auto p-6 max-h-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Journals</h1>
          <p className="text-muted-foreground mt-1">
            Your personal journal entries
          </p>
        </div>

        <Button
          onClick={() => navigate("/journal/new")}
          className="text-foreground"
          variant="outline"
        >
          <Plus size={16} className="mr-2" />
          New Entry
        </Button>
      </div>

      {/* Journal List */}
      {entries && entries.length > 0 && (
        <div className="flex-[1_1_0] space-y-4 overflow-y-scroll px-2">
          {entries.map((journal) => (
            <div
              key={journal.id}
              className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/journal/${journal.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {journal.title}
                  </h3>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Badge variant="secondary" className="mr-1">
                    {journal.status}
                  </Badge>
                  <Calendar size={14} className="mr-1" />
                  <span>
                    {new Date(journal?.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2">
                {journal.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State (if no journals) */}
      {entries && entries.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <Calendar size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No journal entries yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start documenting your thoughts and experiences.
          </p>
        </div>
      )}
    </div>
  );
};

export default AllJournalsPage;
