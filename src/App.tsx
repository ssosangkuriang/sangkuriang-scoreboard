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
  Upload,
  Globe,
  Activity,
  TrendingUp
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
  onSnapshot,
  setDoc
} from 'firebase/firestore';

// --- GLOBAL TYPE DECLARATIONS ---
declare global {
  var __firebase_config: any;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

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

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const appId = rawAppId.split('/')[0];

// --- UTILS ---
const getWIBTime = () => {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
};

const formatDateRange = (startStr: string, endStr?: string) => {
  if (!startStr) return '-';
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return '-';
  
  const formatOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const startFmt = start.toLocaleDateString('id-ID', formatOpt);
  
  if (!endStr || startStr.substring(0, 10) === endStr.substring(0, 10)) {
    return startFmt;
  }
  
  const end = new Date(endStr);
  if (isNaN(end.getTime())) return startFmt;
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.toLocaleDateString('id-ID', formatOpt)}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', formatOpt)}`;
  }
  return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
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

const MASTER_PIN_HASH = "1450575459"; 

const t = {
  id: {
    connecting: "Menghubungkan ke Server...",
    title_swimming_portal: "Portal Kejuaraan",
    subtitle_swimming_portal: "Pilih kompetisi untuk melihat Live Scoreboard & Jadwal",
    status_live: "Sedang Berlangsung",
    status_upcoming: "Akan Datang",
    status_finished: "Selesai",
    badge_live: "Real-Time Reporting",
    badge_upcoming: "COMING SOON",
    badge_finished: "SELESAI",
    badge_paused: "JEDA / ISTIRAHAT",
    no_tournament: "Belum ada data kejuaraan di dalam sistem.",
    footer_text: "© Sangkuriang Swim Organizer - 2026",
    role_admin: "Admin Lomba",
    role_announcer: "Announcer",
    role_callroom: "Call Room",
    role_master: "Superuser Master",
    btn_home: "Beranda",
    btn_logout: "Keluar",
    btn_results: "Hasil Acara",
    btn_results_full: "Lihat Hasil Keseluruhan",
    btn_back: "Kembali",
    call_room: "Pemanggilan",
    call_room_sub: "Call Room",
    last_update: "Terakhir Update",
    event: "Acara",
    series: "Seri",
    lane: "Lin",
    waiting: "Menunggu...",
    racing_now: "Sedang Berlomba",
    dq_info: "INFORMASI DISKUALIFIKASI TERKINI",
    dq_reason: "Keterangan / Alasan",
    dq_empty: "Tidak ada informasi diskualifikasi saat ini.",
    page: "Hal",
    of: "dari",
    prev: "Sebelumnya",
    next: "Selanjutnya",
    results_list_title: "Daftar Hasil Per Acara",
    results_detail_title: "Detail Hasil Acara",
    no: "No",
    action: "Aksi",
    view_result: "Lihat Hasil",
    not_available: "Belum tersedia",
    select_role: "Pilih Akses Petugas",
    for_tournament: "Untuk",
    login: "Masuk",
    wrong_pin: "PIN Salah",
    scheduled_on: "Lomba dijadwalkan pada:",
    paused_until: "Akan dilanjutkan pada:",
    tournament_finished: "LOMBA TELAH SELESAI",
    tournament_paused: "LOMBA SEDANG JEDA",
    tournament_upcoming: "AKAN DATANG",
    waiting_results: "Menunggu admin mengunggah hasil perlombaan...",
    
    admin_control: "Kontrol Lomba",
    current_status: "Status Saat Ini",
    status_live_caps: "SEDANG BERLANGSUNG (LIVE)",
    status_finished_caps: "SELESAI",
    status_paused_caps: "SEDANG JEDA / ISTIRAHAT",
    status_upcoming_caps: "AKAN DATANG",
    btn_start_race: "MULAI LOMBA",
    btn_pause_race: "JEDA LOMBA (ISTIRAHAT)",
    btn_finish_race: "SELESAIKAN PERTANDINGAN",
    btn_resume_race: "LANJUTKAN LOMBA",
    btn_reopen_race: "BUKA KEMBALI LOMBA (LIVE)",
    link_results_pdf: "Link Hasil Lengkap (PDF URL)",
    link_results_desc: "Gunakan link publik agar bisa dibuka oleh penonton saat lomba selesai.",
    btn_reset_race: "RESET ULANG LOMBA",
    edit_info: "Edit Informasi Lomba",
    tournament_name: "Nama Kejuaraan",
    venue: "Lokasi / Venue",
    start_date: "Tanggal Mulai",
    end_date: "Tanggal Selesai",
    btn_save_info: "SIMPAN INFORMASI",
    pin_settings: "Pengaturan PIN Akses",
    change_admin_pin: "Ubah PIN Admin Lomba",
    change_announcer_pin: "Ubah PIN Announcer",
    change_callroom_pin: "Ubah PIN Call Room",
    empty_pin_hint: "Kosongkan jika tidak diubah",
    btn_save_pins: "SIMPAN PIN BARU",
    events_list: "Daftar Acara (Events)",
    import_excel: "IMPOR EXCEL",
    event_name_placeholder: "Nama Acara (Contoh: 50m Gaya Bebas)",
    btn_add: "TAMBAH",
    col_no: "No",
    col_event_name: "Nama Acara",
    col_series: "Seri",
    col_results: "Hasil",
    col_action: "Aksi",
    results_available: "HASIL TERSEDIA",
    status_yes: "ADA",
    status_empty: "KOSONG",
    btn_save: "SIMPAN",
    btn_cancel: "BATAL",
    no_events_added: "Belum ada acara ditambahkan.",
    input_results_link: "Input Link Hasil",
    google_drive_url: "Google Drive / PDF URL",
    btn_save_link: "Simpan Link",
    set_pause_time: "Atur Waktu Jeda",
    pause_time_desc: "Pilih waktu kapan perlombaan ini akan dilanjutkan.",
    resume_time: "Waktu Dilanjutkan",
    btn_pause_now: "Jeda Lomba Sekarang",
    reset_race_title: "Reset Lomba",
    reset_race_desc: "Mengembalikan status lomba ke \"Akan Datang\" dan menghapus riwayat diskualifikasi. Masukkan PIN Superuser untuk konfirmasi.",
    btn_confirm_reset: "Konfirmasi Reset Lomba",
    finish_race_title: "Selesaikan Lomba?",
    finish_race_desc: "Penonton di beranda akan melihat halaman hasil lomba secara penuh.",
    btn_finish: "Selesaikan",
    
    callroom_status: "STATUS PEMANGGILAN",
    live_control: "LIVE CONTROL",
    ready_to_call: "Siap Memanggil Peserta.",
    btn_init_callroom: "INISIALISASI CALL ROOM",
    calling_now: "Sedang Memanggil",
    from_series: "Dari",
    btn_call_next: "PANGGIL NEXT",
    waiting_data: "Menunggu Data...",
    live_in_pool: "Sedang Berlangsung di Kolam",
    next_event_prep: "Event Selanjutnya (Persiapan)",
    no_next_event: "Tidak ada event selanjutnya.",
    in_the_next: "In The Next",
    ready_to_race: "Ready To Race"
  },
  en: {
    connecting: "Connecting to Server...",
    title_swimming_portal: "Championship Portal",
    subtitle_swimming_portal: "Select a competition to view Live Scoreboard & Schedule",
    status_live: "Live Now",
    status_upcoming: "Upcoming",
    status_finished: "Finished",
    badge_live: "Real-Time Reporting",
    badge_upcoming: "COMING SOON",
    badge_finished: "FINISHED",
    badge_paused: "PAUSED / BREAK",
    no_tournament: "No championship data in the system yet.",
    footer_text: "© Sangkuriang Swim Organizer - 2026",
    role_admin: "Event Admin",
    role_announcer: "Announcer",
    role_callroom: "Call Room",
    role_master: "Superuser Master",
    btn_home: "Home",
    btn_logout: "Logout",
    btn_results: "Results",
    btn_results_full: "View Full Results",
    btn_back: "Back",
    call_room: "Call Room",
    call_room_sub: "", 
    last_update: "Last Update",
    event: "Event",
    series: "Heat",
    lane: "Lane",
    waiting: "Waiting...",
    racing_now: "LIVE", 
    dq_info: "LATEST DISQUALIFICATION INFO",
    dq_reason: "Reason / Infraction",
    dq_empty: "No disqualification information at this time.",
    page: "Page",
    of: "of",
    prev: "Previous",
    next: "Next",
    results_list_title: "Event Results List",
    results_detail_title: "Event Result Details",
    no: "No",
    action: "Action",
    view_result: "View Result",
    not_available: "Not available",
    select_role: "Select Staff Access",
    for_tournament: "For",
    login: "Login",
    wrong_pin: "Incorrect PIN",
    scheduled_on: "Scheduled for:",
    paused_until: "Will resume at:",
    tournament_finished: "CHAMPIONSHIP HAS ENDED",
    tournament_paused: "CHAMPIONSHIP IS PAUSED",
    tournament_upcoming: "UPCOMING",
    waiting_results: "Waiting for admin to upload the results...",
    
    admin_control: "Event Control",
    current_status: "Current Status",
    status_live_caps: "IN PROGRESS (LIVE)",
    status_finished_caps: "FINISHED",
    status_paused_caps: "PAUSED / BREAK",
    status_upcoming_caps: "UPCOMING",
    btn_start_race: "START EVENT",
    btn_pause_race: "PAUSE EVENT (BREAK)",
    btn_finish_race: "FINISH EVENT",
    btn_resume_race: "RESUME EVENT",
    btn_reopen_race: "REOPEN EVENT (LIVE)",
    link_results_pdf: "Full Results Link (PDF URL)",
    link_results_desc: "Use a public link so spectators can open it when the event is finished.",
    btn_reset_race: "RESET TOURNAMENT",
    edit_info: "Edit Tournament Info",
    tournament_name: "Championship Name",
    venue: "Location / Venue",
    start_date: "Start Date",
    end_date: "End Date",
    btn_save_info: "SAVE INFORMATION",
    pin_settings: "Access PIN Settings",
    change_admin_pin: "Change Admin PIN",
    change_announcer_pin: "Change Announcer PIN",
    change_callroom_pin: "Change Call Room PIN",
    empty_pin_hint: "Leave blank if unchanged",
    btn_save_pins: "SAVE NEW PINS",
    events_list: "Events List",
    import_excel: "IMPORT EXCEL",
    event_name_placeholder: "Event Name (e.g., 50m Freestyle)",
    btn_add: "ADD",
    col_no: "No",
    col_event_name: "Event Name",
    col_series: "Heat",
    col_results: "Results",
    col_action: "Action",
    results_available: "RESULTS AVAILABLE",
    status_yes: "YES",
    status_empty: "EMPTY",
    btn_save: "SAVE",
    btn_cancel: "CANCEL",
    no_events_added: "No events added yet.",
    input_results_link: "Input Results Link",
    google_drive_url: "Google Drive / PDF URL",
    btn_save_link: "Save Link",
    set_pause_time: "Set Pause Time",
    pause_time_desc: "Select the time when this event will resume.",
    resume_time: "Resume Time",
    btn_pause_now: "Pause Event Now",
    reset_race_title: "Reset Event",
    reset_race_desc: "Reverts status to 'Upcoming' and deletes disqualification history.",
    btn_confirm_reset: "Confirm Reset Event",
    finish_race_title: "Finish Event?",
    finish_race_desc: "Spectators will see the full event results page.",
    btn_finish: "Finish",
    
    callroom_status: "CALLING STATUS",
    live_control: "LIVE CONTROL",
    ready_to_call: "Ready to Call Swimmers.",
    btn_init_callroom: "INITIALIZE CALL ROOM",
    calling_now: "Calling Now",
    from_series: "From",
    btn_call_next: "CALL NEXT",
    waiting_data: "Waiting for Data...",
    live_in_pool: "Live in the Pool",
    next_event_prep: "Next Event (Preparation)",
    no_next_event: "No next event.",
    in_the_next: "In The Next",
    ready_to_race: "Ready To Race"
  }
};

