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
  Smartphone as NagadIcon, 
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
    <div className="min-h-screen bg-dark-bg text-gray-200 font-sans flex flex-col items-center py-8">
      {/* App Container Like Structure */}
      <div className="w-full max-w-md bg-dark-surface rounded-[32px] border-8 border-dark-border shadow-2xl flex flex-col overflow-hidden min-h-[800px]">
        {/* Header */}
        <header className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl text-white tracking-tight">TX Organiser</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-emerald-500 font-medium uppercase tracking-wider">Cloud Synced</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-gray-500 bg-dark-card border border-dark-border px-2 py-1 rounded-lg">
            {user?.uid.slice(0, 8)}
          </div>
        </header>
        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-accent transition-colors" />
            <input 
              type="text"
              placeholder="Search sender, body, or TrxID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-accent/50 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Filters / Tabs */}
        <div className="flex border-b border-dark-border px-2">
          {(['bKash', 'Nagad', 'Others'] as Category[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                activeTab === tab 
                  ? 'text-accent' 
                  : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Auth Error Overlay */}
        {authError && (
          <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h4 className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">Setup Required</h4>
            <p className="text-[11px] text-red-400 leading-relaxed font-medium">
              {authError}
            </p>
          </div>
        )}

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32">
              <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">Fetching Updates</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="py-32 text-center">
              <div className="bg-dark-card w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-dark-border">
                <Search className="w-8 h-8 text-dark-border" />
              </div>
              <h3 className="text-white font-bold mb-1">
                {searchQuery ? 'No Matches' : 'Queue Empty'}
              </h3>
              <p className="text-gray-500 text-xs max-w-[200px] mx-auto leading-relaxed">
                {searchQuery 
                  ? `No transactions in ${activeTab} match "${searchQuery}"`
                  : `Send a test ${activeTab} SMS to your linked device to populate.`}
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-[10px] font-bold text-accent uppercase tracking-widest hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-dark-card p-4 rounded-xl border border-dark-border group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        msg.category === 'bKash' ? 'bg-bkash' : 
                        msg.category === 'Nagad' ? 'bg-nagad' : 
                        'bg-gray-600'
                      }`}>
                        {msg.category.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white leading-none mb-1">{msg.sender}</h4>
                        <span className="text-[10px] font-medium text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed mb-4">
                    {msg.body}
                  </p>
                  {msg.trxId && (
                    <div className="bg-accent/5 border border-dashed border-accent/40 rounded-lg p-2.5 flex justify-between items-center">
                      <span className="text-[9px] font-black text-accent uppercase tracking-[0.1em]">TrxID</span>
                      <span className="text-xs font-mono text-gray-200 font-bold">{msg.trxId}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Info/CTA Section */}
        <div className="p-4 bg-dark-card/50 border-t border-dark-border">
          <div className="flex items-center gap-3 bg-dark-bg p-3 rounded-xl border border-dark-border">
            <div className="bg-accent p-1.5 rounded-lg">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">Device Sync Enabled</h5>
              <p className="text-[10px] text-gray-500">Listening for transaction threads...</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] max-w-xs text-center leading-loose">
        Android Source: /android/app <br/>
        Firebase ID: taka-income-korbo
      </p>
    </div>
  );
}
