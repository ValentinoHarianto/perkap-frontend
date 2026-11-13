import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import "./extra.css";

/* ============================== TYPES ============================== */
type Role = "student" | "staff" | "admin";
type IconName =
  | "arrow" | "bell" | "book" | "box" | "calendar" | "chart" | "check"
  | "chevron" | "clock" | "close" | "document" | "download" | "grid"
  | "help" | "history" | "home" | "logout" | "mail" | "menu" | "more"
  | "plus" | "printer" | "scan" | "search" | "settings" | "shield" | "upload" | "users";

type Service = { title: string; category: string; icon: IconName; desc: string; total: number; available: number; time: string; tone: string; serials: string[] };
type Borrowing = { id: string; email: string; service: string; borrowDate?: string; purpose?: string; file?: string; status: string; submittedAt?: string };
type MaintenanceItem = { serial: string; item: string; issue: string; photo: string; reportedAt: string; status: "In Maintenance" | "Inspection"; loanId?: string };
type HandoverEntry = { time: string; id: string; unit: string; activity: string; condition: string; photo: string };
type AuditEntry = { time: string; actor: string; activity: string; module: string; target: string };
type PhysicalUnitStatus = "Tersedia" | "Direservasi" | "Dipinjam" | "Perawatan";
type NavItem = { id: string; label: string; icon: IconName };

type Ctx = {
  catalog: Service[];
  borrowings: Borrowing[];
  stockLevels: Record<string, number>;
  maintenance: MaintenanceItem[];
  handovers: HandoverEntry[];
  audit: AuditEntry[];
  files: Record<string, string>;
  serialMap: Record<string, string>;
  submit: (service: string, purpose: string, file: File, borrowDate: string) => Promise<string | null>;
  setStatus: (id: string, status: string) => void;
  addMaintenance: (item: MaintenanceItem) => void;
  updateMaintenance: (serial: string, status: MaintenanceItem["status"]) => void;
  resolveMaintenance: (serial: string) => void;
  adjustStock: (service: string, delta: number) => void;
  editTotal: (service: string, delta: number) => void;
  addSerial: (service: string, serial: string) => void;
  addHandover: (entry: HandoverEntry) => void;
  log: (actor: string, activity: string, module: string, target: string) => void;
};

/* ============================== CONSTANTS ============================== */
const API = "https://perkap-backend.vercel.app/api";
const GOOGLE_CLIENT_ID = "526565725097-uhj6ubjrgtvtlc0i07beoqip2blr4i1q.apps.googleusercontent.com";
const roleLabels: Record<Role, string> = { student: "Mahasiswa", staff: "Petugas Perkap", admin: "Super Admin" };

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
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  shield: <><path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></>,
  users: <><circle cx="9" cy="8" r="4" /><path d="M2 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M17 15a6 6 0 0 1 5 6" /></>,
};

const serialList = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, "0")}`);

const staticServices: Service[] = [
  { title: "Proyektor Epson EB-X06", category: "Multimedia", icon: "box", desc: "Proyektor 3LCD untuk presentasi kelas, seminar, dan kegiatan kampus.", total: 5, available: 3, time: "Maks. 3 hari", tone: "lavender", serials: serialList("EPS", 5) },
  { title: "Sound System Portable", category: "Audio", icon: "bell", desc: "Paket speaker aktif, mixer, dan dua mikrofon wireless.", total: 4, available: 2, time: "Maks. 2 hari", tone: "blue", serials: serialList("SND", 4) },
  { title: "Tenda Lipat 3×3 Meter", category: "Logistik Acara", icon: "home", desc: "Tenda lipat tahan air untuk kegiatan luar ruang di area kampus.", total: 8, available: 6, time: "Maks. 3 hari", tone: "gold", serials: serialList("TND", 8) },
  { title: "Kamera Mirrorless Sony", category: "Dokumentasi", icon: "calendar", desc: "Kamera dokumentasi lengkap dengan baterai dan kartu memori.", total: 3, available: 1, time: "Maks. 2 hari", tone: "green", serials: serialList("CAM", 3) },
  { title: "Meja Lipat Acara", category: "Logistik Acara", icon: "grid", desc: "Meja lipat portabel untuk registrasi dan kebutuhan acara.", total: 12, available: 9, time: "Maks. 3 hari", tone: "pink", serials: serialList("MJA", 12) },
  { title: "Kabel Roll 25 Meter", category: "Kelistrikan", icon: "settings", desc: "Kabel ekstensi berpelindung untuk distribusi daya kegiatan.", total: 10, available: 0, time: "Maks. 2 hari", tone: "gray", serials: serialList("KBL", 10) },
];

/* ============================== HELPERS ============================== */
const num = (v: any, d: number) => (v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const nowLabel = () => new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function normalizeService(raw: any): Service {
  const title = String(raw?.title ?? raw?.name ?? "Alat");
  const base = staticServices.find((s) => s.title === title);
  const total = num(raw?.total ?? raw?.total_stock, base?.total ?? 1);
  const serials: string[] = Array.isArray(raw?.serials) && raw.serials.length ? raw.serials : base?.serials ?? serialList(title.slice(0, 3).toUpperCase(), total);
  return {
    title,
    category: raw?.category ?? base?.category ?? "Lainnya",
    icon: base?.icon ?? "box",
    desc: raw?.desc ?? raw?.description ?? base?.desc ?? "Peralatan kampus.",
    total,
    available: clamp(num(raw?.available ?? raw?.available_stock, base?.available ?? total), 0, total),
    time: raw?.time ?? base?.time ?? "Maks. 3 hari",
    tone: base?.tone ?? "lavender",
    serials,
  };
}

function normalizeBorrowing(raw: any): Borrowing {
  return {
    id: String(raw?.id ?? ""),
    email: raw?.email ?? "",
    service: raw?.service ?? "",
    borrowDate: raw?.borrowDate ?? raw?.borrow_date ?? undefined,
    purpose: raw?.purpose ?? undefined,
    file: raw?.file ?? undefined,
    status: raw?.status ?? "Menunggu Verifikasi",
    submittedAt: raw?.submittedAt ?? raw?.submitted_at ?? undefined,
  };
}

const CLOSED = ["Ditolak", "Dikembalikan"];
const isOpen = (s: string) => !CLOSED.includes(s);
const isPending = (s: string) => !["Disetujui", "Ditolak", "Dipinjam", "Dikembalikan", "In Maintenance"].includes(s);

function statusMeta(s: string): { label: string; tone: "yellow" | "green" | "blue" | "red" | "gray" } {
  if (s === "Disetujui") return { label: "Disetujui Petugas", tone: "green" };
  if (s === "Dipinjam") return { label: "Sedang Dipinjam", tone: "blue" };
  if (s === "Dikembalikan") return { label: "Selesai", tone: "gray" };
  if (s === "In Maintenance") return { label: "Unit Dalam Perbaikan", tone: "red" };
  if (s === "Ditolak") return { label: "Ditolak", tone: "red" };
  return { label: "Menunggu Verifikasi", tone: "yellow" };
}

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseISO = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T00:00:00`) : null);
const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-");
const maxDays = (svc?: Service) => parseInt(svc?.time.match(/\d+/)?.[0] ?? "3", 10);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

function dueDateOf(b: Borrowing, catalog: Service[]) {
  const start = parseISO(b.borrowDate);
  return start ? addDays(start, maxDays(catalog.find((s) => s.title === b.service))) : null;
}
function daysLate(b: Borrowing, catalog: Service[]) {
  if (b.status !== "Dipinjam") return 0;
  const due = dueDateOf(b, catalog);
  if (!due) return 0;
  return Math.max(0, Math.round((startOfToday().getTime() - due.getTime()) / 86400000));
}
const isOverdue = (b: Borrowing, catalog: Service[]) => daysLate(b, catalog) > 0;

function bookedOn(day: string, svc: Service, borrowings: Borrowing[]) {
  const d = parseISO(day)!.getTime();
  return borrowings.filter((b) => {
    if (b.service !== svc.title || !isOpen(b.status)) return false;
    const start = parseISO(b.borrowDate);
    if (!start) return false;
    const end = addDays(start, maxDays(svc) - 1).getTime();
    return d >= start.getTime() && d <= end;
  }).length;
}

function unitStatuses(svc: Service, available: number, maintenance: MaintenanceItem[], borrowings: Borrowing[], serialMap: Record<string, string>): Record<string, PhysicalUnitStatus> {
  const result: Record<string, PhysicalUnitStatus> = {};
  const inMaint = new Set(maintenance.filter((m) => m.item === svc.title).map((m) => m.serial));
  const loanBySerial: Record<string, Borrowing> = {};
  borrowings.filter((b) => b.service === svc.title && isOpen(b.status) && b.status !== "In Maintenance").forEach((b) => { const s = serialMap[b.id]; if (s) loanBySerial[s] = b; });
  const rest: string[] = [];
  svc.serials.forEach((s) => {
    if (inMaint.has(s)) result[s] = "Perawatan";
    else if (loanBySerial[s]) result[s] = loanBySerial[s].status === "Dipinjam" ? "Dipinjam" : "Direservasi";
    else rest.push(s);
  });
  rest.forEach((s, i) => { result[s] = i < available ? "Tersedia" : "Dipinjam"; });
  return result;
}

function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const initialsOf = (email: string) => (email || "UN").slice(0, 2).toUpperCase();

/* ============================== UI PRIMITIVES ============================== */
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

function Field({ label, placeholder, type = "text", icon, value, onChange }: { label: string; placeholder: string; type?: string; icon?: IconName; value?: string; onChange?: (value: string) => void }) {
  return <label className="field"><span>{label}</span><div className="field__control">{icon && <Icon name={icon} size={18} />}<input type={type} placeholder={placeholder} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} /></div></label>;
}

