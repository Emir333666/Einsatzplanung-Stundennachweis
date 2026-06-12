import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient.js";

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
const TEAM_COLORS = {
  "Team Alpha": { bg:"#1d4ed8", light:"#dbeafe", text:"#1e40af" },
  "Team Beta":  { bg:"#7c3aed", light:"#ede9fe", text:"#6d28d9" },
  "Team Gamma": { bg:"#0f766e", light:"#ccfbf1", text:"#0d9488" },
  "Team Delta": { bg:"#b45309", light:"#fef3c7", text:"#92400e" },
};
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
  return TEAM_COLORS[team] || { bg:"#6b7280", light:"#f3f4f6", text:"#374151" };
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
        <button onClick={() => setDatum(isoDate(new Date()))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #1d4ed8", background:"#dbeafe", color:"#1d4ed8", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      {isWeekend(d) && (
        <div style={{ background:"#fef9c3", border:"1.5px solid #fcd34d", borderRadius:8, padding:"10px 14px", marginBottom:14, color:"#92400e", fontSize:13, fontWeight:600 }}>
          🏖 Wochenende – kein regulärer Arbeitstag
        </div>
      )}

      {/* Zusammenfassung */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:20 }}>
        {[
          { label:"Auf Baustelle", wert:aufBaustelle.length, farbe:"#1d4ed8" },
          { label:"Abwesend",      wert:abwesend.length,     farbe:"#dc2626" },
          { label:"Verfügbar",     wert:frei.length,          farbe:"#16a34a" },
        ].map(k => (
          <div key={k.label} style={{ background:TH.panel, border:`1.5px solid ${k.farbe}33`, borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.farbe }}>{k.wert}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Baustellen-Karten */}
      {aufBaustelle.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>🏗 Heute auf Baustelle</div>
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
                <div key={id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden" }}>
                  <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontWeight:700 }}>{p.name}</span>
                    <span style={{ fontSize:12, opacity:0.85 }}>📍 {p.ort}</span>
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
                    {p.bemerkung && <div style={{ gridColumn:"1/-1", marginTop:4, padding:"5px 10px", background:"#fef9c3", borderRadius:6, color:"#92400e", fontSize:11 }}>💬 {p.bemerkung}</div>}
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
          <div style={{ fontWeight:700, fontSize:13, color:TH.text, marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>🚫 Abwesend</div>
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

  const sichtbareTeams = filterTeam==="Alle" ? Object.keys(TEAM_COLORS) : [filterTeam];
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
          {["Alle",...Object.keys(TEAM_COLORS)].map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>{setKw(getKW(heute));setKwYear(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #1d4ed8", background:"#dbeafe", color:"#1d4ed8", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
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
                    color: isHeuteFn ? "#1d4ed8" : wend ? "#d1d5db" : "#6b7280",
                    borderTop: isHeuteFn ? "2px solid #1d4ed8" : undefined }}>
                    <div style={{ fontWeight:700 }}>{WOCHENTAGE[d.getDay()]}</div>
                    <div style={{ fontSize:13, fontWeight:800, color: isHeuteFn ? "#1d4ed8" : wend ? "#9ca3af" : "#374151" }}>{fmtDateShort(d)}</div>
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
                      <div style={{ fontWeight:ma.rolle==="Vorarbeiter"?700:400, color:ma.rolle==="Vorarbeiter"?col.bg:"#374151" }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</div>
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
                      if (!eintrag) return <td key={isoDate(d)} style={{ ...tdS(), background: isHeuteFn?"#eff6ff":"#fff" }} />;

                      if (eintrag.typ==="Projekt") {
                        const p = eintrag.projekt;
                        const isStart = isoDate(d)===p.dateStart;
                        return (
                          <td key={isoDate(d)} style={{ ...tdS(), background:col.light, padding:"2px 4px" }}>
                            <div style={{ background:col.light, border:`1.5px solid ${col.bg}`, borderRadius:5, padding:"3px 6px", fontSize:10, borderLeft:isStart?`4px solid ${col.bg}`:undefined }}>
                              <div style={{ fontWeight:600, color:col.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:90 }}>{isStart?"▶ ":""}{p.name}</div>
                              {isStart && <div style={{ fontSize:9, color:"#6b7280" }}>📍 {p.ort}</div>}
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
        <button onClick={()=>{setMonat(heute.getMonth());setJahr(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #1d4ed8", background:"#dbeafe", color:"#1d4ed8", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
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
                    color:isH?"#1d4ed8":wend?"#d1d5db":"#6b7280", borderTop:isH?"2px solid #1d4ed8":undefined }}>
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
                    <div style={{ fontWeight:ma.rolle==="Vorarbeiter"?700:400, color:ma.rolle==="Vorarbeiter"?col.bg:"#374151", fontSize:11 }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</div>
                    <div style={{ fontSize:9, color:"#9ca3af" }}>{ma.team}</div>
                  </td>
                  {tage.map(d => {
                    const wend = isWeekend(d);
                    const proj = getProjektForTeamDate(projekte, ma.team, d);
                    const se = getSonderForMaDate(sonder, ma.id, d);
                    const eintrag = se || (proj?{typ:"Projekt",projekt:proj}:null);
                    const isH = isoDate(d)===isoDate(heute);

                    if (wend && !eintrag) return <td key={d.getDate()} style={{ background:TH.panel2, padding:0 }} />;
                    if (!eintrag) return <td key={d.getDate()} style={{ background:isH?"#eff6ff":"#fff", padding:0 }} />;

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
        {Object.entries(TEAM_COLORS).map(([t,c])=><span key={t} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, background:c.light, border:`1px solid ${c.bg}44`, borderRadius:6, padding:"2px 8px", color:c.text }}>■ {t}</span>)}
        {Object.entries(EINSATZ_FARBEN).slice(1).map(([k,v])=><span key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, background:v.bg, border:`1px solid ${v.border}`, borderRadius:6, padding:"2px 8px", color:v.badge }}>● {k}</span>)}
      </div>
    </div>
  );
}

// ─── STUNDENZETTEL ─────────────────────────────────────────────────────────────
function Stundenzettel({ mitarbeiter, projekte, stunden, setStunden, rolle, meinMA }) {
  const istLeitung = rolle==="Admin" || rolle==="Bauleiter" || rolle==="Vorarbeiter";
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
      <div class="kopf"><div class="logo">🦊</div><div><h1>Baufox – Stundennachweis</h1><p class="unter">Montage-Steuerung</p></div></div>
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
    const w = window.open("", "_blank");
    if (!w) { alert("Bitte Pop-ups für diese Seite erlauben, um das PDF zu erstellen."); return; }
    w.document.write(html);
    w.document.close();
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
            👷 Deine persönliche Stundenübersicht{meinMA?` – ${meinMA.name}`:""}. Stunden trägt dein Vorarbeiter ein.
          </div>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          {istLeitung && <button onClick={()=>setAnsicht("erfassen")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, background:ansicht==="erfassen"?col.bg:"#fff", color:ansicht==="erfassen"?"#fff":"#374151", fontWeight:600 }}>✏️ Erfassen</button>}
          <button onClick={()=>setAnsicht("uebersicht")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, background:ansicht==="uebersicht"?col.bg:"#fff", color:ansicht==="uebersicht"?"#fff":"#374151", fontWeight:600 }}>📋 Übersicht ({gespeichert.length})</button>
        </div>
      </div>

      {va && ansicht==="erfassen" && (
        <div style={{ background:col.light, border:`1.5px solid ${col.bg}44`, borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", gap:20, flexWrap:"wrap", fontSize:12 }}>
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
                    <tr key={ma.id} style={{ borderBottom:"1px solid "+TH.border, background:isVA?col.light:"#fff" }}>
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
          <div style={{ marginTop:12, background:"#f8fafc", border:"1.5px solid "+TH.border, borderRadius:8, padding:"10px 14px", display:"flex", gap:24, flexWrap:"wrap", fontSize:12 }}>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Gesamt heute </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.reduce((s,ma)=>s+calcStunden(getFeld(ma.id,"start"),getFeld(ma.id,"end"),Number(getFeld(ma.id,"pause",0))),0).toFixed(2)} h</span></div>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Eingetragen </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.filter(ma=>getFeld(ma.id,"start")).length}/{teamMA.length}</span></div>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <button onClick={speichern} style={{ padding:"9px 24px", borderRadius:8, background:col.bg, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>💾 Speichern</button>
            <button onClick={()=>setEntwurf({})} style={{ padding:"9px 16px", borderRadius:8, background:TH.panel2, color:TH.text, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13 }}>✕ Reset</button>
          </div>
        </>
      )}

      {ansicht==="uebersicht" && (
        <div>
          {!gespeichert.length ? (
            <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:32, textAlign:"center", color:"#9ca3af" }}>Noch keine Stundenzettel gespeichert</div>
          ) : (
            <>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginBottom:12 }}>
                <button onClick={excelExport} style={{ padding:"9px 18px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>📊 Excel (CSV)</button>
                <button onClick={pdfExport} style={{ padding:"9px 18px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>📄 Als PDF exportieren</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:18 }}>
                {Object.values(summaryByMA).map(s=>{
                  const ma=mitarbeiter.find(m=>m.name===s.name);
                  const c=ma?getTeamColor(ma.team):{bg:"#6b7280",light:"#f3f4f6",text:"#374151"};
                  return (
                    <div key={s.name} style={{ border:`1.5px solid ${c.bg}`, borderRadius:10, overflow:"hidden" }}>
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
function ProjektUebersicht({ projekte, fahrzeuge }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {projekte.map(p=>{
        const col=getTeamColor(p.team), fzg=fahrzeuge.find(f=>f.id===p.fzg), sc=STATUS_FARBEN[p.status]||"#6b7280";
        return (
          <div key={p.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px #0001" }}>
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
              <Info label="Fahrzeug" value={fzg?`${fzg.kz} (${fzg.typ})`:"–"} />
              {p.ansprechpartner && <Info label="Ansprechpartner" value={p.ansprechpartner} />}
              {p.auftragssumme && <Info label="Auftragssumme" value={Number(p.auftragssumme).toLocaleString("de-DE")+" €"} />}
              {p.planStunden && <Info label="Geplante Stunden" value={p.planStunden+" h"} />}
              {p.beschreibung && <div style={{ gridColumn:"1/-1", marginTop:2, fontSize:11, color:"#6b7280" }}>{p.beschreibung}</div>}
              {p.bemerkung&&<div style={{ gridColumn:"1/-1", marginTop:4, padding:"6px 10px", background:"#fef9c3", borderRadius:6, color:"#92400e", fontSize:11 }}>💬 {p.bemerkung}</div>}
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
          <div key={f.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}>🚐 {f.kz}</div>
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
    return <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Unterkünfte angelegt. Lege welche unter „Verwaltung → Unterkünfte" an.</div>;
  }
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
      {unterkuenfte.map(u=>{
        const proj = projekte.find(p=>p.id===u.projektId);
        const col = proj ? getTeamColor(proj.team) : { bg:"#0f766e", light:"#ccfbf1", text:"#0d9488" };
        return (
          <div key={u.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}>🏨 {u.name||"Unterkunft"}</div>
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
        <button onClick={()=>setSeite("antrag")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="antrag"?"#1d4ed8":"#fff", color:seite==="antrag"?"#fff":"#374151" }}>📝 Antrag stellen</button>
        <button onClick={()=>setSeite("freigabe")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="freigabe"?"#1d4ed8":"#fff", color:seite==="freigabe"?"#fff":"#374151" }}>
          ✅ Freigabe {offen.length>0 && <span style={{ background:"#dc2626", color:"#fff", borderRadius:99, padding:"0 7px", fontSize:11, marginLeft:4 }}>{offen.length}</span>}
        </button>
      </div>

      {seite === "antrag" && (
        <div style={{ maxWidth:520 }}>
          <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:12, padding:"18px 20px" }}>
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
                      background:typ===t?ef.bg:"#fff", color:typ===t?ef.badge:"#6b7280"
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
                📅 {fmtDate(parseDate(von))} – {fmtDate(parseDate(bis))} · <strong>{tageAnzahl(von,bis)} Tage</strong>
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
            <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:"14px 16px", color:"#166534", fontSize:13, marginBottom:24 }}>✅ Keine offenen Anträge</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
              {offen.map(a => {
                const c = getTeamColor(a.team);
                const ef = EINSATZ_FARBEN[a.typ] || EINSATZ_FARBEN["Frei"];
                return (
                  <div key={a.id} style={{ border:`1.5px solid ${ef.border}`, borderRadius:10, overflow:"hidden", boxShadow:"0 1px 4px #0001" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:ef.bg }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:14, color:TH.text }}>{a.maName}</span>
                        <span style={{ marginLeft:8 }}><Badge color={c.bg}>{a.team}</Badge></span>
                        <span style={{ marginLeft:6 }}><Badge color={ef.badge}>{a.typ}</Badge></span>
                      </div>
                    </div>
                    <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                      <div style={{ fontSize:13 }}>
                        <div style={{ fontWeight:600, color:TH.text }}>📅 {fmtDate(parseDate(a.dateStart))} – {fmtDate(parseDate(a.dateEnd))}</div>
                        {a.grund && <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>💬 {a.grund}</div>}
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
function Modal({ titel, onClose, children, farbe="#1d4ed8" }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"#0007", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 16px", zIndex:100, overflowY:"auto" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:TH.panel, borderRadius:14, width:"100%", maxWidth:520, boxShadow:"0 10px 40px #0004" }}>
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
function btnPrimary(farbe="#1d4ed8") { return { padding:"10px 20px", borderRadius:8, background:farbe, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }; }
const btnGhost = () => ({ padding:"10px 16px", borderRadius:8, background:TH.panel2, color:TH.text, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13 });

// ─── VERWALTUNG (Stammdaten anlegen/bearbeiten/löschen) ───────────────────────
function Verwaltung({ projekte, setProjekte, mitarbeiter, setMitarbeiter, fahrzeuge, setFahrzeuge, unterkuenfte, setUnterkuenfte, werkzeuge, setWerkzeuge, sonder, antraege, stunden, berichte, onReset }) {

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

  const teamNamen = Object.keys(TEAM_COLORS);
  const vorarbeiterNamen = mitarbeiter.filter(m=>m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter").map(m=>m.name);

  function neueId(prefix, liste) {
    let n = 1;
    while (liste.some(x => x.id === prefix+n)) n++;
    return prefix+n;
  }

  // ── Projekt-Formular ──
  function ProjektForm({ data }) {
    const [f, setF] = useState(data || { id:"", name:"", nummer:"", kunde:"", auftraggeber:"", ansprechpartner:"", apTel:"", apEmail:"", ort:"", land:"", dateStart:isoDate(new Date()), dateEnd:isoDate(new Date()), team:teamNamen[0], status:"geplant", fzg:"", vorarbeiter:"", auftragssumme:"", planStunden:"", planKosten:"", beschreibung:"", bemerkung:"" });
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:2 }}><Feld label="Projektname"><input style={inpS()} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="z.B. Kranbahn Halle B" /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Projektnummer"><input style={inpS()} value={f.nummer||""} onChange={e=>set("nummer",e.target.value)} placeholder="P-2026-001" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Kunde"><input style={inpS()} value={f.kunde} onChange={e=>set("kunde",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Auftraggeber"><input style={inpS()} value={f.auftraggeber||""} onChange={e=>set("auftraggeber",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Ansprechpartner Kunde"><input style={inpS()} value={f.ansprechpartner||""} onChange={e=>set("ansprechpartner",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Telefon AP"><input style={inpS()} value={f.apTel||""} onChange={e=>set("apTel",e.target.value)} /></Feld></div>
        </div>
        <Feld label="E-Mail Ansprechpartner"><input style={inpS()} value={f.apEmail||""} onChange={e=>set("apEmail",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Ort"><input style={inpS()} value={f.ort} onChange={e=>set("ort",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Land"><input style={inpS()} value={f.land||""} onChange={e=>set("land",e.target.value)} placeholder="Deutschland" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Start"><input type="date" style={inpS()} value={f.dateStart} onChange={e=>set("dateStart",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Ende"><input type="date" style={inpS()} value={f.dateEnd} onChange={e=>set("dateEnd",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Status"><select style={inpS()} value={f.status} onChange={e=>set("status",e.target.value)}>{Object.keys(STATUS_FARBEN).map(s=><option key={s}>{s}</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Vorarbeiter"><select style={inpS()} value={f.vorarbeiter} onChange={e=>set("vorarbeiter",e.target.value)}><option value="">–</option>{vorarbeiterNamen.map(v=><option key={v}>{v}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Fahrzeug"><select style={inpS()} value={f.fzg} onChange={e=>set("fzg",e.target.value)}><option value="">–</option>{fahrzeuge.map(fz=><option key={fz.id} value={fz.id}>{fz.kz}</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Auftragssumme (€)"><input type="number" style={inpS()} value={f.auftragssumme||""} onChange={e=>set("auftragssumme",e.target.value)} placeholder="0" /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Geplante Stunden"><input type="number" style={inpS()} value={f.planStunden||""} onChange={e=>set("planStunden",e.target.value)} placeholder="0" /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Geplante Kosten (€)"><input type="number" style={inpS()} value={f.planKosten||""} onChange={e=>set("planKosten",e.target.value)} placeholder="0" /></Feld></div>
        </div>
        <Feld label="Beschreibung der Arbeiten"><input style={inpS()} value={f.beschreibung||""} onChange={e=>set("beschreibung",e.target.value)} placeholder="Kurzbeschreibung" /></Feld>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} placeholder="z.B. Anreise Sonntag, Hotel gebucht" /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Rolle"><select style={inpS()} value={f.rolle} onChange={e=>set("rolle",e.target.value)}><option>Monteur</option><option>Vorarbeiter</option><option>Bauleiter</option></select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Urlaubstage"><input type="number" style={inpS()} value={f.urlaub} onChange={e=>set("urlaub",Number(e.target.value))} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Krankheitstage"><input type="number" style={inpS()} value={f.krank} onChange={e=>set("krank",Number(e.target.value))} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS()} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="TÜV (JJJJ-MM)"><input style={inpS()} value={f.tuev} onChange={e=>set("tuev",e.target.value)} placeholder="2026-08" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Ansprechpartner"><input style={inpS()} value={f.ansprechpartner} onChange={e=>set("ansprechpartner",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Telefon"><input style={inpS()} value={f.tel} onChange={e=>set("tel",e.target.value)} /></Feld></div>
        </div>
        <Feld label="E-Mail"><input style={inpS()} value={f.email} onChange={e=>set("email",e.target.value)} placeholder="kontakt@hotel.de" /></Feld>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Check-in"><input type="date" style={inpS()} value={f.checkin} onChange={e=>set("checkin",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Check-out"><input type="date" style={inpS()} value={f.checkout} onChange={e=>set("checkout",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Zimmer"><input type="number" style={inpS()} value={f.zimmer} onChange={e=>set("zimmer",e.target.value)} placeholder="3" /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Kosten/Nacht (€)"><input type="number" style={inpS()} value={f.kostenNacht} onChange={e=>set("kostenNacht",e.target.value)} placeholder="80" /></Feld></div>
        </div>
        <Feld label="Projekt"><select style={inpS()} value={f.projektId} onChange={e=>set("projektId",e.target.value)}><option value="">– kein Projekt –</option>{projekte.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Feld>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
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
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Typ"><input style={inpS()} value={f.typ} onChange={e=>set("typ",e.target.value)} placeholder="Schweißgerät, Bohrmaschine…" /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Seriennummer"><input style={inpS()} value={f.seriennummer} onChange={e=>set("seriennummer",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Zustand"><select style={inpS()} value={f.zustand} onChange={e=>set("zustand",e.target.value)}><option>gut</option><option>gebraucht</option><option>defekt</option><option>in Reparatur</option></select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Prüftermin (z.B. DGUV)"><input type="date" style={inpS()} value={f.pruefDatum||""} onChange={e=>set("pruefDatum",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Zugeordneter Mitarbeiter"><select style={inpS()} value={f.zugeordnetMa||""} onChange={e=>set("zugeordnetMa",e.target.value)}><option value="">–</option>{mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Oder Team"><select style={inpS()} value={f.team||""} onChange={e=>set("team",e.target.value)}><option value="">–</option>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
        </div>
        <Feld label="Bemerkung"><input style={inpS()} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary("#475569")}>💾 Speichern</button>
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
    { id:"projekte", label:`🏗 Projekte (${projekte.length})` },
    { id:"mitarbeiter", label:`👷 Mitarbeiter (${mitarbeiter.length})` },
    { id:"fahrzeuge", label:`🚐 Fahrzeuge (${fahrzeuge.length})` },
    { id:"unterkuenfte", label:`🏨 Unterkünfte (${(unterkuenfte||[]).length})` },
    { id:"werkzeuge", label:`🔧 Werkzeuge (${(werkzeuge||[]).length})` },
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSub(t.id)} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid "+TH.border, cursor:"pointer", fontSize:13, fontWeight:600, background:sub===t.id?"#1e3a5f":"#fff", color:sub===t.id?"#fff":"#374151" }}>{t.label}</button>
        ))}
        <button onClick={backupHerunterladen} title="Alle Daten als Sicherungsdatei herunterladen" style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}>💾 Backup herunterladen</button>
        {onReset && <button onClick={onReset} style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:8, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer", fontSize:12 }}>↺ Demo-Daten zurücksetzen</button>}
      </div>

      {sub==="projekte" && (
        <>
          <button onClick={()=>setModal({art:"projekt"})} style={{ ...btnPrimary(), marginBottom:14 }}>+ Neues Projekt</button>
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
                        <button onClick={()=>setModal({art:"projekt",data:p})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("projekt",p.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
          <button onClick={()=>setModal({art:"ma"})} style={{ ...btnPrimary(), marginBottom:14 }}>+ Neuer Mitarbeiter</button>
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
                        <button onClick={()=>setModal({art:"ma",data:m})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("ma",m.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
          <button onClick={()=>setModal({art:"fzg"})} style={{ ...btnPrimary(), marginBottom:14 }}>+ Neues Fahrzeug</button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Kennzeichen","Typ","Team","TÜV","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {fahrzeuge.map(f=>{
                  const col=getTeamColor(f.team);
                  return (
                    <tr key={f.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:`4px solid ${col.bg}` }}>🚐 {f.kz}</td>
                      <td style={tdS()}>{f.typ}</td>
                      <td style={tdS()}><Badge color={col.bg}>{f.team}</Badge></td>
                      <td style={tdS()}>{f.tuev}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"fzg",data:f})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("fzg",f.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
          <button onClick={()=>setModal({art:"unterkunft"})} style={{ ...btnPrimary("#0f766e"), marginBottom:14 }}>+ Neue Unterkunft</button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Name","Adresse","Check-in","Check-out","Zimmer","Projekt","€/Nacht","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {(unterkuenfte||[]).map(u=>{
                  const proj=projekte.find(p=>p.id===u.projektId);
                  return (
                    <tr key={u.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:"4px solid #0f766e" }}>🏨 {u.name}</td>
                      <td style={tdS()}>{u.adresse||"–"}</td>
                      <td style={tdS()}>{u.checkin?fmtDateShort(parseDate(u.checkin)):"–"}</td>
                      <td style={tdS()}>{u.checkout?fmtDateShort(parseDate(u.checkout)):"–"}</td>
                      <td style={{ ...tdS(), textAlign:"center" }}>{u.zimmer||"–"}</td>
                      <td style={tdS()}>{proj?proj.name:"–"}</td>
                      <td style={{ ...tdS(), textAlign:"center" }}>{u.kostenNacht?u.kostenNacht+" €":"–"}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"unterkunft",data:u})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("unterkunft",u.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
          <button onClick={()=>setModal({art:"werkzeug"})} style={{ ...btnPrimary("#475569"), marginBottom:14 }}>+ Neues Werkzeug</button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Bezeichnung","Typ","Seriennr.","Zustand","Zugeordnet","Prüftermin","Aktion"].map(h=><th key={h} style={thS()}>{h}</th>)}</tr></thead>
              <tbody>
                {(werkzeuge||[]).map(w=>{
                  const ma=mitarbeiter.find(m=>m.id===w.zugeordnetMa);
                  return (
                    <tr key={w.id} style={{ borderBottom:"1px solid "+TH.border }}>
                      <td style={{ ...tdS(), fontWeight:600, borderLeft:"4px solid #475569" }}>🔧 {w.name}</td>
                      <td style={tdS()}>{w.typ||"–"}</td>
                      <td style={tdS()}>{w.seriennummer||"–"}</td>
                      <td style={tdS()}>{w.zustand||"–"}</td>
                      <td style={tdS()}>{ma?ma.name:(w.team||"–")}</td>
                      <td style={tdS()}>{w.pruefDatum?fmtDateShort(parseDate(w.pruefDatum)):"–"}</td>
                      <td style={{ ...tdS(), whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"werkzeug",data:w})} style={{ ...btnGhost(), padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("werkzeug",w.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:TH.panel, color:"#dc2626", cursor:"pointer" }}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
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
  if (!warnungen.length) return <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:"12px 16px", color:"#166534", fontSize:13 }}>✅ Keine Konflikte gefunden</div>;
  return <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{warnungen.map((w,i)=><div key={i} style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"10px 14px", color:"#92400e", display:"flex", gap:10, fontSize:13 }}><span style={{ fontSize:18 }}>⚠️</span><div><strong style={{ marginRight:6 }}>{w.typ}:</strong>{w.msg}</div></div>)}</div>;
}

// ─── ADMIN-DASHBOARD (Kontrollzentrum) ────────────────────────────────────────
function KennzahlKarte({ wert, label, farbe, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ background:TH.panel, border:`1.5px solid ${farbe}33`, borderRadius:12, padding:"14px 16px", cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px #0001", transition:"all .15s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:22 }}>{icon}</span>
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
    return <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Werkzeuge angelegt. Lege welche unter „Verwaltung → Werkzeuge" an.</div>;
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
            <div key={w.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden", background:TH.panel }}>
              <div style={{ background:col.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}>🔧 {w.name}</div>
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
  const istLeitung = rolle==="Admin" || rolle==="Bauleiter" || rolle==="Vorarbeiter";
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

  return (
    <div>
      {istLeitung && !zeigeForm && (
        <button onClick={()=>setZeigeForm(true)} style={{ padding:"10px 20px", borderRadius:8, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13, marginBottom:16 }}>+ Neuer Tagesbericht</button>
      )}

      {istLeitung && zeigeForm && (
        <div style={{ background:TH.panel, border:"1.5px solid #ea580c", borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:"#ea580c" }}>📝 Neuer Tagesbericht</div>
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
            <button onClick={speichern} disabled={laedt} style={{ ...btnPrimary("#ea580c"), opacity:laedt?0.6:1 }}>💾 Bericht speichern</button>
            <button onClick={()=>{setF(leer);setZeigeForm(false);}} style={btnGhost()}>Abbrechen</button>
          </div>
        </div>
      )}

      {!sortiert.length ? (
        <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Tagesberichte vorhanden.</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {sortiert.map(b=>{
            const proj = projekte.find(p=>p.id===b.projektId);
            const col = proj ? getTeamColor(proj.team) : { bg:"#6b7280", light:"#f3f4f6" };
            return (
              <div key={b.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden", background:TH.panel }}>
                <div style={{ background:col.bg, color:"#fff", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:6 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>📝 {fmtDate(parseDate(b.datum))} · {proj?.name||"Projekt gelöscht"}</span>
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
    const lohn = eintraege.reduce((s,e)=>{ const ma=mitarbeiter.find(m=>m.id===e.maId); return s+(Number(e.arbeitsstunden)||0)*(Number(ma?.stundensatz)||0); },0);
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
  const teams = teamNamen.map(team=>{
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
    if (tage<0) hinweise.push({ art:"rot", text:`🔧 Prüfung überfällig: ${w.name} (seit ${fmtDate(parseDate(w.pruefDatum))})` });
    else if (tage<=30) hinweise.push({ art:"gelb", text:`🔧 Prüfung fällig in ${tage} Tagen: ${w.name}` });
  });
  projekte.filter(p=>p.status==="aktiv").forEach(p=>{
    const { anzahl } = istKosten(p);
    if (anzahl===0) hinweise.push({ art:"gelb", text:`⏱ Aktives Projekt ohne erfasste Stunden: ${p.name}` });
    if (!(Number(p.planKosten)>0)) hinweise.push({ art:"grau", text:`📋 Keine Plankosten hinterlegt: ${p.name} (für Prognose nötig)` });
  });
  mitarbeiter.filter(m=>!m.stundensatz).slice(0,5).forEach(m=>{
    hinweise.push({ art:"grau", text:`💰 Stundensatz fehlt: ${m.name}` });
  });

  const hinweisFarben = { rot:{bg:"#fef2f2",bd:"#fca5a5",tx:"#991b1b"}, gelb:{bg:"#fff7ed",bd:"#fdba74",tx:"#92400e"}, grau:{bg:TH.panel2,bd:TH.border,tx:TH.textMut} };

  return (
    <div>
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>🤖 Assistent</div>
      <div style={{ fontSize:12, color:"#6b7280", marginBottom:16 }}>Automatische Prognosen und Hinweise – berechnet aus deinen Stunden, Berichten (Leistungsstand!) und Planwerten.</div>

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}>📈 Kostenprognosen</div>
      {!prognosen.length ? (
        <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:16, fontSize:12, color:TH.textMut, marginBottom:18 }}>
          Noch keine Prognose möglich. Dafür braucht ein Projekt: erfasste Stunden + einen Tagesbericht mit Leistungsstand (%) + Plankosten.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
          {prognosen.map(({p,ist,leistung,planK,prognose,delta})=>{
            const farbe = delta==null ? "#6b7280" : delta<=0 ? "#16a34a" : delta<=10 ? "#d97706" : "#dc2626";
            return (
              <div key={p.id} style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderLeft:"5px solid "+farbe, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>{p.name}</div>
                Stand: <b>{leistung}%</b> fertig · bisher <b>{fmtEuro(ist)}</b> → hochgerechnet <b style={{color:farbe}}>{fmtEuro(prognose)}</b>
                {planK>0 && <> (Plan {fmtEuro(planK)}{delta!=null && <b style={{color:farbe}}> · {delta>0?"+":""}{delta.toFixed(0)} %</b>})</>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}>👷 Team-Verfügbarkeit</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10, marginBottom:18 }}>
        {teams.map(t=>{
          const col=getTeamColor(t.team);
          return (
            <div key={t.team} style={{ background:TH.panel, border:`1.5px solid ${col.bg}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
              <div style={{ fontWeight:700, color:col.bg, marginBottom:3 }}>{t.team}</div>
              {t.freiAb==="sofort" ? <span style={{ color:"#16a34a", fontWeight:700 }}>✓ sofort verfügbar</span> : <>frei ab <b>{t.freiAb}</b><div style={{ color:TH.textMut, fontSize:11 }}>bis dahin: {t.projekt}</div></>}
            </div>
          );
        })}
      </div>

      <div style={{ fontWeight:700, fontSize:13, color:tw, marginBottom:8 }}>💡 Hinweise</div>
      {!hinweise.length ? (
        <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:14, fontSize:12, color:"#166534" }}>✓ Alles im grünen Bereich – keine offenen Hinweise!</div>
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

// ─── KOSTEN-CONTROLLING (Plan vs. Ist mit Ampel) ──────────────────────────────
function KostenControlling({ projekte, stunden, mitarbeiter, unterkuenfte, T }) {
  const tw = (T && T.text) || "#1e3a5f";
  const fmtEuro = n => (Number(n)||0).toLocaleString("de-DE",{minimumFractionDigits:0,maximumFractionDigits:0})+" €";

  const auswertung = useMemo(()=>projekte.map(p=>{
    const eintraege = (stunden||[]).filter(e=>e.projekt===p.name);
    const istStunden = eintraege.reduce((s,e)=>s+(Number(e.arbeitsstunden)||0),0);
    const lohn = eintraege.reduce((s,e)=>{
      const ma = mitarbeiter.find(m=>m.id===e.maId);
      return s + (Number(e.arbeitsstunden)||0) * (Number(ma?.stundensatz)||0);
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
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>💰 Kosten-Controlling</div>
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
            <div key={p.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden", background:TH.panel }}>
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
        {!projekte.length && <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:24, textAlign:"center", color:"#9ca3af" }}>Noch keine Projekte angelegt.</div>}
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
        <KennzahlKarte wert={aktiveProjekte.length} label="Aktive Projekte heute" farbe={farbBlau} icon="🏗" onClick={()=>setTab("projekte")} />
        <KennzahlKarte wert={aktiveTeams.length} label="Teams im Einsatz" farbe={farbBlau} icon="👥" onClick={()=>setTab("woche")} />
        <KennzahlKarte wert={imEinsatz.length} label="Mitarbeiter im Einsatz" farbe={farbGruen} icon="👷" onClick={()=>setTab("heute")} />
        <KennzahlKarte wert={imUrlaub.length} label="Im Urlaub" farbe={farbOrange} icon="🌴" />
        <KennzahlKarte wert={krank.length} label="Krank gemeldet" farbe={farbRot} icon="🤒" />
        <KennzahlKarte wert={ohneEinsatz.length} label="Ohne Einsatz" farbe={farbGrau} icon="🆓" />
      </div>

      {/* Handlungsbedarf */}
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>⚡ Handlungsbedarf</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:24 }}>

        {/* Offene Anträge */}
        <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:10, overflow:"hidden" }}>
          <div style={{ background: offeneAntraege.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: offeneAntraege.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setTab("antraege")}>
            <span>🌴 Offene Urlaubsanträge</span><span>{offeneAntraege.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {offeneAntraege.length===0 ? <span style={{ color:"#9ca3af" }}>Keine offenen Anträge</span> :
              offeneAntraege.slice(0,4).map(a=><div key={a.id} style={{ padding:"3px 0" }}>{a.maName} · {a.typ} · {fmtDateShort(parseDate(a.dateStart))}–{fmtDateShort(parseDate(a.dateEnd))}</div>)}
          </div>
        </div>

        {/* Projekte ohne Vorarbeiter */}
        <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:10, overflow:"hidden" }}>
          <div style={{ background: projOhneVA.length?"#fee2e2":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneVA.length?"#991b1b":"#166534", display:"flex", justifyContent:"space-between" }}>
            <span>⚠️ Projekte ohne Vorarbeiter</span><span>{projOhneVA.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneVA.length===0 ? <span style={{ color:"#9ca3af" }}>Alle Projekte haben einen Vorarbeiter</span> :
              projOhneVA.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.team}</div>)}
          </div>
        </div>

        {/* Projekte ohne Fahrzeug */}
        <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:10, overflow:"hidden" }}>
          <div style={{ background: projOhneFzg.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneFzg.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between" }}>
            <span>🚐 Projekte ohne Fahrzeug</span><span>{projOhneFzg.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneFzg.length===0 ? <span style={{ color:"#9ca3af" }}>Alle aktiven Projekte haben ein Fahrzeug</span> :
              projOhneFzg.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.team}</div>)}
          </div>
        </div>

        {/* Projekte ohne Unterkunft */}
        <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:10, overflow:"hidden" }}>
          <div style={{ background: projOhneUnterkunft.length?"#fef3c7":"#f0fdf4", padding:"8px 14px", fontWeight:700, fontSize:13, color: projOhneUnterkunft.length?"#92400e":"#166534", display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setTab("unterkuenfte")}>
            <span>🏨 Projekte ohne Unterkunft</span><span>{projOhneUnterkunft.length}</span>
          </div>
          <div style={{ padding:"8px 14px", fontSize:12, color:TH.text }}>
            {projOhneUnterkunft.length===0 ? <span style={{ color:"#9ca3af" }}>Alle aktiven Projekte haben eine Unterkunft</span> :
              projOhneUnterkunft.map(p=><div key={p.id} style={{ padding:"3px 0" }}>{p.name} · {p.ort}</div>)}
          </div>
        </div>

        {/* Konflikte */}
        <div style={{ background:TH.panel, border:"1.5px solid "+TH.border, borderRadius:10, overflow:"hidden" }}>
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
      <div style={{ fontWeight:700, fontSize:14, color:tw, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>🏗 Heute aktiv</div>
      {aktiveProjekte.length===0 ? (
        <div style={{ background:TH.panel2, border:"1.5px solid "+TH.border, borderRadius:10, padding:20, textAlign:"center", color:"#9ca3af" }}>Heute sind keine Projekte aktiv</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
          {aktiveProjekte.map(p=>{
            const col=getTeamColor(p.team);
            const team=imEinsatz.filter(e=>e.ma.team===p.team);
            const fzg=fahrzeuge.find(f=>f.id===p.fzg);
            return (
              <div key={p.id} style={{ border:`1.5px solid ${col.bg}`, borderRadius:10, overflow:"hidden" }}>
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
  if (ADMIN_EMAILS.includes(mail)) return { rolle:"Admin", ma:null };
  const ma = mitarbeiter.find(m => (m.email||"").trim().toLowerCase() === mail && mail!=="");
  if (ma) return { rolle: ma.rolle, ma };
  return { rolle:"Unbekannt", ma:null };
}

// Welche Tabs darf welche Rolle sehen?
function darfTab(rolle, tabId) {
  if (rolle==="Admin") return true;
  const rechte = {
    "Bauleiter":   ["dashboard","kosten","assistent","heute","woche","monat","stundenzettel","berichte","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge","warnungen"],
    "Vorarbeiter": ["heute","woche","monat","stundenzettel","berichte","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge"],
    "Monteur":     ["heute","woche","monat","stundenzettel","berichte","antraege","projekte","mitarbeiter","fahrzeuge","unterkuenfte","werkzeuge"],
    "Unbekannt":   ["heute","woche","monat"],
  };
  return (rechte[rolle]||rechte["Unbekannt"]).includes(tabId);
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function EinsatzplanungInner({
  projekte, setProjekte, mitarbeiter, setMitarbeiter,
  sonder, setSonder, antraege, setAntraege, fahrzeuge, setFahrzeuge,
  stunden, setStunden, unterkuenfte, setUnterkuenfte,
  berichte, setBerichte, werkzeuge, setWerkzeuge,
  onReset, onLogout, userEmail
}) {
  const { rolle: meineRolle, ma: meinMA } = useMemo(()=>ermittleRolle(userEmail, mitarbeiter), [userEmail, mitarbeiter]);

  // ── Feinere Rechte: Vorarbeiter & Monteure sehen nur ihr eigenes Team ──
  const teamFilter = (meineRolle==="Vorarbeiter" || meineRolle==="Monteur") && meinMA ? meinMA.team : null;
  const vMitarbeiter = teamFilter ? mitarbeiter.filter(m=>m.team===teamFilter) : mitarbeiter;
  const vProjekte    = teamFilter ? projekte.filter(p=>p.team===teamFilter) : projekte;
  const vSonder      = teamFilter ? sonder.filter(s=>{ const m=mitarbeiter.find(x=>x.id===s.ma); return m && m.team===teamFilter; }) : sonder;
  const vAntraege    = teamFilter ? antraege.filter(a=>a.team===teamFilter) : antraege;
  const vStunden     = teamFilter ? (stunden||[]).filter(e=>e.team===teamFilter) : stunden;
  const vBerichte    = teamFilter ? (berichte||[]).filter(b=>b.team===teamFilter) : berichte;
  const istAdmin = meineRolle==="Admin";
  const istLeitung = istAdmin || meineRolle==="Bauleiter" || meineRolle==="Vorarbeiter";

  const [tab, setTab] = useState(istAdmin ? "dashboard" : "heute");
  const [menueOffen, setMenueOffen] = useState(false);
  const [dunkel, setDunkel] = useState(()=>{ try { return localStorage.getItem("baufox-theme")==="dunkel"; } catch(e){ return false; } });
  useEffect(()=>{ try { localStorage.setItem("baufox-theme", dunkel?"dunkel":"hell"); } catch(e){} }, [dunkel]);
  TH = dunkel ? THEME_DUNKEL : THEME_HELL;
  const T = dunkel
    ? { bg:"#0f172a", panel:"#1e293b", panel2:"#334155", text:"#e2e8f0", textMut:"#94a3b8", border:"#334155", tabBar:"#1e293b" }
    : { bg:"#f8fafc", panel:"#ffffff", panel2:"#f9fafb", text:"#1e293b", textMut:"#6b7280", border:"#e5e7eb", tabBar:"#ffffff" };
  const warnungen = useMemo(()=>pruefKonflikte(projekte,sonder,mitarbeiter),[projekte,sonder,mitarbeiter]);

  function resetDaten() { if (onReset) onReset(); }

  const alleTabs = [
    { id:"dashboard",    label:"📊 Dashboard" },
    { id:"kosten",       label:"💰 Kosten" },
    { id:"assistent",    label:"🤖 Assistent" },
    { id:"heute",        label:"📆 Heute" },
    { id:"woche",        label:"📅 Woche" },
    { id:"monat",        label:"🗓 Monat" },
    { id:"stundenzettel",label:"⏱ Stundenzettel" },
    { id:"berichte",     label:"📝 Berichte" },
    { id:"antraege",     label:`🌴 Anträge${antraege.filter(a=>a.status==="offen").length>0?` (${antraege.filter(a=>a.status==="offen").length})`:""}` },
    { id:"projekte",     label:"🏗 Projekte" },
    { id:"mitarbeiter",  label:"👷 Mitarbeiter" },
    { id:"fahrzeuge",    label:"🚐 Fahrzeuge" },
    { id:"unterkuenfte", label:"🏨 Unterkünfte" },
    { id:"werkzeuge",    label:"🔧 Werkzeuge" },
    { id:"verwaltung",   label:"⚙️ Verwaltung" },
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
        <button onClick={()=>setMenueOffen(true)} title="Menü öffnen" style={{ background:"#fff2", border:"1px solid #fff4", borderRadius:8, padding:"7px 11px", fontSize:18, color:"#fff", cursor:"pointer", lineHeight:1 }}>☰</button>
        <div style={{ background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", borderRadius:10, padding:"6px 10px", fontSize:20, boxShadow:"0 2px 8px #ea580c55" }}>🦊</div>
        <div>
          <div style={{ fontWeight:800, fontSize:18, letterSpacing:-0.5 }}>Baufox</div>
          <div style={{ fontSize:11, opacity:0.7, textTransform:"uppercase", letterSpacing:1 }}>{(tabs.find(t=>t.id===tab)?.label)||"Montage-Steuerung"}</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          {Object.entries(TEAM_COLORS).map(([t,c])=>(
            <span key={t} style={{ background:c.bg+"44", border:`1px solid ${c.bg}88`, borderRadius:6, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:600 }}>{t}</span>
          ))}
          {userEmail && <span style={{ fontSize:11, color:"#fff", opacity:0.85, marginLeft:8 }}>👤 {userEmail}</span>}
          <span style={{ background:istAdmin?"#16a34a":"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"2px 9px", fontSize:10, color:"#fff", fontWeight:700, marginLeft:2 }}>{meineRolle}</span>
          <button onClick={()=>setDunkel(d=>!d)} title={dunkel?"Helles Design":"Dunkles Design"} style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 9px", fontSize:13, color:"#fff", cursor:"pointer", marginLeft:4 }}>{dunkel?"☀️":"🌙"}</button>
          {onLogout && <button onClick={onLogout} style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 10px", fontSize:11, color:"#fff", fontWeight:600, cursor:"pointer", marginLeft:4 }}>Abmelden</button>}
        </div>
      </div>

      {menueOffen && (
        <>
          <div onClick={()=>setMenueOffen(false)} style={{ position:"fixed", inset:0, background:"#0008", zIndex:90 }} />
          <div style={{ position:"fixed", left:0, top:0, bottom:0, width:250, background:T.tabBar, zIndex:91, boxShadow:"4px 0 20px #0004", display:"flex", flexDirection:"column" }}>
            <div style={{ background:"linear-gradient(135deg, #1e293b 0%, #334155 100%)", color:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", borderRadius:8, padding:"4px 8px", fontSize:16 }}>🦊</div>
              <div style={{ fontWeight:800, fontSize:16, flex:1 }}>Baufox</div>
              <button onClick={()=>setMenueOffen(false)} style={{ background:"#fff2", border:"1px solid #fff4", borderRadius:6, padding:"4px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"10px 0" }}>
              {tabs.map(t=>(
                <button key={t.id} onClick={()=>{setTab(t.id);setMenueOffen(false);}} style={{
                  display:"block", width:"100%", textAlign:"left", padding:"12px 18px", border:"none", cursor:"pointer", fontSize:14,
                  fontWeight:tab===t.id?700:500,
                  color:tab===t.id?"#ea580c":T.textMut,
                  background:tab===t.id?(dunkel?"#33415588":"#fff7ed"):"transparent",
                  borderLeft:tab===t.id?"4px solid #ea580c":"4px solid transparent"
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ padding:"18px 14px", maxWidth:1400, margin:"0 auto" }}>
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
        {tab==="dashboard"    && darfTab(meineRolle,"dashboard")    && <Dashboard mitarbeiter={mitarbeiter} projekte={projekte} sonder={sonder} fahrzeuge={fahrzeuge} antraege={antraege} warnungen={warnungen} unterkuenfte={unterkuenfte} setTab={setTab} T={T} />}
        {tab==="kosten"       && darfTab(meineRolle,"kosten")       && <KostenControlling projekte={projekte} stunden={stunden} mitarbeiter={mitarbeiter} unterkuenfte={unterkuenfte} T={T} />}
        {tab==="assistent"    && darfTab(meineRolle,"assistent")    && <SmartAssistent projekte={projekte} stunden={stunden} mitarbeiter={mitarbeiter} unterkuenfte={unterkuenfte} werkzeuge={werkzeuge} berichte={berichte} T={T} />}
        {tab==="heute"        && darfTab(meineRolle,"heute")        && <Tagesansicht   mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} fahrzeuge={fahrzeuge} />}
        {tab==="woche"        && darfTab(meineRolle,"woche")        && <Wochenansicht  mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} />}
        {tab==="monat"        && darfTab(meineRolle,"monat")        && <Monatsansicht  mitarbeiter={vMitarbeiter} projekte={vProjekte} sonder={vSonder} />}
        {tab==="stundenzettel"&& darfTab(meineRolle,"stundenzettel")&& <Stundenzettel  mitarbeiter={vMitarbeiter} projekte={vProjekte} stunden={vStunden} setStunden={setStunden} rolle={meineRolle} meinMA={meinMA} />}
        {tab==="berichte"     && darfTab(meineRolle,"berichte")     && <Tagesberichte projekte={vProjekte} mitarbeiter={vMitarbeiter} berichte={vBerichte} setBerichte={setBerichte} rolle={meineRolle} meinMA={meinMA} userEmail={userEmail} />}
        {tab==="antraege"     && darfTab(meineRolle,"antraege")     && <Antraege mitarbeiter={vMitarbeiter} antraege={vAntraege} setAntraege={setAntraege} setSonder={setSonder} />}
        {tab==="projekte"     && darfTab(meineRolle,"projekte")     && <ProjektUebersicht projekte={vProjekte} fahrzeuge={fahrzeuge} />}
        {tab==="mitarbeiter"  && darfTab(meineRolle,"mitarbeiter")  && <MitarbeiterUebersicht mitarbeiter={vMitarbeiter} projekte={vProjekte} />}
        {tab==="fahrzeuge"    && darfTab(meineRolle,"fahrzeuge")    && <FahrzeugUebersicht fahrzeuge={fahrzeuge} projekte={projekte} />}
        {tab==="unterkuenfte" && darfTab(meineRolle,"unterkuenfte") && <UnterkunftUebersicht unterkuenfte={unterkuenfte} projekte={projekte} />}
        {tab==="werkzeuge"    && darfTab(meineRolle,"werkzeuge")    && <WerkzeugUebersicht werkzeuge={werkzeuge} mitarbeiter={mitarbeiter} />}
        {tab==="verwaltung"   && istAdmin                          && <Verwaltung projekte={projekte} setProjekte={setProjekte} mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} fahrzeuge={fahrzeuge} setFahrzeuge={setFahrzeuge} unterkuenfte={unterkuenfte} setUnterkuenfte={setUnterkuenfte} werkzeuge={werkzeuge} setWerkzeuge={setWerkzeuge} sonder={sonder} antraege={antraege} stunden={stunden} berichte={berichte} onReset={onReset} />}
        {tab==="warnungen"    && darfTab(meineRolle,"warnungen")    && <WarnPanel warnungen={warnungen} />}
      </div>
    </div>
  );
}
