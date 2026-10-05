import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Pin,
  Star,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag as TagIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Check,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import { Note, Tag } from '../types';

interface NoteEditorProps {
  note: Note | null;
  tags: Tag[];
  onBack: () => void;
  onSave: (noteData: {
    id?: string;
    title: string;
    content: string;
    isPinned: boolean;
    isFavorite: boolean;
    isArchived: boolean;
    tags: string[];
  }) => Promise<Note>;
  onDelete: (id: string) => void;
  onOpenTagModal: () => void;
  onLock?: (id: string) => void;
  onUnlock?: (id: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  tags,
  onBack,
  onSave,
  onDelete,
  onOpenTagModal,
  onLock,
  onUnlock,
}) => {
  const [title, setTitle] = useState(note?.title || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [isArchived, setIsArchived] = useState(note?.isArchived || false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    note?.tags?.map((t) => t.id) || []
  );

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentNoteIdRef = useRef<string | undefined>(note?.id);

  // Sync state if incoming note changes
  useEffect(() => {
    currentNoteIdRef.current = note?.id;
    setTitle(note?.title || '');
    setIsPinned(note?.isPinned || false);
    setIsFavorite(note?.isFavorite || false);
    setIsArchived(note?.isArchived || false);
    setSelectedTagIds(note?.tags?.map((t) => t.id) || []);
    setSaveStatus('saved');

    if (editorRef.current) {
      editorRef.current.innerHTML = note?.content || '';
      updateStats();
    }
  }, [note?.id]);

  // Click outside to close tag dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    };
    if (tagDropdownOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [tagDropdownOpen]);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const triggerSave = useCallback(
    async (overrideData?: Partial<{
      title: string;
      content: string;
      isPinned: boolean;
      isFavorite: boolean;
      isArchived: boolean;
      tags: string[];
    }>) => {
      setSaveStatus('saving');
      try {
        const contentHtml = editorRef.current?.innerHTML || '';
        const savedNote = await onSave({
          id: currentNoteIdRef.current,
          title: overrideData?.title !== undefined ? overrideData.title : title,
          content: overrideData?.content !== undefined ? overrideData.content : contentHtml,
          isPinned: overrideData?.isPinned !== undefined ? overrideData.isPinned : isPinned,
          isFavorite: overrideData?.isFavorite !== undefined ? overrideData.isFavorite : isFavorite,
          isArchived: overrideData?.isArchived !== undefined ? overrideData.isArchived : isArchived,
          tags: overrideData?.tags !== undefined ? overrideData.tags : selectedTagIds,
        });

        if (savedNote?.id) {
          currentNoteIdRef.current = savedNote.id;
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('unsaved');
      }
    },
    [title, isPinned, isFavorite, isArchived, selectedTagIds, onSave]
  );

  const scheduleAutoSave = () => {
    setSaveStatus('unsaved');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      triggerSave();
    }, 1000);
  };

  // Keyboard shortcut handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      triggerSave();
    }
  };

  // Formatting commands
  const applyFormat = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    updateStats();
    scheduleAutoSave();
  };

  const formatHeading = (level: number) => {
    applyFormat('formatBlock', `<h${level}>`);
  };

  const insertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checkboxHtml = `<div class="flex items-start gap-2 my-1.5"><input type="checkbox" class="mt-1 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-0 cursor-pointer" /> <span>Task item...</span></div>`;
    document.execCommand('insertHTML', false, checkboxHtml);
    updateStats();
    scheduleAutoSave();
  };

  const insertCodeBlock = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const codeHtml = `<pre class="p-3 my-2 bg-neutral-100 dark:bg-neutral-800 font-mono text-xs rounded-lg overflow-x-auto text-neutral-800 dark:text-neutral-200"><code>// write code here</code></pre><p><br/></p>`;
    document.execCommand('insertHTML', false, codeHtml);
    updateStats();
    scheduleAutoSave();
  };

  const insertQuote = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const quoteHtml = `<blockquote class="pl-3.5 my-2 border-l-2 border-neutral-400 dark:border-neutral-600 italic text-neutral-600 dark:text-neutral-400"><p>Quote...</p></blockquote><p><br/></p>`;
    document.execCommand('insertHTML', false, quoteHtml);
    updateStats();
    scheduleAutoSave();
  };

  const toggleTag = (tagId: string) => {
    const nextTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setSelectedTagIds(nextTags);
    triggerSave({ tags: nextTags });
  };

  return (
    <div id="note-editor-container" className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Top action header */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 border-b border-neutral-100 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-900/90 shrink-0">
        <div className="flex items-center gap-2">
          <button
            id="btn-editor-back"
            type="button"
            onClick={async () => {
              if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
              if (saveStatus === 'unsaved') {
                await triggerSave();
              }
              onBack();
            }}
            className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            title="Back to notes list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Auto-save status */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs">
            {saveStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-neutral-400 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Saving...
              </span>
            ) : saveStatus === 'saved' ? (
              <span className="flex items-center gap-1 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Saved
              </span>
            ) : (
              <span className="flex items-center gap-1 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                Unsaved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Word / Char count */}
          <span className="hidden md:inline-block text-[11px] text-neutral-400 dark:text-neutral-500 mr-2">
            {wordCount} words &bull; {charCount} chars
          </span>

          {/* Tag selector dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              id="btn-editor-tags"
              type="button"
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                selectedTagIds.length > 0
                  ? 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tags</span>
              {selectedTagIds.length > 0 && (
                <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px]">
                  {selectedTagIds.length}
                </span>
              )}
            </button>

            {tagDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-30">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <span>Assign Tags</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTagDropdownOpen(false);
                      onOpenTagModal();
                    }}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tags.length === 0 ? (
                    <p className="p-2 text-center text-xs text-neutral-400">No tags created yet.</p>
                  ) : (
                    tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium'
                              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3b82f6' }} />
                            <span className="truncate">{t.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <button
            id="btn-editor-pin"
            type="button"
            onClick={() => {
              const nextVal = !isPinned;
              setIsPinned(nextVal);
              triggerSave({ isPinned: nextVal });
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isPinned
                ? 'border-blue-200 dark:border-blue-900 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'
            }`}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
          </button>

          {/* Favorite toggle */}
          <button
            id="btn-editor-star"
            type="button"
            onClick={() => {
              const nextVal = !isFavorite;
              setIsFavorite(nextVal);
              triggerSave({ isFavorite: nextVal });
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFavorite
                ? 'border-amber-200 dark:border-amber-900 bg-amber-50 text-amber-500 dark:bg-amber-950/40'
                : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Archive toggle */}
          <button
            id="btn-editor-archive"
            type="button"
            onClick={() => {
              const nextVal = !isArchived;
              setIsArchived(nextVal);
              triggerSave({ isArchived: nextVal });
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isArchived
                ? 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                : 'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400'
            }`}
            title={isArchived ? 'Unarchive note' : 'Archive note'}
          >
            {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          {/* Lock / Unlock Note */}
          {note?.id && (
            note.isLocked ? (
              <button
                id="btn-editor-unlock"
                type="button"
                onClick={() => onUnlock && onUnlock(note.id)}
                className="px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-2xs"
                title="Note is locked. Click to unlock permanently."
              >
                <Lock className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Locked</span>
              </button>
            ) : (
              <button
                id="btn-editor-lock"
                type="button"
                onClick={() => onLock && onLock(note.id)}
                className="p-1.5 rounded-lg border border-transparent hover:bg-amber-50 dark:hover:bg-amber-950/30 text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                title="Lock note with PIN"
              >
                <Lock className="w-4 h-4" />
              </button>
            )
          )}

          {/* Delete */}
          {note?.id && (
            <button
              id="btn-editor-delete"
              type="button"
              onClick={() => onDelete(note.id)}
              className="p-1.5 rounded-lg border border-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Move to trash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 px-4 sm:px-8 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 overflow-x-auto text-neutral-600 dark:text-neutral-400 shrink-0">
        <button
          type="button"
          onClick={() => formatHeading(1)}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatHeading(2)}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatHeading(3)}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={() => applyFormat('bold')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('strikeThrough')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={() => applyFormat('insertUnorderedList')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => applyFormat('insertOrderedList')}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertChecklist}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Insert Checklist Item"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-300 dark:bg-neutral-700 mx-1" />

        <button
          type="button"
          onClick={insertQuote}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertCodeBlock}
          className="p-1.5 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 rounded-md transition-colors"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-6 max-w-4xl mx-auto w-full"
        onKeyDown={handleKeyDown}
      >
        {/* Title Input */}
        <input
          id="input-note-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleAutoSave();
          }}
          placeholder="Note Title..."
          className="w-full text-2xl sm:text-3xl font-bold bg-transparent border-0 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 mb-4"
        />

        {/* Selected tags badges */}
        {selectedTagIds.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {selectedTagIds.map((tid) => {
              const t = tags.find((item) => item.id === tid);
              if (!t) return null;
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3b82f6' }} />
                  {t.name}
                  <button
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Rich content area */}
        <div
          id="editor-content-area"
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            updateStats();
            scheduleAutoSave();
          }}
          data-placeholder="Start typing your thoughts, notes, and tasks..."
          className="outline-none min-h-[400px] text-neutral-800 dark:text-neutral-200 text-base leading-relaxed prose dark:prose-invert max-w-none focus:outline-none"
        />
      </div>
    </div>
  );
};
