import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mic, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  List, 
  MonitorPlay,
  LogOut,
  Megaphone,
  ClipboardList,
  Clock,
  Lock,
  Calendar,
  MapPin,
  ArrowRight,
  X,
  Home,
  Edit2,
  Save,
  RotateCcw,
  Wifi,
  Play, 
  Key 
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBJfXbDljpyTdnbWjbNzGfAQE4TgKvTQf4",
  authDomain: "sangkuriang-swimorg.firebaseapp.com",
  projectId: "sangkuriang-swimorg",
  storageBucket: "sangkuriang-swimorg.firebasestorage.app",
  messagingSenderId: "833562093721",
  appId: "1:833562093721:web:36308c9770eb8e94c37008"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID Aplikasi
const appId = 'sangkuriang-live-v1';

// --- TIPE DATA ---
type EventItem = {
  id: string;
  number: number;
  name: string;
  totalSeries: number;
};

type DQRecord = {
  id: string;
  eventNumber: number;
  series: number;
  lane: number;
  reason: string;
  timestamp: string;
  createdAt: number;
};

type AppState = {
  title: string;
  venue: string;
  currentEventId: string | null;
  currentSeries: number;
  callRoomEventId: string | null;
  callRoomSeries: number;
  lastUpdate: string; 
  callRoomLastUpdate: string; 
};

// --- SECURITY UTILS ---
const simpleHash = (str: string) => {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return hash.toString();
};

// Default Password (Admin: 20260214)
const DEFAULT_AUTH_DB = {
  admin: simpleHash("20260214"),      
  announcer: "1537282",     
  callroom: "1567098"       
};

