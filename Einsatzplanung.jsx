import { useState, useMemo, useEffect, useRef, memo, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import { LayoutDashboard, Euro, Sparkles, CalendarDays, Calendar, CalendarRange, Clock, FileText, TreePalm, Building2, Users, User, Truck, BedDouble, Wrench, Settings, AlertTriangle, Pencil, Trash2, Save, FileDown, FileSpreadsheet, List, TrendingUp, Lightbulb, Zap, HardHat, Menu, X, Moon, Sun, MapPin, Plus, Bell, MessageCircle, Send, Inbox, Thermometer, CircleSlash, Ruler } from "lucide-react";

// ─── Farbschema Hell/Dunkel (wird vom Schalter im Header umgestellt) ──────────
const THEME_HELL   = { panel:"#ffffff", panel2:"#f9fafb", text:"#1f2937", textMut:"#6b7280", border:"#e5e7eb", input:"#ffffff" };
const THEME_DUNKEL = { panel:"#1e293b", panel2:"#0f172a", text:"#e2e8f0", textMut:"#94a3b8", border:"#334155", input:"#0f172a" };
let TH = THEME_HELL;

// ─── Dauerhaftes Speichern (mit Fallback im Vorschaufenster) ──────────────────
const _mem = {};
const store = {
  get(key) {
    try { const v = window.localStorage.getItem(key); return v != null ? JSON.parse(v) : (_mem[key] ?? null); }
    catch { return _mem[key] ?? null; }
  },
  set(key, val) {
    _mem[key] = val;
    try { window.localStorage.setItem(key, JSON.stringify(val)); } catch { /* Vorschau: nur Memory */ }
  },
  remove(key) {
    delete _mem[key];
    try { window.localStorage.removeItem(key); } catch {}
  },
};
function usePersist(key, initial) {
  const [val, setVal] = useState(() => {
    const saved = store.get(key);
    return saved != null ? saved : initial;
  });
  useEffect(() => { store.set(key, val); }, [key, val]);
  return [val, setVal];
}

// ─── Farben & Konstanten ─────────────────────────────────────────────────────
// Farbpalette – Teams bekommen automatisch eine Farbe zugewiesen
const TEAM_PALETTE = [
  { bg:"#1d4ed8", light:"#dbeafe", text:"#1e40af" },
  { bg:"#059669", light:"#d1fae5", text:"#047857" },
  { bg:"#d97706", light:"#fef3c7", text:"#b45309" },
  { bg:"#7c3aed", light:"#ede9fe", text:"#6d28d9" },
  { bg:"#dc2626", light:"#fee2e2", text:"#b91c1c" },
  { bg:"#0891b2", light:"#cffafe", text:"#0e7490" },
  { bg:"#db2777", light:"#fce7f3", text:"#be185d" },
  { bg:"#65a30d", light:"#ecfccb", text:"#4d7c0f" },
  { bg:"#0f766e", light:"#ccfbf1", text:"#0d9488" },
  { bg:"#9333ea", light:"#f3e8ff", text:"#7e22ce" },
];
let TEAM_NAMEN_AKTUELL = ["Team Alpha","Team Beta","Team Gamma","Team Delta"];
let TEAM_FARB_MAP = {};
function setTeamListe(teams) {
  TEAM_NAMEN_AKTUELL = (teams||[]).map(t=>t.name).filter(Boolean);
  TEAM_FARB_MAP = {};
  TEAM_NAMEN_AKTUELL.forEach((n,i)=>{ TEAM_FARB_MAP[n] = TEAM_PALETTE[i % TEAM_PALETTE.length]; });
}
setTeamListe(TEAM_NAMEN_AKTUELL.map(n=>({name:n})));
const EINSATZ_FARBEN = {
  "Projekt":   { bg:"#dbeafe", border:"#3b82f6", badge:"#1d4ed8" },
  "Urlaub":    { bg:"#d1fae5", border:"#10b981", badge:"#065f46" },
  "Krank":     { bg:"#fee2e2", border:"#ef4444", badge:"#991b1b" },
  "Frei":      { bg:"#f3f4f6", border:"#9ca3af", badge:"#374151" },
  "Schulung":  { bg:"#fef3c7", border:"#f59e0b", badge:"#92400e" },
  "Werkstatt": { bg:"#f5f3ff", border:"#8b5cf6", badge:"#5b21b6" },
};
const STATUS_FARBEN = {
  "geplant":"#6b7280","bestätigt":"#2563eb","laufend":"#16a34a",
  "abgeschlossen":"#374151","verschoben":"#d97706","storniert":"#dc2626",
};
const WOCHENTAGE = ["So","Mo","Di","Mi","Do","Fr","Sa"];
const WOCHENTAGE_LANG = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
const MONATE = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

// ─── Demodaten ───────────────────────────────────────────────────────────────
export const initMitarbeiter = [
  { id:1,  name:"Klaus Weber",    rolle:"Vorarbeiter", team:"Team Alpha", tel:"0171-1111111", fuehrerschein:true,  stapler:true,  schweisser:false, urlaub:12, krank:3 },
  { id:2,  name:"Marco Schulz",   rolle:"Monteur",     team:"Team Alpha", tel:"0172-2222222", fuehrerschein:true,  stapler:false, schweisser:true,  urlaub:15, krank:1 },
  { id:3,  name:"Timo Braun",     rolle:"Monteur",     team:"Team Alpha", tel:"0173-3333333", fuehrerschein:false, stapler:false, schweisser:true,  urlaub:10, krank:0 },
  { id:4,  name:"Stefan Bauer",   rolle:"Monteur",     team:"Team Alpha", tel:"0174-4444444", fuehrerschein:true,  stapler:true,  schweisser:false, urlaub:8,  krank:2 },
  { id:5,  name:"Dirk Müller",    rolle:"Vorarbeiter", team:"Team Beta",  tel:"0175-5555555", fuehrerschein:true,  stapler:true,  schweisser:true,  urlaub:14, krank:0 },
  { id:6,  name:"Jonas Klein",    rolle:"Monteur",     team:"Team Beta",  tel:"0176-6666666", fuehrerschein:true,  stapler:false, schweisser:false, urlaub:12, krank:4 },
  { id:7,  name:"Nico Hoffmann",  rolle:"Monteur",     team:"Team Beta",  tel:"0177-7777777", fuehrerschein:false, stapler:true,  schweisser:true,  urlaub:10, krank:1 },
  { id:8,  name:"Lars Fischer",   rolle:"Vorarbeiter", team:"Team Gamma", tel:"0178-8888888", fuehrerschein:true,  stapler:false, schweisser:false, urlaub:16, krank:2 },
  { id:9,  name:"Kai Richter",    rolle:"Monteur",     team:"Team Gamma", tel:"0179-9999999", fuehrerschein:true,  stapler:true,  schweisser:true,  urlaub:11, krank:0 },
  { id:10, name:"Ben Krause",     rolle:"Monteur",     team:"Team Gamma", tel:"0180-1010101", fuehrerschein:false, stapler:false, schweisser:true,  urlaub:9,  krank:3 },
  { id:11, name:"Frank Vogel",    rolle:"Vorarbeiter", team:"Team Delta", tel:"0181-1111112", fuehrerschein:true,  stapler:true,  schweisser:true,  urlaub:13, krank:1 },
  { id:12, name:"Lukas Wolf",     rolle:"Monteur",     team:"Team Delta", tel:"0182-2222223", fuehrerschein:true,  stapler:false, schweisser:false, urlaub:7,  krank:2 },
  { id:13, name:"Max Zimmermann", rolle:"Monteur",     team:"Team Delta", tel:"0183-3333334", fuehrerschein:false, stapler:true,  schweisser:true,  urlaub:10, krank:0 },
];
export const initFahrzeuge = [
  { id:"F1", kz:"MK-AB 100", typ:"Sprinter",    team:"Team Alpha", tuev:"2025-08" },
  { id:"F2", kz:"MK-CD 200", typ:"Transporter", team:"Team Beta",  tuev:"2026-01" },
  { id:"F3", kz:"MK-EF 300", typ:"Pritsche",    team:"Team Gamma", tuev:"2025-11" },
  { id:"F4", kz:"MK-GH 400", typ:"Sprinter",    team:"Team Delta", tuev:"2026-03" },
];
// Projekte jetzt mit echten Datumsangaben (2026)
export const initProjekte = [
  { id:"P1", name:"Kranbahn Halle A",   kunde:"Müller Stahl GmbH",    ort:"Dortmund",  dateStart:"2026-05-25", dateEnd:"2026-06-19", team:"Team Alpha", status:"laufend",       fzg:"F1", vorarbeiter:"Klaus Weber",  bemerkung:"Anreise Sonntag, Hotel gebucht" },
  { id:"P2", name:"RBG-Schienen Werk2", kunde:"AutoParts AG",          ort:"Wolfsburg", dateStart:"2026-06-01", dateEnd:"2026-06-26", team:"Team Beta",  status:"bestätigt",     fzg:"F2", vorarbeiter:"Dirk Müller", bemerkung:"Material fehlt – Rücksprache mit Bauleiter" },
  { id:"P3", name:"Montage Kran K12",   kunde:"Chemie Nord GmbH",      ort:"Hamburg",   dateStart:"2026-06-08", dateEnd:"2026-06-19", team:"Team Gamma", status:"geplant",       fzg:"F3", vorarbeiter:"Lars Fischer",bemerkung:"Kunde wartet auf Freigabe" },
  { id:"P4", name:"Kranbahnrep. West",  kunde:"Logistik Zentrum GmbH", ort:"Köln",      dateStart:"2026-06-15", dateEnd:"2026-07-10", team:"Team Delta", status:"geplant",       fzg:"F4", vorarbeiter:"Frank Vogel", bemerkung:"" },
  { id:"P5", name:"Wartung Lager",      kunde:"intern",                ort:"Werkstatt", dateStart:"2026-05-25", dateEnd:"2026-05-29", team:"Team Beta",  status:"abgeschlossen", fzg:"F2", vorarbeiter:"Dirk Müller", bemerkung:"Abgeschlossen" },
];
// Sondereinsätze ebenfalls mit echten Daten
export const initSonder = [
  { id:"S1", ma:2,  typ:"Urlaub",   dateStart:"2026-06-29", dateEnd:"2026-07-10", bemerkung:"Sommerurlaub" },
  { id:"S2", ma:7,  typ:"Krank",    dateStart:"2026-06-02", dateEnd:"2026-06-05", bemerkung:"" },
  { id:"S3", ma:10, typ:"Schulung", dateStart:"2026-06-22", dateEnd:"2026-06-22", bemerkung:"Schweißerschein Auffrischung" },
  { id:"S4", ma:13, typ:"Frei",     dateStart:"2026-06-15", dateEnd:"2026-06-15", bemerkung:"" },
];

// ─── Datums-Helpers ───────────────────────────────────────────────────────────
function parseDate(s) { return new Date(s + "T00:00:00"); }
function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
}
function fmtDateShort(d) {
  return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
}
function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getKW(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
  return 1 + Math.round((tmp - firstThursday) / 604800000);
}
function getMondayOfKW(year, kw) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = (jan4.getUTCDay() + 6) % 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + (kw - 1) * 7);
  return monday;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function dateInRange(d, start, end) {
  const ds = parseDate(start), de = parseDate(end);
  return d >= ds && d <= de;
}
function getProjektForTeamDate(projekte, team, date) {
  return projekte.find(p => p.team === team && dateInRange(date, p.dateStart, p.dateEnd));
}
function getSonderForMaDate(sonder, maId, date) {
  return sonder.find(s => s.ma === maId && dateInRange(date, s.dateStart, s.dateEnd));
}
function isWeekend(d) { const day = d.getDay(); return day === 0 || day === 6; }

function calcStunden(start, end, pauseMin) {
  if (!start || !end) return 0;
  const [sh,sm] = start.split(":").map(Number);
  const [eh,em] = end.split(":").map(Number);
  return Math.max(0, ((eh*60+em)-(sh*60+sm)-(pauseMin||0))/60);
}
function getTeamColor(team) {
  if (TEAM_FARB_MAP[team]) return TEAM_FARB_MAP[team];
  if (!team) return { bg:"#6b7280", light:"#f3f4f6", text:"#374151" };
  let h=0; for (const c of String(team)) h=(h*31+c.charCodeAt(0))>>>0;
  return TEAM_PALETTE[h % TEAM_PALETTE.length];
}
function pruefKonflikte(projekte, sonder, mitarbeiter) {
  const warn = [];
  projekte.forEach(p => { if (!p.vorarbeiter && p.status!=="storniert") warn.push({ typ:"Vorarbeiter", msg:`Projekt "${p.name}" hat keinen Vorarbeiter` }); });
  sonder.forEach(s => {
    const ma = mitarbeiter.find(m => m.id===s.ma); if (!ma) return;
    const proj = projekte.find(p => p.team===ma.team && p.dateStart<=s.dateEnd && p.dateEnd>=s.dateStart && p.status!=="storniert");
    if (proj && (s.typ==="Urlaub"||s.typ==="Krank")) warn.push({ typ:"Konflikt", msg:`${ma.name} ist ${s.typ} (${fmtDate(parseDate(s.dateStart))}–${fmtDate(parseDate(s.dateEnd))}), aber im Projekt "${proj.name}" eingeplant` });
  });
  return warn;
}

// ─── UI Atoms ────────────────────────────────────────────────────────────────
function Badge({ children, color="#6b7280" }) {
  return <span style={{ display:"inline-block", padding:"1px 7px", borderRadius:9999, fontSize:10, fontWeight:700, backgroundColor:color+"22", color, border:`1px solid ${color}44`, whiteSpace:"nowrap" }}>{children}</span>;
}
function Info({ label, value }) {
  return <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{label} </span><span style={{ color:TH.text, fontWeight:500 }}>{value}</span></div>;
}
const thS = () => ({ padding:"7px 8px", background:TH.panel2, fontWeight:700, fontSize:11, color:TH.textMut, borderBottom:"2px solid "+TH.border, textAlign:"center", whiteSpace:"nowrap" });
const tdS = () => ({ padding:"5px 8px", verticalAlign:"middle", color:TH.text });
const inpS = () => ({ padding:"5px 8px", borderRadius:6, border:"1.5px solid "+TH.border, fontSize:12, width:"100%", boxSizing:"border-box", background:TH.input, color:TH.text });