function Badge({ children, tone = "purple" }: { children: ReactNode; tone?: "purple" | "green" | "yellow" | "red" | "gray" | "blue" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
function StatusBadge({ children, tone }: { children: ReactNode; tone: "green" | "yellow" | "red" | "gray" | "blue" }) {
  return <Badge tone={tone}><i className="status-dot" />{children}</Badge>;
}
function Metric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: IconName; tone: string }) {
  return <article className="metric"><div className={`metric__icon metric__icon--${tone}`}><Icon name={icon} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

const qrPattern = "11111110100111111111010000101010100001011011101000101110110111010111010111011011101010101110110100010101010001011111110101011111111000000010100000000010101110111101010110111001010110011101010111101011101010101001010111011011101101110100010100100010100001011111110110111111111010000101000100001011011101011101110110111010100101011101011101110101111010111011010001010011010001011111110101101111111";
function QRCode({ label }: { label: string }) {
  // pola unik per ID agar setiap tiket tampak berbeda
  const seed = label.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 97;
  const cells = qrPattern.padEnd(441 + 97, qrPattern).slice(seed, seed + 441).split("");
  return <div className="qr-code" role="img" aria-label={`QR tiket ${label}`}>{cells.map((cell, index) => <i key={index} className={cell === "1" ? "filled" : ""} />)}</div>;
}

function LiveCountdown({ target, label }: { target: Date | null; label: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, []);
  if (!target) return <span className="live-countdown"><small>-</small></span>;
  const seconds = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return <span className="live-countdown"><i /><strong>{days > 0 ? `${days}h ` : ""}{hours}:{minutes}:{rest}</strong><small>{label}</small></span>;
}

/* ============================== LOGIN (GOOGLE) ============================== */
function Login({ onLogin }: { onLogin: (role: Role, email: string) => void }) {
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleRedirectLogin = () => {
    const redirectUri = window.location.origin;
    const scope = "email profile openid";
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;
  };

  const verifyTokenWithBackend = async (accessToken: string) => {
    try {
      setErrorMsg("");
      setLoading(true);
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
      const userInfo = await userInfoRes.json();
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken, email: userInfo.email, name: userInfo.name }),
      });
      const data = await res.json();
      if (res.ok && data.success) onLogin(data.role, data.email);
      else setErrorMsg(data.message || "Login gagal. Gunakan email kampus.");
    } catch (_err) {
      setErrorMsg("Gagal terhubung ke server backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const accessToken = new URLSearchParams(hash.substring(1)).get("access_token");
      // bersihkan hash segera agar token tidak diproses dua kali / tersisa di URL
      window.history.replaceState({}, document.title, window.location.pathname);
      if (accessToken) verifyTokenWithBackend(accessToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {errorMsg && <div className="alert-error">{errorMsg}</div>}
        <div className="google-wrap">
          <button className="google-btn" onClick={handleGoogleRedirectLogin} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.87z" /><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.31 7.22 24 12 24z" /><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.13 0 9.84 0 12s.43 3.87 1.18 5.38l4.09-3.14z" /><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.15 2.69 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z" /></svg>
            <span>{loading ? "Memverifikasi akun..." : "Masuk dengan Google Kampus"}</span>
          </button>
        </div>
        <p className="login__help"><Icon name="help" size={16} /> Butuh bantuan? Hubungi <b>PERKAP UNIKA</b></p>
      </div>
      <div className="login__footer">© 2026 Universitas Katolik Soegijapranata · Semarang</div>
    </main>
  );
}

/* ============================== SHELL ============================== */
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
      <div className="sidebar__profile"><div className="avatar">{initialsOf(userEmail)}</div><div><strong>{userEmail}</strong><span>{roleLabels[role]}</span></div><button onClick={onLogout} aria-label="Keluar"><Icon name="logout" size={18} /></button></div>
    </aside>
  );
}

function Header({ eyebrow, title, initials, onMenu, onHelp, onNotification, alert }: { eyebrow: string; title: string; initials: string; onMenu?: () => void; onHelp: () => void; onNotification: () => void; alert: boolean }) {
  return <header className="topbar"><button className="icon-btn topbar__menu" onClick={onMenu} aria-label="Buka navigasi"><Icon name="menu" /></button><div><span>{eyebrow}</span><h1>{title}</h1></div><div className="topbar__actions"><button className="icon-btn" onClick={onHelp} aria-label="Bantuan"><Icon name="help" /></button><button className="icon-btn notification" onClick={onNotification} aria-label="Notifikasi"><Icon name="bell" />{alert && <i />}</button><div className="avatar">{initials}</div></div></header>;
}

/* ============================== STUDENT ============================== */
function StudentCatalog({ services, onApply, stockLevels }: { services: Service[]; onApply: (service: string) => void; stockLevels: Record<string, number> }) {
  const [category, setCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const categories = ["Semua", ...Array.from(new Set(services.map((s) => s.category)))];
  const visible = services.filter((service) => (category === "Semua" || service.category === category) && service.title.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="hero"><div><Badge tone="yellow">PERKAP UNIKA · LIVE INVENTORY</Badge><h2>Pinjam alat kampus tanpa proses rumit</h2><p>Cek stok fisik, ajukan peminjaman, dan pantau pengembalian dalam satu portal.</p></div><div className="hero__art"><Icon name="box" size={52} /></div></div>
    <div className="section-head"><div><h2>Katalog alat & perlengkapan</h2><p>Stok diperbarui berdasarkan unit fisik yang tersedia.</p></div></div>
    <div className="catalog-tools"><label className="search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari proyektor, sound system, tenda..." /></label><div className="filter-pills">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
    <div className="service-grid">{visible.map((service) => { const available = stockLevels[service.title] ?? service.available; return <article className="service-card" key={service.title}><div className="service-card__top"><div className={`service-icon service-icon--${service.tone}`}><Icon name={service.icon} /></div><Badge tone={available === 0 ? "red" : available <= 2 ? "yellow" : "green"}>Tersedia: {available}/{service.total}</Badge></div><span className="service-card__category">{service.category}</span><h3>{service.title}</h3><p>{service.desc}</p><div className="service-card__meta"><Icon name="clock" size={16} /><span>{service.time}</span></div><Button variant="secondary" icon="plus" disabled={available === 0} onClick={() => onApply(service.title)}>{available === 0 ? "Stok habis" : "Pinjam / Ajukan"}</Button></article>; })}</div>
    {!visible.length && <section className="empty-state"><Icon name="search" size={30} /><h3>Layanan tidak ditemukan</h3><p>Coba kata kunci atau kategori lain.</p><Button variant="secondary" onClick={() => { setQuery(""); setCategory("Semua"); }}>Reset pencarian</Button></section>}
  </>;
}

function AvailabilityCalendarModal({ svc, borrowings, initial, onClose, onSelectDate }: { svc: Service; borrowings: Borrowing[]; initial: string; onClose: () => void; onSelectDate: (dateStr: string) => void }) {
  const base = parseISO(initial) ?? new Date();
  const [month, setMonth] = useState(new Date(base.getFullYear(), base.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(initial || null);
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const today = startOfToday().getTime();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const past = parseISO(dateStr)!.getTime() < today;
    const remaining = svc.total - bookedOn(dateStr, svc, borrowings);
    const unavailable = past || svc.available === 0 && remaining <= 0 || remaining <= 0;
    const limited = !unavailable && remaining <= Math.max(1, Math.ceil(svc.total * 0.25));
    return { day, dateStr, unavailable, limited, past, selected: selectedDate === dateStr };
  });
  const moveMonth = (offset: number) => setMonth(new Date(year, monthIndex + offset, 1));
  const picked = parseISO(selectedDate ?? undefined);
  return <div className="modal-backdrop" role="presentation"><section className="modal availability-modal" role="dialog" aria-modal="true" aria-labelledby="availability-title">
    <div className="modal__head"><div className="modal__icon"><Icon name="calendar" /></div><div><h2 id="availability-title">Pilih Tanggal Peminjaman</h2><p>{svc.title} · {svc.available} dari {svc.total} unit tersedia saat ini</p></div><button className="icon-btn" onClick={onClose} aria-label="Tutup kalender"><Icon name="close" /></button></div>
    <div className="availability-calendar">
      <div className="calendar-toolbar"><button className="icon-btn calendar-prev" onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya"><Icon name="chevron" size={18} /></button><div><span>JADWAL RESERVASI</span><h3>{monthNames[monthIndex]} {year}</h3></div><button className="icon-btn" onClick={() => moveMonth(1)} aria-label="Bulan berikutnya"><Icon name="chevron" size={18} /></button></div>
      <div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{cells.map((cell, index) => !cell ? <div key={index} className="calendar-day empty" /> : <div key={index} role="button" tabIndex={cell.unavailable ? -1 : 0} className={`calendar-day clickable ${cell.selected ? "selected" : ""} ${cell.unavailable ? "unavailable" : ""} ${cell.limited ? "limited" : ""}`} onClick={() => !cell.unavailable && setSelectedDate(cell.dateStr)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !cell.unavailable) setSelectedDate(cell.dateStr); }}><strong>{cell.day}</strong><span>{cell.selected ? "Dipilih" : cell.past ? "Lewat" : cell.unavailable ? "Penuh" : cell.limited ? "Terbatas" : "Tersedia"}</span></div>)}</div>
      <div className="calendar-legend"><span><i className="available" />Tersedia</span><span><i className="limited" />Stok terbatas</span><span><i className="unavailable" />Tidak tersedia</span><span><i className="selected" />Tanggal dipilih</span></div>
      <div className="calendar-selection"><div className="calendar-selection__icon"><Icon name="calendar" /></div><div><span>TANGGAL PEMINJAMAN</span><strong>{picked ? fmtDate(picked) : "Belum memilih tanggal"}</strong><small>{picked ? `Maks. ${maxDays(svc)} hari · kembali sebelum ${fmtDate(addDays(picked, maxDays(svc)))}` : "Klik tanggal pada kalender"}</small></div>{picked && <Badge tone="green">Tersedia</Badge>}</div>
    </div>
    <div className="modal__foot"><Button variant="secondary" onClick={onClose}>Batal</Button><Button icon="check" disabled={!selectedDate} onClick={() => { if (selectedDate) { onSelectDate(selectedDate); onClose(); } }}>Gunakan tanggal ini</Button></div>
  </section></div>;
}

