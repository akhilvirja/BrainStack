import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Play,
  Sparkles,
  Share2,
  Search,
  ShieldCheck,
  Network,
  FileText,
  Star,
  CheckCircle2
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-[#fcfcf9] font-body text-charcoal-text min-h-screen antialiased selection:bg-primary-fixed selection:text-spruce">
      {/* Fixed Navigation Header */}
      <header className="fixed top-0 w-full z-50 bg-[#fcfcf9]/90 backdrop-blur-xl border-b border-surface-container-highest shadow-[0_1px_8px_rgba(63,99,85,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#52796f] flex items-center justify-center text-white shadow-sm shadow-[#52796f]/20">
              <Layers size={18} strokeWidth={2.2} />
            </div>
            <span className="font-headline text-lg font-bold text-on-surface tracking-tight">Brain Stack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#overview" className="text-primary font-bold tracking-tight">Overview</a>
            <a href="#features" className="font-medium text-[#5c5b68] hover:text-primary transition-colors">Features</a>
            <a href="#workflow" className="font-medium text-[#5c5b68] hover:text-primary transition-colors">Workflow</a>
            <a href="#testimonials" className="font-medium text-[#5c5b68] hover:text-primary transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-semibold text-[#5c5b68] hover:text-on-surface px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/dashboard"
              className="bg-[#52796f] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary transition-all shadow-sm shadow-[#52796f]/20 flex items-center gap-1.5"
            >
              <span>Open Workspace</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16">
        {/* HERO SECTION */}
        <section id="overview" className="relative px-6 sm:px-8 py-20 overflow-hidden flex flex-col items-center text-center">
          {/* Atmospheric Glow */}
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-195 h-100 bg-linear-to-tr from-[#84a98c]/20 via-[#cad2c5]/25 to-[#52796f]/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-[#cad2c5] shadow-sm transition-transform hover:scale-105 cursor-pointer backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#52796f] animate-pulse"></span>
            <span className="text-xs font-semibold text-sage-deep">✨ Introducing Brain Stack 2.0 • Your AI-Powered Knowledge Workspace</span>
            <ArrowRight size={14} className="text-[#52796f]" />
          </div>

          {/* Main Hero Headings */}
          <div className="max-w-4xl mt-6 flex flex-col items-center">
            <h1 className="text-4xl md:text-6xl text-on-surface font-extrabold tracking-tight leading-tight">
              Your digital mind, <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-[#52796f] via-[#6b9080] to-[#354f52] text-transparent bg-clip-text">
                organized effortlessly.
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-[#5c5b68] leading-relaxed font-normal">
              Capture tweets, videos, articles, and personal notes into one unified, searchable hub. Never lose a great insight again.
            </p>
          </div>

          {/* CTA Cluster */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="flex items-center gap-2 bg-[#52796f] hover:bg-primary text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-md shadow-[#52796f]/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Get Started Free</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-surface-container-low border border-outline-variant text-charcoal-text px-5 py-3.5 rounded-xl text-sm font-semibold hover:bg-surface-container-high hover:text-on-surface transition-all shadow-sm duration-200"
            >
              <Play size={16} className="text-[#52796f] fill-[#52796f]" />
              <span>Explore Workspace</span>
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[#5c5b68] text-xs font-medium">
            <CheckCircle2 size={15} className="text-[#52796f]" />
            <span>No credit card required • Syncs with X, YouTube & Obsidian</span>
          </div>

          {/* Metrics Row */}
          <div className="max-w-4xl w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 pt-8 border-t border-surface-container-highest">
            <div className="bg-white border border-surface-container-highest rounded-2xl p-5 shadow-xs">
              <span className="font-headline text-3xl font-bold text-on-surface">2.4M+</span>
              <p className="text-xs text-[#5c5b68] mt-1">Knowledge Notes Saved</p>
            </div>
            <div className="bg-white border border-surface-container-highest rounded-2xl p-5 shadow-xs">
              <span className="font-headline text-3xl font-bold text-on-surface">99.9%</span>
              <p className="text-xs text-[#5c5b68] mt-1">Cloud Vault Sync Uptime</p>
            </div>
            <div className="bg-white border border-surface-container-highest rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-on-surface">
                <span className="font-headline text-3xl font-bold">4.9</span>
                <Star size={20} className="fill-[#e3be75] text-[#e3be75]" />
              </div>
              <p className="text-xs text-[#5c5b68] mt-1">Rating Across 1,200+ Reviews</p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="px-6 sm:px-8 py-16 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796f] bg-sage-light px-3 py-1 rounded-full border border-[#cad2c5]">
              Features
            </span>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mt-3">
              Engineered for deep focus and instant recall.
            </h2>
            <p className="text-sm text-[#5c5b68] mt-2">
              Crafted with minimal UI chrome so your ideas, research, and sparks stay center-stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText size={20} className="text-[#52796f]" />,
                title: 'Multi-Format Ingestion',
                desc: 'Save tweets, YouTube videos, long-form newsletters, and code snippets into unified semantic visual frames.',
              },
              {
                icon: <Sparkles size={20} className="text-[#52796f]" />,
                title: 'AI Tag Suggestions',
                desc: 'Automatic conceptual linking, deep semantic clustering, and instant smart tags powered by cutting-edge LLMs.',
              },
              {
                icon: <Network size={20} className="text-[#52796f]" />,
                title: 'Bi-directional Graph',
                desc: 'Connect disparate ideas across domains. Uncover serendipitous associations through visual mental maps.',
              },
              {
                icon: <Search size={20} className="text-[#52796f]" />,
                title: 'Blazing Fast Search',
                desc: 'Sub-50ms instant search across your entire stack with keyboard shortcuts (⌘K) and vector distance retrieval.',
              },
              {
                icon: <ShieldCheck size={20} className="text-[#52796f]" />,
                title: 'Privacy First Vault',
                desc: 'Client-side zero-knowledge encryption ensures your private reflections and journals remain completely confidential.',
              },
              {
                icon: <Share2 size={20} className="text-[#52796f]" />,
                title: 'Share Your Stack',
                desc: 'Publish read-only digital gardens or invite collaborators into specific vaults with granular read/write permissions.',
              },
            ].map((f, i) => (
              <div key={i} className="bg-white border border-surface-container-highest rounded-2xl p-6 shadow-xs hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#edf3f0] border border-[#d6e5de] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-headline font-semibold text-base text-on-surface mb-1.5">{f.title}</h3>
                <p className="text-xs sm:text-sm text-[#5c5b68] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WORKFLOW STEPS */}
        <section id="workflow" className="px-6 sm:px-8 py-16 bg-[#f4f7f5] border-y border-surface-container-highest">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#52796f]">Workflow</span>
              <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight mt-1">
                From fleeting spark to synthesized wisdom in 3 steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '1',
                  title: 'Capture Everywhere',
                  desc: 'Highlight any webpage, send tweets, or paste URLs into your dashboard immediately with one click.',
                },
                {
                  step: '2',
                  title: 'Auto-Categorize',
                  desc: 'Brain Stack tags your sources, generates concise summaries, and organizes them by content type automatically.',
                },
                {
                  step: '3',
                  title: 'Retrieve & Synthesize',
                  desc: 'Search your notes via fuzzy query or tag filtering, retrieve references, and never lose an important idea.',
                },
              ].map((s, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-surface-container-highest shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-[#52796f] text-white flex items-center justify-center font-bold text-sm mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-headline font-semibold text-base text-on-surface mb-2">{s.title}</h3>
                  <p className="text-xs text-[#5c5b68] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="px-6 sm:px-8 py-20">
          <div className="max-w-5xl mx-auto rounded-3xl bg-[#354f52] text-white p-8 sm:p-14 text-center relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-wider uppercase text-primary-fixed bg-[#52796f]/40 px-3 py-1 rounded-full">
                Unlock Total Recall
              </span>
              <h2 className="font-headline text-3xl sm:text-4xl font-extrabold tracking-tight mt-4">
                Ready to supercharge your memory? Join Brain Stack.
              </h2>
              <p className="text-sm text-[#cad2c5] mt-3 leading-relaxed">
                An intentional, zero-clutter intelligence hub to capture, correlate, and synthesize ideas from across the open web.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/auth"
                  className="px-6 py-3 bg-white text-sage-deep font-semibold text-sm rounded-xl hover:bg-surface-container-low transition-colors shadow-sm"
                >
                  Create Your Free Account
                </Link>
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-[#52796f] text-white font-semibold text-sm rounded-xl hover:bg-primary transition-colors border border-white/20"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-surface-container-highest py-8 px-6 sm:px-8 text-xs text-[#5c5b68] bg-[#fcfcf9]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#52796f]" />
            <span className="font-headline font-bold text-sm text-on-surface">Brain Stack</span>
            <span className="text-outline">© {new Date().getFullYear()}</span>
          </div>
          <p>© {new Date().getFullYear()} Brain Stack. Curated personal intelligence workspace.</p>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hover:text-primary">Sign In</Link>
            <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