// --- KOMPONEN UTAMA ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  
  // State Navigasi
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [role, setRole] = useState<'admin' | 'announcer' | 'callroom' | 'public' | null>(null);
  
  // Modal Login
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<'admin' | 'announcer' | 'callroom' | null>(null);

  // --- STATE DATA ---
  const [events, setEvents] = useState<EventItem[]>([]);
  const [dqs, setDqs] = useState<DQRecord[]>([]);
  const [appState, setAppState] = useState<AppState>({
    title: 'Loading...',
    venue: '',
    currentEventId: null,
    currentSeries: 1,
    callRoomEventId: null,
    callRoomSeries: 1,
    lastUpdate: '-',
    callRoomLastUpdate: '-'
  });
  
  const [authConfig, setAuthConfig] = useState<any>(DEFAULT_AUTH_DB);

  // --- 1. INITIALIZE AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Login Error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. DATA LISTENERS ---
  useEffect(() => {
    if (!user) return;

    // A. Listen EVENTS
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'events');
    const unsubEvents = onSnapshot(query(eventsRef), (snapshot) => {
      const loadedEvents: EventItem[] = [];
      snapshot.forEach((doc) => {
        loadedEvents.push({ id: doc.id, ...doc.data() } as EventItem);
      });
      loadedEvents.sort((a, b) => a.number - b.number);
      setEvents(loadedEvents);
    }, (error) => console.error("Error events:", error));

    // B. Listen STATUS
    const statusDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global');
    const unsubStatus = onSnapshot(statusDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppState(docSnap.data() as AppState);
      } else {
        const defaultState: AppState = {
            title: 'KEJUARAAN RENANG 2026',
            venue: 'Kolam Renang UPI, Bandung',
            currentEventId: null,
            currentSeries: 1,
            callRoomEventId: null,
            callRoomSeries: 1,
            lastUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            callRoomLastUpdate: '-'
        };
        setDoc(statusDocRef, defaultState);
      }
    }, (error) => console.error("Error status:", error));

    // C. Listen PIN CONFIG
    const authDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'auth', 'config');
    const unsubAuth = onSnapshot(authDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setAuthConfig(docSnap.data());
        } else {
            setDoc(authDocRef, DEFAULT_AUTH_DB);
        }
    });

    // D. Listen DQs
    const dqRef = collection(db, 'artifacts', appId, 'public', 'data', 'dqs');
    const unsubDqs = onSnapshot(query(dqRef), (snapshot) => {
      const loadedDqs: DQRecord[] = [];
      snapshot.forEach((doc) => {
        loadedDqs.push({ id: doc.id, ...doc.data() } as DQRecord);
      });
      loadedDqs.sort((a, b) => b.createdAt - a.createdAt);
      setDqs(loadedDqs);
    }, (error) => console.error("Error DQs:", error));

    return () => {
      unsubEvents();
      unsubStatus();
      unsubDqs();
      unsubAuth();
    };
  }, [user]);


  // --- FIRESTORE ACTIONS ---

  const updateGlobalState = async (newState: Partial<AppState>) => {
      if (!user) return;
      const statusDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global');
      await updateDoc(statusDocRef, {
          ...newState,
          lastUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      });
  };

  const updatePin = async (role: string, newPin: string) => {
      if (!user) return;
      const hashed = simpleHash(newPin);
      const authDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'auth', 'config');
      await updateDoc(authDocRef, {
          [role]: hashed
      });
  };

  const fbAddEvent = async (newItem: Omit<EventItem, 'id'>) => {
      if (!user) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), newItem);
  };

  const fbEditEvent = async (id: string, updatedData: Partial<EventItem>) => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), updatedData);
  };

  const fbDeleteEvent = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id));
      if (appState.currentEventId === id || appState.callRoomEventId === id) {
          const remainingEvents = events.filter(e => e.id !== id);
          const fallbackId = remainingEvents.length > 0 ? remainingEvents[0].id : null;
          await updateGlobalState({
             currentEventId: appState.currentEventId === id ? fallbackId : appState.currentEventId,
             callRoomEventId: appState.callRoomEventId === id ? fallbackId : appState.callRoomEventId,
             currentSeries: 1, 
             callRoomSeries: 1,
          });
      }
  };

  const fbAddDQ = async (newDQ: Omit<DQRecord, 'id'>) => {
      if (!user) return;
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), newDQ);
  };

  const fbDeleteDQ = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dqs', id));
  };

  // --- NAVIGATION LOGIC ---

  const handleStartSequence = async (type: 'announcer' | 'callroom') => {
      if (events.length === 0) return;
      const firstEventId = events[0].id; 
      if (type === 'announcer') {
          await updateGlobalState({ currentEventId: firstEventId, currentSeries: 1 });
      } else {
          await updateGlobalState({ callRoomEventId: firstEventId, callRoomSeries: 1, callRoomLastUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB' });
      }
  };

  const navigateLive = async (direction: 'next' | 'prev') => {
    const currentEventIndex = events.findIndex(e => e.id === appState.currentEventId);
    if (currentEventIndex === -1) return;
    let newSeries = appState.currentSeries;
    let newEventId = appState.currentEventId;
    if (direction === 'next') {
      if (newSeries < events[currentEventIndex].totalSeries) { newSeries++; } 
      else if (currentEventIndex < events.length - 1) { newEventId = events[currentEventIndex + 1].id; newSeries = 1; }
    } else {
      if (newSeries > 1) { newSeries--; } 
      else if (currentEventIndex > 0) { const prev = events[currentEventIndex - 1]; newEventId = prev.id; newSeries = prev.totalSeries; }
    }
    await updateGlobalState({ currentEventId: newEventId, currentSeries: newSeries });
  };

  const navigateCallRoom = async (direction: 'next' | 'prev') => {
    const currentEventIndex = events.findIndex(e => e.id === appState.callRoomEventId);
    if (currentEventIndex === -1) return;
    let newSeries = appState.callRoomSeries;
    let newEventId = appState.callRoomEventId;
    if (direction === 'next') {
      if (newSeries < events[currentEventIndex].totalSeries) { newSeries++; } 
      else if (currentEventIndex < events.length - 1) { newEventId = events[currentEventIndex + 1].id; newSeries = 1; }
    } else {
      if (newSeries > 1) { newSeries--; } 
      else if (currentEventIndex > 0) { const prev = events[currentEventIndex - 1]; newEventId = prev.id; newSeries = prev.totalSeries; }
    }
    await updateGlobalState({ callRoomEventId: newEventId, callRoomSeries: newSeries, callRoomLastUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB' });
  };

  // --- AUTH HANDLERS ---
  const handleEnterEvent = () => { setViewMode('app'); setRole('public'); };
  const handleOfficialLogin = () => { setViewMode('app'); setRole(null); };
  const handleLoginRequest = (r: any) => { setTargetLoginRole(r); setShowLoginModal(true); };

  // --- RENDER UTAMA ---
  if (!user) return <div className="h-screen flex items-center justify-center text-slate-500 font-sans">Menghubungkan ke Server...</div>;

  return (
    <>
      {showLoginModal && (
        <LoginModal 
          targetRole={targetLoginRole} 
          authConfig={authConfig}
          onClose={() => setShowLoginModal(false)}
          onSuccess={(role: any) => { setRole(role); setViewMode('app'); setShowLoginModal(false); }}
        />
      )}

      {viewMode === 'landing' ? (
        <LandingPage 
            onEnter={handleEnterEvent} 
            onOfficialLogin={handleOfficialLogin} 
            appState={appState} 
        />
      ) : (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {role === 'public' ? (
            <PublicPanel events={events} appState={appState} dqs={dqs} onBack={() => setViewMode('landing')} onLoginRequest={() => setRole(null)} />
          ) : !role ? (
            <RoleSelectionPanel onBack={() => setViewMode('landing')} onLoginRequest={handleLoginRequest} />
          ) : (
            <div className="flex flex-col min-h-screen">
              <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
                  <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {role === 'admin' && <Settings className="text-blue-400" />}
                      {role === 'announcer' && <Mic className="text-purple-400" />}
                      {role === 'callroom' && <Users className="text-emerald-400" />}
                      <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-wide uppercase leading-none">
                            {role === 'admin' ? 'Admin' : role === 'announcer' ? 'Announcer' : 'Call Room'}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Wifi size={10} /> ONLINE</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setRole(null); setViewMode('landing'); }} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full flex items-center gap-1 transition">
                        <Home size={12} /> Home
                      </button>
                      <button onClick={() => setRole(null)} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition">
                        <LogOut size={12} /> Logout
                      </button>
                    </div>
                  </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
                  {role === 'admin' && (
                    <AdminPanel 
                      events={events} appState={appState} dqs={dqs} 
                      onAddEvent={fbAddEvent} onEditEvent={fbEditEvent} onDeleteEvent={fbDeleteEvent}
                      onUpdateSettings={updateGlobalState} onAddDQ={fbAddDQ} onDeleteDQ={fbDeleteDQ}
                      onUpdatePin={updatePin} 
                    />
                  )}
                  {role === 'announcer' && (
                    <AnnouncerPanel 
                      events={events} appState={appState} 
                      navigate={navigateLive} onStart={() => handleStartSequence('announcer')} dqs={dqs}
                    />
                  )}
                  {role === 'callroom' && (
                    <CallRoomPanel 
                      events={events} appState={appState} 
                      navigate={navigateCallRoom} onStart={() => handleStartSequence('callroom')}
                    />
                  )}
                </main>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// --- SUB-COMPONENTS ---

function LandingPage({ onEnter, onOfficialLogin, appState }: any) {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">S</div>
            SANGKURIANG <span className="text-blue-400">SWIM</span>
          </div>
          <button onClick={onOfficialLogin} className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1">
            <Lock size={14} /> Official Login
          </button>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400">Event Management</h1>
        <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-8">Platform manajemen lomba renang real-time.</p>
        <div className="max-w-md mx-auto group bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full animate-pulse">LIVE NOW</span>
              <Calendar className="text-slate-500" size={20} />
            </div>
            <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition">{appState.title}</h3>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6"><MapPin size={16} /> {appState.venue || 'Venue TBD'}</div>
            <button onClick={onEnter} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition active:scale-95">Lihat Live Score <ArrowRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function RoleSelectionPanel({ onBack, onLoginRequest }: any) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-4xl w-full relative">
            <button onClick={onBack} className="absolute -top-16 left-0 bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Home size={18} /> Kembali ke Beranda</button>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white">Login Petugas</h2>
                <p className="text-slate-400 text-sm">Silakan pilih peran tugas Anda</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
                {['admin', 'announcer', 'callroom'].map(r => (
                    <button key={r} onClick={() => onLoginRequest(r)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-center capitalize font-bold text-white text-lg transition transform hover:scale-105">
                        {r === 'admin' ? <Settings size={32} className="mx-auto mb-2 text-blue-500"/> : r === 'announcer' ? <Mic size={32} className="mx-auto mb-2 text-purple-500"/> : <Users size={32} className="mx-auto mb-2 text-emerald-500"/>}
                        {r}
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
}

function LoginModal({ targetRole, onClose, onSuccess, authConfig }: any) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      const h = simpleHash(pin); 
      if (h === authConfig[targetRole]) onSuccess(targetRole); 
      else { setError(true); setPin(''); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900 capitalize">Akses {targetRole}</h2>
        <form onSubmit={handleSubmit}>
          <input autoFocus type="password" value={pin} onChange={e=>{setPin(e.target.value);setError(false)}} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 focus:ring-4 focus:ring-blue-100 outline-none" placeholder="PIN" />
          {error && <p className="text-red-500 text-center mb-4 font-bold">PIN Salah!</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Masuk</button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ events, appState, dqs, onAddEvent, onEditEvent, onDeleteEvent, onUpdateSettings, onAddDQ, onDeleteDQ, onUpdatePin }: any) {
  const [newEvent, setNewEvent] = useState({ number: '', name: '', totalSeries: '' });
  const [newDQ, setNewDQ] = useState({ eventNumber: '', series: '', lane: '', reason: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ number: '', name: '', totalSeries: '' });
  
  const [pinRole, setPinRole] = useState('announcer');
  const [newPinCode, setNewPinCode] = useState('');

  const handleAddEvent = (e: React.FormEvent) => { e.preventDefault(); if(!newEvent.number) return; onAddEvent({ number: parseInt(newEvent.number), name: newEvent.name, totalSeries: parseInt(newEvent.totalSeries) }); setNewEvent({ number: '', name: '', totalSeries: '' }); };
  const handleAddDQ = (e: React.FormEvent) => { e.preventDefault(); onAddDQ({ eventNumber: parseInt(newDQ.eventNumber), series: parseInt(newDQ.series), lane: parseInt(newDQ.lane), reason: newDQ.reason, timestamp: new Date().toLocaleTimeString(), createdAt: Date.now() }); setNewDQ({ eventNumber: '', series: '', lane: '', reason: '' }); };
  const saveEdit = () => { if(!editingId) return; onEditEvent(editingId, { number: parseInt(editForm.number), name: editForm.name, totalSeries: parseInt(editForm.totalSeries) }); setEditingId(null); };
  
  const handleChangePin = (e: React.FormEvent) => {
      e.preventDefault();
      if(newPinCode.length < 4) return alert("PIN minimal 4 angka");
      onUpdatePin(pinRole, newPinCode);
      alert(`PIN untuk ${pinRole} berhasil diubah!`);
      setNewPinCode('');
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"><Settings className="text-blue-600"/> Pengaturan</h2>
          <div className="space-y-3">
             <input type="text" value={appState.title} onChange={(e) => onUpdateSettings({ title: e.target.value })} className="w-full p-2 border border-slate-300 rounded" placeholder="Nama Kejuaraan" />
             <input type="text" value={appState.venue} onChange={(e) => onUpdateSettings({ venue: e.target.value })} className="w-full p-2 border border-slate-300 rounded" placeholder="Venue" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
             <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-3"><Key size={16} /> Ganti PIN Petugas</h3>
             <form onSubmit={handleChangePin} className="flex gap-2">
                 <select value={pinRole} onChange={e => setPinRole(e.target.value)} className="p-2 border rounded bg-slate-50 text-sm">
                     <option value="admin">Admin</option>
                     <option value="announcer">Announcer</option>
                     <option value="callroom">Call Room</option>
                 </select>
                 <input type="text" value={newPinCode} onChange={e => setNewPinCode(e.target.value)} placeholder="PIN Baru" className="flex-1 p-2 border rounded text-sm" pattern="\d*" />
                 <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold hover:bg-slate-700">SIMPAN</button>
             </form>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2"><List className="text-blue-600"/> Events</h2>
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
            <input type="number" placeholder="No" value={newEvent.number} onChange={e => setNewEvent({...newEvent, number: e.target.value})} className="w-16 p-2 border rounded" />
            <input type="text" placeholder="Nama Acara" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="flex-1 p-2 border rounded" />
            <input type="number" placeholder="Seri" value={newEvent.totalSeries} onChange={e => setNewEvent({...newEvent, totalSeries: e.target.value})} className="w-16 p-2 border rounded" />
            <button className="bg-blue-600 text-white p-2 rounded"><Plus/></button>
          </form>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <tbody>
                {events.map((ev: any) => (
                  <tr key={ev.id} className="border-b hover:bg-slate-50">
                    {editingId === ev.id ? (
                      <>
                        <td className="p-2"><input type="number" value={editForm.number} onChange={e => setEditForm({...editForm, number: e.target.value})} className="w-full border rounded" /></td>
                        <td className="p-2"><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded" /></td>
                        <td className="p-2"><input type="number" value={editForm.totalSeries} onChange={e => setEditForm({...editForm, totalSeries: e.target.value})} className="w-full border rounded" /></td>
                        <td className="p-2 flex gap-1"><button onClick={saveEdit} className="text-green-600"><Save size={16}/></button><button onClick={() => setEditingId(null)} className="text-slate-500"><RotateCcw size={16}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-bold">{ev.number}</td>
                        <td className="p-2">{ev.name}</td>
                        <td className="p-2 text-center bg-slate-100 rounded">{ev.totalSeries}</td>
                        <td className="p-2 text-right">
                          <button onClick={() => { setEditingId(ev.id); setEditForm({ number: ev.number, name: ev.name, totalSeries: ev.totalSeries }); }} className="mr-2 text-blue-500"><Edit2 size={16}/></button>
                          <button onClick={() => { if(confirm('Hapus?')) onDeleteEvent(ev.id); }} className="text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center gap-2"><AlertOctagon /> Diskualifikasi</h2>
          <form onSubmit={handleAddDQ} className="bg-red-50 p-4 rounded mb-4">
            <div className="flex gap-2 mb-2">
              <input required type="number" placeholder="Acara" value={newDQ.eventNumber} onChange={e => setNewDQ({...newDQ, eventNumber: e.target.value})} className="w-1/3 p-2 border rounded" />
              <input required type="number" placeholder="Seri" value={newDQ.series} onChange={e => setNewDQ({...newDQ, series: e.target.value})} className="w-1/3 p-2 border rounded" />
              <input required type="number" placeholder="Lin" value={newDQ.lane} onChange={e => setNewDQ({...newDQ, lane: e.target.value})} className="w-1/3 p-2 border rounded" />
            </div>
            <input required type="text" placeholder="Alasan" value={newDQ.reason} onChange={e => setNewDQ({...newDQ, reason: e.target.value})} className="w-full p-2 border rounded mb-2" />
            <button className="w-full bg-red-600 text-white font-bold py-2 rounded">SUBMIT DQ</button>
          </form>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {dqs.map((dq: any) => (
              <div key={dq.id} className="p-2 border rounded flex justify-between items-center text-sm">
                <div><span className="font-bold text-red-600">#{dq.eventNumber}</span> S:{dq.series} L:{dq.lane} - {dq.reason}</div>
                <button onClick={() => onDeleteDQ(dq.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

function AnnouncerPanel({ events, appState, navigate, onStart, dqs }: any) {
  const activeEvent = events.find((e: any) => e.id === appState.currentEventId);
  const needsStart = !activeEvent && events.length > 0;
  const activeEventIndex = events.findIndex((e: any) => e.id === appState.currentEventId);
  const callRoomEventIndex = events.findIndex((e: any) => e.id === appState.callRoomEventId);
  let canGoNext = true; let blockReason = "";

  if (activeEventIndex > -1 && callRoomEventIndex > -1) {
    if (activeEventIndex > callRoomEventIndex) { canGoNext = false; blockReason = "Menunggu Call Room (Event Belum Siap)"; } 
    else if (activeEventIndex === callRoomEventIndex && appState.currentSeries >= appState.callRoomSeries) { canGoNext = false; blockReason = "Menunggu Call Room"; }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-800">
        <div className="bg-black p-2 text-center text-yellow-400 font-mono text-sm tracking-widest uppercase border-b border-slate-800">Live Timing Display</div>
        <div className="p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
            {needsStart ? (
                <div className="animate-in fade-in zoom-in">
                    <p className="text-slate-400 mb-4">Data Acara Tersedia. Siap Memulai.</p>
                    <button onClick={onStart} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> MULAI ACARA PERTAMA</button>
                </div>
            ) : activeEvent ? (
              <>
                <div className="text-blue-400 text-2xl font-bold uppercase tracking-widest mb-2">Acara {activeEvent.number}</div>
                <h1 className="text-5xl font-extrabold text-white mb-8 leading-tight">{activeEvent.name}</h1>
                <div className="inline-flex items-center justify-center bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <div className="text-center px-8 border-r border-slate-600"><span className="block text-slate-400 text-sm uppercase mb-1">Seri</span><span className="block text-6xl font-black text-emerald-400">{appState.currentSeries}</span></div>
                  <div className="text-center px-8"><span className="block text-slate-400 text-sm uppercase mb-1">Total</span><span className="block text-6xl font-black text-slate-500">{activeEvent.totalSeries}</span></div>
                </div>
              </>
            ) : <div className="text-slate-500 italic">Tidak ada data acara. Hubungi Admin.</div>}
        </div>
        {!needsStart && activeEvent && (
            <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center">
                <button onClick={() => navigate('prev')} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300"><ChevronLeft /> PREV</button>
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Megaphone size={16} /> Announcer Control</div>
                <div>{canGoNext ? <button onClick={() => navigate('next')} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition">NEXT <ChevronRight /></button> : <button disabled className="flex items-center gap-2 px-8 py-3 bg-slate-600 text-slate-400 rounded-lg font-bold cursor-not-allowed border border-yellow-500/30"><Lock size={16} /> {blockReason}</button>}</div>
            </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow p-6 border border-l-4 border-l-red-500">
         <h3 className="font-bold text-slate-700 mb-2 flex gap-2"><AlertOctagon className="text-red-500"/> Info DQ</h3>
         {dqs.length===0 ? <p className="text-slate-400 text-sm">Nihil.</p> : dqs.slice(0,3).map((d:any)=><div key={d.id} className="text-sm border-b py-1">#{d.eventNumber} S:{d.series} L:{d.lane} ({d.reason})</div>)}
      </div>
    </div>
  );
}

function CallRoomPanel({ events, appState, navigate, onStart }: any) {
  const currentCallEvent = events.find((e: any) => e.id === appState.callRoomEventId);
  const nextEvent = events[events.findIndex((e: any) => e.id === appState.callRoomEventId) + 1];
  const needsStart = !currentCallEvent && events.length > 0;

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-600 text-white p-4 flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ClipboardList /> STATUS PEMANGGILAN</h2><span className="bg-emerald-800 text-xs px-2 py-1 rounded">LIVE CONTROL</span></div>
            <div className="p-12 text-center min-h-[300px] flex flex-col justify-center items-center bg-emerald-50">
              {needsStart ? (
                 <div className="animate-in fade-in zoom-in">
                    <p className="text-emerald-700 mb-4 font-medium">Database Baru Terdeteksi.</p>
                    <button onClick={onStart} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> INISIALISASI CALL ROOM</button>
                </div>
              ) : currentCallEvent ? (
                <>
                  <div className="text-emerald-700 font-bold tracking-widest uppercase mb-1">Sedang Memanggil</div>
                  <h1 className="text-3xl font-extrabold text-slate-800 mb-4">{currentCallEvent.number}. {currentCallEvent.name}</h1>
                  <div className="inline-block bg-white shadow-sm border border-emerald-200 rounded-lg p-6 mb-8"><span className="text-6xl font-black text-emerald-600">{appState.callRoomSeries}</span><span className="text-sm text-slate-400 block uppercase mt-2">Dari {currentCallEvent.totalSeries} Seri</span></div>
                  <div className="flex gap-4 justify-center"><button onClick={() => navigate('prev')} className="px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition">Prev</button><button onClick={() => navigate('next')} className="px-10 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2">PANGGIL NEXT <ChevronRight size={20} /></button></div>
                </>
              ) : <div className="text-slate-400 italic">Menunggu Data...</div>}
            </div>
          </div>
        </div>
        <div className="md:col-span-1 space-y-4">
           <div className="bg-slate-800 text-white p-5 rounded-xl shadow-md"><h3 className="text-slate-400 text-xs uppercase font-bold mb-2">Sedang Berlangsung</h3><div className="text-2xl font-bold text-yellow-400">Event {events.find((e:any) => e.id === appState.currentEventId)?.number || '-'}</div><div className="text-lg">Seri {appState.currentSeries}</div></div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><h3 className="text-slate-400 text-xs uppercase font-bold mb-3">Event Selanjutnya</h3>{nextEvent ? <div><div className="font-bold text-slate-800">{nextEvent.number}. {nextEvent.name}</div><div className="text-sm text-slate-500 mt-1">{nextEvent.totalSeries} Seri</div></div> : <div className="text-slate-400 text-sm italic">Tidak ada event selanjutnya.</div>}</div>
        </div>
    </div>
  );
}

function PublicPanel({ events, appState, dqs, onBack, onLoginRequest }: any) {
    const getEventNumber = (id: string | null) => events.find((e: any) => e.id === id)?.number || '-';
    const getEventName = (id: string | null) => events.find((e: any) => e.id === id)?.name || 'Menunggu...';
    const recentDQs = dqs.slice(0, 5);

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            <button onClick={onBack} className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur text-white px-3 py-1 rounded-full text-xs hover:bg-white/20 transition border border-white/20">&larr; Home</button>
            <button onClick={onLoginRequest} className="absolute top-4 right-4 z-50 text-white/30 hover:text-white transition"><Settings size={20} /></button>
            <div className="flex flex-col md:flex-row h-[65%] w-full">
                <div className="h-1/2 md:h-full md:w-1/2 bg-slate-900 relative flex flex-col justify-center px-6 md:px-12 border-b md:border-b-0 md:border-r border-slate-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 z-0"></div>
                    <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="flex justify-between items-start mb-6"><div><h2 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-2"><Users className="text-blue-400" /> Pemanggilan</h2><span className="text-blue-200/60 text-sm">Call Room</span></div><div className="text-right"><span className="text-blue-200/40 text-[10px] uppercase block">Terakhir Update</span><span className="text-white text-lg font-mono font-bold flex items-center gap-2"><Clock size={16} className="text-blue-400" /> {appState.callRoomLastUpdate || '-'}</span></div></div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center"><div className="text-blue-200 text-sm uppercase mb-1">Acara</div><div className="text-white text-6xl md:text-8xl font-bold">{getEventNumber(appState.callRoomEventId)}</div></div>
                             <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center"><div className="text-blue-200 text-sm uppercase mb-1">Seri</div><div className="text-white text-6xl md:text-8xl font-bold">{appState.callRoomSeries}</div></div>
                        </div>
                        <p className="text-center text-blue-200/50 mt-4 text-sm md:text-base truncate">{getEventName(appState.callRoomEventId)}</p>
                    </div>
                </div>
                <div className="h-1/2 md:h-full md:w-1/2 bg-white relative flex flex-col justify-center px-6 md:px-12">
                     <div className="relative z-10 w-full max-w-lg mx-auto">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-slate-800 text-2xl md:text-3xl font-bold flex items-center gap-2"><MonitorPlay className="text-red-500" /> Sedang Berlomba</h2><span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded animate-pulse">LIVE</span></div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner"><div className="text-slate-400 text-sm uppercase mb-1">Acara</div><div className="text-slate-800 text-6xl md:text-8xl font-bold">{getEventNumber(appState.currentEventId)}</div></div>
                             <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner"><div className="text-slate-400 text-sm uppercase mb-1">Seri</div><div className="text-slate-800 text-6xl md:text-8xl font-bold">{appState.currentSeries}</div></div>
                        </div>
                        <p className="text-center text-slate-500 mt-4 text-sm md:text-base truncate">{getEventName(appState.currentEventId)}</p>
                    </div>
                </div>
            </div>
            <div className="h-[35%] bg-slate-100 border-t border-slate-200 p-4 md:p-6 overflow-hidden flex flex-col">
                <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                    <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2"><AlertOctagon size={20} className="text-red-500" /> INFORMASI DISKUALIFIKASI TERKINI</h3>
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 bg-slate-800 text-white text-xs md:text-sm font-bold uppercase py-3 px-4"><div className="col-span-2">No. Acara</div><div className="col-span-2 text-center">Seri</div><div className="col-span-2 text-center">Lintasan</div><div className="col-span-6">Keterangan / Alasan</div></div>
                        <div className="overflow-y-auto flex-1 p-0">{recentDQs.length === 0 ? <div className="h-full flex items-center justify-center text-slate-400 italic">Tidak ada informasi diskualifikasi saat ini.</div> : recentDQs.map((dq: any, idx: number) => (<div key={dq.id} className={`grid grid-cols-12 text-sm py-3 px-4 border-b border-slate-100 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}><div className="col-span-2 font-bold text-slate-800">{dq.eventNumber}</div><div className="col-span-2 text-center text-slate-600">{dq.series}</div><div className="col-span-2 text-center"><span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">{dq.lane}</span></div><div className="col-span-6 text-red-600 font-medium">{dq.reason}</div></div>))}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}