function StudentRequestForm({ service, catalog, borrowings, mine, onBack, onSubmit, onDone }: { service: string; catalog: Service[]; borrowings: Borrowing[]; mine: Borrowing[]; onBack: () => void; onSubmit: (purpose: string, file: File, dateStr: string) => Promise<string | null>; onDone: (id: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [purpose, setPurpose] = useState("");
  const [borrowDate, setBorrowDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [sending, setSending] = useState(false);
  const item = catalog.find((entry) => entry.title === service) ?? catalog[0];
  const hasOverdue = mine.some((b) => isOverdue(b, catalog));

  const validateFile = (selected?: File) => {
    if (!selected) return;
    if (selected.type !== "application/pdf" || !selected.name.toLowerCase().endsWith(".pdf")) { setFile(null); setError("Format tidak didukung. Surat Permohonan Peminjaman wajib berupa PDF (.pdf)."); return; }
    if (selected.size > 5 * 1024 * 1024) { setFile(null); setError("Ukuran file melebihi batas maksimum 5 MB."); return; }
    setFile(selected);
    setError("");
  };

  const send = async () => {
    if (!file) return;
    setSending(true);
    setSubmitError("");
    const id = await onSubmit(purpose, file, borrowDate);
    setSending(false);
    if (id) onDone(id);
    else setSubmitError("Pengajuan gagal dikirim. Periksa koneksi lalu coba lagi.");
  };

  const picked = parseISO(borrowDate);
  const remaining = borrowDate ? item.total - bookedOn(borrowDate, item, borrowings) : null;

  return <>
    <div className="backline"><button onClick={onBack}><Icon name="arrow" size={17} /> Kembali ke katalog</button><Badge tone="purple">FORMULIR PEMINJAMAN</Badge></div>
    <div className="request-layout"><section className="panel request-form">
      <div className="request-form__heading"><div className={`service-icon service-icon--${item.tone}`}><Icon name={item.icon} /></div><div><span>{item.category}</span><h2>{item.title}</h2><p>Ajukan unit fisik yang tersedia untuk kegiatan kampus.</p></div></div>
      {hasOverdue && <div className="security-note security-note--danger"><Icon name="clock" size={18} /><div><strong>Akun Anda memiliki peminjaman terlambat</strong><span>Kembalikan unit yang overdue sebelum mengajukan peminjaman baru.</span></div></div>}
      <label className="field" style={{ marginTop: 14 }}><span>Tanggal peminjaman</span>
        <div className="date-row"><input type="text" readOnly value={picked ? fmtDate(picked) : ""} placeholder="Belum memilih tanggal" /><Button variant="secondary" icon="calendar" onClick={() => setShowCalendar(true)}>Pilih Kalender</Button></div>
      </label>
      <label className="field"><span>Keperluan peminjaman</span><textarea placeholder="Jelaskan kegiatan dan lokasi penggunaan" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></label>
      <div className="upload-section"><div className="upload-section__title"><div><h3>Unggah Surat Permohonan</h3><p>Surat permohonan peminjaman alat wajib untuk validasi Petugas Perkap.</p></div><Badge tone="red">Wajib</Badge></div>
        <label className={`upload-box upload-box--large ${error ? "upload-box--error" : ""} ${file ? "upload-box--success" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); validateFile(event.dataTransfer.files[0]); }}>
          <input type="file" accept=".pdf,application/pdf" onChange={(event) => validateFile(event.target.files?.[0])} />
          <div className="upload-box__icon"><Icon name={file ? "check" : "upload"} size={24} /></div><strong>{file ? file.name : "Unggah Surat Permohonan (PDF)"}</strong>
          <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Siap dikirim` : "Tarik dan lepas file ke area ini"}</span><span className="file-rule"><b>Hanya PDF (.pdf)</b><i />Maksimum 5 MB</span><span className="file-picker">{file ? "Ganti file PDF" : "Pilih file PDF"}</span>
        </label>{error && <p className="upload-error"><Icon name="close" size={15} /> {error}</p>}
      </div>
      {submitError && <p className="upload-error"><Icon name="close" size={15} /> {submitError}</p>}
      <div className="request-form__actions"><Button variant="secondary" onClick={onBack}>Batalkan</Button><Button icon="arrow" disabled={!file || !purpose.trim() || !borrowDate || hasOverdue || sending} onClick={send}>{sending ? "Mengirim..." : "Kirim Pengajuan Peminjaman"}</Button></div>
    </section><aside className="request-summary"><h3>Ringkasan unit</h3><dl>
      <div><dt>Stok fisik</dt><dd><Badge tone={item.available === 0 ? "red" : "green"}>{item.available}/{item.total} tersedia</Badge></dd></div>
      <div><dt>Jadwal reservasi</dt><dd>{remaining === null ? <Badge tone="gray">Belum dipilih</Badge> : remaining > 0 ? <Badge tone="green">Tidak bentrok</Badge> : <Badge tone="red">Bentrok</Badge>}</dd></div>
      <div><dt>Kelayakan akun</dt><dd><Badge tone={hasOverdue ? "red" : "green"}>{hasOverdue ? "Ada overdue" : "Tidak ada overdue"}</Badge></dd></div>
      <div><dt>Durasi maksimal</dt><dd>{item.time}</dd></div><div><dt>Pengambilan</dt><dd>Gudang Perkap</dd></div></dl>
      <Button variant="secondary" icon="calendar" onClick={() => setShowCalendar(true)}>Lihat kalender ketersediaan</Button>
      <div className="request-summary__help"><Icon name="shield" /><div><strong>Tanggung jawab peminjam</strong><p>Periksa kondisi dan serial unit saat serah terima.</p></div></div></aside></div>
    {showCalendar && <AvailabilityCalendarModal svc={item} borrowings={borrowings} initial={borrowDate} onClose={() => setShowCalendar(false)} onSelectDate={setBorrowDate} />}
  </>;
}

function openPdf(id: string, files: Record<string, string>) {
  if (files[id]) window.open(files[id], "_blank");
  else window.open(`data:text/plain;charset=utf-8,Surat%20Permohonan%20Peminjaman%20${encodeURIComponent(id)}%20(file%20hanya%20tersedia%20pada%20sesi%20pengunggahan)`, "_blank");
}

function StudentTracking({ b, svc, serial, files, onBack }: { b: Borrowing; svc: Service; serial: string; files: Record<string, string>; onBack: () => void }) {
  const meta = statusMeta(b.status);
  const approved = ["Disetujui", "Dipinjam", "Dikembalikan", "In Maintenance"].includes(b.status);
  const borrowed = ["Dipinjam", "Dikembalikan", "In Maintenance"].includes(b.status);
  const finished = ["Dikembalikan", "In Maintenance"].includes(b.status);
  const rejected = b.status === "Ditolak";
  const due = dueDateOf(b, [svc]);
  const steps = [
    { name: "Diajukan", date: b.submittedAt ?? "Baru saja", done: true },
    rejected ? { name: "Ditolak", date: "Ditolak petugas", done: true } : { name: "Disetujui", date: approved ? "Disetujui petugas" : "Menunggu petugas", done: approved, active: !approved },
    { name: "Dipinjam", date: borrowed ? "Sudah diserahkan" : approved ? "Siap untuk handover" : "Belum tersedia", done: borrowed, active: approved && !borrowed },
    { name: "Selesai", date: finished ? "Unit kembali" : "Belum tersedia", done: finished, active: borrowed && !finished },
  ];
  const banner = rejected ? ["Pengajuan ditolak", "Petugas menolak permohonan ini. Hubungi Perkap untuk informasi lebih lanjut."]
    : b.status === "Disetujui" ? ["Pengajuan disetujui dan siap dialokasikan", `${svc.title} dialokasikan (${serial}). Bawa KTM saat mengambil unit di Gudang Perkap.`]
    : b.status === "Dipinjam" ? ["Unit sedang Anda pinjam", `Kembalikan sebelum ${fmtDate(due)} ke Gudang Perkap.`]
    : b.status === "Dikembalikan" ? ["Peminjaman selesai", "Unit sudah dikembalikan. Terima kasih."]
    : b.status === "In Maintenance" ? ["Unit dikembalikan dan dalam perbaikan", "Petugas mencatat kerusakan saat pengembalian."]
    : ["Pengajuan berhasil disinkronkan", "Petugas Perkap telah menerima data dan Surat Permohonan Anda."];
  return <>
    <div className="backline"><button onClick={onBack}><Icon name="arrow" size={17} /> Kembali ke riwayat</button><Badge tone="gray">#{b.id}</Badge></div>
    <section className={`status-banner ${meta.tone === "green" || meta.tone === "blue" ? "status-banner--live" : ""}`}><div className="status-banner__icon"><Icon name={meta.tone === "yellow" ? "clock" : "check"} size={28} /></div><div><Badge tone={meta.tone}>{meta.label.toUpperCase()}</Badge><h2>{banner[0]}</h2><p>{banner[1]}</p></div><Button variant="secondary" icon="mail" onClick={() => { window.location.href = `mailto:perkap@unika.ac.id?subject=${encodeURIComponent(b.id)}`; }}>Hubungi Perkap</Button></section>
    <section className="panel progress-panel"><div className="panel__title"><div><h2>Status peminjaman</h2><p>Diajukan {b.submittedAt ?? "-"}</p></div></div><div className="steps">{steps.map((step: any, index) => <div className={`step ${step.done ? "done" : ""} ${step.active ? "active" : ""}`} key={step.name}><div className="step__line" /><div className="step__dot">{step.done ? <Icon name="check" size={16} /> : index + 1}</div><strong>{step.name}</strong><span>{step.date}</span></div>)}</div></section>
    <div className="detail-grid"><section className="panel"><div className="panel__title"><div><h2>Detail alat fisik</h2><p>Unit yang dialokasikan untuk Anda</p></div><Icon name="box" /></div><dl className="detail-list"><div><dt>Nama alat</dt><dd>{svc.title}</dd></div><div><dt>Serial</dt><dd><code>{serial}</code></dd></div><div><dt>Tanggal pinjam</dt><dd>{fmtDate(parseISO(b.borrowDate))}</dd></div><div><dt>Tanggal kembali</dt><dd>{fmtDate(due)}</dd></div><div><dt>Keperluan</dt><dd>{b.purpose || "-"}</dd></div><div><dt>Lokasi ambil</dt><dd>Gudang Perkap</dd></div></dl></section>
    <section className="panel"><div className="panel__title"><div><h2>Surat permohonan</h2><p>Dokumen PDF pengajuan</p></div><Badge tone="green">Terkirim</Badge></div><div className="file-item"><div className="file-icon"><Icon name="document" /></div><div><strong>{b.file || "Surat Permohonan.pdf"}</strong><span>PDF</span></div></div><div className="document-actions"><Button variant="secondary" icon="document" onClick={() => openPdf(b.id, files)}>Lihat dokumen</Button><Button icon="download" onClick={() => downloadText(`${b.id}.txt`, `Bukti peminjaman ${b.id} · ${svc.title} · Serial ${serial} · Status ${meta.label}`)}>Unduh bukti</Button></div></section></div>
    <section className="qr-ticket"><div className="qr-ticket__copy"><Badge tone="yellow">TIKET DIGITAL</Badge><h2>QR Peminjaman #{b.id}</h2><p>Tunjukkan kode ini kepada Petugas Perkap saat pengambilan dan pengembalian unit. QR terhubung ke serial <code>{serial}</code>.</p><div className="qr-ticket__meta"><span><Icon name="users" size={16} /> {b.email}</span><span><Icon name="box" size={16} /> {svc.title}</span><span><Icon name="calendar" size={16} /> {fmtDate(parseISO(b.borrowDate))}</span></div><Button variant="secondary" icon="download" onClick={() => downloadText(`QR-${b.id}.txt`, `QR TICKET\n${b.id}\nSerial: ${serial}\nPeminjam: ${b.email}`)}>Unduh Tiket QR</Button></div><div className="qr-ticket__visual"><QRCode label={b.id} /><strong>{b.id}</strong><span>Valid untuk 1 transaksi</span></div></section>
  </>;
}

function StudentHistory({ mine, catalog, serialMap, onView }: { mine: Borrowing[]; catalog: Service[]; serialMap: Record<string, string>; onView: (id: string) => void }) {
  const rows = [...mine].reverse();
  const featured = rows[0];
  const count = (fn: (s: string) => boolean) => String(mine.filter((b) => fn(b.status)).length);
  return <>
    <div className="section-head admin-head"><div><h2>Riwayat Peminjaman</h2><p>Daftar pengajuan peminjaman alat Anda yang tersinkron dengan database.</p></div><Badge tone="green"><i className="live-dot" /> Database Connected</Badge></div>
    <section className="live-pjm-summary"><div><span>Pengajuan aktif</span><strong>{count(isOpen)}</strong></div><div><span>Menunggu verifikasi</span><strong>{count(isPending)}</strong></div><div><span>Sedang dipinjam</span><strong>{count((s) => s === "Dipinjam")}</strong></div><div><span>Total pengajuan</span><strong>{mine.length}</strong></div></section>
    <section className="panel table-panel live-pjm-table"><div className="panel__title"><div><h2>Real-Time PJM History</h2><p>Status berubah otomatis saat petugas memvalidasi atau memindai QR.</p></div><Badge tone="purple">PJM Sync</Badge></div><div className="table-wrap"><table><thead><tr><th>ID / Item</th><th>Tanggal Pinjam</th><th>Status</th><th>Countdown</th><th>QR Ticket</th><th>Detail</th></tr></thead><tbody>
      {rows.map((b) => { const m = statusMeta(b.status); const due = dueDateOf(b, catalog); const start = parseISO(b.borrowDate); return <tr key={b.id}><td><strong>{b.id}</strong><small className="block">{b.service}{serialMap[b.id] ? ` · ${serialMap[b.id]}` : ""}</small></td><td>{fmtDate(start)}</td><td><StatusBadge tone={m.tone}>{m.label}</StatusBadge></td><td>{b.status === "Dipinjam" ? <LiveCountdown target={due} label="menuju jatuh tempo" /> : b.status === "Disetujui" ? <LiveCountdown target={start} label="menuju handover" /> : <small className="block">-</small>}</td><td><Button variant="secondary" icon="scan" onClick={() => onView(b.id)}>Buka QR Ticket</Button></td><td><Button variant="ghost" onClick={() => onView(b.id)}>Lihat tracking <Icon name="arrow" size={14} /></Button></td></tr>; })}
    </tbody></table></div>{!rows.length && <div className="empty-state"><Icon name="history" size={30} /><h3>Belum ada pengajuan</h3><p>Pengajuan Anda akan muncul di sini.</p></div>}</section>
    {featured && <section className="live-pjm-qr"><div className="live-pjm-qr__copy"><StatusBadge tone={statusMeta(featured.status).tone}>{statusMeta(featured.status).label}</StatusBadge><span>DIGITAL QR CODE TICKET</span><h2>{featured.id}</h2><p>Gunakan tiket ini untuk proses check-out dan check-in di Gudang Perkap. Status QR tersinkron langsung dengan portal Petugas.</p><dl><div><dt>Peminjam</dt><dd>{featured.email}</dd></div><div><dt>Alat</dt><dd>{featured.service}</dd></div><div><dt>Validitas</dt><dd>Satu transaksi aktif</dd></div></dl><div className="document-actions"><Button variant="secondary" icon="download" onClick={() => downloadText(`QR-${featured.id}.txt`, `QR TICKET\n${featured.id}\n${featured.service}`)}>Unduh QR Ticket</Button><Button icon="arrow" onClick={() => onView(featured.id)}>Buka Detail Tracking</Button></div></div><div className="live-pjm-qr__visual"><QRCode label={featured.id} /><strong>SCAN AT PERKAP DESK</strong><small>Token tersinkron real-time</small></div></section>}
  </>;
}

function StudentNotifications({ mine }: { mine: Borrowing[] }) {
  const [read, setRead] = useState<string[]>([]);
  const notes = [...mine].reverse().slice(0, 10).map((b) => {
    const titles: Record<string, string> = { Disetujui: "Pengajuan disetujui", Ditolak: "Pengajuan ditolak", Dipinjam: "Unit diserahkan", Dikembalikan: "Pengembalian selesai", "In Maintenance": "Unit dikembalikan, dalam perbaikan" };
    return { id: `${b.id}-${b.status}`, title: titles[b.status] ?? "Pengajuan menunggu verifikasi", detail: `${b.id} · ${b.service}`, time: b.submittedAt ?? "" };
  });
  return <><div className="section-head admin-head"><div><h2>Notifikasi</h2><p>Pembaruan alokasi, pengambilan, dan pengembalian alat.</p></div><Button variant="secondary" icon="check" onClick={() => setRead(notes.map((n) => n.id))}>Tandai semua dibaca</Button></div>
    <section className="panel notification-list">{notes.length ? notes.map((note) => <button key={note.id} className={read.includes(note.id) ? "read" : ""} onClick={() => setRead((c) => [...new Set([...c, note.id])])}><span className="notification-list__icon"><Icon name="bell" /></span><span><strong>{note.title}</strong><small>{note.detail}</small></span><time>{note.time}</time>{!read.includes(note.id) && <i />}</button>) : <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>Tidak ada notifikasi baru.</div>}</section></>;
}

/* ============================== STAFF ============================== */
function StaffValidation({ borrowings, files, onUpdateStatus }: { borrowings: Borrowing[]; files: Record<string, string>; onUpdateStatus: (id: string, status: string) => void }) {
  const pending = borrowings.filter((b) => isPending(b.status));
  const latest = pending[pending.length - 1];
  const rows = [...borrowings].sort((a, b) => Number(isPending(b.status)) - Number(isPending(a.status)));
  return <>
    <div className="welcome"><div><h2>Validasi pengajuan baru</h2><p>Tinjau dokumen PDF, lalu setujui atau tolak permohonan peminjaman dari mahasiswa.</p></div><Button icon="download" variant="secondary" onClick={() => downloadText("ringkasan-validasi-perkap.txt", `Ringkasan pengajuan Perkap: ${borrowings.length} pengajuan, ${pending.length} menunggu\n` + borrowings.map((b) => `${b.id},${b.email},${b.service},${b.borrowDate ?? "-"},${b.status}`).join("\n"))}>Unduh ringkasan</Button></div>
    {latest && <section className="live-feed"><div className="live-feed__pulse" /><div><Badge tone="green">LIVE FEED</Badge><h3>Pengajuan baru dari Portal Mahasiswa</h3><p><b>{latest.email}</b> mengajukan <b>{latest.service}</b> · {latest.submittedAt ?? "baru saja"}.</p></div><Icon name="arrow" /></section>}
    <div className="metrics"><Metric label="Pengajuan masuk" value={String(borrowings.length)} detail="Semua data database" icon="document" tone="purple" /><Metric label="Pending review" value={String(pending.length)} detail="Perlu keputusan" icon="clock" tone="gold" /><Metric label="Disetujui" value={String(borrowings.filter((b) => b.status === "Disetujui").length)} detail="Siap alokasi unit" icon="check" tone="green" /></div>
    <section className="panel table-panel incoming-only"><div className="panel__title"><div><h2>New Incoming Requests / Pending Validation</h2><p>Validasi pengajuan dan dokumen PDF.</p></div><Badge tone="purple">{pending.length} pending</Badge></div><div className="table-wrap"><table><thead><tr><th>Peminjam</th><th>Alat</th><th>Tanggal</th><th>Dokumen PDF</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
      {rows.map((b) => { const m = statusMeta(b.status); const decidable = isPending(b.status); return <tr key={b.id} className={decidable ? "live-row" : ""}><td><div className="person"><span className="avatar avatar--small">{initialsOf(b.email)}</span><div><strong>{b.email}</strong><small>{b.id}</small></div></div></td><td><strong>{b.service}</strong>{b.purpose && <small className="block">{b.purpose}</small>}</td><td>{fmtDate(parseISO(b.borrowDate))}</td><td><Button variant="secondary" icon="document" onClick={() => openPdf(b.id, files)}>Surat_Permohonan.pdf</Button></td><td><Badge tone={m.tone}>{m.label}</Badge></td><td>{decidable ? <div className="row-actions"><Button variant="secondary" icon="check" onClick={() => onUpdateStatus(b.id, "Disetujui")}>Setujui</Button><Button variant="danger" icon="close" onClick={() => onUpdateStatus(b.id, "Ditolak")}>Tolak</Button></div> : <Badge tone="gray">Sudah diproses</Badge>}</td></tr>; })}
    </tbody></table></div>{!rows.length && <div className="empty-state"><Icon name="check" size={30} /><h3>Belum ada pengajuan</h3><p>Pengajuan mahasiswa akan muncul di sini.</p></div>}</section>
  </>;
}

function ActiveLoans({ borrowings, catalog, serialMap, onFollowup }: { borrowings: Borrowing[]; catalog: Service[]; serialMap: Record<string, string>; onFollowup: (email: string, id: string) => void }) {
  const loans = borrowings.filter((b) => b.status === "Dipinjam" || b.status === "Disetujui");
  const overdue = loans.filter((b) => isOverdue(b, catalog));
  const near = loans.filter((b) => { const d = dueDateOf(b, catalog); return b.status === "Dipinjam" && d && !isOverdue(b, catalog) && d.getTime() - startOfToday().getTime() <= 2 * 86400000; });
  return <>
    <div className="section-head admin-head"><div><h2>Active Loans / Overdue Items</h2><p>Pantau unit yang sedang dipinjam dan kirim pengingat pengembalian.</p></div><Badge tone={overdue.length ? "red" : "green"}>{overdue.length} overdue</Badge></div>
    <div className="metrics"><Metric label="Peminjaman aktif" value={String(borrowings.filter((b) => b.status === "Dipinjam").length)} detail="Unit di luar gudang" icon="box" tone="purple" /><Metric label="Jatuh tempo dekat" value={String(near.length)} detail="Dalam 2 hari" icon="clock" tone="gold" /><Metric label="Overdue" value={String(overdue.length)} detail="Perlu follow-up" icon="mail" tone="blue" /></div>
    <section className="panel table-panel overdue"><div className="panel__title"><div><h2>Peminjaman aktif dan terlambat</h2><p>Email otomatis berjalan pukul 08:00 WIB; tombol manual hanya tersedia untuk item overdue.</p></div><Badge tone="purple">Scheduler aktif</Badge></div><div className="table-wrap"><table><thead><tr><th>Peminjam</th><th>Borrowed Item</th><th>Serial Number</th><th>Due Date</th><th>Status</th><th>Reminder Action</th></tr></thead><tbody>{loans.map((loan) => { const late = daysLate(loan, catalog); const due = dueDateOf(loan, catalog); const diff = due ? Math.round((due.getTime() - startOfToday().getTime()) / 86400000) : 0; const detail = loan.status === "Disetujui" ? "Menunggu pengambilan" : late > 0 ? `Terlambat ${late} hari` : diff === 0 ? "Jatuh tempo hari ini" : `${diff} hari lagi`; return <tr key={loan.id}><td><strong>{loan.email}</strong><small className="block">{loan.id}</small></td><td>{loan.service}</td><td><code>{serialMap[loan.id] ?? "-"}</code></td><td><strong className={late > 0 ? "danger-text" : ""}>{fmtDate(due)}</strong><small className="block">{detail}</small></td><td><Badge tone={late > 0 ? "red" : loan.status === "Disetujui" ? "yellow" : "green"}>{late > 0 ? "Overdue" : loan.status === "Disetujui" ? "Siap diambil" : "Active"}</Badge></td><td>{late > 0 ? <Button variant="warning" icon="mail" onClick={() => onFollowup(loan.email, loan.id)}>Kirim Email Follow-up</Button> : <Badge tone="gray">Otomatis saat overdue</Badge>}</td></tr>; })}</tbody></table></div>{!loans.length && <div className="empty-state"><Icon name="check" size={30} /><h3>Tidak ada peminjaman aktif</h3><p>Semua unit berada di gudang.</p></div>}</section>
  </>;
}

function FollowupModal({ email, onClose, onSent }: { email: string; onClose: () => void; onSent: (email: string) => void }) {
  const [sent, setSent] = useState(false);
  const [recipient, setRecipient] = useState(email);
  const [subject, setSubject] = useState("Pengingat: Segera Kembalikan Alat Perkap yang Dipinjam");
  const [message, setMessage] = useState("Yth. Peminjam,\n\nMasa peminjaman alat Perkap Anda telah berakhir. Mohon segera mengembalikan unit beserta seluruh kelengkapannya ke Gudang Perkap.\n\nTerima kasih.\nUnit Perkap UNIKA");
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true"><div className="modal__head"><div className="modal__icon"><Icon name={sent ? "check" : "mail"} /></div><div><h2>{sent ? "Email berhasil dikirim" : "Kirim email follow-up"}</h2><p>{sent ? "Email tercatat pada audit trail." : "Pemicu manual untuk pengingat pengembalian alat."}</p></div><button className="icon-btn" onClick={onClose} aria-label="Tutup modal"><Icon name="close" /></button></div>{sent ? <div className="success-state"><div><Icon name="check" size={32} /></div><strong>Email pengingat terkirim</strong><p>Notifikasi dikirim kepada {recipient}.</p><Button onClick={onClose}>Selesai</Button></div> : <><div className="modal__body"><label className="field"><span>Penerima</span><div className="field__control"><Icon name="mail" size={18} /><input type="email" value={recipient} onChange={(event) => setRecipient(event.target.value)} /></div></label><label className="field"><span>Subjek</span><div className="field__control"><input value={subject} onChange={(event) => setSubject(event.target.value)} /></div></label><label className="field"><span>Pesan</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} /></label><div className="email-note"><Icon name="clock" size={17} /> Scheduler otomatis berikutnya: besok, 08:00 WIB</div></div><div className="modal__foot"><Button variant="secondary" onClick={onClose}>Batalkan</Button><Button icon="mail" disabled={!recipient.includes("@") || !subject.trim() || !message.trim()} onClick={() => { onSent(recipient); setSent(true); }}>Kirim Email Pengingat Sekarang</Button></div></>}</section></div>;
}

function UnitDetailModal({ item, serial, status, onClose }: { item: Service; serial: string; status: PhysicalUnitStatus; onClose: () => void }) {
  const tone = status === "Tersedia" ? "green" : status === "Perawatan" ? "red" : "yellow";
  const condition = status === "Tersedia" ? "Baik · Kelengkapan penuh" : status === "Direservasi" ? "Dialokasikan · Menunggu handover" : status === "Dipinjam" ? "Dalam penggunaan" : "Dalam pemeriksaan teknis";
  return <div className="modal-backdrop" role="presentation"><section className="modal unit-detail-modal" role="dialog" aria-modal="true" aria-labelledby="unit-detail-title">
    <div className="modal__head"><div className={`service-icon service-icon--${item.tone}`}><Icon name={item.icon} /></div><div><h2 id="unit-detail-title">Detail unit fisik</h2><p>Informasi inventaris dan aktivitas berdasarkan nomor seri.</p></div><button className="icon-btn" onClick={onClose} aria-label="Tutup detail unit"><Icon name="close" /></button></div>
    <div className="modal__body">
      <section className="unit-detail-hero"><div><span>{item.category}</span><h3>{item.title}</h3><code>{serial}</code></div><StatusBadge tone={tone}>{status}</StatusBadge></section>
      <div className="unit-detail-grid"><div><span>Kondisi unit</span><strong>{condition}</strong></div><div><span>Lokasi penyimpanan</span><strong>Gudang Perkap</strong></div><div><span>Kategori</span><strong>{item.category}</strong></div><div><span>Batas durasi</span><strong>{item.time}</strong></div></div>
      <section className="unit-history"><div className="panel__title"><div><h2>Riwayat aktivitas</h2><p>Status terkini unit {serial}</p></div><Badge tone="gray">Audit unit</Badge></div>
        <div className="unit-history__item"><span className="unit-history__icon"><Icon name={status === "Perawatan" ? "settings" : status === "Direservasi" ? "clock" : "check"} size={17} /></span><div><strong>{status === "Perawatan" ? "Unit masuk pemeriksaan" : status === "Direservasi" ? "Unit dialokasikan untuk pengajuan" : status === "Dipinjam" ? "Unit diserahkan kepada peminjam" : "Unit tersedia di gudang"}</strong><small>Status saat ini</small></div><Badge tone={tone}>{status}</Badge></div>
      </section>
      <div className="security-note"><Icon name="shield" size={18} /><div><strong>Data unit tersinkron</strong><span>Perubahan handover dan maintenance akan otomatis memperbarui status unit ini.</span></div></div>
    </div>
    <div className="modal__foot"><Button variant="secondary" onClick={onClose}>Tutup</Button><Button icon="download" onClick={() => downloadText(`unit-${serial}.txt`, `${item.title}\nSerial: ${serial}\nStatus: ${status}\nKondisi: ${condition}`)}>Unduh detail unit</Button></div>
  </section></div>;
}

function InventoryStock({ catalog, stockLevels, maintenance, borrowings, serialMap }: { catalog: Service[]; stockLevels: Record<string, number>; maintenance: MaintenanceItem[]; borrowings: Borrowing[]; serialMap: Record<string, string> }) {
  const [selectedTitle, setSelectedTitle] = useState(catalog[0]?.title ?? "");
  const [selectedUnit, setSelectedUnit] = useState<{ serial: string; status: PhysicalUnitStatus } | null>(null);
  const selected = catalog.find((c) => c.title === selectedTitle) ?? catalog[0];
  if (!selected) return null;
  const statuses = unitStatuses(selected, stockLevels[selected.title] ?? selected.available, maintenance, borrowings, serialMap);
  return <><div className="section-head admin-head"><div><h2>Stok fisik & nomor seri</h2><p>Pantau kondisi setiap unit ItemStock secara individual.</p></div><Badge tone="green">Sinkron real-time</Badge></div><div className="inventory-layout"><section className="panel inventory-list">{catalog.map((item) => <button key={item.title} className={selected.title === item.title ? "active" : ""} onClick={() => setSelectedTitle(item.title)}><span className={`service-icon service-icon--${item.tone}`}><Icon name={item.icon} /></span><span><strong>{item.title}</strong><small>{stockLevels[item.title] ?? item.available} dari {item.total} tersedia</small></span><Icon name="chevron" size={17} /></button>)}</section><section className="panel"><div className="panel__title"><div><h2>{selected.title}</h2><p>Daftar unit fisik dan status operasional</p></div><Badge tone="purple">ItemStock</Badge></div><div className="serial-grid">{selected.serials.map((serial) => { const status = statuses[serial] ?? "Tersedia"; const tone = status === "Tersedia" ? "green" : status === "Perawatan" ? "red" : "yellow"; return <article key={serial}><div><code>{serial}</code><Badge tone={tone}>{status}</Badge></div><span>Kondisi: {status === "Tersedia" ? "Baik" : status === "Direservasi" ? "Dialokasikan untuk pengajuan" : status === "Dipinjam" ? "Dalam penggunaan" : "Pemeriksaan teknis"}</span><Button variant="secondary" onClick={() => setSelectedUnit({ serial, status })}>Lihat unit</Button></article>; })}</div></section></div>{selectedUnit && <UnitDetailModal item={selected} serial={selectedUnit.serial} status={selectedUnit.status} onClose={() => setSelectedUnit(null)} />}</>;
}

function QRScanner({ borrowings, catalog, serialMap, handovers, onStatus, onMaintenance, onHandover }: { borrowings: Borrowing[]; catalog: Service[]; serialMap: Record<string, string>; handovers: HandoverEntry[]; onStatus: (id: string, status: string) => void; onMaintenance: (item: MaintenanceItem) => void; onHandover: (entry: HandoverEntry) => void }) {
  const eligible = borrowings.filter((b) => b.status === "Disetujui" || b.status === "Dipinjam");
  const [targetId, setTargetId] = useState("");
  const [scanned, setScanned] = useState(false);
  const [done, setDone] = useState<null | { id: string; unit: string; serial: string; mode: "out" | "in"; maint: boolean; condition: string; photo: string }>(null);
  const [condition, setCondition] = useState("Mulus, normal, kelengkapan lengkap");
  const [photoName, setPhotoName] = useState("");
  const [checks, setChecks] = useState([true, true, true]);
  const [needsMaintenance, setNeedsMaintenance] = useState(false);
  const target = eligible.find((b) => b.id === targetId) ?? eligible[0];
  const svc = target ? catalog.find((s) => s.title === target.service) : undefined;
  const serial = target ? serialMap[target.id] ?? svc?.serials[0] ?? "-" : "-";
  const mode: "out" | "in" = target?.status === "Dipinjam" ? "in" : "out";
  const evidenceComplete = condition.trim() && photoName && checks.every(Boolean);

  const reset = () => { setScanned(false); setDone(null); setCondition("Mulus, normal, kelengkapan lengkap"); setPhotoName(""); setChecks([true, true, true]); setNeedsMaintenance(false); };
  const confirm = () => {
    if (!target) return;
    const maint = mode === "in" && needsMaintenance;
    if (maint) onMaintenance({ serial, item: target.service, issue: condition, photo: photoName, reportedAt: nowLabel(), status: "In Maintenance", loanId: target.id });
    onStatus(target.id, mode === "out" ? "Dipinjam" : maint ? "In Maintenance" : "Dikembalikan");
    onHandover({ time: nowLabel(), id: target.id, unit: `${target.service} · ${serial}`, activity: mode === "out" ? "Dipinjam" : maint ? "In Maintenance" : "Dikembalikan", condition, photo: photoName });
    setDone({ id: target.id, unit: target.service, serial, mode, maint, condition, photo: photoName });
  };
  const status = done ? (done.maint ? "In Maintenance" : done.mode === "out" ? "Dipinjam" : "Dikembalikan") : scanned ? (mode === "out" ? "Menunggu konfirmasi keluar" : "Menunggu konfirmasi masuk") : "Siap dipindai";
  const confirming = scanned && !done;
  return <>
    <div className="section-head admin-head"><div><h2>Scan QR & serah terima</h2><p>Catat foto, kelengkapan, dan kondisi sebelum check-out maupun check-in.</p></div><Badge tone={!scanned ? "yellow" : done?.maint ? "red" : done ? "green" : "purple"}>{status}</Badge></div>
    <div className="scanner-layout"><section className="scanner-card"><div className="scanner-card__head"><span><Icon name="scan" /> Scan QR Tiket Peminjaman / Serial Barang</span><i /></div>
      <div className={`scanner-viewfinder ${scanned ? "scanner-viewfinder--success" : ""}`}><div className="scanner-grid" /><span className="scan-corner scan-corner--tl" /><span className="scan-corner scan-corner--tr" /><span className="scan-corner scan-corner--bl" /><span className="scan-corner scan-corner--br" /><div className="scan-line" />{scanned && <div className="scan-success"><Icon name={confirming ? "scan" : done?.maint ? "settings" : "check"} size={34} /><strong>{confirming ? "QR berhasil dibaca" : status}</strong><span>{confirming ? "Lengkapi bukti kondisi sebelum konfirmasi" : done?.maint ? "Unit dikarantina dan tidak dapat dipinjam" : "Status dan stok fisik telah diperbarui"}</span></div>}</div>
      {!scanned && <label className="field" style={{ color: "#e8dcea" }}><span>Pilih tiket untuk dipindai</span><select className="select" value={target?.id ?? ""} onChange={(e) => setTargetId(e.target.value)} disabled={!eligible.length}>{eligible.map((b) => <option key={b.id} value={b.id}>{b.id} · {b.service} · {b.status === "Disetujui" ? "Check-out" : "Check-in"}</option>)}</select></label>}
      {!scanned && <Button icon="scan" disabled={!target} onClick={() => { setScanned(true); setDone(null); }}>{target ? `Simulasi Scan ${mode === "out" ? "Check-out" : "Check-in"}` : "Tidak ada tiket siap dipindai"}</Button>}
      {done && <Button icon="scan" onClick={reset}>Scan Transaksi Berikutnya</Button>}
      <p className="scanner-hint">Kamera simulasi · Membaca QR tiket atau label serial ItemStock</p></section>
      <section className="panel scan-result"><div className="panel__title"><div><h2>Hasil identifikasi</h2><p>Data tiket dan unit fisik yang dipindai</p></div><Badge tone={!scanned ? "gray" : confirming ? "yellow" : done?.maint ? "red" : "green"}>{!scanned ? "Menunggu QR" : confirming ? "Perlu bukti kondisi" : "Tercatat"}</Badge></div>
        {!scanned || !target && !done ? <div className="scan-empty"><Icon name="scan" size={42} /><strong>Arahkan QR ke area pemindai</strong><span>Data peminjaman akan muncul secara otomatis.</span></div> : <>
          <div className="scan-identity"><span className="avatar">{initialsOf(target?.email ?? "")}</span><div><strong>{done ? done.id : target?.email}</strong><small>{target?.email ?? ""}</small></div></div>
          <dl className="detail-list"><div><dt>ID Peminjaman</dt><dd>{done?.id ?? target?.id}</dd></div><div><dt>Alat / Serial</dt><dd>{done?.unit ?? target?.service} · <code>{done?.serial ?? serial}</code></dd></div><div><dt>Status terbaru</dt><dd><Badge tone={done?.maint ? "red" : confirming ? "yellow" : "green"}>{status}</Badge></dd></div></dl>
          <label className={`condition-box ${confirming ? "condition-box--active" : ""}`}><span><Icon name="document" size={17} /> Catatan Fisik Barang Saat {(done?.mode ?? mode) === "out" ? "Keluar" : "Masuk"}</span><textarea value={done ? done.condition : condition} onChange={(event) => setCondition(event.target.value)} disabled={!confirming} placeholder="Contoh: Mulus / Ada kerusakan" /></label>
          {confirming && <><div className="condition-checklist"><strong>Checklist kelengkapan</strong>{["Unit utama", "Kabel & adaptor", "Tas / aksesori"].map((label, index) => <label key={label}><input type="checkbox" checked={checks[index]} onChange={() => setChecks((current) => current.map((value, i) => i === index ? !value : value))} /><span>{label}</span></label>)}</div><label className="condition-photo"><input type="file" accept="image/*" onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")} /><span><Icon name="upload" size={17} />{photoName || "Unggah foto kondisi fisik"}</span></label>
            {mode === "in" && <label className={`maintenance-toggle ${needsMaintenance ? "active" : ""}`}><input type="checkbox" checked={needsMaintenance} onChange={(event) => setNeedsMaintenance(event.target.checked)} /><span><Icon name="settings" /><div><strong>Tandai Perlu Perbaikan / Maintenance</strong><small>Unit dikarantina dan dikeluarkan dari available_stock.</small></div></span></label>}
            <Button className="btn--wide" icon="check" disabled={!evidenceComplete} onClick={confirm}>Konfirmasi Handover ({mode === "out" ? "Check-out" : "Check-in"})</Button><Button className="btn--wide" variant="ghost" onClick={reset}>Batalkan scan</Button></>}
          {done && <div className={`security-note ${done.maint ? "security-note--danger" : ""}`}><Icon name={done.maint ? "settings" : "check"} /><div><strong>{done.maint ? "Unit masuk karantina perbaikan" : "Transaksi tercatat"}</strong><span>Kondisi: {done.condition}. Bukti foto: {done.photo || "tersimpan"}.</span></div></div>}</>}
      </section></div>
    <section className="panel table-panel"><div className="panel__title"><div><h2>Aktivitas handover terbaru</h2><p>Riwayat foto dan kondisi fisik dari pemindaian QR</p></div><Badge tone="green">Audit tercatat</Badge></div><div className="table-wrap"><table><thead><tr><th>Waktu</th><th>ID</th><th>Unit / Serial</th><th>Aktivitas</th><th>Catatan kondisi</th><th>Bukti</th></tr></thead><tbody>{handovers.map((h, i) => <tr key={i} className={i === 0 ? "live-row" : ""}><td>{h.time}</td><td><b>{h.id}</b></td><td>{h.unit}</td><td><Badge tone={h.activity === "In Maintenance" ? "red" : h.activity === "Dikembalikan" ? "green" : "yellow"}>{h.activity}</Badge></td><td>{h.condition}</td><td>{h.photo || "-"}</td></tr>)}</tbody></table></div>{!handovers.length && <div className="empty-state"><Icon name="scan" size={30} /><h3>Belum ada aktivitas handover</h3><p>Lakukan pemindaian untuk mencatat serah terima.</p></div>}</section>
  </>;
}

function MaintenancePanel({ items, onUpdate, onResolve }: { items: MaintenanceItem[]; onUpdate: (serial: string, status: MaintenanceItem["status"]) => void; onResolve: (serial: string) => void }) {
  return <><div className="section-head admin-head"><div><h2>Item Maintenance / Perbaikan</h2><p>Unit rusak dikarantina dan tidak dihitung sebagai available_stock.</p></div><Badge tone="red">{items.length} unit dikarantina</Badge></div><div className="metrics"><Metric label="In Maintenance" value={String(items.filter((i) => i.status === "In Maintenance").length)} detail="Sedang diperbaiki" icon="settings" tone="gold" /><Metric label="Inspection" value={String(items.filter((i) => i.status === "Inspection").length)} detail="Menunggu pemeriksaan" icon="search" tone="purple" /></div><section className="panel table-panel maintenance-panel"><div className="panel__title"><div><h2>Karantina ItemStock</h2><p>Riwayat insiden, bukti foto, dan progres perbaikan per serial.</p></div></div><div className="table-wrap"><table><thead><tr><th>Item / Serial</th><th>Incident Note</th><th>Photo Evidence</th><th>Reported</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item.serial}><td><strong>{item.item}</strong><small className="block"><code>{item.serial}</code></small></td><td>{item.issue}</td><td><Button variant="secondary" icon="document" onClick={() => window.alert(`Bukti foto ${item.photo} dibuka.`)}>{item.photo || "foto"}</Button></td><td>{item.reportedAt}</td><td><Badge tone={item.status === "In Maintenance" ? "red" : "yellow"}>{item.status}</Badge></td><td><div className="row-actions">{item.status === "Inspection" ? <Button variant="warning" icon="settings" onClick={() => onUpdate(item.serial, "In Maintenance")}>Mulai perbaikan</Button> : <Button icon="check" onClick={() => onResolve(item.serial)}>Tandai selesai</Button>}</div></td></tr>)}</tbody></table></div>{!items.length && <div className="empty-state"><Icon name="check" size={32} /><h3>Tidak ada unit dalam perbaikan</h3><p>Semua ItemStock tersedia atau sedang dipinjam.</p></div>}</section></>;
}

