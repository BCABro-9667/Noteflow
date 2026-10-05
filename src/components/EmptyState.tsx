import React from 'react';
import { FileText, Star, Pin, Archive, Trash2, Search, Plus, Tag as TagIcon } from 'lucide-react';
import { FilterType } from '../types';

interface EmptyStateProps {
  filter: FilterType;
  searchQuery?: string;
  selectedTag?: string;
  onCreateNote?: () => void;
  onClearSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  filter,
  searchQuery,
  selectedTag,
  onCreateNote,
  onClearSearch,
}) => {
  if (searchQuery) {
    return (
      <div id="empty-state-search" className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No notes found</h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
          We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another term or clear the filter.
        </p>
        {onClearSearch && (
          <button
            id="btn-empty-clear-search"
            onClick={onClearSearch}
            className="mt-5 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  if (selectedTag) {
    return (
      <div id="empty-state-tag" className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
          <TagIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No notes with this tag</h3>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
          Tag your notes to categorize ideas, projects, and meeting summaries.
        </p>
        {onCreateNote && (
          <button
            id="btn-empty-create-tagged-note"
            onClick={onCreateNote}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Note
          </button>
        )}
      </div>
    );
  }

  switch (filter) {
    case 'favorites':
      return (
        <div id="empty-state-favorites" className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 mb-4">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No favorites yet</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Star important notes to highlight your daily priorities and key references.
          </p>
        </div>
      );

    case 'pinned':
      return (
        <div id="empty-state-pinned" className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 mb-4">
            <Pin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No pinned notes</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Pin any note to keep it anchored right at the top of your workspace.
          </p>
        </div>
      );

    case 'archived':
      return (
        <div id="empty-state-archived" className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
            <Archive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No archived notes</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Archive completed tasks or reference documents to keep your active notes decluttered.
          </p>
        </div>
      );

    case 'trash':
      return (
        <div id="empty-state-trash" className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Your trash is empty</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Notes moved to trash remain here until permanently deleted or restored.
          </p>
        </div>
      );

    case 'all':
    default:
      return (
        <div id="empty-state-all" className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">Nothing here yet.</h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-sm">
            Create your first note to get started. Capture ideas, meeting minutes, checklists, and documentation.
          </p>
          {onCreateNote && (
            <button
              id="btn-empty-create-first-note"
              onClick={onCreateNote}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              + Create Note
            </button>
          )}
        </div>
      );
  }
};
