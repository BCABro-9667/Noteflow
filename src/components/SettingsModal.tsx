import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Palette,
  Sliders,
  Shield,
  ShieldCheck,
  KeyRound,
  Unlock,
  Sun,
  Moon,
  Monitor,
  Check,
  Lock,
  LogOut,
  Database,
  Link as LinkIcon,
  RefreshCw,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, ViewMode } from '../types';
import { api } from '../lib/api';
import { PinModalMode } from './PinModal';

export type SettingsTabType = 'account' | 'note-security' | 'appearance' | 'preferences' | 'security' | 'storage';

interface SettingsModalProps {
  isOpen: boolean;
  defaultView: ViewMode;
  initialTab?: SettingsTabType;
  onClose: () => void;
  onDefaultViewChange: (view: ViewMode) => void;
  onOpenPinModal?: (mode: PinModalMode) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  defaultView,
  initialTab = 'account',
  onClose,
  onDefaultViewChange,
  onOpenPinModal,
}) => {
  const { user, setUser, logout, logoutAll } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // DP (Display Picture) by link state
  const [dpLinkInput, setDpLinkInput] = useState('');
  const [dpPreviewValid, setDpPreviewValid] = useState<boolean | null>(null);

  // System Database & Cache diagnostics state
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [cacheFlushMessage, setCacheFlushMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const fetchSystemStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (err) {
      console.warn('Failed to load system diagnostics:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFlushCache = async () => {
    try {
      setCacheFlushMessage('Flushing...');
      const res = await fetch('/api/system/flush-cache', { method: 'POST' });
      if (res.ok) {
        setCacheFlushMessage('Cache flushed successfully!');
        fetchSystemStatus();
        setTimeout(() => setCacheFlushMessage(null), 3000);
      }
    } catch {
      setCacheFlushMessage('Failed to flush cache');
    }
  };

  const handleApplyDpLink = async () => {
    if (!dpLinkInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid image link URL.' });
      return;
    }
    const cleanUrl = dpLinkInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setStatusMessage({ type: 'error', text: 'Image link must start with http:// or https://' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.auth.updateProfile({ avatar: cleanUrl });
      setUser(res.user);
      setDpLinkInput('');
      setDpPreviewValid(null);
      setStatusMessage({ type: 'success', text: 'Display picture updated successfully from link!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update avatar link.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetInitialsAvatar = async () => {
    try {
      setSaving(true);
      const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`;
      const res = await api.auth.updateProfile({ avatar: initialsUrl });
      setUser(res.user);
      setStatusMessage({ type: 'success', text: 'Reset avatar to name initials.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset avatar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setSaving(true);
      const res = await api.auth.updateProfile({
        name: name.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setUser(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const AVATAR_OPTIONS = [
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="settings-modal-box"
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[560px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-56 p-4 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 shrink-0">
          <div className="flex items-center justify-between md:mb-6">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Settings</h2>
            <button
              id="btn-settings-mobile-close"
              onClick={onClose}
              className="md:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex md:flex-col gap-1 mt-2 md:mt-0 overflow-x-auto md:overflow-visible">
            <button
              id="btn-settings-tab-account"
              onClick={() => {
                setActiveTab('account');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'account'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              Account
            </button>

            <button
              id="btn-settings-tab-note-security"
              onClick={() => {
                setActiveTab('note-security');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'note-security'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              Note Security
            </button>

            <button
              id="btn-settings-tab-appearance"
              onClick={() => {
                setActiveTab('appearance');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'appearance'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              Appearance
            </button>

            <button
              id="btn-settings-tab-preferences"
              onClick={() => {
                setActiveTab('preferences');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'preferences'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              Preferences
            </button>

            <button
              id="btn-settings-tab-security"
              onClick={() => {
                setActiveTab('security');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              Security
            </button>

            <button
              id="btn-settings-tab-storage"
              onClick={() => {
                setActiveTab('storage');
                setStatusMessage(null);
                fetchSystemStatus();
              }}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'storage'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              Database & Cache
            </button>
          </nav>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="hidden md:flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {activeTab} Settings
              </h3>
              <button
                id="btn-settings-desktop-close"
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {statusMessage && (
              <div
                className={`mb-4 p-3 text-xs rounded-lg border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
                }`}
              >
                {statusMessage.text}
              </div>
            )}

            {/* TAB: ACCOUNT */}
            {activeTab === 'account' && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Profile Avatar & DP Upload by Link */}
                <div className="p-3.5 rounded-xl bg-neutral-50/80 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Display Picture (DP)
                    </label>
                    <button
                      type="button"
                      onClick={handleResetInitialsAvatar}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Reset to Initials
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={user?.avatar || AVATAR_OPTIONS[0]}
                        alt="Active Avatar"
                        className="w-14 h-14 rounded-full border-2 border-blue-500/30 object-cover shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-blue-600 text-[9px] font-bold text-white rounded-full">
                        DP
                      </span>
                    </div>

                    <div className="flex-1 space-y-1">
                      <p className="text-[11px] font-medium text-neutral-800 dark:text-neutral-200">
                        {user?.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate max-w-[260px]">
                        {user?.avatar?.startsWith('data:') ? 'Custom image' : user?.avatar || 'No link set'}
                      </p>

                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-neutral-400">Presets:</span>
                        {AVATAR_OPTIONS.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              api.auth.updateProfile({ avatar: url }).then((res) => {
                                setUser(res.user);
                                setStatusMessage({ type: 'success', text: 'DP updated to preset!' });
                              });
                            }}
                            className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:scale-110 transition-transform cursor-pointer"
                            title={`Choose preset ${i + 1}`}
                          >
                            <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* DP Upload / Update by Direct Link */}
                  <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                      Upload / Set DP via Image Link:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
                        <input
                          id="input-dp-link-url"
                          type="url"
                          placeholder="Paste image URL (https://...)"
                          value={dpLinkInput}
                          onChange={(e) => {
                            setDpLinkInput(e.target.value);
                            setDpPreviewValid(null);
                          }}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <button
                        id="btn-apply-dp-link"
                        type="button"
                        onClick={handleApplyDpLink}
                        disabled={saving || !dpLinkInput.trim()}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        Apply DP
                      </button>
                    </div>

                    {/* Live link preview detector */}
                    {dpLinkInput.trim() && (
                      <div className="flex items-center gap-2 pt-1">
                        <img
                          src={dpLinkInput.trim()}
                          alt="Test Link Preview"
                          onLoad={() => setDpPreviewValid(true)}
                          onError={() => setDpPreviewValid(false)}
                          className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-neutral-600"
                        />
                        <span className="text-[11px]">
                          {dpPreviewValid === true && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ Image verified & ready to set
                            </span>
                          )}
                          {dpPreviewValid === false && (
                            <span className="text-red-500 font-medium">
                              ✗ Unable to load image from this URL
                            </span>
                          )}
                          {dpPreviewValid === null && (
                            <span className="text-neutral-400">Verifying image link...</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/50 rounded-lg text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-[11px] text-neutral-400">Email cannot be changed after registration.</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Change Password
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="password"
                        placeholder="New password (6+ chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    id="btn-save-account-settings"
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Account Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: NOTE SECURITY & PIN */}
            {activeTab === 'note-security' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Note Security & PIN
                    </h4>
                    {user?.hasPin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                        <ShieldCheck className="w-3.5 h-3.5" /> PIN Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                        <Lock className="w-3.5 h-3.5" /> No PIN Set
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Lock confidential notes behind a 4-digit PIN. Locked notes hide their content on all devices and require verification to open or unlock.
                  </p>

                  {/* Note PIN Management Card */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                            4-Digit Note PIN
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                            {user?.hasPin
                              ? 'Your 4-digit PIN is active. It is stored as a secure salted hash and never exposed.'
                              : 'No PIN is currently configured. Create a PIN to start locking sensitive notes.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {user?.hasPin ? (
                      <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500">Configured PIN:</span>
                          <span className="tracking-widest font-mono text-base font-bold text-neutral-800 dark:text-neutral-200">
                            ••••
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            id="btn-settings-change-pin"
                            onClick={() => onOpenPinModal?.('change')}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                          >
                            Change PIN
                          </button>
                          <button
                            type="button"
                            id="btn-settings-remove-pin"
                            onClick={() => onOpenPinModal?.('remove')}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                          >
                            Remove PIN
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          Create a PIN to protect sensitive thoughts and confidential records.
                        </p>
                        <button
                          type="button"
                          id="btn-settings-setup-pin"
                          onClick={() => onOpenPinModal?.('setup')}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
                        >
                          Set Note PIN
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Security Guidance List */}
                  <div className="mt-5 space-y-2.5">
                    <h5 className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      How Note Security Works
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-blue-500" />
                          1. Lock Note
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Tap the ⋮ menu on any note card and click &ldquo;Lock Note&rdquo;.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          2. Masked Preview
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Content snippet is hidden from sight across all view modes.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                          3. PIN Verification
                        </span>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Enter your 4-digit PIN on the full-screen prompt to open or unlock.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Color Theme</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Choose how NoteFlow looks to you. Select Light, Dark, or sync with your system.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      id="btn-theme-light"
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        theme === 'light'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span className="text-xs font-medium">Light</span>
                      {theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>

                    <button
                      id="btn-theme-dark"
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        theme === 'dark'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                      <span className="text-xs font-medium">Dark</span>
                      {theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>

                    <button
                      id="btn-theme-system"
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        theme === 'system'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <Monitor className="w-5 h-5" />
                      <span className="text-xs font-medium">System</span>
                      {theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Default Notes View
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Choose whether you prefer dense lists or clean visual cards by default.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onDefaultViewChange('grid');
                        localStorage.setItem('noteflow_default_view', 'grid');
                      }}
                      className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        defaultView === 'grid'
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Grid View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDefaultViewChange('list');
                        localStorage.setItem('noteflow_default_view', 'list');
                      }}
                      className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        defaultView === 'list'
                          ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      List View
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                    Editor Auto-Save
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Auto-save runs seamlessly in the background with debounced updates. Non-intrusive status indicators keep you informed without noisy notifications.
                  </p>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                {/* Note PIN Quick Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        Note PIN Security
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {user?.hasPin ? 'PIN is configured and active' : 'No PIN configured yet'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('note-security')}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-neutral-800 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
                  >
                    Manage PIN
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Active Sessions</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Manage session tokens across devices and browsers.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">Current Session</p>
                        <p className="text-[11px] text-neutral-500">Active right now in this browser</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await logout();
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                      <div>
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">All Sessions</p>
                        <p className="text-[11px] text-neutral-500">Revoke tokens on all phones, tablets and laptops</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await logoutAll();
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Log Out Everywhere
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DATABASE & CACHE */}
            {activeTab === 'storage' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      Storage Engine & In-Memory Cache
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Real-time inspection of your MongoDB connection and caching layer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSystemStatus}
                    disabled={loadingStatus}
                    className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    title="Refresh diagnostics"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {cacheFlushMessage && (
                  <div className="p-2.5 text-xs rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {cacheFlushMessage}
                  </div>
                )}

                {/* MongoDB Card */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        MongoDB Database
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        systemStatus?.mongo?.connected
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {systemStatus?.mongo?.connected ? 'Atlas Connected' : 'Fallback Engine Ready'}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                    {systemStatus?.mongo?.connected
                      ? `Connected to database "${systemStatus.mongo.database || 'noteflow'}". User accounts, notes, and tags are dual-written to MongoDB.`
                      : 'Dual-persistence is active. Provide MONGODB_URI in .env or settings to automatically sync all collections to your cloud Atlas cluster.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 block text-[10px]">Architecture</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        Dual Mongo + Relational
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                      <span className="text-neutral-400 block text-[10px]">Status</span>
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {systemStatus?.mongo?.connected ? 'Synced Online' : 'Standby / Local-First'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cache Card */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        In-Memory TTL Cache
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Sub-Millisecond Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                      <span className="text-neutral-400 block text-[10px]">Hits</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                        {systemStatus?.cache?.hits ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                      <span className="text-neutral-400 block text-[10px]">Misses</span>
                      <span className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                        {systemStatus?.cache?.misses ?? 0}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                      <span className="text-neutral-400 block text-[10px]">Hit Rate</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {systemStatus?.cache?.hitRate ?? '100%'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      Cached keys: {systemStatus?.cache?.keysCached ?? 0}
                    </span>
                    <button
                      id="btn-flush-cache"
                      type="button"
                      onClick={handleFlushCache}
                      className="px-3 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      Flush Cache
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
            <button
              id="btn-close-settings-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