function Reports({ borrowings, catalog, handovers, stockLevels }: { borrowings: Borrowing[]; catalog: Service[]; handovers: HandoverEntry[]; stockLevels: Record<string, number> }) {
  const tracked = borrowings.filter((b) => b.status === "Dipinjam" || b.status === "Dikembalikan");
  const onTime = tracked.length ? Math.round((tracked.filter((b) => !isOverdue(b, catalog)).length / tracked.length) * 100) : 100;
  const totalUnits = catalog.reduce((a, s) => a + s.total, 0) || 1;
  const usedUnits = catalog.reduce((a, s) => a + (s.total - (stockLevels[s.title] ?? s.available)), 0);
  const util = Math.round((usedUnits / totalUnits) * 100);
  const monthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  return <>
    <div className="section-head admin-head"><div><h2>Laporan logistik Perkap</h2><p>Rekap peminjaman, serah terima fisik, dan ketepatan pengembalian.</p></div><Button icon="printer" onClick={() => window.print()}>Cetak Laporan Rekapitulasi PDF</Button></div>
    <div className="metrics"><Metric label="Total peminjaman" value={String(borrowings.length)} detail="Seluruh data" icon="box" tone="purple" /><Metric label="Kembali tepat waktu" value={`${onTime}%`} detail="Target 90%" icon="check" tone="green" /><Metric label="Utilisasi unit" value={`${util}%`} detail="Rata-rata inventaris" icon="chart" tone="gold" /></div>
    <section className="panel table-panel"><div className="panel__title"><div><h2>Pelacakan serah terima unit fisik</h2><p>Aktivitas terbaru berdasarkan nomor seri ItemStock</p></div><Badge tone="green">Logistik langsung</Badge></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Unit / Serial</th><th>Aktivitas</th><th>Waktu</th><th>Bukti</th></tr></thead><tbody>{handovers.map((h, i) => <tr key={i}><td><b>{h.id}</b></td><td>{h.unit}</td><td><Badge tone={h.activity === "Dikembalikan" ? "green" : h.activity === "In Maintenance" ? "red" : "yellow"}>{h.activity}</Badge></td><td>{h.time}</td><td><Button variant="secondary" icon="download" onClick={() => downloadText(`serah-terima-${h.id}.txt`, `${h.id} · ${h.unit} · ${h.activity} · ${h.condition}`)}>Unduh bukti</Button></td></tr>)}</tbody></table></div>{!handovers.length && <div className="empty-state"><Icon name="history" size={30} /><h3>Belum ada serah terima pada sesi ini</h3><p>Aktivitas dari menu Scan QR akan tampil di sini.</p></div>}</section>
    <div className="handover-grid"><section className="panel"><div className="panel__title"><div><h2>Utilisasi per alat</h2><p>Persentase unit yang sedang digunakan</p></div></div>{catalog.map((item) => { const p = Math.round(((item.total - (stockLevels[item.title] ?? item.available)) / (item.total || 1)) * 100); return <div className="report-row" key={item.title}><span>{item.title}</span><div><i style={{ width: `${p}%` }} /></div><strong>{p}%</strong></div>; })}</section>
      <section className="report-card"><div className="report-card__art"><Icon name="chart" size={44} /></div><Badge tone="yellow">LAPORAN BULANAN</Badge><h2>Rekapitulasi Perkap {monthName}</h2><p>Stok, serial fisik, serah terima, keterlambatan, dan tindak lanjut melalui email.</p><div className="report-stats"><div><strong>{borrowings.length}</strong><span>Peminjaman</span></div><div><strong>{onTime}%</strong><span>Tepat waktu</span></div></div><Button variant="secondary" icon="download" onClick={() => downloadText("rekap-perkap.csv", "id,email,alat,tanggal_pinjam,status\n" + borrowings.map((b) => `${b.id},${b.email},${b.service},${b.borrowDate ?? ""},${b.status}`).join("\n"))}>Unduh data CSV</Button></section></div>
  </>;
}

