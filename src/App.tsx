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
  ShieldCheck,
  Instagram,
  Power,
  Type,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { classifyMessage, filterKnowledge, generateReply, reviewReply, matchFAQ } from './lib/gemini';
import LandingPage from './pages/LandingPage';
import { SettingsPage } from './pages/SettingsPage';
import { Auth } from './components/Auth';

// --- STYLES ---
const containerStyle = "min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 transition-all duration-500";
const glassPanel = "bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden";
const cardStyle = "bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/20";

const StatsCard = ({ title, value, sub, icon: Icon, color }: any) => (
  <div className={`${cardStyle} flex flex-col gap-3 group/card`}>
    <div className="flex items-center justify-between">
      <div className={`p-2 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{sub}</span>
    </div>
    <div>
      <h3 className="text-2xl font-black">{value}</h3>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
    </div>
  </div>
);

interface DashboardProps {
  uidOverride?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ uidOverride }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [faqMatch, setFaqMatch] = useState<string | null>(null);
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const [stats, setStats] = useState<any>({
    totalMessages: 0,
    automatedReplies: 0,
    avgResponseTime: 0,
    accuracy: 98.2 
  });
  const [activities, setActivities] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const activeUid = uidOverride || auth.currentUser?.uid;
    if (!activeUid) return;

    // 1. Listen to Tenant Doc (including botConfig)
    const unsubTenant = onSnapshot(doc(db, 'tenants', activeUid), (doc) => {
      if (doc.exists()) {
        setTenantData(doc.data());
      }
    });

    // 2. Listen to Stats
    const unsubStats = onSnapshot(doc(db, 'tenants', activeUid, 'stats', 'overview'), (doc) => {
      if (doc.exists()) {
        setStats((prev: any) => ({ ...prev, ...doc.data() }));
      }
    });

    // 3. Listen to Last 10 Activities
    const q = query(
      collection(db, 'tenants', activeUid, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const unsubActivity = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(items);
    });

    return () => {
      unsubTenant();
      unsubStats();
      unsubActivity();
    };
  }, []);

  const handleProcess = async () => {
    if (!input.trim() || !tenantData) return;
    setIsProcessing(true);
    setFaqMatch(null); 
    try {
      const faqsString = (tenantData.knowledgeCards || [])
        .filter((c: any) => c.title.toLowerCase().includes('faq'))
        .map((c: any) => `Q: ${c.title}\nA: ${c.content}`)
        .join('\n\n');
      
      let currentFaqMatch = null;
      if (faqsString) {
        const match = await matchFAQ({ message: input, faqs: faqsString });
        currentFaqMatch = match !== 'NONE' ? match : null;
        setFaqMatch(currentFaqMatch);
      }

      const classification = await classifyMessage(input);
      const filterData = await filterKnowledge({
        message: input,
        knowledgeBase: (tenantData.knowledgeCards || []).map((c: any) => `${c.title}: ${c.content}`).join('\n'),
        webLinks: tenantData.webLinks?.map((l: any) => l.url) || [],
        documents: tenantData.documents || []
      });

      const replyData = await generateReply({
        businessName: tenantData.businessName,
        tone: tenantData.tone,
        context: filterData.bullets,
        history: "No previous messages.",
        message: input
      });

      const finalReply = await reviewReply({
        reply: replyData.reply,
        context: filterData.bullets
      });

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

  const isBotEnabled = tenantData?.botConfig?.enabled || false;

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
        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Messages" 
              value={stats.totalMessages.toLocaleString()} 
              sub="Live count" 
              icon={MessageSquare} 
              color="blue" 
            />
            <StatsCard 
              title="Auto-Pilot Replies" 
              value={stats.automatedReplies.toLocaleString()} 
              sub={`${Math.round((stats.automatedReplies / (stats.totalMessages || 1)) * 100)}% automated`} 
              icon={Zap} 
              color="purple" 
            />
            <StatsCard 
              title="Response Accuracy" 
              value={`${stats.accuracy}%`} 
              sub="AI Performance" 
              icon={Sparkles} 
              color="emerald" 
            />
            <StatsCard 
              title="AVG Response Time" 
              value={`${stats.avgResponseTime?.toFixed(1) || '0.0'}s`} 
              sub="End-to-end" 
              icon={BrainCircuit} 
              color="orange" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Main Column: Simulation & Monitoring */}
            <div className="lg:col-span-8 flex flex-col gap-10">
              <div className={`${glassPanel} p-6 md:p-10 relative group`}>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <LayoutDashboard className="w-40 h-40 text-purple-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Pipeline Sandbox</span>
                  </div>
                  <h2 className="text-3xl font-black mb-4 tracking-tight">Intelligence Testing</h2>
                  <p className="text-gray-400 mb-8 max-w-xl">
                    Dry-run your AI assistant against custom inquiries to verify its logic, tone, and knowledge accuracy.
                  </p>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 md:pl-6 focus-within:border-purple-500/50 transition-all shadow-2xl">
                    <input 
                      className="flex-1 bg-transparent px-4 py-4 md:py-3 outline-none text-white placeholder-gray-600 text-base" 
                      placeholder="Simulate a customer inquiry..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                    />
                    <button 
                      onClick={handleProcess}
                      disabled={isProcessing || !input.trim()}
                      className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-8 py-4 md:py-3 transition-all flex items-center justify-center gap-2 font-black disabled:opacity-50 w-full md:w-auto"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Test Pipeline
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {(pipelineData || faqMatch) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {faqMatch && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex gap-4 items-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Knowledge Base Match</p>
                          <p className="text-emerald-50 italic text-sm">"{faqMatch}"</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pipelineData && (
                        <>
                          <div className={`${cardStyle} border-l-4 border-blue-500`}>
                            <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Intent Analysis</h4>
                            <p className="text-sm font-bold text-white mb-2">{pipelineData.classification.category.replace('_', ' ')}</p>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pipelineData.classification.confidence * 100}%` }} className="h-full bg-blue-500" />
                            </div>
                          </div>
                          <div className={`${cardStyle} border-l-4 border-emerald-500`}>
                            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2">Retrieved Context</h4>
                            <p className="text-[10px] text-gray-400 line-clamp-2 italic">"{pipelineData.knowledge.bullets}"</p>
                          </div>
                          <div className={`${cardStyle} border-l-4 border-purple-500 md:col-span-2`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Generated Response</h4>
                              {pipelineData.isAutoSend && (
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase">Auto-Pilot Optimized</span>
                              )}
                            </div>
                            <p className="text-white text-sm leading-relaxed font-medium">"{pipelineData.finalReply}"</p>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar: System Status & Activity */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Worker Status */}
              <div className={`${glassPanel} p-8`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Worker Status</h3>
                  <div className={`w-2 h-2 rounded-full ${isBotEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${isBotEnabled ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <Instagram className={`w-6 h-6 ${isBotEnabled ? 'text-emerald-400' : 'text-red-400'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Instagram Node</p>
                      <p className={`text-[10px] ${isBotEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isBotEnabled ? 'Active & Monitoring' : 'Offline / Interrupted'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500 uppercase tracking-widest text-[9px]">Uptime</span>
                      <span className="text-emerald-400">99.9%</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500 uppercase tracking-widest text-[9px]">Queue Latency</span>
                      <span className="text-blue-400">12ms</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${glassPanel} flex-1 p-8 overflow-hidden flex flex-col`}>
                <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-6">Live Activity</h3>
                <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                      <MessageSquare className="w-10 h-10 mb-2" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">No activity yet</p>
                    </div>
                  ) : (
                    activities.map((item) => (
                      <div key={item.id} className="flex gap-4 group cursor-help">
                        <div className={`p-2 h-fit rounded-lg bg-${item.type === 'reply' ? 'blue' : item.type === 'error' ? 'red' : 'purple'}-500/10 border border-${item.type === 'reply' ? 'blue' : item.type === 'error' ? 'red' : 'purple'}-500/20`}>
                          {item.type === 'reply' ? <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> : 
                           item.type === 'error' ? <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> : 
                           <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-gray-200">@{item.user || 'system'}</p>
                            <span className="text-[9px] text-gray-500">
                              {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'now'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.action}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button className="w-full mt-8 py-3 rounded-xl border border-white/5 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-all">
                  View Security Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

import { AdminDashboard } from './components/AdminDashboard';

export const AppLayout: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUid, setImpersonatedUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'tenants', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRole(docSnap.data().role || 'user');
          } else {
            setRole('user');
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setRole('user');
        }
      } else {
        setRole(null);
      }
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
        element={
          user ? (
            impersonatedUid ? (
              <>
                <div className="fixed top-0 left-0 right-0 bg-yellow-500/20 backdrop-blur-md border-b border-yellow-500/30 z-[60] py-2 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Impersonation Mode</span>
                  </div>
                  <button 
                    onClick={() => setImpersonatedUid(null)}
                    className="px-3 py-1 rounded-lg bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors"
                  >
                    Exit Preview
                  </button>
                </div>
                <Dashboard uidOverride={impersonatedUid} />
              </>
            ) : role === 'admin' ? (
              <AdminDashboard onImpersonate={setImpersonatedUid} />
            ) : (
              <Dashboard />
            )
          ) : (
            <Navigate to="/auth" />
          )
        } 
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
