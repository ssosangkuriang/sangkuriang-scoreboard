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
  Key,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'sangkuriang-live-v1';

// --- UTILS ---
const getWIBTime = () => {
  return new Date().toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  }) + ' WIB';
};

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

const DEFAULT_AUTH_DB = {
  admin: simpleHash("20260214"),      
  announcer: "1537282",     
  callroom: "1567098"       
};

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
  currentEventNumber?: number; 
  currentEventName?: string;   
  currentEventTotalSeries?: number;
  currentSeries: number;
  callRoomEventId: string | null;
  callRoomEventNumber?: number;
  callRoomEventName?: string;
  callRoomEventTotalSeries?: number;
  callRoomSeries: number;
  lastUpdate: string; 
  callRoomLastUpdate: string; 
};

// --- KOMPONEN UTAMA ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');
  const [role, setRole] = useState<'admin' | 'announcer' | 'callroom' | 'public' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<'admin' | 'announcer' | 'callroom' | null>(null);

  // Data State
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

  // Auth
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Login gagal:", err));
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const unsubStatus = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global'), (docSnap) => {
      if (docSnap.exists()) setAppState(docSnap.data() as AppState);
      else setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global'), appState);
    });

    const unsubDqs = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'dqs')), (snapshot) => {
      setDqs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DQRecord)).sort((a, b) => b.createdAt - a.createdAt));
    });

    let unsubEvents = () => {};
    let unsubAuth = () => {};

    if (role && role !== 'public') {
        unsubEvents = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'events')), (snapshot) => {
            setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)).sort((a, b) => a.number - b.number));
        });
        unsubAuth = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'auth', 'config'), (docSnap) => {
            if (docSnap.exists()) setAuthConfig(docSnap.data());
            else setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'auth', 'config'), DEFAULT_AUTH_DB);
        });
    }

    return () => { unsubStatus(); unsubDqs(); unsubEvents(); unsubAuth(); };
  }, [user, role]);

  // Actions
  const updateGlobalState = async (newState: Partial<AppState>) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global'), {
      ...newState,
      lastUpdate: getWIBTime() 
    });
  };

  const fbAddEvent = async (newItem: Omit<EventItem, 'id'>) => { if (!user) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), newItem); };
  const fbEditEvent = async (id: string, updatedData: Partial<EventItem>) => { if (!user) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), updatedData); };
  const fbDeleteEvent = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); };
  
  const fbResetProgress = async () => {
      if (!user) return;
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'status', 'global'), {
          currentEventId: null, currentEventName: null, currentEventNumber: null, currentSeries: 1,
          callRoomEventId: null, callRoomEventName: null, callRoomEventNumber: null, callRoomSeries: 1,
          lastUpdate: '-', callRoomLastUpdate: '-'
      });
  };

  const fbAddDQ = async (newDQ: Omit<DQRecord, 'id'>) => { if (!user) return; await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), newDQ); };
  const fbDeleteDQ = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dqs', id)); };
  const fbUpdatePin = async (r: string, p: string) => { if(!user) return; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'auth', 'config'), { [r]: simpleHash(p) }); };

  const handleStartSequence = async (type: 'announcer' | 'callroom') => {
      if (events.length === 0) return;
      const first = events[0]; 
      const updateData = {
          [`${type === 'announcer' ? 'current' : 'callRoom'}EventId`]: first.id,
          [`${type === 'announcer' ? 'current' : 'callRoom'}EventName`]: first.name,
          [`${type === 'announcer' ? 'current' : 'callRoom'}EventNumber`]: first.number,
          [`${type === 'announcer' ? 'current' : 'callRoom'}EventTotalSeries`]: first.totalSeries,
          [`${type === 'announcer' ? 'current' : 'callRoom'}Series`]: 1,
      };
      if (type === 'callroom') updateData['callRoomLastUpdate'] = getWIBTime();
      await updateGlobalState(updateData);
  };

  const navigate = async (type: 'current' | 'callRoom', direction: 'next' | 'prev') => {
      const idKey = type === 'current' ? 'currentEventId' : 'callRoomEventId';
      const seriesKey = type === 'current' ? 'currentSeries' : 'callRoomSeries';
      const currentId = appState[idKey];
      const idx = events.findIndex(e => e.id === currentId);
      if (idx === -1) return;

      let nextSeries = appState[seriesKey];
      let targetEvent = events[idx];

      if (direction === 'next') {
          if (nextSeries < targetEvent.totalSeries) {
              nextSeries++;
          } else if (idx < events.length - 1) {
              targetEvent = events[idx + 1];
              nextSeries = 1;
          }
      } else {
          if (nextSeries > 1) {
              nextSeries--;
          } else if (idx > 0) {
              targetEvent = events[idx - 1];
              nextSeries = targetEvent.totalSeries;
          }
      }

      const updateData = {
          [idKey]: targetEvent.id,
          [`${type}EventName`]: targetEvent.name,
          [`${type}EventNumber`]: targetEvent.number,
          [`${type}EventTotalSeries`]: targetEvent.totalSeries,
          [seriesKey]: nextSeries
      };
      if (type === 'callRoom') updateData['callRoomLastUpdate'] = getWIBTime();
      await updateGlobalState(updateData);
  };

  if (!user) return <div className="h-screen flex items-center justify-center text-slate-500 font-sans gap-2"><Loader2 className="animate-spin"/> Menghubungkan...</div>;

  return (
    <>
      {showLoginModal && (
        <LoginModal 
          targetRole={targetLoginRole} authConfig={authConfig}
          onClose={() => setShowLoginModal(false)}
          onSuccess={(r: any) => { setRole(r); setViewMode('app'); setShowLoginModal(false); }}
        />
      )}

      {viewMode === 'landing' ? (
        <LandingPage onEnter={() => {setViewMode('app'); setRole('public');}} onOfficialLogin={() => {setViewMode('app'); setRole(null);}} appState={appState} />
      ) : (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {role === 'public' ? (
            <PublicPanel appState={appState} dqs={dqs} onBack={() => setViewMode('landing')} onLoginRequest={() => setRole(null)} />
          ) : !role ? (
            <RoleSelectionPanel onBack={() => setViewMode('landing')} onLoginRequest={(r:any) => {setTargetLoginRole(r); setShowLoginModal(true);}} />
          ) : (
            <div className="flex flex-col min-h-screen">
               <Header role={role} title={appState.title} venue={appState.venue} onHome={()=>{setRole(null); setViewMode('landing')}} onLogout={()=>setRole(null)} />
               <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
                  {role === 'admin' && <AdminPanel events={events} appState={appState} dqs={dqs} onAddEvent={fbAddEvent} onEditEvent={fbEditEvent} onDeleteEvent={fbDeleteEvent} onUpdateSettings={updateGlobalState} onAddDQ={fbAddDQ} onDeleteDQ={fbDeleteDQ} onUpdatePin={fbUpdatePin} onResetProgress={fbResetProgress} />}
                  {role === 'announcer' && <AnnouncerPanel events={events} appState={appState} navigate={(dir: any) => navigate('current', dir)} onStart={() => handleStartSequence('announcer')} dqs={dqs} />}
                  {role === 'callroom' && <CallRoomPanel events={events} appState={appState} navigate={(dir: any) => navigate('callRoom', dir)} onStart={() => handleStartSequence('callroom')} />}
               </main>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// --- SUB-COMPONENTS ---

const Header = ({ role, title, venue, onHome, onLogout }: any) => (
  <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        {role === 'admin' && <Settings className="text-blue-400" />}
        {role === 'announcer' && <Mic className="text-purple-400" />}
        {role === 'callroom' && <Users className="text-emerald-400" />}
        <div>
          <span className="font-bold text-lg uppercase leading-none block">{role}</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Wifi size={10} /> ONLINE</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
         <div className="hidden md:block text-right mr-2">
            <div className="text-xs font-bold text-slate-300">{title}</div>
            <div className="text-[10px] text-slate-500">{venue}</div>
         </div>
         <button onClick={onHome} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition"><Home size={16} /></button>
         <button onClick={onLogout} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition"><LogOut size={16} /></button>
      </div>
    </div>
  </header>
);

function LandingPage({ onEnter, onOfficialLogin, appState }: any) {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
      
      {/* HEADER Landing Page dengan Logo */}
      <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             {/* Menggunakan %20 untuk spasi agar aman */}
             <img src="/sangkuriang%201.png" alt="Logo SSO" className="h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
             <div className="font-bold text-xl leading-tight">
               <div>SANGKURIANG</div>
               <div className="text-blue-400 text-sm tracking-widest">SWIM ORGANIZER</div>
             </div>
          </div>
          <button onClick={onOfficialLogin} className="text-sm text-slate-400 hover:text-white flex gap-1 items-center"><Lock size={14}/> Login</button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-6 z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Event Management</h1>
        <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">Real-time scoreboard & race management system.</p>
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full hover:border-blue-500 transition-colors">
            <div className="flex justify-between mb-4"><span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded font-bold animate-pulse">LIVE NOW</span><Calendar size={16} className="text-slate-500"/></div>
            <h3 className="text-xl font-bold mb-1">{appState.title}</h3>
            <div className="text-sm text-slate-400 mb-6 flex items-center justify-center gap-1"><MapPin size={12}/> {appState.venue || 'Venue TBD'}</div>
            <button onClick={onEnter} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition active:scale-95">Lihat Scoreboard <ArrowRight size={18}/></button>
        </div>
      </div>

      {/* FOOTER Landing Page */}
      <footer className="bg-slate-950 text-slate-600 py-4 text-center text-xs border-t border-slate-800 z-10 relative">
         &copy; anak magang SSO 2026
      </footer>
    </div>
  );
}

function RoleSelectionPanel({ onBack, onLoginRequest }: any) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
            <button onClick={onBack} className="mb-8 text-slate-400 hover:text-white flex gap-2 items-center"><ChevronLeft size={20}/> Kembali</button>
            <h2 className="text-2xl font-bold text-white text-center mb-8">Pilih Akses Petugas</h2>
            <div className="grid md:grid-cols-3 gap-4">
                {['admin', 'announcer', 'callroom'].map(r => (
                    <button key={r} onClick={() => onLoginRequest(r)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl capitalize font-bold text-white transition hover:scale-105 group">
                        {r==='admin'?<Settings size={32} className="mb-4 text-blue-500 group-hover:scale-110 transition"/>:r==='announcer'?<Mic size={32} className="mb-4 text-purple-500 group-hover:scale-110 transition"/>:<Users size={32} className="mb-4 text-emerald-500 group-hover:scale-110 transition"/>}
                        <div className="text-xl">{r}</div>
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
      if (simpleHash(pin) === authConfig[targetRole]) onSuccess(targetRole); 
      else { setError(true); setPin(''); }
  };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
        <h2 className="text-xl font-bold text-center mb-6 capitalize">Login {targetRole}</h2>
        <form onSubmit={handleSubmit}>
          <input autoFocus type="password" value={pin} onChange={e=>{setPin(e.target.value);setError(false)}} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="PIN" />
          {error && <p className="text-red-500 text-center mb-4 text-sm font-bold">PIN Salah</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">Masuk</button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ events, appState, dqs, onAddEvent, onEditEvent, onDeleteEvent, onUpdateSettings, onAddDQ, onDeleteDQ, onUpdatePin, onResetProgress }: any) {
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ number: '', name: '', totalSeries: '' });
  const [newDQ, setNewDQ] = useState({ eventNumber: '', series: '', lane: '', reason: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ number: '', name: '', totalSeries: '' });
  const [pinRole, setPinRole] = useState('announcer');
  const [newPinCode, setNewPinCode] = useState('');

  const wrapAsync = async (fn: () => Promise<void>) => { setLoading(true); try { await fn(); } finally { setLoading(false); }};
  const handleAddEvent = (e: React.FormEvent) => { e.preventDefault(); if(!newEvent.number) return; wrapAsync(async () => { await onAddEvent({ number: parseInt(newEvent.number), name: newEvent.name, totalSeries: parseInt(newEvent.totalSeries) }); setNewEvent({ number: '', name: '', totalSeries: '' }); }); };
  const handleUpdatePin = (e: React.FormEvent) => { e.preventDefault(); if(newPinCode.length < 4) return alert("Min 4 digit"); wrapAsync(async () => { await onUpdatePin(pinRole, newPinCode); alert("PIN Berhasil Diubah!"); setNewPinCode(''); }); };
  const handleReset = () => { if(!window.confirm("RESET PROGRESS?")) return; wrapAsync(async () => { await onResetProgress(); }); };

  return (
    <div className="grid md:grid-cols-2 gap-6 relative">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Settings className="text-blue-600"/> Pengaturan</h2>
          <div className="space-y-2 mb-6">
             <input type="text" value={appState.title} onChange={(e) => onUpdateSettings({ title: e.target.value })} className="w-full p-2 border rounded text-sm" placeholder="Nama Kejuaraan" />
             <input type="text" value={appState.venue} onChange={(e) => onUpdateSettings({ venue: e.target.value })} className="w-full p-2 border rounded text-sm" placeholder="Venue" />
          </div>
          <div className="pt-4 border-t border-slate-100">
             <h3 className="font-bold text-slate-700 text-sm mb-2">Ganti PIN <Key size={14} className="inline ml-1"/></h3>
             <form onSubmit={handleUpdatePin} className="flex gap-2">
                 <select value={pinRole} onChange={e => setPinRole(e.target.value)} className="p-2 border rounded bg-slate-50 text-sm"><option value="admin">Admin</option><option value="announcer">Announcer</option><option value="callroom">Call Room</option></select>
                 <input type="text" value={newPinCode} onChange={e => setNewPinCode(e.target.value)} placeholder="PIN Baru" className="flex-1 p-2 border rounded text-sm" pattern="\d*" />
                 <button className="bg-slate-800 text-white px-3 rounded text-xs font-bold">UBAH</button>
             </form>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100">
             <button onClick={handleReset} className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded border border-red-200 text-sm font-bold flex justify-center gap-2"><RotateCcw size={16} /> RESET LOMBA</button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><List className="text-blue-600"/> Events</h2>
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
            <input type="number" placeholder="No" value={newEvent.number} onChange={e => setNewEvent({...newEvent, number: e.target.value})} className="w-14 p-2 border rounded text-sm" />
            <input type="text" placeholder="Nama Acara" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="flex-1 p-2 border rounded text-sm" />
            <input type="number" placeholder="Seri" value={newEvent.totalSeries} onChange={e => setNewEvent({...newEvent, totalSeries: e.target.value})} className="w-14 p-2 border rounded text-sm" />
            <button className="bg-blue-600 text-white p-2 rounded"><Plus size={16}/></button>
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
                        <td className="p-2 flex gap-1">
                            <button onClick={() => wrapAsync(async() => { await onEditEvent(ev.id, { number: parseInt(editForm.number), name: editForm.name, totalSeries: parseInt(editForm.totalSeries) }); setEditingId(null); })} className="text-green-600"><Save size={16}/></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-500"><RotateCcw size={16}/></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-bold w-10">{ev.number}</td>
                        <td className="p-2">{ev.name}</td>
                        <td className="p-2 text-center w-10 bg-slate-100 rounded">{ev.totalSeries}</td>
                        <td className="p-2 text-right w-16">
                          <button onClick={() => { setEditingId(ev.id); setEditForm({ number: ev.number, name: ev.name, totalSeries: ev.totalSeries }); }} className="mr-2 text-blue-500"><Edit2 size={16}/></button>
                          <button onClick={() => { if(confirm('Hapus?')) wrapAsync(async()=> await onDeleteEvent(ev.id)); }} className="text-red-500"><Trash2 size={16}/></button>
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
          <h2 className="font-bold mb-4 text-red-600 flex gap-2"><AlertOctagon /> Diskualifikasi</h2>
          <form onSubmit={(e) => { e.preventDefault(); wrapAsync(async()=> { await onAddDQ({ eventNumber: parseInt(newDQ.eventNumber), series: parseInt(newDQ.series), lane: parseInt(newDQ.lane), reason: newDQ.reason, timestamp: getWIBTime(), createdAt: Date.now() }); setNewDQ({ eventNumber: '', series: '', lane: '', reason: '' }); }) }} className="bg-red-50 p-4 rounded mb-4">
            <div className="flex gap-2 mb-2">
              <input required type="number" placeholder="Acara" value={newDQ.eventNumber} onChange={e => setNewDQ({...newDQ, eventNumber: e.target.value})} className="w-1/3 p-2 border rounded text-sm" />
              <input required type="number" placeholder="Seri" value={newDQ.series} onChange={e => setNewDQ({...newDQ, series: e.target.value})} className="w-1/3 p-2 border rounded text-sm" />
              <input required type="number" placeholder="Lin" value={newDQ.lane} onChange={e => setNewDQ({...newDQ, lane: e.target.value})} className="w-1/3 p-2 border rounded text-sm" />
            </div>
            <input required type="text" placeholder="Alasan" value={newDQ.reason} onChange={e => setNewDQ({...newDQ, reason: e.target.value})} className="w-full p-2 border rounded mb-2 text-sm" />
            <button className="w-full bg-red-600 text-white font-bold py-2 rounded text-sm">SUBMIT DQ</button>
          </form>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {dqs.map((dq: any) => (
              <div key={dq.id} className="p-2 border rounded flex justify-between items-center text-sm bg-white">
                <div><span className="font-bold text-red-600">#{dq.eventNumber}</span> S:{dq.series} L:{dq.lane} - {dq.reason}</div>
                <button onClick={() => wrapAsync(async() => await onDeleteDQ(dq.id))} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

function AnnouncerPanel({ events, appState, navigate, onStart, dqs }: any) {
  const [loading, setLoading] = useState(false);
  const activeEvent = events.find((e: any) => e.id === appState.currentEventId);
  const needsStart = !activeEvent && events.length > 0;
  
  const activeIdx = events.findIndex((e: any) => e.id === appState.currentEventId);
  const callIdx = events.findIndex((e: any) => e.id === appState.callRoomEventId);
  let canGoNext = true; let blockReason = "";

  if (activeIdx > -1 && callIdx > -1) {
    if (activeIdx > callIdx) { canGoNext = false; blockReason = "Menunggu Call Room"; } 
    else if (activeIdx === callIdx && appState.currentSeries >= appState.callRoomSeries) { canGoNext = false; blockReason = "Menunggu Call Room"; }
  }

  const handleNav = async (dir: string) => { setLoading(true); await navigate(dir); setLoading(false); };

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
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
                <button onClick={() => handleNav('prev')} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300"><ChevronLeft /> PREV</button>
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Megaphone size={16} /> Announcer Control</div>
                <div>{canGoNext ? <button onClick={() => handleNav('next')} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition">NEXT <ChevronRight /></button> : <button disabled className="flex items-center gap-2 px-8 py-3 bg-slate-600 text-slate-400 rounded-lg font-bold cursor-not-allowed border border-yellow-500/30"><Lock size={16} /> {blockReason}</button>}</div>
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
  const [loading, setLoading] = useState(false);
  const currentCallEvent = events.find((e: any) => e.id === appState.callRoomEventId);
  const nextEvent = events[events.findIndex((e: any) => e.id === appState.callRoomEventId) + 1];
  const needsStart = !currentCallEvent && events.length > 0;
  const handleNav = async (dir: string) => { setLoading(true); await navigate(dir); setLoading(false); };

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 relative">
        {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>}
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
                  <div className="flex gap-4 justify-center"><button onClick={() => handleNav('prev')} className="px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition">Prev</button><button onClick={() => handleNav('next')} className="px-10 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2">PANGGIL NEXT <ChevronRight size={20} /></button></div>
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

function PublicPanel({ appState, dqs, onBack, onLoginRequest }: any) {
    const recentDQs = dqs.slice(0, 5);

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* HEADER CUSTOM */}
            <header className="bg-slate-900 text-white h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 shadow-xl z-50">
                <div className="flex items-center gap-4">
                    {/* LOGO: Gunakan %20 untuk spasi */}
                    <img src="/sangkuriang%201.png" alt="Logo" className="h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
                    <div className="flex flex-col justify-center">
                        <h1 className="font-extrabold text-lg leading-none tracking-wide uppercase">Sangkuriang</h1>
                        <p className="text-xs text-blue-400 font-bold tracking-[0.2em] uppercase">Swim Organizer</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center gap-2">
                        <Home size={14} /> Home
                    </button>
                    <button onClick={onLoginRequest} className="text-slate-500 hover:text-white transition p-2">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            {/* CONTENT AREA (Mengisi sisa ruang) */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                
                {/* SPLIT SCREEN UTAMA */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* KIRI: CALL ROOM */}
                    <div className="w-full md:w-1/2 bg-slate-900 relative flex flex-col justify-center px-6 md:px-12 border-b md:border-b-0 md:border-r border-slate-700">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 z-0"></div>
                        <div className="relative z-10 w-full max-w-lg mx-auto py-4">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-2">
                                        <Users className="text-blue-400" /> Pemanggilan
                                    </h2>
                                    <span className="text-blue-200/60 text-sm">Call Room</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-blue-200/40 text-[10px] uppercase block">Terakhir Update</span>
                                    <span className="text-white text-lg font-mono font-bold flex items-center gap-2">
                                        <Clock size={16} className="text-blue-400" /> {appState.callRoomLastUpdate || '-'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <div className="text-blue-200 text-sm uppercase mb-1">Acara</div>
                                    <div className="text-white text-6xl md:text-8xl font-bold tracking-tighter">{appState.callRoomEventNumber || '-'}</div>
                                </div>
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <div className="text-blue-200 text-sm uppercase mb-1">Seri</div>
                                    <div className="text-white text-6xl md:text-8xl font-bold tracking-tighter">{appState.callRoomSeries}</div>
                                </div>
                            </div>
                            <p className="text-center text-blue-200/50 mt-4 text-lg md:text-xl font-medium truncate">{appState.callRoomEventName || 'Menunggu...'}</p>
                        </div>
                    </div>

                    {/* KANAN: LIVE POOL */}
                    <div className="w-full md:w-1/2 bg-white relative flex flex-col justify-center px-6 md:px-12">
                        <div className="relative z-10 w-full max-w-lg mx-auto py-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-slate-800 text-2xl md:text-3xl font-bold flex items-center gap-2">
                                    <MonitorPlay className="text-red-500" /> Sedang Berlomba
                                </h2>
                                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">LIVE</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner">
                                    <div className="text-slate-400 text-sm uppercase mb-1">Acara</div>
                                    <div className="text-slate-800 text-6xl md:text-8xl font-bold tracking-tighter">{appState.currentEventNumber || '-'}</div>
                                </div>
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner">
                                    <div className="text-slate-400 text-sm uppercase mb-1">Seri</div>
                                    <div className="text-slate-800 text-6xl md:text-8xl font-bold tracking-tighter">{appState.currentSeries}</div>
                                </div>
                            </div>
                            <p className="text-center text-slate-500 mt-4 text-lg md:text-xl font-medium truncate">{appState.currentEventName || 'Menunggu...'}</p>
                        </div>
                    </div>
                </div>

                {/* DQ TABLE (Height adjusted to 30%) */}
                <div className="h-[30%] bg-slate-50 border-t border-slate-200 p-4 md:p-6 overflow-hidden flex flex-col shrink-0">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                        <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2">
                            <AlertOctagon size={20} className="text-red-500" /> INFORMASI DISKUALIFIKASI TERKINI
                        </h3>
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-12 bg-slate-800 text-white text-xs md:text-sm font-bold uppercase py-3 px-4">
                                <div className="col-span-2">No. Acara</div>
                                <div className="col-span-2 text-center">Seri</div>
                                <div className="col-span-2 text-center">Lintasan</div>
                                <div className="col-span-6">Keterangan / Alasan</div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-0">
                                {recentDQs.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 italic">Tidak ada informasi diskualifikasi saat ini.</div>
                                ) : (
                                    recentDQs.map((dq: any, idx: number) => (
                                        <div key={dq.id} className={`grid grid-cols-12 text-sm py-3 px-4 border-b border-slate-100 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                            <div className="col-span-2 font-bold text-slate-800">{dq.eventNumber}</div>
                                            <div className="col-span-2 text-center text-slate-600">{dq.series}</div>
                                            <div className="col-span-2 text-center">
                                                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">{dq.lane}</span>
                                            </div>
                                            <div className="col-span-6 text-red-600 font-medium">{dq.reason}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER CUSTOM */}
            <footer className="bg-slate-900 text-slate-500 text-center py-3 text-xs font-mono tracking-widest border-t border-slate-800 h-10 shrink-0 flex items-center justify-center z-50">
                &copy; anak magang SSO 2026
            </footer>
        </div>
    )
}