/* ============================== ADMIN ============================== */
type UserRole = "Mahasiswa" | "Petugas Perkap" | "Super Admin";
type UserRow = { name: string; id: string; role: UserRole; unit: string; active: boolean };

function AddUserModal({ onClose, onAdd }: { onClose: () => void; onAdd: (user: UserRow) => void }) {
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState("");
  const [unit, setUnit] = useState("");
  const [role, setRole] = useState<UserRole>("Mahasiswa");
  const roleOptions: { value: UserRole; description: string; tone: "gray" | "purple" | "red" }[] = [
    { value: "Mahasiswa", description: "Mengajukan dan memantau peminjaman alat.", tone: "gray" },
    { value: "Petugas Perkap", description: "Memvalidasi, menyerahkan, dan menerima unit.", tone: "purple" },
    { value: "Super Admin", description: "Mengelola pengguna, master alat, dan audit.", tone: "red" },
  ];
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || !identity.trim() || !unit.trim()) return; onAdd({ name: name.trim(), id: identity.trim(), role, unit: unit.trim(), active: true }); };
  return <div className="modal-backdrop" role="presentation"><form className="modal add-user-modal" role="dialog" aria-modal="true" aria-labelledby="add-user-title" onSubmit={submit}>
    <div className="modal__head"><div className="modal__icon"><Icon name="users" /></div><div><h2 id="add-user-title">Tambah pengguna baru</h2><p>Lengkapi identitas dan tentukan hak akses pengguna.</p></div><button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup modal"><Icon name="close" /></button></div>
    <div className="modal__body">
      <div className="form-grid"><Field label="Nama lengkap" placeholder="Contoh: Aditya Saputra" value={name} onChange={setName} /><Field label="NIM / NIP / Email" placeholder="Contoh: 22.G1.0087" value={identity} onChange={setIdentity} /></div>
      <Field label="Fakultas / Unit kerja" placeholder="Contoh: Ilmu Komputer atau Perkap" value={unit} onChange={setUnit} />
      <fieldset className="role-selector"><legend>Role dan hak akses</legend><p>Pilih satu role sesuai tanggung jawab pengguna.</p><div>{roleOptions.map((option) => <button type="button" key={option.value} className={role === option.value ? "active" : ""} onClick={() => setRole(option.value)} aria-pressed={role === option.value}><span className="role-selector__check">{role === option.value && <Icon name="check" size={15} />}</span><span><strong>{option.value}</strong><small>{option.description}</small></span><Badge tone={option.tone}>{option.value === "Mahasiswa" ? "Peminjam" : option.value === "Petugas Perkap" ? "Operasional" : "Akses penuh"}</Badge></button>)}</div></fieldset>
      <div className="security-note"><Icon name="shield" size={18} /><div><strong>Daftar lokal</strong><span>Role login sebenarnya ditentukan oleh backend; daftar ini belum tersimpan ke database.</span></div></div>
    </div>
    <div className="modal__foot"><Button variant="secondary" onClick={onClose}>Batalkan</Button><Button type="submit" icon="plus" disabled={!name.trim() || !identity.trim() || !unit.trim()}>Tambah Pengguna</Button></div>
  </form></div>;
}

