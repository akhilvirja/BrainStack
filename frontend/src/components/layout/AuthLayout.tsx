import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Layers, Zap, Wand2, ShieldCheck } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="w-full bg-[#f8f8f4] min-h-screen flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden font-body text-on-surface selection:bg-[#c4ebd9] selection:text-[#283618]">
      {/* Background Orbs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#dbe6df]/60 blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#e3eade]/70 blur-[100px] pointer-events-none"></div>
      
      <div className="flex flex-col w-full relative z-10">
        <div className="w-full max-w-6xl mx-auto my-auto py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-xl shadow-stone-200/50 border border-outline-variant/60 bg-surface-container-lowest">
            
            {/* Left Visual Panel */}
            <div className="relative lg:col-span-5 bg-gradient-to-br from-[#eaf0ec] via-[#e2eae4] to-[#d8e4dc] text-spruce p-8 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-outline-variant/50">
              {/* Subtle Organic Ambient Circles */}
              <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/40 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#cadbce]/40 blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/80 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                    <Layers size={24} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline font-bold text-xl tracking-tight text-spruce">Brain Stack</span>
                    <span className="text-xs uppercase tracking-wider text-secondary font-semibold">Knowledge Operating System</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h1 className="font-headline text-2xl lg:text-3xl font-bold leading-snug text-spruce tracking-tight">
                    Capture, connect, and retrieve your thoughts at the speed of thought.
                  </h1>
                  <p className="mt-3 font-body text-sm text-[#414844] leading-relaxed max-w-sm">
                    Your frictionless digital sanctuary. Organize research, curate media, and synthesize mental clarity effortlessly.
                  </p>
                </div>
              </div>

              {/* Middle Feature Bullets */}
              <div className="relative z-10 my-8 flex flex-col gap-3.5">
                {[
                  { icon: <Zap size={18} />, title: 'Instant Capture', desc: 'Direct sync from X, YouTube, Kindle, and Safari.' },
                  { icon: <Wand2 size={18} />, title: 'AI Tag Suggestions', desc: 'Automatic conceptual linking and deep semantic clustering.' },
                  { icon: <ShieldCheck size={18} />, title: 'Encrypted Vault', desc: 'End-to-end zero-knowledge security for your private reflections.' }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/65 border border-white/80 backdrop-blur-sm transition-all hover:bg-white/90 shadow-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#d9e6de] border border-primary/20 flex items-center justify-center text-primary shadow-none">
                      {feature.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-headline font-semibold text-sm text-spruce">{feature.title}</span>
                      <span className="font-body text-xs text-on-surface-variant">{feature.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Form Panel rendered via nested routes */}
            <div className="lg:col-span-7 bg-[#ffffff] p-8 lg:p-14 flex flex-col justify-center">
              <Outlet />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
