import { ErrorMessage } from "@/components/ErrorBoundary";
import { LoadingCard } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEntries } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useCommon";
import { useMemoizedValue } from "@/hooks/usePerformance";
import { useScreenReader } from "@/utils/accessibility";
import { formatDate, stripMarkdown, truncateText } from "@/utils/helpers";
import { validateSearchQuery } from "@/utils/security";
import { Calendar, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AllJournalsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const announce = useScreenReader();

  const { entries, loading, error, fetchEntries } = useEntries();

  // Memoized filtered entries for better performance
  const filteredEntries = useMemoizedValue(() => {
    if (!entries) return [];

    const { isValid, sanitized } = validateSearchQuery(debouncedSearch);
    const searchTerm = isValid ? sanitized : "";

    return entries.filter((entry) => {
      const matchesSearch =
        !searchTerm ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stripMarkdown(entry.content)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [entries, debouncedSearch, statusFilter]);

  const handleRetry = () => {
    fetchEntries();
    announce("Retrying to load entries", "polite");
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (value.length > 2) {
      announce(`Searching for: ${value}`, "polite");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 max-h-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Journals</h1>
          <p className="text-muted-foreground mt-1">
            Your personal journal entries ({filteredEntries.length}{" "}
            {filteredEntries.length === 1 ? "entry" : "entries"})
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

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label="Search journal entries"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            announce(`Filter changed to: ${e.target.value}`, "polite");
          }}
          className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <ErrorMessage error={error} onRetry={handleRetry} className="mb-6" />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      )}

      {/* Journal List */}
      {!loading && filteredEntries && filteredEntries.length > 0 && (
        <div className="flex-[1_1_0] space-y-4 overflow-y-scroll px-2">
          {filteredEntries.map((journal) => (
            <div
              key={journal.id}
              className="p-6 bg-card rounded-lg border hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/journal/${journal.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {journal.title}
                  </h3>
                </div>

                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Badge
                    variant={
                      journal.status === "complete" ? "default" : "secondary"
                    }
                    className="capitalize"
                  >
                    {journal.status}
                  </Badge>
                  <Calendar size={14} className="ml-2" />
                  <span>{formatDate(journal.created_at)}</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 line-clamp-2">
                {truncateText(stripMarkdown(journal.content), 150)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        (!filteredEntries || filteredEntries.length === 0) &&
        !error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Calendar size={24} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {entries?.length === 0
                ? "No journal entries yet"
                : "No entries match your search"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {entries?.length === 0
                ? "Start documenting your thoughts and experiences."
                : "Try adjusting your search or filters."}
            </p>
            {entries?.length === 0 && (
              <Button
                onClick={() => navigate("/journal/new")}
                className="gap-2"
              >
                <Plus size={16} />
                Create your first entry
              </Button>
            )}
          </div>
        )}
    </div>
  );
};

export default AllJournalsPage;
