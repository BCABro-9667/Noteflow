import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Sparkles,
  ArrowRight,
  Search,
  Tag as TagIcon,
  Pin,
  Star,
  Archive,
  Trash2,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  Lock,
  Layers,
  Zap,
  Heart,
  Quote,
  Clock,
  Sliders,
  Maximize2,
  MousePointer,
  Compass,
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';

// Register GSAP ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onEnterWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, onEnterWorkspace }) => {
  const { user, demoLogin } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);

  // Interactive Live Card demo state
  const [demoNoteTitle, setDemoNoteTitle] = useState('Weekly Goals & Reflections 🌿');
  const [demoNoteContent, setDemoNoteContent] = useState(
    '1. Finish project draft by Thursday\n2. Morning reading session (30 mins)\n3. Organize photography ideas & travel wishlist'
  );
  const [demoNotePinned, setDemoNotePinned] = useState(true);
  const [demoNoteFav, setDemoNoteFav] = useState(true);
  const [demoActiveTag, setDemoActiveTag] = useState('Personal');
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving'>('saved');

  // Interactive FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleInteractiveNoteChange = (text: string) => {
    setDemoNoteContent(text);
    setSaveIndicator('saving');
    const timer = setTimeout(() => setSaveIndicator('saved'), 350);
    return () => clearTimeout(timer);
  };

  const handleLaunchDemo = async () => {
    try {
      await demoLogin();
      onEnterWorkspace();
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  // GSAP Animations with ScrollTrigger
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Content Entrance (Left column)
      gsap.from('.gsap-hero-element', {
        y: 35,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // 2. Hero Vector Mockup Entrance (Right column)
      gsap.from('.gsap-hero-mockup', {
        x: 40,
        opacity: 0,
        scale: 0.94,
        duration: 1.1,
        delay: 0.25,
        ease: 'power3.out',
      });

      // 3. Floating Badges continuous gentle bobbing
      gsap.to('.gsap-floating-badge-1', {
        y: -8,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.gsap-floating-badge-2', {
        y: 8,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.5,
      });

      // 4. Workflow Section Scroll Animation
      gsap.from('.gsap-workflow-step', {
        scrollTrigger: {
          trigger: '#workflow',
          start: 'top 80%',
        },
        y: 45,
        opacity: 0,
        duration: 0.75,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // 5. Interactive Demo Section Scroll Animation
      gsap.from('.gsap-demo-card', {
        scrollTrigger: {
          trigger: '#try-it',
          start: 'top 80%',
        },
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      // 6. Features Grid Scroll Animation
      gsap.from('.gsap-feature-card', {
        scrollTrigger: {
          trigger: '#features',
          start: 'top 80%',
        },
        y: 35,
        opacity: 0,
        duration: 0.65,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // 7. Testimonials Grid Scroll Animation
      gsap.from('.gsap-testimonial-card', {
        scrollTrigger: {
          trigger: '#testimonials',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // 8. Bottom CTA Box Scroll Animation
      gsap.from('.gsap-cta-box', {
        scrollTrigger: {
          trigger: '#cta-section',
          start: 'top 85%',
        },
        y: 35,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const demoTags = [
    { name: 'Personal', color: '#10b981' },
    { name: 'Work', color: '#3b82f6' },
    { name: 'Ideas', color: '#8b5cf6' },
    { name: 'Reading', color: '#f59e0b' },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Capture Instantly',
      desc: 'Open your notebook and begin typing. Every character is saved automatically in the background with zero lag.',
      icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      badge: 'Auto-Save',
    },
    {
      step: '02',
      title: 'Tag & Color-Code',
      desc: 'Assign colorful tags like Work, Personal, or Projects. Keep your thoughts structured without complex folders.',
      icon: <TagIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Color Badges',
    },
    {
      step: '03',
      title: 'Pin & Prioritize',
      desc: 'Pin your critical to-do notes to the top of your workspace and star your favorite reflections for quick reference.',
      icon: <Pin className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: 'Always Visible',
    },
    {
      step: '04',
      title: 'Search in Seconds',
      desc: 'Press Ctrl+K anytime to find any note instantly. Even if you delete by accident, the Trash folder lets you restore easily.',
      icon: <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      badge: 'Ctrl + K Fast',
    },
  ];

  const testimonials = [
    {
      name: 'Elena Rostova',
      role: 'Product Designer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      quote:
        'Finally a notes app that doesn’t overwhelm you with menus, databases, or formatting toolbars. It opens instantly, looks calm, and lets me write.',
      highlight: 'Calm & zero clutter',
    },
    {
      name: 'Marcus Sterling',
      role: 'Software Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      quote:
        'The ability to paste an image URL for my avatar and organize daily sprint takeaways with color-coded tags makes NoteFlow my go-to everyday tool.',
      highlight: 'Super fast organization',
    },
    {
      name: 'Priya Sharma',
      role: 'Content Creator & Author',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      quote:
        'The auto-saving gives me total peace of mind. I draft chapters, book outlines, and daily reminders without ever having to remember to click Save.',
      highlight: 'Reliable auto-save',
    },
  ];

  const userFaqs = [
    {
      q: 'Do I have to remember to click save every time?',
      a: 'Never. NoteFlow automatically saves every word as you type. Whether you switch tabs or close your browser, your notes are always securely preserved.',
    },
    {
      q: 'How do I add my own profile picture using an image link?',
      a: 'Click on your avatar or go to Settings in the sidebar, paste any direct image link (from Unsplash, Imgur, Discord, or your favorite site), and your profile picture updates immediately across your entire workspace.',
    },
    {
      q: 'Can I organize notes by category and color?',
      a: 'Yes! Create custom tags with distinct colors (like Blue for Work, Green for Personal, Amber for Reading). Filter by any tag with a single click, or view all notes together in a clean grid or list.',
    },
    {
      q: 'What happens if I delete a note by mistake?',
      a: 'Nothing is permanently lost immediately. Deleted notes move to your Trash folder where you can inspect and restore them anytime with one click.',
    },
    {
      q: 'Is there a keyboard shortcut to search notes quickly?',
      a: 'Yes, simply press Ctrl+K (or Cmd+K on Mac) from anywhere in the app to instantly open the search bar and filter all your notes in real time.',
    },
  ];

  return (
    <div
      ref={rootRef}
      className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900 overflow-x-hidden"
    >
      {/* 1. MINIMAL TOP NAVIGATION 
          Per user request:
          - Left side shows only ONE button which is LOGIN (or brand + login)
          - REMOVED light mode and dark mode toggle from nav
          - REMOVED Get Started button from nav
      */}
      <header
        id="landing-header"
        className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-50/90 dark:bg-neutral-950/90 border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left side: Brand + The single LOGIN button */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shadow-xs">
                N
              </div>
              <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
                NoteFlow
              </span>
            </div>

            <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">|</span>

            {/* ONLY ONE BUTTON ON NAVBAR: LOGIN (or Enter Workspace if user is signed in) */}
            {user ? (
              <button
                id="btn-nav-login"
                type="button"
                onClick={onEnterWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                id="btn-nav-login"
                type="button"
                onClick={() => onOpenAuth('login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-neutral-200/70 dark:bg-neutral-800/70 hover:bg-neutral-300/80 dark:hover:bg-neutral-700/80 rounded-lg transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Right side: Clean section navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#workflow" className="hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors">
              Workflow
            </a>
            <a href="#try-it" className="hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors">
              Live Preview
            </a>
            <a href="#features" className="hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors">
              Features
            </a>
            <a href="#testimonials" className="hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors">
              Testimonials
            </a>
            <a href="#faq" className="hover:text-neutral-950 dark:hover:text-neutral-100 transition-colors">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* 2. HERO SECTION 
          Per user request:
          - Left side: Hero content (badge, headline, description, CTAs)
          - Right side: Clean vector illustration mockup of the note app
          - Animated smoothly with GSAP
      */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Side: Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow Badge */}
              <div className="gsap-hero-element inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Distraction-Free Personal Notes</span>
              </div>

              {/* Headline */}
              <h1 className="gsap-hero-element text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.15]">
                Write with clarity. <br />
                <span className="text-blue-600 dark:text-blue-400">Organize</span> with ease.
              </h1>

              {/* Subheading */}
              <p className="gsap-hero-element text-base text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
                A calm, minimalist workspace for capturing everyday thoughts, project ideas, reading summaries, and tasks. Auto-saved as you type, effortlessly organized, and always ready.
              </p>

              {/* Action Buttons */}
              <div className="gsap-hero-element flex flex-wrap items-center gap-3 pt-2">
                {user ? (
                  <button
                    type="button"
                    onClick={onEnterWorkspace}
                    className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer hover:shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Open My Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleLaunchDemo}
                      className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer hover:shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Try Live Demo (1-Click)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenAuth('register')}
                      className="px-5 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl transition-all cursor-pointer"
                    >
                      Create Free Account
                    </button>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="gsap-hero-element flex items-center gap-6 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Instant Auto-Save
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Color-Coded Tags
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  100% Free & Private
                </span>
              </div>
            </div>

            {/* Right Side: High-Quality Vector Mockup Illustration */}
            <div className="lg:col-span-6 relative gsap-hero-mockup">
              {/* Background ambient radial glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 via-transparent to-emerald-500/10 rounded-3xl blur-2xl -z-10" />

              {/* Floating Badge 1 (Auto-save pill) */}
              <div className="gsap-floating-badge-1 absolute -top-4 -right-2 sm:-right-4 z-20 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px]">Auto-saved just now</span>
              </div>

              {/* Floating Badge 2 (Profile Display Picture chip) */}
              <div className="gsap-floating-badge-2 absolute -bottom-4 -left-2 sm:-left-4 z-20 bg-white dark:bg-neutral-800 p-2 pr-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Custom Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                />
                <div className="text-left">
                  <p className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                    Custom DP by Link
                  </p>
                  <p className="text-[10px] text-neutral-400 leading-tight">Instant Profile Sync</p>
                </div>
              </div>

              {/* Vector App Window Mockup */}
              <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/90 dark:border-neutral-800 shadow-xl overflow-hidden">
                {/* Mock Window Title Bar */}
                <div className="px-4 py-3 bg-neutral-100/70 dark:bg-neutral-800/60 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  {/* Mock Search Bar */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md text-[11px] text-neutral-400 w-48 sm:w-64">
                    <Search className="w-3 h-3 text-neutral-400" />
                    <span className="truncate">Ctrl+K to search notes...</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                </div>

                {/* Mock App Body */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-neutral-50/50 dark:bg-neutral-950/40">
                  {/* Left Mini-Sidebar Vector */}
                  <div className="hidden sm:block sm:col-span-4 space-y-3 pr-2 border-r border-neutral-200/60 dark:border-neutral-800/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Folders
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>All Notes</span>
                        </span>
                        <span className="text-[10px]">12</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                        <span className="flex items-center gap-1.5">
                          <Pin className="w-3 h-3 text-amber-500" />
                          <span>Pinned</span>
                        </span>
                        <span className="text-[10px]">3</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
                        <span className="flex items-center gap-1.5">
                          <Star className="w-3 h-3 text-amber-400" />
                          <span>Favorites</span>
                        </span>
                        <span className="text-[10px]">4</span>
                      </div>
                    </div>

                    <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Tags
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-700 dark:text-neutral-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Work</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-700 dark:text-neutral-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Personal</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 text-neutral-700 dark:text-neutral-300">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Ideas</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Notes Grid Vector */}
                  <div className="sm:col-span-8 space-y-3">
                    {/* Note Card 1 (Pinned Work Note) */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs relative">
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            Work
                          </span>
                        </div>
                        <Pin className="w-3 h-3 text-blue-600 fill-blue-600" />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                        Quarterly Roadmap & Product Launch
                      </h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        • Finalize user onboarding flows<br />
                        • Review feedback on distraction-free writing UI
                      </p>
                      <div className="mt-2 text-[9px] text-neutral-400 flex items-center justify-between">
                        <span>Updated 5m ago</span>
                        <span className="text-emerald-600 font-medium">✓ Saved</span>
                      </div>
                    </div>

                    {/* Note Card 2 (Starred Creative Note) */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
                      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Personal
                          </span>
                        </div>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                        Books to Read This Autumn 📚
                      </h4>
                      <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        &ldquo;Clarity comes from creating space between our thoughts.&rdquo;
                      </p>
                      <div className="mt-2 text-[9px] text-neutral-400 flex items-center justify-between">
                        <span>Updated 1h ago</span>
                        <span className="text-neutral-400">Personal Tag</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WORKFLOW SECTION 
          Per user request:
          - Dedicated, clear step-by-step workflow for normal users
          - Animated with GSAP on scroll
      */}
      <section id="workflow" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Intuitive Process
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-2">
            How NoteFlow Fits Into Your Day
          </h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            From fleeting ideas to organized plans, take your thoughts through an effortless 4-step workflow.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((item) => (
            <div
              key={item.step}
              className="gsap-workflow-step relative p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-neutral-300 dark:text-neutral-700 font-mono">
                    {item.step}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HANDS-ON INTERACTIVE LIVE CARD DEMO */}
      <section
        id="try-it"
        className="py-16 bg-neutral-100/60 dark:bg-neutral-900/40 border-y border-neutral-200/80 dark:border-neutral-800/80"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Try It Live
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              Test the Editor Right Here
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto">
              Type directly in the card below to see auto-saving, pin toggling, and instant tag filtering.
            </p>
          </div>

          {/* Interactive Note Card */}
          <div className="gsap-demo-card bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
            {/* Note Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
              {/* Tag Selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-neutral-400 font-medium mr-1">Tag:</span>
                {demoTags.map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => setDemoActiveTag(tag.name)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      demoActiveTag === tag.name
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                        : 'bg-neutral-200/60 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span>{tag.name}</span>
                  </button>
                ))}
              </div>

              {/* Status & Pin/Star Controls */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>{saveIndicator === 'saving' ? 'Saving changes...' : 'Saved to account'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setDemoNotePinned(!demoNotePinned)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    demoNotePinned
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                  title={demoNotePinned ? 'Pinned to top' : 'Click to pin'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setDemoNoteFav(!demoNoteFav)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    demoNoteFav
                      ? 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-400'
                  }`}
                  title={demoNoteFav ? 'Favorited' : 'Click to favorite'}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={demoNoteTitle}
              onChange={(e) => {
                setDemoNoteTitle(e.target.value);
                setSaveIndicator('saving');
                setTimeout(() => setSaveIndicator('saved'), 350);
              }}
              placeholder="Note title..."
              className="w-full text-lg sm:text-xl font-bold bg-transparent border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none mb-3"
            />

            {/* Note Body Textarea */}
            <textarea
              rows={4}
              value={demoNoteContent}
              onChange={(e) => handleInteractiveNoteChange(e.target.value)}
              placeholder="Start typing your thoughts..."
              className="w-full text-sm bg-transparent border-none text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 focus:outline-none resize-none leading-relaxed"
            />

            <div className="pt-3 mt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
              <span>Category: <strong className="text-neutral-700 dark:text-neutral-300 font-medium">{demoActiveTag}</strong></span>
              <span>Live interactive demo</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. USER FEATURES GRID */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Crafted For Simplicity
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-2">
            Features Designed for Real People
          </h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Everything you need to capture and find your thoughts quickly, without clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Distraction-Free Editor
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              A calm writing canvas that gets out of your way. Auto-saves continuously so you never worry about lost progress.
            </p>
          </div>

          {/* Card 2 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <TagIcon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Color-Coded Tags
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Create tags with custom colors for Work, Personal, Reading, or Ideas. Filter your notes with one tap.
            </p>
          </div>

          {/* Card 3 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Lightning Fast Search
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Search notes by title, body, or tag in real time. Use Ctrl+K from anywhere to locate notes instantly.
            </p>
          </div>

          {/* Card 4 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Pin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Pin & Favorite Priorities
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Keep critical deadlines or inspiring notes pinned to the top of your board so you never lose sight of what matters.
            </p>
          </div>

          {/* Card 5 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Custom DP Avatar by Link
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Paste any direct image link in Settings to set your profile picture, or select from built-in avatar styles.
            </p>
          </div>

          {/* Card 6 */}
          <div className="gsap-feature-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              <Archive className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Safe Trash & Archive
            </h3>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Archive notes you have completed, and recover deleted notes from the Trash folder anytime with one click.
            </p>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS SECTION 
          Per user request:
          - Dedicated testimonials section with user reviews and roles
          - Animated with GSAP on scroll
      */}
      <section
        id="testimonials"
        className="py-20 bg-neutral-100/50 dark:bg-neutral-900/30 border-y border-neutral-200/80 dark:border-neutral-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              User Experiences
            </span>
            <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-2">
              Loved by Thinkers & Organizers
            </h2>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              See how people are using NoteFlow to declutter their thoughts and work with clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="gsap-testimonial-card p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-3 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section id="faq" className="py-20 max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Clear Answers
          </span>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Everything you need to know about getting started.
          </p>
        </div>

        <div className="space-y-3">
          {userFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-neutral-700 dark:text-neutral-200' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CLEAN BOTTOM CALL TO ACTION */}
      <section id="cta-section" className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="gsap-cta-box p-8 sm:p-12 rounded-3xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready for a clearer, calmer mind?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-neutral-300 dark:text-neutral-600 max-w-md mx-auto leading-relaxed">
            Start writing in seconds with zero friction. Explore with our pre-loaded live demo or create your free account today.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 hover:opacity-90 rounded-xl transition-opacity cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Launch Live Workspace</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 hover:opacity-90 rounded-xl transition-opacity cursor-pointer"
            >
              Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* 9. MINIMAL FOOTER */}
      <footer className="mt-auto py-8 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">NoteFlow</span>
            <span>•</span>
            <span>A calm, minimalist note-taking workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
