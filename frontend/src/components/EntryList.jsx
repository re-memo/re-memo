import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntries } from '@/hooks/useApi';
import { generatePreview, countWords } from '@/utils/markdown';
import { 
  FileText, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

const EntryList = ({ onEntrySelect, onNewEntry, selectedEntryId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'draft', 'complete'
  
  const { 
    entries, 
    loading, 
    error, 
    pagination, 
    fetchEntries, 
    deleteEntry 
  } = useEntries();

  const handleSearch = (query) => {
    setSearchQuery(query);
    fetchEntries(1, 20, query);
  };

  const handlePageChange = (newPage) => {
    fetchEntries(newPage, pagination.limit, searchQuery);
  };

  const handleDelete = async (entryId, event) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(entryId);
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (statusFilter === 'all') return true;
    return entry.status === statusFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journal Entries
          </CardTitle>
          <Button onClick={onNewEntry} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
        
        {/* Search and filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1 bg-background"
            >
              <option value="all">All Entries</option>
              <option value="draft">Drafts</option>
              <option value="complete">Completed</option>
            </select>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Entry list */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && entries.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-medium mb-2">
                {searchQuery ? 'No matching entries' : 'No entries yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Start your journaling journey by creating your first entry'
                }
              </p>
              {!searchQuery && (
                <Button onClick={onNewEntry}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Entry
                </Button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onEntrySelect(entry)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                  selectedEntryId === entry.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <div className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        entry.status === 'complete'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {entry.status === 'complete' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Edit3 className="h-3 w-3" />
                        )}
                        {entry.status}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {generatePreview(entry.content, 120)}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(entry.updated_at)}
                      </span>
                      <span>{countWords(entry.content)} words</span>
                      {entry.facts_count > 0 && (
                        <span>{entry.facts_count} insights</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.total_pages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.has_next || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && entries.length > 0 && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EntryList;
