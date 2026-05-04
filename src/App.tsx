import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  Smartphone, 
  CreditCard, 
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase safely
let app;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

type Category = 'bKash' | 'Nagad' | 'Others';

interface SmsMessage {
  id: string;
  sender: string;
  body: string;
  category: Category;
  trxId?: string;
  timestamp: number;
}

export default function App() {
  console.log("App component starting...");
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('bKash');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [criticalError, setCriticalError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setCriticalError("Firebase Auth failed to initialize. Check your configuration.");
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setAuthError(null);
      } else {
        signInAnonymously(auth).catch((err) => {
          console.error("Auth error:", err);
          if (err.code === 'auth/admin-restricted-operation') {
            setAuthError("Anonymous Authentication is disabled in your Firebase Console.");
          } else {
            setAuthError(err.message);
          }
          setLoading(false); // Stop loading if auth fails
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    setLoading(true);
    const msgsRef = collection(db, 'users', user.uid, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SmsMessage[];
      setMessages(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setAuthError("Failed to connect to data store: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredMessages = messages.filter(m => {
    const matchesCategory = m.category === activeTab;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      m.sender.toLowerCase().includes(searchLower) ||
      m.body.toLowerCase().includes(searchLower) ||
      (m.trxId && m.trxId.toLowerCase().includes(searchLower));
    
    return matchesCategory && matchesSearch;
  });

  if (criticalError) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm">
          <h2 className="text-red-500 font-bold mb-2">Technical Error</h2>
          <p className="text-gray-400 text-sm">{criticalError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Fallback for long loading
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowFallback(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="min-h-screen w-full bg-dark-bg text-gray-100 font-sans flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="p-5 pb-4 flex items-center justify-between glass-nav sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent to-pink-700 flex items-center justify-center shadow-xl shadow-accent/20">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-tighter leading-none italic uppercase">TX Master</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <span className="text-[9px] text-emerald-500/80 font-black uppercase tracking-[0.2em]">Live Encryption</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-[10px] font-black text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
            ID: {user?.uid?.slice(0, 8).toUpperCase() || 'CONNECTING...'}
          </div>
          {authError && <span className="text-[8px] text-red-500 font-black uppercase tracking-tighter px-2 bg-red-500/10 rounded-full border border-red-500/20">Sync Error</span>}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-dark-bg">
        {/* Search Bar */}
        <div className="p-4 pt-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search sender, amount or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-3.5 pl-11 pr-5 text-sm font-semibold text-gray-100 placeholder:text-gray-700 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all shadow-2xl"
            />
          </div>
        </div>

        {/* Categories / Tabs */}
        <div className="flex px-4 mt-2 gap-2">
          {(['bKash', 'Nagad', 'Others'] as Category[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[10px] font-black transition-all relative uppercase tracking-[0.25em] rounded-xl border ${
                activeTab === tab 
                  ? 'bg-accent/5 border-accent/30 text-white' 
                  : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-xl tab-active-glow opacity-50"
                  initial={false}
                />
              )}
            </button>
          ))}
        </div>

        {/* Android Setup Guidance */}
        <div className="mx-4 mt-2 mb-4 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-[20px]">
          <h5 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Android Setup Notice
          </h5>
          <p className="text-[9px] text-gray-500 mt-2 leading-relaxed">
            If blocked during install: Tap <span className="text-gray-300 font-bold">More details → Install anyway</span>. <br/>
            If permissions are denied: Go to <span className="text-gray-300 font-bold">App Info → (⋮) → Allow restricted settings</span>.
          </p>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar mt-4">
          {authError && (
            <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-[24px] mb-6 shadow-2xl">
              <h4 className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Connection Protocol Error
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                {authError}. <br/>
                <span className="text-gray-700 mt-3 block italic text-[10px] border-t border-white/5 pt-2">Please verify your environment variables and Firestore permissions.</span>
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-accent/5 border-t-accent rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-2 border-accent/0 border-b-accent/30 rounded-full animate-spin [animation-duration:1.5s]" />
              </div>
              <p className="mt-6 text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] animate-pulse">Syncing Vault</p>
              {showFallback && (
                <p className="mt-6 text-[9px] text-red-500/60 font-black uppercase tracking-widest max-w-[220px] text-center border border-red-500/10 px-4 py-2 rounded-lg">
                  Authentication Timeout
                </p>
              )}
            </div>
          ) : filteredMessages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center"
            >
              <div className="bg-[#0a0a0a] w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
                <MessageSquare className="w-8 h-8 text-gray-800" />
              </div>
              <h3 className="text-white font-black text-lg tracking-tight mb-2 italic">Zero Activity</h3>
              <p className="text-gray-600 text-[11px] max-w-[200px] mx-auto leading-relaxed font-bold uppercase tracking-widest">
                {searchQuery 
                  ? `No fragments found matching "${searchQuery}"`
                  : `Secured channels active. Waiting for incoming data...`}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-8 px-8 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-accent uppercase tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                >
                  Reset Path
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`premium-card p-6 rounded-[28px] group transition-all duration-500 active:scale-[0.98] ${
                    msg.category === 'bKash' ? 'glow-bkash' : 
                    msg.category === 'Nagad' ? 'glow-nagad' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500 ${
                        msg.category === 'bKash' ? 'bg-bkash' : 
                        msg.category === 'Nagad' ? 'bg-nagad' : 
                        'bg-gray-900'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/10" />
                        <span className="relative z-10">{msg.category.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg tracking-tight leading-tight group-hover:text-accent transition-colors">{msg.sender}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-lg">
                            {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/5 px-2.5 py-1 rounded-lg">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-5 rounded-[22px] mb-5 backdrop-blur-sm group-hover:border-white/10 transition-colors">
                    <p className="text-[15px] text-gray-300 leading-relaxed font-semibold italic">
                      {msg.body}
                    </p>
                  </div>
                  {msg.trxId && (
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-4 flex justify-between items-center group/trx ring-1 ring-white/5 group-hover:ring-accent/20 transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(236,72,153,1)]" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Transaction</span>
                      </div>
                      <span className="text-sm font-mono text-accent font-black tracking-wider">{msg.trxId}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Global Action Sync Footer */}
        <footer className="p-6 pb-8 bg-dark-bg border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <h5 className="text-[11px] font-black text-white uppercase tracking-widest italic">Terminal Active</h5>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Packet Monitoring Enabled</p>
            </div>
          </div>
          <div className="px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">Syncing</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
