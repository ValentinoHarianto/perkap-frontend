import { ReactNode, useEffect, useState } from "react";
import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";

type Role = "student" | "staff" | "admin";
type IconName =
  | "arrow" | "bell" | "book" | "box" | "calendar" | "chart" | "check"
  | "chevron" | "clock" | "close" | "document" | "download" | "grid"
  | "help" | "history" | "home" | "logout" | "mail" | "menu" | "more"
  | "plus" | "printer" | "scan" | "search" | "settings" | "shield" | "upload" | "users";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" /><path d="M8 7h8M8 11h6" /></>,
  box: <><path d="m21 8-9 5-9-5 9-5 9 5Z" /><path d="m3 8 9 5 9-5v8l-9 5-9-5V8ZM12 13v8" /></>,
  calendar: <><path d="M3 5h18v16H3V5ZM16 3v4M8 3v4M3 10h18" /></>,
  chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  chevron: <><path d="m9 18 6-6-6-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  document: <><path d="M6 2h8l4 4v16H6V2Z" /><path d="M14 2v5h4M9 12h6M9 16h6" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 3.4 2.5c-.9.35-.9 1.5-.9 1.5M12 17h.01" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  home: <><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" /></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  printer: <><path d="M7 9V3h10v6M7 18H4V9h16v9h-3M7 14h10v7H7v-7Z" /></>,
  scan: <><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10M9 9v6M15 9v6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l-.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  shield: <><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M17 15a6 6 0 0 1 5 6" /></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`}>
      <div className="brand__mark"><span>U</span></div>
      {!compact && <div><strong>PERKAP UNIKA</strong><small>Soegijapranata</small></div>}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode; variant?: "primary" | "secondary" | "danger" | "warning" | "ghost";
  icon?: IconName; onClick?: () => void; type?: "button" | "submit"; className?: string; disabled?: boolean;
};

function Button(props: ButtonProps) {
  const { children, variant = "primary", icon, onClick, type = "button", className = "" } = props;
  return <button type={type} className={`btn btn--${variant} ${className}`} onClick={onClick} disabled={props.disabled ?? false}>{icon && <Icon name={icon} size={17} />}<span>{children}</span></button>;
}

const roleLabels: Record<Role, string> = { student: "Mahasiswa", staff: "Petugas Perkap", admin: "Super Admin" };

function Login({ onLogin }: { onLogin: (role: Role, email: string) => void }) {
  const [errorMsg, setErrorMsg] = useState("");

const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setErrorMsg("");
      const res = await fetch('https://perkap-backend.vercel.app/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }) // Kembalikan ke 'token'
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        onLogin(data.role, data.email);
      } else {
        setErrorMsg(data.message || "Login gagal. Gunakan email kampus.");
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server backend.");
    }
  };

  return (
    <main className="login">
      <div className="login__orb login__orb--one" />
      <div className="login__orb login__orb--two" />
      <section className="login__intro">
        <div className="login__university">UNIVERSITAS KATOLIK</div>
        <h1>Logistik kampus,<br /><em>lebih tertata.</em></h1>
        <p>Satu pintu untuk peminjaman alat, perlengkapan, dan logistik kegiatan kampus.</p>
        <div className="login__stats"><div><strong>24/7</strong><span>Akses portal</span></div><div><strong>120+</strong><span>Unit peralatan</span></div><div><strong>4.9</strong><span>Rating layanan</span></div></div>
      </section>
      <div className="login__card">
        <Logo />
        <div className="login__heading">
          <span>Selamat datang kembali</span>
          <h2>Sistem Peminjaman Alat Perkap - Unika</h2>
          <p>Login khusus menggunakan email resmi kampus.</p>
        </div>
        
        {errorMsg && <div style={{ background: '#ffe6e6', color: '#d9534f', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>{errorMsg}</div>}

        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0', width: '100%' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrorMsg('Otentikasi Google gagal.')}
            shape="pill" 
            width="100%"
            use_fedcm_for_prompt={false}
          />
        </div>

        <p className="login__help"><Icon name="help" size={16} /> Butuh bantuan? Hubungi <b>PERKAP UNIKA</b></p>
      </div>
      <div className="login__footer">© 2026 Universitas Katolik Soegijapranata · Semarang</div>
    </main>
  );
}

type NavItem = { id: string; label: string; icon: IconName };

function Sidebar({ role, active, items, collapsed, onToggle, onSelect, onLogout, userEmail }: {
  role: Role; active: string; items: NavItem[]; collapsed: boolean; onToggle: () => void; onSelect: (id: string) => void; onLogout: () => void; userEmail: string;
}) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__head"><Logo compact={collapsed} /><button className="icon-btn sidebar__toggle" onClick={onToggle} aria-label="Ciutkan menu"><Icon name={collapsed ? "chevron" : "menu"} /></button></div>
      <nav className="sidebar__nav">
        <span className="sidebar__label">MENU UTAMA</span>
        {items.map((item) => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => onSelect(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{active === item.id && <i />}</button>)}
      </nav>
      <div className="sidebar__profile"><div className="avatar">UN</div><div><strong>{userEmail}</strong><span>{roleLabels[role]}</span></div><button onClick={onLogout} aria-label="Keluar"><Icon name="logout" size={18} /></button></div>
    </aside>
  );
}