// --- DQ REASONS LISTS ---
const DQ_REASONS_RENANG = [
  "5.1.5.2 - Mengundurkan diri tanpa alasan setelah TLM/Penyisihan/Final",
  "4.1.1/4.1.3 - Menghambat start gaya bebas, dada, kupu, ganti",
  "4.2.1 - Menghambat start gaya punggung dan ganti estafet",
  "4.4 - Melakukan start sebelum tanda start",
  "2.6.1a - Pakaian tidak sesuai dengan yang diizinkan",
  "2.6.1b - Atlet tidak hadir saat dipanggil",
  "3.5 - Tidak lapor ke Call Room Judges",
  "5.2 a - (Bebas) Tidak menyentuh dinding saat pembalikan",
  "5.2 b - (Bebas) Tidak menyentuh dinding saat finish",
  "5.3 a - (Bebas) Tidak memecah permukaan air (menyelam)",
  "5.3 b - (Bebas) Kepala blm memecah air sblm 15m (start)",
  "5.3 c - (Bebas) Kepala blm memecah air sblm 15m (turn)",
  "5.4 - (Bebas) Menyelam sepenuhnya saat finish (kepala blm lewat 5m)",
  "6.1 a - (Punggung) Tidak segera mendekat ke grip",
  "6.1 b - (Punggung) Memegang grip start dgn 1 tangan",
  "6.1 c - (Punggung) Berdiri/menekuk kaki di gutter/tdk sentuh dinding",
  "6.1 d - (Punggung) Menekuk jari kaki di atas touchpad",
  "6.2 a - (Punggung) Meninggalkan posisi telentang",
  "6.2 b - (Punggung) Tolakan start posisi tidak telentang",
  "6.2 c - (Punggung) Tolakan pembalikan posisi tidak telentang",
  "6.3 a - (Punggung) Tubuh tidak memecah air selama lomba",
  "6.3 b - (Punggung) Kepala blm memecah air sblm 15m (start)",
  "6.3 c - (Punggung) Kepala blm memecah air sblm 15m (turn)",
  "6.4 a - (Punggung) Saat turn, tidak menyentuh dinding",
  "6.4 b - (Punggung) Setelah telungkup, tdk langsung membalik",
  "6.4 c - (Punggung) Meninggalkan dinding posisi tidak telentang",
  "6.4 d - (Punggung) Setelah telungkup, tarikan tangan > 1 kali",
  "6.5 a - (Punggung) Saat finish, tidak menyentuh dinding",
  "6.5 b - (Punggung) Menyelam sebelum finish (kepala blm lewat 5m)",
  "6.5 c - (Punggung) Saat finish, sentuh dinding tidak telentang",
  "7.1 a - (Dada) Tarikan melebihi pinggang > 1x (start)",
  "7.1 b - (Dada) Tarikan melebihi pinggang > 1x (turn)",
  "7.1 c - (Dada) Tendangan kupu 1x/lebih setelah gerakan dada 1 (start)",
  "7.1 d - (Dada) Tendangan kupu 1x/lebih setelah gerakan dada 1 (turn)",
  "7.1 e - (Dada) Tendangan kupu > 1x sebelum gerakan dada 1 (start)",
  "7.1 f - (Dada) Tendangan kupu > 1x sebelum gerakan dada 1 (turn)",
  "7.1 g - (Dada) Kepala blm memecah air saat tarikan ke-2 (start)",
  "7.1 h - (Dada) Kepala blm memecah air saat tarikan ke-2 (turn)",
  "7.2 a - (Dada) Gerakan setelah start tdk diawali lengan",
  "7.2 b - (Dada) Gerakan setelah start diawali lengan selain dada",
  "7.2 c - (Dada) Gerakan setelah turn tdk diawali lengan",
  "7.2 d - (Dada) Gerakan setelah turn diawali lengan selain dada",
  "7.2 e - (Dada) Posisi badan tidak telungkup",
  "7.3 a - (Dada) Meninggalkan dinding setelah pembalikan, badan tidak telungkup",
  "7.3 b - (Dada) Siklus tdk 1 tarikan & 1 tendangan",
  "7.3 c - (Dada) Gerakan tangan tdk bersamaan",
  "7.4 a - (Dada) Tangan tidak didorong ke depan bersama-sama",
  "7.4 b - (Dada) Kedua siku tidak berada di bawah permukaan air",
  "7.4 c - (Dada) Tarikan tangan melebihi garis pinggang",
  "7.5 a - (Dada) Kepala tidak memecah air selama 1 siklus",
  "7.5 b - (Dada) Gerakan tungkai tidak bersamaan (bergantian)",
  "7.6 a - (Dada) Tendangan kaki tidak diputar keluar",
  "7.6 b - (Dada) Melakukan gerakan tungkai kupu (flutter/crawl) saat lomba",
  "7.6 c - (Dada) Melakukan gerakan tungkai kupu setelah start",
  "7.6 d - (Dada) Melakukan gerakan tungkai kupu setelah pembalikan",
  "7.6 e - (Dada) Melakukan gerakan tungkai kupu sebelum finish",
  "7.7 a - (Dada) Saat turn, tangan menumpuk",
  "7.7 b - (Dada) Saat turn, sentuh dinding dgn 1 tangan",
  "7.7 c - (Dada) Saat turn, tangan tidak bersamaan",
  "7.7 d - (Dada) Saat turn, sentuh dinding dgn kaki (salto)",
  "7.7 e - (Dada) Saat finish, tangan menumpuk",
  "7.7 f - (Dada) Saat finish, sentuh dinding dgn 1 tangan",
  "7.7 g - (Dada) Saat finish, tangan tidak bersamaan",
  "7.7 h - (Dada) Selama siklus sblm turn, kepala tdk memecah air",
  "7.7 i - (Dada) Selama siklus sblm finish, kepala tdk memecah air",
  "8.1 - (Kupu) Posisi badan tidak telungkup selama lomba",
  "8.2 - (Kupu) Meninggalkan dinding setelah turn tidak telungkup",
  "8.3 a - (Kupu) Kedua lengan dibawa ke depan tidak bersamaan",
  "8.3 b - (Kupu) Kedua lengan dibawa ke depan tidak di atas air",
  "8.3 c - (Kupu) Kedua lengan ditarik ke belakang tidak bersamaan",
  "8.3 d - (Kupu) Awal gerakan dibawa ke depan tidak dgn 2 tangan (start)",
  "8.3 e - (Kupu) Awal gerakan dibawa ke depan tidak dgn 2 tangan (turn)",
  "8.4 a - (Kupu) Gerakan tungkai tidak bersamaan",
  "8.4 b - (Kupu) Tungkai melakukan gerakan lain",
  "8.5 a - (Kupu) Saat turn, sentuh dinding dgn tangan menumpuk",
  "8.5 b - (Kupu) Saat turn, sentuh dinding dgn 1 tangan",
  "8.5 c - (Kupu) Saat turn, tangan tidak bersamaan",
  "8.5 d - (Kupu) Saat turn, sentuh dinding dgn kaki (salto)",
  "8.5 e - (Kupu) Saat finish, sentuh dinding dgn tangan menumpuk",
  "8.5 f - (Kupu) Saat finish, sentuh dinding dgn 1 tangan",
  "8.5 g - (Kupu) Saat finish, tangan tidak bersamaan",
  "8.6 a - (Kupu) Tubuh tidak memecah air selama lomba",
  "8.6 b - (Kupu) Tarikan pertama tdk membawa tubuh ke permukaan (start)",
  "8.6 c - (Kupu) Tarikan pertama tdk membawa tubuh ke permukaan (turn)",
  "8.6 d - (Kupu) Gerakan lengan > 1x di bawah air (start)",
  "8.6 e - (Kupu) Gerakan lengan > 1x di bawah air (turn)",
  "8.6 f - (Kupu) Kepala blm memecah air sblm 15m (start)",
  "8.6 g - (Kupu) Kepala blm memecah air sblm 15m (turn)",
  "8.6 h - (Kupu) Menyelam sepenuhnya saat finish",
  "8.6 i - (Kupu) Menyelam sepenuhnya selama lomba",
  "9.1 - (Ganti) Berenang dengaan gaya punggung, dada, atau kupu pada bagian gaya bebas",
  "9.1 a - (Ganti) Salah urutan gaya ganti individu",
  "9.1 b - (Ganti) Salah satu gaya lebih/kurang dari 1/4 jarak (individu)",
  "9.2 a - (Ganti) Salah urutan gaya ganti estafet",
  "9.2 b - (Ganti) Salah satu gaya lebih/kurang dari 1/4 jarak (estafet)",
  "9.3 a - (Ganti) Porsi gaya bebas tidak telungkup",
  "9.3 b - (Ganti) Pergantian dada ke bebas tidak sah",
  "9.4 - (Ganti) Menyelesaikan jarak tdk sesuai aturan gaya",
  "10.1 - Berlomba tidak sesuai kelompok jenis kelamin",
  "10.2.1 a - Tidak menyelesaikan jarak (individu)",
  "10.2.1 b - Tidak menyelesaikan 1/4 jarak (estafet)",
  "10.2.2 a - Melintas ke lintasan lain",
  "10.2.2 b - Finish tidak pada lintasan yg sama saat start",
  "10.2.3 a - Saat turn tidak menyentuh dinding",
  "10.2.3 b - Membalik dari dasar kolam",
  "10.2.4 a - Berdiri di dasar kolam (kecuali gaya bebas)",
  "10.2.4 b - Melangkah di dasar kolam",
  "10.2.4 c - Berjalan di dasar kolam",
  "10.2.5 - Menarik tali lintasan",
  "10.2.6 a - Menghalangi Atlet lain",
  "10.2.6 b - Menghentikan timing system",
  "10.2.7 - Atlet tdk terdaftar masuk ke kolam",
  "10.2.8 - Setelah finish, tdk segera naik & mengganggu",
  "10.2.9 a - Bertindak pengatur kecepatan",
  "10.2.9 b - Memakai perangkat pengatur kecepatan",
  "10.4.1 a - Anggota estafet < 4 Atlet",
  "10.4.1 b - Anggota estafet campuran tidak 2 Pa 2 Pi",
  "10.4.2 a - Terlambat serahkan form urutan",
  "10.4.2 b - Urutan Atlet tidak sesuai form",
  "10.4.2.1 a - Ganti anggota estafet tanpa ket dokter",
  "10.4.2.1 b - Ganti anggota estafet tanpa izin",
  "10.4.2.2 - Anggota estafet tidak memenuhi syarat",
  "10.4.4 - Pergantian relay tidak dari starting platform",
  "10.4.5 - Meninggalkan platform sblm Atlet terdahulu finish",
  "10.4.6 - Anggota estafet bkn giliran masuk ke kolam",
  "10.4.7 - Setelah finish, estafet tdk segera naik",
  "Lain - Pakaian tidak memenuhi syarat (approval of World Aquatics) 6.1",
  "Lain - Atlet memakai pakaian transparan, memiliki nilai moral yang tidak baik, dan simbol yang menyinggung 6.3",
  "Lain - Setiap penggunaan iklan (pada pakaian, topi, kaca mata) tidak sesuai peraturan World Aquatics  7.1",
  "Lain - Pakaian perempuan menutup leher dan bahu, pakaian laki-laki di bawah lutut di atas pusar 6.8.12",
  "Lain - Atlet menggunakan perangkat atau pakaian renang apapun yang membantu kecepatan, daya apung, daya tahan dan transfer data 14.2",
  "Lain - Atlet menggunakan perangkat yang dapat mengirim data, suara, atau sinyal kepada Atlet 14.3",
  "Lain - Atlet menggunakan plester di badan dan melilit lebih dari dua jari (tangan atau kaki) 14.4",
  "Lainnya (Input Manual)"
];

const DQ_REASONS_SELAM = [
  "2.1.5.1 - ESTAFET 4 anggota estafet jenis kelamin tdk sama",
  "2.1.5.1 - ESTAFET Peralatan berbeda",
  "2.1.5.2 - ESTAFET Susunan tdk sesuai (Pa-Pi-Pa-Pi)",
  "2.2.1.2 - (SF) Setelah start snorkel/kepala muncul lwt 15m",
  "2.2.1.3 - (SF) Bagian tubuh/alat tdk muncul di permukaan",
  "2.2.1.4 - (SF) Tidak menggunakan snorkel",
  "2.2.2.4.3 - (AP) Alat/badan/jidat keluar air. Mata/hidung/mulut di dlm air",
  "2.2.2.4.4 - (AP) Alat, badan, wajah (jidat, mata, hidung, mulut) keluar air",
  "2.2.2.5 - (AP) Saat finish tidak sentuh dinding/papan",
  "2.2.4.1 - (BF) Tidak pakai gaya bebas (crawl) & snorkel",
  "2.2.4.3 - (BF) Setelah start/turn snorkel/kepala muncul lwt 15m",
  "2.2.4.4 - (BF) Saat start posisi kaki/fins tidak sejajar",
  "START - Mendahului aba-aba start",
  "START - (Estafet) Mendahului peselam datang sentuh dinding",
  "BALIKAN - Tubuh/peralatan tidak sentuh dinding (8.1.3.3)",
  "BALIKAN - Snorkel/kepala memecah air lwt 15m",
  "LAIN - Berpindah lintasan / tidak di posisi",
  "LAIN - Keluar melalui papan sentuh/startblock (8.1.4.3)",
  "LAIN - Mencapai finish perlengkapan tidak lengkap (8.1.4.5)",
  "LAIN - Tidak menyelesaikan lomba / tdk mencapai finish",
  "LAIN - Pakaian tidak sesuai aturan CMAS",
  "LAIN - Menggunakan kaos kaki / pakaian double",
  "LAIN - Menggunakan selotip pada tubuh (kinesio tape)",
  "Lainnya (Input Manual)"
];


type LangType = 'id' | 'en';

function useLiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return time;
}

const ClockDisplay = ({ time }: { time: Date }) => (
  <div className="font-mono text-base md:text-xl font-bold text-white tracking-widest flex items-center justify-center min-w-[110px] md:min-w-[130px]">
    {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
  </div>
);

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
  pauseUntil?: string | null; 
};

type Tournament = {
  id: string;
  title: string;
  venue: string;
  eventDate: string; 
  endDate?: string;
  status: 'upcoming' | 'live' | 'paused' | 'finished';
  resultUrl: string; 
  sportType: 'Renang' | 'Selam'; 
  pins: { admin: string, announcer: string, callroom: string };
  liveState: LiveState;
  createdAt: number;
};

type EventItem = { id: string; tournamentId: string; number: number; name: string; totalSeries: number; resultUrl?: string; };
type DQRecord = { id: string; tournamentId: string; eventNumber: number; series: number; lane: number; reason: string; timestamp: string; createdAt: number; };

