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
  X,
  Home,
  Edit2,
  Save,
  Wifi,
  Play, 
  Loader2,
  WifiOff,
  FileText, 
  CheckCircle, 
  Timer,
  ShieldAlert,
  Trophy,
  DownloadCloud
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const fallbackConfig = {
  apiKey: "AIzaSyBJfXbDljpyTdnbWjbNzGfAQE4TgKvTQf4",
  authDomain: "sangkuriang-swimorg.firebaseapp.com",
  projectId: "sangkuriang-swimorg",
  storageBucket: "sangkuriang-swimorg.firebasestorage.app",
  messagingSenderId: "833562093721",
  appId: "1:833562093721:web:36308c9770eb8e94c37008"
};

let firebaseConfig = fallbackConfig;
try {
  // @ts-ignore
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    // @ts-ignore
    firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  }
} catch (e) {
  console.error("Failed to parse config", e);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// FIX: Mengambil ID murni. Jika rawAppId adalah "12345/src/App.tsx", 
// maka split('/')[0] akan mengambil "12345" saja. Ini cocok dengan Security Rules
// dan tidak akan memicu error "default-app-id".
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.split('/')[0];

// --- UTILS ---
const getWIBTime = () => {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
};

const simpleHash = (str: string) => {
  let hash = 0; if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; 
  }
  return hash.toString();
};

const MASTER_PIN_HASH = simpleHash("master2026");

