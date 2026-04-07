import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Building2, 
  MessageSquare, 
  BookOpen, 
  CheckCircle2, 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  AlertCircle,
  Type,
  Layout,
  Instagram,
  ShieldCheck,
  Zap,
  Power
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
}

const TONE_PRESETS = [
  { id: 'professional', label: 'Professional', value: 'Professional, polite, and helpful. Use clear business language.' },
  { id: 'friendly', label: 'Friendly', value: 'Casual, warm, and enthusiastic. Use emojis and a welcoming tone.' },
  { id: 'concise', label: 'Concise', value: 'Extremely brief and to the point. No fluff, just the facts.' },
  { id: 'genz', label: 'Gen Z', value: 'Energetic, uses modern slang subtly, and lots of emojis. Very informal.' },
];

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    tone: 'Professional, polite, and helpful. Use clear business language.',
    isCustomTone: false,
    knowledgeBase: [] as KnowledgeCard[],
    botConfig: {
      username: '',
      password: '',
      enabled: false,
      autoSend: true
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'tenants', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          businessName: data.businessName || '',
          tone: data.tone || '',
          isCustomTone: data.isCustomTone || false,
          knowledgeBase: Array.isArray(data.knowledgeBase) ? data.knowledgeBase : [],
          botConfig: data.botConfig || { username: '', password: '', enabled: false, autoSend: true }
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, 'tenants', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const addKnowledgeCard = () => {
    const newCard: KnowledgeCard = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: ''
    };
    setFormData({
      ...formData,
      knowledgeBase: [...formData.knowledgeBase, newCard]
    });
  };

  const removeKnowledgeCard = (id: string) => {
    setFormData({
      ...formData,
      knowledgeBase: formData.knowledgeBase.filter(card => card.id !== id)
    });
  };

  const updateKnowledgeCard = (id: string, field: 'title' | 'content', value: string) => {
    setFormData({
      ...formData,
      knowledgeBase: formData.knowledgeBase.map(card => 
        card.id === id ? { ...card, [field]: value } : card
      )
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Assistant Forge
            </h1>
            <p className="text-gray-400 mt-2">Sculpt your AI's identity and intelligence</p>
          </div>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 bg-green-500/10 text-green-400 px-6 py-3 rounded-2xl border border-green-500/20 backdrop-blur-xl"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold">Sync Complete</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Core Identity */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Building2 className="w-32 h-32 text-blue-500" />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Core Identity</h2>
            </div>
            
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Business Display Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium text-lg"
                    placeholder="e.g. Reelas Technology"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">
                    <Type className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: AI Persona */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <MessageSquare className="w-32 h-32 text-purple-500" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold">Persona & Tone</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Tone Presets</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TONE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tone: preset.value, isCustomTone: false })}
                      className={`p-4 rounded-2xl border transition-all text-left group ${
                        !formData.isCustomTone && formData.tone === preset.value
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="block font-bold mb-1">{preset.label}</span>
                      <span className="text-[10px] opacity-60 leading-tight block">Standard Profile</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isCustomTone: true })}
                    className={`p-4 rounded-2xl border transition-all text-left ${
                      formData.isCustomTone
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="block font-bold mb-1">Custom Override</span>
                    <span className="text-[10px] opacity-60 leading-tight block">User Defined</span>
                  </button>
                </div>
              </div>

              {formData.isCustomTone && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Custom Tone Description</label>
                  <textarea
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none text-lg font-medium"
                    placeholder="Describe exactly how the AI should speak..."
                  />
                  <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Be specific about formality, emoji usage, and sentence length.</span>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Section 3: Structured Knowledge */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-32 h-32 text-emerald-500" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold">Intelligence Core</h2>
              </div>
              <button
                type="button"
                onClick={addKnowledgeCard}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {formData.knowledgeBase.map((card) => (
                  <motion.div
                    key={card.id}
                    layout={true}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 relative group/card hover:bg-white/[0.07] transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => removeKnowledgeCard(card.id)}
                      className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover/card:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateKnowledgeCard(card.id, 'title', e.target.value)}
                          className="bg-transparent border-b border-white/10 w-full pb-2 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                          placeholder="Card Title (e.g. Pricing Structure)"
                        />
                      </div>
                      <textarea
                        value={card.content}
                        onChange={(e) => updateKnowledgeCard(card.id, 'content', e.target.value)}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-300 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none leading-relaxed"
                        placeholder="Detailed information for this category..."
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {formData.knowledgeBase.length === 0 && (
                <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <Layout className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No knowledge cards yet.</p>
                  <p className="text-gray-600 text-sm mt-1">Add cards to feed the AI intelligence.</p>
                </div>
              )}
            </div>
          </section>

          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-white text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Apply Intelligence Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
