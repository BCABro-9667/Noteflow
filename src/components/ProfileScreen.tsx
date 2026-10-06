import React, { useState, useEffect } from 'react';
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
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  CheckCircle,
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

  // First tab is Account, second is Appearance, third is Note Security
  const [activeSection, setActiveSection] = useState<'account' | 'appearance' | 'security'>('account');

  // Account form state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [address, setAddress] = useState(user?.address || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status and feedback
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  // Sync state if user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
    }
  }, [user]);

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
      setSavingAccount(true);
      setStatusMessage(null);
      const res = await api.auth.updateProfile({ avatar: cleanUrl });
      setUser(res.user);
      setDpLinkInput('');
      setStatusMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update avatar link.' });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    try {
      setSavingAccount(true);
      setStatusMessage(null);
      const res = await api.auth.updateProfile({ avatar: url });
      setUser(res.user);
      setStatusMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update avatar.' });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleResetInitialsAvatar = async () => {
    try {
      setSavingAccount(true);
      const initialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`;
      const res = await api.auth.updateProfile({ avatar: initialsUrl });
      setUser(res.user);
      setStatusMessage({ type: 'success', text: 'Reset photo to name initials.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset avatar.' });
    } finally {
      setSavingAccount(false);
    }
  };

  // Save Account Information (Name, Phone, DOB, Address, Bio, Password)
  const handleSaveAccountDetails = async (e: React.FormEvent) => {
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
      setSavingAccount(true);
      const res = await api.auth.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        dob: dob.trim(),
        address: address.trim(),
        bio: bio.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setUser(res.user);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatusMessage({ type: 'success', text: 'Saved successfully! Account details updated.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update account details.' });
    } finally {
      setSavingAccount(false);
    }
  };

  // Save Appearance Preferences
  const handleSaveAppearance = () => {
    setSavingAppearance(true);
    setStatusMessage(null);
    localStorage.setItem('noteflow_theme', theme);
    localStorage.setItem('noteflow_default_view', defaultView);
    setTimeout(() => {
      setSavingAppearance(false);
      setStatusMessage({ type: 'success', text: 'Saved successfully! Appearance preferences updated.' });
    }, 200);
  };

  return (
    <div
      id="dedicated-profile-screen"
      className="h-full w-full overflow-y-auto bg-neutral-50 dark:bg-neutral-950 flex flex-col text-neutral-900 dark:text-neutral-100 pb-32 md:pb-16 animate-in fade-in duration-200"
    >
      {/* Top App Header */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
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
              Manage personal details, theme preferences, and note security
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          Done
        </button>
      </header>

      {/* Main Scrollable Content */}
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* User Hero Header Section: Photo, Name, Email, Phone on Left, Edit button on Right */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 min-w-0 flex-1">
            <div className="relative group shrink-0">
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

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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

              {/* Email */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user?.email}</p>

              {/* Phone number in Profile Header */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>{user?.phone || 'No phone added yet'}</span>
              </div>

              {/* Stats pill */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[11px]">
                  <FileText className="w-3 h-3 text-blue-500" />
                  <span>{totalNotes} Notes</span>
                </span>
                {user?.dob && (
                  <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[11px]">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>DOB: {user.dob}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side Edit Button */}
          <button
            type="button"
            id="btn-profile-header-edit"
            onClick={() => setActiveSection('account')}
            className="px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Section Navigation Tabs: 1st Account, 2nd Appearance, 3rd Note Security */}
        <div className="flex items-center gap-2 p-1 bg-neutral-200/60 dark:bg-neutral-800/60 rounded-xl overflow-x-auto">
          {/* TAB 1: Account */}
          <button
            type="button"
            id="tab-profile-account"
            onClick={() => {
              setActiveSection('account');
              setStatusMessage(null);
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'account'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

          {/* TAB 2: Appearance */}
          <button
            type="button"
            id="tab-profile-appearance"
            onClick={() => {
              setActiveSection('appearance');
              setStatusMessage(null);
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'appearance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          {/* TAB 3: Note Security */}
          <button
            type="button"
            id="tab-profile-security"
            onClick={() => {
              setActiveSection('security');
              setStatusMessage(null);
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'security'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Note Security</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 animate-in fade-in ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: ACCOUNT (FIRST TAB) */}
        {activeSection === 'account' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Account Details Form */}
            <form
              onSubmit={handleSaveAccountDetails}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  <span>Personal Details &amp; Profile</span>
                </h3>
                <span className="text-[11px] text-neutral-400">All editable details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-account-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="input-account-email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2 text-xs bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-blue-500" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    id="input-account-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 234-5678"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>Date of Birth</span>
                  </label>
                  <input
                    type="text"
                    id="input-account-dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="e.g. 1995-04-12"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>Physical / Postal Address</span>
                  </label>
                  <input
                    type="text"
                    id="input-account-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 742 Evergreen Terrace, San Francisco, CA"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Bio / Headline */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Bio / Status
                  </label>
                  <input
                    type="text"
                    id="input-account-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g. Product Designer &amp; Notes Enthusiast"
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Change Password Section */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Change Password (Leave blank to keep current)
                </h4>
                <div className="space-y-2.5">
                  <input
                    type="password"
                    id="input-account-current-pw"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="password"
                      id="input-account-new-pw"
                      placeholder="New Password (6+ chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <input
                      type="password"
                      id="input-account-confirm-pw"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON FOR ACCOUNT */}
              <div className="flex items-center justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="submit"
                  id="btn-save-account-details"
                  disabled={savingAccount}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAccount ? 'Saving...' : 'Save Account Details'}</span>
                </button>
              </div>
            </form>

            {/* Profile Photo Options */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>Profile Photo Options</span>
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
                  disabled={savingAccount || !dpLinkInput.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-800 dark:bg-neutral-700 text-white rounded-xl hover:bg-neutral-700 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                >
                  Apply Link
                </button>
              </div>

              {/* Preset Avatars */}
              <div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-2">
                  Or select preset avatar:
                </span>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {presetAvatars.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(url)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 shrink-0 cursor-pointer ${
                        user?.avatar === url ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-transparent'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleResetInitialsAvatar}
                    className="px-3 py-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 transition-colors shrink-0 cursor-pointer"
                  >
                    Use Initials
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPEARANCE (SECOND TAB) */}
        {activeSection === 'appearance' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Theme Mode Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  <span>Light / Dark Theme</span>
                </h3>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 capitalize">
                  Current: {theme}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose your display theme. The selected mode applies across the entire application and persists permanently across sessions.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <button
                  type="button"
                  id="btn-theme-light"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold shadow-xs ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span className="text-xs">Light Mode</span>
                  {theme === 'light' && <span className="text-[10px] px-2 py-0.2 bg-blue-600 text-white rounded-full">Active</span>}
                </button>

                <button
                  type="button"
                  id="btn-theme-dark"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-400" />
                  <span className="text-xs">Dark Mode</span>
                  {theme === 'dark' && <span className="text-[10px] px-2 py-0.2 bg-blue-600 text-white rounded-full">Active</span>}
                </button>

                <button
                  type="button"
                  id="btn-theme-system"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-neutral-400" />
                  <span className="text-xs">System Auto</span>
                  {theme === 'system' && <span className="text-[10px] px-2 py-0.2 bg-blue-600 text-white rounded-full">Active</span>}
                </button>
              </div>
            </div>

            {/* App Theme Accent Color: Blue is active and primary */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold">App Theme Accent Color</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Blue is configured as your active primary color for buttons, badges, highlights, and active tabs.
              </p>

              <div className="flex items-center gap-3 pt-1">
                {/* Active Blue Theme Color */}
                <div className="flex items-center gap-2 p-2 px-3 rounded-xl border-2 border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  <span className="w-4 h-4 rounded-full bg-blue-600 shadow-xs flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span>Primary Blue (Active)</span>
                </div>

                <div className="flex items-center gap-2 p-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs opacity-60">
                  <span className="w-4 h-4 rounded-full bg-indigo-600" />
                  <span>Indigo</span>
                </div>

                <div className="flex items-center gap-2 p-2 px-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-400 text-xs opacity-60">
                  <span className="w-4 h-4 rounded-full bg-emerald-600" />
                  <span>Emerald</span>
                </div>
              </div>
            </div>

            {/* Default Note Layout */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
              <h3 className="text-base font-bold">Default Note View</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-layout-grid"
                  onClick={() => onDefaultViewChange('grid')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    defaultView === 'grid'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="text-xs">Grid View (Cards)</span>
                  {defaultView === 'grid' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  id="btn-layout-list"
                  onClick={() => onDefaultViewChange('list')}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    defaultView === 'list'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 font-semibold ring-2 ring-blue-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <span className="text-xs">List View (Compact)</span>
                  {defaultView === 'list' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                </button>
              </div>

              {/* SAVE BUTTON FOR APPEARANCE */}
              <div className="flex items-center justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  id="btn-save-appearance"
                  onClick={handleSaveAppearance}
                  disabled={savingAppearance}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAppearance ? 'Saving...' : 'Save Appearance Preferences'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NOTE SECURITY (THIRD TAB) */}
        {activeSection === 'security' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>4-Digit Note PIN</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    Protect confidential notes behind a 4-digit PIN. Locked notes hide their content on all devices and require verification to open, unlock, or delete.
                  </p>
                </div>
              </div>

              {/* Status Box */}
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block">
                      Note Lock Security
                    </span>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      {user?.hasPin
                        ? 'Your PIN is securely hashed using SHA-256 and active on your account.'
                        : 'No PIN configured yet. Set a 4-digit PIN to begin locking confidential notes.'}
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
                          className="px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                        >
                          Change PIN
                        </button>
                        <button
                          type="button"
                          id="btn-profile-remove-pin"
                          onClick={() => onOpenPinModal('remove')}
                          className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
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

        {/* Session Management (Bottom) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
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