// --- TIPE DATA ---
type LiveState = {
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

type Tournament = {
  id: string;
  title: string;
  venue: string;
  eventDate: string; 
  status: 'upcoming' | 'live' | 'finished';
  resultUrl: string; 
  pins: { admin: string, announcer: string, callroom: string };
  liveState: LiveState;
  createdAt: number;
};

type EventItem = { id: string; tournamentId: string; number: number; name: string; totalSeries: number; };
type DQRecord = { id: string; tournamentId: string; eventNumber: number; series: number; lane: number; reason: string; timestamp: string; createdAt: number; };

// --- DEFAULT STATES ---
const DEFAULT_LIVE_STATE: LiveState = {
  currentEventId: null, currentSeries: 1, callRoomEventId: null, callRoomSeries: 1, lastUpdate: '-', callRoomLastUpdate: '-'
};

// --- MAIN COMPONENT ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Navigation State
  const [viewMode, setViewMode] = useState<'global' | 'tournament' | 'master_dashboard'>('global');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [role, setRole] = useState<'master' | 'admin' | 'announcer' | 'callroom' | 'public' | null>(null);
  
  // Modal Login State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<'master' | 'admin' | 'announcer' | 'callroom' | null>(null);

  // Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [allDqs, setAllDqs] = useState<DQRecord[]>([]);

  // Computed Active Data
  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const activeEvents = allEvents.filter(e => e.tournamentId === activeTournamentId).sort((a, b) => a.number - b.number);
  const activeDqs = allDqs.filter(d => d.tournamentId === activeTournamentId).sort((a, b) => b.createdAt - a.createdAt);

  // Wake Lock & Network
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => { try { if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) { } };
    if (viewMode === 'tournament' || viewMode === 'master_dashboard') requestWakeLock();
    
    const handleVis = () => { if (document.visibilityState === 'visible' && (viewMode === 'tournament' || viewMode === 'master_dashboard')) requestWakeLock(); };
    document.addEventListener('visibilitychange', handleVis);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [viewMode]);

  // Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        // @ts-ignore
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           try {
               // @ts-ignore
               await signInWithCustomToken(auth, __initial_auth_token);
           } catch (tokenErr) {
               await signInAnonymously(auth);
           }
        } else {
           await signInAnonymously(auth);
        }
      } catch (err) { 
        console.warn("Auth inisialisasi: ", err); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return; 
    
    const unsubTournaments = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'), 
      (snapshot) => {
        setTournaments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tournament)).sort((a,b) => b.createdAt - a.createdAt));
      }, 
      (error) => console.warn("Sinkronisasi Tournaments ditunda", error.message)
    );

    const unsubEvents = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'events'), 
      (snapshot) => {
        setAllEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EventItem)));
      }, 
      (error) => console.warn("Sinkronisasi Events ditunda", error.message)
    );

    const unsubDqs = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), 
      (snapshot) => {
        setAllDqs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DQRecord)));
      }, 
      (error) => console.warn("Sinkronisasi DQs ditunda", error.message)
    );

    return () => { unsubTournaments(); unsubEvents(); unsubDqs(); };
  }, [user]);

  // --- ACTIONS ---
  const handleCreateTournament = async (data: Partial<Tournament>) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'), {
      ...data, status: 'upcoming', liveState: DEFAULT_LIVE_STATE, createdAt: Date.now()
    });
  };

  const handleUpdateTournament = async (id: string, data: Partial<Tournament>) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', id), data);
  };

  const handleDeleteTournament = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', id));
  };

  const updateLiveState = async (newState: Partial<LiveState>) => {
    if (!user || !activeTournamentId || !activeTournament) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', activeTournamentId), {
      liveState: { ...activeTournament.liveState, ...newState, lastUpdate: getWIBTime() }
    });
  };

  // Import Legacy Data Function
  const handleRestoreLegacyData = async () => {
    if (!user) return;
    const confirmRestore = window.confirm("Fungsi ini akan mengimpor data 'PIALA KADISDIK SUMEDANG' sesuai dengan gambar sebelumnya ke sistem baru. Lanjutkan?");
    if (!confirmRestore) return;
    
    try {
        // Buat Lomba
        const tDocRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tournaments'), {
          title: "PIALA KADISDIK SUMEDANG FINSWIMMING 2026",
          venue: "Kolam Renang Yadika, Tanjungsari, Sumedang",
          eventDate: '2026-04-01T00:00:00.000Z', 
          status: 'finished',
          resultUrl: '',
          pins: { admin: simpleHash('1234'), announcer: simpleHash('1234'), callroom: simpleHash('1234') },
          liveState: DEFAULT_LIVE_STATE,
          createdAt: Date.now()
        });

        const tId = tDocRef.id;

        // Tambah Acara / Events
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { tournamentId: tId, number: 55, name: "Event 55 (Placeholder)", totalSeries: 3 });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { tournamentId: tId, number: 56, name: "Event 56 (Placeholder)", totalSeries: 2 });
        
        const evt61Ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { tournamentId: tId, number: 61, name: "Mixed 11 & Under 4x50 Kick Surface Relay", totalSeries: 1 });
        const evt64Ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { tournamentId: tId, number: 64, name: "Mixed 12 & Over 4x50 Bi Fins Relay", totalSeries: 1 });

        // Update Live State sesuai dengan Screenshot
        await updateDoc(tDocRef, {
          liveState: {
            currentEventId: evt61Ref.id,
            currentEventNumber: 61,
            currentEventName: "Mixed 11 & Under 4x50 Kick Surface Relay",
            currentEventTotalSeries: 1,
            currentSeries: 1,
            callRoomEventId: evt64Ref.id,
            callRoomEventNumber: 64,
            callRoomEventName: "Mixed 12 & Over 4x50 Bi Fins Relay",
            callRoomEventTotalSeries: 1,
            callRoomSeries: 1,
            lastUpdate: getWIBTime(),
            callRoomLastUpdate: "18.49.35 WIB"
          }
        });

        // Tambah Informasi Diskualifikasi sesuai Screenshot
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), { tournamentId: tId, eventNumber: 56, series: 1, lane: 3, reason: "Melepas snorkel pada meter ke 90 meter", timestamp: getWIBTime(), createdAt: Date.now() });
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), { tournamentId: tId, eventNumber: 55, series: 2, lane: 1, reason: "fins lepas pada jarak 10 meter", timestamp: getWIBTime(), createdAt: Date.now() - 1000 });

        alert("Berhasil! Data lama telah dipulihkan ke deployment baru.");
    } catch (e) {
        console.error(e);
        alert("Gagal memulihkan data.");
    }
  };

  // Login Handler
  const processLogin = (roleName: string, pin: string) => {
    const hashed = simpleHash(pin);
    if (roleName === 'master') {
      if (hashed === MASTER_PIN_HASH) {
        setRole('master'); setViewMode('master_dashboard'); setShowLoginModal(false); return true;
      }
    } else if (activeTournament) {
      const pins: any = activeTournament.pins;
      if (hashed === pins[roleName]) {
        setRole(roleName as any); setViewMode('tournament'); setShowLoginModal(false); return true;
      }
    }
    return false;
  };

  if (!user) return <div className="h-screen flex items-center justify-center text-slate-500 font-sans gap-2"><Loader2 className="animate-spin"/> Menghubungkan ke Server...</div>;

  return (
    <>
      {showLoginModal && (
        <LoginModal 
          targetRole={targetLoginRole} 
          onClose={() => setShowLoginModal(false)}
          onLogin={processLogin}
        />
      )}

      {viewMode === 'global' && (
        <GlobalLandingPage 
          tournaments={tournaments}
          onSelectTournament={(id: string) => { setActiveTournamentId(id); setRole('public'); setViewMode('tournament'); }}
          onMasterLogin={() => { setTargetLoginRole('master'); setShowLoginModal(true); }}
        />
      )}

      {viewMode === 'master_dashboard' && role === 'master' && (
        <MasterDashboard 
          tournaments={tournaments}
          onCreate={handleCreateTournament}
          onEdit={(id: string) => { setActiveTournamentId(id); setRole('admin'); setViewMode('tournament'); }}
          onDelete={handleDeleteTournament}
          onLogout={() => { setRole(null); setViewMode('global'); }}
          onRestoreLegacy={handleRestoreLegacyData}
        />
      )}

      {viewMode === 'tournament' && activeTournament && (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {role === 'public' ? (
            <TournamentPublicView 
              tournament={activeTournament} dqs={activeDqs} isOnline={isOnline}
              onBack={() => { setActiveTournamentId(null); setViewMode('global'); }}
              onLoginRequest={() => { setRole(null); }}
            />
          ) : !role ? (
            <RoleSelectionPanel 
              tournament={activeTournament}
              onBack={() => { setRole('public'); }} 
              onLoginRequest={(r:any) => { setTargetLoginRole(r); setShowLoginModal(true); }} 
            />
          ) : (
            <div className="flex flex-col min-h-screen">
               <Header role={role} title={activeTournament.title} venue={activeTournament.venue} onHome={() => { setRole('public'); }} onLogout={() => { setRole('public'); }} isOnline={isOnline} />
               <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
                  {role === 'admin' && (
                    <AdminPanel 
                      tournament={activeTournament} events={activeEvents}
                      onUpdateTournament={(data: any) => handleUpdateTournament(activeTournament.id, data)}
                      onAddEvent={async (data: any) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...data, tournamentId: activeTournament.id }); }}
                      onEditEvent={async (id: string, data: any) => { if(user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), data); }}
                      onDeleteEvent={async (id: string) => { if(user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); }}
                    />
                  )}
                  {role === 'announcer' && (
                    <AnnouncerPanel 
                      tournament={activeTournament} events={activeEvents} dqs={activeDqs} updateLiveState={updateLiveState}
                      onAddDQ={async (data: any) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), { ...data, tournamentId: activeTournament.id, createdAt: Date.now() }); }}
                      onDeleteDQ={async (id: string) => { if(user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dqs', id)); }}
                    />
                  )}
                  {role === 'callroom' && (
                    <CallRoomPanel tournament={activeTournament} events={activeEvents} updateLiveState={updateLiveState} />
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

const Header = ({ role, title, venue, onHome, onLogout, isOnline }: any) => (
  <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        {role === 'admin' && <Settings className="text-blue-400" />}
        {role === 'announcer' && <Mic className="text-purple-400" />}
        {role === 'callroom' && <Users className="text-emerald-400" />}
        <div>
          <span className="font-bold text-lg uppercase leading-none block">{role === 'admin' ? 'Admin Lomba' : role}</span>
          <span className={`text-[10px] flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />} {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
         <div className="hidden md:block text-right mr-2">
            <div className="text-xs font-bold text-slate-300">{title}</div>
            <div className="text-[10px] text-slate-500">{venue}</div>
         </div>
         <button onClick={onHome} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition" title="Lihat Public View"><Home size={16} /></button>
         <button onClick={onLogout} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition" title="Logout"><LogOut size={16} /></button>
      </div>
    </div>
  </header>
);

const LogoBar = ({ onMasterLogin }: { onMasterLogin?: () => void }) => (
  <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 p-4">
    <div className="max-w-6xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
          <img src="/sangkuriang%201.png" alt="Logo" className="h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
          <div className="font-bold text-xl leading-tight text-white">
            <div>SANGKURIANG</div>
            <div className="text-blue-400 text-sm tracking-widest">SWIM ORGANIZER</div>
          </div>
      </div>
      {onMasterLogin && (
        <button onClick={onMasterLogin} className="text-xs text-slate-500 hover:text-white flex gap-1 items-center transition bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <ShieldAlert size={14}/> Master
        </button>
      )}
    </div>
  </nav>
);

const TourCard = ({ t, badge, badgeColor, onSelectTournament }: any) => (
  <div onClick={() => onSelectTournament(t.id)} className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-blue-500 transition-colors cursor-pointer group text-left">
      <div className="flex justify-between items-start mb-4">
        <span className={`${badgeColor} text-xs px-2 py-1 rounded font-bold uppercase`}>{badge}</span>
        <Trophy size={20} className="text-slate-500 group-hover:text-blue-400 transition"/>
      </div>
      <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition">{t.title}</h3>
      <div className="text-sm text-slate-400 mb-2 flex items-center gap-2"><MapPin size={14}/> {t.venue}</div>
      <div className="text-sm text-slate-400 flex items-center gap-2"><Calendar size={14}/> {new Date(t.eventDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
  </div>
);

// 1. GLOBAL LANDING PAGE
function GlobalLandingPage({ tournaments, onSelectTournament, onMasterLogin }: any) {
  const live = tournaments.filter((t: any) => t.status === 'live');
  const upcoming = tournaments.filter((t: any) => t.status === 'upcoming');
  const finished = tournaments.filter((t: any) => t.status === 'finished');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-y-auto">
      <LogoBar onMasterLogin={onMasterLogin} />
      <div className="flex-1 max-w-6xl mx-auto w-full p-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Portal Kejuaraan Renang</h1>
          <p className="text-slate-400 text-lg">Pilih kompetisi untuk melihat Live Scoreboard & Jadwal</p>
        </div>

        {live.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><MonitorPlay className="text-red-500"/> Sedang Berlangsung</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {live.map((t:any) => <TourCard key={t.id} t={t} badge="LIVE NOW" badgeColor="bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" onSelectTournament={onSelectTournament} />)}
            </div>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><Timer className="text-yellow-500"/> Akan Datang</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((t:any) => <TourCard key={t.id} t={t} badge="COMING SOON" badgeColor="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" onSelectTournament={onSelectTournament} />)}
            </div>
          </div>
        ) : null}

        {finished.length > 0 ? (
          <div className="mb-12 opacity-80">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><CheckCircle className="text-blue-500"/> Selesai</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {finished.map((t:any) => <TourCard key={t.id} t={t} badge="SELESAI" badgeColor="bg-[#1e3a8a] text-blue-300 border border-[#1e40af]" onSelectTournament={onSelectTournament} />)}
            </div>
          </div>
        ) : null}
        
        {tournaments.length === 0 ? (
            <div className="text-center text-slate-500 py-20 italic">Belum ada data kejuaraan di dalam sistem.</div>
        ) : null}
      </div>
      <footer className="bg-slate-950 text-slate-600 py-4 text-center text-xs border-t border-slate-900 shrink-0">&copy; anak magang SSO 2026</footer>
    </div>
  );
}

// 2. MASTER DASHBOARD
function MasterDashboard({ tournaments, onCreate, onEdit, onDelete, onLogout, onRestoreLegacy }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', venue: '', eventDate: '', adminPin: '1234', announcerPin: '1234', callroomPin: '1234' });

  const handleCreate = (e: any) => {
    e.preventDefault();
    onCreate({
      title: form.title, venue: form.venue, eventDate: new Date(form.eventDate).toISOString(), resultUrl: '',
      pins: { admin: simpleHash(form.adminPin), announcer: simpleHash(form.announcerPin), callroom: simpleHash(form.callroomPin) }
    });
    setShowCreate(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="font-bold text-xl flex items-center gap-2"><ShieldAlert className="text-blue-400"/> SUPERUSER MASTER</div>
          <button onClick={onLogout} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><LogOut size={16}/> Logout</button>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Semua Lomba</h2>
          <div className="flex gap-2">
             <button onClick={onRestoreLegacy} className="bg-[#0f9d58] hover:bg-[#0b8043] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition transform active:scale-95"><DownloadCloud size={18}/> Restore Data</button>
             <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition"><Plus size={18}/> Buat Lomba Baru</button>
          </div>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 grid md:grid-cols-2 gap-6 animate-in fade-in">
             <div className="space-y-4">
                <h3 className="font-bold text-blue-900 border-b pb-2">Informasi Umum</h3>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Nama Kejuaraan</label><input required type="text" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Lokasi / Venue</label><input required type="text" value={form.venue} onChange={e=>setForm({...form, venue: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label><input required type="date" value={form.eventDate} onChange={e=>setForm({...form, eventDate: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
             </div>
             <div className="space-y-4">
                <h3 className="font-bold text-blue-900 border-b pb-2">Pengaturan Akses (PIN)</h3>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">PIN Admin Lomba</label><input required type="text" value={form.adminPin} onChange={e=>setForm({...form, adminPin: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">PIN Announcer</label><input required type="text" value={form.announcerPin} onChange={e=>setForm({...form, announcerPin: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">PIN Call Room</label><input required type="text" value={form.callroomPin} onChange={e=>setForm({...form, callroomPin: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
             </div>
             <div className="md:col-span-2 flex justify-end gap-2 border-t pt-4">
               <button type="button" onClick={()=>setShowCreate(false)} className="px-6 py-2 rounded text-slate-500 hover:bg-slate-100 font-bold">Batal</button>
               <button type="submit" className="px-8 py-2 rounded bg-blue-600 text-white font-bold shadow-lg">SIMPAN & BUAT LOMBA</button>
             </div>
          </form>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b"><tr><th className="p-4 font-bold text-slate-600">Lomba</th><th className="p-4 font-bold text-slate-600">Status</th><th className="p-4 font-bold text-slate-600 text-right">Aksi</th></tr></thead>
            <tbody>
              {tournaments.map((t:any) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-blue-900 text-lg">{t.title}</div>
                    <div className="text-sm text-slate-500">{new Date(t.eventDate).toLocaleDateString('id-ID')} | {t.venue}</div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${t.status === 'live' ? 'bg-red-100 text-red-600' : t.status === 'finished' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>{t.status}</span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => onEdit(t.id)} className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-sm hover:bg-slate-700 transition shadow">Kelola Event (Admin)</button>
                    <button onClick={() => onDelete(t.id)} className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded transition"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// 3. TOURNAMENT PUBLIC VIEW (Landing Khusus Lomba)
function TournamentPublicView({ tournament, dqs, isOnline, onBack, onLoginRequest }: any) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (tournament.status !== 'upcoming') return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const targetDate = new Date(tournament.eventDate);
      const target = isNaN(targetDate.getTime()) ? now : targetDate.getTime();
      const distance = target - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)) || 0,
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) || 0,
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)) || 0,
          seconds: Math.floor((distance % (1000 * 60)) / 1000) || 0
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tournament.eventDate, tournament.status]);

  if (tournament.status === 'live') {
    return <LiveScoreboard tournament={tournament} dqs={dqs} isOnline={isOnline} onBack={onBack} onLoginRequest={onLoginRequest} />;
  }

  // View Upcoming or Finished
  const validEventDate = new Date(tournament.eventDate);
  const isFinished = tournament.status === 'finished';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden">
      {showPdf && tournament.resultUrl ? (
          <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 animate-in fade-in">
              <div className="flex justify-between items-center mb-4 text-white">
                  <h2 className="font-bold text-lg flex items-center gap-2"><FileText /> Hasil Lengkap</h2>
                  <button onClick={() => setShowPdf(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X /></button>
              </div>
              <iframe src={tournament.resultUrl} className="flex-1 w-full rounded-lg bg-white" title="Hasil Lomba"></iframe>
          </div>
      ) : null}

      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
      
      <header className="bg-slate-900/80 backdrop-blur-md text-white h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 z-50">
          <div className="flex items-center gap-4">
              <img src="/sangkuriang%201.png" alt="Logo" className="h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
              <div className="flex flex-col justify-center hidden sm:flex">
                  <h1 className="font-extrabold text-lg leading-none tracking-wide uppercase">Sangkuriang</h1>
                  <p className="text-xs text-blue-400 font-bold tracking-[0.2em] uppercase">Swim Organizer</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <span className={`text-[10px] flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>{isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}</span>
              <button onClick={onBack} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center gap-2"><ChevronLeft size={14} /> Beranda</button>
              <button onClick={onLoginRequest} className="text-slate-500 hover:text-white transition p-2"><Settings size={20} /></button>
          </div>
      </header>
      
      <div className="flex-1 flex flex-col justify-center items-center text-center p-6 z-10">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="flex justify-center mb-6">
                {isFinished ? (
                     <span className="bg-blue-500/20 text-blue-400 text-sm px-3 py-1 rounded-full font-bold flex items-center gap-2 border border-blue-500/30"><CheckCircle size={14} /> LOMBA TELAH SELESAI</span>
                ) : (
                     <span className="bg-yellow-500/20 text-yellow-400 text-sm px-3 py-1 rounded-full font-bold flex items-center gap-2 border border-yellow-500/30"><Timer size={14}/> AKAN DATANG</span>
                )}
            </div>

            <h3 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{tournament.title}</h3>
            <div className="text-base text-slate-400 mb-8 flex items-center justify-center gap-2">
                <MapPin size={16}/> {tournament.venue}
            </div>

            {!isFinished ? (
                 <div className="grid grid-cols-4 gap-3 mb-8">
                     {Object.entries(timeLeft).map(([unit, val]) => (
                         <div key={unit} className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-inner">
                             <div className="text-3xl font-black text-white mb-1">{val}</div>
                             <div className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">{unit}</div>
                         </div>
                     ))}
                 </div>
            ) : null}
            
            {isFinished ? (
                 tournament.resultUrl ? (
                    <button onClick={() => setShowPdf(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-900/50 text-lg">
                        <FileText size={20}/> LIHAT HASIL KESELURUHAN
                    </button>
                 ) : (
                    <div className="text-slate-500 italic bg-slate-900 p-4 rounded-xl border border-slate-800">Menunggu admin mengunggah hasil perlombaan...</div>
                 )
            ) : (
                <div className="text-sm text-slate-500 border-t border-slate-700 pt-6">
                    Lomba dijadwalkan pada:<br/>
                    <span className="text-white font-bold text-lg">{!isNaN(validEventDate.getTime()) ? validEventDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
                </div>
            )}
        </div>
      </div>
      <footer className="bg-slate-950 text-slate-600 py-4 text-center text-xs border-t border-slate-800 z-10 shrink-0">&copy; anak magang SSO 2026</footer>
    </div>
  );
}

// 3A. LIVE SCOREBOARD (Split Screen)
function LiveScoreboard({ tournament, dqs, isOnline, onBack, onLoginRequest }: any) {
  const ls = tournament.liveState || DEFAULT_LIVE_STATE;
  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-white">
        <header className="bg-slate-900 text-white h-16 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 shadow-xl z-50">
            <div className="flex items-center gap-4">
                <img src="/sangkuriang%201.png" alt="Logo" className="h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
                <div className="flex flex-col justify-center">
                    <h1 className="font-extrabold text-lg leading-none tracking-wide uppercase truncate max-w-[150px] md:max-w-xs">{tournament.title}</h1>
                    <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase hidden sm:block">Swim Organizer</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-[10px] flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>{isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}</span>
                <button onClick={onBack} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition border border-slate-700 flex items-center gap-2"><ChevronLeft size={14} /> Beranda</button>
                <button onClick={onLoginRequest} className="text-slate-500 hover:text-white transition p-2"><Settings size={20} /></button>
            </div>
        </header>

        <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
                <div className="w-full md:w-1/2 bg-slate-900 relative flex flex-col justify-center px-6 md:px-12 border-b md:border-b-0 md:border-r border-slate-700">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 z-0"></div>
                    <div className="relative z-10 w-full max-w-lg mx-auto py-4">
                        <div className="flex justify-between items-start mb-6"><div><h2 className="text-white text-2xl md:text-3xl font-bold flex items-center gap-2"><Users className="text-blue-400" /> Pemanggilan</h2><span className="text-blue-200/60 text-sm">Call Room</span></div><div className="text-right"><span className="text-blue-200/40 text-[10px] uppercase block">Terakhir Update</span><span className="text-white text-lg font-mono font-bold flex items-center gap-2"><Clock size={16} className="text-blue-400" /> {ls.callRoomLastUpdate || '-'}</span></div></div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center"><div className="text-blue-200 text-sm uppercase mb-1">Acara</div><div className="text-white text-6xl md:text-8xl font-bold tracking-tighter">{ls.callRoomEventNumber || '-'}</div></div>
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-center"><div className="text-blue-200 text-sm uppercase mb-1">Seri</div><div className="text-white text-6xl md:text-8xl font-bold tracking-tighter">{ls.callRoomSeries}</div></div>
                        </div>
                        <p className="text-center text-blue-200/50 mt-4 text-lg md:text-xl font-medium truncate">{ls.callRoomEventName || 'Menunggu...'}</p>
                    </div>
                </div>
                <div className="w-full md:w-1/2 bg-white relative flex flex-col justify-center px-6 md:px-12">
                    <div className="relative z-10 w-full max-w-lg mx-auto py-4">
                        <div className="flex justify-between items-center mb-6"><h2 className="text-slate-800 text-2xl md:text-3xl font-bold flex items-center gap-2"><MonitorPlay className="text-red-500" /> Sedang Berlomba</h2><span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">LIVE</span></div>
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner"><div className="text-slate-400 text-sm uppercase mb-1">Acara</div><div className="text-slate-800 text-6xl md:text-8xl font-bold tracking-tighter">{ls.currentEventNumber || '-'}</div></div>
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-inner"><div className="text-slate-400 text-sm uppercase mb-1">Seri</div><div className="text-slate-800 text-6xl md:text-8xl font-bold tracking-tighter">{ls.currentSeries}</div></div>
                        </div>
                        <p className="text-center text-slate-500 mt-4 text-lg md:text-xl font-medium truncate">{ls.currentEventName || 'Menunggu...'}</p>
                    </div>
                </div>
            </div>
            <div className="h-[30%] bg-slate-50 border-t border-slate-200 p-4 md:p-6 overflow-hidden flex flex-col shrink-0">
                <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                    <h3 className="text-slate-700 font-bold mb-3 flex items-center gap-2"><AlertOctagon size={20} className="text-red-500" /> INFORMASI DISKUALIFIKASI TERKINI</h3>
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 bg-slate-800 text-white text-xs md:text-sm font-bold uppercase py-3 px-4"><div className="col-span-2">No. Acara</div><div className="col-span-2 text-center">Seri</div><div className="col-span-2 text-center">Lintasan</div><div className="col-span-6">Keterangan / Alasan</div></div>
                        <div className="overflow-y-auto flex-1 p-0">
                            {dqs.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-400 italic">Tidak ada informasi diskualifikasi saat ini.</div>
                            ) : null}
                            
                            {dqs.map((dq: any, idx: number) => (
                                <div key={dq.id} className={`grid grid-cols-12 text-sm py-3 px-4 border-b border-slate-100 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="col-span-2 font-bold text-slate-800">{dq.eventNumber}</div>
                                    <div className="col-span-2 text-center text-slate-600">{dq.series}</div>
                                    <div className="col-span-2 text-center"><span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">{dq.lane}</span></div>
                                    <div className="col-span-6 text-red-600 font-medium">{dq.reason}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <footer className="bg-slate-900 text-slate-500 text-center py-3 text-xs font-mono tracking-widest border-t border-slate-800 h-10 shrink-0 flex items-center justify-center z-50">&copy; anak magang SSO 2026</footer>
    </div>
  );
}

// 4. ROLE SELECTION
function RoleSelectionPanel({ tournament, onBack, onLoginRequest }: any) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
            <button onClick={onBack} className="mb-8 text-slate-400 hover:text-white flex gap-2 items-center"><ChevronLeft size={20}/> Kembali</button>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Pilih Akses Petugas</h2>
                <p className="text-slate-400">Untuk {tournament.title}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {['admin', 'announcer', 'callroom'].map(r => (
                    <button key={r} onClick={() => onLoginRequest(r)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl capitalize font-bold text-white transition hover:scale-105 group shadow-xl">
                        {r==='admin'?<Settings size={32} className="mb-4 text-blue-500 group-hover:scale-110 transition mx-auto"/>:r==='announcer'?<Mic size={32} className="mb-4 text-purple-500 group-hover:scale-110 transition mx-auto"/>:<Users size={32} className="mb-4 text-emerald-500 group-hover:scale-110 transition mx-auto"/>}
                        <div className="text-xl text-center">{r === 'admin' ? 'Admin Lomba' : r}</div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
}

function LoginModal({ targetRole, onClose, onLogin }: any) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!onLogin(targetRole, pin)) { setError(true); setPin(''); } };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
        <h2 className="text-xl font-bold text-center mb-6 capitalize">Login {targetRole === 'admin' ? 'Admin Lomba' : targetRole}</h2>
        <form onSubmit={handleSubmit}>
          <input autoFocus type="password" value={pin} onChange={e=>{setPin(e.target.value);setError(false)}} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="PIN" />
          {error && <p className="text-red-500 text-center mb-4 text-sm font-bold">PIN Salah</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">Masuk</button>
        </form>
      </div>
    </div>
  );
}

// 5. EVENT ADMIN PANEL
function AdminPanel({ tournament, events, onUpdateTournament, onAddEvent, onEditEvent, onDeleteEvent }: any) {
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ number: '', name: '', totalSeries: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ number: '', name: '', totalSeries: '' });

  // State untuk form update PIN
  const [pinForm, setPinForm] = useState({ admin: '', announcer: '', callroom: '' });
  const [pinMessage, setPinMessage] = useState('');

  const wrapAsync = async (fn: () => Promise<void>) => { setLoading(true); try { await fn(); } finally { setLoading(false); }};
  const handleAddEvent = (e: React.FormEvent) => { e.preventDefault(); if(!newEvent.number) return; wrapAsync(async () => { await onAddEvent({ number: parseInt(newEvent.number), name: newEvent.name, totalSeries: parseInt(newEvent.totalSeries) }); setNewEvent({ number: '', name: '', totalSeries: '' }); }); };
  
  // Handler untuk menyimpan PIN baru
  const handleUpdatePins = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPins = { ...tournament.pins };
    let changed = false;
    
    // Hash PIN baru menggunakan fungsi simpleHash bawaan sistem
    if (pinForm.admin) { updatedPins.admin = simpleHash(pinForm.admin); changed = true; }
    if (pinForm.announcer) { updatedPins.announcer = simpleHash(pinForm.announcer); changed = true; }
    if (pinForm.callroom) { updatedPins.callroom = simpleHash(pinForm.callroom); changed = true; }

    if (changed) {
      wrapAsync(async () => {
        await onUpdateTournament({ pins: updatedPins });
        setPinForm({ admin: '', announcer: '', callroom: '' });
        setPinMessage('PIN akses berhasil diperbarui!');
        setTimeout(() => setPinMessage(''), 4000);
      });
    }
  };

  const isUpcoming = tournament.status === 'upcoming';
  const isLive = tournament.status === 'live';

  return (
    <div className="grid md:grid-cols-3 gap-6 relative">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
      
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Settings className="text-blue-600"/> Kontrol Lomba</h2>
          
          <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status Saat Ini</div>
              <div className={`text-lg font-black uppercase ${isLive ? 'text-red-500' : tournament.status === 'finished' ? 'text-blue-600' : 'text-yellow-600'}`}>
                  {isLive ? 'SEDANG BERLANGSUNG (LIVE)' : tournament.status === 'finished' ? 'SELESAI' : 'AKAN DATANG'}
              </div>
          </div>

          <div className="space-y-3">
             {isUpcoming && (
                 <button onClick={() => { wrapAsync(async() => await onUpdateTournament({ status: 'live' })); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-lg">
                     <Play size={20}/> MULAI LOMBA
                 </button>
             )}
             {isLive && (
                 <button onClick={() => { wrapAsync(async() => await onUpdateTournament({ status: 'finished' })); }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-lg">
                     <CheckCircle size={20}/> SELESAIKAN PERTANDINGAN
                 </button>
             )}
             
             <div className="pt-4 border-t border-slate-100 mt-6">
                <label className="text-xs text-slate-500 font-bold mb-1 block">Link Hasil Lengkap (PDF URL)</label>
                <div className="flex gap-2">
                    <input type="text" value={tournament.resultUrl || ''} onChange={(e) => onUpdateTournament({ resultUrl: e.target.value })} className="flex-1 p-2 border rounded text-sm bg-slate-50" placeholder="https://drive.google.com/..." />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan link publik agar bisa dibuka oleh penonton saat lomba selesai.</p>
             </div>
          </div>
        </div>

        {/* PANEL PENGATURAN PIN */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Lock className="text-blue-600"/> Pengaturan PIN Akses</h2>
          <form onSubmit={handleUpdatePins} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">Ubah PIN Admin Lomba</label>
              <input type="text" value={pinForm.admin} onChange={(e) => setPinForm({...pinForm, admin: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="Kosongkan jika tidak diubah" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">Ubah PIN Announcer</label>
              <input type="text" value={pinForm.announcer} onChange={(e) => setPinForm({...pinForm, announcer: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="Kosongkan jika tidak diubah" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">Ubah PIN Call Room</label>
              <input type="text" value={pinForm.callroom} onChange={(e) => setPinForm({...pinForm, callroom: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder="Kosongkan jika tidak diubah" />
            </div>
            
            {pinMessage && <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center animate-in fade-in">{pinMessage}</div>}
            
            <div className="pt-2">
              <button type="submit" disabled={!pinForm.admin && !pinForm.announcer && !pinForm.callroom} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition shadow-sm">
                SIMPAN PIN BARU
              </button>
            </div>
          </form>
        </div>

      </div>

      <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold mb-4 flex gap-2"><List className="text-blue-600"/> Daftar Acara (Events)</h2>
            <form onSubmit={handleAddEvent} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <input type="number" placeholder="No" value={newEvent.number} onChange={e => setNewEvent({...newEvent, number: e.target.value})} className="w-16 p-2 border rounded text-sm" />
                <input type="text" placeholder="Nama Acara (Contoh: 50m Gaya Bebas)" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="flex-1 p-2 border rounded text-sm" />
                <input type="number" placeholder="Seri" value={newEvent.totalSeries} onChange={e => setNewEvent({...newEvent, totalSeries: e.target.value})} className="w-16 p-2 border rounded text-sm" />
                <button className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700 transition">TAMBAH</button>
            </form>
            <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 sticky top-0 border-b"><tr><th className="p-3">No</th><th className="p-3">Nama Acara</th><th className="p-3 text-center">Seri</th><th className="p-3"></th></tr></thead>
                <tbody>
                    {events.map((ev: any) => (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-slate-50">
                        {editingId === ev.id ? (
                        <>
                            <td className="p-2"><input type="number" value={editForm.number} onChange={e => setEditForm({...editForm, number: e.target.value})} className="w-full border rounded p-1" /></td>
                            <td className="p-2"><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded p-1" /></td>
                            <td className="p-2"><input type="number" value={editForm.totalSeries} onChange={e => setEditForm({...editForm, totalSeries: e.target.value})} className="w-full border rounded p-1" /></td>
                            <td className="p-2 flex gap-2 justify-end">
                                <button onClick={() => wrapAsync(async() => { await onEditEvent(ev.id, { number: parseInt(editForm.number), name: editForm.name, totalSeries: parseInt(editForm.totalSeries) }); setEditingId(null); })} className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200"><Save size={16}/></button>
                                <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 p-1.5 rounded hover:bg-slate-300"><X size={16}/></button>
                            </td>
                        </>
                        ) : (
                        <>
                            <td className="p-3 font-bold w-12 text-slate-700">{ev.number}</td>
                            <td className="p-3 font-medium">{ev.name}</td>
                            <td className="p-3 text-center w-16"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{ev.totalSeries}</span></td>
                            <td className="p-3 text-right w-24 space-x-1">
                            <button onClick={() => { setEditingId(ev.id); setEditForm({ number: ev.number, name: ev.name, totalSeries: ev.totalSeries }); }} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={16}/></button>
                            <button onClick={() => { wrapAsync(async()=> await onDeleteEvent(ev.id)); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                            </td>
                        </>
                        )}
                    </tr>
                    ))}
                    {events.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">Belum ada acara ditambahkan.</td></tr> : null}
                </tbody>
                </table>
            </div>
          </div>
      </div>
    </div>
  );
}

// 6. ANNOUNCER PANEL (Live Display + DQ Input)
function AnnouncerPanel({ tournament, events, dqs, updateLiveState, onAddDQ, onDeleteDQ }: any) {
  const [loading, setLoading] = useState(false);
  const [newDQ, setNewDQ] = useState({ eventNumber: '', series: '', lane: '', reason: '' });
  
  const ls = tournament.liveState || DEFAULT_LIVE_STATE;
  const activeEvent = events.find((e: any) => e.id === ls.currentEventId);
  const needsStart = !activeEvent && events.length > 0;
  
  const activeIdx = events.findIndex((e: any) => e.id === ls.currentEventId);
  const callIdx = events.findIndex((e: any) => e.id === ls.callRoomEventId);
  
  let canGoNext = true; let blockReason = "";
  if (activeIdx > -1 && callIdx > -1) {
    if (activeIdx > callIdx) { canGoNext = false; blockReason = "Call Room tertinggal"; } 
    else if (activeIdx === callIdx && ls.currentSeries >= ls.callRoomSeries) { canGoNext = false; blockReason = "Menunggu Call Room"; }
  }

  const wrapAsync = async (fn: () => Promise<void>) => { setLoading(true); try { await fn(); } finally { setLoading(false); }};

  const handleNav = async (direction: 'next' | 'prev') => { 
      if(activeIdx === -1) return;
      let nextSeries = ls.currentSeries;
      let targetEvent = events[activeIdx];

      if (direction === 'next') {
          if (nextSeries < targetEvent.totalSeries) nextSeries++;
          else if (activeIdx < events.length - 1) { targetEvent = events[activeIdx + 1]; nextSeries = 1; }
      } else {
          if (nextSeries > 1) nextSeries--;
          else if (activeIdx > 0) { targetEvent = events[activeIdx - 1]; nextSeries = targetEvent.totalSeries; }
      }

      wrapAsync(async () => {
          await updateLiveState({
              currentEventId: targetEvent.id, currentEventName: targetEvent.name, currentEventNumber: targetEvent.number,
              currentEventTotalSeries: targetEvent.totalSeries, currentSeries: nextSeries
          });
      });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 relative max-w-6xl mx-auto">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-purple-600" size={40}/></div>}
      
      <div className="md:col-span-2 space-y-6">
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-800">
            <div className="bg-black p-2 text-center text-yellow-400 font-mono text-sm tracking-widest uppercase border-b border-slate-800">Live Timing Display Control</div>
            <div className="p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
                {needsStart ? (
                    <div className="animate-in fade-in zoom-in">
                        <p className="text-slate-400 mb-4">Papan skor belum menampilkan data.</p>
                        <button onClick={() => wrapAsync(async () => {
                             const first = events[0]; 
                             await updateLiveState({ currentEventId: first.id, currentEventName: first.name, currentEventNumber: first.number, currentEventTotalSeries: first.totalSeries, currentSeries: 1 });
                        })} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> MULAI ACARA PERTAMA</button>
                    </div>
                ) : activeEvent ? (
                <>
                    <div className="text-blue-400 text-2xl font-bold uppercase tracking-widest mb-2">Acara {activeEvent.number}</div>
                    <h1 className="text-5xl font-extrabold text-white mb-8 leading-tight">{activeEvent.name}</h1>
                    <div className="inline-flex items-center justify-center bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <div className="text-center px-8 border-r border-slate-600"><span className="block text-slate-400 text-sm uppercase mb-1">Seri</span><span className="block text-6xl font-black text-purple-400">{ls.currentSeries}</span></div>
                    <div className="text-center px-8"><span className="block text-slate-400 text-sm uppercase mb-1">Total</span><span className="block text-6xl font-black text-slate-500">{activeEvent.totalSeries}</span></div>
                    </div>
                </>
                ) : <div className="text-slate-500 italic">Tidak ada data acara.</div>}
            </div>
            {!needsStart && activeEvent ? (
                <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center">
                    <button onClick={() => handleNav('prev')} className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300"><ChevronLeft /> PREV</button>
                    <div className="flex items-center gap-2 text-slate-400 text-sm"><Megaphone size={16} /> Announcer Control</div>
                    <div>{canGoNext ? <button onClick={() => handleNav('next')} className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg transition">NEXT <ChevronRight /></button> : <button disabled className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-slate-500 rounded-lg font-bold cursor-not-allowed border border-slate-600"><Lock size={16} /> {blockReason}</button>}</div>
                </div>
            ) : null}
        </div>
      </div>

      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold mb-4 text-red-600 flex items-center gap-2"><AlertOctagon /> Input Diskualifikasi</h2>
            <form onSubmit={(e) => { e.preventDefault(); wrapAsync(async()=> { await onAddDQ({ eventNumber: parseInt(newDQ.eventNumber), series: parseInt(newDQ.series), lane: parseInt(newDQ.lane), reason: newDQ.reason, timestamp: getWIBTime() }); setNewDQ({ eventNumber: '', series: '', lane: '', reason: '' }); }) }} className="bg-red-50 p-4 rounded-lg mb-4 border border-red-100">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Acara</label><input required type="number" value={newDQ.eventNumber} onChange={e => setNewDQ({...newDQ, eventNumber: e.target.value})} className="w-full p-2 border rounded bg-white text-center font-bold" /></div>
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Seri</label><input required type="number" value={newDQ.series} onChange={e => setNewDQ({...newDQ, series: e.target.value})} className="w-full p-2 border rounded bg-white text-center font-bold" /></div>
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Lintasan</label><input required type="number" value={newDQ.lane} onChange={e => setNewDQ({...newDQ, lane: e.target.value})} className="w-full p-2 border rounded bg-white text-center font-bold" /></div>
                </div>
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Alasan / Keterangan Pelanggaran</label>
                    <input required type="text" value={newDQ.reason} onChange={e => setNewDQ({...newDQ, reason: e.target.value})} className="w-full p-2 border rounded bg-white text-sm" placeholder="Contoh: False Start" />
                </div>
                <button className="w-full bg-red-600 hover:bg-red-700 transition text-white font-bold py-3 rounded-lg shadow">UMUMKAN DQ</button>
            </form>
            <div className="max-h-60 overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat DQ</div>
                {dqs.length === 0 ? <div className="text-slate-400 text-sm italic text-center py-4 border border-dashed rounded">Nihil.</div> : null}
                {dqs.map((dq: any) => (
                <div key={dq.id} className="p-3 border rounded-lg flex justify-between items-center text-sm bg-white hover:border-red-200 transition group">
                    <div>
                        <div className="font-bold text-slate-800">Acara {dq.eventNumber} | Seri {dq.series} | Lin <span className="bg-red-100 text-red-800 px-1.5 rounded">{dq.lane}</span></div>
                        <div className="text-red-600 font-medium text-xs mt-0.5">{dq.reason}</div>
                    </div>
                    <button onClick={() => { wrapAsync(async() => await onDeleteDQ(dq.id)) }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2"><Trash2 size={16}/></button>
                </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function CallRoomPanel({ tournament, events, updateLiveState }: any) {
  const [loading, setLoading] = useState(false);
  const ls = tournament.liveState || DEFAULT_LIVE_STATE;
  const currentCallEvent = events.find((e: any) => e.id === ls.callRoomEventId);
  const activeIdx = events.findIndex((e: any) => e.id === ls.callRoomEventId);
  const nextEvent = events[activeIdx + 1];
  const needsStart = !currentCallEvent && events.length > 0;
  
  const wrapAsync = async (fn: () => Promise<void>) => { setLoading(true); try { await fn(); } finally { setLoading(false); }};

  const handleNav = async (direction: 'next' | 'prev') => { 
      if(activeIdx === -1) return;
      let nextSeries = ls.callRoomSeries;
      let targetEvent = events[activeIdx];

      if (direction === 'next') {
          if (nextSeries < targetEvent.totalSeries) nextSeries++;
          else if (activeIdx < events.length - 1) { targetEvent = events[activeIdx + 1]; nextSeries = 1; }
      } else {
          if (nextSeries > 1) nextSeries--;
          else if (activeIdx > 0) { targetEvent = events[activeIdx - 1]; nextSeries = targetEvent.totalSeries; }
      }

      wrapAsync(async () => {
          await updateLiveState({
              callRoomEventId: targetEvent.id, callRoomEventName: targetEvent.name, callRoomEventNumber: targetEvent.number,
              callRoomEventTotalSeries: targetEvent.totalSeries, callRoomSeries: nextSeries
          });
      });
  };

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 relative">
        {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-600 text-white p-4 flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ClipboardList /> STATUS PEMANGGILAN</h2><span className="bg-emerald-800 text-xs px-2 py-1 rounded">LIVE CONTROL</span></div>
            <div className="p-12 text-center min-h-[300px] flex flex-col justify-center items-center bg-emerald-50">
              {needsStart ? (
                 <div className="animate-in fade-in zoom-in">
                    <p className="text-emerald-700 mb-4 font-medium">Siap Memanggil Peserta.</p>
                    <button onClick={() => wrapAsync(async () => {
                             const first = events[0]; 
                             await updateLiveState({ callRoomEventId: first.id, callRoomEventName: first.name, callRoomEventNumber: first.number, callRoomEventTotalSeries: first.totalSeries, callRoomSeries: 1 });
                    })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> INISIALISASI CALL ROOM</button>
                </div>
              ) : currentCallEvent ? (
                <>
                  <div className="text-emerald-700 font-bold tracking-widest uppercase mb-1">Sedang Memanggil</div>
                  <h1 className="text-3xl font-extrabold text-slate-800 mb-4">{currentCallEvent.number}. {currentCallEvent.name}</h1>
                  <div className="inline-block bg-white shadow-sm border border-emerald-200 rounded-lg p-6 mb-8"><span className="text-6xl font-black text-emerald-600">{ls.callRoomSeries}</span><span className="text-sm text-slate-400 block uppercase mt-2">Dari {currentCallEvent.totalSeries} Seri</span></div>
                  <div className="flex gap-4 justify-center"><button onClick={() => handleNav('prev')} className="px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition">Prev</button><button onClick={() => handleNav('next')} className="px-10 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg transition transform active:scale-95 flex items-center gap-2">PANGGIL NEXT <ChevronRight size={20} /></button></div>
                </>
              ) : <div className="text-slate-400 italic">Menunggu Data...</div>}
            </div>
          </div>
        </div>
        <div className="md:col-span-1 space-y-4">
           <div className="bg-slate-800 text-white p-5 rounded-xl shadow-md"><h3 className="text-slate-400 text-xs uppercase font-bold mb-2">Sedang Berlangsung di Kolam</h3><div className="text-2xl font-bold text-yellow-400">Event {ls.currentEventNumber || '-'}</div><div className="text-lg">Seri {ls.currentSeries}</div></div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><h3 className="text-slate-400 text-xs uppercase font-bold mb-3">Event Selanjutnya (Persiapan)</h3>{nextEvent ? <div><div className="font-bold text-slate-800">{nextEvent.number}. {nextEvent.name}</div><div className="text-sm text-slate-500 mt-1">{nextEvent.totalSeries} Seri</div></div> : <div className="text-slate-400 text-sm italic">Tidak ada event selanjutnya.</div>}</div>
        </div>
    </div>
  );
}