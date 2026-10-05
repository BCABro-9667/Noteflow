import React from 'react';
import {
  FileText,
  Star,
  Pin,
  Archive,
  Trash2,
  Plus,
  Tag as TagIcon,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  X,
  Edit2,
  Compass,
} from 'lucide-react';
import { FilterType, Tag, ThemeMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentFilter: FilterType;
  selectedTagId: string | null;
  tags: Tag[];
  noteCounts: {
    all: number;
    favorites: number;
    pinned: number;
    archived: number;
    trash: number;
  };
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectFilter: (filter: FilterType) => void;
  onSelectTag: (tagId: string | null) => void;
  onCreateNote: () => void;
  onOpenTagModal: (tagToEdit?: Tag) => void;
  onOpenSettings: (tab?: string) => void;
  onShowLanding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  selectedTagId,
  tags,
  noteCounts,
  isOpenMobile,
  onCloseMobile,
  onSelectFilter,
  onSelectTag,
  onCreateNote,
  onOpenTagModal,
  onOpenSettings,
  onShowLanding,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleNavClick = (filter: FilterType) => {
    onSelectFilter(filter);
    onSelectTag(null);
    onCloseMobile();
  };

  const handleTagClick = (tagId: string) => {
    if (selectedTagId === tagId) {
      onSelectTag(null);
    } else {
      onSelectTag(tagId);
      // Reset filter to 'all' if in trash/archive
      if (currentFilter === 'trash' || currentFilter === 'archived') {
        onSelectFilter('all');
      }
    }
    onCloseMobile();
  };

  const cycleTheme = () => {
    const sequence: ThemeMode[] = ['light', 'dark', 'system'];
    const nextIdx = (sequence.indexOf(theme) + 1) % sequence.length;
    setTheme(sequence[nextIdx]);
  };

  const NavItems = [
    { id: 'all', label: 'All Notes', icon: FileText, count: noteCounts.all },
    { id: 'favorites', label: 'Favorites', icon: Star, count: noteCounts.favorites },
    { id: 'pinned', label: 'Pinned', icon: Pin, count: noteCounts.pinned },
    { id: 'archived', label: 'Archived', icon: Archive, count: noteCounts.archived },
    { id: 'trash', label: 'Trash', icon: Trash2, count: noteCounts.trash },
  ] as const;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 border-r border-neutral-200/80 dark:border-neutral-800/80 w-64 select-none">
      {/* App Branding & Mobile Close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            N
          </div>
          <div>
            <span className="font-semibold text-base text-neutral-900 dark:text-neutral-100 tracking-tight">
              NoteFlow
            </span>
            <span className="ml-1.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 px-1.5 py-0.2 bg-blue-100/60 dark:bg-blue-950/60 rounded">
              v1.0
            </span>
          </div>
        </div>

        <button
          id="btn-close-mobile-sidebar"
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Note Button */}
      <div className="p-4 pb-2">
        <button
          id="btn-sidebar-new-note"
          type="button"
          onClick={() => {
            onCreateNote();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        <div>
          <span className="px-3 text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Workspace
          </span>
          <nav className="mt-1 space-y-0.5">
            {NavItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedTagId === null && currentFilter === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1.5 py-0.2 bg-neutral-200/50 dark:bg-neutral-800 rounded">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
              Tags
            </span>
            <button
              id="btn-sidebar-add-tag"
              type="button"
              onClick={() => onOpenTagModal()}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors"
              title="Add Tag"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {tags.length === 0 ? (
              <p className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500 italic">
                No tags yet. Click + to add.
              </p>
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTagId === tag.id;
                return (
                  <div
                    key={tag.id}
                    id={`sidebar-tag-${tag.id}`}
                    className={`group w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                    onClick={() => handleTagClick(tag.id)}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tag.noteCount !== undefined && tag.noteCount > 0 && (
                        <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                          {tag.noteCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTagModal(tag);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-neutral-800 dark:hover:text-neutral-200 transition-opacity"
                        title="Edit Tag"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Landing Page Overview Link & Bottom User Area */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/40 dark:bg-neutral-900/40 space-y-2">
        {onShowLanding && (
          <button
            type="button"
            onClick={onShowLanding}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              <span>Feature Overview</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              Specs
            </span>
          </button>
        )}

        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 transition-colors">
          <div
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
            onClick={() => {
              onCloseMobile();
              onOpenSettings();
            }}
          >
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {/* Theme quick toggle */}
            <button
              id="btn-sidebar-theme"
              type="button"
              onClick={cycleTheme}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title={`Current theme: ${theme}. Click to change.`}
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </button>

            {/* Settings */}
            <button
              id="btn-sidebar-settings"
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenSettings();
              }}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              id="btn-sidebar-logout"
              type="button"
              onClick={logout}
              className="p-1.5 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div
          id="mobile-sidebar-backdrop"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-150"
          onClick={onCloseMobile}
        >
          <div
            className="w-64 h-full animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