// --- DEFAULT STATES ---
const DEFAULT_LIVE_STATE: LiveState = {
  currentEventId: null, currentSeries: 1, callRoomEventId: null, callRoomSeries: 1, lastUpdate: '-', callRoomLastUpdate: '-'
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [viewMode, setViewMode] = useState<'global' | 'tournament' | 'master_dashboard'>('global');
  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [role, setRole] = useState<'master' | 'admin' | 'announcer' | 'callroom' | 'public' | null>(null);
  const [lang, setLang] = useState<LangType>('id');
  const [hasSelectedLang, setHasSelectedLang] = useState<boolean>(false);
  
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [targetLoginRole, setTargetLoginRole] = useState<'master' | 'admin' | 'announcer' | 'callroom' | null>(null);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [allDqs, setAllDqs] = useState<DQRecord[]>([]);
  
  const [masterPinHash, setMasterPinHash] = useState(MASTER_PIN_HASH);

  // --- SISTEM HEARTBEAT ANALYTICS ---
  useEffect(() => {
    // Bikin ID sesi unik untuk pengunjung ini
    const sessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const presenceRef = doc(db, 'artifacts', appId, 'public', 'data', 'presence', sessionId);

    // Fungsi untuk lapor status aktif ke database
    const updatePresence = async () => {
        try { await setDoc(presenceRef, { lastSeen: Date.now() }); } catch(e){}
    };

    // Lapor sekarang, lalu lapor ulang tiap 60 detik
    updatePresence();
    const interval = setInterval(updatePresence, 60000); 

    // Hapus data kalau pengunjung menutup tab/browser
    const cleanup = () => { deleteDoc(presenceRef).catch(()=>{}); };
    window.addEventListener('beforeunload', cleanup);

    return () => {
        clearInterval(interval);
        cleanup();
        window.removeEventListener('beforeunload', cleanup);
    }
  }, []);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const activeEvents = allEvents.filter(e => e.tournamentId === activeTournamentId).sort((a, b) => a.number - b.number);
  const activeDqs = allDqs.filter(d => d.tournamentId === activeTournamentId).sort((a, b) => b.createdAt - a.createdAt);

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

    const unsubSettings = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().pinHash) {
          setMasterPinHash(docSnap.data().pinHash);
        }
      },
      (error) => console.warn("Sinkronisasi Settings ditunda", error.message)
    );

    return () => { unsubTournaments(); unsubEvents(); unsubDqs(); unsubSettings(); };
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

  const handleResetTournament = async (id: string, dqIds: string[]) => {
    if (!user) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', id), {
      status: 'upcoming',
      liveState: DEFAULT_LIVE_STATE,
      resultUrl: ''
    });
    for (const dqId of dqIds) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dqs', dqId));
    }
  };

  const updateLiveState = async (newState: Partial<LiveState>) => {
    if (!user || !activeTournamentId) return;
    
    const updatePayload: Record<string, any> = {};
    Object.entries(newState).forEach(([key, value]) => {
      updatePayload[`liveState.${key}`] = value;
    });

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tournaments', activeTournamentId), updatePayload);
  };

  const processLogin = (roleName: string, pin: string) => {
    const hashed = simpleHash(pin);
    if (roleName === 'master') {
      if (hashed === masterPinHash) {
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

  if (!user) return <div className="h-screen flex items-center justify-center text-slate-500 font-sans gap-2 bg-slate-950"><Loader2 className="animate-spin"/> {t[lang].connecting}</div>;

  if (!hasSelectedLang) {
    return <LanguageSplash setLang={setLang} onSelect={() => setHasSelectedLang(true)} />;
  }

  return (
    <>
      {showLoginModal && (
        <LoginModal 
          targetRole={targetLoginRole} 
          onClose={() => setShowLoginModal(false)}
          onLogin={processLogin}
          lang={lang}
          t={t}
        />
      )}

      {viewMode === 'global' && (
        <GlobalLandingPage 
          tournaments={tournaments}
          onSelectTournament={(id: string) => { setActiveTournamentId(id); setRole('public'); setViewMode('tournament'); }}
          onMasterLogin={() => { setTargetLoginRole('master'); setShowLoginModal(true); }}
          lang={lang} setLang={setLang} t={t}
        />
      )}

      {viewMode === 'master_dashboard' && role === 'master' && (
        <MasterDashboard 
          tournaments={tournaments}
          onCreate={handleCreateTournament}
          onEdit={(id: string) => { setActiveTournamentId(id); setRole('admin'); setViewMode('tournament'); }}
          onDelete={handleDeleteTournament}
          onLogout={() => { setRole(null); setViewMode('global'); }}
          onChangeMasterPin={async (newPin: string) => {
            if (user) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'master'), { pinHash: simpleHash(newPin) });
              alert('PIN Superuser berhasil diperbarui!');
            }
          }}
          lang={lang} t={t}
        />
      )}

      {viewMode === 'tournament' && activeTournament && (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          {role === 'public' ? (
            <TournamentPublicView 
              tournament={activeTournament} dqs={activeDqs} events={activeEvents} isOnline={isOnline}
              onBack={() => { setActiveTournamentId(null); setViewMode('global'); }}
              onLoginRequest={() => { setRole(null); }}
              lang={lang} setLang={setLang} t={t}
            />
          ) : !role ? (
            <RoleSelectionPanel 
              tournament={activeTournament}
              onBack={() => { setRole('public'); }} 
              onLoginRequest={(r:any) => { setTargetLoginRole(r); setShowLoginModal(true); }} 
              lang={lang} t={t}
            />
          ) : (
            <div className="flex flex-col min-h-screen">
               <Header role={role} isOnline={isOnline} lang={lang} setLang={setLang} t={t} onHome={() => { setRole('public'); }} onLogout={() => { setRole('public'); }} />
               <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
                  {role === 'admin' && (
                    <AdminPanel 
                      tournament={activeTournament} events={activeEvents}
                      masterPinHash={masterPinHash}
                      onUpdateTournament={(data: any) => handleUpdateTournament(activeTournament.id, data)}
                      onAddEvent={async (data: any) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...data, tournamentId: activeTournament.id }); }}
                      onAddMultipleEvents={async (eventsData: any[]) => {
                        if (user) {
                          const promises = eventsData.map(data => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...data, tournamentId: activeTournament.id }));
                          await Promise.all(promises);
                        }
                      }}
                      onEditEvent={async (id: string, data: any) => { if(user) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id), data); }}
                      onDeleteEvent={async (id: string) => { if(user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); }}
                      onResetTournament={async () => await handleResetTournament(activeTournament.id, activeDqs.map(d => d.id))}
                      lang={lang} t={t}
                    />
                  )}
                  {role === 'announcer' && (
                    <AnnouncerPanel 
                      tournament={activeTournament} events={activeEvents} dqs={activeDqs} updateLiveState={updateLiveState}
                      onAddDQ={async (data: any) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'dqs'), { ...data, tournamentId: activeTournament.id, createdAt: Date.now() }); }}
                      onDeleteDQ={async (id: string) => { if(user) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'dqs', id)); }}
                      lang={lang} t={t}
                    />
                  )}
                  {role === 'callroom' && (
                    <CallRoomPanel tournament={activeTournament} events={activeEvents} updateLiveState={updateLiveState} lang={lang} t={t} />
                  )}
               </main>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const Header = ({ role, onHome, onLogout, isOnline, lang, setLang, t }: any) => {
  const currentTime = useLiveClock();

  return (
    <header className="bg-slate-900 text-white p-3 sm:p-4 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center relative">
        <div className="flex items-center gap-2 sm:gap-3">
          {role === 'admin' && <Settings className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />}
          {role === 'announcer' && <Mic className="text-purple-400 w-5 h-5 sm:w-6 sm:h-6" />}
          {role === 'callroom' && <Users className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" />}
          <div>
            <span className="font-bold text-sm sm:text-lg uppercase leading-none block">{role === 'admin' ? t[lang].role_admin : role === 'announcer' ? t[lang].role_announcer : t[lang].role_callroom}</span>
            <span className={`text-[9px] sm:text-[10px] flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>
              {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />} {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700/50 flex-col items-center hidden md:flex">
           <span className="text-[8px] text-slate-400 uppercase font-bold tracking-[0.2em] -mb-1">Time</span>
           <ClockDisplay time={currentTime} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
           <div className="md:hidden mr-1 text-right">
              <span className="text-[8px] text-slate-400 uppercase font-bold block mb-0.5">Time</span>
              <div className="text-xs font-mono font-bold">{currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
           </div>

           <button 
             onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
             className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 transition"
             title="Switch Language"
           >
             <Globe size={16} className="text-blue-400 sm:w-4 sm:h-4" />
             <span className="font-bold text-xs hidden sm:inline sm:ml-1.5">{lang === 'id' ? 'ID' : 'EN'}</span>
           </button>
           <button onClick={onHome} className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl transition border border-slate-700" title="Home">
             <Home size={16} className="text-slate-300 sm:w-4 sm:h-4" />
             <span className="text-xs text-slate-300 hidden sm:inline sm:ml-1.5">{t[lang].btn_home}</span>
           </button>
           <button onClick={onLogout} className="flex items-center justify-center bg-red-600 hover:bg-red-700 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl transition shadow-md" title="Logout">
             <LogOut size={16} className="text-white sm:w-4 sm:h-4" />
             <span className="text-xs font-bold text-white hidden sm:inline sm:ml-1.5">{t[lang].btn_logout}</span>
           </button>
        </div>
      </div>
    </header>
  );
};

const LogoBar = ({ onMasterLogin, lang, setLang }: any) => {
  return (
    <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center relative">
        <div className="flex items-center gap-3">
            <img src="/sangkuriang%201.png" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
            <div className="font-bold leading-tight text-white flex flex-col justify-center">
              <div className="text-base sm:text-xl">SANGKURIANG</div>
              <div className="text-blue-400 text-[8px] sm:text-[10px] tracking-widest sm:tracking-[0.2em]">SWIM ORGANIZER</div>
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <button 
             onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
             className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white px-2 sm:px-3 py-1.5 rounded-full border border-slate-700 transition"
             title="Switch Language"
          >
             <Globe size={14} className="text-blue-400" />
             <span className="font-bold text-[10px] sm:text-xs ml-1.5">{lang === 'id' ? 'ID' : 'EN'}</span>
          </button>

          {onMasterLogin && (
            <button onClick={onMasterLogin} className="text-[10px] sm:text-xs text-slate-500 hover:text-white flex gap-1 items-center transition bg-slate-800 px-2 sm:px-3 py-1.5 rounded-full border border-slate-700">
              <ShieldAlert size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Master</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const TourCard = ({ tour, badge, badgeColor, onSelectTournament, lang }: any) => (
  <div onClick={() => onSelectTournament(tour.id)} className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl hover:border-blue-500 transition-colors cursor-pointer group text-left">
      <div className="flex justify-between items-start mb-4">
        <span className={`${badgeColor} text-[10px] sm:text-xs px-2 py-1 rounded font-bold uppercase`}>{badge}</span>
        <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-700 text-blue-300">{tour.sportType === 'Selam' ? (lang === 'id' ? 'Selam' : 'Finswimming') : (lang === 'id' ? 'Renang' : 'Swim')}</span>
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition">{tour.title}</h3>
      <div className="text-xs sm:text-sm text-slate-400 mb-2 flex items-center gap-2"><MapPin size={14} className="shrink-0"/> <span className="truncate">{tour.venue}</span></div>
      <div className="text-xs sm:text-sm text-slate-400 flex items-center gap-2"><Calendar size={14} className="shrink-0"/> {formatDateRange(tour.eventDate, tour.endDate)}</div>
  </div>
);

function GlobalLandingPage({ tournaments, onSelectTournament, onMasterLogin, lang, setLang, t }: any) {
  const [activeTab, setActiveTab] = useState<'Renang' | 'Selam'>('Renang');

  const filteredTournaments = tournaments.filter((tour: any) => tour.sportType === activeTab || (!tour.sportType && activeTab === 'Renang'));

  const activeTournaments = filteredTournaments.filter((tour: any) => tour.status === 'live' || tour.status === 'paused');
  const upcoming = filteredTournaments.filter((tour: any) => tour.status === 'upcoming');
  const finished = filteredTournaments.filter((tour: any) => tour.status === 'finished');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-y-auto">
      <LogoBar onMasterLogin={onMasterLogin} lang={lang} setLang={setLang} />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 py-8 sm:py-12">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">{t[lang].title_swimming_portal}</h1>
          <p className="text-slate-400 text-sm sm:text-lg px-4">{t[lang].subtitle_swimming_portal}</p>
        </div>

        <div className="flex justify-center mb-8">
            <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-800">
                <button 
                    onClick={() => setActiveTab('Renang')} 
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all ${activeTab === 'Renang' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                    {lang === 'id' ? 'Renang' : 'Swim'}
                </button>
                <button 
                    onClick={() => setActiveTab('Selam')} 
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm sm:text-base transition-all ${activeTab === 'Selam' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                    {lang === 'id' ? 'Selam' : 'Finswimming'}
                </button>
            </div>
        </div>

        {activeTournaments.length > 0 ? (
          <div className="mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><MonitorPlay className="text-red-500 w-5 h-5 sm:w-6 sm:h-6"/> {t[lang].status_live}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeTournaments.map((tour:any) => <TourCard key={tour.id} tour={tour} badge={tour.status === 'paused' ? t[lang].badge_paused : t[lang].badge_live} badgeColor={tour.status === 'paused' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30'} onSelectTournament={onSelectTournament} lang={lang} />)}
            </div>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><Timer className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6"/> {t[lang].status_upcoming}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {upcoming.map((tour:any) => <TourCard key={tour.id} tour={tour} badge={t[lang].badge_upcoming} badgeColor="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" onSelectTournament={onSelectTournament} lang={lang} />)}
            </div>
          </div>
        ) : null}

        {finished.length > 0 ? (
          <div className="mb-10 sm:mb-12 opacity-80">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 border-b border-slate-800 pb-2"><CheckCircle className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6"/> {t[lang].status_finished}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {finished.map((tour:any) => <TourCard key={tour.id} tour={tour} badge={t[lang].badge_finished} badgeColor="bg-[#1e3a8a] text-blue-300 border border-[#1e40af]" onSelectTournament={onSelectTournament} lang={lang} />)}
            </div>
          </div>
        ) : null}
        
        {filteredTournaments.length === 0 ? (
            <div className="text-center text-slate-500 py-16 sm:py-20 italic text-sm sm:text-base">
              {lang === 'id' ? `Belum ada data kejuaraan ${activeTab === 'Renang' ? 'Renang' : 'Selam'} di dalam sistem.` : `No ${activeTab === 'Renang' ? 'Swim' : 'Finswimming'} championship data in the system yet.`}
            </div>
        ) : null}
      </div>
      <footer className="bg-slate-950 text-slate-600 py-3 sm:py-4 text-center text-[10px] sm:text-xs border-t border-slate-900 shrink-0">{t[lang].footer_text}</footer>
    </div>
  );
}

function MasterDashboard({ tournaments, onCreate, onEdit, onDelete, onLogout, onChangeMasterPin, lang, t }: any) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', venue: '', eventDate: '', endDate: '', sportType: 'Renang', adminPin: '1234', announcerPin: '1234', callroomPin: '1234' });

  const [showPinModal, setShowPinModal] = useState(false);
  const [newMasterPin, setNewMasterPin] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [masterAlert, setMasterAlert] = useState('');

  // --- STATE ANALYTICS ---
  const [liveViewers, setLiveViewers] = useState(0);
  const [peakStats, setPeakStats] = useState({ peak: 0, timestamp: 0 });

  // Tarik data pengunjung aktif dan rekor tertinggi
  useEffect(() => {
     const unsubPresence = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'presence'), (snap) => {
         const now = Date.now();
         // Hitung hanya yang memancarkan sinyal dalam 90 detik terakhir
         const activeCount = snap.docs.map(d => d.data()).filter(d => now - d.lastSeen < 90000).length;
         setLiveViewers(activeCount);
     });

     const unsubPeak = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'peak'), (docSnap) => {
         if(docSnap.exists()) {
             setPeakStats(docSnap.data() as any);
         }
     });

     return () => { unsubPresence(); unsubPeak(); }
  }, []);

  // Update rekor kalau jumlah live mengalahkan rekor sebelumnya
  useEffect(() => {
     if (liveViewers > peakStats.peak) {
         setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'analytics', 'peak'), {
             peak: liveViewers,
             timestamp: Date.now()
         }).catch(()=>{});
     }
  }, [liveViewers, peakStats.peak]);

  const handleCreate = (e: any) => {
    e.preventDefault();
    onCreate({
      title: form.title, venue: form.venue, eventDate: new Date(form.eventDate).toISOString(), endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date(form.eventDate).toISOString(), resultUrl: '',
      sportType: form.sportType as 'Renang' | 'Selam',
      pins: { admin: simpleHash(form.adminPin), announcer: simpleHash(form.announcerPin), callroom: simpleHash(form.callroomPin) }
    });
    setShowCreate(false);
  };

  const handleUpdatePin = (e: any) => {
    e.preventDefault();
    if (newMasterPin.trim().length > 0) {
      onChangeMasterPin(newMasterPin);
      setShowPinModal(false);
      setNewMasterPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="font-bold text-xl flex items-center gap-2"><ShieldAlert className="text-blue-400"/> {t[lang].role_master}</div>
          <div className="flex gap-3">
             <button onClick={() => setShowPinModal(true)} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Lock size={16}/> Ubah PIN</button>
             <button onClick={onLogout} className="bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><LogOut size={16}/> {t[lang].btn_logout}</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto p-6">
         {masterAlert && <div className="mb-4 bg-emerald-100 border border-emerald-400 text-emerald-700 px-4 py-3 rounded relative" role="alert"><span className="block sm:inline">{masterAlert}</span></div>}
         
         {/* --- ANALYTICS DASHBOARD --- */}
         <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
             <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-blue-600"/> Real-time Analytics</h2>
             <div className="grid md:grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center gap-4 shadow-inner">
                     <div className="bg-red-100 text-red-500 p-4 rounded-full"><Users size={32} /></div>
                     <div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Viewers Saat Ini</div>
                         <div className="text-4xl font-black text-slate-800 flex items-center gap-3 mt-1">
                             {liveViewers} <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full animate-pulse font-bold tracking-widest">LIVE</span>
                         </div>
                     </div>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 flex items-center gap-4 shadow-inner">
                     <div className="bg-blue-100 text-blue-500 p-4 rounded-full"><TrendingUp size={32} /></div>
                     <div>
                         <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Peak Viewers (Rekor)</div>
                         <div className="text-4xl font-black text-slate-800 mt-1">{peakStats.peak}</div>
                         <div className="text-[10px] text-slate-400 mt-1.5 font-mono bg-slate-200 inline-block px-2 py-0.5 rounded">
                             TERCAPAI: {peakStats.timestamp ? new Date(peakStats.timestamp).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                         </div>
                     </div>
                 </div>
             </div>
         </div>
         {/* --- END ANALYTICS DASHBOARD --- */}

         <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Daftar Semua Lomba</h2>
            <div className="flex gap-2">
               <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm transition"><Plus size={18}/> Buat Lomba Baru</button>
            </div>
         </div>

         {showCreate && (
            <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 mb-8 grid md:grid-cols-2 gap-6 animate-in fade-in">
               <div className="space-y-4">
                  <h3 className="font-bold text-blue-900 border-b pb-2">Informasi Umum</h3>
                  <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kejuaraan</label>
                          <input required type="text" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} className="w-full p-2 border rounded bg-slate-50" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                          <label className="block text-xs font-bold text-slate-500 mb-1">Cabang Olahraga</label>
                          <select value={form.sportType} onChange={e=>setForm({...form, sportType: e.target.value})} className="w-full p-2 border rounded bg-slate-50">
                              <option value="Renang">Renang (Swim)</option>
                              <option value="Selam">Selam (Finswimming)</option>
                          </select>
                      </div>
                  </div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1">Lokasi / Venue</label><input required type="text" value={form.venue} onChange={e=>setForm({...form, venue: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Mulai</label><input required type="date" value={form.eventDate} onChange={e=>setForm({...form, eventDate: e.target.value})} className="w-full p-2 border rounded bg-slate-50" /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Selesai</label><input required type="date" value={form.endDate} onChange={e=>setForm({...form, endDate: e.target.value})} className="w-full p-2 border rounded bg-slate-50" min={form.eventDate} /></div>
                  </div>
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
              <thead className="bg-slate-50 border-b"><tr><th className="p-4 font-bold text-slate-600">Lomba</th><th className="p-4 font-bold text-slate-600">Cabang</th><th className="p-4 font-bold text-slate-600">Status</th><th className="p-4 font-bold text-slate-600 text-right">Aksi</th></tr></thead>
              <tbody>
                {tournaments.map((tItem:any) => (
                  <tr key={tItem.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-bold text-blue-900 text-lg">{tItem.title}</div>
                      <div className="text-sm text-slate-500">{formatDateRange(tItem.eventDate, tItem.endDate)} | {tItem.venue}</div>
                    </td>
                    <td className="p-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${tItem.sportType === 'Selam' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                         {tItem.sportType === 'Selam' ? (lang === 'id' ? 'Selam' : 'Finswimming') : (lang === 'id' ? 'Renang' : 'Swim')}
                       </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${tItem.status === 'live' ? 'bg-red-100 text-red-600' : tItem.status === 'finished' ? 'bg-blue-100 text-blue-600' : tItem.status === 'paused' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}>{tItem.status}</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => onEdit(tItem.id)} className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-sm hover:bg-slate-700 transition shadow">Kelola Event (Admin)</button>
                      <button onClick={() => setDeleteId(tItem.id)} className="bg-red-50 text-red-500 hover:bg-red-100 px-3 py-2 rounded transition"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </main>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative zoom-in-95 duration-200 shadow-2xl">
            <button type="button" onClick={() => {setShowPinModal(false); setNewMasterPin('');}} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
            <h2 className="text-xl font-bold text-center mb-3 text-slate-800 flex justify-center items-center gap-2"><Lock /> Ubah PIN Master</h2>
            <p className="text-center text-slate-500 text-sm mb-6">Masukkan PIN baru untuk akses Superuser Master.</p>
            <form onSubmit={handleUpdatePin}>
              <input autoFocus type="password" value={newMasterPin} onChange={e=>setNewMasterPin(e.target.value)} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="PIN BARU" required />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">Simpan PIN Baru</button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative shadow-2xl text-center">
            <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-red-600"><Trash2 /> Hapus Lomba?</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Tindakan ini permanen dan tidak dapat dibatalkan. Seluruh data acara dan diskualifikasi pada lomba ini akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition">Batal</button>
              <button onClick={() => {
                onDelete(deleteId);
                setDeleteId(null);
              }} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentPublicView({ tournament, dqs, events, isOnline, onBack, onLoginRequest, lang, setLang, t }: any) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showPdf, setShowPdf] = useState(false);
  const [showResultsList, setShowResultsList] = useState(false);
  const [showPdfUrl, setShowPdfUrl] = useState<string | null>(null);
  
  const currentTime = useLiveClock();

  const eventsWithResults = events.filter((ev: any) => ev.resultUrl);
  const currentResultIndex = eventsWithResults.findIndex((ev: any) => ev.resultUrl === showPdfUrl);

  const handleNextResult = () => {
    if (currentResultIndex < eventsWithResults.length - 1) {
      setShowPdfUrl(eventsWithResults[currentResultIndex + 1].resultUrl);
    }
  };

  const handlePrevResult = () => {
    if (currentResultIndex > 0) {
      setShowPdfUrl(eventsWithResults[currentResultIndex - 1].resultUrl);
    }
  };

  useEffect(() => {
    if (tournament.status === 'live' || tournament.status === 'finished') return;
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      let targetDateStr = tournament.status === 'paused' ? tournament.liveState?.pauseUntil : tournament.eventDate;
      
      if (!targetDateStr) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const targetDate = new Date(targetDateStr);
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
  }, [tournament.eventDate, tournament.status, tournament.liveState?.pauseUntil]);

  if (tournament.status === 'live') {
    return <LiveScoreboard tournament={tournament} dqs={dqs} events={events} isOnline={isOnline} onBack={onBack} onLoginRequest={onLoginRequest} lang={lang} setLang={setLang} t={t} />;
  }

  const isFinished = tournament.status === 'finished';

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col relative overflow-hidden">
      {showPdf && tournament.resultUrl ? (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 animate-in fade-in">
          <div className="flex justify-between items-center mb-4 text-white">
            <h2 className="font-bold text-lg flex items-center gap-2"><FileText /> {t[lang].btn_results_full}</h2>
            <button onClick={() => setShowPdf(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><X /></button>
          </div>
          <iframe src={tournament.resultUrl} className="flex-1 w-full rounded-lg bg-white" title="Hasil Lomba"></iframe>
        </div>
      ) : null}

      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
      
      <header className="bg-slate-900/80 backdrop-blur-md text-white h-auto shrink-0 flex flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-800 z-50">
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <img src="/sangkuriang%201.png" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
          <div className="flex flex-col justify-center">
            <h1 className="font-extrabold text-sm sm:text-lg leading-none tracking-wide uppercase">Sangkuriang</h1>
            <p className="text-[8px] sm:text-xs text-blue-400 font-bold tracking-[0.2em] uppercase">Swim Organizer</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
          <span className={`text-[10px] hidden sm:flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>{isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}</span>
          
          <button 
            onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 transition"
            title="Switch Language"
          >
            <Globe size={18} className="text-blue-400 sm:w-4 sm:h-4" />
            <span className="font-bold text-xs hidden sm:inline sm:ml-1.5">{lang === 'id' ? 'ID' : 'EN'}</span>
          </button>

          {(tournament.status === 'paused' || isFinished) && (
            <button onClick={() => setShowResultsList(true)} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-md" title={t[lang].btn_results}>
              <FileText size={18} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline sm:ml-1.5 text-xs font-bold">{t[lang].btn_results}</span>
            </button>
          )}

          <button onClick={onBack} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700" title={t[lang].btn_home}>
            <ChevronLeft size={18} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline sm:ml-1.5 text-xs">{t[lang].btn_home}</span>
          </button>
          <button onClick={onLoginRequest} className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center text-slate-400 hover:text-white transition" title="Login Settings"><Settings size={20} className="sm:w-5 sm:h-5"/></button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col justify-center items-center text-center p-4 sm:p-6 z-10 relative">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-xl w-full mt-4">
            <div className="flex justify-center mb-4 sm:mb-6">
              {isFinished ? (
                <span className="bg-blue-500/20 text-blue-400 text-[10px] sm:text-sm px-3 py-1 rounded-full font-bold flex items-center gap-2 border border-blue-500/30"><CheckCircle size={14} /> {t[lang].tournament_finished}</span>
              ) : tournament.status === 'paused' ? (
                <span className="bg-yellow-500/20 text-yellow-400 text-[10px] sm:text-sm px-3 py-1 rounded-full font-bold flex items-center gap-2 border border-yellow-500/30"><Timer size={14}/> {t[lang].tournament_paused}</span>
              ) : (
                <span className="bg-slate-500/20 text-slate-300 text-[10px] sm:text-sm px-3 py-1 rounded-full font-bold flex items-center gap-2 border border-slate-500/30"><Timer size={14}/> {t[lang].tournament_upcoming}</span>
              )}
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{tournament.title}</h3>
            <div className="text-sm sm:text-base text-slate-400 mb-6 sm:mb-8 flex items-center justify-center gap-2">
              <MapPin size={16}/> {tournament.venue}
          </div>

          {!isFinished ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {Object.entries(timeLeft).map(([unit, val]) => (
                <div key={unit} className="bg-slate-900 p-2 sm:p-3 rounded-xl border border-slate-700 shadow-inner">
                  <div className="text-xl sm:text-3xl font-black text-white mb-0.5 sm:mb-1">{val}</div>
                  <div className="text-[8px] sm:text-[10px] uppercase text-slate-500 tracking-wider font-bold">{unit}</div>
                </div>
              ))}
            </div>
          ) : null}
            
          {isFinished ? (
            tournament.resultUrl ? (
              <button onClick={() => setShowPdf(true)} className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-900/50 text-sm sm:text-lg">
                <FileText size={20}/> {t[lang].btn_results_full}
              </button>
            ) : (
              <div className="text-slate-500 italic bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs sm:text-base">{t[lang].waiting_results}</div>
            )
          ) : (
            <div className="text-xs sm:text-sm text-slate-500 border-t border-slate-700 pt-4 sm:pt-6">
              {tournament.status === 'paused' ? t[lang].paused_until : t[lang].scheduled_on}<br/>
              <span className="text-white font-bold text-sm sm:text-lg block mt-1">
                {tournament.status === 'paused' && tournament.liveState?.pauseUntil 
                  ? new Date(tournament.liveState.pauseUntil).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : formatDateRange(tournament.eventDate, tournament.endDate)}
              </span>
            </div>
          )}
       </div>
    </div>
    <footer className="bg-slate-950 text-slate-600 py-3 sm:py-4 text-center text-[10px] sm:text-xs border-t border-slate-800 z-10 shrink-0">{t[lang].footer_text}</footer>

    {showResultsList && (
      <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative shadow-2xl">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> {t[lang].results_list_title}</h2>
            <button onClick={() => setShowResultsList(false)} className="text-slate-400 hover:text-red-500 transition"><X size={24}/></button>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            {events.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-sm sm:text-base">Belum ada data acara.</div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm md:text-base">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr><th className="p-3 sm:p-4 font-bold text-slate-600">{t[lang].no}</th><th className="p-3 sm:p-4 font-bold text-slate-600">{t[lang].event}</th><th className="p-3 sm:p-4 font-bold text-slate-600 text-right">{t[lang].action}</th></tr>
                </thead>
                <tbody>
                  {events.map((ev: any, idx: number) => (
                    <tr key={ev.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="p-3 sm:p-4 font-bold text-slate-800 w-10 sm:w-12">{ev.number}</td>
                      <td className="p-3 sm:p-4 font-semibold text-slate-700">{ev.name}</td>
                      <td className="p-3 sm:p-4 text-right w-24 sm:w-32">
                        {ev.resultUrl ? (
                          <button onClick={() => setShowPdfUrl(ev.resultUrl)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs shadow-sm transition whitespace-nowrap">{t[lang].view_result}</button>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-slate-400 italic whitespace-nowrap">{t[lang].not_available}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    )}

    {showPdfUrl && (
      <div className="fixed inset-0 z-[90] bg-black/90 flex flex-col p-2 sm:p-4 animate-in fade-in">
        <div className="flex justify-between items-center mb-2 sm:mb-4 text-white">
          <div className="flex flex-col">
            <h2 className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2"><FileText size={18} className="sm:w-5 sm:h-5"/> <span className="hidden sm:inline">{t[lang].results_detail_title}</span></h2>
            {currentResultIndex !== -1 && (
              <span className="text-blue-300 text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-[250px] md:max-w-md mt-0.5">
                {eventsWithResults[currentResultIndex].number}. {eventsWithResults[currentResultIndex].name}
              </span>
            )}
          </div>
          <button onClick={() => setShowPdfUrl(null)} className="p-1.5 sm:p-2 bg-slate-800 rounded-full hover:bg-slate-700 shrink-0"><X size={20}/></button>
        </div>
        
        <div className="flex-1 w-full relative flex items-center">
          {currentResultIndex > 0 && (
            <button 
              onClick={handlePrevResult}
              className="absolute left-1 sm:left-2 z-10 bg-slate-800/80 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors backdrop-blur-sm"
            >
              <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
          )}

          <iframe src={showPdfUrl} className="w-full h-full rounded-lg bg-white" title="Hasil Acara"></iframe>

          {currentResultIndex !== -1 && currentResultIndex < eventsWithResults.length - 1 && (
            <button 
              onClick={handleNextResult}
              className="absolute right-1 sm:right-2 z-10 bg-slate-800/80 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors backdrop-blur-sm"
            >
              <ChevronRight size={20} className="sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>
    )}
 </div>
 );
}

function LiveScoreboard({ tournament, dqs, events, isOnline, onBack, onLoginRequest, lang, setLang, t }: any) {
  const ls = tournament.liveState || DEFAULT_LIVE_STATE;
  
  const [dqPage, setDqPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(dqs.length / itemsPerPage) || 1;
  const currentDqs = dqs.slice((dqPage - 1) * itemsPerPage, dqPage * itemsPerPage);

  const [showResultsList, setShowResultsList] = useState(false);
  const [showPdfUrl, setShowPdfUrl] = useState<string | null>(null);

  const currentTime = useLiveClock();

  const eventsWithResults = events.filter((ev: any) => ev.resultUrl);
  const currentResultIndex = eventsWithResults.findIndex((ev: any) => ev.resultUrl === showPdfUrl);

  const handleNextResult = () => {
    if (currentResultIndex < eventsWithResults.length - 1) {
      setShowPdfUrl(eventsWithResults[currentResultIndex + 1].resultUrl);
    }
  };

  const handlePrevResult = () => {
    if (currentResultIndex > 0) {
      setShowPdfUrl(eventsWithResults[currentResultIndex - 1].resultUrl);
    }
  };

  useEffect(() => {
      if (dqPage > totalPages) setDqPage(1);
  }, [dqs.length, totalPages, dqPage]);

  const calculateNextRace = (offset: number) => {
      if (!ls.currentEventId) return null;
      let currentEventIdx = events.findIndex((e: any) => e.id === ls.currentEventId);
      if (currentEventIdx === -1) return null;

      let currentEvent = events[currentEventIdx];
      let targetSeries = ls.currentSeries + offset;

      while (targetSeries > currentEvent.totalSeries) {
          targetSeries -= currentEvent.totalSeries;
          currentEventIdx++;
          if (currentEventIdx < events.length) {
              currentEvent = events[currentEventIdx];
          } else {
              return null;
          }
      }

      return { event: currentEvent, series: targetSeries };
  };

  const readyToRace = calculateNextRace(1);
  const inTheNext = calculateNextRace(2);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
        {}
        <header className="bg-slate-900 text-white h-auto shrink-0 flex flex-nowrap items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-800 shadow-xl z-50">
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                <img src="/sangkuriang%201.png" alt="Logo" className="h-8 sm:h-10 w-auto object-contain" onError={(e:any) => e.target.style.display='none'} />
                <div className="flex flex-col justify-center">
                    <h1 className="font-extrabold text-sm sm:text-lg leading-none tracking-wide uppercase truncate max-w-[140px] md:max-w-xs">{tournament.title}</h1>
                    <p className="text-[8px] sm:text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">Swim Organizer</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto">
                <span className={`text-[10px] items-center gap-1 hidden sm:flex ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>{isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}</span>
                
                <button 
                  onClick={() => setLang(lang === 'id' ? 'en' : 'id')} 
                  className="flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 transition"
                  title="Switch Language"
                >
                  <Globe size={18} className="text-blue-400 sm:w-4 sm:h-4" />
                  <span className="font-bold text-xs hidden sm:inline sm:ml-1.5">{lang === 'id' ? 'ID' : 'EN'}</span>
                </button>

                <button onClick={() => setShowResultsList(true)} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-md" title={t[lang].btn_results}>
                    <FileText size={18} className="sm:w-4 sm:h-4" /> <span className="text-xs font-bold hidden sm:inline sm:ml-1.5">{t[lang].btn_results}</span>
                </button>
                <button onClick={onBack} className="w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700" title={t[lang].btn_home}>
                    <ChevronLeft size={18} className="sm:w-4 sm:h-4" /> <span className="text-xs hidden sm:inline sm:ml-1.5">{t[lang].btn_home}</span>
                </button>
                <button onClick={onLoginRequest} className="w-9 h-9 sm:w-auto sm:h-auto flex items-center justify-center text-slate-400 hover:text-white transition" title="Login"><Settings size={20}/></button>
            </div>
        </header>

        {}
        <div className="flex flex-col md:flex-row w-full border-b border-slate-200 shadow-sm shrink-0">
            {/* Panel Call Room (Kiri) */}
            <div className="w-full md:w-1/2 bg-slate-900 relative flex flex-col justify-between min-h-[300px] md:min-h-[48vh]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-900 z-0"></div>
                
                {/* Header Call Room */}
                <div className="relative z-10 px-4 py-5 md:px-8 md:pt-6 flex justify-between items-center w-full">
                    <h2 className="text-white text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1.5 sm:gap-2"><Users className="text-blue-400 w-5 h-5 sm:w-8 sm:h-8" /> {t[lang].call_room}</h2>
                    <div className="text-right">
                        <span className="text-blue-200/40 text-[8px] sm:text-[10px] uppercase block">{t[lang].last_update}</span>
                        <span className="text-white text-xs sm:text-sm md:text-base font-mono font-bold flex items-center gap-1 justify-end"><Clock size={12} className="text-blue-400" /> {ls.callRoomLastUpdate || '-'}</span>
                    </div>
                </div>

                {/* Kotak Angka Event & Heat Call Room */}
                <div className="relative z-10 px-4 md:px-8 w-full max-w-lg mx-auto my-auto">
                    <div className="flex gap-2 sm:gap-4">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center shadow-lg">
                          <div className="text-blue-200 text-[10px] sm:text-sm uppercase mb-0.5 sm:mb-1">{t[lang].event}</div>
                          <div className="text-white text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none">{ls.callRoomEventNumber || '-'}</div>
                        </div>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center shadow-lg">
                          <div className="text-blue-200 text-[10px] sm:text-sm uppercase mb-0.5 sm:mb-1">{t[lang].series}</div>
                          <div className="text-white text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none">{ls.callRoomSeries}</div>
                        </div>
                    </div>
                </div>

                {/* Nama Acara Call Room */}
                <div className="relative z-10 w-full bg-slate-950/80 border-t border-slate-800 py-2 sm:py-3 px-4 text-center">
                    <p className="text-slate-200 text-sm sm:text-base md:text-lg font-bold tracking-widest uppercase line-clamp-1">{ls.callRoomEventName || t[lang].waiting}</p>
                </div>

                {/* Baris Antrean di bawah Panel Call Room: In The Next & Ready To Race */}
                <div className="relative z-10 w-full flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-700 bg-slate-800/90 border-t border-slate-700">
                    <div className="flex-1 p-2.5 sm:p-3.5 flex items-center justify-center gap-2">
                        <div className="bg-slate-700 text-slate-300 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap">In The Next</div>
                        {inTheNext ? (
                            <div className="flex gap-1.5">
                                <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm border border-slate-600 bg-slate-800 px-2 py-0.5 rounded shadow-sm">EV <span className="text-blue-400">{inTheNext.event.number}</span></span>
                                <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm border border-slate-600 bg-slate-800 px-2 py-0.5 rounded shadow-sm">HT <span className="text-blue-400">{inTheNext.series}</span></span>
                            </div>
                        ) : (
                            <span className="text-slate-500 italic text-[10px] sm:text-xs font-medium">No Data</span>
                        )}
                    </div>

                    <div className="flex-1 p-2.5 sm:p-3.5 flex items-center justify-center gap-2 bg-blue-900/20">
                        <div className="bg-yellow-500/20 text-yellow-400 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider whitespace-nowrap border border-yellow-500/30">Ready To Race</div>
                        {readyToRace ? (
                            <div className="flex gap-1.5">
                                <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm border border-blue-800 bg-slate-900 px-2 py-0.5 rounded shadow-sm">EV <span className="text-yellow-400">{readyToRace.event.number}</span></span>
                                <span className="font-mono font-bold text-slate-200 text-xs sm:text-sm border border-blue-800 bg-slate-900 px-2 py-0.5 rounded shadow-sm">HT <span className="text-yellow-400">{readyToRace.series}</span></span>
                            </div>
                        ) : (
                            <span className="text-slate-500 italic text-[10px] sm:text-xs font-medium">No Data</span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Panel Live (Kanan) */}
            <div className="w-full md:w-1/2 bg-white relative flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 min-h-[300px] md:min-h-[48vh]">
                {/* Header Live & Jam Real-time */}
                <div className="relative z-10 px-4 py-5 md:px-8 md:pt-6 flex justify-between items-center w-full">
                    <h2 className="text-slate-800 text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                        <MonitorPlay className="text-red-500 w-5 h-5 sm:w-8 sm:h-8" /> {t[lang].racing_now}
                    </h2>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 sm:px-3 py-1 rounded-full border border-slate-200">
                            <Clock size={12} className="text-slate-500 sm:w-3.5 sm:h-3.5" />
                            <span className="font-mono font-bold text-slate-700 text-[10px] sm:text-sm tracking-wider">{currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <span className="bg-red-500 text-white text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold animate-pulse">LIVE</span>
                    </div>
                </div>

                {/* Kotak Angka Event & Heat Live */}
                <div className="relative z-10 px-4 md:px-8 w-full max-w-lg mx-auto my-auto">
                    <div className="flex gap-2 sm:gap-4">
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                          <div className="text-slate-400 text-[10px] sm:text-sm uppercase mb-0.5 sm:mb-1">{t[lang].event}</div>
                          <div className="text-slate-800 text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none">{ls.currentEventNumber || '-'}</div>
                        </div>
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center shadow-inner">
                          <div className="text-slate-400 text-[10px] sm:text-sm uppercase mb-0.5 sm:mb-1">{t[lang].series}</div>
                          <div className="text-slate-800 text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-none">{ls.currentSeries}</div>
                        </div>
                    </div>
                </div>

                {/* Nama Acara Live di bawah */}
                <div className="relative z-10 w-full bg-slate-100 border-t border-slate-200 py-3 sm:py-4 px-4 text-center mt-auto">
                    <p className="text-slate-800 text-sm sm:text-base md:text-lg font-bold tracking-widest uppercase line-clamp-1">{ls.currentEventName || t[lang].waiting}</p>
                </div>
            </div>
        </div>
        
        {}
        <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-8 flex-1 flex flex-col">
            <h3 className="text-slate-800 font-extrabold text-sm sm:text-lg md:text-xl mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2 uppercase">
                <AlertOctagon className="text-red-500 w-4 h-4 sm:w-6 sm:h-6" /> {t[lang].dq_info}
            </h3>
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
                <div className="flex bg-slate-800 text-white text-[9px] sm:text-sm font-bold uppercase py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-6 items-center shrink-0">
                    <div className="w-10 sm:w-16 md:w-20 text-center shrink-0">{t[lang].event}</div>
                    <div className="w-8 sm:w-16 md:w-20 text-center shrink-0">{t[lang].series}</div>
                    <div className="w-8 sm:w-16 md:w-20 text-center shrink-0">{t[lang].lane}</div>
                    <div className="flex-1 pl-2 sm:pl-3 md:pl-6 text-left">{t[lang].dq_reason}</div>
                </div>
                
                <div className="flex flex-col">
                    {currentDqs.length === 0 ? (
                        <div className="flex items-center justify-center text-slate-400 italic text-xs sm:text-sm md:text-base py-8 sm:py-12 px-4 text-center">{t[lang].dq_empty}</div>
                    ) : (
                        <div className="flex flex-col">
                            {currentDqs.map((dq: any, idx: number) => (
                                <div key={dq.id} className={`flex text-[10px] sm:text-sm md:text-base lg:text-xl py-2 sm:py-3 md:py-5 px-2 sm:px-3 md:px-6 border-b border-slate-100 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                    <div className="w-10 sm:w-16 md:w-20 font-bold text-slate-800 text-center shrink-0">{dq.eventNumber}</div>
                                    <div className="w-8 sm:w-16 md:w-20 text-center text-slate-600 font-semibold shrink-0">{dq.series}</div>
                                    <div className="w-8 sm:w-16 md:w-20 text-center shrink-0">
                                        <span className="bg-slate-200 text-slate-700 px-1 sm:px-2 md:px-4 py-0.5 sm:py-1 md:py-1.5 rounded-md sm:rounded-lg font-mono font-bold">{dq.lane}</span>
                                    </div>
                                    <div className="flex-1 pl-2 sm:pl-3 md:pl-6 text-red-600 font-bold whitespace-normal break-words leading-tight sm:leading-snug">{dq.reason}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="bg-slate-100 border-t border-slate-200 p-2 sm:p-3 md:p-4 px-3 sm:px-4 md:px-6 flex justify-between items-center shrink-0">
                            <button 
                                onClick={() => setDqPage(p => Math.max(1, p - 1))} 
                                disabled={dqPage === 1} 
                                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1 transition"
                            >
                                <ChevronLeft size={14} className="sm:w-4 sm:h-4"/> <span className="hidden sm:inline">{t[lang].prev}</span>
                            </button>
                            <span className="text-[9px] sm:text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest">{t[lang].page} {dqPage} {t[lang].of} {totalPages}</span>
                            <button 
                                onClick={() => setDqPage(p => Math.min(totalPages, p + 1))} 
                                disabled={dqPage === totalPages} 
                                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-md sm:rounded-lg text-[10px] sm:text-xs md:text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50 flex items-center gap-1 transition"
                            >
                                <span className="hidden sm:inline">{t[lang].next}</span> <ChevronRight size={14} className="sm:w-4 sm:h-4"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {}
        <footer className="bg-slate-900 text-slate-500 text-center py-2 sm:py-3 text-[10px] sm:text-xs font-mono tracking-widest border-t border-slate-800 shrink-0 mt-auto">{t[lang].footer_text}</footer>

        {showResultsList && (
            <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
               <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative shadow-2xl">
                  <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                     <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2"><FileText className="text-blue-600"/> {t[lang].results_list_title}</h2>
                     <button onClick={() => setShowResultsList(false)} className="text-slate-400 hover:text-red-500 transition"><X size={24}/></button>
                  </div>
                  <div className="p-0 overflow-y-auto flex-1">
                     {events.length === 0 ? (
                         <div className="p-8 text-center text-slate-500 italic text-sm sm:text-base">Belum ada data acara.</div>
                     ) : (
                         <table className="w-full text-left text-xs sm:text-sm md:text-base">
                            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                               <tr><th className="p-3 sm:p-4 font-bold text-slate-600">{t[lang].no}</th><th className="p-3 sm:p-4 font-bold text-slate-600">{t[lang].event}</th><th className="p-3 sm:p-4 font-bold text-slate-600 text-right">{t[lang].action}</th></tr>
                            </thead>
                            <tbody>
                               {events.map((ev: any, idx: number) => (
                                   <tr key={ev.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                      <td className="p-3 sm:p-4 font-bold text-slate-800 w-10 sm:w-12">{ev.number}</td>
                                      <td className="p-3 sm:p-4 font-semibold text-slate-700">{ev.name}</td>
                                      <td className="p-3 sm:p-4 text-right w-24 sm:w-32">
                                         {ev.resultUrl ? (
                                             <button onClick={() => setShowPdfUrl(ev.resultUrl)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs shadow-sm transition whitespace-nowrap">{t[lang].view_result}</button>
                                         ) : (
                                             <span className="text-[10px] sm:text-xs text-slate-400 italic whitespace-nowrap">{t[lang].not_available}</span>
                                         )}
                                      </td>
                                   </tr>
                               ))}
                            </tbody>
                         </table>
                     )}
                  </div>
               </div>
            </div>
        )}

        {showPdfUrl && (
            <div className="fixed inset-0 z-[90] bg-black/90 flex flex-col p-2 sm:p-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-2 sm:mb-4 text-white">
                    <div className="flex flex-col">
                      <h2 className="font-bold text-base sm:text-lg flex items-center gap-1.5 sm:gap-2"><FileText size={18} className="sm:w-5 sm:h-5"/> <span className="hidden sm:inline">{t[lang].results_detail_title}</span></h2>
                      {currentResultIndex !== -1 && (
                        <span className="text-blue-300 text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-[250px] md:max-w-md mt-0.5">
                          {eventsWithResults[currentResultIndex].number}. {eventsWithResults[currentResultIndex].name}
                        </span>
                      )}
                    </div>
                    <button onClick={() => setShowPdfUrl(null)} className="p-1.5 sm:p-2 bg-slate-800 rounded-full hover:bg-slate-700 shrink-0"><X size={20}/></button>
                </div>
                
                <div className="flex-1 w-full relative flex items-center">
                    {currentResultIndex > 0 && (
                      <button 
                        onClick={handlePrevResult}
                        className="absolute left-1 sm:left-2 z-10 bg-slate-800/80 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors backdrop-blur-sm"
                      >
                        <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    )}

                    <iframe src={showPdfUrl} className="w-full h-full rounded-lg bg-white" title="Hasil Acara"></iframe>

                    {currentResultIndex !== -1 && currentResultIndex < eventsWithResults.length - 1 && (
                      <button 
                        onClick={handleNextResult}
                        className="absolute right-1 sm:right-2 z-10 bg-slate-800/80 hover:bg-blue-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-colors backdrop-blur-sm"
                      >
                        <ChevronRight size={20} className="sm:w-6 sm:h-6" />
                      </button>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}

function RoleSelectionPanel({ tournament, onBack, onLoginRequest, lang, t }: any) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
            <button onClick={onBack} className="mb-8 text-slate-400 hover:text-white flex gap-2 items-center"><ChevronLeft size={20}/> {t[lang].btn_back}</button>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">{t[lang].select_role}</h2>
                <p className="text-slate-400">{t[lang].for_tournament} {tournament.title}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
                {['admin', 'announcer', 'callroom'].map(r => (
                    <button key={r} onClick={() => onLoginRequest(r)} className="p-8 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl capitalize font-bold text-white transition hover:scale-105 group shadow-xl">
                        {r==='admin'?<Settings size={32} className="mb-4 text-blue-500 group-hover:scale-110 transition mx-auto"/>:r==='announcer'?<Mic size={32} className="mb-4 text-purple-500 group-hover:scale-110 transition mx-auto"/>:<Users size={32} className="mb-4 text-emerald-500 group-hover:scale-110 transition mx-auto"/>}
                        <div className="text-xl text-center">{r === 'admin' ? t[lang].role_admin : r === 'announcer' ? t[lang].role_announcer : t[lang].role_callroom}</div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
}

function LoginModal({ targetRole, onClose, onLogin, lang, t }: any) {
  const [pin, setPin] = useState(''); const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!onLogin(targetRole, pin)) { setError(true); setPin(''); } };
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
        <h2 className="text-xl font-bold text-center mb-6 capitalize">{t[lang].login} {targetRole === 'admin' ? t[lang].role_admin : targetRole === 'master' ? t[lang].role_master : targetRole === 'announcer' ? t[lang].role_announcer : t[lang].role_callroom}</h2>
        <form onSubmit={handleSubmit}>
          <input autoFocus type="password" value={pin} onChange={e=>{setPin(e.target.value);setError(false)}} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-blue-500" placeholder="PIN" />
          {error && <p className="text-red-500 text-center mb-4 text-sm font-bold">{t[lang].wrong_pin}</p>}
          <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">{t[lang].login}</button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ tournament, events, masterPinHash, onUpdateTournament, onAddEvent, onAddMultipleEvents, onEditEvent, onDeleteEvent, onResetTournament, lang, t }: any) {
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ number: '', name: '', totalSeries: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ number: '', name: '', totalSeries: '', resultUrl: '' });
  const [linkModal, setLinkModal] = useState({ show: false, eventId: '', url: '', eventName: '' });

  const [pinForm, setPinForm] = useState({ admin: '', announcer: '', callroom: '' });
  const [pinMessage, setPinMessage] = useState('');

  const [infoForm, setInfoForm] = useState({
    title: tournament.title || '',
    venue: tournament.venue || '',
    eventDate: tournament.eventDate ? tournament.eventDate.substring(0, 10) : '',
    endDate: tournament.endDate ? tournament.endDate.substring(0, 10) : (tournament.eventDate ? tournament.eventDate.substring(0, 10) : '')
  });
  const [infoMessage, setInfoMessage] = useState('');

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPin, setResetPin] = useState('');
  const [resetError, setResetError] = useState(false);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseResumeTime, setPauseResumeTime] = useState('');
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const wrapAsync = async (fn: () => Promise<void>) => { setLoading(true); try { await fn(); } finally { setLoading(false); }};
  const handleAddEvent = (e: React.FormEvent) => { e.preventDefault(); if(!newEvent.number) return; wrapAsync(async () => { await onAddEvent({ number: parseInt(newEvent.number), name: newEvent.name, totalSeries: parseInt(newEvent.totalSeries) }); setNewEvent({ number: '', name: '', totalSeries: '' }); }); };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(window as any).XLSX) {
      setLoading(true);
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (err) {
        setLoading(false);
        alert("Gagal memuat library Excel. Periksa koneksi internet Anda.");
        if (e.target) e.target.value = '';
        return;
      }
      setLoading(false);
    }

    const XLSXLoader = (window as any).XLSX;

    wrapAsync(async () => {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSXLoader.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSXLoader.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const eventsToAdd: any[] = [];
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!Array.isArray(row)) continue;

          for (let c = 0; c < row.length - 2; c++) {
            const rawNum = row[c];
            if (rawNum === undefined || rawNum === null || String(rawNum).trim() === '') continue;
            
            const evtNum = Number(rawNum);
            if (isNaN(evtNum) || !Number.isInteger(evtNum) || evtNum <= 0) continue;
            
            let name = '';
            let nameCol = -1;
            for (let j = c + 1; j < row.length; j++) {
              const val = row[j];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                name = String(val).trim();
                nameCol = j;
                break;
              }
            }

            if (!name || !isNaN(Number(name))) continue;
            
            let heats = NaN;
            let heatsCol = -1;
            for (let k = nameCol + 1; k < row.length; k++) {
              const val = row[k];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                heats = Number(val);
                heatsCol = k;
                break;
              }
            }

            if (!isNaN(heats) && Number.isInteger(heats) && heats >= 1) {
                if (!eventsToAdd.find(e => e.number === evtNum)) {
                    eventsToAdd.push({ number: evtNum, name: name, totalSeries: heats });
                }
                c = heatsCol; 
            }
          }
        }

        if (eventsToAdd.length > 0) {
          eventsToAdd.sort((a, b) => a.number - b.number);
          await onAddMultipleEvents(eventsToAdd);
          alert(`Berhasil mengimpor ${eventsToAdd.length} acara dari Excel!`);
        } else {
          alert("Tidak ditemukan data acara yang valid atau tidak ada acara dengan seri minimal 1 di file Excel.");
        }
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert("Gagal membaca file Excel. Pastikan format file benar (.xlsx atau .xls).");
      } finally {
        if (e.target) e.target.value = '';
      }
    });
  };

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    wrapAsync(async () => {
      await onUpdateTournament({
        title: infoForm.title,
        venue: infoForm.venue,
        eventDate: new Date(infoForm.eventDate).toISOString(),
        endDate: new Date(infoForm.endDate).toISOString()
      });
      setInfoMessage('Informasi berhasil disimpan!');
      setTimeout(() => setInfoMessage(''), 4000);
    });
  };

  const handleUpdatePins = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPins = { ...tournament.pins };
    let changed = false;
    
    if (pinForm.admin) { updatedPins.admin = simpleHash(pinForm.admin); changed = true; }
    if (pinForm.announcer) { updatedPins.announcer = simpleHash(pinForm.announcer); changed = true; }
    if (pinForm.callroom) { updatedPins.callroom = simpleHash(pinForm.callroom); changed = true; }

    if (changed) {
      wrapAsync(async () => {
        await onUpdateTournament({ pins: updatedPins });
        setPinForm({ admin: '', announcer: '', callroom: '' });
        setPinMessage(lang === 'id' ? 'PIN akses berhasil diperbarui!' : 'Access PINs updated successfully!');
        setTimeout(() => setPinMessage(''), 4000);
      });
    }
  };

  const handlePauseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    wrapAsync(async () => {
      const payload: any = { status: 'paused' };
      if (pauseResumeTime) {
        payload['liveState.pauseUntil'] = new Date(pauseResumeTime).toISOString();
      }
      await onUpdateTournament(payload);
      setShowPauseModal(false);
      setPauseResumeTime('');
    });
  };

  const isUpcoming = tournament.status === 'upcoming';
  const isLive = tournament.status === 'live';

  return (
    <div className="grid md:grid-cols-3 gap-6 relative">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>}
      
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Settings className="text-blue-600"/> {t[lang].admin_control}</h2>
          
          <div className="mb-6 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">{t[lang].current_status}</div>
              <div className={`text-lg font-black uppercase ${isLive ? 'text-red-500' : tournament.status === 'finished' ? 'text-blue-600' : tournament.status === 'paused' ? 'text-yellow-600' : 'text-slate-600'}`}>
                  {isLive ? t[lang].status_live_caps : tournament.status === 'finished' ? t[lang].status_finished_caps : tournament.status === 'paused' ? t[lang].status_paused_caps : t[lang].status_upcoming_caps}
              </div>
          </div>

          <div className="space-y-3">
               {isUpcoming && (
                   <button onClick={() => { wrapAsync(async() => await onUpdateTournament({ status: 'live' })); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-lg">
                        <Play size={20}/> {t[lang].btn_start_race}
                   </button>
               )}
               {isLive && (
                   <>
                    <button onClick={() => setShowPauseModal(true)} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-md">
                        <Timer size={18}/> {t[lang].btn_pause_race}
                    </button>
                    <button onClick={() => setShowFinishConfirm(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-md">
                        <CheckCircle size={18}/> {t[lang].btn_finish_race}
                    </button>
                   </>
               )}
               {tournament.status === 'paused' && (
                   <>
                    <button onClick={() => { wrapAsync(async() => await onUpdateTournament({ status: 'live' })); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-lg">
                        <Play size={20}/> {t[lang].btn_resume_race}
                    </button>
                    <button onClick={() => setShowFinishConfirm(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-md mt-2">
                        <CheckCircle size={18}/> {t[lang].btn_finish_race}
                    </button>
                   </>
               )}
               {tournament.status === 'finished' && (
                   <button onClick={() => { wrapAsync(async() => await onUpdateTournament({ status: 'live' })); }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-2 transition shadow-lg">
                        <Play size={20}/> {t[lang].btn_reopen_race}
                   </button>
               )}
               
               <div className="pt-4 border-t border-slate-100 mt-6">
                 <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].link_results_pdf}</label>
                 <div className="flex gap-2">
                     <input type="text" value={tournament.resultUrl || ''} onChange={(e) => onUpdateTournament({ resultUrl: e.target.value })} className="flex-1 p-2 border rounded text-sm bg-slate-50" placeholder="https://drive.google.com/..." />
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1">{t[lang].link_results_desc}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6">
                <button onClick={() => setShowResetModal(true)} className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex justify-center items-center gap-2 transition border border-red-200">
                    <AlertOctagon size={18}/> {t[lang].btn_reset_race}
                </button>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Edit2 className="text-blue-600"/> {t[lang].edit_info}</h2>
          <form onSubmit={handleUpdateInfo} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].tournament_name}</label>
              <input required type="text" value={infoForm.title} onChange={(e) => setInfoForm({...infoForm, title: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].venue}</label>
              <input required type="text" value={infoForm.venue} onChange={(e) => setInfoForm({...infoForm, venue: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].start_date}</label>
                <input required type="date" value={infoForm.eventDate} onChange={(e) => setInfoForm({...infoForm, eventDate: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].end_date}</label>
                <input required type="date" value={infoForm.endDate} onChange={(e) => setInfoForm({...infoForm, endDate: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" min={infoForm.eventDate} />
              </div>
            </div>
            
            {infoMessage && <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center animate-in fade-in">{infoMessage}</div>}
            
            <div className="pt-2">
              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition shadow-sm">
                {t[lang].btn_save_info}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4 flex gap-2"><Lock className="text-blue-600"/> {t[lang].pin_settings}</h2>
          <form onSubmit={handleUpdatePins} className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].change_admin_pin}</label>
              <input type="text" value={pinForm.admin} onChange={(e) => setPinForm({...pinForm, admin: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder={t[lang].empty_pin_hint} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].change_announcer_pin}</label>
              <input type="text" value={pinForm.announcer} onChange={(e) => setPinForm({...pinForm, announcer: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder={t[lang].empty_pin_hint} />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold mb-1 block">{t[lang].change_callroom_pin}</label>
              <input type="text" value={pinForm.callroom} onChange={(e) => setPinForm({...pinForm, callroom: e.target.value})} className="w-full p-2 border rounded text-sm bg-slate-50 focus:bg-white transition-colors" placeholder={t[lang].empty_pin_hint} />
            </div>
            
            {pinMessage && <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-center animate-in fade-in">{pinMessage}</div>}
            
            <div className="pt-2">
              <button type="submit" disabled={!pinForm.admin && !pinForm.announcer && !pinForm.callroom} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition shadow-sm">
                {t[lang].btn_save_pins}
              </button>
            </div>
          </form>
        </div>

      </div>

      <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex gap-2"><List className="text-blue-600"/> {t[lang].events_list}</h2>
              <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-2 transition shadow-sm">
                <Upload size={14} /> {t[lang].import_excel}
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>

            <form onSubmit={handleAddEvent} className="flex gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <input type="number" placeholder={t[lang].col_no} value={newEvent.number} onChange={e => setNewEvent({...newEvent, number: e.target.value})} className="w-16 p-2 border rounded text-sm" />
                <input type="text" placeholder={t[lang].event_name_placeholder} value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="flex-1 p-2 border rounded text-sm" />
                <input type="number" placeholder={t[lang].col_series} value={newEvent.totalSeries} onChange={e => setNewEvent({...newEvent, totalSeries: e.target.value})} className="w-16 p-2 border rounded text-sm" />
                <button className="bg-blue-600 text-white px-4 rounded font-bold hover:bg-blue-700 transition">{t[lang].btn_add}</button>
            </form>
            <div className="max-h-[500px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 sticky top-0 border-b">
                  <tr>
                    <th className="p-3">{t[lang].col_no}</th>
                    <th className="p-3">{t[lang].col_event_name}</th>
                    <th className="p-3 text-center">{t[lang].col_series}</th>
                    <th className="p-3 text-center">{t[lang].col_results}</th>
                    <th className="p-3 text-right">{t[lang].col_action}</th>
                  </tr>
                </thead>
                <tbody>
                    {events.map((ev: any) => (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-slate-50">
                        {editingId === ev.id ? (
                        <td colSpan={5} className="p-3 bg-blue-50/50">
                            <div className="flex gap-2 mb-2">
                                <input type="number" value={editForm.number} onChange={e => setEditForm({...editForm, number: e.target.value})} className="w-16 border rounded p-1.5 text-sm font-bold" />
                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="flex-1 border rounded p-1.5 text-sm" />
                                <input type="number" value={editForm.totalSeries} onChange={e => setEditForm({...editForm, totalSeries: e.target.value})} className="w-16 border rounded p-1.5 text-sm text-center" />
                            </div>
                            <div className="flex gap-2 items-center">
                                <input type="text" value={editForm.resultUrl} onChange={e => setEditForm({...editForm, resultUrl: e.target.value})} placeholder={t[lang].google_drive_url} className="flex-1 border rounded p-1.5 text-xs bg-white" />
                                <div className="flex gap-2 justify-end shrink-0">
                                    <button onClick={() => wrapAsync(async() => { await onEditEvent(ev.id, { number: parseInt(editForm.number), name: editForm.name, totalSeries: parseInt(editForm.totalSeries), resultUrl: editForm.resultUrl }); setEditingId(null); })} className="bg-green-600 text-white px-3 py-1.5 rounded font-bold hover:bg-green-700 text-xs shadow-sm flex items-center gap-1"><Save size={14}/> {t[lang].btn_save}</button>
                                    <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded font-bold hover:bg-slate-300 text-xs shadow-sm flex items-center gap-1"><X size={14}/> {t[lang].btn_cancel}</button>
                                </div>
                            </div>
                        </td>
                        ) : (
                        <>
                            <td className="p-3 font-bold w-12 text-slate-700">{ev.number}</td>
                            <td className="p-3 font-medium">
                                {ev.name}
                                {ev.resultUrl && <span className="ml-2 inline-block bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded font-bold align-middle">{t[lang].results_available}</span>}
                            </td>
                            <td className="p-3 text-center w-16"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{ev.totalSeries}</span></td>
                            <td className="p-3 text-center">
                              {ev.resultUrl ? (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">{t[lang].status_yes}</span>
                              ) : (
                                <span className="bg-slate-100 text-slate-400 px-2 py-1 rounded text-[10px] font-bold">{t[lang].status_empty}</span>
                              )}
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-1">
                              <button onClick={() => setLinkModal({ show: true, eventId: ev.id, url: ev.resultUrl || '', eventName: `${ev.number}. ${ev.name}` })} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded transition" title={t[lang].input_results_link}><FileText size={16}/></button>
                              <button onClick={() => { setEditingId(ev.id); setEditForm({ number: ev.number, name: ev.name, totalSeries: ev.totalSeries, resultUrl: ev.resultUrl || '' }); }} className="text-slate-400 hover:text-blue-500 p-1.5 transition" title={t[lang].edit_info}><Edit2 size={16}/></button>
                              <button onClick={() => { wrapAsync(async()=> await onDeleteEvent(ev.id)); }} className="text-slate-400 hover:text-red-500 p-1.5 transition" title="Hapus"><Trash2 size={16}/></button>
                            </td>
                        </>
                        )}
                    </tr>
                    ))}
                    {events.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">{t[lang].no_events_added}</td></tr> : null}
                </tbody>
                </table>
            </div>
          </div>
      </div>

      {linkModal.show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[80] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setLinkModal({ show: false, eventId: '', url: '', eventName: '' })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
            <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2"><FileText className="text-blue-600" /> {t[lang].input_results_link}</h2>
            <p className="text-sm text-slate-500 mb-4">{linkModal.eventName}</p>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 mb-1 block">{t[lang].google_drive_url}</label>
              <input 
                autoFocus 
                type="url" 
                value={linkModal.url} 
                onChange={e => setLinkModal({...linkModal, url: e.target.value})} 
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="https://..." 
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setLinkModal({ show: false, eventId: '', url: '', eventName: '' })} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">{t[lang].btn_cancel}</button>
              <button onClick={() => { 
                wrapAsync(async () => { 
                  await onEditEvent(linkModal.eventId, { resultUrl: linkModal.url }); 
                  setLinkModal({ show: false, eventId: '', url: '', eventName: '' }); 
                }); 
              }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition">{t[lang].btn_save_link}</button>
            </div>
          </div>
        </div>
      )}

      {showPauseModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative shadow-2xl">
            <button onClick={() => setShowPauseModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-yellow-600"><Timer /> {t[lang].set_pause_time}</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t[lang].pause_time_desc}</p>
            <form onSubmit={handlePauseSubmit}>
              <label className="text-xs font-bold text-slate-600 mb-1 block">{t[lang].resume_time}</label>
              <input type="datetime-local" value={pauseResumeTime} onChange={e => setPauseResumeTime(e.target.value)} className="w-full p-4 border rounded-xl mb-6 outline-none focus:ring-2 focus:ring-yellow-500 bg-slate-50" required />
              <button type="submit" className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold hover:bg-yellow-600 transition shadow-lg">{t[lang].btn_pause_now}</button>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative zoom-in-95 duration-200 shadow-2xl">
            <button onClick={() => {setShowResetModal(false); setResetPin(''); setResetError(false);}} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><X size={20} /></button>
            <h2 className="text-xl font-bold text-center mb-3 text-red-600 flex justify-center items-center gap-2"><AlertOctagon /> {t[lang].reset_race_title}</h2>
            <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed">{t[lang].reset_race_desc}</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (simpleHash(resetPin) === masterPinHash) {
                wrapAsync(async () => {
                  await onResetTournament();
                  setShowResetModal(false);
                  setResetPin('');
                  setResetError(false);
                });
              } else {
                setResetError(true);
                setResetPin('');
              }
            }}>
              <input autoFocus type="password" value={resetPin} onChange={e=>{setResetPin(e.target.value);setResetError(false)}} className="w-full text-center text-3xl font-bold p-4 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-red-500 bg-slate-50" placeholder="PIN MASTER" />
              {resetError && <p className="text-red-500 text-center mb-4 text-sm font-bold">{t[lang].wrong_pin}</p>}
              <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg">{t[lang].btn_confirm_reset}</button>
            </form>
          </div>
        </div>
      )}

      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-8 relative shadow-2xl text-center">
            <h2 className="text-xl font-bold mb-2 flex items-center justify-center gap-2 text-blue-600"><CheckCircle /> {t[lang].finish_race_title}</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">{t[lang].finish_race_desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowFinishConfirm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition">{t[lang].btn_cancel}</button>
              <button onClick={() => {
                wrapAsync(async () => {
                  await onUpdateTournament({ status: 'finished' });
                  setShowFinishConfirm(false);
                });
              }} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">{t[lang].btn_finish}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncerPanel({ tournament, events, dqs, updateLiveState, onAddDQ, onDeleteDQ, lang, t }: any) {
  const [loading, setLoading] = useState(false);
  const [newDQ, setNewDQ] = useState({ eventNumber: '', series: '', lane: '', reason: '' });
  const [manualReason, setManualReason] = useState('');
  
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
              currentEventTotalSeries: targetEvent.totalSeries, currentSeries: nextSeries,
              lastUpdate: getWIBTime()
          });
      });
  };

  const dqOptions = tournament.sportType === 'Selam' ? DQ_REASONS_SELAM : DQ_REASONS_RENANG;

  const handleDQSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const finalReason = newDQ.reason === 'Lainnya (Input Manual)' ? manualReason : newDQ.reason;
      if (!finalReason) return;
      
      wrapAsync(async() => { 
          await onAddDQ({ 
              eventNumber: parseInt(newDQ.eventNumber), 
              series: parseInt(newDQ.series), 
              lane: parseInt(newDQ.lane), 
              reason: finalReason, 
              timestamp: getWIBTime() 
          }); 
          setNewDQ({ eventNumber: '', series: '', lane: '', reason: '' }); 
          setManualReason('');
      });
  };

  return (
    <div className="grid md:grid-cols-3 gap-6 relative max-w-6xl mx-auto">
      {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-2xl"><Loader2 className="animate-spin text-purple-600" size={40}/></div>}
      
      <div className="md:col-span-2 space-y-6">
        <div className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-800">
            <div className="bg-black p-2 text-center text-yellow-400 font-mono text-sm tracking-widest uppercase border-b border-slate-800">Live Timing Display Control</div>
            <div className="p-8 sm:p-12 text-center min-h-[300px] flex flex-col justify-center items-center">
                {needsStart ? (
                    <div className="animate-in fade-in zoom-in">
                        <p className="text-slate-400 mb-4">Papan skor belum menampilkan data.</p>
                        <button onClick={() => wrapAsync(async () => {
                             const first = events[0]; 
                             await updateLiveState({ currentEventId: first.id, currentEventName: first.name, currentEventNumber: first.number, currentEventTotalSeries: first.totalSeries, currentSeries: 1, lastUpdate: getWIBTime() });
                        })} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> MULAI ACARA PERTAMA</button>
                    </div>
                ) : activeEvent ? (
                <>
                    <div className="text-blue-400 text-xl sm:text-2xl font-bold uppercase tracking-widest mb-2">{t[lang].event} {activeEvent.number}</div>
                    
                    <div className="w-full flex items-center justify-center h-24 sm:h-32 mb-6 sm:mb-8">
                       <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight line-clamp-3 overflow-hidden text-balance">
                            {activeEvent.name}
                       </h1>
                    </div>

                    <div className="inline-flex items-center justify-center bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-700">
                    <div className="text-center px-4 sm:px-8 border-r border-slate-600"><span className="block text-slate-400 text-[10px] sm:text-sm uppercase mb-1">{t[lang].series}</span><span className="block text-5xl sm:text-6xl font-black text-purple-400">{ls.currentSeries}</span></div>
                    <div className="text-center px-4 sm:px-8"><span className="block text-slate-400 text-[10px] sm:text-sm uppercase mb-1">Total</span><span className="block text-5xl sm:text-6xl font-black text-slate-500">{activeEvent.totalSeries}</span></div>
                    </div>
                </>
                ) : <div className="text-slate-500 italic">Tidak ada data acara.</div>}
            </div>
            {!needsStart && activeEvent ? (
                <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-between items-center">
                    <button onClick={() => handleNav('prev')} className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-slate-300 text-sm sm:text-base"><ChevronLeft size={18} /> <span className="hidden sm:inline">PREV</span></button>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-sm"><Megaphone size={16} /> Announcer Control</div>
                    <div>{canGoNext ? <button onClick={() => handleNav('next')} className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg transition text-sm sm:text-base"><span className="hidden sm:inline">NEXT</span> <ChevronRight size={18} /></button> : <button disabled className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-slate-700 text-slate-500 rounded-lg font-bold cursor-not-allowed border border-slate-600 text-sm sm:text-base"><Lock size={16} /> <span className="hidden sm:inline">{blockReason}</span></button>}</div>
                </div>
            ) : null}
        </div>
      </div>

      <div className="md:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold mb-4 text-red-600 flex items-center gap-2"><AlertOctagon /> Input Diskualifikasi</h2>
            <form onSubmit={handleDQSubmit} className="bg-red-50 p-4 rounded-lg mb-4 border border-red-100">
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Acara</label><input required type="number" value={newDQ.eventNumber} onChange={e => setNewDQ({...newDQ, eventNumber: e.target.value})} className="w-full p-2 border border-red-200 rounded-lg bg-white text-center font-bold outline-none focus:ring-2 focus:ring-red-500" /></div>
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Seri</label><input required type="number" value={newDQ.series} onChange={e => setNewDQ({...newDQ, series: e.target.value})} className="w-full p-2 border border-red-200 rounded-lg bg-white text-center font-bold outline-none focus:ring-2 focus:ring-red-500" /></div>
                    <div><label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Lintasan</label><input required type="number" value={newDQ.lane} onChange={e => setNewDQ({...newDQ, lane: e.target.value})} className="w-full p-2 border border-red-200 rounded-lg bg-white text-center font-bold outline-none focus:ring-2 focus:ring-red-500" /></div>
                </div>
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-red-800 uppercase block mb-1">Alasan / Keterangan Pelanggaran</label>
                    <select required value={newDQ.reason} onChange={e => setNewDQ({...newDQ, reason: e.target.value})} className="w-full p-2 border border-red-200 rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-red-500 truncate max-w-full text-ellipsis">
                       <option value="" disabled>Pilih Alasan DQ...</option>
                       {dqOptions.map((opt, i) => <option key={i} value={opt} className="text-xs truncate">{opt}</option>)}
                    </select>
                    
                    {newDQ.reason === 'Lainnya (Input Manual)' && (
                        <input required autoFocus type="text" value={manualReason} onChange={e => setManualReason(e.target.value)} className="w-full p-2 border border-red-300 rounded-lg bg-white text-sm mt-2 outline-none focus:ring-2 focus:ring-red-500" placeholder="Ketik deskripsi pelanggaran..." />
                    )}
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 transition text-white font-bold py-3 rounded-lg shadow">UMUMKAN DQ</button>
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

function CallRoomPanel({ tournament, events, updateLiveState, lang, t }: any) {
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
              callRoomEventTotalSeries: targetEvent.totalSeries, callRoomSeries: nextSeries,
              callRoomLastUpdate: getWIBTime()
          });
      });
  };

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 relative">
        {loading && <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-emerald-600" size={40}/></div>}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-600 text-white p-4 flex justify-between items-center"><h2 className="font-bold text-lg flex items-center gap-2"><ClipboardList /> {t[lang].callroom_status}</h2><span className="bg-emerald-800 text-xs px-2 py-1 rounded">{t[lang].live_control}</span></div>
            <div className="p-8 sm:p-12 text-center min-h-[300px] flex flex-col justify-center items-center bg-emerald-50">
              {needsStart ? (
                 <div className="animate-in fade-in zoom-in">
                    <p className="text-emerald-700 mb-4 font-medium">{t[lang].ready_to_call}</p>
                    <button onClick={() => wrapAsync(async () => {
                             const first = events[0]; 
                             await updateLiveState({ callRoomEventId: first.id, callRoomEventName: first.name, callRoomEventNumber: first.number, callRoomEventTotalSeries: first.totalSeries, callRoomSeries: 1, callRoomLastUpdate: getWIBTime() });
                    })} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3"><Play size={24} fill="currentColor" /> {t[lang].btn_init_callroom}</button>
                </div>
              ) : currentCallEvent ? (
                <>
                  <div className="text-emerald-700 font-bold tracking-widest uppercase mb-1">{t[lang].calling_now}</div>
                  
                  <div className="w-full flex items-center justify-center h-20 sm:h-24 mb-4 sm:mb-6">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 leading-tight line-clamp-3 overflow-hidden text-balance">
                          {currentCallEvent.number}. {currentCallEvent.name}
                      </h1>
                  </div>

                  <div className="inline-block bg-white shadow-sm border border-emerald-200 rounded-lg p-6 mb-8">
                       <span className="text-6xl font-black text-emerald-600">{ls.callRoomSeries}</span>
                       <span className="text-xs sm:text-sm text-slate-400 block uppercase mt-2">{t[lang].from_series} {currentCallEvent.totalSeries} {t[lang].series}</span>
                  </div>
                  
                  <div className="flex gap-2 sm:gap-4 justify-center w-full px-4 sm:px-0">
                       <button onClick={() => handleNav('prev')} className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-lg border-2 border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition text-sm sm:text-base">Prev</button>
                       <button onClick={() => handleNav('next')} className="flex-[2] sm:flex-none px-6 sm:px-10 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2 text-sm sm:text-base">
                          {t[lang].btn_call_next} <ChevronRight size={20} />
                       </button>
                  </div>
                </>
              ) : <div className="text-slate-400 italic">{t[lang].waiting_data}</div>}
            </div>
          </div>
        </div>
        <div className="md:col-span-1 space-y-4">
           <div className="bg-slate-800 text-white p-5 rounded-xl shadow-md"><h3 className="text-slate-400 text-xs uppercase font-bold mb-2">{t[lang].live_in_pool}</h3><div className="text-2xl font-bold text-yellow-400">{t[lang].event} {ls.currentEventNumber || '-'}</div><div className="text-lg">{t[lang].series} {ls.currentSeries}</div></div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"><h3 className="text-slate-400 text-xs uppercase font-bold mb-3">{t[lang].next_event_prep}</h3>{nextEvent ? <div><div className="font-bold text-slate-800">{nextEvent.number}. {nextEvent.name}</div><div className="text-sm text-slate-500 mt-1">{nextEvent.totalSeries} {t[lang].series}</div></div> : <div className="text-slate-400 text-sm italic">{t[lang].no_next_event}</div>}</div>
        </div>
    </div>
  );
}

function LanguageSplash({ setLang, onSelect }: any) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center" />
      
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-500">
         <img src="/sangkuriang%201.png" alt="Logo" className="h-20 sm:h-24 w-auto mx-auto mb-6 drop-shadow-lg" onError={(e:any) => e.target.style.display='none'} />
         <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Welcome</h1>
         <p className="text-slate-400 mb-8 text-xs sm:text-sm">Please select your preferred language<br/><span className="italic mt-1 block">Silakan pilih bahasa pilihan Anda</span></p>
         
         <div className="flex flex-col gap-4">
            <button 
              onClick={() => { setLang('id'); onSelect(); }} 
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-blue-600 hover:border-blue-500 border border-slate-700 text-white p-4 sm:p-5 rounded-2xl transition-all group shadow-lg"
            >
                <div className="flex items-center gap-4">
                    <img src="https://flagcdn.com/w80/id.png" alt="ID" className="w-8 h-8 rounded-full object-cover border border-slate-600 group-hover:border-white transition-colors" />
                    <span className="font-bold text-lg group-hover:text-white text-slate-200">ID - Bahasa Indonesia</span>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-white" />
            </button>
            
            <button 
              onClick={() => { setLang('en'); onSelect(); }} 
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-blue-600 hover:border-blue-500 border border-slate-700 text-white p-4 sm:p-5 rounded-2xl transition-all group shadow-lg"
            >
                <div className="flex items-center gap-4">
                    <img src="https://flagcdn.com/w80/us.png" alt="EN" className="w-8 h-8 rounded-full object-cover border border-slate-600 group-hover:border-white transition-colors" />
                    <span className="font-bold text-lg group-hover:text-white text-slate-200">EN - English</span>
                </div>
                <ChevronRight className="text-slate-500 group-hover:text-white" />
            </button>
         </div>
      </div>
    </div>
  );
}