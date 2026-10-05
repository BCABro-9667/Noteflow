import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  X,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Trash2,
  Plus,
  Compass,
  FileText,
  Lock,
} from 'lucide-react';
import { FilterType, SortOption, ViewMode, Tag } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentFilter: FilterType;
  selectedTag: Tag | null;
  searchQuery: string;
  viewMode: ViewMode;
  sortOption: SortOption;
  totalNotes: number;
  onOpenMobileSidebar: () => void;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (sort: SortOption) => void;
  onCreateNote: () => void;
  onEmptyTrash?: () => void;
  onShowLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFilter,
  selectedTag,
  searchQuery,
  viewMode,
  sortOption,
  totalNotes,
  onOpenMobileSidebar,
  onSearchChange,
  onClearSearch,
  onViewModeChange,
  onSortChange,
  onCreateNote,
  onEmptyTrash,
  onShowLanding,
}) => {
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global shortcut Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTitle = () => {
    if (selectedTag) {
      return `#${selectedTag.name}`;
    }
    switch (currentFilter) {
      case 'favorites':
        return 'Favorites';
      case 'pinned':
        return 'Pinned Notes';
      case 'archived':
        return 'Archived Notes';
      case 'trash':
        return 'Trash';
      case 'all':
      default:
        return 'All Notes';
    }
  };

  return (
    <header
      id="main-app-header"
      className="flex flex-col gap-2.5 px-4 sm:px-8 py-3 bg-white/90 dark:bg-neutral-900/90 border-b border-neutral-200/80 dark:border-neutral-800/80 shrink-0"
    >
      {/* MOBILE TOP BAR (Logo on Left, User Photo on Right - clicking either opens sidebar) */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Left: Website Logo (clicking opens sidebar) */}
        <button
          type="button"
          id="btn-mobile-header-logo"
          onClick={onOpenMobileSidebar}
          className="flex items-center gap-2 p-1 -ml-1 text-left rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
          title="Open Sidebar Menu"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
                NoteFlow
              </span>
              <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 px-1 py-0.2 bg-blue-100/60 dark:bg-blue-950/60 rounded">
                v1.0
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
              {getTitle()} ({totalNotes})
            </span>
          </div>
        </button>

        {/* Right: User Photo (clicking opens sidebar) */}
        <button
          type="button"
          id="btn-mobile-header-avatar"
          onClick={onOpenMobileSidebar}
          className="relative p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/40 transition-all cursor-pointer group"
          title="Open Sidebar Menu"
        >
          <img
            src={
              user?.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
            }
            alt="User profile"
            className="w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 object-cover shadow-2xs group-hover:scale-105 transition-transform"
          />
          {user?.hasPin && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900 flex items-center justify-center"
              title="PIN Active"
            >
              <Lock className="w-1.5 h-1.5 text-white" />
            </span>
          )}
        </button>
      </div>

      {/* DESKTOP TOP BAR & SHARED CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Desktop Title & Note Count */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="btn-open-mobile-sidebar-desktop"
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {getTitle()}
              </h1>
              <span className="text-xs font-normal text-neutral-400 dark:text-neutral-500">
                ({totalNotes})
              </span>
            </div>
          </div>
        </div>

        {/* Middle & Right: Search, View Mode, Sort, Create */}
        <div className="flex items-center gap-2 flex-1 sm:flex-none justify-between sm:justify-end">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              id="input-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes... (Ctrl+K)"
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden lg:flex absolute inset-y-0 right-0 pr-2 items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-200/60 dark:bg-neutral-700/60 rounded">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center">
            <select
              id="select-sort-notes"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="appearance-none pl-7 pr-6 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors cursor-pointer"
            >
              <option value="updated_desc">Updated</option>
              <option value="created_desc">Newest</option>
              <option value="created_asc">Oldest</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-2 pointer-events-none" />
          </div>

          {/* View Mode Toggle (Grid / List) */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <button
              id="btn-view-grid"
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-view-list"
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {onShowLanding && (
            <button
              id="btn-header-landing"
              type="button"
              onClick={onShowLanding}
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              title="View Landing Page & System Specs"
            >
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>Overview</span>
            </button>
          )}

          {/* Desktop New Note / Empty Trash button */}
          {currentFilter === 'trash' ? (
            <button
              id="btn-empty-trash"
              type="button"
              onClick={onEmptyTrash}
              disabled={totalNotes === 0}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/80 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          ) : (
            <button
              id="btn-header-new-note"
              type="button"
              onClick={onCreateNote}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
