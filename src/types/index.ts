export interface Tag {
  id: string;
  name: string;
  color?: string;
  noteCount?: number;
  createdAt?: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isLocked?: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  hasPin?: boolean;
  createdAt?: string;
}

export type ViewMode = 'grid' | 'list';

export type FilterType = 'all' | 'favorites' | 'pinned' | 'archived' | 'trash';

export type SortOption = 'updated_desc' | 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc';

export type ThemeMode = 'light' | 'dark' | 'system';