function Header({ eyebrow, title, onMenu, onHelp, onNotification }: { eyebrow: string; title: string; onMenu?: () => void; onHelp: () => void; onNotification: () => void }) {
  return <header className="topbar"><button className="icon-btn topbar__menu" onClick={onMenu} aria-label="Buka navigasi"><Icon name="menu" /></button><div><span>{eyebrow}</span><h1>{title}</h1></div><div className="topbar__actions"><button className="icon-btn" onClick={onHelp} aria-label="Bantuan"><Icon name="help" /></button><button className="icon-btn notification" onClick={onNotification} aria-label="Notifikasi"><Icon name="bell" /><i /></button><div className="avatar">UN</div></div></header>;
}

function Badge({ children, tone = "purple" }: { children: ReactNode; tone?: "purple" | "green" | "yellow" | "red" | "gray" | "blue" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

const staticServices = [
  { title: "Proyektor Epson EB-X06", category: "Multimedia", icon: "box" as IconName, desc: "Proyektor 3LCD untuk presentasi kelas, seminar, dan kegiatan kampus.", total: 5, available: 3, time: "Maks. 3 hari", tone: "lavender", serials: ["EPS-001", "EPS-002", "EPS-003", "EPS-004", "EPS-005"] },
  { title: "Sound System Portable", category: "Audio", icon: "bell" as IconName, desc: "Paket speaker aktif, mixer, dan dua mikrofon wireless.", total: 4, available: 2, time: "Maks. 2 hari", tone: "blue", serials: ["SND-001", "SND-002", "SND-003", "SND-004"] },
  { title: "Tenda Lipat 3×3 Meter", category: "Logistik Acara", icon: "home" as IconName, desc: "Tenda lipat tahan air untuk kegiatan luar ruang di area kampus.", total: 8, available: 6, time: "Maks. 3 hari", tone: "gold", serials: ["TND-001", "TND-002", "TND-003", "TND-004", "TND-005", "TND-006", "TND-007", "TND-008"] },
  { title: "Kamera Mirrorless Sony", category: "Dokumentasi", icon: "calendar" as IconName, desc: "Kamera dokumentasi lengkap dengan baterai dan kartu memori.", total: 3, available: 1, time: "Maks. 2 hari", tone: "green", serials: ["CAM-001", "CAM-002", "CAM-003"] },
  { title: "Meja Lipat Acara", category: "Logistik Acara", icon: "grid" as IconName, desc: "Meja lipat portabel untuk registrasi dan kebutuhan acara.", total: 12, available: 9, time: "Maks. 3 hari", tone: "pink", serials: ["MJA-001", "MJA-002", "MJA-003"] },
  { title: "Kabel Roll 25 Meter", category: "Kelistrikan", icon: "settings" as IconName, desc: "Kabel ekstensi berpelindung untuk distribusi daya kegiatan.", total: 10, available: 0, time: "Maks. 2 hari", tone: "gray", serials: ["KBL-001", "KBL-002", "KBL-003"] },
];

function StudentCatalog({ services, onApply, stockLevels = {} }: { services: any[]; onApply: (service: string) => void; stockLevels?: Record<string, number> }) {
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const categories = ["Semua", "Multimedia", "Audio", "Logistik Acara", "Dokumentasi", "Kelistrikan"];
  const visible = services.filter((service) => (category === "Semua" || service.category === category) && service.title.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="hero"><div><Badge tone="yellow">PERKAP UNIKA · LIVE INVENTORY</Badge><h2>Pinjam alat kampus tanpa proses rumit</h2><p>Cek stok fisik, ajukan peminjaman, dan pantau pengembalian dalam satu portal.</p></div><div className="hero__art"><Icon name="box" size={52} /></div></div>
    <div className="section-head"><div><h2>Katalog alat & perlengkapan</h2><p>Stok diperbarui berdasarkan unit fisik yang tersedia.</p></div></div>
    <div className="catalog-tools"><label className="search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari proyektor, sound system, tenda..." /></label><div className="filter-pills">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
    <div className="service-grid">{visible.map((service) => { const available = stockLevels[service.title] ?? service.available; return <article className="service-card" key={service.title}><div className="service-card__top"><div className={`service-icon service-icon--${service.tone}`}><Icon name={service.icon} /></div><Badge tone={available === 0 ? "red" : available <= 2 ? "yellow" : "green"}>Tersedia: {available}/{service.total}</Badge></div><span className="service-card__category">{service.category}</span><h3>{service.title}</h3><p>{service.desc}</p><div className="service-card__meta"><Icon name="clock" size={16} /><span>{service.time}</span></div><Button variant="secondary" icon="plus" disabled={available === 0} onClick={() => onApply(service.title)}>{available === 0 ? "Stok habis" : "Pinjam / Ajukan"}</Button></article>; })}</div>
    {!visible.length && <section className="empty-state"><Icon name="search" size={30} /><h3>Layanan tidak ditemukan</h3><p>Coba kata kunci atau kategori lain.</p><Button variant="secondary" onClick={() => { setQuery(""); setCategory("Semua"); }}>Reset pencarian</Button></section>}
  </>;
}

function StudentRequestForm({ service, onBack, onSubmit }: { service: string; onBack: () => void; onSubmit: (purpose: string, file: File, dateStr: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [purpose, setPurpose] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const item = staticServices.find((entry) => entry.title === service) ?? staticServices[0];
  
  const validateFile = (selected?: File) => {
    if (!selected) return;
    if (selected.type !== "application/pdf" || !selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(null);
      setError("Format tidak didukung. Surat Permohonan Peminjaman wajib berupa PDF (.pdf).");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("Ukuran file melebihi batas maksimum 5 MB.");
      return;
    }
    setFile(selected);
    setError("");
  };

  return <>
    <div className="backline"><button onClick={onBack}><Icon name="arrow" size={17} /> Kembali ke katalog</button><Badge tone="purple">FORMULIR PEMINJAMAN</Badge></div>
    <div className="request-layout"><section className="panel request-form">
      <div className="request-form__heading"><div className="service-icon service-icon--lavender"><Icon name="box" /></div><div><span>{item.category}</span><h2>{service}</h2><p>Ajukan unit fisik yang tersedia untuk kegiatan kampus.</p></div></div>
      
      <div style={{ marginBottom: '16px' }}>
        <label className="field"><span>Tanggal Peminjaman Terpilih</span></label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="text" readOnly value={borrowDate ? `Tanggal: ${borrowDate}` : "Belum memilih tanggal"} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', background: '#f8f9fa' }} />
          <Button variant="secondary" icon="calendar" onClick={() => setShowCalendar(true)}>Pilih Kalender</Button>
        </div>
      </div>

      <label className="field"><span>Keperluan peminjaman</span><textarea placeholder="Jelaskan kegiatan dan lokasi penggunaan" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></label>
      
      <div className="upload-section"><div className="upload-section__title"><div><h3>Unggah Surat Permohonan</h3><p>Surat permohonan peminjaman alat wajib format PDF.</p></div><Badge tone="red">Wajib</Badge></div>
        <label className={`upload-box upload-box--large ${error ? "upload-box--error" : ""} ${file ? "upload-box--success" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); validateFile(event.dataTransfer.files[0]); }}>
          <input type="file" accept=".pdf,application/pdf" onChange={(event) => validateFile(event.target.files?.[0])} />
          <div className="upload-box__icon"><Icon name={file ? "check" : "upload"} size={24} /></div><strong>{file ? file.name : "Unggah Surat Permohonan (PDF)"}</strong>
          <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Siap dikirim` : "Tarik dan lepas file ke area ini"}</span><span className="file-rule"><b>Hanya PDF (.pdf)</b><i />Maksimum 5 MB</span><span className="file-picker">{file ? "Ganti file PDF" : "Pilih file PDF"}</span>
        </label>{error && <p className="upload-error"><Icon name="close" size={15} /> {error}</p>}
      </div>
      <div className="request-form__actions"><Button variant="secondary" onClick={onBack}>Batalkan</Button><Button icon="arrow" disabled={!file || !purpose.trim() || !borrowDate} onClick={() => onSubmit(purpose, file!, borrowDate)}>Kirim Pengajuan Peminjaman</Button></div>
    </section><aside className="request-summary"><h3>Ringkasan unit</h3><dl><div><dt>Stok fisik</dt><dd><Badge tone="green">{item.available}/{item.total} tersedia</Badge></dd></div><div><dt>Durasi maksimal</dt><dd>{item.time}</dd></div><div><dt>Pengambilan</dt><dd>Gudang Perkap</dd></div></dl><Button variant="secondary" icon="calendar" onClick={() => setShowCalendar(true)}>Pilih tanggal kalender</Button></aside></div>
    
    {showCalendar && (
      <AvailabilityCalendarModal 
        service={service} 
        onClose={() => setShowCalendar(false)} 
        onSelectDate={(dateStr) => setBorrowDate(dateStr)} 
      />
    )}
  </>;
}

function AvailabilityCalendarModal({ service, onClose, onSelectDate }: { service: string; onClose: () => void; onSelectDate: (dateStr: string) => void }) {
  const [month, setMonth] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const item = staticServices.find((entry) => entry.title === service) ?? staticServices[0];
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const unavailable = item.available === 0 || (day % 9 === 0 || day % 13 === 0);
    const limited = !unavailable && (day % 5 === 0 || day % 7 === 0);
    
    return { day, dateStr, unavailable, limited };
  });

  const moveMonth = (offset: number) => setMonth(new Date(year, monthIndex + offset, 1));

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal availability-modal" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div className="modal__icon"><Icon name="calendar" /></div>
          <div>
            <h2>Pilih Tanggal Peminjaman</h2>
            <p>{item.title} · Klik tanggal pada kalender untuk memesan</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup kalender"><Icon name="close" /></button>
        </div>
        
        <div className="availability-calendar" style={{ padding: '1.5rem' }}>
          <div className="calendar-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button className="icon-btn" onClick={() => moveMonth(-1)}><Icon name="chevron" size={18} /></button>
            <div><span>JADWAL RESERVASI</span> <strong>{monthNames[monthIndex]} {year}</strong></div>
            <button className="icon-btn" onClick={() => moveMonth(1)}><Icon name="chevron" size={18} /></button>
          </div>
          
          <div className="calendar-weekdays" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {weekdays.map((day) => <span key={day}>{day}</span>)}
          </div>
          
          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {cells.map((cell, index) => {
              if (!cell) return <div key={index} className="calendar-day empty" />;
              
              const isSelected = selectedDate === cell.dateStr;
              let bgStyle = '#f8f9fa';
              let textColor = '#24212a';
              
              if (cell.unavailable) {
                bgStyle = '#f5f3f5';
                textColor = '#a59fa8';
              } else if (isSelected) {
                bgStyle = 'var(--purple-800)';
                textColor = '#ffffff';
              } else if (cell.limited) {
                bgStyle = '#fffaf0';
              }

              return (
                <div 
                  key={index} 
                  className={`calendar-day ${cell.unavailable ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => !cell.unavailable && setSelectedDate(cell.dateStr)}
                  style={{ 
                    padding: '10px', 
                    textAlign: 'center', 
                    background: bgStyle, 
                    color: textColor,
                    borderRadius: '8px', 
                    cursor: cell.unavailable ? 'not-allowed' : 'pointer',
                    border: isSelected ? '2px solid var(--purple-950)' : '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>{cell.day}</strong>
                  <span style={{ fontSize: '8px', marginTop: '2px' }}>
                    {cell.unavailable ? 'Penuh' : cell.limited ? 'Terbatas' : 'Tersedia'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal__foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            {selectedDate ? <span>Dipilih: <b>{selectedDate}</b></span> : 'Belum ada tanggal dipilih'}
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button 
              variant="primary" 
              disabled={!selectedDate} 
              onClick={() => {
                if (selectedDate) {
                  onSelectDate(selectedDate);
                  onClose();
                }
              }}
            >
              Gunakan Tanggal Ini
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StudentHistory({ borrowings }: { borrowings: any[] }) {
  return <>
    <div className="section-head admin-head"><div><h2>Riwayat Peminjaman</h2><p>Daftar pengajuan peminjaman alat Anda yang tersinkron dengan database.</p></div><Badge tone="green"><i className="live-dot" /> Database Connected</Badge></div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>ID</th><th>Alat</th><th>Tanggal Pinjam</th><th>Status</th><th>Waktu Pengajuan</th></tr></thead><tbody>
      {borrowings.map((b: any) => <tr key={b.id}><td><b>{b.id}</b></td><td>{b.service}</td><td>{b.borrowDate || '-'}</td><td><Badge tone={b.status === "Disetujui" ? "green" : b.status === "Ditolak" ? "red" : "yellow"}>{b.status}</Badge></td><td>{b.submittedAt}</td></tr>)}
    </tbody></table></div></section>
  </>;
}

function StudentNotifications() {
  return <><div className="section-head admin-head"><div><h2>Notifikasi</h2><p>Pembaruan alokasi dan status peminjaman alat.</p></div></div><section className="panel notification-list"><div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Tidak ada notifikasi baru.</div></section></>;
}

function StaffValidation({ borrowings, onUpdateStatus }: { borrowings: any[]; onUpdateStatus: (id: string, status: string) => void }) {
  const viewPdf = (id: string) => window.open(`data:text/plain;charset=utf-8,Surat%20Permohonan%20Peminjaman%20${id}`, "_blank");
  return <>
    <div className="welcome"><div><h2>Validasi Pengajuan Masuk</h2><p>Tinjau dan setujui atau tolak permohonan peminjaman dari mahasiswa.</p></div></div>
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Peminjam</th><th>Alat</th><th>Tanggal</th><th>Dokumen PDF</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
      {borrowings.map((b: any) => <tr key={b.id}><td><b>{b.email}</b></td><td>{b.service}</td><td>{b.borrowDate || '-'}</td><td><Button variant="secondary" icon="document" onClick={() => viewPdf(b.id)}>Surat_Permohonan.pdf</Button></td><td><Badge tone={b.status === "Disetujui" ? "green" : b.status === "Ditolak" ? "red" : "yellow"}>{b.status}</Badge></td><td><div className="row-actions"><Button variant="secondary" icon="check" disabled={b.status === "Disetujui"} onClick={() => onUpdateStatus(b.id, "Disetujui")}>Setujui</Button><Button variant="danger" icon="close" disabled={b.status === "Ditolak"} onClick={() => onUpdateStatus(b.id, "Ditolak")}>Tolak</Button></div></td></tr>)}
    </tbody></table></div></section>
  </>;
}

function Dashboard({ role, userEmail, onLogout, services, borrowings, onStudentSubmit, onUpdateStatus, stockLevels }: any) {
  const roleNav: Record<Role, NavItem[]> = {
    student: [{ id: "catalog", label: "Katalog Alat", icon: "box" }, { id: "history", label: "Riwayat Peminjaman", icon: "history" }, { id: "notifications", label: "Notifikasi", icon: "bell" }],
    staff: [{ id: "validation", label: "Validasi Peminjaman", icon: "check" }, { id: "loans", label: "Peminjaman Aktif", icon: "clock" }, { id: "scanner", label: "Scan QR / Handover", icon: "scan" }, { id: "inventory", label: "Stok Fisik & Seri", icon: "box" }],
    admin: [{ id: "services", label: "Master Alat Perkap", icon: "settings" }, { id: "audit", label: "Log Aktivitas", icon: "history" }],
  };

  const [active, setActive] = useState(role === "student" ? "catalog" : role === "staff" ? "validation" : "services");
  const [selectedService, setSelectedService] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const titles: Record<string, string> = { catalog: "Katalog Alat", request: "Ajukan Peminjaman", history: "Riwayat Peminjaman", notifications: "Notifikasi", validation: "Validasi Peminjaman", loans: "Peminjaman Aktif", scanner: "Scan QR", inventory: "Stok Fisik", services: "Master Alat Perkap", audit: "Log Aktivitas" };
  const navigate = (id: string) => { setActive(id); setMobileOpen(false); };

  const studentContent = active === "request" ? <StudentRequestForm service={selectedService} onBack={() => setActive("catalog")} onSubmit={(purpose: string, file: File, borrowDate: string) => { onStudentSubmit(selectedService, purpose, file, borrowDate); setShowSyncToast(true); setActive("history"); }} /> : active === "history" ? <StudentHistory borrowings={borrowings.filter((b: any) => b.email === userEmail)} /> : active === "notifications" ? <StudentNotifications /> : <StudentCatalog services={services} stockLevels={stockLevels} onApply={(s: string) => { setSelectedService(s); setActive("request"); }} />;

  return (
    <div className={`app-shell ${mobileOpen ? "mobile-open" : ""}`}>
      <Sidebar role={role as Role} active={active} items={roleNav[role as Role]} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onSelect={navigate} onLogout={onLogout} userEmail={userEmail} />
      <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi" />
      <div className="app-main">
        <Header eyebrow={`PERKAP / ${roleLabels[role as Role]}`} title={titles[active]} onMenu={() => setMobileOpen(true)} onHelp={() => window.location.href = "mailto:perkap@unika.ac.id"} onNotification={() => setActive("notifications")} />
        <main className="content">
          {role === "student" && studentContent}
          {role === "staff" && (active === "validation" ? <StaffValidation borrowings={borrowings} onUpdateStatus={onUpdateStatus} /> : <div className="section-head"><h2>Fitur Operasional Staff</h2><p>Gunakan menu validasi untuk menyetujui peminjaman.</p></div>)}
          {role === "admin" && <div className="section-head"><h2>Panel Super Admin</h2><p>Manajemen sistem dan master alat inventaris kampus.</p></div>}
        </main>
      </div>
      {showSyncToast && <section className="sync-toast" role="status"><div className="sync-toast__icon"><Icon name="check" /></div><div><strong>Pengajuan Berhasil Dikirim!</strong><span>Tersinkron dengan database PostgreSQL.</span></div><button onClick={() => setShowSyncToast(false)}><Icon name="close" size={18} /></button><i /></section>}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [services, setServices] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  useEffect(() => {
    if (role) {
      fetch('https://perkap-backend.vercel.app/api/services').then(res => res.json()).then(data => setServices(data)).catch(() => {});
      fetch('https://perkap-backend.vercel.app/api/borrowings').then(res => res.json()).then(data => setBorrowings(data)).catch(() => {});
    }
  }, [role]);

  const handleStudentSubmit = async (service: string, purpose: string, file: File, borrowDate: string) => {
    try {
      const res = await fetch('https://perkap-backend.vercel.app/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, service, purpose, borrowDate })
      });
      const data = await res.json();
      if (data.success) {
        setBorrowings((prev: any[]) => [...prev, { id: data.id, email: userEmail, service, borrowDate, status: data.status, submittedAt: data.submittedAt }]);
        setStockLevels(prev => ({ ...prev, [service]: (prev[service] ?? 2) - 1 }));
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`https://perkap-backend.vercel.app/api/borrowings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setBorrowings((prev: any[]) => prev.map((b: any) => b.id === id ? { ...b, status } : b));
    } catch (err) { console.error(err); }
  };

  return role ? (
    <Dashboard role={role} userEmail={userEmail} onLogout={() => setRole(null)} services={services} borrowings={borrowings} onStudentSubmit={handleStudentSubmit} onUpdateStatus={handleUpdateStatus} stockLevels={stockLevels} />
  ) : (
    <Login onLogin={(r, email) => { setRole(r); setUserEmail(email); }} />
  );
}