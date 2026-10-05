import React from 'react';
import { FileText, Plus, User as UserIcon, Star, Menu } from 'lucide-react';
import { FilterType } from '../types';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentFilter: FilterType;
  isProfileOpen: boolean;
  hasActiveNote: boolean;
  onSelectAllNotes: () => void;
  onSelectFavorites: () => void;
  onCreateNote: () => void;
  onOpenProfile: () => void;
  onOpenSidebar: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentFilter,
  isProfileOpen,
  hasActiveNote,
  onSelectAllNotes,
  onSelectFavorites,
  onCreateNote,
  onOpenProfile,
  onOpenSidebar,
}) => {
  const { user } = useAuth();
  const isAllNotesActive = !isProfileOpen && !hasActiveNote && currentFilter === 'all';
  const isFavoritesActive = !isProfileOpen && !hasActiveNote && currentFilter === 'favorites';

  return (
    <nav
      id="mobile-bottom-fixed-navbar"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200/80 dark:border-neutral-800/80 shadow-lg px-2 py-1.5"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* All Notes Button */}
        <button
          type="button"
          id="btn-mobile-nav-all-notes"
          onClick={onSelectAllNotes}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isAllNotesActive
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">All Notes</span>
        </button>

        {/* Favorites Button */}
        <button
          type="button"
          id="btn-mobile-nav-favorites"
          onClick={onSelectFavorites}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isFavoritesActive
              ? 'text-amber-500 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Star className={`w-5 h-5 mb-0.5 ${isFavoritesActive ? 'fill-current' : ''}`} />
          <span className="text-[10px] tracking-tight">Favorites</span>
        </button>

        {/* Create Note (Prominent Center Button) */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-4">
          <button
            type="button"
            id="btn-mobile-nav-create-note"
            onClick={onCreateNote}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 ring-4 ring-white dark:ring-neutral-900 transition-all cursor-pointer"
            title="Create New Note"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 mt-0.5">
            Create
          </span>
        </div>

        {/* Sidebar / Menu Button */}
        <button
          type="button"
          id="btn-mobile-nav-menu"
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>

        {/* Profile Button (Opens full dedicated profile page) */}
        <button
          type="button"
          id="btn-mobile-nav-profile"
          onClick={onOpenProfile}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isProfileOpen
              ? 'text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <div className="relative mb-0.5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className={`w-5 h-5 rounded-full object-cover border ${
                  isProfileOpen
                    ? 'border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}
              />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
            {user?.hasPin && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-neutral-900" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Profile</span>
        </button>
      </div>
    </nav>
  );
};
