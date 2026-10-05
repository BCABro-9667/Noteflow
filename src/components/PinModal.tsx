import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  FileText,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';

export type PinModalMode =
  | 'verify-to-open'
  | 'verify-to-unlock'
  | 'verify-to-delete'
  | 'setup'
  | 'change'
  | 'remove';

interface PinModalProps {
  isOpen: boolean;
  mode: PinModalMode;
  noteTitle?: string;
  noteId?: string;
  isPermanentDelete?: boolean;
  onClose: () => void;
  onSuccess: (data?: { pin?: string; noteId?: string }) => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  mode,
  noteTitle,
  noteId,
  isPermanentDelete = false,
  onClose,
  onSuccess,
}) => {
  // Setup steps: 1 = Enter PIN, 2 = Confirm PIN
  // Change steps: 1 = Current PIN, 2 = New PIN, 3 = Confirm New PIN
  const [subStep, setSubStep] = useState<number>(1);
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [tempFirstPin, setTempFirstPin] = useState<string>('');
  const [tempCurrentPin, setTempCurrentPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDigits, setShowDigits] = useState<boolean>(false);

  // 4 individual input box refs for automatic focus movement
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetDigits = useCallback(() => {
    setDigits(['', '', '', '']);
    setTimeout(() => {
      boxRefs.current[0]?.focus();
    }, 50);
  }, []);

  // Reset state when opening or mode changing
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setSubStep(1);
      setTempFirstPin('');
      setTempCurrentPin('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsShaking(false);
      setIsSubmitting(false);

      // Auto-focus first box
      setTimeout(() => {
        boxRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, mode]);

  const triggerShake = useCallback((error: string) => {
    setIsShaking(true);
    setErrorMsg(error);
    setDigits(['', '', '', '']);
    setTimeout(() => {
      setIsShaking(false);
      boxRefs.current[0]?.focus();
    }, 450);
  }, []);

  // Process PIN submission
  const processPinSubmission = useCallback(
    async (fullPin: string) => {
      if (isSubmitting || fullPin.length !== 4) return;
      setErrorMsg(null);

      // Mode: VERIFY TO OPEN NOTE
      if (mode === 'verify-to-open') {
        setIsSubmitting(true);
        try {
          if (noteId) {
            const res = await api.notes.verifyPin(noteId, fullPin);
            if (res.valid) {
              onSuccess({ pin: fullPin, noteId });
            } else {
              triggerShake('Incorrect PIN. Please try again.');
            }
          } else {
            const res = await api.auth.verifyPin(fullPin);
            if (res.valid) {
              onSuccess({ pin: fullPin });
            } else {
              triggerShake('Incorrect PIN. Please try again.');
            }
          }
        } catch (err: any) {
          triggerShake(err.message || 'Incorrect PIN. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Mode: VERIFY TO UNLOCK NOTE PERMANENTLY
      if (mode === 'verify-to-unlock') {
        setIsSubmitting(true);
        try {
          if (noteId) {
            await api.notes.unlock(noteId, fullPin);
          } else {
            await api.auth.verifyPin(fullPin);
          }
          setSuccessMsg('Note unlocked successfully!');
          setTimeout(() => {
            onSuccess({ pin: fullPin, noteId });
          }, 350);
        } catch (err: any) {
          triggerShake(err.message || 'Incorrect PIN. Note remains locked.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Mode: VERIFY TO DELETE NOTE (Delete immediately upon correct PIN)
      if (mode === 'verify-to-delete') {
        setIsSubmitting(true);
        try {
          let isValid = false;
          if (noteId) {
            const res = await api.notes.verifyPin(noteId, fullPin);
            isValid = res.valid;
          } else {
            const res = await api.auth.verifyPin(fullPin);
            isValid = res.valid;
          }

          if (isValid) {
            setSuccessMsg('PIN verified! Deleting note...');
            setTimeout(() => {
              onSuccess({ pin: fullPin, noteId });
            }, 180);
          } else {
            triggerShake('Incorrect PIN. Note was not deleted.');
          }
        } catch (err: any) {
          triggerShake(err.message || 'Incorrect PIN. Note was not deleted.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Mode: SETUP (Step 1: Enter PIN -> Step 2: Confirm PIN)
      if (mode === 'setup') {
        if (subStep === 1) {
          setTempFirstPin(fullPin);
          setDigits(['', '', '', '']);
          setSubStep(2);
          setTimeout(() => {
            boxRefs.current[0]?.focus();
          }, 100);
          return;
        }

        // Substep 2: Confirm PIN
        if (fullPin !== tempFirstPin) {
          triggerShake('PINs did not match. Please re-enter.');
          setSubStep(1);
          setTempFirstPin('');
          return;
        }

        setIsSubmitting(true);
        try {
          await api.auth.setupPin(fullPin);
          setSuccessMsg('Note PIN created successfully!');
          setTimeout(() => {
            onSuccess({ pin: fullPin, noteId });
          }, 450);
        } catch (err: any) {
          triggerShake(err.message || 'Failed to create PIN. Please try again.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Mode: CHANGE PIN
      if (mode === 'change') {
        // Step 1: Verify current PIN
        if (subStep === 1) {
          setIsSubmitting(true);
          try {
            const res = await api.auth.verifyPin(fullPin);
            if (!res.valid) {
              triggerShake('Current PIN is incorrect.');
              setIsSubmitting(false);
              return;
            }
            setTempCurrentPin(fullPin);
            setDigits(['', '', '', '']);
            setSubStep(2);
            setTimeout(() => {
              boxRefs.current[0]?.focus();
            }, 100);
          } catch (err: any) {
            triggerShake(err.message || 'Current PIN is incorrect.');
          } finally {
            setIsSubmitting(false);
          }
          return;
        }

        // Step 2: Enter new PIN
        if (subStep === 2) {
          setTempFirstPin(fullPin);
          setDigits(['', '', '', '']);
          setSubStep(3);
          setTimeout(() => {
            boxRefs.current[0]?.focus();
          }, 100);
          return;
        }

        // Step 3: Confirm new PIN
        if (fullPin !== tempFirstPin) {
          triggerShake('New PINs did not match. Try entering new PIN again.');
          setSubStep(2);
          setTempFirstPin('');
          return;
        }

        setIsSubmitting(true);
        try {
          await api.auth.changePin(tempCurrentPin, fullPin);
          setSuccessMsg('Note PIN changed successfully!');
          setTimeout(() => {
            onSuccess({ pin: fullPin });
          }, 450);
        } catch (err: any) {
          triggerShake(err.message || 'Failed to change PIN.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Mode: REMOVE PIN
      if (mode === 'remove') {
        setIsSubmitting(true);
        try {
          await api.auth.removePin(fullPin);
          setSuccessMsg('Note PIN removed successfully!');
          setTimeout(() => {
            onSuccess();
          }, 450);
        } catch (err: any) {
          triggerShake(err.message || 'Current PIN is incorrect.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }
    },
    [mode, subStep, tempFirstPin, tempCurrentPin, isSubmitting, noteId, onSuccess, triggerShake]
  );

  // Handle typing inside one of the 4 PIN boxes
  const handleBoxChange = (index: number, val: string) => {
    setErrorMsg(null);
    const clean = val.replace(/\D/g, '');

    if (!clean) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // If user pasted or typed multiple digits
    if (clean.length > 1) {
      const charArr = clean.slice(0, 4).split('');
      const nextDigits = [...digits];
      for (let i = 0; i < 4; i++) {
        nextDigits[i] = charArr[i] || '';
      }
      setDigits(nextDigits);

      const focusIdx = Math.min(charArr.length, 3);
      boxRefs.current[focusIdx]?.focus();

      if (charArr.length >= 4) {
        processPinSubmission(charArr.slice(0, 4).join(''));
      }
      return;
    }

    // Single digit entered
    const digitChar = clean.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digitChar;
    setDigits(nextDigits);

    // Auto-advance focus to next box
    if (index < 3) {
      boxRefs.current[index + 1]?.focus();
    }

    // If all 4 boxes are now filled, auto-submit
    const combined = nextDigits.join('');
    if (combined.length === 4 && nextDigits.every((d) => d !== '')) {
      processPinSubmission(combined);
    }
  };

  const handleBoxKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        setDigits(nextDigits);
        boxRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      boxRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      const combined = digits.join('');
      if (combined.length === 4) {
        e.preventDefault();
        processPinSubmission(combined);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const charArr = pasted.split('');
    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      nextDigits[i] = charArr[i] || '';
    }
    setDigits(nextDigits);

    const focusIdx = Math.min(charArr.length, 3);
    boxRefs.current[focusIdx]?.focus();

    if (charArr.length === 4) {
      processPinSubmission(pasted);
    }
  };

  if (!isOpen) return null;

  // Title, Subtitle, and Action label helper
  let title = 'Enter Note PIN';
  let subtitle = 'Enter your 4-digit PIN to access this protected note';
  let actionButtonLabel = 'Unlock';
  let icon = <Lock className="w-7 h-7 text-amber-500" />;

  if (mode === 'verify-to-open') {
    title = 'Unlock Note';
    subtitle = 'This note is locked. Enter your 4-digit PIN to view and edit.';
    actionButtonLabel = 'Open Note';
    icon = <Lock className="w-7 h-7 text-amber-500" />;
  } else if (mode === 'verify-to-unlock') {
    title = 'Unlock Note Permanently';
    subtitle = 'Enter your 4-digit PIN to remove the lock from this note.';
    actionButtonLabel = 'Unlock Note';
    icon = <Unlock className="w-7 h-7 text-emerald-500" />;
  } else if (mode === 'verify-to-delete') {
    title = isPermanentDelete ? 'Permanently Delete Note' : 'Delete Note Verification';
    subtitle = 'Enter your correct 4-digit PIN to authorize and delete this note immediately.';
    actionButtonLabel = isPermanentDelete ? 'Delete Forever' : 'Delete Immediately';
    icon = <Trash2 className="w-7 h-7 text-red-500" />;
  } else if (mode === 'setup') {
    icon = <ShieldCheck className="w-7 h-7 text-blue-500" />;
    if (subStep === 1) {
      title = 'Create 4-Digit Note PIN';
      subtitle = 'Set a 4-digit PIN to lock sensitive notes and authorize actions.';
      actionButtonLabel = 'Next →';
    } else {
      title = 'Confirm Your Note PIN';
      subtitle = 'Re-enter your 4-digit PIN to verify and activate note security.';
      actionButtonLabel = noteId ? 'Save & Continue' : 'Save PIN';
    }
  } else if (mode === 'change') {
    icon = <KeyRound className="w-7 h-7 text-indigo-500" />;
    if (subStep === 1) {
      title = 'Verify Current PIN';
      subtitle = 'Enter your current 4-digit PIN before creating a new one.';
      actionButtonLabel = 'Verify PIN';
    } else if (subStep === 2) {
      title = 'Create New 4-Digit PIN';
      subtitle = 'Enter the new 4-digit PIN you wish to use.';
      actionButtonLabel = 'Next →';
    } else {
      title = 'Confirm New PIN';
      subtitle = 'Re-enter your new 4-digit PIN to confirm the change.';
      actionButtonLabel = 'Update PIN';
    }
  } else if (mode === 'remove') {
    title = 'Remove Note PIN';
    subtitle = 'Enter your current 4-digit PIN to disable note locking on this account.';
    actionButtonLabel = 'Remove PIN';
    icon = <AlertCircle className="w-7 h-7 text-red-500" />;
  }

  const enteredLength = digits.filter((d) => d !== '').length;
  const isComplete = enteredLength === 4;

  return (
    <div
      id="pin-modal-fullscreen"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="pin-modal-card"
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Close / Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Back Step Button (if in multi-step setup or change) */}
        {((mode === 'setup' && subStep > 1) || (mode === 'change' && subStep > 1)) && (
          <button
            type="button"
            onClick={() => {
              setSubStep((prev) => Math.max(1, prev - 1));
              resetDigits();
              setErrorMsg(null);
            }}
            className="absolute top-4 left-4 p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs cursor-pointer"
            title="Back to previous step"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {/* Header Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shadow-inner ${
            mode === 'verify-to-delete' || mode === 'remove'
              ? 'bg-red-50 dark:bg-red-950/40 text-red-500'
              : 'bg-neutral-100 dark:bg-neutral-800'
          }`}
        >
          {icon}
        </div>

        {/* Prominent Note Title display on the screen */}
        {noteTitle && (
          <div
            className={`w-full p-3 mb-4 rounded-xl border flex items-center gap-2.5 text-left animate-in fade-in ${
              mode === 'verify-to-delete'
                ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/60'
                : 'bg-neutral-50 dark:bg-neutral-800/80 border-neutral-200/80 dark:border-neutral-700/80'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                mode === 'verify-to-delete'
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
              }`}
            >
              {mode === 'verify-to-delete' ? <Trash2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider block ${
                  mode === 'verify-to-delete'
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-neutral-400 dark:text-neutral-500'
                }`}
              >
                {mode === 'verify-to-delete' ? 'Note to Delete' : 'Target Note'}
              </span>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {noteTitle.trim() || 'Untitled Note'}
              </p>
            </div>
          </div>
        )}

        {/* Modal Title & Subtitle */}
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mb-5 leading-relaxed">
          {subtitle}
        </p>

        {/* Multi-step progress indicator for setup and change */}
        {(mode === 'setup' || mode === 'change') && (
          <div className="flex items-center gap-2 mb-5">
            {mode === 'setup' && (
              <>
                <div
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    subStep === 1 ? 'bg-blue-600' : 'bg-emerald-500'
                  }`}
                />
                <div
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    subStep === 2 ? 'bg-blue-600' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              </>
            )}
            {mode === 'change' && (
              <>
                <div
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    subStep === 1 ? 'bg-indigo-600' : 'bg-emerald-500'
                  }`}
                />
                <div
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    subStep === 2 ? 'bg-indigo-600' : subStep > 2 ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
                <div
                  className={`h-1.5 w-6 rounded-full transition-all ${
                    subStep === 3 ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              </>
            )}
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 4 PIN Boxes with automatic focus movement (Normal input fields, no visual keypad) */}
        <div className="w-full max-w-xs space-y-4 my-2">
          <div className="relative">
            <div
              className={`flex justify-center items-center gap-3 sm:gap-3.5 py-2 ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2, 3].map((index) => {
                const digit = digits[index];
                const isFilled = digit !== '';
                return (
                  <input
                    key={index}
                    ref={(el) => {
                      boxRefs.current[index] = el;
                    }}
                    id={`pin-box-${index}`}
                    type={showDigits ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete="off"
                    disabled={isSubmitting}
                    value={digit}
                    onChange={(e) => handleBoxChange(index, e.target.value)}
                    onKeyDown={(e) => handleBoxKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 transition-all outline-none bg-neutral-50 dark:bg-neutral-800/90 text-neutral-900 dark:text-neutral-100 ${
                      isFilled
                        ? mode === 'verify-to-delete'
                          ? 'border-red-600 dark:border-red-500 ring-2 ring-red-500/10'
                          : 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/10'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
                    } ${isShaking ? 'border-red-500 text-red-500 ring-2 ring-red-500/20' : ''}`}
                  />
                );
              })}
            </div>

            {/* Toggle show/hide PIN digits */}
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowDigits(!showDigits)}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer"
                title={showDigits ? 'Hide PIN digits' : 'Show PIN digits'}
              >
                {showDigits ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide digits</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show digits</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {enteredLength}/4 digits entered
          </p>

          {/* Action Buttons: Cancel and Submit */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-pin-submit"
              disabled={!isComplete || isSubmitting}
              onClick={() => processPinSubmission(digits.join(''))}
              className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${
                mode === 'verify-to-delete' || mode === 'remove'
                  ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSubmitting
                ? 'Verifying...'
                : mode === 'verify-to-delete'
                ? 'Delete Immediately'
                : actionButtonLabel}
            </button>
          </div>
        </div>

        {/* Security microcopy */}
        <div className="mt-5 pt-3.5 border-t border-neutral-100 dark:border-neutral-800 w-full flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span>Encrypted with SHA-256 salted credentials</span>
        </div>
      </div>
    </div>
  );
};