// ─── TAGESANSICHT ─────────────────────────────────────────────────────────────
function Tagesansicht({ mitarbeiter, projekte, sonder, fahrzeuge }) {
  const [datum, setDatum] = useState(isoDate(new Date()));
  const d = parseDate(datum);
  const wt = WOCHENTAGE_LANG[d.getDay()];
  const kw = getKW(d);

  const eintraege = mitarbeiter.map(ma => {
    const proj = getProjektForTeamDate(projekte, ma.team, d);
    const se = getSonderForMaDate(sonder, ma.id, d);
    const eintrag = se || (proj ? { typ:"Projekt", projekt:proj } : null);
    return { ma, eintrag };
  });

  const aufBaustelle = eintraege.filter(e => e.eintrag?.typ==="Projekt");
  const abwesend     = eintraege.filter(e => e.eintrag && e.eintrag.typ!=="Projekt");
  const frei         = eintraege.filter(e => !e.eintrag);

  return (
    <div>
      {/* Datumsauswahl */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:18, flexWrap:"wrap" }}>
        <button onClick={() => setDatum(isoDate(addDays(d,-1)))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:20, color:TH.text }}>{wt}, {fmtDate(d)}</div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>Kalenderwoche {kw} · {MONATE[d.getMonth()]} {d.getFullYear()}</div>
        </div>
        <button onClick={() => setDatum(isoDate(addDays(d,1)))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>›</button>
        <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{ ...inpS(), width:160, marginLeft:8 }} />
        <button onClick={() => setDatum(isoDate(new Date()))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #ea580c", background:"#ffedd5", color:"#ea580c", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      {isWeekend(d) && (
        <div style={{ background:"#fef9c3", border:"1.5px solid #fcd34d", borderRadius:8, padding:"10px 14px", marginBottom:14, color:"#92400e", fontSize:13, fontWeight:600 }}>
          Wochenende – kein regulärer Arbeitstag
        </div>
      )}

      {/* Zusammenfassung */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"Auf Baustelle", wert:aufBaustelle.length, farbe:"#1d4ed8" },
          { label:"Abwesend",      wert:abwesend.length,     farbe:"#dc2626" },
          { label:"Verfügbar",     wert:frei.length,          farbe:"#16a34a" },
        ].map(k => (
          <div key={k.label} style={{ background:TH.panel, border:`1.5px solid ${k.farbe}33`, borderRadius:12, padding:"10px 14px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.farbe }}>{k.wert}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Baustellen-Karten */}
      {aufBaustelle.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Building2 size={15}/>Heute auf Baustelle</span></div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {Object.entries(
              aufBaustelle.reduce((acc, { ma, eintrag }) => {
                const key = eintrag.projekt.id;
                if (!acc[key]) acc[key] = { projekt:eintrag.projekt, team:[] };
                acc[key].team.push(ma);
                return acc;
              }, {})
            ).map(([id, { projekt:p, team }]) => {
              const col = getTeamColor(p.team);
              const fzg = fahrzeuge.find(f=>f.id===p.fzg);
              return (
                <div key={id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
                  <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontWeight:700 }}>{p.name}</span>
                    <span style={{ fontSize:12, opacity:0.85 }}><span style={{display:"inline-flex",alignItems:"center",gap:4}}><MapPin size={11}/>{p.ort}</span></span>
                  </div>
                  <div style={{ padding:"10px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 16px", fontSize:12 }}>
                    <Info label="Kunde" value={p.kunde} />
                    <Info label="Fahrzeug" value={fzg ? `${fzg.kz} (${fzg.typ})` : "–"} />
                    <Info label="Bis" value={fmtDate(parseDate(p.dateEnd))} />
                    <Info label="Status" value={p.status} />
                    <div style={{ gridColumn:"1/-1", marginTop:6 }}>
                      <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>Team</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {team.map(ma => (
                          <span key={ma.id} style={{
                            padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600,
                            background: ma.rolle==="Vorarbeiter" ? col.bg : col.light,
                            color: ma.rolle==="Vorarbeiter" ? "#fff" : col.text,
                            border:`1px solid ${col.bg}44`
                          }}>
                            {ma.rolle==="Vorarbeiter" ? "★ " : ""}{ma.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    {p.bemerkung && <div style={{ gridColumn:"1/-1", marginTop:4, padding:"5px 10px", background:"#fef9c3", borderRadius:6, color:"#92400e", fontSize:11 }}>{p.bemerkung}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Abwesend */}
      {abwesend.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><CircleSlash size={15}/>Abwesend</span></div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {abwesend.map(({ ma, eintrag }) => {
              const ef = EINSATZ_FARBEN[eintrag.typ] || EINSATZ_FARBEN["Frei"];
              return (
                <div key={ma.id} style={{ background:ef.bg, border:`1.5px solid ${ef.border}`, borderRadius:8, padding:"7px 12px", fontSize:12 }}>
                  <div style={{ fontWeight:700, color:TH.text }}>{ma.name}</div>
                  <div style={{ marginTop:2 }}><Badge color={ef.badge}>{eintrag.typ}</Badge></div>
                  {eintrag.bemerkung && <div style={{ fontSize:11, color:"#6b7280", marginTop:3 }}>{eintrag.bemerkung}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verfügbar */}
      {frei.length > 0 && (
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Verfügbar / Nicht eingeplant</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {frei.map(({ ma }) => {
              const col = getTeamColor(ma.team);
              return (
                <span key={ma.id} style={{ background:col.light, border:`1px solid ${col.bg}44`, borderRadius:8, padding:"5px 12px", fontSize:12, color:col.text, fontWeight:500 }}>
                  {ma.rolle==="Vorarbeiter" ? "★ " : ""}{ma.name}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WOCHENANSICHT (mit echten Daten) ────────────────────────────────────────
function Wochenansicht({ mitarbeiter, projekte, sonder }) {
  const heute = new Date();
  const [kwYear, setKwYear] = useState(heute.getFullYear());
  const [kw, setKw] = useState(getKW(heute));
  const [filterTeam, setFilterTeam] = useState("Alle");

  const monday = useMemo(() => getMondayOfKW(kwYear, kw), [kwYear, kw]);
  const tage = useMemo(() => Array.from({length:7}, (_,i) => addDays(monday, i)), [monday]);

  const sichtbareTeams = filterTeam==="Alle" ? TEAM_NAMEN_AKTUELL : [filterTeam];
  const sichtbareMA = mitarbeiter.filter(m => sichtbareTeams.includes(m.team));

  function prevKW() { if(kw===1){setKwYear(y=>y-1);setKw(52);}else setKw(k=>k-1); }
  function nextKW() { if(kw===52){setKwYear(y=>y+1);setKw(1);}else setKw(k=>k+1); }

  return (
    <div>
      {/* Navigation */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
        <button onClick={prevKW} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:16, color:TH.text }}>KW {kw} · {kwYear}</div>
          <div style={{ fontSize:11, color:"#9ca3af" }}>{fmtDate(tage[0])} – {fmtDate(tage[6])}</div>
        </div>
        <button onClick={nextKW} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>›</button>
        <select value={filterTeam} onChange={e=>setFilterTeam(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid "+TH.border, fontSize:13, marginLeft:8 }}>
          {["Alle",...TEAM_NAMEN_AKTUELL].map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>{setKw(getKW(heute));setKwYear(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #ea580c", background:"#ffedd5", color:"#ea580c", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12, minWidth:700 }}>
          <thead>
            <tr>
              <th style={{ ...thS(), textAlign:"left", position:"sticky", left:0, background:TH.panel2, zIndex:2, minWidth:140 }}>Mitarbeiter</th>
              {tage.map(d => {
                const isHeuteFn = isoDate(d) === isoDate(new Date());
                const wend = isWeekend(d);
                return (
                  <th key={isoDate(d)} style={{ ...thS(), minWidth:110, background: isHeuteFn ? "#eff6ff" : wend ? "#f9fafb" : "#f9fafb",
                    color: isHeuteFn ? "#ea580c" : wend ? "#d1d5db" : "#6b7280",
                    borderTop: isHeuteFn ? "2px solid #ea580c" : undefined }}>
                    <div style={{ fontWeight:700 }}>{WOCHENTAGE[d.getDay()]}</div>
                    <div style={{ fontSize:13, fontWeight:800, color: isHeuteFn ? "#ea580c" : wend ? "#9ca3af" : "#374151" }}>{fmtDateShort(d)}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sichtbareTeams.map(team => {
              const teamMA = sichtbareMA.filter(m=>m.team===team);
              const col = getTeamColor(team);
              return [
                <tr key={`th-${team}`}>
                  <td colSpan={8} style={{ background:col.bg, color:"#fff", fontWeight:700, fontSize:11, padding:"4px 10px", letterSpacing:0.5 }}>▸ {team}</td>
                </tr>,
                ...teamMA.map(ma => (
                  <tr key={ma.id} style={{ borderBottom:"1px solid "+TH.border }}>
                    <td style={{ ...tdS(), position:"sticky", left:0, background:TH.panel, zIndex:1, borderRight:"2px solid #e5e7eb", borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>
                      <div style={{ fontWeight:ma.rolle==="Vorarbeiter"?700:400, color:ma.rolle==="Vorarbeiter"?col.bg:TH.text }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</div>
                      <div style={{ fontSize:10, color:"#9ca3af" }}>{ma.rolle}</div>
                    </td>
                    {tage.map(d => {
                      const wend = isWeekend(d);
                      const isHeuteFn = isoDate(d)===isoDate(new Date());
                      const proj = getProjektForTeamDate(projekte, team, d);
                      const se = getSonderForMaDate(sonder, ma.id, d);
                      const eintrag = se || (proj ? { typ:"Projekt", projekt:proj } : null);

                      if (wend && !eintrag) return (
                        <td key={isoDate(d)} style={{ ...tdS(), background:"#fafafa", textAlign:"center", color:"#e5e7eb", fontSize:16 }}>—</td>
                      );
                      if (!eintrag) return <td key={isoDate(d)} style={{ ...tdS(), background: isHeuteFn?"#fff7ed":TH.panel }} />;

                      if (eintrag.typ==="Projekt") {
                        const p = eintrag.projekt;
                        const isStart = isoDate(d)===p.dateStart;
                        return (
                          <td key={isoDate(d)} style={{ ...tdS(), background:col.light, padding:"2px 4px" }}>
                            <div style={{ background:col.light, border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:5, padding:"3px 6px", fontSize:10, borderLeft:isStart?`4px solid ${col.bg}`:undefined }}>
                              <div style={{ fontWeight:600, color:col.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:90 }}>{isStart?"▶ ":""}{p.name}</div>
                              {isStart && <div style={{ fontSize:9, color:"#6b7280" }}>{p.ort}</div>}
                            </div>
                          </td>
                        );
                      } else {
                        const ef = EINSATZ_FARBEN[eintrag.typ]||EINSATZ_FARBEN["Frei"];
                        return (
                          <td key={isoDate(d)} style={{ ...tdS(), background:ef.bg, padding:"2px 4px" }}>
                            <div style={{ border:`1.5px solid ${ef.border}`, borderRadius:5, padding:"3px 6px", fontSize:10, textAlign:"center" }}>
                              <span style={{ color:ef.badge, fontWeight:600 }}>{eintrag.typ}</span>
                            </div>
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))
              ];
            })}
          </tbody>
        </table>
      </div>
      {/* Legende */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
        {Object.entries(EINSATZ_FARBEN).map(([k,v]) => (
          <span key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, background:v.bg, border:`1px solid ${v.border}`, borderRadius:6, padding:"2px 8px", color:v.badge }}>● {k}</span>
        ))}
        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, background:"#fafafa", border:"1px solid "+TH.border, borderRadius:6, padding:"2px 8px", color:"#9ca3af" }}>— Wochenende</span>
      </div>
    </div>
  );
}

// ─── MONATSANSICHT ─────────────────────────────────────────────────────────────
function Monatsansicht({ mitarbeiter, projekte, sonder }) {
  const heute = new Date();
  const [monat, setMonat] = useState(heute.getMonth());
  const [jahr, setJahr] = useState(heute.getFullYear());
  const [filterMA, setFilterMA] = useState("Alle");

  function prevM() { if(monat===0){setMonat(11);setJahr(y=>y-1);}else setMonat(m=>m-1); }
  function nextM() { if(monat===11){setMonat(0);setJahr(y=>y+1);}else setMonat(m=>m+1); }

  const ersterTag = new Date(jahr, monat, 1);
  const letzterTag = new Date(jahr, monat+1, 0);
  const tage = Array.from({length:letzterTag.getDate()}, (_,i) => new Date(jahr, monat, i+1));

  const gefilterteMA = filterMA==="Alle" ? mitarbeiter : mitarbeiter.filter(m=>m.name===filterMA);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
        <button onClick={prevM} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ fontWeight:800, fontSize:17, color:TH.text }}>{MONATE[monat]} {jahr}</div>
        <button onClick={nextM} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, cursor:"pointer", fontSize:16 }}>›</button>
        <select value={filterMA} onChange={e=>setFilterMA(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid "+TH.border, fontSize:13 }}>
          <option>Alle</option>
          {mitarbeiter.map(m=><option key={m.id}>{m.name}</option>)}
        </select>
        <button onClick={()=>{setMonat(heute.getMonth());setJahr(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #ea580c", background:"#ffedd5", color:"#ea580c", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%", fontSize:11, minWidth:900 }}>
          <thead>
            <tr>
              <th style={{ ...thS(), textAlign:"left", position:"sticky", left:0, background:TH.panel2, zIndex:2, minWidth:130 }}>Mitarbeiter</th>
              {tage.map(d => {
                const wend = isWeekend(d);
                const isH = isoDate(d)===isoDate(heute);
                return (
                  <th key={d.getDate()} style={{ ...thS(), minWidth:30, padding:"4px 2px", background:isH?"#eff6ff":wend?"#f3f4f6":"#f9fafb",
                    color:isH?"#ea580c":wend?"#d1d5db":"#6b7280", borderTop:isH?"2px solid #ea580c":undefined }}>
                    <div style={{ fontSize:9 }}>{WOCHENTAGE[d.getDay()]}</div>
                    <div style={{ fontWeight:800, fontSize:12 }}>{d.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {gefilterteMA.map(ma => {
              const col = getTeamColor(ma.team);
              return (
                <tr key={ma.id} style={{ borderBottom:"1px solid "+TH.border }}>
                  <td style={{ ...tdS(), position:"sticky", left:0, background:TH.panel, zIndex:1, borderRight:"2px solid #e5e7eb", borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>
                    <div style={{ fontWeight:ma.rolle==="Vorarbeiter"?700:400, color:ma.rolle==="Vorarbeiter"?col.bg:TH.text, fontSize:11 }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</div>
                    <div style={{ fontSize:9, color:"#9ca3af" }}>{ma.team}</div>
                  </td>
                  {tage.map(d => {
                    const wend = isWeekend(d);
                    const proj = getProjektForTeamDate(projekte, ma.team, d);
                    const se = getSonderForMaDate(sonder, ma.id, d);
                    const eintrag = se || (proj?{typ:"Projekt",projekt:proj}:null);
                    const isH = isoDate(d)===isoDate(heute);

                    if (wend && !eintrag) return <td key={d.getDate()} style={{ background:TH.panel2, padding:0 }} />;
                    if (!eintrag) return <td key={d.getDate()} style={{ background:isH?"#fff7ed":TH.panel, padding:0 }} />;

                    if (eintrag.typ==="Projekt") {
                      const isStart = isoDate(d)===eintrag.projekt.dateStart;
                      return (
                        <td key={d.getDate()} style={{ background:col.light, padding:1 }} title={eintrag.projekt.name + " · " + eintrag.projekt.ort}>
                          <div style={{ background:col.bg, height:22, borderRadius:isStart?3:0, borderLeft:isStart?`3px solid ${col.text}`:undefined, opacity:0.85 }} />
                        </td>
                      );
                    } else {
                      const ef = EINSATZ_FARBEN[eintrag.typ]||EINSATZ_FARBEN["Frei"];
                      return (
                        <td key={d.getDate()} style={{ background:ef.bg, padding:1 }} title={eintrag.typ}>
                          <div style={{ background:ef.border, height:22, borderRadius:3, opacity:0.5 }} />
                        </td>
                      );
                    }
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:12 }}>
        {TEAM_NAMEN_AKTUELL.map(t=>{const c=getTeamColor(t);return <span key={t} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, background:c.light, border:`1px solid ${c.bg}44`, borderRadius:6, padding:"2px 8px", color:c.text }}>■ {t}</span>;})}
        {Object.entries(EINSATZ_FARBEN).slice(1).map(([k,v])=><span key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, background:v.bg, border:`1px solid ${v.border}`, borderRadius:6, padding:"2px 8px", color:v.badge }}>● {k}</span>)}
      </div>
    </div>
  );
}

// ─── STUNDENZETTEL ─────────────────────────────────────────────────────────────
function Stundenzettel({ mitarbeiter, projekte, stunden, setStunden, rolle, meinMA }) {
  const istLeitung = rolle==="Admin" || rolle==="Projektleiter" || rolle==="Bauleiter" || rolle==="Vorarbeiter";
  const vorarbeiter = mitarbeiter.filter(m=>m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter");
  const [aktVA, setAktVA] = useState(vorarbeiter[0]?.id||null);
  const [datum, setDatum] = useState(isoDate(new Date()));
  const [entwurf, setEntwurf] = useState({});
  const gespeichert = istLeitung ? (stunden || []) : (stunden || []).filter(e => meinMA && e.maId===meinMA.id);
  const [ansicht, setAnsicht] = useState(istLeitung ? "erfassen" : "uebersicht");

  const va = mitarbeiter.find(m=>m.id===aktVA);
  const teamMA = va ? mitarbeiter.filter(m=>m.team===va.team) : [];
  const d = parseDate(datum);
  const teamProjekt = va ? projekte.find(p=>p.team===va.team && dateInRange(d, p.dateStart, p.dateEnd)) : null;
  const col = va ? getTeamColor(va.team) : { bg:"#6b7280", light:"#f3f4f6", text:"#374151" };

  function setFeld(maId,feld,wert){ setEntwurf(p=>({...p,[maId]:{...(p[maId]||{}),[feld]:wert}})); }
  function getFeld(maId,feld,def=""){ return entwurf[maId]?.[feld]??def; }

  function speichern() {
    const eintraege = teamMA.map(ma => {
      const s = entwurf[ma.id]||{};
      const h = calcStunden(s.start, s.end, Number(s.pause)||0);
      return { id:"H"+Date.now()+"_"+ma.id, maId:ma.id, maName:ma.name, team:va.team, datum, wochentag:WOCHENTAGE_LANG[d.getDay()], kw:getKW(d), projekt:teamProjekt?.name||"–", ...s, arbeitsstunden:h.toFixed(2) };
    }).filter(e=>e.start);
    if (!eintraege.length) return;
    setStunden(prev => [...(prev||[]), ...eintraege]);
    setEntwurf({});
    setAnsicht("uebersicht");
  }

  function excelExport() {
    const sorted = [...gespeichert].sort((a,b)=>(a.datum||"").localeCompare(b.datum||"")||String(a.maName).localeCompare(String(b.maName)));
    const kopf = ["Datum","Wochentag","KW","Mitarbeiter","Team","Projekt","Beginn","Ende","Pause (Min)","Arbeitsstunden","Überstunden","Fahrzeit (h)","Übernachtung","Spesen (€)","Bemerkung"];
    const zelle = v => `"${String(v==null?"":v).replace(/"/g,'""')}"`;
    const zeilen = sorted.map(e=>[
      fmtDate(parseDate(e.datum)), e.wochentag||"", "KW "+(e.kw||""), e.maName||"", e.team||"", e.projekt||"",
      e.start||"", e.end||"", e.pause||"", String(e.arbeitsstunden||"").replace(".",","),
      String(Math.max(0,(Number(e.arbeitsstunden)||0)-8).toFixed(2)).replace(".",","),
      String(e.fahrzeit||"").replace(".",","), e.uebernachtung?"Ja":"Nein",
      String(e.spesen||"").replace(".",","), e.bemerkung||""
    ].map(zelle).join(";"));
    const csv = "\uFEFF" + kopf.map(zelle).join(";") + "\n" + zeilen.join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Baufox_Stundennachweis_"+isoDate(new Date())+".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function pdfExport() {
    const esc = t => String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const sorted = [...gespeichert].sort((a,b)=>(a.datum||"").localeCompare(b.datum||"")||String(a.maName).localeCompare(String(b.maName)));
    const sumStd = sorted.reduce((s,e)=>s+(Number(e.arbeitsstunden)||0),0);
    const sumFahrt = sorted.reduce((s,e)=>s+(Number(e.fahrzeit)||0),0);
    const sumSpesen = sorted.reduce((s,e)=>s+(Number(e.spesen)||0),0);
    const sumUeb = sorted.filter(e=>e.uebernachtung).length;
    const sumUeberstd = sorted.reduce((s,e)=>s+Math.max(0,(Number(e.arbeitsstunden)||0)-8),0);
    const heute = new Date();
    const rows = sorted.map(e=>`<tr>
      <td>${esc(fmtDate(parseDate(e.datum)))}</td><td>${esc(e.wochentag||"")}</td><td class="c">KW ${esc(e.kw)}</td>
      <td><b>${esc(e.maName)}</b></td><td>${esc(e.projekt||"–")}</td>
      <td class="c">${esc(e.start||"–")}</td><td class="c">${esc(e.end||"–")}</td><td class="c">${e.pause?esc(e.pause)+" min":"–"}</td>
      <td class="c"><b>${esc(e.arbeitsstunden)} h</b></td><td class="c">${e.fahrzeit?esc(e.fahrzeit)+" h":"–"}</td>
      <td class="c">${e.uebernachtung?"Ja":"–"}</td><td class="c">${e.spesen?esc(e.spesen)+" €":"–"}</td><td>${esc(e.bemerkung||"")}</td>
    </tr>`).join("");
    const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Baufox – Stundennachweis</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:28px;color:#1e293b;}
      .kopf{display:flex;align-items:center;gap:12px;border-bottom:3px solid #ea580c;padding-bottom:12px;margin-bottom:6px;}
      .logo{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#ea580c,#f97316);display:flex;align-items:center;justify-content:center;font-size:24px;}
      h1{font-size:20px;margin:0;}
      .unter{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0;}
      .meta{font-size:11px;color:#64748b;margin:8px 0 16px;}
      table{border-collapse:collapse;width:100%;font-size:10.5px;}
      th{background:#1e293b;color:#fff;padding:6px 7px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.4px;}
      td{padding:5px 7px;border-bottom:1px solid #e2e8f0;}
      td.c{text-align:center;}
      tr:nth-child(even) td{background:#f8fafc;}
      .summen{margin-top:14px;display:flex;gap:24px;font-size:12px;border-top:2px solid #ea580c;padding-top:10px;}
      .summen b{color:#ea580c;}
      .fuss{margin-top:34px;display:flex;gap:60px;font-size:11px;color:#64748b;}
      .linie{border-top:1px solid #94a3b8;padding-top:4px;width:220px;}
      @media print{ body{margin:10mm;} }
    </style></head><body>
      <div class="kopf"><img src="/icon-192.png" width="44" height="44" style="border-radius:10px"/><div><h1>Baufox – Stundennachweis</h1><p class="unter">Montage-Steuerung</p></div></div>
      <div class="meta">Erstellt am ${esc(fmtDate(heute))} · ${sorted.length} Einträge</div>
      <table><thead><tr><th>Datum</th><th>Tag</th><th>KW</th><th>Mitarbeiter</th><th>Projekt</th><th>Beginn</th><th>Ende</th><th>Pause</th><th>Arbeitsstd.</th><th>Fahrzeit</th><th>Übern.</th><th>Spesen</th><th>Bemerkung</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="summen">
        <span>Arbeitsstunden gesamt: <b>${sumStd.toFixed(2)} h</b></span>
        <span>Überstunden gesamt: <b>${sumUeberstd.toFixed(2)} h</b></span>
        <span>Fahrzeit gesamt: <b>${sumFahrt.toFixed(1)} h</b></span>
        <span>Übernachtungen: <b>${sumUeb}</b></span>
        <span>Spesen gesamt: <b>${sumSpesen.toFixed(2)} €</b></span>
      </div>
      <div class="fuss"><div class="linie">Datum, Unterschrift Vorarbeiter</div><div class="linie">Datum, Unterschrift Auftraggeber</div></div>
      <script>window.onload=function(){window.print();};<\/script>
    </body></html>`;
    oeffneDruck(html);
  }

  const summaryByMA = useMemo(()=>{
    const map={};
    gespeichert.forEach(e=>{
      if(!map[e.maId]) map[e.maId]={name:e.maName,stunden:0,fahrzeit:0,uebernachtungen:0,spesen:0,ueberstunden:0,eintraege:[]};
      map[e.maId].stunden+=parseFloat(e.arbeitsstunden||0);
      map[e.maId].fahrzeit+=parseFloat(e.fahrzeit||0);
      map[e.maId].uebernachtungen+=e.uebernachtung?1:0;
      map[e.maId].spesen+=parseFloat(e.spesen||0);
      map[e.maId].ueberstunden+=Math.max(0,(parseFloat(e.arbeitsstunden)||0)-8);
      map[e.maId].eintraege.push(e);
    });
    return map;
  },[gespeichert]);

  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, alignItems:"flex-end" }}>
        {istLeitung ? (
          <>
            <div>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:3, textTransform:"uppercase" }}>Vorarbeiter</div>
              <select value={aktVA||""} onChange={e=>{setAktVA(Number(e.target.value));setEntwurf({});}} style={{ ...inpS(), width:210, fontWeight:700 }}>
                {vorarbeiter.map(v=><option key={v.id} value={v.id}>{v.name} ({v.team})</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:3, textTransform:"uppercase" }}>Datum</div>
              <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{ ...inpS(), width:160 }} />
            </div>
            {datum && (
              <div style={{ background:col.light, border:`1.5px solid ${col.bg}44`, borderRadius:8, padding:"7px 12px", fontSize:12 }}>
                <span style={{ fontWeight:700, color:col.bg }}>{WOCHENTAGE_LANG[d.getDay()]}</span>
                <span style={{ color:"#6b7280", marginLeft:6 }}>{fmtDate(d)} · KW {getKW(d)}</span>
              </div>
            )}
          </>
        ) : (
          <div style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"8px 14px", fontSize:13, color:"#92400e" }}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6}}><HardHat size={14}/>Deine persönliche Stundenübersicht</span>{meinMA?` – ${meinMA.name}`:""}. Stunden trägt dein Vorarbeiter ein.
          </div>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          {istLeitung && <button onClick={()=>setAnsicht("erfassen")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, background:ansicht==="erfassen"?col.bg:TH.panel, color:ansicht==="erfassen"?"#fff":TH.text, fontWeight:600 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={13}/>Erfassen</span></button>}
          <button onClick={()=>setAnsicht("uebersicht")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, background:ansicht==="uebersicht"?col.bg:TH.panel, color:ansicht==="uebersicht"?"#fff":TH.text, fontWeight:600 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><List size={13}/>Übersicht ({gespeichert.length})</span></button>
        </div>
      </div>

      {va && ansicht==="erfassen" && (
        <div style={{ background:col.light, border:`1.5px solid ${col.bg}44`, borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", gap:20, flexWrap:"wrap", fontSize:12 }}>
          <Info label="Vorarbeiter" value={`★ ${va.name}`} />
          <Info label="Team" value={va.team} />
          <Info label="Projekt" value={teamProjekt?.name||"kein aktives Projekt für dieses Datum"} />
          <Info label="Ort" value={teamProjekt?.ort||"–"} />
        </div>
      )}

      {ansicht==="erfassen" && va && (
        <>
          <div style={{ marginBottom:10 }}>
            <button onClick={()=>{
              const src = entwurf[aktVA];
              if (!src || !src.start) { alert("Trag zuerst deine eigenen Zeiten (Zeile mit ★) ein – dann übernimmt dieser Knopf sie für das ganze Team."); return; }
              setEntwurf(p=>{ const n={...p}; teamMA.forEach(ma=>{ n[ma.id]={...src}; }); return n; });
            }} style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:12 }}>
              ⬇ Meine Zeiten für ganzes Team übernehmen
            </button>
            <span style={{ fontSize:11, color:"#9ca3af", marginLeft:10 }}>Danach kannst du Einzelne noch anpassen.</span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead>
                <tr>{["Mitarbeiter","Rolle","Beginn","Ende","Pause (Min)","Arbeitsstd.","Fahrzeit (h)","Übernachtung","Spesen (€)","Bemerkung"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {teamMA.map(ma=>{
                  const start=getFeld(ma.id,"start"),end=getFeld(ma.id,"end"),pause=getFeld(ma.id,"pause",0);
                  const netto=calcStunden(start,end,Number(pause));
                  const isVA=ma.rolle==="Vorarbeiter";
                  return (
                    <tr key={ma.id} style={{ borderBottom:"1px solid "+TH.border, background:isVA?col.light:TH.panel }}>
                      <td style={{ ...tdS(), fontWeight:isVA?700:400, borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>{isVA?"★ ":""}{ma.name}</td>
                      <td style={tdS()}><Badge color={col.bg}>{ma.rolle}</Badge></td>
                      <td style={{ ...tdS(), minWidth:90 }}><input type="time" value={start} onChange={e=>setFeld(ma.id,"start",e.target.value)} style={inpS()} /></td>
                      <td style={{ ...tdS(), minWidth:90 }}><input type="time" value={end} onChange={e=>setFeld(ma.id,"end",e.target.value)} style={inpS()} /></td>
                      <td style={{ ...tdS(), minWidth:80 }}><input type="number" min={0} max={120} value={pause} onChange={e=>setFeld(ma.id,"pause",e.target.value)} style={inpS()} placeholder="30" /></td>
                      <td style={{ ...tdS(), textAlign:"center", fontWeight:700, color:netto>0?col.text:"#9ca3af" }}>{netto>0?netto.toFixed(2)+" h":"–"}</td>
                      <td style={{ ...tdS(), minWidth:80 }}><input type="number" min={0} step={0.5} value={getFeld(ma.id,"fahrzeit","")} onChange={e=>setFeld(ma.id,"fahrzeit",e.target.value)} style={inpS()} placeholder="0" /></td>
                      <td style={{ ...tdS(), textAlign:"center" }}><input type="checkbox" checked={!!getFeld(ma.id,"uebernachtung",false)} onChange={e=>setFeld(ma.id,"uebernachtung",e.target.checked)} style={{ width:18, height:18, cursor:"pointer" }} /></td>
                      <td style={{ ...tdS(), minWidth:80 }}><input type="number" min={0} step={0.5} value={getFeld(ma.id,"spesen","")} onChange={e=>setFeld(ma.id,"spesen",e.target.value)} style={inpS()} placeholder="0" /></td>
                      <td style={{ ...tdS(), minWidth:140 }}><input type="text" value={getFeld(ma.id,"bemerkung","")} onChange={e=>setFeld(ma.id,"bemerkung",e.target.value)} style={inpS()} placeholder="z.B. Überstunden…" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:12, background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:8, padding:"10px 14px", display:"flex", gap:24, flexWrap:"wrap", fontSize:12 }}>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Gesamt heute </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.reduce((s,ma)=>s+calcStunden(getFeld(ma.id,"start"),getFeld(ma.id,"end"),Number(getFeld(ma.id,"pause",0))),0).toFixed(2)} h</span></div>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Eingetragen </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.filter(ma=>getFeld(ma.id,"start")).length}/{teamMA.length}</span></div>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <button onClick={speichern} style={{ padding:"9px 24px", borderRadius:8, background:col.bg, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
            <button onClick={()=>setEntwurf({})} style={{ padding:"9px 16px", borderRadius:8, background:TH.panel2, color:TH.text, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13 }}>✕ Reset</button>
          </div>
        </>
      )}

      {ansicht==="uebersicht" && (
        <div>
          {!gespeichert.length ? (
            <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:32, textAlign:"center", color:"#9ca3af" }}>Noch keine Stundenzettel gespeichert</div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:12 }}>
                <button onClick={excelExport} style={{ padding:"9px 18px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileSpreadsheet size={14}/>Excel (CSV)</span></button>
                <button onClick={pdfExport} style={{ padding:"9px 18px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileDown size={14}/>Als PDF exportieren</span></button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:18 }}>
                {Object.values(summaryByMA).map(s=>{
                  const ma=mitarbeiter.find(m=>m.name===s.name);
                  const c=ma?getTeamColor(ma.team):{bg:"#6b7280",light:"#f3f4f6",text:"#374151"};
                  return (
                    <div key={s.name} style={{ border:`1.5px solid ${c.bg}`, borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
                      <div style={{ background:c.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}>{ma?.rolle==="Vorarbeiter"?"★ ":""}{s.name}</div>
                      <div style={{ padding:"10px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 12px", fontSize:12 }}>
                        <Info label="Arbeitsstunden" value={s.stunden.toFixed(2)+" h"} />
                        <Info label="Überstunden" value={s.ueberstunden>0 ? <span style={{color:"#ea580c",fontWeight:700}}>{s.ueberstunden.toFixed(2)+" h"}</span> : "0 h"} />
                        <Info label="Fahrzeit" value={s.fahrzeit.toFixed(1)+" h"} />
                        <Info label="Übernachtungen" value={s.uebernachtungen} />
                        <Info label="Spesen" value={s.spesen.toFixed(2)+" €"} />
                        <Info label="Tage erfasst" value={s.eintraege.length} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                  <thead><tr>{["Datum","Wochentag","KW","Mitarbeiter","Projekt","Beginn","Ende","Pause","Arbeitsstd.","Fahrzeit","Übern.","Spesen","Bemerkung"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...gespeichert].reverse().map((e,i)=>{
                      const ma=mitarbeiter.find(m=>m.id===e.maId);
                      const c=ma?getTeamColor(ma.team):{bg:"#6b7280"};
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid "+TH.border }}>
                          <td style={tdS()}>{fmtDate(parseDate(e.datum))}</td>
                          <td style={tdS()}>{e.wochentag}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>KW {e.kw}</td>
                          <td style={{ ...tdS(), borderLeft:`4px solid ${c.bg}`, fontWeight:ma?.rolle==="Vorarbeiter"?700:400 }}>{ma?.rolle==="Vorarbeiter"?"★ ":""}{e.maName}</td>
                          <td style={tdS()}>{e.projekt}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.start||"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.end||"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.pause?e.pause+"min":"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center", fontWeight:700, color:c.bg }}>{e.arbeitsstunden} h</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.fahrzeit?e.fahrzeit+" h":"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.uebernachtung?"✅":"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}>{e.spesen?e.spesen+" €":"–"}</td>
                          <td style={tdS()}>{e.bemerkung||"–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Andere Tabs (unverändert) ────────────────────────────────────────────────
function ProjektUebersicht({ projekte, fahrzeuge, mitarbeiter }) {
  const maName = id => (mitarbeiter||[]).find(m=>m.id===id)?.name || null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {projekte.map(p=>{
        const col=getTeamColor(p.team), fzg=fahrzeuge.find(f=>f.id===p.fzg), sc=STATUS_FARBEN[p.status]||"#6b7280";
        return (
          <div key={p.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d", boxShadow:"0 1px 4px #0001" }}>
            <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:700, fontSize:14 }}>{p.name}{p.nummer?` · ${p.nummer}`:""}</span>
              <span style={{ background:sc+"33", color:sc==="#374151"?"#fff":sc, border:`1px solid ${sc}`, borderRadius:99, padding:"1px 10px", fontSize:11, fontWeight:700 }}>{p.status}</span>
            </div>
            <div style={{ padding:"10px 14px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 20px", fontSize:12 }}>
              <Info label="Kunde" value={p.kunde} />
              <Info label="Ort" value={p.ort} />
              <Info label="Start" value={fmtDate(parseDate(p.dateStart))} />
              <Info label="Ende" value={fmtDate(parseDate(p.dateEnd))} />
              <Info label="Team" value={p.team} />
              <Info label="Vorarbeiter" value={p.vorarbeiter||"–"} />
              {p.projektleiterId && <Info label="Projektleiter" value={maName(p.projektleiterId)||"–"} />}
              {p.bauleiterId && <Info label="Bauleiter" value={maName(p.bauleiterId)||"–"} />}
              {p.vertretungId && <Info label="Vertretung" value={<span style={{color:"#ea580c",fontWeight:700}}>{maName(p.vertretungId)||"–"}</span>} />}
              <Info label="Fahrzeug" value={fzg?`${fzg.kz} (${fzg.typ})`:"–"} />
              {p.ansprechpartner && <Info label="Ansprechpartner" value={p.ansprechpartner} />}
              {p.auftragssumme && <Info label="Auftragssumme" value={Number(p.auftragssumme).toLocaleString("de-DE")+" €"} />}
              {p.planStunden && <Info label="Geplante Stunden" value={p.planStunden+" h"} />}
              {p.beschreibung && <div style={{ gridColumn:"1/-1", marginTop:2, fontSize:11, color:"#6b7280" }}>{p.beschreibung}</div>}
              {p.bemerkung&&<div style={{ gridColumn:"1/-1", marginTop:4, padding:"6px 10px", background:"#fef9c3", borderRadius:6, color:"#92400e", fontSize:11 }}>{p.bemerkung}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
function MitarbeiterUebersicht({ mitarbeiter, projekte }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
        <thead><tr>{["Name","Rolle","Team","Telefon","FS","Stapler","Schweißer","Urlaub","Krank","Aktuell"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
        <tbody>
          {mitarbeiter.map(ma=>{
            const col=getTeamColor(ma.team);
            const aktProj=projekte.find(p=>p.team===ma.team&&p.status==="laufend");
            return (
              <tr key={ma.id} style={{ borderBottom:"1px solid "+TH.border }}>
                <td style={{ ...tdS(), fontWeight:ma.rolle==="Vorarbeiter"?700:400, borderLeft:`4px solid ${col.bg}` }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</td>
                <td style={tdS()}><Badge color={col.bg}>{ma.rolle}</Badge></td>
                <td style={tdS()}>{ma.team}</td>
                <td style={tdS()}>{ma.tel}</td>
                <td style={{ ...tdS(), textAlign:"center" }}>{ma.fuehrerschein?"✅":"❌"}</td>
                <td style={{ ...tdS(), textAlign:"center" }}>{ma.stapler?"✅":"❌"}</td>
                <td style={{ ...tdS(), textAlign:"center" }}>{ma.schweisser?"✅":"❌"}</td>
                <td style={{ ...tdS(), textAlign:"center" }}>{ma.urlaub}d</td>
                <td style={{ ...tdS(), textAlign:"center", color:ma.krank>3?"#dc2626":"#374151" }}>{ma.krank}d</td>
                <td style={tdS()}>{aktProj?<Badge color={col.bg}>{aktProj.name}</Badge>:<span style={{ color:"#9ca3af" }}>–</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function FahrzeugUebersicht({ fahrzeuge, projekte }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
      {fahrzeuge.map(f=>{
        const col=getTeamColor(f.team);
        const aktProj=projekte.find(p=>p.fzg===f.id&&p.status==="laufend");
        return (
          <div key={f.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
            <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Truck size={13}/>{f.kz}</span></div>
            <div style={{ padding:"10px 12px", fontSize:12, display:"flex", flexDirection:"column", gap:5 }}>
              <Info label="Typ" value={f.typ} />
              <Info label="Team" value={f.team} />
              <Info label="TÜV" value={f.tuev} />
              <Info label="Einsatz" value={aktProj?aktProj.name:"–"} />
              <div style={{ marginTop:4 }}><Badge color={!aktProj?"#16a34a":"#dc2626"}>{!aktProj?"✓ Verfügbar":"✗ Im Einsatz"}</Badge></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ─── UNTERKÜNFTE-ÜBERSICHT ────────────────────────────────────────────────────
function UnterkunftUebersicht({ unterkuenfte, projekte }) {
  if (!unterkuenfte || unterkuenfte.length===0) {
    return <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Unterkünfte angelegt. Lege welche unter „Verwaltung → Unterkünfte" an.</div>;
  }
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
      {unterkuenfte.map(u=>{
        const proj = projekte.find(p=>p.id===u.projektId);
        const col = proj ? getTeamColor(proj.team) : { bg:"#0f766e", light:"#ccfbf1", text:"#0d9488" };
        return (
          <div key={u.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
            <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><BedDouble size={14}/>{u.name||"Unterkunft"}</span></div>
            <div style={{ padding:"10px 12px", fontSize:12, display:"flex", flexDirection:"column", gap:5 }}>
              <Info label="Adresse" value={u.adresse||"–"} />
              <Info label="Ansprechpartner" value={u.ansprechpartner||"–"} />
              <Info label="Telefon" value={u.tel||"–"} />
              <Info label="Check-in" value={u.checkin?fmtDate(parseDate(u.checkin)):"–"} />
              <Info label="Check-out" value={u.checkout?fmtDate(parseDate(u.checkout)):"–"} />
              <Info label="Zimmer" value={u.zimmer||"–"} />
              <Info label="Projekt" value={proj?proj.name:"–"} />
              <Info label="Kosten/Nacht" value={u.kostenNacht?u.kostenNacht+" €":"–"} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ─── URLAUBS-/FREI-ANTRÄGE ────────────────────────────────────────────────────
function Antraege({ mitarbeiter, antraege, setAntraege, setSonder }) {
  const [maId, setMaId] = useState(mitarbeiter[0]?.id || null);
  const [typ, setTyp] = useState("Urlaub");
  const [von, setVon] = useState(isoDate(new Date()));
  const [bis, setBis] = useState(isoDate(new Date()));
  const [grund, setGrund] = useState("");
  const [seite, setSeite] = useState("antrag"); // antrag | freigabe

  const ma = mitarbeiter.find(m => m.id === maId);
  const col = ma ? getTeamColor(ma.team) : { bg:"#6b7280", light:"#f3f4f6", text:"#374151" };

  function tageAnzahl(a, b) {
    const d1 = parseDate(a), d2 = parseDate(b);
    return Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
  }

  function einreichen() {
    if (!ma || !von || !bis || parseDate(bis) < parseDate(von)) return;
    const neu = {
      id: "A" + Date.now(),
      ma: ma.id, maName: ma.name, team: ma.team,
      typ, dateStart: von, dateEnd: bis, grund,
      status: "offen",
      eingereicht: isoDate(new Date()),
    };
    setAntraege(prev => [neu, ...prev]);
    setGrund("");
    setSeite("freigabe");
  }

  function entscheiden(antrag, neuStatus) {
    setAntraege(prev => prev.map(a => a.id === antrag.id ? { ...a, status: neuStatus } : a));
    // Bei Genehmigung: als Sondereinsatz übernehmen, damit er in allen Ansichten erscheint
    if (neuStatus === "genehmigt") {
      setSonder(prev => [...prev, {
        id: "S" + antrag.id, ma: antrag.ma, typ: antrag.typ,
        dateStart: antrag.dateStart, dateEnd: antrag.dateEnd,
        bemerkung: antrag.grund || "Genehmigter Antrag",
      }]);
    }
  }

  const offen = antraege.filter(a => a.status === "offen");
  const erledigt = antraege.filter(a => a.status !== "offen");
  const statusFarbe = { offen:"#d97706", genehmigt:"#16a34a", abgelehnt:"#dc2626" };

  return (
    <div>
      {/* Umschalter */}
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button onClick={()=>setSeite("antrag")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="antrag"?"#ea580c":TH.panel, color:seite==="antrag"?"#fff":TH.text }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={13}/>Antrag stellen</span></button>
        <button onClick={()=>setSeite("freigabe")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="freigabe"?"#ea580c":TH.panel, color:seite==="freigabe"?"#fff":TH.text }}>
          ✅ Freigabe {offen.length>0 && <span style={{ background:"#dc2626", color:"#fff", borderRadius:99, padding:"0 7px", fontSize:11, marginLeft:4 }}>{offen.length}</span>}
        </button>
      </div>

      {seite === "antrag" && (
        <div style={{ maxWidth:520 }}>
          <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:"18px 20px" }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:TH.text }}>Neuer Antrag auf freie Zeit</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Mitarbeiter</div>
              <select value={maId||""} onChange={e=>setMaId(Number(e.target.value))} style={{ ...inpS(), fontWeight:600 }}>
                {mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name} ({m.team})</option>)}
              </select>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Art</div>
              <div style={{ display:"flex", gap:8 }}>
                {["Urlaub","Frei"].map(t=>{
                  const ef = EINSATZ_FARBEN[t];
                  return (
                    <button key={t} onClick={()=>setTyp(t)} style={{
                      flex:1, padding:"8px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600,
                      border:`1.5px solid ${typ===t?ef.border:"#e5e7eb"}`,
                      background:typ===t?ef.bg:TH.panel, color:typ===t?ef.badge:TH.textMut
                    }}>{t}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display:"flex", gap:12, marginBottom:14 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Von</div>
                <input type="date" value={von} onChange={e=>setVon(e.target.value)} style={inpS()} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Bis</div>
                <input type="date" value={bis} onChange={e=>setBis(e.target.value)} style={inpS()} />
              </div>
            </div>

            {von && bis && parseDate(bis) >= parseDate(von) && (
              <div style={{ background:col.light, border:`1px solid ${col.bg}33`, borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:col.text }}>
                {fmtDate(parseDate(von))} – {fmtDate(parseDate(bis))} · <strong>{tageAnzahl(von,bis)} Tage</strong>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Grund (optional)</div>
              <input type="text" value={grund} onChange={e=>setGrund(e.target.value)} style={inpS()} placeholder="z.B. Familienurlaub, Arzttermin…" />
            </div>

            <button onClick={einreichen} style={{ width:"100%", padding:"11px", borderRadius:8, background:"#1d4ed8", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:14 }}>
              Antrag einreichen
            </button>
          </div>
        </div>
      )}

      {seite === "freigabe" && (
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
            Offene Anträge {offen.length>0 && `(${offen.length})`}
          </div>
          {offen.length === 0 ? (
            <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"14px 16px", color:"#166534", fontSize:13, marginBottom:24 }}>✅ Keine offenen Anträge</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
              {offen.map(a => {
                const c = getTeamColor(a.team);
                const ef = EINSATZ_FARBEN[a.typ] || EINSATZ_FARBEN["Frei"];
                return (
                  <div key={a.id} style={{ border:`1.5px solid ${ef.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d", boxShadow:"0 1px 4px #0001" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:ef.bg }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14, color:TH.text }}>{a.maName}</span>
                        <span style={{ marginLeft:8 }}><Badge color={c.bg}>{a.team}</Badge></span>
                        <span style={{ marginLeft:6 }}><Badge color={ef.badge}>{a.typ}</Badge></span>
                      </div>
                    </div>
                    <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                      <div style={{ fontSize:13 }}>
                        <div style={{ fontWeight:600, color:TH.text }}>{fmtDate(parseDate(a.dateStart))} – {fmtDate(parseDate(a.dateEnd))}</div>
                        {a.grund && <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>{a.grund}</div>}
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>Eingereicht: {fmtDate(parseDate(a.eingereicht))}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>entscheiden(a,"genehmigt")} style={{ padding:"8px 16px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>✓ Genehmigen</button>
                        <button onClick={()=>entscheiden(a,"abgelehnt")} style={{ padding:"8px 16px", borderRadius:8, background:TH.panel, color:"#dc2626", border:"1.5px solid #dc2626", cursor:"pointer", fontWeight:700, fontSize:13 }}>✕ Ablehnen</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {erledigt.length > 0 && (
            <>
              <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Bearbeitet</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                  <thead><tr>{["Mitarbeiter","Team","Art","Zeitraum","Grund","Status"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
                  <tbody>
                    {erledigt.map(a=>{
                      const c=getTeamColor(a.team);
                      return (
                        <tr key={a.id} style={{ borderBottom:"1px solid "+TH.border }}>
                          <td style={{ ...tdS(), borderLeft:`4px solid ${c.bg}`, fontWeight:600 }}>{a.maName}</td>
                          <td style={tdS()}>{a.team}</td>
                          <td style={tdS()}><Badge color={EINSATZ_FARBEN[a.typ]?.badge||"#6b7280"}>{a.typ}</Badge></td>
                          <td style={tdS()}>{fmtDate(parseDate(a.dateStart))} – {fmtDate(parseDate(a.dateEnd))}</td>
                          <td style={tdS()}>{a.grund||"–"}</td>
                          <td style={{ ...tdS(), textAlign:"center" }}><Badge color={statusFarbe[a.status]}>{a.status}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ titel, onClose, children, farbe="#ea580c" }) {
  return (
    <div className="modal-hintergrund" onClick={onClose} style={{ position:"fixed", inset:0, background:"#0007", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px", zIndex:100, overflowY:"auto" }}>
      <div className="modal-fenster" onClick={e=>e.stopPropagation()} style={{ background:TH.panel, borderRadius:14, width:"100%", maxWidth:520, boxShadow:"0 10px 40px #0004" }}>
        <div style={{ background:farbe, color:"#fff", padding:"12px 18px", borderRadius:"14px 14px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:700, fontSize:15 }}>{titel}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:"18px 20px" }}>{children}</div>
      </div>
    </div>
  );
}
function Feld({ label, children }) {
  return (
    <div style={{ marginBottom:13 }}>
      <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
      {children}
    </div>
  );
}
function btnPrimary(farbe="#ea580c") { return { padding:"10px 20px", borderRadius:8, background:farbe, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }; }
const btnGhost = () => ({ padding:"10px 16px", borderRadius:8, background:TH.panel2, color:TH.text, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13 });

// Öffnet eine Druck-/PDF-Seite in neuem Tab – mit einheitlichem „✕ Schließen"-Knopf (beim Drucken ausgeblendet)
function oeffneDruck(html) {
  const w = window.open("", "_blank");
  if (!w) { alert("Bitte Pop-ups für diese Seite erlauben, dann öffnet sich die Druckansicht (dort „Als PDF speichern\")."); return; }
  w.document.write(html);
  w.document.close();
  try {
    const stil = w.document.createElement("style");
    stil.textContent = "#bf-leiste{position:fixed;top:10px;right:12px;z-index:99999;display:flex;gap:8px}#bf-leiste button{font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;padding:8px 14px;border-radius:8px;border:none;cursor:pointer;color:#fff}#bf-druck{background:#2e3192}#bf-zu{background:#64748b}@media print{#bf-leiste{display:none}}";
    w.document.head.appendChild(stil);
    const bar = w.document.createElement("div");
    bar.id = "bf-leiste";
    bar.innerHTML = '<button id="bf-druck" type="button">Drucken</button><button id="bf-zu" type="button">✕ Schließen</button>';
    w.document.body.appendChild(bar);
    w.document.getElementById("bf-druck").onclick = function(){ w.print(); };
    w.document.getElementById("bf-zu").onclick = function(){ w.close(); };
  } catch (e) { /* Knopf ist optional – Druck funktioniert auch ohne */ }
}

// ─── VERWALTUNG (Stammdaten anlegen/bearbeiten/löschen) ───────────────────────
function Verwaltung({ projekte, setProjekte, mitarbeiter, setMitarbeiter, fahrzeuge, setFahrzeuge, unterkuenfte, setUnterkuenfte, werkzeuge, setWerkzeuge, sonder, antraege, stunden, berichte, teams, setTeams, onReset }) {

  function backupHerunterladen() {
    const backup = {
      app: "Baufox",
      exportiertAm: new Date().toISOString(),
      projekte, mitarbeiter, fahrzeuge, unterkuenfte, werkzeuge,
      sonder, antraege, stunden, berichte
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Baufox_Backup_" + isoDate(new Date()) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const [sub, setSub] = useState("projekte");
  const [modal, setModal] = useState(null); // { art, data }

  const teamNamen = TEAM_NAMEN_AKTUELL;
  const vorarbeiterNamen = mitarbeiter.filter(m=>m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter").map(m=>m.name);

  function neueId(prefix, liste) {
    let n = 1;
    while (liste.some(x => x.id === prefix+n)) n++;
    return prefix+n;
  }

  // ── Projekt-Formular ──
  function ProjektForm({ data }) {
    const [f, setF] = useState(data || { id:"", name:"", nummer:"", kunde:"", auftraggeber:"", ansprechpartner:"", apTel:"", apEmail:"", ort:"", land:"", dateStart:isoDate(new Date()), dateEnd:isoDate(new Date()), team:teamNamen[0], status:"geplant", fzg:"", vorarbeiter:"", auftragssumme:"", planStunden:"", planKosten:"", mindestlohn:"", beschreibung:"", bemerkung:"" });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.name) return;
      if (data) setProjekte(prev => prev.map(p => p.id===data.id ? f : p));
      else setProjekte(prev => [...prev, { ...f, id:neueId("P",prev) }]);
      setModal(null);
    }
    const col = getTeamColor(f.team);
    return (
      <Modal titel={data?"Projekt bearbeiten":"Neues Projekt"} onClose={()=>setModal(null)} farbe={col.bg}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:2 }}><Feld label="Projektname"><input style={inpS()} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="z.B. Kranbahn Halle B" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Projektnummer"><input style={inpS()} value={f.nummer||""} onChange={e=>set("nummer",e.target.value)} placeholder="P-2026-001" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Kunde"><input style={inpS()} value={f.kunde} onChange={e=>set("kunde",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Auftraggeber"><input style={inpS()} value={f.auftraggeber||""} onChange={e=>set("auftraggeber",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Ansprechpartner Kunde"><input style={inpS()} value={f.ansprechpartner||""} onChange={e=>set("ansprechpartner",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Telefon AP"><input style={inpS()} value={f.apTel||""} onChange={e=>set("apTel",e.target.value)} /></Feld></div>
        </div>
        <Feld label="E-Mail Ansprechpartner"><input style={inpS()} value={f.apEmail||""} onChange={e=>set("apEmail",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Ort"><input style={inpS()} value={f.ort} onChange={e=>set("ort",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Land"><input style={inpS()} value={f.land||""} onChange={e=>set("land",e.target.value)} placeholder="Deutschland" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Mindestlohn vor Ort (€/h)"><input type="number" style={inpS()} value={f.mindestlohn||""} onChange={e=>set("mindestlohn",e.target.value)} placeholder="z.B. 24" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Start"><input type="date" style={inpS()} value={f.dateStart} onChange={e=>set("dateStart",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Ende"><input type="date" style={inpS()} value={f.dateEnd} onChange={e=>set("dateEnd",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Status"><select style={inpS()} value={f.status} onChange={e=>set("status",e.target.value)}>{Object.keys(STATUS_FARBEN).map(s=><option key={s}>{s}</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Vorarbeiter"><select style={inpS()} value={f.vorarbeiter} onChange={e=>set("vorarbeiter",e.target.value)}><option value="">–</option>{vorarbeiterNamen.map(v=><option key={v}>{v}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Fahrzeug"><select style={inpS()} value={f.fzg} onChange={e=>set("fzg",e.target.value)}><option value="">–</option>{fahrzeuge.map(fz=><option key={fz.id} value={fz.id}>{fz.kz}</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Projektleiter"><select style={inpS()} value={f.projektleiterId||""} onChange={e=>set("projektleiterId",e.target.value?Number(e.target.value):"")}><option value="">–</option>{mitarbeiter.filter(m=>m.rolle==="Projektleiter").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Bauleiter"><select style={inpS()} value={f.bauleiterId||""} onChange={e=>set("bauleiterId",e.target.value?Number(e.target.value):"")}><option value="">–</option>{mitarbeiter.filter(m=>m.rolle==="Bauleiter").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Vertretung (bei Ausfall)"><select style={inpS()} value={f.vertretungId||""} onChange={e=>set("vertretungId",e.target.value?Number(e.target.value):"")}><option value="">–</option>{mitarbeiter.filter(m=>m.rolle==="Projektleiter"||m.rolle==="Bauleiter").map(m=><option key={m.id} value={m.id}>{m.name} ({m.rolle})</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Auftragssumme (€)"><input type="number" style={inpS()} value={f.auftragssumme||""} onChange={e=>set("auftragssumme",e.target.value)} placeholder="0" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Geplante Stunden"><input type="number" style={inpS()} value={f.planStunden||""} onChange={e=>set("planStunden",e.target.value)} placeholder="0" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Geplante Kosten (€)"><input type="number" style={inpS()} value={f.planKosten||""} onChange={e=>set("planKosten",e.target.value)} placeholder="0" /></Feld></div>
        </div>
        <Feld label="Beschreibung der Arbeiten"><input style={inpS()} value={f.beschreibung||""} onChange={e=>set("beschreibung",e.target.value)} placeholder="Kurzbeschreibung" /></Feld>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} placeholder="z.B. Anreise Sonntag, Hotel gebucht" /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
          <button onClick={()=>setModal(null)} style={btnGhost()}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  // ── Mitarbeiter-Formular ──
  function MitarbeiterForm({ data }) {
    const [f, setF] = useState(data || { id:null, name:"", rolle:"Monteur", team:teamNamen[0], tel:"", email:"", stundensatz:"", fuehrerschein:false, stapler:false, schweisser:false, urlaub:0, krank:0 });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.name) return;
      const sauber = { ...f, email:(f.email||"").trim().toLowerCase(), stundensatz: f.stundensatz!=null && f.stundensatz!=="" ? Number(f.stundensatz) : null, urlaub: Number(f.urlaub)||0, krank: Number(f.krank)||0, fuehrerschein: !!f.fuehrerschein, stapler: !!f.stapler, schweisser: !!f.schweisser };
      if (data) setMitarbeiter(prev => prev.map(m => m.id===data.id ? sauber : m));
      else setMitarbeiter(prev => [...prev, { ...sauber, id: null }]);
      setModal(null);
    }
    const col = getTeamColor(f.team);
    return (
      <Modal titel={data?"Mitarbeiter bearbeiten":"Neuer Mitarbeiter"} onClose={()=>setModal(null)} farbe={col.bg}>
        <Feld label="Name"><input style={inpS()} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Vor- und Nachname" /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Rolle"><select style={inpS()} value={f.rolle} onChange={e=>set("rolle",e.target.value)}><option>Monteur</option><option>Vorarbeiter</option><option>Bauleiter</option><option>Projektleiter</option></select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
        </div>
        <Feld label="Login-E-Mail (für App-Zugang)"><input style={inpS()} value={f.email||""} onChange={e=>set("email",e.target.value)} placeholder="z.B. max@firma.de – muss zum Supabase-Login passen" /></Feld>
        <Feld label="Telefon"><input style={inpS()} value={f.tel} onChange={e=>set("tel",e.target.value)} placeholder="0171-…" /></Feld>
        <Feld label="Stundensatz (€/h, intern für Kostenrechnung)"><input type="number" style={inpS()} value={f.stundensatz||""} onChange={e=>set("stundensatz",e.target.value)} placeholder="z.B. 45" /></Feld>
        <Feld label="Qualifikationen">
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:4 }}>
            {[["fuehrerschein","Führerschein"],["stapler","Staplerschein"],["schweisser","Schweißer"]].map(([k,lbl])=>(
              <label key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer" }}>
                <input type="checkbox" checked={!!f[k]} onChange={e=>set(k,e.target.checked)} style={{ width:17, height:17 }} />{lbl}
              </label>
            ))}
          </div>
        </Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Urlaubstage"><input type="number" style={inpS()} value={f.urlaub} onChange={e=>set("urlaub",Number(e.target.value))} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Krankheitstage"><input type="number" style={inpS()} value={f.krank} onChange={e=>set("krank",Number(e.target.value))} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
          <button onClick={()=>setModal(null)} style={btnGhost()}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  // ── Fahrzeug-Formular ──
  function FahrzeugForm({ data }) {
    const [f, setF] = useState(data || { id:"", kz:"", typ:"Sprinter", team:teamNamen[0], tuev:"" });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.kz) return;
      if (data) setFahrzeuge(prev => prev.map(x => x.id===data.id ? f : x));
      else setFahrzeuge(prev => [...prev, { ...f, id:neueId("F",prev) }]);
      setModal(null);
    }
    const col = getTeamColor(f.team);
    return (
      <Modal titel={data?"Fahrzeug bearbeiten":"Neues Fahrzeug"} onClose={()=>setModal(null)} farbe={col.bg}>
        <Feld label="Kennzeichen"><input style={inpS()} value={f.kz} onChange={e=>set("kz",e.target.value)} placeholder="MK-XX 000" /></Feld>
        <Feld label="Fahrzeugtyp"><input style={inpS()} value={f.typ} onChange={e=>set("typ",e.target.value)} placeholder="Sprinter, Pritsche…" /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="TÜV (JJJJ-MM)"><input style={inpS()} value={f.tuev} onChange={e=>set("tuev",e.target.value)} placeholder="2026-08" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
          <button onClick={()=>setModal(null)} style={btnGhost()}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  // ── Unterkunft-Formular ──
  function UnterkunftForm({ data }) {
    const [f, setF] = useState(data || { id:"", name:"", adresse:"", ansprechpartner:"", tel:"", email:"", checkin:"", checkout:"", zimmer:"", projektId:"", kostenNacht:"", bemerkung:"" });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.name) return;
      if (data) setUnterkuenfte(prev => prev.map(x => x.id===data.id ? f : x));
      else setUnterkuenfte(prev => [...prev, { ...f, id:neueId("U",prev) }]);
      setModal(null);
    }
    const col = { bg:"#0f766e" };
    return (
      <Modal titel={data?"Unterkunft bearbeiten":"Neue Unterkunft"} onClose={()=>setModal(null)} farbe={col.bg}>
        <Feld label="Name der Unterkunft"><input style={inpS()} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="z.B. Hotel Leipzig" /></Feld>
        <Feld label="Adresse"><input style={inpS()} value={f.adresse} onChange={e=>set("adresse",e.target.value)} placeholder="Straße, PLZ, Ort" /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Ansprechpartner"><input style={inpS()} value={f.ansprechpartner} onChange={e=>set("ansprechpartner",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Telefon"><input style={inpS()} value={f.tel} onChange={e=>set("tel",e.target.value)} /></Feld></div>
        </div>
        <Feld label="E-Mail"><input style={inpS()} value={f.email} onChange={e=>set("email",e.target.value)} placeholder="kontakt@hotel.de" /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Check-in"><input type="date" style={inpS()} value={f.checkin} onChange={e=>set("checkin",e.target.value)} /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Check-out"><input type="date" style={inpS()} value={f.checkout} onChange={e=>set("checkout",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Zimmer"><input type="number" style={inpS()} value={f.zimmer} onChange={e=>set("zimmer",e.target.value)} placeholder="3" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Kosten/Nacht (€)"><input type="number" style={inpS()} value={f.kostenNacht} onChange={e=>set("kostenNacht",e.target.value)} placeholder="80" /></Feld></div>
        </div>
        <Feld label="Projekt"><select style={inpS()} value={f.projektId} onChange={e=>set("projektId",e.target.value)}><option value="">– kein Projekt –</option>{projekte.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Feld>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
          <button onClick={()=>setModal(null)} style={btnGhost()}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  // ── Werkzeug-Formular ──
  function WerkzeugForm({ data }) {
    const [f, setF] = useState(data || { id:"", name:"", typ:"", seriennummer:"", zustand:"gut", zugeordnetMa:"", team:"", pruefDatum:"", bemerkung:"" });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.name) return;
      if (data) setWerkzeuge(prev => prev.map(x => x.id===data.id ? f : x));
      else setWerkzeuge(prev => [...prev, { ...f, id:neueId("W",prev) }]);
      setModal(null);
    }
    return (
      <Modal titel={data?"Werkzeug bearbeiten":"Neues Werkzeug"} onClose={()=>setModal(null)} farbe="#475569">
        <Feld label="Bezeichnung"><input style={inpS()} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="z.B. Schweißgerät Fronius" /></Feld>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Typ"><input style={inpS()} value={f.typ} onChange={e=>set("typ",e.target.value)} placeholder="Schweißgerät, Bohrmaschine…" /></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Seriennummer"><input style={inpS()} value={f.seriennummer} onChange={e=>set("seriennummer",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Zustand"><select style={inpS()} value={f.zustand} onChange={e=>set("zustand",e.target.value)}><option>gut</option><option>gebraucht</option><option>defekt</option><option>in Reparatur</option></select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Prüftermin (z.B. DGUV)"><input type="date" style={inpS()} value={f.pruefDatum||""} onChange={e=>set("pruefDatum",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Zugeordneter Mitarbeiter"><select style={inpS()} value={f.zugeordnetMa||""} onChange={e=>set("zugeordnetMa",e.target.value)}><option value="">–</option>{mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Feld></div>
          <div style={{ flex:1, minWidth:150 }}><Feld label="Oder Team"><select style={inpS()} value={f.team||""} onChange={e=>set("team",e.target.value)}><option value="">–</option>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
        </div>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary("#475569")}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Speichern</span></button>
          <button onClick={()=>setModal(null)} style={btnGhost()}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  function loeschen(art, id) {
    if (art==="projekt") setProjekte(prev => prev.filter(p=>p.id!==id));
    if (art==="ma")      setMitarbeiter(prev => prev.filter(m=>m.id!==id));
    if (art==="fzg")     setFahrzeuge(prev => prev.filter(f=>f.id!==id));
    if (art==="unterkunft") setUnterkuenfte(prev => prev.filter(u=>u.id!==id));
    if (art==="werkzeug") setWerkzeuge(prev => prev.filter(w=>w.id!==id));
  }

  const subTabs = [
    { id:"projekte", label:`Projekte (${projekte.length})`, Icon:Building2 },
    { id:"mitarbeiter", label:`Mitarbeiter (${mitarbeiter.length})`, Icon:Users },
    { id:"fahrzeuge", label:`Fahrzeuge (${fahrzeuge.length})`, Icon:Truck },
    { id:"unterkuenfte", label:`Unterkünfte (${(unterkuenfte||[]).length})`, Icon:BedDouble },
    { id:"werkzeuge", label:`Werkzeuge (${(werkzeuge||[]).length})`, Icon:Wrench },
    { id:"teams", label:`Teams (${(teams||[]).length})`, Icon:Users },
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSub(t.id)} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:sub===t.id?"#ea580c":TH.panel, color:sub===t.id?"#fff":TH.text }}><span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>{t.Icon && <t.Icon size={14} />}{t.label}</span></button>
        ))}
        <button onClick={backupHerunterladen} title="Alle Daten als Sicherungsdatei herunterladen" style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Backup herunterladen</span></button>
        {onReset && <button onClick={onReset} style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:8, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer", fontSize:12 }}>↺ Demo-Daten zurücksetzen</button>}
      </div>

      {sub==="projekte" && (
        <>
          <button onClick={()=>setModal({art:"projekt"})} style={{ ...btnPrimary(), marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neues Projekt</span></button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Name","Kunde","Ort","Zeitraum","Team","Status","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {projekte.map(p=>{
                  const col=getTeamColor(p.team);
                  return (
                    <tr key={p.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:`4px solid ${col.bg}` }}>{p.name}</td>
                      <td style={tdS()}>{p.kunde}</td>
                      <td style={tdS()}>{p.ort}</td>
                      <td style={tdS()}>{fmtDateShort(parseDate(p.dateStart))}–{fmtDateShort(parseDate(p.dateEnd))}</td>
                      <td style={tdS()}><Badge color={col.bg}>{p.team}</Badge></td>
                      <td style={tdS()}><Badge color={STATUS_FARBEN[p.status]}>{p.status}</Badge></td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"projekt",data:p})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}><Pencil size={13} /></button>
                        <button onClick={()=>loeschen("projekt",p.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub==="mitarbeiter" && (
        <>
          <button onClick={()=>setModal({art:"ma"})} style={{ ...btnPrimary(), marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neuer Mitarbeiter</span></button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Name","Rolle","Team","Login-E-Mail","Telefon","Quali.","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {mitarbeiter.map(m=>{
                  const col=getTeamColor(m.team);
                  const q=[m.fuehrerschein&&"FS",m.stapler&&"Stapler",m.schweisser&&"Schw."].filter(Boolean).join(", ")||"–";
                  return (
                    <tr key={m.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter"?700:400, borderLeft:`4px solid ${col.bg}` }}>{m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter"?"★ ":""}{m.name}</td>
                      <td style={tdS()}><Badge color={col.bg}>{m.rolle}</Badge></td>
                      <td style={tdS()}>{m.team}</td>
                      <td style={{ ...tdS(), fontSize:11, color:m.email?"#374151":"#d1d5db" }}>{m.email||"– kein Zugang –"}</td>
                      <td style={tdS()}>{m.tel}</td>
                      <td style={{ ...tdS(), fontSize:11 }}>{q}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"ma",data:m})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}><Pencil size={13} /></button>
                        <button onClick={()=>loeschen("ma",m.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub==="fahrzeuge" && (
        <>
          <button onClick={()=>setModal({art:"fzg"})} style={{ ...btnPrimary(), marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neues Fahrzeug</span></button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Kennzeichen","Typ","Team","TÜV","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {fahrzeuge.map(f=>{
                  const col=getTeamColor(f.team);
                  return (
                    <tr key={f.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:`4px solid ${col.bg}` }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Truck size={13}/>{f.kz}</span></td>
                      <td style={tdS()}>{f.typ}</td>
                      <td style={tdS()}><Badge color={col.bg}>{f.team}</Badge></td>
                      <td style={tdS()}>{f.tuev}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"fzg",data:f})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}><Pencil size={13} /></button>
                        <button onClick={()=>loeschen("fzg",f.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub==="unterkuenfte" && (
        <>
          <button onClick={()=>setModal({art:"unterkunft"})} style={{ ...btnPrimary("#0f766e"), marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neue Unterkunft</span></button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Name","Adresse","Check-in","Check-out","Zimmer","Projekt","€/Nacht","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {(unterkuenfte||[]).map(u=>{
                  const proj=projekte.find(p=>p.id===u.projektId);
                  return (
                    <tr key={u.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:"4px solid #0f766e" }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><BedDouble size={13}/>{u.name}</span></td>
                      <td style={tdS()}>{u.adresse||"–"}</td>
                      <td style={tdS()}>{u.checkin?fmtDateShort(parseDate(u.checkin)):"–"}</td>
                      <td style={tdS()}>{u.checkout?fmtDateShort(parseDate(u.checkout)):"–"}</td>
                      <td style={{ ...tdS(), textAlign:"center" }}>{u.zimmer||"–"}</td>
                      <td style={tdS()}>{proj?proj.name:"–"}</td>
                      <td style={{ ...tdS(), textAlign:"center" }}>{u.kostenNacht?u.kostenNacht+" €":"–"}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"unterkunft",data:u})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}><Pencil size={13} /></button>
                        <button onClick={()=>loeschen("unterkunft",u.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub==="werkzeuge" && (
        <>
          <button onClick={()=>setModal({art:"werkzeug"})} style={{ ...btnPrimary("#475569"), marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neues Werkzeug</span></button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Bezeichnung","Typ","Seriennr.","Zustand","Zugeordnet","Prüftermin","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {(werkzeuge||[]).map(w=>{
                  const ma=mitarbeiter.find(m=>m.id===w.zugeordnetMa);
                  return (
                    <tr key={w.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:"4px solid #475569" }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Wrench size={13}/>{w.name}</span></td>
                      <td style={tdS()}>{w.typ||"–"}</td>
                      <td style={tdS()}>{w.seriennummer||"–"}</td>
                      <td style={tdS()}>{w.zustand||"–"}</td>
                      <td style={tdS()}>{ma?ma.name:(w.team||"–")}</td>
                      <td style={tdS()}>{w.pruefDatum?fmtDateShort(parseDate(w.pruefDatum)):"–"}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"werkzeug",data:w})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}><Pencil size={13} /></button>
                        <button onClick={()=>loeschen("werkzeug",w.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {sub==="teams" && (
        <TeamVerwaltung teams={teams} setTeams={setTeams} mitarbeiter={mitarbeiter} projekte={projekte} fahrzeuge={fahrzeuge} />
      )}

      {modal?.art==="projekt" && <ProjektForm data={modal.data} />}
      {modal?.art==="ma"      && <MitarbeiterForm data={modal.data} />}
      {modal?.art==="fzg"     && <FahrzeugForm data={modal.data} />}
      {modal?.art==="unterkunft" && <UnterkunftForm data={modal.data} />}
      {modal?.art==="werkzeug" && <WerkzeugForm data={modal.data} />}
    </div>
  );
}

function WarnPanel({ warnungen }) {
  if (!warnungen.length) return <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"12px 16px", color:"#166534", fontSize:13 }}>✅ Keine Konflikte gefunden</div>;
  return <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{warnungen.map((w,i)=><div key={i} style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"10px 14px", color:"#92400e", display:"flex", gap:10, fontSize:13 }}><span style={{ fontSize:18 }}>⚠️</span><div><strong style={{ marginRight:6 }}>{w.typ}:</strong>{w.msg}</div></div>)}</div>;
}

// ─── ADMIN-DASHBOARD (Kontrollzentrum) ────────────────────────────────────────
function KennzahlKarte({ wert, label, farbe, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ background:TH.panel, border:`1.5px solid ${farbe}33`, borderRadius:12, padding:"14px 16px", cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px #0001", transition:"all .15s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:farbe, display:"flex", alignItems:"center" }}>{icon}</span>
        <span style={{ fontSize:30, fontWeight:800, color:farbe }}>{wert}</span>
      </div>
      <div style={{ fontSize:12, color:"#6b7280", marginTop:4, fontWeight:600 }}>{label}</div>
    </div>
  );
}

// ─── WERKZEUG-ÜBERSICHT ───────────────────────────────────────────────────────
function WerkzeugUebersicht({ werkzeuge, mitarbeiter }) {
  const heute = new Date(); heute.setHours(0,0,0,0);
  function pruefStatus(w) {
    if (!w.pruefDatum) return { farbe:"#9ca3af", text:"kein Prüftermin" };
    const d = parseDate(w.pruefDatum);
    const tage = Math.round((d-heute)/86400000);
    if (tage < 0)  return { farbe:"#dc2626", text:`Prüfung überfällig (${fmtDate(d)})` };
    if (tage <= 30) return { farbe:"#d97706", text:`Prüfung fällig in ${tage} Tagen` };
    return { farbe:"#16a34a", text:`geprüft bis ${fmtDate(d)}` };
  }
  const faellig = (werkzeuge||[]).filter(w=>{ const s=pruefStatus(w); return s.farbe!=="#16a34a" && s.farbe!=="#9ca3af"; });
  if (!werkzeuge || werkzeuge.length===0) {
    return <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Werkzeuge angelegt. Lege welche unter „Verwaltung → Werkzeuge" an.</div>;
  }
  return (
    <div>
      {faellig.length>0 && (
        <div style={{ background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:8, padding:"8px 14px", marginBottom:14, fontSize:12, color:"#991b1b" }}>
          ⚠️ <b>{faellig.length} Werkzeug(e) mit fälliger/überfälliger Prüfung:</b> {faellig.map(w=>w.name).join(", ")}
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))", gap:14 }}>
        {werkzeuge.map(w=>{
          const ma = mitarbeiter.find(m=>m.id===w.zugeordnetMa);
          const st = pruefStatus(w);
          const col = w.team ? getTeamColor(w.team) : { bg:"#475569" };
          return (
            <div key={w.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d", background:TH.panel }}>
              <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Wrench size={13}/>{w.name}</span></div>
              <div style={{ padding:"10px 12px", fontSize:12, display:"flex", flexDirection:"column", gap:5 }}>
                <Info label="Typ" value={w.typ||"–"} />
                <Info label="Seriennummer" value={w.seriennummer||"–"} />
                <Info label="Zustand" value={w.zustand||"–"} />
                <Info label="Zugeordnet" value={ma?ma.name:(w.team||"–")} />
                {w.bemerkung && <Info label="Bemerkung" value={w.bemerkung} />}
                <div style={{ marginTop:4 }}><Badge color={st.farbe}>{st.text}</Badge></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAGESBERICHTE (Wetter automatisch, Fotos mit Zeitstempel) ────────────────
const WETTER_CODES = { 0:"Klar ☀️",1:"Überwiegend klar 🌤",2:"Teilweise bewölkt ⛅",3:"Bewölkt ☁️",45:"Nebel 🌫",48:"Nebel (Reif) 🌫",51:"Leichter Niesel 🌦",53:"Niesel 🌦",55:"Starker Niesel 🌧",61:"Leichter Regen 🌦",63:"Regen 🌧",65:"Starker Regen 🌧",71:"Leichter Schnee 🌨",73:"Schnee 🌨",75:"Starker Schnee ❄️",80:"Regenschauer 🌦",81:"Schauer 🌧",82:"Starke Schauer ⛈",95:"Gewitter ⛈",96:"Gewitter mit Hagel ⛈",99:"Schweres Gewitter ⛈" };

async function holeWetter(ort) {
  try {
    const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ort)}&count=1&language=de`).then(r=>r.json());
    const loc = g?.results?.[0];
    if (!loc) return null;
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,wind_speed_10m`).then(r=>r.json());
    const c = w?.current;
    if (!c) return null;
    const text = WETTER_CODES[c.weather_code] || "";
    return `${text}, ${Math.round(c.temperature_2m)}°C, Wind ${Math.round(c.wind_speed_10m)} km/h (${loc.name})`;
  } catch(e) { return null; }
}

async function stempleFoto(file) {
  const img = await createImageBitmap(file);
  const maxB = 1600;
  const skala = Math.min(1, maxB / img.width);
  const cw = Math.round(img.width * skala), ch = Math.round(img.height * skala);
  const canvas = document.createElement("canvas");
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, cw, ch);
  const ts = new Date(file.lastModified || Date.now());
  const text = `📷 ${String(ts.getDate()).padStart(2,"0")}.${String(ts.getMonth()+1).padStart(2,"0")}.${ts.getFullYear()}  ${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")} Uhr`;
  const fs = Math.max(16, Math.round(cw/45));
  ctx.font = `bold ${fs}px Arial`;
  const tw2 = ctx.measureText(text).width;
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  ctx.fillRect(cw - tw2 - 24, ch - fs*2.1, tw2 + 24, fs*2.1);
  ctx.fillStyle = "#f97316";
  ctx.fillText(text, cw - tw2 - 12, ch - fs*0.7);
  const blob = await new Promise(res=>canvas.toBlob(res, "image/jpeg", 0.85));
  return { blob, zeit: ts.toISOString() };
}

function Tagesberichte({ projekte, mitarbeiter, berichte, setBerichte, rolle, meinMA, userEmail }) {
  const istLeitung = rolle==="Admin" || rolle==="Projektleiter" || rolle==="Bauleiter" || rolle==="Vorarbeiter";
  const leer = { datum: isoDate(new Date()), projektId:"", wetter:"", fortschritt:"", probleme:"", material:"", anwesende:"", leistung:"", fotos:[] };
  const [f, setF] = useState(leer);
  const [zeigeForm, setZeigeForm] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [wetterLaedt, setWetterLaedt] = useState(false);
  const set = (k,v)=>setF(p=>({...p,[k]:v}));

  async function projektWaehlen(pid) {
    const proj = projekte.find(p=>p.id===pid);
    const team = proj ? mitarbeiter.filter(m=>m.team===proj.team).map(m=>m.name).join(", ") : "";
    setF(p=>({ ...p, projektId:pid, anwesende:team, team:proj?.team||"" }));
    if (proj?.ort) {
      setWetterLaedt(true);
      const w = await holeWetter(proj.ort);
      setWetterLaedt(false);
      if (w) setF(p=>({ ...p, wetter:w }));
    }
  }

  async function fotosHochladen(files) {
    if (!files?.length) return;
    setLaedt(true);
    const neu = [];
    for (const file of Array.from(files)) {
      try {
        const { blob, zeit } = await stempleFoto(file);
        const pfad = `${Date.now()}_${Math.random().toString(36).slice(2,8)}.jpg`;
        const { error } = await supabase.storage.from("berichte").upload(pfad, blob, { contentType:"image/jpeg" });
        if (error) { alert("Foto-Upload fehlgeschlagen: "+error.message); continue; }
        const { data } = supabase.storage.from("berichte").getPublicUrl(pfad);
        neu.push({ url: data.publicUrl, zeit });
      } catch(e) { alert("Foto konnte nicht verarbeitet werden."); }
    }
    setF(p=>({ ...p, fotos:[...(p.fotos||[]), ...neu] }));
    setLaedt(false);
  }

  function speichern() {
    if (!f.projektId || !f.fortschritt) { alert("Bitte mindestens Projekt und Arbeitsfortschritt ausfüllen."); return; }
    const proj = projekte.find(p=>p.id===f.projektId);
    const b = { ...f, id:"B"+Date.now(), team:proj?.team||"", verfasser: meinMA?.name || userEmail || "Unbekannt",
      maAnzahl: f.anwesende ? f.anwesende.split(",").filter(x=>x.trim()).length : null };
    setBerichte(prev=>[...(prev||[]), b]);
    setF(leer);
    setZeigeForm(false);
  }

  const sortiert = [...(berichte||[])].sort((a,b)=>(b.datum||"").localeCompare(a.datum||"")||String(b.id).localeCompare(String(a.id)));
  const [auswahl, setAuswahl] = useState([]);
  const toggleAuswahl = id => setAuswahl(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]);
  const alleAusgewaehlt = sortiert.length>0 && auswahl.length===sortiert.length;

  function pdfBerichte() {
    const esc = t => String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>");
    const ausgewaehlt = auswahl.length ? sortiert.filter(b=>auswahl.includes(b.id)) : sortiert;
    const chron = [...ausgewaehlt].sort((a,b)=>(a.datum||"").localeCompare(b.datum||""));
    const bloecke = chron.map(b=>{
      const proj = projekte.find(p=>p.id===b.projektId);
      const fotos = (b.fotos||[]).map(f=>`<img src="${f.url}" />`).join("");
      return `<div class="bericht">
        <div class="bkopf"><span>${esc(fmtDate(parseDate(b.datum)))} · ${esc(proj?.name||"Projekt")}</span><span>${esc(b.verfasser||"")}${b.leistung?` · Leistungsstand ${esc(b.leistung)} %`:""}</span></div>
        <table class="binfo">
          ${b.wetter?`<tr><td>Wetter</td><td>${esc(b.wetter)}</td></tr>`:""}
          ${b.anwesende?`<tr><td>Anwesend</td><td>${esc(b.anwesende)}${b.maAnzahl?` (${b.maAnzahl} Personen)`:""}</td></tr>`:""}
          <tr><td>Ausgeführte Arbeiten</td><td>${esc(b.fortschritt||"–")}</td></tr>
          ${b.probleme?`<tr class="rot"><td>Besonderheiten / Behinderungen</td><td>${esc(b.probleme)}</td></tr>`:""}
          ${b.material?`<tr><td>Materialbedarf</td><td>${esc(b.material)}</td></tr>`:""}
        </table>
        ${fotos?`<div class="fotos">${fotos}</div>`:""}
      </div>`;
    }).join("");
    const heute = new Date();
    const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Baufox – Bautagebuch</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;margin:26px;color:#1e293b;}
      .kopf{display:flex;align-items:center;gap:12px;border-bottom:3px solid #ea580c;padding-bottom:12px;}
      h1{font-size:20px;margin:0;}
      .unter{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:0;}
      .meta{font-size:11px;color:#64748b;margin:8px 0 18px;}
      .bericht{border:1px solid #e2e8f0;border-radius:10px;margin-bottom:18px;overflow:hidden;page-break-inside:avoid;}
      .bkopf{background:#1e293b;color:#fff;padding:8px 12px;font-size:12px;font-weight:bold;display:flex;justify-content:space-between;gap:10px;}
      .binfo{width:100%;border-collapse:collapse;font-size:11.5px;}
      .binfo td{padding:6px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top;}
      .binfo td:first-child{width:190px;color:#64748b;font-weight:bold;}
      .binfo tr.rot td{background:#fef2f2;color:#991b1b;}
      .fotos{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;}
      .fotos img{width:180px;height:130px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;}
      .fuss{margin-top:30px;display:flex;gap:60px;font-size:11px;color:#64748b;}
      .linie{border-top:1px solid #94a3b8;padding-top:4px;width:220px;}
      @media print{ body{margin:10mm;} .fotos img{width:160px;height:115px;} }
    </style></head><body>
      <div class="kopf"><img src="/icon-192.png" width="44" height="44" style="border-radius:10px"/><div><h1>Baufox – Bautagebuch</h1><p class="unter">Montage-Steuerung</p></div></div>
      <div class="meta">Erstellt am ${esc(fmtDate(heute))} · ${chron.length} Bericht(e)</div>
      ${bloecke}
      <div class="fuss"><div class="linie">Datum, Unterschrift Auftragnehmer</div><div class="linie">Datum, Unterschrift Auftraggeber</div></div>
      <script>window.onload=function(){window.print();};<\/script>
    </body></html>`;
    oeffneDruck(html);
  }

  return (
    <div>
      {istLeitung && !zeigeForm && (
        <button onClick={()=>setZeigeForm(true)} style={{ padding:"10px 20px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, marginBottom:16 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Neuer Tagesbericht</span></button>
      )}

      {istLeitung && zeigeForm && (
        <div style={{ background:TH.panel, border:"1.5px solid #ea580c", borderRadius:12, padding:16, marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"#ea580c" }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileText size={14}/>Neuer Tagesbericht</span></div>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ minWidth:150 }}><Feld label="Datum"><input type="date" style={inpS()} value={f.datum} onChange={e=>set("datum",e.target.value)} /></Feld></div>
            <div style={{ flex:1, minWidth:200 }}><Feld label="Projekt"><select style={inpS()} value={f.projektId} onChange={e=>projektWaehlen(e.target.value)}><option value="">– wählen –</option>{projekte.map(p=><option key={p.id} value={p.id}>{p.name} ({p.ort})</option>)}</select></Feld></div>
            <div style={{ minWidth:110 }}><Feld label="Leistung (%)"><input type="number" min={0} max={100} style={inpS()} value={f.leistung} onChange={e=>set("leistung",e.target.value)} placeholder="z.B. 60" /></Feld></div>
          </div>
          <Feld label={"Wetter "+(wetterLaedt?"(wird geholt…)":"(automatisch beim Projekt-Wählen)")}>
            <input style={inpS()} value={f.wetter} onChange={e=>set("wetter",e.target.value)} placeholder="wird automatisch ausgefüllt…" />
          </Feld>
          <Feld label="Anwesende (automatisch aus Team, anpassbar)"><input style={inpS()} value={f.anwesende} onChange={e=>set("anwesende",e.target.value)} /></Feld>
          <Feld label="Arbeitsfortschritt – was wurde gemacht?"><textarea style={{ ...inpS(), minHeight:70, resize:"vertical" }} value={f.fortschritt} onChange={e=>set("fortschritt",e.target.value)} placeholder="z.B. Schienenstöße 12–18 verschweißt, Vermessung Achse B abgeschlossen" /></Feld>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:220 }}><Feld label="Probleme / Behinderungen"><textarea style={{ ...inpS(), minHeight:50, resize:"vertical" }} value={f.probleme} onChange={e=>set("probleme",e.target.value)} placeholder="z.B. Kran erst ab 10 Uhr verfügbar" /></Feld></div>
            <div style={{ flex:1, minWidth:220 }}><Feld label="Materialbedarf"><textarea style={{ ...inpS(), minHeight:50, resize:"vertical" }} value={f.material} onChange={e=>set("material",e.target.value)} placeholder="z.B. 20× Klemmplatten, Schweißdraht" /></Feld></div>
          </div>
          <Feld label="Fotos (Zeitstempel wird automatisch eingebrannt)">
            <input type="file" accept="image/*" multiple onChange={e=>fotosHochladen(e.target.files)} style={{ fontSize:13 }} />
            {laedt && <div style={{ fontSize:12, color:"#ea580c", marginTop:6 }}>⏳ Fotos werden gestempelt und hochgeladen…</div>}
            {f.fotos?.length>0 && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                {f.fotos.map((fo,i)=>(
                  <div key={i} style={{ position:"relative" }}>
                    <img src={fo.url} alt="" style={{ width:110, height:80, objectFit:"cover", borderRadius:8, border:"1.5px solid "+TH.border }} />
                    <button onClick={()=>set("fotos", f.fotos.filter((_,j)=>j!==i))} style={{ position:"absolute", top:-6, right:-6, width:22, height:22, borderRadius:99, border:"none", background:"#dc2626", color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Feld>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={speichern} disabled={laedt} style={{ ...btnPrimary("#ea580c"), opacity:laedt?0.6:1 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Save size={14}/>Bericht speichern</span></button>
            <button onClick={()=>{setF(leer);setZeigeForm(false);}} style={btnGhost()}>Abbrechen</button>
          </div>
        </div>
      )}

      {sortiert.length>0 && (
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
          <button onClick={()=>setAuswahl(alleAusgewaehlt?[]:sortiert.map(b=>b.id))} style={{ padding:"8px 14px", borderRadius:8, border:"1.5px solid "+TH.border, background:TH.panel, color:TH.text, cursor:"pointer", fontSize:12, fontWeight:600 }}>
            {alleAusgewaehlt?"Alle abwählen":"Alle auswählen"}
          </button>
          <button onClick={pdfBerichte} style={{ padding:"8px 16px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:12 }}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileDown size={14}/>{auswahl.length?`${auswahl.length} Bericht(e) als PDF`:"Alle als PDF"}</span>
          </button>
        </div>
      )}
      {!sortiert.length ? (
        <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Tagesberichte vorhanden.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {sortiert.map(b=>{
            const proj = projekte.find(p=>p.id===b.projektId);
            const col = proj ? getTeamColor(proj.team) : { bg:"#6b7280", light:"#f3f4f6" };
            return (
              <div key={b.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d", background:TH.panel }}>
                <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:13, display:"inline-flex", alignItems:"center", gap:8 }}>
                    <input type="checkbox" checked={auswahl.includes(b.id)} onChange={()=>toggleAuswahl(b.id)} style={{ width:16, height:16, accentColor:"#ea580c", cursor:"pointer" }} />
                    <span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileText size={13}/>{fmtDate(parseDate(b.datum))}</span> · {proj?.name||"Projekt gelöscht"}</span>
                  <span style={{ fontSize:11, opacity:0.85 }}>von {b.verfasser}{b.leistung?` · Leistung ${b.leistung}%`:""}</span>
                </div>
                <div style={{ padding:"10px 14px", fontSize:12, display:"flex", flexDirection:"column", gap:6 }}>
                  {b.wetter && <Info label="Wetter" value={b.wetter} />}
                  {b.anwesende && <Info label="Anwesend" value={b.anwesende+(b.maAnzahl?` (${b.maAnzahl})`:"")} />}
                  <Info label="Fortschritt" value={b.fortschritt||"–"} />
                  {b.probleme && <div style={{ padding:"6px 10px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:6, color:"#991b1b" }}>⚠️ <b>Probleme:</b> {b.probleme}</div>}
                  {b.material && <div style={{ padding:"6px 10px", background:"#eff6ff", border:"1px solid #bfdbfe", borderRadius:6, color:"#1e40af" }}>📦 <b>Material:</b> {b.material}</div>}
                  {b.fotos?.length>0 && (
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:4 }}>
                      {b.fotos.map((fo,i)=>(
                        <a key={i} href={fo.url} target="_blank" rel="noreferrer">
                          <img src={fo.url} alt="" style={{ width:130, height:95, objectFit:"cover", borderRadius:8, border:"1.5px solid "+TH.border }} />
                        </a>
                      ))}
                    </div>
                  )}
                  {istLeitung && (
                    <div><button onClick={()=>{ if(window.confirm("Diesen Bericht wirklich löschen?")) setBerichte(prev=>prev.filter(x=>x.id!==b.id)); }} style={{ padding:"4px 12px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer", fontSize:11 }}>🗑 Löschen</button></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 🤖 SMARTER ASSISTENT (Prognosen & Vorschläge, regelbasiert) ──────────────
function SmartAssistent({ projekte, stunden, mitarbeiter, unterkuenfte, werkzeuge, berichte, T }) {
  const tw = (T && T.text) || "#1e3a5f";
  const fmtEuro = n => (Number(n)||0).toLocaleString("de-DE",{maximumFractionDigits:0})+" €";
  const heute = new Date(); heute.setHours(0,0,0,0);

  // Ist-Kosten je Projekt (wie im Kosten-Tab)
  function istKosten(p) {
    const eintraege = (stunden||[]).filter(e=>e.projekt===p.name);
    const minLohn = Number(p.mindestlohn)||0;
    const lohn = eintraege.reduce((s,e)=>{ const ma=mitarbeiter.find(m=>m.id===e.maId); return s+(Number(e.arbeitsstunden)||0)*Math.max(Number(ma?.stundensatz)||0, minLohn); },0);
    const spesen = eintraege.reduce((s,e)=>s+(Number(e.spesen)||0),0);
    const unterkunft = (unterkuenfte||[]).filter(u=>u.projektId===p.id).reduce((s,u)=>{
      if (!u.checkin||!u.checkout||!u.kostenNacht) return s;
      const n = Math.max(0, Math.round((parseDate(u.checkout)-parseDate(u.checkin))/86400000));
      return s + n*(Number(u.kostenNacht)||0)*(Number(u.zimmer)||1);
    },0);
    return { ist: lohn+spesen+unterkunft, anzahl: eintraege.length };
  }

  // 1. Kostenprognosen (Ist hochgerechnet über Leistungsstand aus Tagesberichten)
  const prognosen = projekte.filter(p=>p.status!=="abgeschlossen").map(p=>{
    const { ist, anzahl } = istKosten(p);
    const leistungen = (berichte||[]).filter(b=>b.projektId===p.id && b.leistung).map(b=>Number(b.leistung));
    const leistung = leistungen.length ? Math.max(...leistungen) : null;
    const planK = Number(p.planKosten)||0;
    let prognose=null, delta=null;
    if (leistung && leistung>0 && ist>0) {
      prognose = ist/(leistung/100);
      if (planK>0) delta = (prognose-planK)/planK*100;
    }
    return { p, ist, anzahl, leistung, planK, prognose, delta };
  }).filter(x=>x.prognose!=null);

  // 2. Team-Verfügbarkeit
  const teams = TEAM_NAMEN_AKTUELL.map(team=>{
    const aktiv = projekte.filter(p=>p.team===team && p.status!=="abgeschlossen" && p.dateEnd && parseDate(p.dateEnd)>=heute);
    if (!aktiv.length) return { team, freiAb:"sofort", projekt:null };
    const letztes = aktiv.reduce((a,b)=>parseDate(a.dateEnd)>parseDate(b.dateEnd)?a:b);
    const frei = new Date(parseDate(letztes.dateEnd)); frei.setDate(frei.getDate()+1);
    return { team, freiAb: fmtDate(frei), projekt: letztes.name };
  });

  // 3. Hinweise
  const hinweise = [];
  (werkzeuge||[]).forEach(w=>{
    if (!w.pruefDatum) return;
    const tage = Math.round((parseDate(w.pruefDatum)-heute)/86400000);
    if (tage<0) hinweise.push({ art:"rot", text:`Prüfung überfällig: ${w.name} (seit ${fmtDate(parseDate(w.pruefDatum))})` });
    else if (tage<=30) hinweise.push({ art:"gelb", text:`Prüfung fällig in ${tage} Tagen: ${w.name}` });
  });
  projekte.filter(p=>p.status==="aktiv").forEach(p=>{
    const { anzahl } = istKosten(p);
    if (anzahl===0) hinweise.push({ art:"gelb", text:`Aktives Projekt ohne erfasste Stunden: ${p.name}` });
    if (!(Number(p.planKosten)>0)) hinweise.push({ art:"grau", text:`Keine Plankosten hinterlegt: ${p.name} (für Prognose nötig)` });
  });
  mitarbeiter.filter(m=>!m.stundensatz).slice(0,5).forEach(m=>{
    hinweise.push({ art:"grau", text:`Stundensatz fehlt: ${m.name}` });
  });

  const hinweisFarben = { rot:{bg:"#fef2f2",bd:"#fca5a5",tx:"#991b1b"}, gelb:{bg:"#fff7ed",bd:"#fdba74",tx:"#92400e"}, grau:{bg:TH.panel2,bd:TH.border,tx:TH.textMut} };

  return (
    <div>
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Sparkles size={15}/>Assistent</span></div>
      <div style={{ fontSize:12, color:"#6b7280", marginBottom:16 }}>Automatische Prognosen und Hinweise – berechnet aus deinen Stunden, Berichten (Leistungsstand!) und Planwerten.</div>

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><TrendingUp size={14}/>Kostenprognosen</span></div>
      {!prognosen.length ? (
        <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:16, fontSize:12, color:TH.textMut, marginBottom:18 }}>
          Noch keine Prognose möglich. Dafür braucht ein Projekt: erfasste Stunden + einen Tagesbericht mit Leistungsstand (%) + Plankosten.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
          {prognosen.map(({p,ist,leistung,planK,prognose,delta})=>{
            const farbe = delta==null ? "#6b7280" : delta<=0 ? "#16a34a" : delta<=10 ? "#d97706" : "#dc2626";
            return (
              <div key={p.id} style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderLeft:"5px solid "+farbe, borderRadius:12, padding:"10px 14px", fontSize:12 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{p.name}</div>
                Stand: <b>{leistung}%</b> fertig · bisher <b>{fmtEuro(ist)}</b> → hochgerechnet <b style={{color:farbe}}>{fmtEuro(prognose)}</b>
                {planK>0 && <> (Plan {fmtEuro(planK)}{delta!=null && <b style={{color:farbe}}> · {delta>0?"+":""}{delta.toFixed(0)} %</b>})</>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Users size={14}/>Team-Verfügbarkeit</span></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10, marginBottom:18 }}>
        {teams.map(t=>{
          const col=getTeamColor(t.team);
          return (
            <div key={t.team} style={{ background:TH.panel, border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, padding:"10px 14px", fontSize:12 }}>
              <div style={{ fontWeight:700, color:col.bg, marginBottom:3 }}>{t.team}</div>
              {t.freiAb==="sofort" ? <span style={{ color:"#16a34a", fontWeight:700 }}>✓ sofort verfügbar</span> : <>frei ab <b>{t.freiAb}</b><div style={{ color:TH.textMut, fontSize:11 }}>bis dahin: {t.projekt}</div></>}
            </div>
          );
        })}
      </div>

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Lightbulb size={14}/>Hinweise</span></div>
      {!hinweise.length ? (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:14, fontSize:12, color:"#166534" }}>✓ Alles im grünen Bereich – keine offenen Hinweise!</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {hinweise.map((h,i)=>{
            const f=hinweisFarben[h.art];
            return <div key={i} style={{ background:f.bg, border:"1.5px solid "+f.bd, borderRadius:8, padding:"8px 12px", fontSize:12, color:f.tx }}>{h.text}</div>;
          })}
        </div>
      )}
    </div>
  );
}

// ─── MEIN POSTFACH (persönliche Stundenübersicht für jeden) ───────────────────
function MeinPostfach({ meinMA, meineRolle, userEmail, stunden, projekte }) {
  const [zeitraum, setZeitraum] = useState("monat"); // woche | monat | alle

  if (!meinMA) {
    return (
      <div>
        <h2 style={{ margin:"0 0 12px", fontSize:18, color:TH.text, display:"flex", alignItems:"center", gap:8 }}><Inbox size={18}/> Mein Postfach</h2>
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:24, textAlign:"center", color:TH.textMut, fontSize:13 }}>
          Dein Login ist noch keinem Mitarbeiter zugeordnet. Sobald der Administrator deine E-Mail (<strong>{userEmail}</strong>) einträgt, erscheinen hier deine Arbeitsstunden.
        </div>
      </div>
    );
  }

  const meine = (stunden||[]).filter(e=>e.maId===meinMA.id);
  const heute = new Date(); heute.setHours(0,0,0,0);
  const jetztKW = getKW(heute);
  const jahr = heute.getFullYear();

  const gefiltert = meine.filter(e=>{
    const d = parseDate(e.datum);
    if (zeitraum==="woche") return getKW(d)===jetztKW && d.getFullYear()===jahr;
    if (zeitraum==="monat") return d.getMonth()===heute.getMonth() && d.getFullYear()===jahr;
    return true;
  });

  const sortiert = [...gefiltert].sort((a,b)=>(b.datum||"").localeCompare(a.datum||""));
  const sumStd = gefiltert.reduce((s,e)=>s+(Number(e.arbeitsstunden)||0),0);
  const sumUe  = gefiltert.reduce((s,e)=>s+Math.max(0,(Number(e.arbeitsstunden)||0)-8),0);
  const tage   = new Set(gefiltert.map(e=>e.datum)).size;

  const Karte = ({ label, wert, farbe }) => (
    <div style={{ flex:1, minWidth:120, background:TH.panel, border:"1px solid "+TH.border, borderLeft:"5px solid "+farbe, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:"12px 14px" }}>
      <div style={{ fontSize:11, color:TH.textMut, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:TH.text, marginTop:2 }}>{wert}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ margin:"0 0 4px", fontSize:18, color:TH.text, display:"flex", alignItems:"center", gap:8 }}><Inbox size={18}/> Mein Postfach</h2>
      <div style={{ fontSize:12.5, color:TH.textMut, marginBottom:14 }}>{meinMA.name} · {meinMA.team} · {meineRolle}</div>

      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
        {[["woche","Diese Woche"],["monat","Dieser Monat"],["alle","Alles"]].map(([id,label])=>(
          <button key={id} onClick={()=>setZeitraum(id)} style={{ padding:"7px 14px", borderRadius:99, border:"1.5px solid "+(zeitraum===id?"#ea580c":TH.border), background:zeitraum===id?"#ea580c":TH.panel, color:zeitraum===id?"#fff":TH.text, cursor:"pointer", fontSize:12.5, fontWeight:700 }}>{label}</button>
        ))}
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <Karte label="Arbeitsstunden" wert={sumStd.toFixed(2).replace(".",",")+" h"} farbe="#ea580c" />
        <Karte label="davon Überstunden" wert={sumUe.toFixed(2).replace(".",",")+" h"} farbe="#dc2626" />
        <Karte label="Arbeitstage" wert={tage} farbe="#059669" />
      </div>

      <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5, minWidth:540 }}>
            <thead>
              <tr style={{ background:TH.panel2, color:TH.textMut, textAlign:"left" }}>
                <th style={{ padding:"9px 12px" }}>Datum</th>
                <th style={{ padding:"9px 12px" }}>Tag</th>
                <th style={{ padding:"9px 12px" }}>Projekt</th>
                <th style={{ padding:"9px 12px" }}>Von–Bis</th>
                <th style={{ padding:"9px 12px", textAlign:"right" }}>Stunden</th>
                <th style={{ padding:"9px 12px", textAlign:"right" }}>Überstd.</th>
              </tr>
            </thead>
            <tbody>
              {sortiert.map(e=>{
                const ue = Math.max(0,(Number(e.arbeitsstunden)||0)-8);
                return (
                  <tr key={e.id} style={{ borderTop:"1px solid "+TH.border, color:TH.text }}>
                    <td style={{ padding:"9px 12px" }}>{fmtDate(parseDate(e.datum))}</td>
                    <td style={{ padding:"9px 12px" }}>{(e.wochentag||"").slice(0,2)}</td>
                    <td style={{ padding:"9px 12px" }}>{e.projekt||"–"}</td>
                    <td style={{ padding:"9px 12px" }}>{e.start||"–"}{e.end?"–"+e.end:""}</td>
                    <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700 }}>{Number(e.arbeitsstunden||0).toFixed(2).replace(".",",")}</td>
                    <td style={{ padding:"9px 12px", textAlign:"right", color:ue>0?"#dc2626":TH.textMut, fontWeight:ue>0?700:400 }}>{ue>0?ue.toFixed(2).replace(".",","):"–"}</td>
                  </tr>
                );
              })}
              {!sortiert.length && <tr><td colSpan={6} style={{ padding:22, textAlign:"center", color:TH.textMut }}>Keine Stunden in diesem Zeitraum.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop:8, fontSize:11, color:TH.textMut }}>Deine Stunden werden von deinem Vorarbeiter erfasst. Bei Unstimmigkeiten sprich ihn an.</div>
    </div>
  );
}

// ─── TEAM-CHAT (Alle + Team-Kanäle) ───────────────────────────────────────────
function TeamChat({ meinMA, meineRolle, userEmail }) {
  const istLeitung = ["Admin","Projektleiter","Bauleiter"].includes(meineRolle);
  const darfSchreiben = ["Admin","Projektleiter","Bauleiter","Vorarbeiter"].includes(meineRolle);
  const kanaele = ["Alle", ...(istLeitung ? TEAM_NAMEN_AKTUELL : TEAM_NAMEN_AKTUELL.filter(t=>meinMA && t===meinMA.team))];
  const [kanal, setKanal] = useState("Alle");
  const [nachrichten, setNachrichten] = useState([]);
  const [text, setText] = useState("");
  const [laedt, setLaedt] = useState(true);
  const endeRef = useRef(null);
  const meinName = meinMA?.name || userEmail || "Unbekannt";

  async function laden(scrollen) {
    const { data } = await supabase.from("nachrichten").select("*").eq("kanal", kanal).order("created_at", { ascending:true }).limit(200);
    setNachrichten(data||[]);
    setLaedt(false);
    if (scrollen) setTimeout(()=>endeRef.current?.scrollIntoView({ behavior:"smooth" }), 80);
  }

  useEffect(()=>{
    setLaedt(true);
    laden(true);
    const iv = setInterval(()=>laden(false), 5000);
    return ()=>clearInterval(iv);
  }, [kanal]);

  async function senden() {
    const t = text.trim();
    if (!t) return;
    setText("");
    const neu = { id:"N"+Date.now(), kanal, absender:meinName, absender_email:userEmail||"", text:t };
    setNachrichten(p=>[...p, { ...neu, created_at:new Date().toISOString() }]);
    setTimeout(()=>endeRef.current?.scrollIntoView({ behavior:"smooth" }), 50);
    await supabase.from("nachrichten").insert(neu);
    laden(false);
  }

  const fmtZeit = iso => { const d = new Date(iso); return d.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"})+" "+d.toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}); };

  return (
    <div>
      <h2 style={{ margin:"0 0 12px", fontSize:18, color:TH.text, display:"flex", alignItems:"center", gap:8 }}><MessageCircle size={18}/> Chat</h2>
      <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
        {kanaele.map(k=>{
          const col = k==="Alle" ? { bg:"#ea580c", light:"#ffedd5" } : getTeamColor(k);
          const aktiv = kanal===k;
          return <button key={k} onClick={()=>setKanal(k)} style={{ padding:"7px 14px", borderRadius:99, border:"1.5px solid "+(aktiv?col.bg:TH.border), background:aktiv?col.bg:TH.panel, color:aktiv?"#fff":TH.text, cursor:"pointer", fontSize:12.5, fontWeight:700 }}>{k}</button>;
        })}
      </div>
      <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", display:"flex", flexDirection:"column", height:"min(62vh, 560px)" }}>
        <div style={{ flex:1, overflowY:"auto", padding:14, display:"flex", flexDirection:"column", gap:8 }}>
          {laedt && <div style={{ color:TH.textMut, fontSize:12.5, textAlign:"center", padding:20 }}>Nachrichten werden geladen…</div>}
          {!laedt && !nachrichten.length && <div style={{ color:TH.textMut, fontSize:12.5, textAlign:"center", padding:20 }}>Noch keine Nachrichten in „{kanal}" – schreib die erste! 💬</div>}
          {nachrichten.map(n=>{
            const meins = n.absender_email && n.absender_email===userEmail;
            return (
              <div key={n.id} style={{ alignSelf:meins?"flex-end":"flex-start", maxWidth:"78%" }}>
                <div style={{ background:meins?"linear-gradient(135deg,#ea580c 0%,#f97316 100%)":TH.panel2, color:meins?"#fff":TH.text, border:meins?"none":"1px solid "+TH.border, borderRadius:meins?"14px 14px 4px 14px":"14px 14px 14px 4px", padding:"8px 12px", fontSize:13.5, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                  {!meins && <div style={{ fontSize:10.5, fontWeight:800, color:getTeamColor(kanal==="Alle"?n.absender:kanal).bg, marginBottom:2 }}>{n.absender}</div>}
                  {n.text}
                  <div style={{ fontSize:9.5, opacity:0.65, marginTop:3, textAlign:"right" }}>{fmtZeit(n.created_at)}</div>
                </div>
              </div>
            );
          })}
          <div ref={endeRef} />
        </div>
        {darfSchreiben ? (
          <div style={{ display:"flex", gap:8, padding:10, borderTop:"1px solid "+TH.border }}>
            <input style={{ ...inpS(), flex:1 }} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&senden()} placeholder={`Nachricht an „${kanal}"…`} />
            <button onClick={senden} style={{ ...btnPrimary("#ea580c"), display:"inline-flex", alignItems:"center", gap:6 }}><Send size={14}/> Senden</button>
          </div>
        ) : (
          <div style={{ padding:"10px 14px", borderTop:"1px solid "+TH.border, fontSize:12, color:TH.textMut, textAlign:"center" }}>
            Du liest hier mit – schreiben können Vorarbeiter, Bauleiter und Projektleiter.
          </div>
        )}
      </div>
      <div style={{ marginTop:8, fontSize:11, color:TH.textMut }}>Aktualisiert sich automatisch alle 5 Sekunden.</div>
    </div>
  );
}

// ─── TEAM-VERWALTUNG (eigene Namen, beliebig viele) ───────────────────────────
function TeamVerwaltung({ teams, setTeams, mitarbeiter, projekte, fahrzeuge }) {
  const [neuName, setNeuName] = useState("");

  function anlegen() {
    const name = neuName.trim();
    if (!name) return;
    if ((teams||[]).some(t=>t.name.toLowerCase()===name.toLowerCase())) { alert("Ein Team mit diesem Namen existiert bereits."); return; }
    setTeams(prev => [...(prev||[]), { id:"T"+Date.now(), name }]);
    setNeuName("");
  }

  function verwendung(name) {
    return (
      mitarbeiter.filter(m=>m.team===name).length +
      projekte.filter(p=>p.team===name).length +
      (fahrzeuge||[]).filter(f=>f.team===name).length
    );
  }

  function loeschen(team) {
    const n = verwendung(team.name);
    if (n>0) { alert(`„${team.name}" wird noch ${n}× verwendet (Mitarbeiter/Projekte/Fahrzeuge). Bitte zuerst alle umziehen, dann löschen.`); return; }
    if (!window.confirm(`Team „${team.name}" wirklich löschen?`)) return;
    setTeams(prev => prev.filter(t=>t.id!==team.id));
  }

  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:16, maxWidth:420 }}>
        <input style={inpS()} value={neuName} onChange={e=>setNeuName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&anlegen()} placeholder="Neuer Team-Name, z.B. Reparatur-Trupp Nord" />
        <button onClick={anlegen} style={btnPrimary("#ea580c")}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15}/>Anlegen</span></button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:12 }}>
        {(teams||[]).map(t=>{
          const col = getTeamColor(t.name);
          const n = verwendung(t.name);
          return (
            <div key={t.id} style={{ background:TH.panel, border:"1px solid "+TH.border, borderLeft:"5px solid "+col.bg, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:col.bg }}>{t.name}</div>
                <div style={{ fontSize:11, color:TH.textMut }}>{n>0?`${n}× in Verwendung`:"nicht in Verwendung"}</div>
              </div>
              <button onClick={()=>loeschen(t)} title="Team löschen" style={{ padding:"6px 9px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}><Trash2 size={13} /></button>
            </div>
          );
        })}
        {!(teams||[]).length && <div style={{ color:TH.textMut, fontSize:13 }}>Noch keine Teams – leg oben das erste an.</div>}
      </div>
      <div style={{ marginTop:14, fontSize:11, color:TH.textMut }}>Tipp: Auch kleine Trupps („2 Mann Reparatur Hamburg") einfach als Team anlegen – nach dem Einsatz wieder löschen oder behalten.</div>
    </div>
  );
}

// ─── KOSTEN-CONTROLLING (Plan vs. Ist mit Ampel) ──────────────────────────────
function KostenControlling({ projekte, stunden, mitarbeiter, unterkuenfte, T }) {
  const tw = (T && T.text) || "#1e3a5f";
  const fmtEuro = n => (Number(n)||0).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0})+" €";

  const auswertung = useMemo(()=>projekte.map(p=>{
    const eintraege = (stunden||[]).filter(e=>e.projekt===p.name);
    const istStunden = eintraege.reduce((s,e)=>s+(Number(e.arbeitsstunden)||0),0);
    const minLohn = Number(p.mindestlohn)||0;
    const lohn = eintraege.reduce((s,e)=>{
      const ma = mitarbeiter.find(m=>m.id===e.maId);
      const satz = Math.max(Number(ma?.stundensatz)||0, minLohn);
      return s + (Number(e.arbeitsstunden)||0) * satz;
    },0);
    const spesen = eintraege.reduce((s,e)=>s+(Number(e.spesen)||0),0);
    const unterkunft = (unterkuenfte||[]).filter(u=>u.projektId===p.id).reduce((s,u)=>{
      if (!u.checkin||!u.checkout||!u.kostenNacht) return s;
      const naechte = Math.max(0, Math.round((parseDate(u.checkout)-parseDate(u.checkin))/86400000));
      return s + naechte * (Number(u.kostenNacht)||0) * (Number(u.zimmer)||1);
    },0);
    const ist = lohn + spesen + unterkunft;
    const planK = Number(p.planKosten)||0;
    const planStd = Number(p.planStunden)||0;
    const summe = Number(p.auftragssumme)||0;
    const ratio = planK>0 ? ist/planK : null;
    const stdRatio = planStd>0 ? istStunden/planStd : null;
    const db = summe>0 ? summe-ist : null;
    let ampel = "#9ca3af", ampelText = "kein Planwert";
    if (ratio!=null) {
      if (ratio<=0.8) { ampel="#16a34a"; ampelText="im Plan"; }
      else if (ratio<=1.0) { ampel="#d97706"; ampelText="wird knapp"; }
      else { ampel="#dc2626"; ampelText="über Plan!"; }
    }
    return { p, istStunden, lohn, spesen, unterkunft, ist, planK, planStd, summe, ratio, stdRatio, db, ampel, ampelText, anzahl:eintraege.length };
  }),[projekte, stunden, mitarbeiter, unterkuenfte]);

  const ohneSatz = mitarbeiter.filter(m=>!m.stundensatz);

  return (
    <div>
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Euro size={15}/>Kosten-Controlling</span></div>
      <div style={{ fontSize:12, color:"#6b7280", marginBottom:14 }}>Ist-Kosten = erfasste Stunden × Stundensatz + Spesen + Unterkunft (Nächte × €/Nacht × Zimmer)</div>
      {ohneSatz.length>0 && (
        <div style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"8px 14px", marginBottom:14, fontSize:12, color:"#92400e" }}>
          ⚠️ Ohne Stundensatz (zählen mit 0 € in die Lohnkosten): {ohneSatz.map(m=>m.name).join(", ")} → in Verwaltung → Mitarbeiter nachtragen.
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {auswertung.map(({p,istStunden,lohn,spesen,unterkunft,ist,planK,planStd,summe,ratio,stdRatio,db,ampel,ampelText,anzahl})=>{
          const col=getTeamColor(p.team);
          return (
            <div key={p.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d", background:TH.panel }}>
              <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <span style={{ fontWeight:700, fontSize:14 }}>{p.name}{p.nummer?` · ${p.nummer}`:""}</span>
                <span style={{ background:TH.panel, color:ampel, borderRadius:99, padding:"2px 12px", fontSize:11, fontWeight:800 }}>● {ampelText}</span>
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:"8px 18px", fontSize:12, marginBottom:10 }}>
                  <Info label="Stunden Ist / Plan" value={`${istStunden.toFixed(1)} h${planStd?` / ${planStd} h`:""}`} />
                  <Info label="Lohnkosten" value={fmtEuro(lohn)} />
                  <Info label="Spesen" value={fmtEuro(spesen)} />
                  <Info label="Unterkunft" value={fmtEuro(unterkunft)} />
                  <Info label="Kosten Ist / Plan" value={<b style={{color:ampel}}>{fmtEuro(ist)}{planK?` / ${fmtEuro(planK)}`:""}</b>} />
                  {Number(p.mindestlohn)>0 && <Info label="Mindestlohn" value={<span style={{color:"#ea580c",fontWeight:700}}>{p.mindestlohn} €/h{p.land?` (${p.land})`:""}</span>} />}
                  {summe>0 && <Info label="Auftragssumme" value={fmtEuro(summe)} />}
                  {db!=null && <Info label="Deckungsbeitrag" value={<b style={{color:db>=0?"#16a34a":"#dc2626"}}>{fmtEuro(db)}</b>} />}
                </div>
                {ratio!=null && (
                  <div style={{ background:"#f1f5f9", borderRadius:99, height:10, overflow:"hidden" }}>
                    <div style={{ width:Math.min(100,ratio*100)+"%", height:"100%", background:ampel, transition:"width 0.3s" }} />
                  </div>
                )}
                {anzahl===0 && <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>Noch keine Stunden für dieses Projekt erfasst (Projektname im Stundenzettel muss übereinstimmen).</div>}
              </div>
            </div>
          );
        })}
        {!projekte.length && <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Projekte angelegt.</div>}
      </div>
    </div>
  );
}

function Dashboard({ mitarbeiter, projekte, sonder, fahrzeuge, antraege, warnungen, unterkuenfte, setTab, T }) {
  const tw = (T && T.text) || "#1e3a5f";
  const heute = new Date();
  const d = parseDate(isoDate(heute));

  // Wer ist heute wo?
  const eintraege = mitarbeiter.map(ma => {
    const proj = getProjektForTeamDate(projekte, ma.team, d);
    const se = getSonderForMaDate(sonder, ma.id, d);
    return { ma, proj, se };
  });
  const imEinsatz = eintraege.filter(e => e.proj && !e.se);
  const imUrlaub  = eintraege.filter(e => e.se && e.se.typ==="Urlaub");
  const krank     = eintraege.filter(e => e.se && e.se.typ==="Krank");
  const abwesendSonst = eintraege.filter(e => e.se && e.se.typ!=="Urlaub" && e.se.typ!=="Krank");
  const ohneEinsatz = eintraege.filter(e => !e.proj && !e.se);

  // Aktive Projekte heute
  const aktiveProjekte = projekte.filter(p => dateInRange(d, p.dateStart, p.dateEnd) && p.status!=="storniert" && p.status!=="abgeschlossen");
  const aktiveTeams = [...new Set(aktiveProjekte.map(p=>p.team))];

  // Probleme
  const projOhneVA = aktiveProjekte.filter(p => !p.vorarbeiter);
  const projOhneFzg = aktiveProjekte.filter(p => !p.fzg);
  const projOhneUnterkunft = aktiveProjekte.filter(p => !(unterkuenfte||[]).some(u => u.projektId===p.id));
  const offeneAntraege = antraege.filter(a => a.status==="offen");

  const farbBlau="#1d4ed8", farbGruen="#16a34a", farbRot="#dc2626", farbOrange="#d97706", farbGrau="#6b7280";

  return (
    <div>
      <div style={{ fontSize:13, color:"#6b7280", marginBottom:14 }}>
        {WOCHENTAGE_LANG[heute.getDay()]}, {fmtDate(heute)} · KW {getKW(heute)} — Überblick für heute
      </div>

      {/* Kennzahlen */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12, marginBottom:20 }}>
        <KennzahlKarte wert={aktiveProjekte.length} label="Aktive Projekte heute" farbe={farbBlau} icon={<Building2 size={22} />} onClick={()=>setTab("projekte")} />
        <KennzahlKarte wert={aktiveTeams.length} label="Teams im Einsatz" farbe={farbBlau} icon={<Users size={22} />} onClick={()=>setTab("woche")} />
        <KennzahlKarte wert={imEinsatz.length} label="Mitarbeiter im Einsatz" farbe={farbGruen} icon={<HardHat size={22} />} onClick={()=>setTab("heute")} />
        <KennzahlKarte wert={imUrlaub.length} label="Im Urlaub" farbe={farbOrange} icon={<TreePalm size={22} />} />
        <KennzahlKarte wert={krank.length} label="Krank gemeldet" farbe={farbRot} icon={<Thermometer size={22} />} />
        <KennzahlKarte wert={ohneEinsatz.length} label="Ohne Einsatz" farbe={farbGrau} icon={<CircleSlash size={22} />} />
      </div>

      {/* Handlungsbedarf */}
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Zap size={15}/>Handlungsbedarf</span></div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:24 }}>

        {/* Offene Anträge */}
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
          <div style={{ background: offeneAntraege.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: offeneAntraege.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setTab("antraege")}>
            <span>🌴 Offene Urlaubsanträge</span><span>{offeneAntraege.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {offeneAntraege.length===0 ? <span style={{ color:"#9ca3af" }}>Keine offenen Anträge</span> :
              offeneAntraege.slice(0,4).map(a=><div key={a.id} style={{ padding:"3px 0" }}>{a.maName} · {a.typ} · {fmtDateShort(parseDate(a.dateStart))}–{fmtDateShort(parseDate(a.dateEnd))}</div>)}
          </div>
        </div>

        {/* Projekte ohne Vorarbeiter */}
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
          <div style={{ background: projOhneVA.length?"#fee2e2":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneVA.length?"#991b1b":"#166534", display:"flex", justifyContent:"space-between" }}>
            <span>⚠️ Projekte ohne Vorarbeiter</span><span>{projOhneVA.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneVA.length===0 ? <span style={{ color:"#9ca3af" }}>Alle Projekte haben einen Vorarbeiter</span> :
              projOhneVA.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.team}</div>)}
          </div>
        </div>

        {/* Projekte ohne Fahrzeug */}
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
          <div style={{ background: projOhneFzg.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneFzg.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between" }}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Truck size={14}/>Projekte ohne Fahrzeug</span><span>{projOhneFzg.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneFzg.length===0 ? <span style={{ color:"#9ca3af" }}>Alle aktiven Projekte haben ein Fahrzeug</span> :
              projOhneFzg.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.team}</div>)}
          </div>
        </div>

        {/* Projekte ohne Unterkunft */}
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
          <div style={{ background: projOhneUnterkunft.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneUnterkunft.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setTab("unterkuenfte")}>
            <span><span style={{display:"inline-flex",alignItems:"center",gap:6}}><BedDouble size={14}/>Projekte ohne Unterkunft</span></span><span>{projOhneUnterkunft.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneUnterkunft.length===0 ? <span style={{ color:"#9ca3af" }}>Alle aktiven Projekte haben eine Unterkunft</span> :
              projOhneUnterkunft.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.ort}</div>)}
          </div>
        </div>

        {/* Konflikte */}
        <div style={{ background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
          <div style={{ background: warnungen.length?"#fff7ed":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: warnungen.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setTab("warnungen")}>
            <span>🔎 Konflikt-Warnungen</span><span>{warnungen.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {warnungen.length===0 ? <span style={{ color:"#9ca3af" }}>Keine Konflikte gefunden</span> :
              warnungen.slice(0,4).map((w,i)=><div key={i} style={{ padding:"3px 0" }}>{w.msg}</div>)}
          </div>
        </div>
      </div>

      {/* Heute auf Baustelle */}
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Building2 size={15}/>Heute aktiv</span></div>
      {aktiveProjekte.length===0 ? (
        <div style={{ background:TH.panel2, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 1px 4px #0000000d", padding:20, textAlign:"center", color:"#9ca3af" }}>Heute sind keine Projekte aktiv</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
          {aktiveProjekte.map(p=>{
            const col=getTeamColor(p.team);
            const team=imEinsatz.filter(e=>e.ma.team===p.team);
            const fzg=fahrzeuge.find(f=>f.id===p.fzg);
            return (
              <div key={p.id} style={{ border:"1px solid "+TH.border, boxShadow:"0 2px 10px #00000012", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px #0000000d" }}>
                <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13, display:"flex", justifyContent:"space-between" }}>
                  <span>{p.name}</span><span style={{ opacity:0.85 }}>{p.team}</span>
                </div>
                <div style={{ padding:"8px 12px", fontSize:12 }}>
                  <Info label="Ort" value={p.ort} />
                  <Info label="Vorarbeiter" value={p.vorarbeiter||"– fehlt –"} />
                  <Info label="Fahrzeug" value={fzg?fzg.kz:"– fehlt –"} />
                  <Info label="Mitarbeiter heute" value={team.length} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Rollen & Rechte ──────────────────────────────────────────────────────────
const ADMIN_EMAILS = ["emircan.g@cc-schienentechnik.de"];

function ermittleRolle(userEmail, mitarbeiter) {
  const mail = (userEmail||"").trim().toLowerCase();
  const ma = mitarbeiter.find(m => (m.email||"").trim().toLowerCase() === mail && mail!=="");
  if (ADMIN_EMAILS.includes(mail)) return { rolle:"Admin", ma: ma || null };
  if (ma) return { rolle: ma.rolle, ma };
  return { rolle:"Unbekannt", ma:null };
}

// Welche Tabs darf welche Rolle sehen?
// ─── MESSPROTOKOLLE (Höhe & Flucht, bis 300 Punkte, PDF mit Firmenlogo) ──────
const MP_BLAU = "#2e3192";
const FIRMENLOGO = "data:image/jpeg;base64,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3SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssBvqcZcnLB603SG+pxlycsHrTdIr+B2GDxOWywG+pxlycsHrTdIb6nGXJywetN0iv4HYYPE5bLAb6nGXJywetN0hvqcZcnLB603SK/gdhg8TlssAnVU4yz/w3YV/5TdIFfwPt+DxOWz/2Q=="; // Firmenlogo fest eingebettet (C&C Schienentechnik)

function mpAbw(ist, soll) {
  const i = parseFloat(String(ist).replace(",", "."));
  const s = parseFloat(String(soll).replace(",", "."));
  if (isNaN(i) || isNaN(s)) return null;
  return Math.round((i - s) * 100) / 100;
}
function mpRot(abw, tol) {
  if (abw == null) return false;
  const t = parseFloat(String(tol).replace(",", "."));
  if (isNaN(t)) return false;
  return Math.abs(abw) > t;
}
// "rot" = außerhalb Toleranz, "gruen" = in Toleranz, "" = noch kein Wert
function mpStatus(abw, tol) {
  if (abw == null) return "";
  return mpRot(abw, tol) ? "rot" : "gruen";
}
// Position automatisch aus Startwert + Abstand je Punkt (z. B. 0 / 0,5 / 1,0 …)
function mpPos(start, schritt, i) {
  const d = parseFloat(String(schritt).replace(",", "."));
  if (isNaN(d)) return "";
  const s = parseFloat(String(start).replace(",", "."));
  const v = (isNaN(s) ? 0 : s) + i * d;
  return (Math.round(v * 1000) / 1000).toString().replace(".", ",");
}

const MP_FARBE = { rot:{ bg:"#fee2e2", bd:"#dc2626", tx:"#991b1b" }, gruen:{ bg:"#dcfce7", bd:"#16a34a", tx:"#166534" } };

const MesspunktRow = memo(function MesspunktRow({ idx, punkt, posText, hoeheSoll, hoeheTol, fluchtSoll, fluchtTol, onChange, onDelete }) {
  const aH = mpAbw(punkt.hoehe, hoeheSoll);
  const aF = mpAbw(punkt.flucht, fluchtSoll);
  const sH = mpStatus(aH, hoeheTol);
  const sF = mpStatus(aF, fluchtTol);
  const tdS = { padding:"3px 4px", borderBottom:"1px solid "+TH.border, fontSize:12, textAlign:"center", color:TH.text };
  const istInp = (st) => { const c = MP_FARBE[st]; return { ...inpS(), textAlign:"center", padding:"4px 4px", borderColor: c?c.bd:TH.border, background: c?c.bg:TH.input, color: c?c.tx:TH.text, fontWeight: st==="rot"?700:400 }; };
  const dCol = (st) => st==="rot" ? "#dc2626" : st==="gruen" ? "#16a34a" : TH.textMut;
  return (
    <tr>
      <td style={{ ...tdS, color:TH.textMut }}>{idx+1}</td>
      <td style={{ ...tdS, color:TH.textMut, whiteSpace:"nowrap" }}>{posText||"–"}</td>
      <td style={tdS}><input value={punkt.hoehe} onChange={e=>onChange(idx,"hoehe",e.target.value)} inputMode="decimal" style={istInp(sH)} /></td>
      <td style={{ ...tdS, color:dCol(sH), fontWeight: sH?700:400 }}>{aH==null?"–":(aH>0?"+":"")+aH}</td>
      <td style={tdS}><input value={punkt.flucht} onChange={e=>onChange(idx,"flucht",e.target.value)} inputMode="decimal" style={istInp(sF)} /></td>
      <td style={{ ...tdS, color:dCol(sF), fontWeight: sF?700:400 }}>{aF==null?"–":(aF>0?"+":"")+aF}</td>
      <td style={tdS}><button onClick={()=>onDelete(idx)} title="Punkt löschen" style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", fontSize:15, lineHeight:1 }}>×</button></td>
    </tr>
  );
});

function messprotokollPDF(p) {
  const esc = t => String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  let ausH=0, ausF=0, maxH=0, maxF=0;
  const rows = (p.punkte||[]).map((pt,i)=>{
    const aH=mpAbw(pt.hoehe,p.hoeheSoll), aF=mpAbw(pt.flucht,p.fluchtSoll);
    const sH=mpStatus(aH,p.hoeheTol), sF=mpStatus(aF,p.fluchtTol);
    if (sH==="rot") ausH++; if (sF==="rot") ausF++;
    if (aH!=null) maxH=Math.max(maxH,Math.abs(aH)); if (aF!=null) maxF=Math.max(maxF,Math.abs(aF));
    const pos = mpPos(p.startPos, p.schritt, i);
    return `<tr>
      <td class="c">${i+1}</td>
      <td class="c">${pos===""?"–":esc(pos)}</td>
      <td class="c ${sH}">${pt.hoehe===""||pt.hoehe==null?"–":esc(pt.hoehe)}</td>
      <td class="c ${sH}">${aH==null?"–":(aH>0?"+":"")+aH}</td>
      <td class="c ${sF}">${pt.flucht===""||pt.flucht==null?"–":esc(pt.flucht)}</td>
      <td class="c ${sF}">${aF==null?"–":(aF>0?"+":"")+aF}</td>
    </tr>`;
  }).join("");
  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Messprotokoll – ${esc(p.bezeichnung||"")}</title>
  <style>
    body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#1e293b;position:relative;}
    .wm{position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:0;}
    .wm img{width:60%;opacity:0.08;}
    .inhalt{position:relative;z-index:1;}
    .kopf{display:flex;align-items:center;gap:14px;border-bottom:3px solid ${MP_BLAU};padding-bottom:10px;}
    .kopf img{height:46px;}
    h1{font-size:21px;margin:0;color:${MP_BLAU};}
    .unter{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#94a3b8;margin:2px 0 0;}
    .meta{font-size:11.5px;color:#334155;margin:12px 0 4px;display:grid;grid-template-columns:1fr 1fr;gap:3px 24px;}
    .meta b{color:#0f172a;}
    .soll{display:flex;gap:24px;flex-wrap:wrap;font-size:12px;margin:10px 0 12px;padding:9px 13px;background:#eef2ff;border-radius:8px;}
    table{border-collapse:collapse;width:100%;font-size:11px;}
    th{background:${MP_BLAU};color:#fff;padding:5px 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.3px;}
    td{padding:4px 6px;border-bottom:1px solid #e2e8f0;}
    td.c{text-align:center;}
    td.rot{background:#fee2e2;color:#991b1b;font-weight:bold;}
    td.gruen{background:#dcfce7;color:#166534;font-weight:bold;}
    tr:nth-child(even) td{background:#f8fafc;}
    tr:nth-child(even) td.rot{background:#fee2e2;}
    tr:nth-child(even) td.gruen{background:#dcfce7;}
    .summe{margin-top:14px;font-size:12px;padding:10px 12px;border-top:2px solid ${MP_BLAU};display:flex;gap:30px;flex-wrap:wrap;}
    .summe b{color:${MP_BLAU};}
    .fuss{margin-top:34px;display:flex;gap:60px;font-size:11px;color:#64748b;}
    .linie{border-top:1px solid #94a3b8;padding-top:4px;width:230px;}
    .baufox{margin-top:24px;font-size:9.5px;color:#94a3b8;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:6px;}
    .baufox img{height:16px;width:16px;border-radius:4px;}
    @media print{ body{margin:10mm;} th,td.rot,td.gruen,.wm img{ -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style></head><body>
    <div class="wm"><img src="${FIRMENLOGO}" onerror="this.parentNode.style.display='none'"/></div>
    <div class="inhalt">
      <div class="kopf">
        <img src="${FIRMENLOGO}" onerror="this.style.display='none'"/>
        <div><h1>Messprotokoll</h1><p class="unter">Höhe &amp; Flucht · Schienenmontage</p></div>
      </div>
      <div class="meta">
        <div>Projekt: <b>${esc(p.projektName||"–")}</b></div>
        <div>Datum: <b>${esc(p.datum||"–")}</b></div>
        <div>Bezeichnung: <b>${esc(p.bezeichnung||"–")}</b></div>
        <div>Erstellt von: <b>${esc(p.ersteller||"–")}</b></div>
      </div>
      <div class="soll">
        <div>Höhe Soll: <b>${esc(p.hoeheSoll||"–")} mm</b> &nbsp;(Toleranz ±${esc(p.hoeheTol||"–")} mm)</div>
        <div>Flucht Soll: <b>${esc(p.fluchtSoll||"–")} mm</b> &nbsp;(Toleranz ±${esc(p.fluchtTol||"–")} mm)</div>
      </div>
      <table>
        <thead><tr><th>Pkt</th><th>Pos. [m]</th><th>Höhe Ist [mm]</th><th>Höhe &#916;</th><th>Flucht Ist [mm]</th><th>Flucht &#916;</th></tr></thead>
        <tbody>${rows||`<tr><td colspan="6" class="c">Keine Messpunkte erfasst</td></tr>`}</tbody>
      </table>
      <div class="summe">
        <div>Messpunkte: <b>${(p.punkte||[]).length}</b></div>
        <div>Außerhalb Toleranz Höhe: <b style="color:${ausH?'#dc2626':'#16a34a'}">${ausH}</b></div>
        <div>Außerhalb Toleranz Flucht: <b style="color:${ausF?'#dc2626':'#16a34a'}">${ausF}</b></div>
        <div>Max. Abweichung: <b>Höhe ${maxH} mm · Flucht ${maxF} mm</b></div>
      </div>
      <div class="fuss"><div class="linie">Datum, Unterschrift Monteur</div><div class="linie">Datum, Unterschrift Auftraggeber</div></div>
      <div class="baufox"><img src="/icon-192.png" onerror="this.style.display='none'"/> Erstellt mit Baufox</div>
    </div>
    <script>window.onload=function(){window.print();};<\/script>
  </body></html>`;
  oeffneDruck(html);
}

function MessprotokollEditor({ start, projekte, onSave, onSaveStay, onCancel, onDelete }) {
  const [f, setF] = useState(start);
  const set = (k,v) => setF(p=>({ ...p, [k]:v }));
  const punkte = f.punkte || [];
  const setPunkt = useCallback((i,k,v) => setF(p=>{ const arr=p.punkte.slice(); arr[i]={ ...arr[i], [k]:v }; return { ...p, punkte:arr }; }), []);
  const delPunkt = useCallback((i) => setF(p=>({ ...p, punkte:p.punkte.filter((_,j)=>j!==i) })), []);
  const addPunkte = (n) => setF(p=>{ const frei=300-p.punkte.length; const add=Math.max(0,Math.min(n,frei)); return { ...p, punkte:[...p.punkte, ...Array.from({length:add},()=>({pos:"",hoehe:"",flucht:""}))] }; });

  let ausH=0, ausF=0, maxH=0, maxF=0;
  punkte.forEach(pt=>{ const aH=mpAbw(pt.hoehe,f.hoeheSoll), aF=mpAbw(pt.flucht,f.fluchtSoll);
    if (mpRot(aH,f.hoeheTol)) ausH++; if (mpRot(aF,f.fluchtTol)) ausF++;
    if (aH!=null) maxH=Math.max(maxH,Math.abs(aH)); if (aF!=null) maxF=Math.max(maxF,Math.abs(aF)); });

  const mitName = () => ({ ...f, projektName:(projekte.find(p=>p.id===f.projektId)?.name)||f.projektName||"" });
  const speichern = () => {
    if (!String(f.bezeichnung||"").trim()) { alert("Bitte eine Bezeichnung eingeben (z. B. „RBG Achse 1 – Schiene links\")."); return; }
    onSave(mitName());
  };

  const lab = { fontSize:10, color:TH.textMut, fontWeight:600, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 };
  const thS = { background:MP_BLAU, color:"#fff", padding:"6px 6px", fontSize:10, textTransform:"uppercase", letterSpacing:0.3, position:"sticky", top:0 };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:10, flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontSize:18, color:TH.text, display:"flex", alignItems:"center", gap:8 }}><Ruler size={18}/> {String(start.bezeichnung||"").trim() ? "Protokoll bearbeiten" : "Neues Messprotokoll"}</h2>
        <button onClick={onCancel} style={{ ...btnGhost(), padding:"6px 12px", fontSize:12 }}>← Zurück zur Liste</button>
      </div>

      <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
          <div><div style={lab}>Projekt</div>
            <select value={f.projektId} onChange={e=>set("projektId",e.target.value)} style={inpS()}>
              <option value="">– kein Projekt –</option>
              {projekte.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div><div style={lab}>Bezeichnung (Schiene/Achse)</div><input value={f.bezeichnung} onChange={e=>set("bezeichnung",e.target.value)} placeholder="z. B. RBG Achse 1 links" style={inpS()}/></div>
          <div><div style={lab}>Datum</div><input type="date" value={f.datum} onChange={e=>set("datum",e.target.value)} style={inpS()}/></div>
          <div><div style={lab}>Erstellt von</div><input value={f.ersteller} onChange={e=>set("ersteller",e.target.value)} style={inpS()}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginTop:12 }}>
          <div><div style={lab}>Höhe Soll [mm]</div><input value={f.hoeheSoll} onChange={e=>set("hoeheSoll",e.target.value)} inputMode="decimal" style={inpS()}/></div>
          <div><div style={lab}>Höhe Toleranz ± [mm]</div><input value={f.hoeheTol} onChange={e=>set("hoeheTol",e.target.value)} inputMode="decimal" style={inpS()}/></div>
          <div><div style={lab}>Flucht Soll [mm]</div><input value={f.fluchtSoll} onChange={e=>set("fluchtSoll",e.target.value)} inputMode="decimal" style={inpS()}/></div>
          <div><div style={lab}>Flucht Toleranz ± [mm]</div><input value={f.fluchtTol} onChange={e=>set("fluchtTol",e.target.value)} inputMode="decimal" style={inpS()}/></div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginTop:12 }}>
          <div><div style={lab}>Startposition [m]</div><input value={f.startPos} onChange={e=>set("startPos",e.target.value)} inputMode="decimal" placeholder="0" style={inpS()}/></div>
          <div><div style={lab}>Abstand je Punkt [m]</div><input value={f.schritt} onChange={e=>set("schritt",e.target.value)} inputMode="decimal" placeholder="z. B. 0,5" style={inpS()}/></div>
          <div style={{ gridColumn:"1 / -1", fontSize:11, color:TH.textMut, marginTop:-2 }}>Die Position jedes Punktes wird automatisch berechnet (Start + Abstand). Beispiel: Start 0, Abstand 0,5 → 0 · 0,5 · 1,0 · 1,5 …</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:12, color:TH.textMut, marginRight:4 }}>{punkte.length}/300 Messpunkte</span>
        <button onClick={()=>addPunkte(1)} style={{ ...btnGhost(), padding:"5px 11px", fontSize:12 }}>+1</button>
        <button onClick={()=>addPunkte(10)} style={{ ...btnGhost(), padding:"5px 11px", fontSize:12 }}>+10</button>
        <button onClick={()=>addPunkte(50)} style={{ ...btnGhost(), padding:"5px 11px", fontSize:12 }}>+50</button>
      </div>

      <div style={{ maxHeight:440, overflow:"auto", border:"1.5px solid "+TH.border, borderRadius:10 }}>
        <table style={{ borderCollapse:"collapse", width:"100%", minWidth:520 }}>
          <thead><tr>
            <th style={thS}>#</th><th style={thS}>Pos. [m]</th>
            <th style={thS}>Höhe Ist</th><th style={thS}>Höhe Δ</th>
            <th style={thS}>Flucht Ist</th><th style={thS}>Flucht Δ</th><th style={thS}></th>
          </tr></thead>
          <tbody>
            {punkte.map((pt,i)=>(
              <MesspunktRow key={i} idx={i} punkt={pt} posText={mpPos(f.startPos, f.schritt, i)} hoeheSoll={f.hoeheSoll} hoeheTol={f.hoeheTol} fluchtSoll={f.fluchtSoll} fluchtTol={f.fluchtTol} onChange={setPunkt} onDelete={delPunkt} />
            ))}
            {punkte.length===0 && <tr><td colSpan={7} style={{ textAlign:"center", padding:16, color:TH.textMut, fontSize:12 }}>Noch keine Punkte – oben mit „+10" hinzufügen.</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display:"flex", gap:24, flexWrap:"wrap", margin:"12px 2px", fontSize:12.5, color:TH.text }}>
        <span>Außerhalb Toleranz: <b style={{ color:(ausH+ausF)?"#dc2626":"#16a34a" }}>Höhe {ausH} · Flucht {ausF}</b></span>
        <span>Max. Abweichung: <b>Höhe {maxH} mm · Flucht {maxF} mm</b></span>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
        <button onClick={speichern} style={btnPrimary(MP_BLAU)}>Speichern</button>
        <button onClick={()=>{ const m=mitName(); onSaveStay&&onSaveStay(m); messprotokollPDF(m); }} style={{ ...btnGhost(), display:"flex", alignItems:"center", gap:6 }}><FileDown size={15}/> PDF / Druck</button>
        <button onClick={onCancel} style={btnGhost()}>Abbrechen</button>
        {onDelete && <button onClick={onDelete} style={{ ...btnGhost(), color:"#dc2626", marginLeft:"auto" }}>Löschen</button>}
      </div>
    </div>
  );
}

function Messprotokolle({ projekte, meinMA, userEmail, messprotokolle, setMessprotokolle }) {
  const [editId, setEditId] = useState(null); // null = Liste, "neu" = neues, sonst id
  const liste = messprotokolle || [];
  const ersteller = meinMA?.name || userEmail || "Unbekannt";
  const [filterProj, setFilterProj] = useState("alle");

  const neuesProtokoll = () => ({
    id: "MP"+Date.now(),
    projektId: projekte[0]?.id || "",
    projektName: projekte[0]?.name || "",
    bezeichnung: "",
    datum: isoDate(new Date()),
    ersteller,
    hoeheSoll: "0", hoeheTol: "2",
    fluchtSoll: "0", fluchtTol: "2",
    startPos: "0", schritt: "1",
    punkte: Array.from({length:10},()=>({pos:"",hoehe:"",flucht:""})),
  });

  const speichern = (prot) => {
    setMessprotokolle(prev => {
      const arr = (prev||[]).slice();
      const i = arr.findIndex(x=>x.id===prot.id);
      if (i>=0) arr[i]=prot; else arr.unshift(prot);
      return arr;
    });
    setEditId(null);
  };
  const speichernBleiben = (prot) => {
    setMessprotokolle(prev => {
      const arr = (prev||[]).slice();
      const i = arr.findIndex(x=>x.id===prot.id);
      if (i>=0) arr[i]=prot; else arr.unshift(prot);
      return arr;
    });
  };
  const loeschen = (id) => {
    if (!window.confirm("Dieses Messprotokoll wirklich löschen?")) return;
    setMessprotokolle(prev => (prev||[]).filter(x=>x.id!==id));
    setEditId(null);
  };

  if (editId) {
    const start = editId==="neu" ? neuesProtokoll() : liste.find(x=>x.id===editId);
    if (!start) { setEditId(null); return null; }
    return <MessprotokollEditor key={editId} start={start} projekte={projekte}
             onSave={speichern} onSaveStay={speichernBleiben} onCancel={()=>setEditId(null)} onDelete={editId==="neu"?null:()=>loeschen(start.id)} />;
  }

  const anzAuss = (p) => { let n=0; (p.punkte||[]).forEach(pt=>{ if (mpRot(mpAbw(pt.hoehe,p.hoeheSoll),p.hoeheTol)) n++; if (mpRot(mpAbw(pt.flucht,p.fluchtSoll),p.fluchtTol)) n++; }); return n; };
  const gruppen = [];
  projekte.forEach(pr => { const items = liste.filter(x=>x.projektId===pr.id); if (items.length) gruppen.push({ key:pr.id, name:pr.name, items }); });
  const ohne = liste.filter(x=>!x.projektId || !projekte.some(pr=>pr.id===x.projektId));
  if (ohne.length) gruppen.push({ key:"_ohne", name:"Ohne Projekt", items:ohne });
  const sichtbar = filterProj==="alle" ? gruppen : gruppen.filter(g=>g.key===filterProj);

  const karte = (p) => {
    const n = anzAuss(p);
    return (
      <div key={p.id} style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:12, padding:"12px 14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap", alignItems:"flex-start" }}>
          <div>
            <span style={{ display:"inline-block", fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:20, background:"#eef2ff", color:MP_BLAU, marginBottom:5 }}>{p.projektName||"Ohne Projekt"}</span>
            <div style={{ fontWeight:700, color:TH.text, fontSize:14 }}>{p.bezeichnung||"(ohne Bezeichnung)"}</div>
            <div style={{ fontSize:12, color:TH.textMut, marginTop:2 }}>{p.datum} · {(p.punkte||[]).length} Punkte · {p.ersteller}</div>
          </div>
          <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:20, whiteSpace:"nowrap", background: n? "#fee2e2":"#dcfce7", color: n? "#991b1b":"#166534" }}>
            {n? `${n} außerhalb Toleranz` : "alle in Toleranz"}
          </span>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          <button onClick={()=>setEditId(p.id)} style={{ ...btnGhost(), padding:"6px 12px", fontSize:12 }}>Öffnen</button>
          <button onClick={()=>messprotokollPDF(p)} style={{ ...btnGhost(), padding:"6px 12px", fontSize:12, display:"flex", alignItems:"center", gap:5 }}><FileDown size={14}/> PDF</button>
          <button onClick={()=>loeschen(p.id)} style={{ ...btnGhost(), padding:"6px 12px", fontSize:12, color:"#dc2626" }}>Löschen</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:10, flexWrap:"wrap" }}>
        <h2 style={{ margin:0, fontSize:18, color:TH.text, display:"flex", alignItems:"center", gap:8 }}><Ruler size={18}/> Messprotokolle</h2>
        <button onClick={()=>setEditId("neu")} style={btnPrimary(MP_BLAU)}>+ Neues Protokoll</button>
      </div>
      {liste.length>0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:TH.textMut, fontWeight:600 }}>Projekt:</span>
          <select value={filterProj} onChange={e=>setFilterProj(e.target.value)} style={{ ...inpS(), width:"auto", minWidth:180 }}>
            <option value="alle">Alle Projekte ({liste.length})</option>
            {gruppen.map(g=><option key={g.key} value={g.key}>{g.name} ({g.items.length})</option>)}
          </select>
        </div>
      )}
      {liste.length===0 ? (
        <div style={{ background:TH.panel, border:"1.5px dashed "+TH.border, borderRadius:12, padding:"34px 20px", textAlign:"center", color:TH.textMut, fontSize:13 }}>
          Noch keine Messprotokolle vorhanden.<br/>Lege mit „+ Neues Protokoll" das erste an.
        </div>
      ) : (
        <div style={{ display:"grid", gap:18 }}>
          {sichtbar.map(g=>(
            <div key={g.key}>
              <div style={{ display:"flex", alignItems:"center", gap:8, margin:"0 2px 8px", paddingBottom:6, borderBottom:"2px solid "+MP_BLAU }}>
                <Building2 size={15} color={MP_BLAU}/>
                <span style={{ fontWeight:700, color:TH.text, fontSize:14 }}>{g.name}</span>
                <span style={{ fontSize:11, color:TH.textMut }}>· {g.items.length} Protokoll(e)</span>
              </div>
              <div style={{ display:"grid", gap:10 }}>{g.items.map(p=>karte(p))}</div>
            </div>
          ))}
          {sichtbar.length===0 && (
            <div style={{ color:TH.textMut, fontSize:13, padding:"10px 2px" }}>Für dieses Projekt gibt es noch keine Protokolle.</div>
          )}
        </div>
      )}
    </div>
  );
}


function darfTab(rolle, tabId) {
  if (rolle==="Admin") return true;
  const rechte = {
    "Projektleiter": ["postfach","dashboard","kosten","assistent","chat","heute","woche","monat","stundenzettel","berichte","messprotokolle","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge","warnungen"],
    "Bauleiter":   ["postfach","dashboard","kosten","assistent","chat","heute","woche","monat","stundenzettel","berichte","messprotokolle","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge","warnungen"],
    "Vorarbeiter": ["postfach","heute","woche","monat","stundenzettel","berichte","messprotokolle","chat","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge"],
    "Monteur":     ["postfach","heute","woche","monat","stundenzettel","berichte","messprotokolle","chat","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge"],
    "Unbekannt":   ["heute","woche","monat"],
  };
  return (rechte[rolle]||rechte["Unbekannt"]).includes(tabId);
}

// ─── APP ─────────────────────────────────────────────────────────────────────
// ── Schutz gegen Zurücksetzen offener Formulare ──────────────────────────────
// Verhindert, dass die Verwaltungs-Seite (und damit ein offenes Formular wie
// "Neuer Mitarbeiter") beim 10-Sekunden-Hintergrundladen neu aufgebaut wird.
// Es wird nur dann neu aufgebaut, wenn sich echte Daten oder das Design ändern.
const verwaltungGleich = (a, b) =>
  a.projekte === b.projekte &&
  a.mitarbeiter === b.mitarbeiter &&
  a.fahrzeuge === b.fahrzeuge &&
  a.unterkuenfte === b.unterkuenfte &&
  a.werkzeuge === b.werkzeuge &&
  a.sonder === b.sonder &&
  a.antraege === b.antraege &&
  a.stunden === b.stunden &&
  a.berichte === b.berichte &&
  a.teams === b.teams &&
  a.dunkel === b.dunkel;
const VerwaltungMemo = memo(Verwaltung, verwaltungGleich);

export default function EinsatzplanungInner({
  projekte, setProjekte, mitarbeiter, setMitarbeiter,
  sonder, setSonder, antraege, setAntraege, fahrzeuge, setFahrzeuge,
  stunden, setStunden, unterkuenfte, setUnterkuenfte,
  berichte, setBerichte, werkzeuge, setWerkzeuge,
  teams, setTeams,
  onReset, onLogout, userEmail
}) {
  const { rolle: meineRolle, ma: meinMA } = useMemo(()=>ermittleRolle(userEmail, mitarbeiter), [userEmail, mitarbeiter]);

  // ── Rang-System: Jeder sieht nur das Relevante ──
  // Admin: alles · Projektleiter/Bauleiter: zugeteilte Projekte (+Vertretung) · Vorarbeiter/Monteur: eigenes Team
  const teamFilter = (meineRolle==="Vorarbeiter" || meineRolle==="Monteur") && meinMA ? meinMA.team : null;
  const projektFilter = (meineRolle==="Projektleiter" || meineRolle==="Bauleiter") && meinMA
    ? projekte.filter(p => p.projektleiterId===meinMA.id || p.bauleiterId===meinMA.id || p.vertretungId===meinMA.id)
    : null;
  const meineTeams = projektFilter ? [...new Set(projektFilter.map(p=>p.team))] : null;
  const meineProjektIds = projektFilter ? projektFilter.map(p=>p.id) : null;
  const meineProjektNamen = projektFilter ? projektFilter.map(p=>p.name) : null;

  const vProjekte = projektFilter ? projektFilter
                  : teamFilter ? projekte.filter(p=>p.team===teamFilter) : projekte;
  const vMitarbeiter = projektFilter ? mitarbeiter.filter(m=>meineTeams.includes(m.team) || m.id===meinMA.id)
                     : teamFilter ? mitarbeiter.filter(m=>m.team===teamFilter) : mitarbeiter;
  const vSonder = projektFilter ? sonder.filter(s=>{ const m=mitarbeiter.find(x=>x.id===s.ma); return m && meineTeams.includes(m.team); })
                : teamFilter ? sonder.filter(s=>{ const m=mitarbeiter.find(x=>x.id===s.ma); return m && m.team===teamFilter; }) : sonder;
  const vAntraege = projektFilter ? antraege.filter(a=>meineTeams.includes(a.team))
                  : teamFilter ? antraege.filter(a=>a.team===teamFilter) : antraege;
  const vStunden = projektFilter ? (stunden||[]).filter(e=>meineProjektNamen.includes(e.projekt))
                 : teamFilter ? (stunden||[]).filter(e=>e.team===teamFilter) : stunden;
  const vBerichte = projektFilter ? (berichte||[]).filter(b=>meineProjektIds.includes(b.projektId))
                  : teamFilter ? (berichte||[]).filter(b=>b.team===teamFilter) : berichte;
  const vUnterkuenfte = projektFilter ? (unterkuenfte||[]).filter(u=>meineProjektIds.includes(u.projektId)) : unterkuenfte;
  const istAdmin = meineRolle==="Admin";
  const [messprotokolle, setMessprotokolle] = usePersist("baufox_messprotokolle", []);
  const istLeitung = istAdmin || meineRolle==="Bauleiter" || meineRolle==="Vorarbeiter";

  const [tab, setTab] = useState(istAdmin ? "dashboard" : "heute");
  const [menueOffen, setMenueOffen] = useState(false);
  useEffect(()=>{ window.scrollTo({ top:0, behavior:"smooth" }); }, [tab]);
  const [breit, setBreit] = useState(()=>typeof window!=="undefined" && window.innerWidth>=1100);

  // ── Mitteilungen ──
  const [mittOffen, setMittOffen] = useState(false);
  const gelesenKey = "bfx_gelesen_" + (userEmail||"gast");
  const [gelesenAb, setGelesenAb] = useState(()=>Number(localStorage.getItem(gelesenKey)||0));
  const [chatNeu, setChatNeu] = useState([]);
  const [benachAn, setBenachAn] = useState(()=>typeof Notification!=="undefined" && Notification.permission==="granted" && localStorage.getItem("bfx_benach")==="1");
  const benachRef = useRef(Number(localStorage.getItem("bfx_benach_ts_"+(userEmail||""))||Date.now()));

  function piep() {
    try {
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      [[880,0],[1175,0.12]].forEach(([f,t])=>{
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.001, ctx.currentTime+t);
        g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime+t+0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.25);
        o.start(ctx.currentTime+t); o.stop(ctx.currentTime+t+0.3);
      });
    } catch(e) {}
  }

  const VAPID_PUBLIC = "BMp4WGzVxIpgezgfyVmEUWHzZb8FQ7z_TxTecXFZJQ9-hIrdwwQhRUmtuKIbrW1YbLlOwjo8qNPMsUcN0IrtC1Y";
  function b64ZuBytes(b64) {
    const pad = "=".repeat((4 - b64.length % 4) % 4);
    const roh = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...roh].map(c=>c.charCodeAt(0)));
  }
  async function pushAbonnieren() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
      const reg = await navigator.serviceWorker.ready;
      const abo = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64ZuBytes(VAPID_PUBLIC) });
      await supabase.from("push_abos").upsert({ endpoint:abo.endpoint, daten:abo.toJSON(), email:userEmail||"" });
      return true;
    } catch(e) { console.warn("Push-Abo fehlgeschlagen:", e); return false; }
  }

  async function benachAktivieren() {
    if (typeof Notification==="undefined") { alert("Dein Browser unterstützt keine Benachrichtigungen."); return; }
    const erlaubnis = await Notification.requestPermission();
    if (erlaubnis==="granted") {
      localStorage.setItem("bfx_benach","1");
      setBenachAn(true);
      piep();
      const ok = await pushAbonnieren();
      if (ok) console.log("Push-Benachrichtigungen aktiv – auch bei geschlossener App.");
    } else {
      alert("Benachrichtigungen wurden im Browser blockiert. Du kannst sie in den Seiten-Einstellungen (Schloss-Symbol neben der Adresse) wieder erlauben.");
    }
  }

  // Automatisch als Push-Empfänger registrieren, sobald Benachrichtigungen aktiv sind
  useEffect(()=>{
    if (benachAn && typeof Notification!=="undefined" && Notification.permission==="granted") {
      pushAbonnieren();
    }
  }, [benachAn]);

  function systemBenach(text) {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg=>{
          if (reg.showNotification) reg.showNotification("Baufox", { body:text, icon:"/icon-192.png", badge:"/icon-192.png", tag:"baufox" });
          else new Notification("Baufox", { body:text, icon:"/icon-192.png" });
        }).catch(()=>{ try { new Notification("Baufox", { body:text, icon:"/icon-192.png" }); } catch(e){} });
      } else {
        new Notification("Baufox", { body:text, icon:"/icon-192.png" });
      }
    } catch(e) {}
  }
  useEffect(()=>{
    let aktiv = true;
    async function holen() {
      const { data } = await supabase.from("nachrichten").select("*").order("created_at",{ascending:false}).limit(30);
      if (aktiv) setChatNeu(data||[]);
    }
    holen();
    const iv = setInterval(holen, 10000);
    return ()=>{ aktiv=false; clearInterval(iv); };
  }, []);
  const istLeitungM = ["Admin","Projektleiter","Bauleiter","Vorarbeiter"].includes(meineRolle);
  const tsAusId = id => { const m = String(id||"").match(/(\d{13})/); return m ? Number(m[1]) : 0; };
  const heuteM = new Date(); heuteM.setHours(0,0,0,0);
  const mitteilungen = [];
  // Offene Anträge (für Leitung)
  if (istLeitungM) (vAntraege||[]).filter(a=>a.status==="offen").forEach(a=>{
    mitteilungen.push({ id:"an-"+a.id, ts:tsAusId(a.id), text:`Neuer Antrag: ${a.name} – ${a.typ} ${fmtDate(parseDate(a.von))}–${fmtDate(parseDate(a.bis))}`, tab:"antraege", farbe:"#d97706" });
  });
  // Entschiedene eigene Anträge (für Mitarbeiter)
  if (meinMA) (antraege||[]).filter(a=>a.name===meinMA.name && (a.status==="genehmigt"||a.status==="abgelehnt")).forEach(a=>{
    mitteilungen.push({ id:"ae-"+a.id+a.status, ts:tsAusId(a.id), text:`Dein ${a.typ}-Antrag (${fmtDate(parseDate(a.von))}–${fmtDate(parseDate(a.bis))}) wurde ${a.status}`, tab:"antraege", farbe:a.status==="genehmigt"?"#059669":"#dc2626" });
  });
  // Neue Tagesberichte der letzten 5 Tage (für Leitung)
  if (istLeitungM) (vBerichte||[]).forEach(b=>{
    const d = parseDate(b.datum);
    if ((heuteM-d)/86400000 <= 5) {
      const pn = projekte.find(p=>p.id===b.projektId)?.name||"Projekt";
      mitteilungen.push({ id:"tb-"+b.id, ts:tsAusId(b.id)||d.getTime(), text:`Neuer Tagesbericht: ${pn} (${fmtDate(d)}) von ${b.verfasser||"?"}`, tab:"berichte", farbe:"#0891b2" });
    }
  });
  // Werkzeug-Prüfungen (für Leitung)
  if (istLeitungM) (werkzeuge||[]).forEach(w=>{
    if (!w.pruefDatum) return;
    const tage = Math.round((parseDate(w.pruefDatum)-heuteM)/86400000);
    if (tage<0) mitteilungen.push({ id:"wz-"+w.id, ts:parseDate(w.pruefDatum).getTime(), text:`Prüfung überfällig: ${w.name} (seit ${fmtDate(parseDate(w.pruefDatum))})`, tab:"verwaltung", farbe:"#dc2626" });
    else if (tage<=30) mitteilungen.push({ id:"wz-"+w.id, ts:parseDate(w.pruefDatum).getTime()-2592000000, text:`Prüfung fällig in ${tage} Tagen: ${w.name}`, tab:"verwaltung", farbe:"#d97706" });
  });
  // Projekte, die in den nächsten 3 Tagen starten
  (vProjekte||[]).forEach(p=>{
    if (!p.dateStart || p.status==="abgeschlossen") return;
    const tage = Math.round((parseDate(p.dateStart)-heuteM)/86400000);
    if (tage>=0 && tage<=3) mitteilungen.push({ id:"ps-"+p.id, ts:parseDate(p.dateStart).getTime()-259200000, text:tage===0?`Projekt startet heute: ${p.name}`:`Projekt startet in ${tage} Tag(en): ${p.name}`, tab:"projekte", farbe:"#ea580c" });
  });
  // Kosten-Ampel rot (für Admin/PL/BL)
  if (["Admin","Projektleiter","Bauleiter"].includes(meineRolle)) (vProjekte||[]).forEach(p=>{
    const planK = Number(p.planKosten)||0;
    if (!planK) return;
    const minL = Number(p.mindestlohn)||0;
    const ist = (vStunden||[]).filter(e=>e.projekt===p.name).reduce((su,e)=>{
      const ma = mitarbeiter.find(m=>m.id===e.maId);
      return su + (Number(e.arbeitsstunden)||0)*Math.max(Number(ma?.stundensatz)||0,minL) + (Number(e.spesen)||0);
    },0);
    if (ist>planK) mitteilungen.push({ id:"ko-"+p.id, ts:Date.now()-86400000, text:`Kosten über Plan: ${p.name} (${fmtEuro(ist)} von ${fmtEuro(planK)})`, tab:"kosten", farbe:"#dc2626" });
  });
  // Neue Chat-Nachrichten (nicht eigene, nur sichtbare Kanäle, max. 2 Tage alt)
  {
    const sichtbareKanaele = ["Alle", ...(istLeitungM ? TEAM_NAMEN_AKTUELL : (meinMA ? [meinMA.team] : []))];
    chatNeu.forEach(n=>{
      if (!sichtbareKanaele.includes(n.kanal)) return;
      if (n.absender_email && n.absender_email===userEmail) return;
      const ts = new Date(n.created_at).getTime();
      if (Date.now()-ts > 2*86400000) return;
      const kurz = String(n.text||"").slice(0,60) + (String(n.text||"").length>60?"…":"");
      mitteilungen.push({ id:"ch-"+n.id, ts, text:`Chat „${n.kanal}" – ${n.absender}: ${kurz}`, tab:"chat", farbe:"#0891b2" });
    });
  }
  mitteilungen.sort((a,b)=>b.ts-a.ts);
  const ungelesen = mitteilungen.filter(m=>m.ts>gelesenAb).length;

  // Roter Punkt auf dem App-Symbol (installierte App)
  useEffect(()=>{
    try {
      if ("setAppBadge" in navigator) {
        if (ungelesen>0) navigator.setAppBadge(ungelesen).catch(()=>{});
        else navigator.clearAppBadge().catch(()=>{});
      }
    } catch(e) {}
  }, [ungelesen]);

  useEffect(()=>{
    const neue = mitteilungen.filter(m=>m.ts>benachRef.current);
    if (!neue.length) return;
    benachRef.current = Math.max(...neue.map(m=>m.ts));
    localStorage.setItem("bfx_benach_ts_"+(userEmail||""), String(benachRef.current));
    if (benachAn && typeof Notification!=="undefined" && Notification.permission==="granted") {
      piep();
      systemBenach(neue[0].text + (neue.length>1?` (+${neue.length-1} weitere)`:""));
    }
  }, [mitteilungen.length, benachAn]);
  function mittOeffnen() {
    setMittOffen(o=>!o);
    if (!mittOffen) { const jetzt = Date.now(); localStorage.setItem(gelesenKey, String(jetzt)); setGelesenAb(jetzt); }
  }
  useEffect(()=>{
    const h = ()=>setBreit(window.innerWidth>=1100);
    window.addEventListener("resize", h);
    return ()=>window.removeEventListener("resize", h);
  }, []);
  const [dunkel, setDunkel] = useState(()=>{ try { return localStorage.getItem("baufox-theme")==="dunkel"; } catch(e){ return false; } });
  useEffect(()=>{ try { localStorage.setItem("baufox-theme", dunkel?"dunkel":"hell"); } catch(e){} }, [dunkel]);
  if (teams && teams.length) setTeamListe(teams);
  TH = dunkel ? THEME_DUNKEL : THEME_HELL;
  const T = dunkel
    ? { bg:"#0f172a", panel:"#1e293b", panel2:"#334155", text:"#e2e8f0", textMut:"#94a3b8", border:"#334155", tabBar:"#1e293b" }
    : { bg:TH.panel2, panel:"#ffffff", panel2:"#f9fafb", text:"#1e293b", textMut:"#6b7280", border:"#e5e7eb", tabBar:"#ffffff" };
  const warnungen = useMemo(()=>pruefKonflikte(projekte,sonder,mitarbeiter),[projekte,sonder,mitarbeiter]);

  function resetDaten() { if (onReset) onReset(); }

  const alleTabs = [
    { id:"postfach",     label:"Mein Postfach", Icon:Inbox },
    { id:"dashboard",    label:"Dashboard", Icon:LayoutDashboard },
    { id:"kosten",       label:"Kosten", Icon:Euro },
    { id:"assistent",    label:"Assistent", Icon:Sparkles },
    { id:"heute",        label:"Heute", Icon:CalendarDays },
    { id:"woche",        label:"Woche", Icon:Calendar },
    { id:"monat",        label:"Monat", Icon:CalendarRange },
    { id:"stundenzettel",label:"Stundenzettel", Icon:Clock },
    { id:"berichte",     label:"Berichte", Icon:FileText },
    { id:"messprotokolle", label:"Messprotokolle", Icon:Ruler },
    { id:"chat",         label:"Chat", Icon:MessageCircle },
    { id:"antraege",     Icon:TreePalm, label:`Anträge${antraege.filter(a=>a.status==="offen").length>0?` (${antraege.filter(a=>a.status==="offen").length})`:""}` },
    { id:"projekte",     label:"Projekte", Icon:Building2 },
    { id:"mitarbeiter",  label:"Mitarbeiter", Icon:Users },
    { id:"fahrzeuge",    label:"Fahrzeuge", Icon:Truck },
    { id:"unterkuenfte", label:"Unterkünfte", Icon:BedDouble },
    { id:"werkzeuge",    label:"Werkzeuge", Icon:Wrench },
    { id:"verwaltung",   label:"Verwaltung", Icon:Settings },
    { id:"warnungen",    label:`⚠️${warnungen.length>0?` (${warnungen.length})`:""}`},
  ];
  // Verwaltung nur für Admin
  const tabs = alleTabs.filter(t => {
    if (t.id==="verwaltung") return istAdmin;
    return darfTab(meineRolle, t.id);
  });
  // Falls aktueller Tab nicht erlaubt: zurück auf "heute"
  useEffect(()=>{ if(!tabs.some(t=>t.id===tab)) setTab("heute"); }, [meineRolle]); // eslint-disable-line

  return (
    <div style={{ fontFamily:"'Inter', system-ui, sans-serif", minHeight:"100vh", background:T.bg, color:T.text, transition:"background 0.2s" }}>
      <div style={{ position:"sticky", top:0, zIndex:50, background:"linear-gradient(135deg, #1e293b 0%, #334155 100%)", padding:"12px 16px", color:"#fff", display:"flex", alignItems:"center", gap:12, boxShadow:"0 2px 8px #0003" }}>
        {!breit && <button onClick={()=>setMenueOffen(true)} title="Menü öffnen" style={{ background:"#fff2", border:"1px solid #fff4", borderRadius:8, padding:"7px 11px", fontSize:18, color:"#fff", cursor:"pointer", lineHeight:1, display:"flex", alignItems:"center" }}><Menu size={20} /></button>}
        <img src="/icon-192.png" alt="Baufox" style={{ width:38, height:38, borderRadius:10, boxShadow:"0 2px 8px #ea580c55" }} />
        <div>
          <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>Baufox</div>
          <div style={{ fontSize:11, opacity:0.7, textTransform:"uppercase", letterSpacing:1 }}>{(tabs.find(t=>t.id===tab)?.label)||"Montage-Steuerung"}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          {userEmail && <span className="hide-klein" style={{ fontSize:11, color:"#fff", opacity:0.85, marginLeft:8 }}>{userEmail}</span>}
          <span style={{ background:istAdmin?"#16a34a":"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"2px 9px", fontSize:10, color:"#fff", fontWeight:700, marginLeft:2 }}>{meineRolle}</span>
          <button onClick={mittOeffnen} title="Mitteilungen" style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 9px", color:"#fff", cursor:"pointer", marginLeft:4, position:"relative", display:"inline-flex", alignItems:"center" }}>
            <Bell size={15} />
            {ungelesen>0 && <span style={{ position:"absolute", top:-6, right:-6, background:"#dc2626", color:"#fff", borderRadius:99, fontSize:9.5, fontWeight:800, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 4px", boxShadow:"0 1px 4px #0006" }}>{ungelesen>9?"9+":ungelesen}</span>}
          </button>
          <button onClick={()=>setDunkel(d=>!d)} title={dunkel?"Helles Design":"Dunkles Design"} style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 9px", fontSize:13, color:"#fff", cursor:"pointer", marginLeft:4 }}>{dunkel?<Sun size={15} />:<Moon size={15} />}</button>
          {onLogout && <button onClick={onLogout} style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 10px", fontSize:11, color:"#fff", fontWeight:600, cursor:"pointer", marginLeft:4 }}>Abmelden</button>}
        </div>
      </div>

      {mittOffen && (
        <>
          <div onClick={()=>setMittOffen(false)} style={{ position:"fixed", inset:0, zIndex:80 }} />
          <div className="mitt-panel" style={{ position:"fixed", top:60, right:10, width:340, maxWidth:"calc(100vw - 20px)", maxHeight:"70vh", overflowY:"auto", background:TH.panel, border:"1px solid "+TH.border, borderRadius:12, boxShadow:"0 12px 40px #00000033", zIndex:81 }}>
            <div style={{ padding:"11px 14px", borderBottom:"1px solid "+TH.border, fontWeight:800, fontSize:13, color:TH.text, display:"flex", alignItems:"center", gap:7 }}>
              <Bell size={14}/> Mitteilungen
              {!benachAn && <button onClick={benachAktivieren} style={{ marginLeft:"auto", padding:"5px 10px", borderRadius:99, border:"none", background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", fontSize:10.5, fontWeight:700, cursor:"pointer" }}>🔊 Ton & Banner aktivieren</button>}
              {benachAn && <span style={{ marginLeft:"auto", fontSize:10, color:"#059669", fontWeight:700 }}>🔊 aktiv</span>}
            </div>
            {!mitteilungen.length && <div style={{ padding:"22px 14px", fontSize:12.5, color:TH.textMut, textAlign:"center" }}>Alles erledigt – keine Mitteilungen. 🦊</div>}
            {mitteilungen.map(m=>(
              <div key={m.id} onClick={()=>{ if(darfTab(meineRolle,m.tab)){ setTab(m.tab); } setMittOffen(false); }}
                   style={{ padding:"10px 14px", borderBottom:"1px solid "+TH.border, fontSize:12.5, color:TH.text, cursor:"pointer", display:"flex", gap:9, alignItems:"flex-start" }}>
                <span style={{ width:8, height:8, borderRadius:99, background:m.farbe, marginTop:4, flexShrink:0, boxShadow:m.ts>gelesenAb?`0 0 0 3px ${m.farbe}33`:"none" }} />
                <span style={{ flex:1, fontWeight:m.ts>gelesenAb?700:400 }}>{m.text}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {(menueOffen || breit) && (
        <>
          {!breit && <div className="abdunkler" onClick={()=>setMenueOffen(false)} style={{ position:"fixed", inset:0, background:"#0008", zIndex:90 }} />}
          <div className={breit?"":"seitenmenue"} style={{ position:"fixed", left:0, top:breit?63:0, bottom:0, width:250, background:T.tabBar, zIndex:breit?40:91, boxShadow:breit?("2px 0 10px #00000014"):"4px 0 20px #0004", borderRight:"1px solid "+T.border, display:"flex", flexDirection:"column" }}>
            {!breit && <div style={{ background:"linear-gradient(135deg, #1e293b 0%, #334155 100%)", color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <img src="/icon-192.png" alt="" style={{ width:30, height:30, borderRadius:8 }} />
              <div style={{ fontWeight:800, fontSize:16, flex:1 }}>Baufox</div>
              <button onClick={()=>setMenueOffen(false)} style={{ background:"#fff2", border:"1px solid #fff4", borderRadius:6, padding:"4px 10px", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center" }}><X size={15} /></button>
            </div>}
            <div style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setMenueOffen(false);}} style={{
                  display:"block", width:"100%", textAlign:"left", padding:"12px 18px", border:"none", cursor:"pointer", fontSize:14,
                  fontWeight:tab===t.id?700:500,
                  color:tab===t.id?"#ea580c":T.textMut,
                  background:tab===t.id?(dunkel?"#33415588":"#fff7ed"):"transparent",
                  borderLeft:tab===t.id?"4px solid #ea580c":"4px solid transparent"
                }}><span style={{ display:"flex", alignItems:"center", gap:10 }}>{t.Icon && <t.Icon size={17} strokeWidth={2.2} />}{t.label}</span></button>
              ))}
            </div>
          </div>
        </>
      )}

      <div key={tab} className="inhalt" style={{ padding:"18px 14px", maxWidth:1400, margin:"0 auto", marginLeft: breit ? 264 : "auto" }}>
        {meinMA && !istAdmin && (
          <div style={{ background:"#eff6ff", border:"1.5px solid #bfdbfe", borderRadius:8, padding:"8px 14px", marginBottom:14, fontSize:12, color:"#1e40af" }}>
            👋 Angemeldet als <strong>{meinMA.name}</strong> · {meinMA.team} · Rolle: <strong>{meineRolle}</strong>
          </div>
        )}
        {meineRolle==="Unbekannt" && (
          <div style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#92400e" }}>
            ⚠️ Dein Login ist noch keinem Mitarbeiter zugeordnet. Bitte den Administrator, deine E-Mail (<strong>{userEmail}</strong>) in der Mitarbeiter-Verwaltung einzutragen. Bis dahin siehst du nur die Übersichten.
          </div>
        )}
        {tab==="dashboard"    && darfTab(meineRolle,"dashboard")    && <Dashboard mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} fahrzeuge={fahrzeuge} antraege={vAntraege} warnungen={warnungen} unterkuenfte={vUnterkuenfte} setTab={setTab} T={T} />}
        {tab==="kosten"       && darfTab(meineRolle,"kosten")       && <KostenControlling projekte={vProjekte} stunden={vStunden} mitarbeiter={mitarbeiter} unterkuenfte={vUnterkuenfte} T={T} />}
        {tab==="assistent"    && darfTab(meineRolle,"assistent")    && <SmartAssistent projekte={vProjekte} stunden={vStunden} mitarbeiter={mitarbeiter} unterkuenfte={vUnterkuenfte} werkzeuge={werkzeuge} berichte={vBerichte} T={T} />}
        {tab==="heute"        && darfTab(meineRolle,"heute")        && <Tagesansicht   mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} fahrzeuge={fahrzeuge} />}
        {tab==="woche"        && darfTab(meineRolle,"woche")        && <Wochenansicht  mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} />}
        {tab==="monat"        && darfTab(meineRolle,"monat")        && <Monatsansicht  mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} />}
        {tab==="stundenzettel"&& darfTab(meineRolle,"stundenzettel")&& <Stundenzettel  mitarbeiter={vMitarbeiter} projekte={vProjekte} stunden={vStunden} setStunden={setStunden} rolle={meineRolle} meinMA={meinMA} />}
        {tab==="postfach" && <MeinPostfach meinMA={meinMA} meineRolle={meineRolle} userEmail={userEmail} stunden={stunden} projekte={projekte} />}
        {tab==="chat" && darfTab(meineRolle,"chat") && <TeamChat meinMA={meinMA} meineRolle={meineRolle} userEmail={userEmail} />}
        {tab==="berichte"     && darfTab(meineRolle,"berichte")     && <Tagesberichte projekte={vProjekte} mitarbeiter={vMitarbeiter} berichte={vBerichte} setBerichte={setBerichte} rolle={meineRolle} meinMA={meinMA} userEmail={userEmail} />}
        {tab==="messprotokolle" && darfTab(meineRolle,"messprotokolle") && <Messprotokolle projekte={vProjekte} meinMA={meinMA} userEmail={userEmail} messprotokolle={messprotokolle} setMessprotokolle={setMessprotokolle} />}
        {tab==="antraege"     && darfTab(meineRolle,"antraege")     && <Antraege mitarbeiter={vMitarbeiter} antraege={vAntraege} setAntraege={setAntraege} setSonder={setSonder} />}
        {tab==="projekte"     && darfTab(meineRolle,"projekte")     && <ProjektUebersicht projekte={vProjekte} fahrzeuge={fahrzeuge} mitarbeiter={mitarbeiter} />}
        {tab==="mitarbeiter"  && darfTab(meineRolle,"mitarbeiter")  && <MitarbeiterUebersicht mitarbeiter={vMitarbeiter} projekte={vProjekte} />}
        {tab==="fahrzeuge"    && darfTab(meineRolle,"fahrzeuge")    && <FahrzeugUebersicht fahrzeuge={fahrzeuge} projekte={projekte} />}
        {tab==="unterkuenfte" && darfTab(meineRolle,"unterkuenfte") && <UnterkunftUebersicht unterkuenfte={vUnterkuenfte} projekte={vProjekte} />}
        {tab==="werkzeuge"    && darfTab(meineRolle,"werkzeuge")    && <WerkzeugUebersicht werkzeuge={werkzeuge} mitarbeiter={mitarbeiter} />}
        {tab==="verwaltung"   && istAdmin                          && <VerwaltungMemo projekte={projekte} setProjekte={setProjekte} mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} fahrzeuge={fahrzeuge} setFahrzeuge={setFahrzeuge} unterkuenfte={unterkuenfte} setUnterkuenfte={setUnterkuenfte} werkzeuge={werkzeuge} setWerkzeuge={setWerkzeuge} sonder={sonder} antraege={antraege} stunden={stunden} berichte={berichte} teams={teams} setTeams={setTeams} onReset={onReset} dunkel={dunkel} />}
        {tab==="warnungen"    && darfTab(meineRolle,"warnungen")    && <WarnPanel warnungen={warnungen} />}
      </div>
    </div>
  );
}
