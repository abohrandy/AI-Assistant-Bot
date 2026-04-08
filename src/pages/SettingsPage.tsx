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
  Power,
  Globe,
  FileText,
  Link2,
  X,
  ExternalLink,
  File
} from 'lucide-react';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Link } from 'react-router-dom';

interface KnowledgeCard {
  id: string;
  title: string;
  content: string;
}

interface DocumentInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
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
    knowledgeCards: [] as KnowledgeCard[],
    webLinks: [] as string[],
    documents: [] as DocumentInfo[],
    botConfig: {
      username: '',
      password: '',
      enabled: false,
      autoSend: true
    }
  });

  const [linkInput, setLinkInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const docRef = doc(db, 'tenants', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            businessName: data.businessName || '',
            tone: data.tone || '',
            isCustomTone: data.isCustomTone || false,
            knowledgeCards: Array.isArray(data.knowledgeCards) ? data.knowledgeCards : [],
            webLinks: Array.isArray(data.webLinks) ? data.webLinks : [],
            documents: Array.isArray(data.documents) ? data.documents : [],
            botConfig: data.botConfig || { username: '', password: '', enabled: false, autoSend: true }
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
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
      knowledgeCards: [...formData.knowledgeCards, newCard]
    });
  };

  const removeKnowledgeCard = (id: string) => {
    setFormData({
      ...formData,
      knowledgeCards: formData.knowledgeCards.filter(card => card.id !== id)
    });
  };

  const updateKnowledgeCard = (id: string, field: 'title' | 'content', value: string) => {
    setFormData({
      ...formData,
      knowledgeCards: formData.knowledgeCards.map(card => 
        card.id === id ? { ...card, [field]: value } : card
      )
    });
  };

  const addWebLink = () => {
    if (!linkInput) return;
    try {
      new URL(linkInput); // Validation
      if (!formData.webLinks.includes(linkInput)) {
        setFormData({
          ...formData,
          webLinks: [...formData.webLinks, linkInput]
        });
      }
      setLinkInput('');
    } catch (e) {
      alert('Please enter a valid URL');
    }
  };

  const removeWebLink = (link: string) => {
    setFormData({
      ...formData,
      webLinks: formData.webLinks.filter(l => l !== link)
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported at this time.');
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);

    const fileId = Math.random().toString(36).substr(2, 9);
    const storageRef = ref(storage, `tenants/${user.uid}/documents/${fileId}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error('Upload failed:', error);
        setUploading(false);
        alert('Upload failed. Please try again.');
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const newDoc: DocumentInfo = {
          id: fileId,
          name: file.name,
          url: downloadURL,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, newDoc]
        }));
        setUploading(false);
        setUploadProgress(0);
      }
    );
  };

  const removeDocument = async (docInfo: DocumentInfo) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter(d => d.id !== docInfo.id)
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
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 pb-40">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Assistant Forge
            </h1>
            <p className="text-gray-400 mt-2 text-sm md:text-base">Sculpt your AI's identity and intelligence</p>
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
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium text-base md:text-lg"
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
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
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
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none text-base md:text-lg font-medium"
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
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
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
                {formData.knowledgeCards.map((card) => (
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

              {formData.knowledgeCards.length === 0 && (
                <div className="md:col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <Layout className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No knowledge cards yet.</p>
                  <p className="text-gray-600 text-sm mt-1">Add cards to feed the AI intelligence.</p>
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Web Intelligence */}
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Globe className="w-32 h-32 text-blue-400" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold">Web Intelligence</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWebLink())}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
                    placeholder="https://example.com/pricing-or-about"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">
                    <Link2 className="w-5 h-5" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addWebLink}
                  className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  Connect
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {formData.webLinks.map((link) => (
                  <div 
                    key={link}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl group/link hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-gray-300 truncate font-medium">{link}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWebLink(link)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.webLinks.length === 0 && (
                  <p className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-white/5 rounded-2xl">
                    No web links connected yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Section 5: Document Intelligence */}
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <File className="w-32 h-32 text-orange-500" />
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <File className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold">Document Intelligence</h2>
            </div>
            
            <div className="space-y-6">
              <div className="relative group/upload">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={uploading}
                />
                <div className={`p-10 border-2 border-dashed rounded-[2rem] text-center transition-all ${
                  uploading ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10 group-hover/upload:border-orange-500/30 group-hover/upload:bg-orange-500/5'
                }`}>
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                      <div>
                        <p className="font-bold text-lg">Uploading Knowledge...</p>
                        <div className="max-w-xs mx-auto mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-orange-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <File className="w-12 h-12 text-gray-700 mx-auto mb-4 group-hover/upload:text-orange-500 transition-colors" />
                      <p className="text-gray-400 font-medium text-lg">Drop PDF documents here</p>
                      <p className="text-gray-500 text-sm mt-1">Directly feed your AI with service guides, brochures, or policy docs.</p>
                      <div className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-white/5 rounded-xl text-sm font-bold text-gray-300 border border-white/10">
                        Choose File
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl group/doc hover:bg-white/10 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-full">{doc.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6: Instagram Integration */}
          <section className="bg-white/5 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Instagram className="w-32 h-32 text-pink-500" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20">
                  <Instagram className="w-6 h-6 text-pink-400" />
                </div>
                <h2 className="text-2xl font-bold">Instagram Connection</h2>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${formData.botConfig.enabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-gray-500/10 border-white/10 text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full ${formData.botConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                {formData.botConfig.enabled ? 'System Active' : 'System Idle'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Instagram Username</label>
                  <input
                    type="text"
                    value={formData.botConfig.username}
                    onChange={(e) => setFormData({ ...formData, botConfig: { ...formData.botConfig, username: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-medium"
                    placeholder="@your_account"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Instagram Password</label>
                  <input
                    type="password"
                    value={formData.botConfig.password}
                    onChange={(e) => setFormData({ ...formData, botConfig: { ...formData.botConfig, password: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40 transition-all font-medium"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="font-bold text-sm">Full Auto-Pilot</p>
                        <p className="text-[10px] text-gray-500">Replies sent without your review</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, botConfig: { ...formData.botConfig, autoSend: !formData.botConfig.autoSend } })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${formData.botConfig.autoSend ? 'bg-purple-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.botConfig.autoSend ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Power className="w-5 h-5 text-red-400" />
                      <div>
                        <p className="font-bold text-sm">Master Switch</p>
                        <p className="text-[10px] text-gray-500">Enable/Disable the entire engine</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, botConfig: { ...formData.botConfig, enabled: !formData.botConfig.enabled } })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${formData.botConfig.enabled ? 'bg-emerald-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.botConfig.enabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-xs text-blue-300">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Your credentials are encrypted end-to-end and stored securely. We only use them to provide automated assistance.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-8">
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