function AdminConsole({ section, ctx, userEmail }: { section: string; ctx: Ctx; userEmail: string }) {
  const { catalog, stockLevels, maintenance, borrowings, serialMap, audit } = ctx;
  const [users, setUsers] = useState<UserRow[]>(() => [
    { name: userEmail.split("@")[0], id: userEmail, role: "Super Admin", unit: "Perkap", active: true },
    ...Array.from(new Set(borrowings.map((b) => b.email))).filter((e) => e && e !== userEmail).map((e) => ({ name: e.split("@")[0], id: e, role: "Mahasiswa" as UserRole, unit: "-", active: true })),
  ]);
  const [query, setQuery] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);

  if (section === "services") return <><div className="section-head admin-head"><div><Badge tone="purple">SUPER ADMIN PERKAP</Badge><h2>Master alat Perkap</h2><p>Konfigurasi total_stock, available_stock, dan ItemStock fisik.</p></div><Button variant="secondary" icon="download" onClick={() => downloadText("master-alat.csv", "alat,total_stock,available_stock\n" + catalog.map((item) => `${item.title},${item.total},${stockLevels[item.title] ?? item.available}`).join("\n"))}>Ekspor stok</Button></div><div className="config-grid">{catalog.map((item) => { const available = stockLevels[item.title] ?? item.available; const statuses = unitStatuses(item, available, maintenance, borrowings, serialMap); return <article className="panel config-card" key={item.title}><div className={`service-icon service-icon--${item.tone}`}><Icon name={item.icon} /></div><div className="config-card__heading"><div><span>{item.category}</span><h3>{item.title}</h3></div><label className="switch" title="Aktifkan alat"><input type="checkbox" defaultChecked /><span /></label></div><div className="stock-config"><div><label>total_stock</label><span><button onClick={() => ctx.editTotal(item.title, -1)}>−</button><strong>{item.total}</strong><button onClick={() => ctx.editTotal(item.title, 1)}>+</button></span></div><div><label>available_stock</label><span><button onClick={() => ctx.adjustStock(item.title, -1)}>−</button><strong>{available}</strong><button onClick={() => ctx.adjustStock(item.title, 1)}>+</button></span></div></div><div className="serial-preview"><div><strong>ItemStock · Nomor seri fisik</strong><Badge tone="gray">{item.serials.length} unit tercatat</Badge></div><p>{item.serials.map((serial) => { const st = statuses[serial] ?? "Tersedia"; return <span className="serial-health" key={serial}><code>{serial}</code><Badge tone={st === "Tersedia" ? "green" : st === "Perawatan" ? "red" : "yellow"}>{st}</Badge></span>; })}</p><Button variant="ghost" icon="plus" onClick={() => { const serial = window.prompt("Nomor seri unit baru"); if (serial?.trim()) ctx.addSerial(item.title, serial.trim()); }}>Tambah ItemStock</Button></div></article>; })}</div></>;

  if (section === "audit") return <><div className="section-head admin-head"><div><Badge tone="purple">SUPER ADMIN PERKAP</Badge><h2>Log Aktivitas & Audit Trail</h2><p>Pembaruan inventaris, validasi, handover, dan email dengan timestamp.</p></div><Button variant="secondary" icon="download" onClick={() => downloadText("audit-perkap.csv", "timestamp,aktor,aktivitas,modul,target\n" + audit.map((a) => `${a.time},${a.actor},${a.activity},${a.module},${a.target}`).join("\n"))}>Ekspor log</Button></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Timestamp</th><th>Aktor</th><th>Aktivitas</th><th>Modul</th><th>Target</th><th>Status</th></tr></thead><tbody>{audit.map((row, i) => <tr key={i}><td><b>{row.time}</b></td><td>{row.actor}</td><td>{row.activity}</td><td><Badge tone={row.module === "Email Scheduler" ? "purple" : "gray"}>{row.module}</Badge></td><td><code>{row.target}</code></td><td><Badge tone="green">Berhasil</Badge></td></tr>)}</tbody></table></div>{!audit.length && <div className="empty-state"><Icon name="history" size={30} /><h3>Belum ada aktivitas</h3></div>}</section></>;

  const visibleUsers = users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase()) || user.id.toLowerCase().includes(query.toLowerCase()));
  return <><div className="section-head admin-head"><div><Badge tone="purple">SUPER ADMIN PERKAP</Badge><h2>Kelola user</h2><p>Kelola akses peminjam, petugas gudang, dan administrator.</p></div><Button icon="plus" onClick={() => setShowAddUser(true)}>Tambah pengguna</Button></div><section className="panel table-panel"><div className="table-toolbar"><label className="search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama atau ID..." /></label></div><div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>ID</th><th>Peran</th><th>Fakultas / Unit</th><th>Status</th><th>Tindakan</th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id}><td><div className="person"><span className="avatar avatar--small">{user.name.slice(0, 2).toUpperCase()}</span><strong>{user.name}</strong></div></td><td>{user.id}</td><td><Badge tone={user.role === "Super Admin" ? "red" : user.role === "Petugas Perkap" ? "purple" : "gray"}>{user.role}</Badge></td><td>{user.unit}</td><td><Badge tone={user.active ? "green" : "gray"}>{user.active ? "Aktif" : "Nonaktif"}</Badge></td><td><div className="row-actions"><Button variant="secondary" disabled={user.id === userEmail} onClick={() => setUsers((c) => c.map((e) => e.id === user.id ? { ...e, active: !e.active } : e))}>{user.active ? "Nonaktifkan" : "Aktifkan"}</Button><Button variant="danger" disabled={user.id === userEmail} onClick={() => setUsers((c) => c.filter((e) => e.id !== user.id))}>Hapus</Button></div></td></tr>)}</tbody></table></div></section>{showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} onAdd={(user) => { setUsers((c) => [...c, user]); ctx.log(userEmail, `Menambah pengguna ${user.id} (${user.role})`, "User Management", user.id); setShowAddUser(false); }} />}</>;
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ realRole, userEmail, onLogout, ctx }: { realRole: Role; userEmail: string; onLogout: () => void; ctx: Ctx }) {
  const [view, setView] = useState<Role>(realRole);
  const role = view;
  const firstOf = (r: Role) => (r === "student" ? "catalog" : r === "staff" ? "validation" : "users");
  const [active, setActive] = useState(firstOf(realRole));
  useEffect(() => { setActive(firstOf(view)); }, [view]);
  const [selectedService, setSelectedService] = useState("");
  const [trackId, setTrackId] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [followup, setFollowup] = useState<{ email: string; id: string } | null>(null);
  const [showSyncToast, setShowSyncToast] = useState(false);

  const roleNav: Record<Role, NavItem[]> = {
    student: [{ id: "catalog", label: "Katalog Alat", icon: "box" }, { id: "history", label: "Riwayat Peminjaman", icon: "history" }, { id: "notifications", label: "Notifikasi", icon: "bell" }],
    staff: [{ id: "validation", label: "Validasi Peminjaman", icon: "check" }, { id: "loans", label: "Peminjaman Aktif", icon: "clock" }, { id: "scanner", label: "Scan QR / Handover", icon: "scan" }, { id: "maintenance", label: "Maintenance / Perbaikan", icon: "settings" }, { id: "inventory", label: "Stok Fisik & Seri", icon: "box" }, { id: "reports", label: "Laporan", icon: "chart" }],
    admin: [{ id: "users", label: "Kelola User", icon: "users" }, { id: "services", label: "Master Alat Perkap", icon: "settings" }, { id: "audit", label: "Log Aktivitas & Audit Trail", icon: "history" }],
  };
  const titles: Record<string, string> = { catalog: "Katalog Alat", request: "Ajukan Peminjaman", history: "Riwayat Peminjaman", tracking: `Status #${trackId}`, notifications: "Notifikasi", validation: "Validasi Peminjaman", loans: "Peminjaman Aktif & Overdue", scanner: "Scan QR / Handover", maintenance: "Maintenance / Perbaikan", inventory: "Stok Fisik & Seri", reports: "Laporan Perkap", users: "Kelola User", services: "Master Alat Perkap", audit: "Log Aktivitas & Audit Trail" };
  const navigate = (id: string) => { setActive(id); setMobileOpen(false); };

  const { catalog, borrowings, stockLevels, maintenance, handovers, files, serialMap } = ctx;
  const mine = borrowings.filter((b) => b.email === userEmail);
  const tracked = borrowings.find((b) => b.id === trackId);
  const trackedSvc = tracked ? catalog.find((s) => s.title === tracked.service) ?? catalog[0] : undefined;

  const studentContent = active === "request" ? <StudentRequestForm service={selectedService} catalog={catalog} borrowings={borrowings} mine={mine} onBack={() => setActive("catalog")} onSubmit={(purpose, file, date) => ctx.submit(selectedService, purpose, file, date)} onDone={(id) => { setTrackId(id); setShowSyncToast(true); setActive("tracking"); }} />
    : active === "tracking" && tracked && trackedSvc ? <StudentTracking b={tracked} svc={trackedSvc} serial={serialMap[tracked.id] ?? trackedSvc.serials[0]} files={files} onBack={() => setActive("history")} />
    : active === "history" || active === "tracking" ? <StudentHistory mine={mine} catalog={catalog} serialMap={serialMap} onView={(id) => { setTrackId(id); setActive("tracking"); }} />
    : active === "notifications" ? <StudentNotifications mine={mine} />
    : <StudentCatalog services={catalog} stockLevels={stockLevels} onApply={(s) => { setSelectedService(s); setActive("request"); }} />;

  const staffContent = active === "loans" ? <ActiveLoans borrowings={borrowings} catalog={catalog} serialMap={serialMap} onFollowup={(email, id) => setFollowup({ email, id })} />
    : active === "scanner" ? <QRScanner borrowings={borrowings} catalog={catalog} serialMap={serialMap} handovers={handovers} onStatus={ctx.setStatus} onMaintenance={ctx.addMaintenance} onHandover={ctx.addHandover} />
    : active === "maintenance" ? <MaintenancePanel items={maintenance} onUpdate={ctx.updateMaintenance} onResolve={ctx.resolveMaintenance} />
    : active === "inventory" ? <InventoryStock catalog={catalog} stockLevels={stockLevels} maintenance={maintenance} borrowings={borrowings} serialMap={serialMap} />
    : active === "reports" ? <Reports borrowings={borrowings} catalog={catalog} handovers={handovers} stockLevels={stockLevels} />
    : <StaffValidation borrowings={borrowings} files={files} onUpdateStatus={ctx.setStatus} />;

  const pendingCount = borrowings.filter((b) => isPending(b.status)).length;
  return (
    <div className={`app-shell ${mobileOpen ? "mobile-open" : ""}`}>
      <Sidebar role={role} active={active} items={roleNav[role]} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onSelect={navigate} onLogout={onLogout} userEmail={userEmail} />
      <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Tutup navigasi" />
      <div className="app-main">
        <Header eyebrow={`PERKAP / ${roleLabels[role]}`} title={titles[active] ?? ""} initials={initialsOf(userEmail)} alert={role === "student" ? mine.length > 0 : pendingCount > 0} onMenu={() => setMobileOpen(true)} onHelp={() => { window.location.href = "mailto:perkap@unika.ac.id?subject=Bantuan Portal Perkap"; }} onNotification={() => role === "student" ? setActive("notifications") : role === "staff" ? (pendingCount ? setActive("validation") : window.alert("Tidak ada notifikasi operasional baru.")) : setActive("audit")} />
        <main className="content">{role === "student" ? studentContent : role === "staff" ? staffContent : <AdminConsole section={active} ctx={ctx} userEmail={userEmail} />}</main>
        {realRole === "admin" && <div className="role-switcher"><span>Pratinjau portal:</span>{(Object.keys(roleLabels) as Role[]).map((item) => <button className={item === role ? "active" : ""} onClick={() => setView(item)} key={item}>{roleLabels[item]}</button>)}</div>}
      </div>
      {showSyncToast && <section className="sync-toast" role="status"><div className="sync-toast__icon"><Icon name="check" /></div><div><strong>Pengajuan Berhasil Dikirim!</strong><span>Tersinkron dengan database PostgreSQL. Stok telah direservasi.</span></div><button onClick={() => setShowSyncToast(false)} aria-label="Tutup notifikasi"><Icon name="close" size={18} /></button><i /></section>}
      {followup && <FollowupModal email={followup.email} onClose={() => setFollowup(null)} onSent={(email) => ctx.log(userEmail, "Email follow-up overdue terkirim", "Email Scheduler", `${followup.id} → ${email}`)} />}
    </div>
  );
}

