import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Note, Tag, FilterType, SortOption, ViewMode } from './types';
import { api } from './lib/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { EmptyState } from './components/EmptyState';
import { TagModal } from './components/TagModal';
import { SettingsModal, SettingsTabType } from './components/SettingsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { PinModal, PinModalMode } from './components/PinModal';
import { ProfileScreen } from './components/ProfileScreen';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Loader2, X, Pin } from 'lucide-react';

function NotesDashboard() {
  const { user, loading: authLoading, checkPinStatus, updateHasPin } = useAuth();

  // Landing page & Auth modal overlay state
  const [showLandingPage, setShowLandingPage] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register';
  }>({
    isOpen: false,
    mode: 'login',
  });

  // State
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(true);

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('noteflow_default_view') as ViewMode) || 'grid';
  });

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals state
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabType>('account');
  const [showProfileScreen, setShowProfileScreen] = useState(false);

  // Note PIN Modal state
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    mode: PinModalMode;
    noteTitle?: string;
    noteId?: string;
    pendingNoteToLockId?: string;
    pendingDeleteNoteId?: string;
    isPermanentDelete?: boolean;
  }>({
    isOpen: false,
    mode: 'verify-to-open',
  });

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    action: async () => {},
  });

  // Fetch Tags
  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.tags.list();
      setTags(data.tags);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, [user]);

  // Fetch Notes
  const fetchNotes = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingNotes(true);
      const data = await api.notes.list({
        filter: currentFilter,
        tag: selectedTagId || undefined,
        search: searchQuery || undefined,
        sort: sortOption,
      });
      setNotes(data.notes);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  }, [user, currentFilter, selectedTagId, searchQuery, sortOption]);

  useEffect(() => {
    if (user) {
      fetchTags();
      fetchNotes();
    }
  }, [user, fetchTags, fetchNotes]);

  // Dynamic counts for sidebar badges
  const [allCounts, setAllCounts] = useState({
    all: 0,
    favorites: 0,
    pinned: 0,
    archived: 0,
    trash: 0,
  });

  const refreshCounts = useCallback(async () => {
    if (!user) return;
    try {
      const [allRes, favRes, pinRes, archRes, trashRes] = await Promise.all([
        api.notes.list({ filter: 'all' }),
        api.notes.list({ filter: 'favorites' }),
        api.notes.list({ filter: 'pinned' }),
        api.notes.list({ filter: 'archived' }),
        api.notes.list({ filter: 'trash' }),
      ]);
      setAllCounts({
        all: allRes.count,
        favorites: favRes.count,
        pinned: pinRes.count,
        archived: archRes.count,
        trash: trashRes.count,
      });
    } catch (err) {
      console.error('Failed to update counts:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCounts();
    }
  }, [user, notes, refreshCounts]);

  // Selected tag object
  const selectedTag = useMemo(
    () => tags.find((t) => t.id === selectedTagId) || null,
    [tags, selectedTagId]
  );

  // Group notes into pinned and other (for 'all' view when no search is active)
  const { pinnedNotes, otherNotes } = useMemo(() => {
    if (currentFilter === 'all' && !searchQuery && !selectedTagId) {
      return {
        pinnedNotes: notes.filter((n) => n.isPinned),
        otherNotes: notes.filter((n) => !n.isPinned),
      };
    }
    return {
      pinnedNotes: [],
      otherNotes: notes,
    };
  }, [notes, currentFilter, searchQuery, selectedTagId]);

  // Create Note - In-memory draft only. Empty notes are NEVER created in DB until containing characters!
  const handleCreateNote = () => {
    const draftNote: Note = {
      id: '',
      userId: user?.id || '',
      title: '',
      content: '',
      isPinned: currentFilter === 'pinned',
      isFavorite: currentFilter === 'favorites',
      isArchived: currentFilter === 'archived',
      isLocked: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: selectedTag ? [selectedTag] : [],
    };
    setActiveNote(draftNote);
    setShowProfileScreen(false);
  };

  // Save Note in Editor
  const handleSaveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    isPinned: boolean;
    isFavorite: boolean;
    isArchived: boolean;
    tags: string[];
  }): Promise<Note> => {
    const cleanTitle = noteData.title?.trim() || '';
    const cleanContent = noteData.content?.replace(/<[^>]*>/g, '').trim() || '';

    // Empty notes: never create or save if completely blank
    if (!cleanTitle && !cleanContent) {
      return {
        id: noteData.id || '',
        userId: user?.id || '',
        title: '',
        content: '',
        isPinned: noteData.isPinned,
        isFavorite: noteData.isFavorite,
        isArchived: noteData.isArchived,
        isLocked: false,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: tags.filter((t) => noteData.tags.includes(t.id)),
      };
    }

    let saved: Note;
    if (noteData.id) {
      const res = await api.notes.update(noteData.id, noteData);
      saved = res.note;
    } else {
      const res = await api.notes.create(noteData);
      saved = res.note;
    }

    // Update local state smoothly
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === saved.id);
      if (exists) {
        return prev.map((n) => (n.id === saved.id ? saved : n));
      }
      return [saved, ...prev];
    });

    fetchTags();
    refreshCounts();
    return saved;
  };

  // Toggle Pin on card
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      const res = await api.notes.update(id, { isPinned });
      setNotes((prev) => prev.map((n) => (n.id === id ? res.note : n)));
      refreshCounts();
    } catch (err) {
      console.error('Failed to pin/unpin note:', err);
    }
  };

  // Toggle Favorite on card
  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const res = await api.notes.update(id, { isFavorite });
      setNotes((prev) => prev.map((n) => (n.id === id ? res.note : n)));
      refreshCounts();
    } catch (err) {
      console.error('Failed to favorite note:', err);
    }
  };

  // Archive / Unarchive on card
  const handleArchive = async (id: string, isArchived: boolean) => {
    try {
      await api.notes.update(id, { isArchived });
      fetchNotes();
      refreshCounts();
    } catch (err) {
      console.error('Failed to toggle archive:', err);
    }
  };

  // Duplicate Note
  const handleDuplicate = async (id: string) => {
    try {
      const res = await api.notes.duplicate(id);
      setNotes((prev) => [res.note, ...prev]);
      refreshCounts();
    } catch (err) {
      console.error('Failed to duplicate note:', err);
    }
  };

  // Move to Trash (requires entering correct PIN first)
  const handleDeleteToTrash = async (id: string) => {
    const target = notes.find((n) => n.id === id) || (activeNote?.id === id ? activeNote : null);
    const hasPin = await checkPinStatus();

    if (!hasPin) {
      // If user has no PIN yet, redirect to PIN setup first
      setPinModal({
        isOpen: true,
        mode: 'setup',
        noteTitle: target?.title,
        noteId: id,
        pendingDeleteNoteId: id,
        isPermanentDelete: false,
      });
      return;
    }

    // User has PIN: prompt PIN verification -> correct PIN deletes immediately!
    setPinModal({
      isOpen: true,
      mode: 'verify-to-delete',
      noteTitle: target?.title,
      noteId: id,
      isPermanentDelete: false,
    });
  };

  // Restore Note from Trash
  const handleRestoreNote = async (id: string) => {
    try {
      await api.notes.restore(id);
      fetchNotes();
      refreshCounts();
    } catch (err) {
      console.error('Failed to restore note:', err);
    }
  };

  // Selecting a note (card click): if locked, require PIN
  const handleSelectNote = (note: Note) => {
    if (note.isLocked) {
      setPinModal({
        isOpen: true,
        mode: 'verify-to-open',
        noteTitle: note.title,
        noteId: note.id,
      });
    } else {
      setActiveNote(note);
    }
  };

  // Lock Note action
  const handleLockNote = async (id: string) => {
    const target = notes.find((n) => n.id === id) || (activeNote?.id === id ? activeNote : null);
    const hasPin = await checkPinStatus();

    if (!hasPin) {
      // If user has no PIN, redirect to PIN setup screen
      setPinModal({
        isOpen: true,
        mode: 'setup',
        noteTitle: target?.title,
        noteId: id,
        pendingNoteToLockId: id,
      });
      return;
    }

    // If PIN already exists, lock immediately without redirecting to profile
    try {
      const res = await api.notes.lock(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? res.note : n)));
      if (activeNote?.id === id) {
        setActiveNote(res.note);
      }
      refreshCounts();
    } catch (err) {
      console.error('Failed to lock note:', err);
    }
  };

  // Unlock Note action (from note ⋮ menu)
  const handleUnlockNote = (id: string) => {
    const target = notes.find((n) => n.id === id) || (activeNote?.id === id ? activeNote : null);
    setPinModal({
      isOpen: true,
      mode: 'verify-to-unlock',
      noteTitle: target?.title,
      noteId: id,
    });
  };

  // PinModal success handler
  const handlePinSuccess = async (data?: { pin?: string; noteId?: string }) => {
    const currentMode = pinModal.mode;
    const targetId = data?.noteId || pinModal.noteId;

    if (currentMode === 'verify-to-open') {
      if (targetId) {
        try {
          const fresh = await api.notes.get(targetId);
          setActiveNote(fresh.note);
        } catch {
          const found = notes.find((n) => n.id === targetId);
          if (found) setActiveNote(found);
        }
      }
      setPinModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    if (currentMode === 'verify-to-unlock') {
      if (targetId) {
        setNotes((prev) => prev.map((n) => (n.id === targetId ? { ...n, isLocked: false } : n)));
        if (activeNote?.id === targetId) {
          setActiveNote((prev) => (prev ? { ...prev, isLocked: false } : null));
        }
        refreshCounts();
      }
      setPinModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    if (currentMode === 'verify-to-delete') {
      const deleteId = targetId || pinModal.noteId;
      if (deleteId) {
        try {
          if (pinModal.isPermanentDelete) {
            await api.notes.permanentDelete(deleteId);
          } else {
            await api.notes.delete(deleteId);
          }
          if (activeNote?.id === deleteId) {
            setActiveNote(null);
          }
          fetchNotes();
          refreshCounts();
        } catch (err) {
          console.error('Failed to delete note after PIN verification:', err);
        }
      } else if (pinModal.noteTitle === 'All notes in trash') {
        try {
          await api.notes.emptyTrash();
          fetchNotes();
          refreshCounts();
        } catch (err) {
          console.error('Failed to empty trash after PIN verification:', err);
        }
      }
      setPinModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    if (currentMode === 'setup') {
      updateHasPin(true);
      // Automatically lock pending note if one was requested
      const pendingLockId = pinModal.pendingNoteToLockId;
      if (pendingLockId) {
        try {
          const res = await api.notes.lock(pendingLockId);
          setNotes((prev) => prev.map((n) => (n.id === pendingLockId ? res.note : n)));
          if (activeNote?.id === pendingLockId) {
            setActiveNote(res.note);
          }
          refreshCounts();
        } catch (err) {
          console.error('Failed to auto-lock note after PIN setup:', err);
        }
      }

      // Automatically delete pending note if one was requested
      const pendingDeleteId = pinModal.pendingDeleteNoteId;
      if (pendingDeleteId) {
        try {
          if (pinModal.isPermanentDelete) {
            await api.notes.permanentDelete(pendingDeleteId);
          } else {
            await api.notes.delete(pendingDeleteId);
          }
          if (activeNote?.id === pendingDeleteId) {
            setActiveNote(null);
          }
          fetchNotes();
          refreshCounts();
        } catch (err) {
          console.error('Failed to auto-delete note after PIN setup:', err);
        }
      }

      setPinModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    if (currentMode === 'change') {
      updateHasPin(true);
      setPinModal((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    if (currentMode === 'remove') {
      updateHasPin(false);
      setPinModal((prev) => ({ ...prev, isOpen: false }));
      fetchNotes();
      return;
    }
  };

  // Permanent Delete Note (requires entering correct PIN first)
  const handlePermanentDelete = async (id: string) => {
    const target = notes.find((n) => n.id === id) || (activeNote?.id === id ? activeNote : null);
    const hasPin = await checkPinStatus();

    if (!hasPin) {
      setPinModal({
        isOpen: true,
        mode: 'setup',
        noteTitle: target?.title,
        noteId: id,
        pendingDeleteNoteId: id,
        isPermanentDelete: true,
      });
      return;
    }

    setPinModal({
      isOpen: true,
      mode: 'verify-to-delete',
      noteTitle: target?.title,
      noteId: id,
      isPermanentDelete: true,
    });
  };

  // Empty Trash (requires entering correct PIN first)
  const handleEmptyTrash = async () => {
    const hasPin = await checkPinStatus();
    if (hasPin) {
      setPinModal({
        isOpen: true,
        mode: 'verify-to-delete',
        noteTitle: 'All notes in trash',
        isPermanentDelete: true,
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Empty entire trash?',
      description: 'Are you sure you want to permanently delete all notes currently in the trash? This cannot be reversed.',
      confirmLabel: 'Empty Trash',
      isDestructive: true,
      action: async () => {
        try {
          await api.notes.emptyTrash();
          fetchNotes();
          refreshCounts();
        } catch (err) {
          console.error('Failed to empty trash:', err);
        }
      },
    });
  };

  // Save Tag (Create or Edit)
  const handleSaveTag = async (name: string, color: string) => {
    if (tagToEdit) {
      await api.tags.update(tagToEdit.id, { name, color });
    } else {
      await api.tags.create({ name, color });
    }
    fetchTags();
    fetchNotes();
  };

  // Delete Tag
  const handleDeleteTag = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete tag?',
      description: 'This tag will be removed from all associated notes. The notes themselves will not be deleted.',
      confirmLabel: 'Delete Tag',
      isDestructive: true,
      action: async () => {
        await api.tags.delete(id);
        if (selectedTagId === id) {
          setSelectedTagId(null);
        }
        fetchTags();
        fetchNotes();
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-500">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
        <p className="text-xs">Loading workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode = 'login') => setAuthModalConfig({ isOpen: true, mode })}
          onEnterWorkspace={() => setAuthModalConfig({ isOpen: true, mode: 'login' })}
        />
        {authModalConfig.isOpen && (
          <AuthModal
            isOpen={authModalConfig.isOpen}
            initialMode={authModalConfig.mode}
            isOverlay={true}
            onClose={() => setAuthModalConfig((prev) => ({ ...prev, isOpen: false }))}
          />
        )}
      </>
    );
  }

  if (showLandingPage) {
    return (
      <LandingPage
        onOpenAuth={() => setShowLandingPage(false)}
        onEnterWorkspace={() => setShowLandingPage(false)}
      />
    );
  }

  return (
    <div id="noteflow-app-root" className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased font-sans">
      {/* Persistent / Mobile Sidebar */}
      <Sidebar
        currentFilter={currentFilter}
        selectedTagId={selectedTagId}
        tags={tags}
        noteCounts={allCounts}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onSelectFilter={(f) => {
          setCurrentFilter(f);
          setActiveNote(null);
        }}
        onSelectTag={(tId) => {
          setSelectedTagId(tId);
          setActiveNote(null);
        }}
        onCreateNote={handleCreateNote}
        onOpenTagModal={(tag) => {
          setTagToEdit(tag || null);
          setTagModalOpen(true);
        }}
        onOpenSettings={() => {
          setShowProfileScreen(true);
          setActiveNote(null);
        }}
        onShowLanding={() => setShowLandingPage(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-neutral-900 relative">
        {showProfileScreen ? (
          /* Full Dedicated Screen of Profile Page (NOT a modal) */
          <ProfileScreen
            defaultView={viewMode}
            onBack={() => setShowProfileScreen(false)}
            onDefaultViewChange={(mode) => {
              setViewMode(mode);
              localStorage.setItem('noteflow_default_view', mode);
            }}
            onOpenPinModal={(mode) => {
              setPinModal({
                isOpen: true,
                mode,
              });
            }}
            totalNotes={notes.length}
          />
        ) : activeNote !== null ? (
          /* Rich Note Editor View */
          <NoteEditor
            note={activeNote}
            tags={tags}
            onBack={() => {
              setActiveNote(null);
              fetchNotes();
            }}
            onSave={handleSaveNote}
            onDelete={(id) => {
              handleDeleteToTrash(id);
              setActiveNote(null);
            }}
            onOpenTagModal={() => {
              setTagToEdit(null);
              setTagModalOpen(true);
            }}
            onLock={handleLockNote}
            onUnlock={handleUnlockNote}
          />
        ) : (
          /* Notes Dashboard List/Grid View */
          <div className="flex flex-col h-full overflow-hidden">
            <Header
              currentFilter={currentFilter}
              selectedTag={selectedTag}
              searchQuery={searchQuery}
              viewMode={viewMode}
              sortOption={sortOption}
              totalNotes={notes.length}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              onSearchChange={setSearchQuery}
              onClearSearch={() => setSearchQuery('')}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                localStorage.setItem('noteflow_default_view', mode);
              }}
              onSortChange={setSortOption}
              onCreateNote={handleCreateNote}
              onEmptyTrash={currentFilter === 'trash' ? handleEmptyTrash : undefined}
              onShowLanding={() => setShowLandingPage(true)}
            />

            {/* Filter Pills Bar (if search or tag is active) */}
            {(searchQuery || selectedTag) && (
              <div className="flex items-center gap-2 px-4 sm:px-8 py-2 bg-neutral-50/70 dark:bg-neutral-900/60 border-b border-neutral-100 dark:border-neutral-800 text-xs shrink-0">
                <span className="text-neutral-400 dark:text-neutral-500 font-medium">Filtered by:</span>
                {selectedTag && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedTag.color || '#3b82f6' }} />
                    Tag: {selectedTag.name}
                    <button
                      type="button"
                      onClick={() => setSelectedTagId(null)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Notes Container */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-28 md:pb-6">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-20 text-neutral-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-xs">Updating notes...</span>
                </div>
              ) : notes.length === 0 ? (
                <EmptyState
                  filter={currentFilter}
                  searchQuery={searchQuery}
                  selectedTag={selectedTag?.name}
                  onCreateNote={handleCreateNote}
                  onClearSearch={() => setSearchQuery('')}
                />
              ) : (
                <div className="space-y-6">
                  {/* Pinned section (when in All Notes without search) */}
                  {pinnedNotes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        <Pin className="w-3.5 h-3.5 fill-current text-blue-500" />
                        <span>Pinned ({pinnedNotes.length})</span>
                      </div>
                      <div
                        className={
                          viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                            : 'space-y-2'
                        }
                      >
                        {pinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            viewMode={viewMode}
                            isTrashView={false}
                            onSelect={handleSelectNote}
                            onTogglePin={handleTogglePin}
                            onToggleFavorite={handleToggleFavorite}
                            onArchive={handleArchive}
                            onDuplicate={handleDuplicate}
                            onLock={handleLockNote}
                            onUnlock={handleUnlockNote}
                            onDelete={handleDeleteToTrash}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other / Standard Notes Section */}
                  {otherNotes.length > 0 && (
                    <div>
                      {pinnedNotes.length > 0 && (
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          <span>Others ({otherNotes.length})</span>
                        </div>
                      )}
                      <div
                        className={
                          viewMode === 'grid'
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                            : 'space-y-2'
                        }
                      >
                        {otherNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            viewMode={viewMode}
                            isTrashView={currentFilter === 'trash'}
                            onSelect={handleSelectNote}
                            onTogglePin={currentFilter !== 'trash' ? handleTogglePin : undefined}
                            onToggleFavorite={currentFilter !== 'trash' ? handleToggleFavorite : undefined}
                            onArchive={currentFilter !== 'trash' ? handleArchive : undefined}
                            onDuplicate={currentFilter !== 'trash' ? handleDuplicate : undefined}
                            onLock={currentFilter !== 'trash' ? handleLockNote : undefined}
                            onUnlock={currentFilter !== 'trash' ? handleUnlockNote : undefined}
                            onDelete={handleDeleteToTrash}
                            onRestore={currentFilter === 'trash' ? handleRestoreNote : undefined}
                            onPermanentDelete={currentFilter === 'trash' ? handlePermanentDelete : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Fixed Navbar */}
      <MobileBottomNav
        currentFilter={currentFilter}
        isProfileOpen={showProfileScreen}
        hasActiveNote={activeNote !== null}
        onSelectAllNotes={() => {
          setShowProfileScreen(false);
          setActiveNote(null);
          setCurrentFilter('all');
          setSelectedTagId(null);
        }}
        onSelectFavorites={() => {
          setShowProfileScreen(false);
          setActiveNote(null);
          setCurrentFilter('favorites');
        }}
        onCreateNote={() => {
          setShowProfileScreen(false);
          handleCreateNote();
        }}
        onOpenProfile={() => {
          setShowProfileScreen(true);
          setActiveNote(null);
        }}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* Modals & Dialogs */}
      <TagModal
        isOpen={tagModalOpen}
        tagToEdit={tagToEdit}
        onClose={() => {
          setTagModalOpen(false);
          setTagToEdit(null);
        }}
        onSave={handleSaveTag}
        onDelete={tagToEdit ? () => handleDeleteTag(tagToEdit.id) : undefined}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        defaultView={viewMode}
        initialTab={settingsInitialTab}
        onClose={() => setSettingsModalOpen(false)}
        onDefaultViewChange={(mode) => {
          setViewMode(mode);
          localStorage.setItem('noteflow_default_view', mode);
        }}
        onOpenPinModal={(mode) => {
          setPinModal({
            isOpen: true,
            mode,
          });
        }}
      />

      {/* Full-screen PIN Verification & Management Modal */}
      <PinModal
        isOpen={pinModal.isOpen}
        mode={pinModal.mode}
        noteTitle={pinModal.noteTitle}
        noteId={pinModal.noteId}
        isPermanentDelete={pinModal.isPermanentDelete}
        onClose={() => setPinModal((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handlePinSuccess}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotesDashboard />
      </AuthProvider>
    </ThemeProvider>
  );
}
