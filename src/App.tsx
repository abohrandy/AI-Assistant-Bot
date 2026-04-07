import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  Sparkles, 
  Zap, 
  Filter, 
  LayoutDashboard, 
  Settings as SettingsIcon,
  LogOut,
  BrainCircuit,
  MessageCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { classifyMessage, filterKnowledge, generateReply, reviewReply, matchFAQ } from './lib/gemini';
import LandingPage from './pages/LandingPage';
import { SettingsPage } from './pages/SettingsPage';
import { Auth } from './components/Auth';

// --- STYLES ---
const containerStyle = "min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 transition-all duration-500";
const glassPanel = "bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden";
const cardStyle = "bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20";

const Dashboard: React.FC = () => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [faqMatch, setFaqMatch] = useState<string | null>(null);
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenant = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'tenants', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTenantData(docSnap.data());
        }
      }
    };
    fetchTenant();
  }, []);

  const handleProcess = async () => {
    if (!input.trim() || !tenantData) return;
    setIsProcessing(true);
    setFaqMatch(null); // Reset
    try {
      // --- STAGE 0: FAQ MATCH ---
      const faqsString = tenantData.knowledgeCards
        .filter((c: any) => c.title.toLowerCase().includes('faq'))
        .map((c: any) => `Q: ${c.title}\nA: ${c.content}`)
        .join('\n\n');
      
      let currentFaqMatch = null;
      if (faqsString) {
        const match = await matchFAQ({ message: input, faqs: faqsString });
        currentFaqMatch = match !== 'NONE' ? match : null;
        setFaqMatch(currentFaqMatch);
      }

      // --- STAGE 1: INTENT CLASSIFICATION ---
      const classification = await classifyMessage(input);

      // --- STAGE 2: KNOWLEDGE FILTERING ---
      const filterData = await filterKnowledge({
        message: input,
        knowledgeBase: tenantData.knowledgeCards.map((c: any) => `${c.title}: ${c.content}`).join('\n')
      });

      // --- STAGE 3: HUMAN-LIKE REPLY ---
      const replyData = await generateReply({
        businessName: tenantData.businessName,
        tone: tenantData.tone,
        context: filterData.bullets,
        history: "No previous messages.",
        message: input
      });

      // --- STAGE 4: REPLY REVIEW ---
      const finalReply = await reviewReply({
        reply: replyData.reply,
        context: filterData.bullets
      });

      // --- FINAL DECISION: AUTO-SEND LOGIC ---
      const isAutoSend = (
        classification.category === "simple_question" &&
        classification.confidence > 0.9 &&
        replyData.confidence > 0.85
      );
      setAutoSend(isAutoSend);

      setPipelineData({
        classification,
        knowledge: filterData,
        reply: replyData,
        finalReply,
        isAutoSend
      });

    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={containerStyle}>
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                ANTIGRAVITY <span className="text-purple-500 font-black">PRO</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/settings')}
              className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10 flex items-center gap-2"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:block">Settings</span>
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/10"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-20">
        <div className="flex flex-col gap-12">
          <div className={`${glassPanel} p-6 md:p-12 relative group`}>
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-20 h-20 md:w-40 md:h-40 text-purple-500" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Powering {tenantData?.businessName || 'Your Business'}</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 leading-[0.9] tracking-tight">
                Simulate your <span className="text-purple-500">AI pipeline.</span>
              </h1>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                Test how your assistant handles customer inquiries using your latest knowledge cards and tone settings.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 md:pl-6 focus-within:border-purple-500/50 transition-all shadow-2xl">
                  <div className="hidden md:flex items-center gap-4">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                  </div>
                  <input 
                    className="flex-1 bg-transparent px-4 py-4 md:py-3 outline-none text-white placeholder-gray-600 text-base" 
                    placeholder="How much for a new logo design?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                  />
                  <button 
                    onClick={handleProcess}
                    disabled={isProcessing || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-6 py-4 md:py-3 transition-all flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                  >
                    {isProcessing ? 'Thinking...' : 'Simulate'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(pipelineData || faqMatch) && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                {faqMatch && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex gap-4 items-start shadow-xl shadow-emerald-500/5"
                  >
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider mb-1">Official FAQ Match Found</h4>
                      <p className="text-emerald-50 text-lg italic leading-relaxed">"{faqMatch}"</p>
                    </div>
                  </motion.div>
                )}

                {pipelineData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Stage 1: Intent */}
                    <div className={`${cardStyle} border-l-4 border-l-blue-500`}>
                      <div className="flex items-center gap-2 mb-4">
                        <BrainCircuit className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-bold uppercase text-blue-400 tracking-tighter">Stage 1: Intent</span>
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <span className="text-blue-400 font-bold block mb-1 text-sm uppercase">
                          {pipelineData.classification.category.replace('_', ' ')}
                        </span>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${pipelineData.classification.confidence * 100}%` }} 
                            className="h-full bg-blue-500" 
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          {(pipelineData.classification.confidence * 100).toFixed(1)}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Stage 2: Context */}
                    <div className={`${cardStyle} border-l-4 border-l-emerald-500`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold uppercase text-emerald-400 tracking-tighter">Stage 2: Context</span>
                      </div>
                      <div className="bg-emerald-500/5 p-4 rounded-xl space-y-2 border border-emerald-500/10 h-[100px] overflow-y-auto">
                        <ul className="space-y-2">
                          {pipelineData.knowledge.bullets.split('\n').filter(Boolean).map((bullet: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-xs text-emerald-100">
                              <CheckCircle2 className="w-3 h-3 mt-1 text-emerald-500 flex-shrink-0" />
                              <span>{bullet.replace(/^[*-]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Stage 3: Draft */}
                    <div className={`${cardStyle} border-l-4 border-l-purple-500 relative overflow-hidden group`}>
                      <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                        <MessageCircle className="w-20 h-20 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-xs font-bold uppercase text-purple-400 tracking-tighter">Stage 3: Draft</span>
                      </div>
                      <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                        <p className="text-white leading-relaxed text-xs italic">"{pipelineData.reply.reply}"</p>
                      </div>
                    </div>

                    {/* Stage 4: Reviewed */}
                    <div className={`${cardStyle} border-l-4 border-l-orange-500 relative overflow-hidden group`}>
                      <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldCheck className="w-20 h-20 text-orange-400" />
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-orange-400" />
                      <span className="text-xs font-bold uppercase text-orange-400 tracking-tighter">Stage 4: Reviewed</span>
                      {pipelineData.isAutoSend && (
                        <div className="ml-auto px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-[8px] font-black text-orange-400 uppercase tracking-widest animate-pulse">
                          Auto-Send Eligible
                        </div>
                      )}
                    </div>
                      <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                        <p className="text-white leading-relaxed text-sm font-bold">"{pipelineData.finalReply}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" /> : <Auth onAuthSuccess={() => {}} />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <Dashboard /> : <Navigate to="/auth" />} 
      />
      <Route 
        path="/settings" 
        element={user ? <SettingsPage /> : <Navigate to="/auth" />} 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <div className={containerStyle}>
        <AppLayout />
      </div>
    </Router>
  );
}
