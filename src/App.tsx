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
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-8 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-sm">
          <h2 className="text-red-500 font-bold mb-2">Technical Error</h2>
          <p className="text-gray-400 text-sm">{criticalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-dark-bg text-gray-200 font-sans overflow-hidden">
      {/* Header */}
      <header className="p-5 pb-4 flex items-center justify-between border-b border-dark-border bg-dark-surface/50 backdrop-blur-md z-10">
        <div>
          <h1 className="font-bold text-xl text-white tracking-tight">TX Organiser</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Live Sync</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[9px] font-mono text-gray-500 bg-dark-card border border-dark-border px-2 py-0.5 rounded-md">
            {user?.uid?.slice(0, 8) || 'Init...'}
          </div>
          {authError && <span className="text-[9px] text-red-500 font-bold uppercase">Config Error</span>}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 bg-dark-bg">
        {/* Search Bar */}
        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search bKash, Nagad, or TrxID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-accent/40 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Categories / Tabs */}
        <div className="flex px-2 border-b border-dark-border/50">
          {(['bKash', 'Nagad', 'Others'] as Category[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab 
                  ? 'text-accent' 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          ))}
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {authError && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl mb-4">
              <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">Connection Issue</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {authError}. <br/>
                <span className="text-gray-600 mt-2 block italic text-[10px]">Please verify your Firestore and Authentication settings.</span>
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="w-8 h-8 border-3 border-accent/10 border-t-accent rounded-full animate-spin mb-4" />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing Database</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <div className="bg-dark-surface w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-dark-border">
                <MessageSquare className="w-8 h-8 text-dark-border" />
              </div>
              <h3 className="text-white font-bold mb-2">No Transactions</h3>
              <p className="text-gray-500 text-xs max-w-[200px] mx-auto leading-relaxed">
                {searchQuery 
                  ? `None of your ${activeTab} messages match "${searchQuery}"`
                  : `Waiting for ${activeTab} transaction SMS notifications.`}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 px-6 py-2 bg-dark-card border border-dark-border rounded-full text-[10px] font-bold text-accent uppercase tracking-widest hover:bg-dark-surface transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-dark-card p-5 rounded-2xl border border-dark-border shadow-sm active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg ${
                        msg.category === 'bKash' ? 'bg-bkash' : 
                        msg.category === 'Nagad' ? 'bg-nagad' : 
                        'bg-gray-700'
                      }`}>
                        {msg.category.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight">{msg.sender}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                            {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="w-1 h-1 bg-gray-700 rounded-full" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[14px] text-gray-400 leading-relaxed mb-4">
                    {msg.body}
                  </p>
                  {msg.trxId && (
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-3 flex justify-between items-center group/trx">
                      <span className="text-[9px] font-black text-accent uppercase tracking-widest opacity-80">Ref ID</span>
                      <span className="text-xs font-mono text-gray-300 font-bold group-hover/trx:text-white transition-colors">{msg.trxId}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Persistent Footer Sync Info */}
      <footer className="p-4 bg-dark-surface/80 backdrop-blur-lg border-t border-dark-border flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-col">
            <h5 className="text-[10px] font-bold text-white uppercase tracking-wider">Device Endpoint</h5>
            <p className="text-[9px] text-gray-500 font-medium">Monitoring SMS threads...</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-[9px] font-black text-accent uppercase tracking-widest">Active</p>
        </div>
      </footer>
    </div>
  );
}