/* ============================== APP ============================== */
export default function App() {
  const [session, setSession] = useState<{ role: Role; email: string } | null>(() => {
    try { const raw = sessionStorage.getItem("perkap_session"); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [rawServices, setRawServices] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [adjust, setAdjust] = useState<Record<string, number>>({});
  const [edits, setEdits] = useState<Record<string, { totalDelta: number; extra: string[] }>>({});
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [handovers, setHandovers] = useState<HandoverEntry[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [assign, setAssign] = useState<Record<string, string>>({});

  const email = session?.email ?? "";

  const log = (actor: string, activity: string, module: string, target: string) => setAudit((c) => [{ time: nowLabel(), actor, activity, module, target }, ...c]);

  const handleLogin = (role: Role, mail: string) => {
    const next = { role, email: mail };
    try { sessionStorage.setItem("perkap_session", JSON.stringify(next)); } catch { /* abaikan */ }
    setSession(next);
    setAudit((c) => [{ time: nowLabel(), actor: mail, activity: `Login (${roleLabels[role]})`, module: "Auth", target: mail }, ...c]);
  };
  const handleLogout = () => {
    try { sessionStorage.removeItem("perkap_session"); } catch { /* abaikan */ }
    Object.values(files).forEach((u) => URL.revokeObjectURL(u));
    setSession(null); setBorrowings([]); setRawServices([]); setAdjust({}); setEdits({}); setMaintenance([]); setHandovers([]); setFiles({}); setAssign({});
  };

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/services`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setRawServices(d); }).catch(() => {});
    fetch(`${API}/borrowings`).then((r) => r.json()).then((d) => { if (Array.isArray(d)) setBorrowings(d.map(normalizeBorrowing)); }).catch(() => {});
  }, [session]);

  const catalog = useMemo<Service[]>(() => {
    const base = rawServices.length ? rawServices.map(normalizeService) : staticServices;
    return base.map((s) => {
      const e = edits[s.title];
      if (!e) return s;
      const total = Math.max(1, s.total + e.totalDelta);
      return { ...s, total, serials: [...s.serials, ...e.extra] };
    });
  }, [rawServices, edits]);

  const stockLevels = useMemo(() => Object.fromEntries(catalog.map((s) => [s.title, clamp(s.available + (adjust[s.title] ?? 0), 0, s.total)])), [catalog, adjust]);

  // alokasi serial fisik permanen per peminjaman (tidak bergeser saat peminjaman lain selesai)
  useEffect(() => {
    setAssign((prev) => {
      const next = { ...prev };
      let changed = false;
      catalog.forEach((svc) => {
        const used = new Set<string>(maintenance.filter((m) => m.item === svc.title).map((m) => m.serial));
        const live = borrowings.filter((b) => b.service === svc.title && isOpen(b.status) && b.status !== "In Maintenance");
        live.forEach((b) => { if (next[b.id]) used.add(next[b.id]); });
        live.filter((b) => !next[b.id]).forEach((b) => {
          const s = svc.serials.find((x) => !used.has(x));
          if (s) { next[b.id] = s; used.add(s); changed = true; }
        });
      });
      return changed ? next : prev;
    });
  }, [borrowings, catalog, maintenance]);

  const adjustStock = (service: string, delta: number) => {
    const svc = catalog.find((s) => s.title === service);
    if (!svc) return;
    setAdjust((c) => {
      const cur = clamp(svc.available + (c[service] ?? 0), 0, svc.total);
      const next = clamp(cur + delta, 0, svc.total);
      return { ...c, [service]: next - svc.available };
    });
  };
  const editTotal = (service: string, delta: number) => {
    const svc = catalog.find((s) => s.title === service);
    if (!svc) return;
    const available = stockLevels[service] ?? svc.available;
    if (svc.total + delta < Math.max(1, available)) return;
    setEdits((c) => ({ ...c, [service]: { totalDelta: (c[service]?.totalDelta ?? 0) + delta, extra: c[service]?.extra ?? [] } }));
    log(email, `total_stock ${service}: ${svc.total} → ${svc.total + delta}`, "Inventory DB", service);
  };
  const addSerial = (service: string, serial: string) => {
    setEdits((c) => ({ ...c, [service]: { totalDelta: (c[service]?.totalDelta ?? 0) + 1, extra: [...(c[service]?.extra ?? []), serial] } }));
    setAdjust((c) => ({ ...c, [service]: (c[service] ?? 0) + 1 }));
    log(email, `ItemStock baru ditambahkan: ${serial}`, "Inventory DB", service);
  };

  const submit = async (service: string, purpose: string, file: File, borrowDate: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API}/borrow`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, service, purpose, borrowDate, file: file.name }) });
      const data = await res.json();
      if (!res.ok || !data.success) return null;
      const id = String(data.id);
      setBorrowings((prev) => [...prev, { id, email, service, purpose, borrowDate, file: file.name, status: data.status ?? "Menunggu Verifikasi", submittedAt: data.submittedAt ?? nowLabel() }]);
      setFiles((prev) => ({ ...prev, [id]: URL.createObjectURL(file) }));
      adjustStock(service, -1);
      log(email, "Pengajuan peminjaman baru", "Borrowing", id);
      return id;
    } catch (_err) {
      return null;
    }
  };

  const setStatus = async (id: string, status: string) => {
    const b = borrowings.find((x) => x.id === id);
    if (!b) return;
    if (isOpen(b.status) !== isOpen(status)) adjustStock(b.service, isOpen(status) ? -1 : 1);
    setBorrowings((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    log(email, `Status ${b.status} → ${status}`, "Borrowing", id);
    try {
      await fetch(`${API}/borrowings/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    } catch (_err) { /* ditampilkan lokal saja bila server tidak terjangkau */ }
  };

  const addMaintenance = (item: MaintenanceItem) => {
    setMaintenance((c) => (c.some((m) => m.serial === item.serial) ? c : [item, ...c]));
    log(email, "ItemStock dikarantina: In Maintenance", "Incident Log", item.serial);
  };
  const updateMaintenance = (serial: string, status: MaintenanceItem["status"]) => setMaintenance((c) => c.map((m) => (m.serial === serial ? { ...m, status } : m)));
  const resolveMaintenance = (serial: string) => {
    const item = maintenance.find((m) => m.serial === serial);
    if (!item) return;
    setMaintenance((c) => c.filter((m) => m.serial !== serial));
    const loan = borrowings.find((b) => b.id === item.loanId && b.status === "In Maintenance");
    if (loan) setStatus(loan.id, "Dikembalikan");
    else adjustStock(item.item, 1);
    log(email, "Perbaikan selesai, unit kembali tersedia", "Incident Log", serial);
  };
  const addHandover = (entry: HandoverEntry) => {
    setHandovers((c) => [entry, ...c]);
    log(email, `Handover: ${entry.activity}`, "Handover", entry.id);
  };

  const serialMap = assign;
  const ctx: Ctx = { catalog, borrowings, stockLevels, maintenance, handovers, audit, files, serialMap, submit, setStatus, addMaintenance, updateMaintenance, resolveMaintenance, adjustStock, editTotal, addSerial, addHandover, log };

  return session ? <Dashboard realRole={session.role} userEmail={session.email} onLogout={handleLogout} ctx={ctx} /> : <Login onLogin={handleLogin} />;
}