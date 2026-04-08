import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight, 
  LogOut, 
  Instagram, 
  Zap, 
  Search,
  ChevronRight,
  TrendingUp,
  Clock,
  MessageSquare,
  Building2,
  Lock,
  X,
  ExternalLink,
  Eye,
  Settings as SettingsIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const glassPanel = "bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden";
const cardStyle = "bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20 relative group";

const AdminStat = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className={cardStyle}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-black mb-1">{value}</h3>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{title}</p>
  </div>
);

interface AdminDashboardProps {
  onImpersonate: (uid: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onImpersonate }) => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalTenants: 0,
    activeBots: 0,
    totalMessages: 0,
    avgLatency: '14ms'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen to all tenants
    const unsubTenants = onSnapshot(collection(db, 'tenants'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTenants(items);
      
      // Calculate global stats
      const active = items.filter((t: any) => t.botConfig?.enabled).length;
      setGlobalStats(prev => ({
        ...prev,
        totalTenants: items.length,
        activeBots: active
      }));
    });

    return () => unsubTenants();
  }, []);

  const filteredTenants = tenants.filter(t => 
    t.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Admin Navbar */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter">
                FORGE <span className="text-red-500 font-black">ADMIN</span>
                <span className="ml-2 text-[10px] text-gray-600 font-mono">v1.1.0</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400">
               <Activity className="w-3.5 h-3.5 text-emerald-400" />
               SYSTEM HEALTH: OPTIMAL
             </div>
             
             <button 
              onClick={() => setShowSettings(true)}
              className="px-4 py-2.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10 flex items-center gap-2"
              title="System Settings"
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">Settings</span>
            </button>

             <button 
              onClick={() => signOut(auth)}
              className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/10"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Global Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AdminStat 
            title="Total Tenants" 
            value={globalStats.totalTenants} 
            icon={Users} 
            color="blue" 
            trend="+12%"
          />
          <AdminStat 
            title="Active Bots" 
            value={globalStats.activeBots} 
            icon={Instagram} 
            color="pink" 
          />
          <AdminStat 
            title="Total Traffic" 
            value="12.4k" 
            icon={MessageSquare} 
            color="purple" 
            trend="+8.2%"
          />
          <AdminStat 
            title="System Latency" 
            value={globalStats.avgLatency} 
            icon={Clock} 
            color="orange" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Tenant List Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight">Tenant Directory</h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Filter businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-red-500/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredTenants.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                  <Building2 className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No tenants found</p>
                </div>
              ) : (
                 filteredTenants.map((tenant) => (
                  <div 
                    key={tenant.id} 
                    className={`${cardStyle} flex items-center justify-between hover:border-red-500/30`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10 font-black text-lg text-red-400">
                        {tenant.businessName?.[0] || 'T'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{tenant.businessName || 'Unnamed Tenant'}</h4>
                        <p className="text-[10px] text-gray-500 font-mono tracking-tight">{tenant.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tenant.botConfig?.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-500'}`}>
                          {tenant.botConfig?.enabled ? 'RUNNING' : 'IDLE'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all text-gray-400 hover:text-red-400 group/btn"
                      >
                        Manage
                        <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Admin Sidebar */}
          <div className="lg:col-span-4 space-y-6">
             <div className={`${glassPanel} p-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <ShieldAlert className="w-20 h-20 text-orange-500" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-6 relative z-10">Security Pulse</h3>
                <div className="space-y-6 relative z-10">
                  <div className="flex gap-4 group">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 h-fit transition-all group-hover:scale-110">
                      <ShieldAlert className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">New Tenant Signup</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">@premium_user joined 2m ago</p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 h-fit transition-all group-hover:scale-110">
                      <Zap className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">IG Auth Error</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Tenant: 8977c_rev failed to connect</p>
                    </div>
                  </div>
                </div>
             </div>

             <div className={`${glassPanel} p-8 bg-red-600/5 border-red-500/20 group hover:bg-red-600/10 transition-all`}>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-sm text-red-400 uppercase tracking-widest">Infrastucture Control</h3>
                </div>
                <button className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-red-500/30 active:scale-95">
                  REBOOT AUTOMATION FLEET
                </button>
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 mt-4">
                  <p className="text-[9px] text-red-400 leading-relaxed font-bold">
                    WARNING: This command will hard-reset all active Puppeteer instances globally. Use with extreme caution.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedTenant && (
          <TenantManagementModal 
            tenant={selectedTenant} 
            onClose={() => setSelectedTenant(null)} 
            onImpersonate={(uid) => {
              setSelectedTenant(null);
              onImpersonate(uid);
            }}
          />
        )}
        {showSettings && (
          <SettingsModal onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const TenantManagementModal = ({ tenant, onClose, onImpersonate }: { 
  tenant: any, 
  onClose: () => void,
  onImpersonate: (uid: string) => void 
}) => {
  const [isSuspending, setIsSuspending] = useState(false);
  if (!tenant) return null;

  const handleSuspendToggle = async () => {
    setIsSuspending(true);
    try {
      const tenantRef = doc(db, 'tenants', tenant.id);
      await updateDoc(tenantRef, {
        'botConfig.enabled': !tenant.botConfig?.enabled
      });
    } catch (error) {
      console.error("Error toggling suspension:", error);
    } finally {
      setIsSuspending(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-2xl text-red-400">
              {tenant.businessName?.[0] || 'T'}
            </div>
            <div>
              <h3 className="text-xl font-black">{tenant.businessName || 'Tenant Overview'}</h3>
              <p className="text-xs text-gray-500 font-mono">{tenant.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Bot Configuration</h4>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tenant.botConfig?.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tenant.botConfig?.enabled ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">IG Username</span>
                  <span className="text-xs font-mono text-white">{tenant.botConfig?.igUsername || 'Not connected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Tone Profile</span>
                  <span className="text-xs font-bold text-red-400">{tenant.tone || 'Default'}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Knowledge Base</h4>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-[11px] text-gray-400 line-clamp-3 italic">
                  "{tenant.knowledgeCards?.[0]?.content || 'No knowledge base initialized for this tenant.'}"
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Management Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => onImpersonate(tenant.id)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all group"
                >
                  <Eye className="w-4 h-4 group-hover:text-red-400 transition-colors" />
                  Impersonate Dashboard
                </button>
                <button 
                  onClick={handleSuspendToggle}
                  disabled={isSuspending}
                  className={`w-full py-3.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    tenant.botConfig?.enabled 
                      ? 'bg-red-600/10 hover:bg-red-600/20 border-red-500/20 text-red-400' 
                      : 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isSuspending ? (
                    <Zap className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {tenant.botConfig?.enabled ? 'Suspend Automation' : 'Resume Automation'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Compliance</span>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                Tenant is currently adhering to all Instagram automation policies. No flags detected.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black">System Settings</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Global API Prefix</label>
            <input 
              type="text" 
              defaultValue="https://api.forge-alpha.io/v1"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-red-500/20 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Fleet Refresh Interval</label>
            <select className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-red-500/20 outline-none appearance-none">
              <option>5 Minutes</option>
              <option>15 Minutes</option>
              <option>1 Hour</option>
            </select>
          </div>

          <button className="w-full py-4 bg-white text-black rounded-xl text-xs font-black hover:bg-gray-200 transition-all mt-4">
            SAVE SYSTEM CONFIGURATION
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
