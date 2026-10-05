import React, { useState, useRef, useEffect } from 'react';
import {
  Pin,
  Star,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Copy,
  Trash2,
  RotateCcw,
  Tag as TagIcon,
  Edit3,
  Lock,
  Unlock,
} from 'lucide-react';
import { Note, ViewMode } from '../types';

interface NoteCardProps {
  note: Note;
  viewMode: ViewMode;
  isTrashView?: boolean;
  onSelect: (note: Note) => void;
  onTogglePin?: (id: string, isPinned: boolean) => void;
  onToggleFavorite?: (id: string, isFavorite: boolean) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onDuplicate?: (id: string) => void;
  onLock?: (id: string) => void;
  onUnlock?: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  viewMode,
  isTrashView = false,
  onSelect,
  onTogglePin,
  onToggleFavorite,
  onArchive,
  onDuplicate,
  onLock,
  onUnlock,
  onDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLocked = Boolean(note.isLocked);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Strip HTML to produce clean snippet
  const getCleanSnippet = (html: string) => {
    if (!html) return 'Empty note';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.trim() || 'Empty note';
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const snippet = getCleanSnippet(note.content);

  // LIST VIEW
  if (viewMode === 'list') {
    return (
      <div
        id={`note-card-${note.id}`}
        onClick={() => !isTrashView && onSelect(note)}
        className={`group relative flex items-center justify-between p-3.5 rounded-xl transition-all ${
          isLocked
            ? 'bg-amber-50/30 dark:bg-neutral-900 border-2 border-amber-300/80 dark:border-amber-800/60 shadow-xs'
            : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        } ${!isTrashView ? 'cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          {!isTrashView && onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id, !note.isPinned);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                note.isPinned
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                  : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600 dark:hover:text-neutral-200'
              }`}
              title={note.isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className="w-4 h-4 fill-current" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {isLocked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 shrink-0">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {note.title.trim() || 'Untitled Note'}
              </h4>
              {note.tags && note.tags.length > 0 && !isLocked && (
                <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                  {note.tags.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    >
                      {t.name}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-neutral-400">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <p className={`text-xs truncate mt-0.5 ${isLocked ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
              {isLocked ? '🔒 Note is locked • Tap to verify PIN' : snippet}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {formatRelativeTime(note.updatedAt)}
          </span>

          {!isTrashView && onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id, !note.isFavorite);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                note.isFavorite
                  ? 'text-amber-500'
                  : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
              }`}
              title={note.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* More actions dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-20 text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {!isTrashView ? (
                  <>
                    {isLocked ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onSelect(note);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          Open Note
                        </button>
                        {onUnlock && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onUnlock(note.id);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Unlock Note
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onSelect(note);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                          Edit Note
                        </button>
                        {onLock && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onLock(note.id);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Lock Note
                          </button>
                        )}
                      </>
                    )}
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate(note.id);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        Duplicate
                      </button>
                    )}
                    {onArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive(note.id, !note.isArchived);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        {note.isArchived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-neutral-400" />
                            Unarchive
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-neutral-400" />
                            Archive
                          </>
                        )}
                      </button>
                    )}
                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(note.id);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Move to Trash
                    </button>
                  </>
                ) : (
                  <>
                    {onRestore && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onRestore(note.id);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                        Restore Note
                      </button>
                    )}
                    {onPermanentDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onPermanentDelete(note.id);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Permanently
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // GRID VIEW (Default Flat Card)
  return (
    <div
      id={`note-card-${note.id}`}
      onClick={() => !isTrashView && onSelect(note)}
      className={`group relative flex flex-col justify-between p-5 rounded-xl transition-all min-h-[190px] ${
        isLocked
          ? 'bg-amber-50/20 dark:bg-neutral-900/90 border-2 border-amber-300/80 dark:border-amber-800/70 shadow-xs'
          : 'bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700'
      } ${!isTrashView ? 'cursor-pointer hover:shadow-xs' : ''}`}
    >
      <div>
        {/* Card Header: Title & Action Icons */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            {isLocked && (
              <div className="mb-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100/90 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/80 shrink-0">
                  <Lock className="w-3 h-3" /> Locked Note
                </span>
              </div>
            )}
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2">
              {note.title.trim() || 'Untitled Note'}
            </h4>
          </div>

          <div className="flex items-center gap-1 shrink-0 -mr-1">
            {!isTrashView && onTogglePin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id, !note.isPinned);
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  note.isPinned
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                    : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
                title={note.isPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            {!isTrashView && onToggleFavorite && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id, !note.isFavorite);
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  note.isFavorite
                    ? 'text-amber-500'
                    : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                }`}
                title={note.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              >
                <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}

            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-20 text-xs font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isTrashView ? (
                    <>
                      {isLocked ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onSelect(note);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            Open Note
                          </button>
                          {onUnlock && (
                            <button
                              type="button"
                              onClick={() => {
                              setMenuOpen(false);
                              onUnlock(note.id);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Unlock Note
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onSelect(note);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                          Edit Note
                        </button>
                        {onLock && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(false);
                              onLock(note.id);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Lock Note
                          </button>
                        )}
                      </>
                    )}
                    {onDuplicate && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate(note.id);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        Duplicate
                      </button>
                    )}
                    {onArchive && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onArchive(note.id, !note.isArchived);
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      >
                        {note.isArchived ? (
                          <>
                            <ArchiveRestore className="w-3.5 h-3.5 text-neutral-400" />
                            Unarchive
                          </>
                        ) : (
                          <>
                            <Archive className="w-3.5 h-3.5 text-neutral-400" />
                            Archive
                          </>
                        )}
                      </button>
                    )}
                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(note.id);
                      }}
                      className="w-full px-3 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Move to Trash
                    </button>
                  </>
                ) : (
                    <>
                      {onRestore && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onRestore(note.id);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                          Restore Note
                        </button>
                      )}
                      {onPermanentDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            onPermanentDelete(note.id);
                          }}
                          className="w-full px-3 py-2 flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Permanently
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Snippet */}
        {isLocked ? (
          <div className="py-4 px-3 my-1 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Note is locked
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Tap card to enter 4-digit PIN
            </p>
          </div>
        ) : (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
            {snippet}
          </p>
        )}
      </div>

      {/* Footer: Tags and Timestamp */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3b82f6' }} />
                {t.name}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-600">No tags</span>
          )}
          {note.tags && note.tags.length > 2 && (
            <span className="text-[10px] text-neutral-400">+{note.tags.length - 2}</span>
          )}
        </div>

        <span className="text-[11px] text-neutral-400 dark:text-neutral-500 shrink-0">
          {formatRelativeTime(note.updatedAt)}
        </span>
      </div>
    </div>
  );
};
