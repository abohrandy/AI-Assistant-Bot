import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  Zap, 
  Target, 
  Layers, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Documentation', href: '#docs' },
];

const features = [
  {
    icon: Target,
    title: "Precision Classification",
    desc: "Automatically categorize messages into 5+ strategic categories with 99% accuracy.",
    color: "bg-blue-500"
  },
  {
    icon: Layers,
    title: "Knowledge Filtering",
    desc: "Extract only what matters from business data to provide relevant, concise answers.",
    color: "bg-emerald-500"
  },
  {
    icon: Zap,
    title: "Instant Response",
    desc: "Powered by Gemini 3 Flash for sub-second analysis and real-time support.",
    color: "bg-purple-500"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-primary-100 selection:text-primary-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-800 tracking-tight">Reelas AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors">
                {link.label}
              </a>
            ))}
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden">
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary-100/50 rounded-full blur-3xl opacity-30 select-none pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[400px] h-[400px] bg-purple-100/50 rounded-full blur-3xl opacity-30 select-none pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full border border-primary-100 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">Powered by Gemini 3 Flash</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 px-2"
          >
            Modern AI for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Complex Support.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium px-4"
          >
            Standalone intelligence for message classification and knowledge filtering. Automate your business communication with the precision of deep learning.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-2xl text-lg font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 group"
            >
              Access Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all">
              View Specs
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Unmatched Precision</h2>
            <p className="text-slate-500 font-medium">Three core pillars of the Reelas AI Assistant Service.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-white hover:shadow-2xl hover:shadow-primary-500/5 transition-all group"
              >
                <div className={`p-4 rounded-2xl ${f.color} text-white mb-6 inline-block shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-4xl font-black mb-1">99%</div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">Accuracy</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black mb-1">&lt;0.5s</div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">Latency</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black mb-1">5+</div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">Categories</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black mb-1">10k+</div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500">Analysed</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-primary-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to automate your support?</h2>
          <p className="text-primary-100 text-lg mb-10 font-medium opacity-80">Deploy the standalone Reelas AI engine in minutes.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-10 py-5 bg-white text-primary-600 rounded-2xl text-xl font-black hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
          >
            Launch Standalone App
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)] select-none pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
            Reelas Technology Limited &copy; 2026 • AI Assistant Bot
          </p>
        </div>
      </footer>
    </div>
  );
}
