import React, { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  ShieldCheck,
  KeyRound,
  Lock,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  LogOut,
  Save,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode, ViewMode } from '../types';
import { api } from '../lib/api';
import { PinModalMode } from './PinModal';

interface ProfileScreenProps {
  defaultView: ViewMode;
  onBack: () => void;
  onDefaultViewChange: (view: ViewMode) => void;
  onOpenPinModal: (mode: PinModalMode) => void;
  totalNotes?: number;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  defaultView,
  onBack,
  onDefaultViewChange,
  onOpenPinModal,
  totalNotes = 0,
}) => {
  const { user, setUser, logout, logoutAll } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<'security' | 'account' | 'appearance'>('security');

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Custom DP Link input
  const [dpLinkInput, setDpLinkInput] = useState('');

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  ];

  const handleApplyDpLink = async () => {
    if (!dpLinkInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid image URL.' });
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
      setStatusMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update avatar link.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    try {
      setSaving(true);
      setStatusMessage(null);
      const res = await api.auth.updateProfile({ avatar: url });
      setUser(res.user);
      setStatusMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update avatar.' });
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
      setStatusMessage({ type: 'success', text: 'Reset avatar to initials.' });
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
      setStatusMessage({ type: 'success', text: 'Profile changes saved successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="dedicated-profile-screen"
      className="min-h-screen w-full bg-neutral-50 dark:bg-neutral-950 flex flex-col text-neutral-900 dark:text-neutral-100 pb-24 md:pb-12 animate-in fade-in duration-200"
    >
      {/* Top App Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-profile-screen-back"
            onClick={onBack}
            className="p-2 -ml-1 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            title="Back to notes"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Back to Notes</span>
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight">Profile &amp; Settings</h1>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:block">
              Manage your personal info, Note PIN security, and preferences
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
        >
          Done
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* User Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="relative group">
            <img
              src={
                user?.avatar ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`
              }
              alt="Avatar"
              className="w-20 h-20 rounded-full border-2 border-blue-500/30 object-cover shadow-md"
            />
            {user?.hasPin && (
              <span
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-neutral-900 flex items-center justify-center shadow-xs"
                title="PIN Protection Active"
              >
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl font-bold tracking-tight truncate">{user?.name || 'User'}</h2>
              {user?.hasPin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                  <ShieldCheck className="w-3.5 h-3.5" /> PIN Protected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
                  <Lock className="w-3.5 h-3.5" /> No PIN Set
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">{user?.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>{totalNotes} Total Notes</span>
              </span>
              <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>SHA-256 Auth</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation Pills */}
        <div className="flex items-center gap-2 p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'security'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Note Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('account')}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'account'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('appearance')}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'appearance'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: NOTE SECURITY & 4-DIGIT PIN */}
        {activeSection === 'security' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>4-Digit Note PIN</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Protect confidential thoughts behind a 4-digit PIN. Locked notes hide their content and require verification to open, unlock, or delete.
                  </p>
                </div>
              </div>

              {/* Status & Actions Box */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                      Security Status
                    </span>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {user?.hasPin
                        ? 'Your PIN is securely hashed using SHA-256 and active on your account.'
                        : 'No PIN is set. Create a 4-digit PIN to begin locking sensitive notes.'}
                    </p>
                  </div>

                  {user?.hasPin ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 shrink-0">
                      Disabled
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-700/80 flex flex-wrap items-center justify-between gap-3">
                  {user?.hasPin ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Configured PIN:</span>
                        <span className="tracking-widest font-mono text-base font-bold text-neutral-800 dark:text-neutral-200">
                          ••••
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="btn-profile-change-pin"
                          onClick={() => onOpenPinModal('change')}
                          className="px-3.5 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                        >
                          Change PIN
                        </button>
                        <button
                          type="button"
                          id="btn-profile-remove-pin"
                          onClick={() => onOpenPinModal('remove')}
                          className="px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                        >
                          Remove PIN
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        Set up a PIN to lock notes from the &ldquo;⋮&rdquo; menu.
                      </p>
                      <button
                        type="button"
                        id="btn-profile-setup-pin"
                        onClick={() => onOpenPinModal('setup')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Create Note PIN
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Guidance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    Lock Note
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Click &ldquo;Lock Note&rdquo; in any note&apos;s menu to protect it immediately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Masked Snippet
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Note contents remain masked until verified with your PIN.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 space-y-1">
                  <span className="font-semibold text-xs flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    Verification
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Deleting or opening locked notes requires entering your 4-digit PIN.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: ACCOUNT SETTINGS */}
        {activeSection === 'account' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Name & Password Form */}
            <form
              onSubmit={handleUpdateProfile}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5"
            >
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Account Information</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-400 mt-1">Email is tied to your account identity.</p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                  <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Change Password (Optional)
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="password"
                        placeholder="New Password (6+ chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Account Changes'}</span>
                </button>
              </div>
            </form>

            {/* Profile Picture Options */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Profile Picture / Avatar</span>
              </h3>

              {/* URL Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={dpLinkInput}
                    onChange={(e) => setDpLinkInput(e.target.value)}
                    placeholder="Paste image link URL (https://...)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyDpLink}
                  disabled={saving || !dpLinkInput.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-800 dark:bg-neutral-700 text-white rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Apply Link
                </button>
              </div>

              {/* Preset Avatars */}
              <div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-2">
                  Or select a preset avatar:
                </span>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(url)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 shrink-0 ${
                        user?.avatar === url ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetInitialsAvatar}
                    className="px-3 py-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 transition-colors shrink-0"
                  >
                    Use Initials
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: APPEARANCE & PREFERENCES */}
        {activeSection === 'appearance' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Theme Settings */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Theme Mode</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose how NoteFlow looks on this device.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-xs">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Moon className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Monitor className="w-5 h-5 text-neutral-400" />
                  <span className="text-xs">System</span>
                </button>
              </div>
            </div>

            {/* Default View Mode */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold">Default Note Layout</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onDefaultViewChange('grid')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    defaultView === 'grid'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <span className="text-xs">Grid View (Cards)</span>
                  {defaultView === 'grid' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => onDefaultViewChange('list')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    defaultView === 'list'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <span className="text-xs">List View (Compact)</span>
                  {defaultView === 'list' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions / Log Out */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
              Session Management
            </span>
            <p className="text-[11px] text-neutral-400">Sign out of this browser or all logged in devices.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="btn-profile-logout"
              onClick={logout}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
            <button
              type="button"
              id="btn-profile-logout-all"
              onClick={logoutAll}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
            >
              Log Out All
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
