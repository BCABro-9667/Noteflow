import React, { useState, useEffect } from 'react';
import { X, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Tag } from '../types';

interface TagModalProps {
  isOpen: boolean;
  tagToEdit?: Tag | null;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const COLOR_PALETTE = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
];

export const TagModal: React.FC<TagModalProps> = ({
  isOpen,
  tagToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tagToEdit) {
      setName(tagToEdit.name);
      setColor(tagToEdit.color || COLOR_PALETTE[0]);
    } else {
      setName('');
      setColor(COLOR_PALETTE[0]);
    }
    setError('');
  }, [tagToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tag name is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(name.trim(), color);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save tag.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tagToEdit || !onDelete) return;
    try {
      setLoading(true);
      await onDelete(tagToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="tag-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="tag-modal-box"
        className="relative w-full max-w-sm p-6 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <TagIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {tagToEdit ? 'Edit Tag' : 'Create New Tag'}
            </h3>
          </div>
          <button
            id="btn-close-tag-modal"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 text-xs rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Tag Name
            </label>
            <input
              id="input-tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Ideas, Meeting"
              maxLength={30}
              className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Badge Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-120 ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-neutral-900' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
            {tagToEdit && onDelete ? (
              <button
                id="btn-delete-tag"
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                id="btn-cancel-tag-modal"
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-save-tag"
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : tagToEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
