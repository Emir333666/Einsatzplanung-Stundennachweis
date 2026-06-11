import { useState, useMemo, useEffect } from "react";

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
  return <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{label} </span><span style={{ color:"#1f2937", fontWeight:500 }}>{value}</span></div>;
}
const thS = { padding:"7px 8px", background:"#f9fafb", fontWeight:700, fontSize:11, color:"#6b7280", borderBottom:"2px solid #e5e7eb", textAlign:"center", whiteSpace:"nowrap" };
const tdS = { padding:"5px 8px", verticalAlign:"middle", color:"#374151" };
const inpS = { padding:"5px 8px", borderRadius:6, border:"1.5px solid #e5e7eb", fontSize:12, width:"100%", boxSizing:"border-box" };

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
        <button onClick={() => setDatum(isoDate(addDays(d,-1)))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:20, color:"#1e3a5f" }}>{wt}, {fmtDate(d)}</div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>Kalenderwoche {kw} · {MONATE[d.getMonth()]} {d.getFullYear()}</div>
        </div>
        <button onClick={() => setDatum(isoDate(addDays(d,1)))} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>›</button>
        <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{ ...inpS, width:160, marginLeft:8 }} />
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
          <div key={k.label} style={{ background:"#fff", border:`1.5px solid ${k.farbe}33`, borderRadius:10, padding:"10px 14px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:800, color:k.farbe }}>{k.wert}</div>
            <div style={{ fontSize:11, color:"#6b7280", marginTop:2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Baustellen-Karten */}
      {aufBaustelle.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>🏗 Heute auf Baustelle</div>
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
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>🚫 Abwesend</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {abwesend.map(({ ma, eintrag }) => {
              const ef = EINSATZ_FARBEN[eintrag.typ] || EINSATZ_FARBEN["Frei"];
              return (
                <div key={ma.id} style={{ background:ef.bg, border:`1.5px solid ${ef.border}`, borderRadius:8, padding:"7px 12px", fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"#374151" }}>{ma.name}</div>
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
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:8, textTransform:"uppercase", letterSpacing:0.5 }}>✅ Verfügbar / Nicht eingeplant</div>
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
        <button onClick={prevKW} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:16, color:"#1e3a5f" }}>KW {kw} · {kwYear}</div>
          <div style={{ fontSize:11, color:"#9ca3af" }}>{fmtDate(tage[0])} – {fmtDate(tage[6])}</div>
        </div>
        <button onClick={nextKW} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>›</button>
        <select value={filterTeam} onChange={e=>setFilterTeam(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13, marginLeft:8 }}>
          {["Alle",...Object.keys(TEAM_COLORS)].map(t=><option key={t}>{t}</option>)}
        </select>
        <button onClick={()=>{setKw(getKW(heute));setKwYear(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #1d4ed8", background:"#dbeafe", color:"#1d4ed8", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12, minWidth:700 }}>
          <thead>
            <tr>
              <th style={{ ...thS, textAlign:"left", position:"sticky", left:0, background:"#f9fafb", zIndex:2, minWidth:140 }}>Mitarbeiter</th>
              {tage.map(d => {
                const isHeuteFn = isoDate(d) === isoDate(new Date());
                const wend = isWeekend(d);
                return (
                  <th key={isoDate(d)} style={{ ...thS, minWidth:110, background: isHeuteFn ? "#eff6ff" : wend ? "#f9fafb" : "#f9fafb",
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
                  <tr key={ma.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                    <td style={{ ...tdS, position:"sticky", left:0, background:"#fff", zIndex:1, borderRight:"2px solid #e5e7eb", borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>
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
                        <td key={isoDate(d)} style={{ ...tdS, background:"#fafafa", textAlign:"center", color:"#e5e7eb", fontSize:16 }}>—</td>
                      );
                      if (!eintrag) return <td key={isoDate(d)} style={{ ...tdS, background: isHeuteFn?"#eff6ff":"#fff" }} />;

                      if (eintrag.typ==="Projekt") {
                        const p = eintrag.projekt;
                        const isStart = isoDate(d)===p.dateStart;
                        return (
                          <td key={isoDate(d)} style={{ ...tdS, background:col.light, padding:"2px 4px" }}>
                            <div style={{ background:col.light, border:`1.5px solid ${col.bg}`, borderRadius:5, padding:"3px 6px", fontSize:10, borderLeft:isStart?`4px solid ${col.bg}`:undefined }}>
                              <div style={{ fontWeight:600, color:col.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:90 }}>{isStart?"▶ ":""}{p.name}</div>
                              {isStart && <div style={{ fontSize:9, color:"#6b7280" }}>📍 {p.ort}</div>}
                            </div>
                          </td>
                        );
                      } else {
                        const ef = EINSATZ_FARBEN[eintrag.typ]||EINSATZ_FARBEN["Frei"];
                        return (
                          <td key={isoDate(d)} style={{ ...tdS, background:ef.bg, padding:"2px 4px" }}>
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
        <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, background:"#fafafa", border:"1px solid #e5e7eb", borderRadius:6, padding:"2px 8px", color:"#9ca3af" }}>— Wochenende</span>
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
        <button onClick={prevM} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>‹</button>
        <div style={{ fontWeight:800, fontSize:17, color:"#1e3a5f" }}>{MONATE[monat]} {jahr}</div>
        <button onClick={nextM} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontSize:16 }}>›</button>
        <select value={filterMA} onChange={e=>setFilterMA(e.target.value)} style={{ padding:"6px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:13 }}>
          <option>Alle</option>
          {mitarbeiter.map(m=><option key={m.id}>{m.name}</option>)}
        </select>
        <button onClick={()=>{setMonat(heute.getMonth());setJahr(heute.getFullYear());}} style={{ padding:"6px 14px", borderRadius:8, border:"1.5px solid #1d4ed8", background:"#dbeafe", color:"#1d4ed8", cursor:"pointer", fontSize:12, fontWeight:700 }}>Heute</button>
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", width:"100%", fontSize:11, minWidth:900 }}>
          <thead>
            <tr>
              <th style={{ ...thS, textAlign:"left", position:"sticky", left:0, background:"#f9fafb", zIndex:2, minWidth:130 }}>Mitarbeiter</th>
              {tage.map(d => {
                const wend = isWeekend(d);
                const isH = isoDate(d)===isoDate(heute);
                return (
                  <th key={d.getDate()} style={{ ...thS, minWidth:30, padding:"4px 2px", background:isH?"#eff6ff":wend?"#f3f4f6":"#f9fafb",
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
                <tr key={ma.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                  <td style={{ ...tdS, position:"sticky", left:0, background:"#fff", zIndex:1, borderRight:"2px solid #e5e7eb", borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>
                    <div style={{ fontWeight:ma.rolle==="Vorarbeiter"?700:400, color:ma.rolle==="Vorarbeiter"?col.bg:"#374151", fontSize:11 }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</div>
                    <div style={{ fontSize:9, color:"#9ca3af" }}>{ma.team}</div>
                  </td>
                  {tage.map(d => {
                    const wend = isWeekend(d);
                    const proj = getProjektForTeamDate(projekte, ma.team, d);
                    const se = getSonderForMaDate(sonder, ma.id, d);
                    const eintrag = se || (proj?{typ:"Projekt",projekt:proj}:null);
                    const isH = isoDate(d)===isoDate(heute);

                    if (wend && !eintrag) return <td key={d.getDate()} style={{ background:"#f3f4f6", padding:0 }} />;
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
function Stundenzettel({ mitarbeiter, projekte }) {
  const vorarbeiter = mitarbeiter.filter(m=>m.rolle==="Vorarbeiter");
  const [aktVA, setAktVA] = useState(vorarbeiter[0]?.id||null);
  const [datum, setDatum] = useState(isoDate(new Date()));
  const [stunden, setStunden] = useState({});
  const [gespeichert, setGespeichert] = useState([]);
  const [ansicht, setAnsicht] = useState("erfassen");

  const va = mitarbeiter.find(m=>m.id===aktVA);
  const teamMA = va ? mitarbeiter.filter(m=>m.team===va.team) : [];
  const d = parseDate(datum);
  const teamProjekt = va ? projekte.find(p=>p.team===va.team && dateInRange(d, p.dateStart, p.dateEnd)) : null;
  const col = va ? getTeamColor(va.team) : { bg:"#6b7280", light:"#f3f4f6", text:"#374151" };

  function setFeld(maId,feld,wert){ setStunden(p=>({...p,[maId]:{...(p[maId]||{}),[feld]:wert}})); }
  function getFeld(maId,feld,def=""){ return stunden[maId]?.[feld]??def; }

  function speichern() {
    const eintraege = teamMA.map(ma => {
      const s = stunden[ma.id]||{};
      const h = calcStunden(s.start, s.end, Number(s.pause)||0);
      return { maId:ma.id, maName:ma.name, team:va.team, datum, wochentag:WOCHENTAGE_LANG[d.getDay()], kw:getKW(d), projekt:teamProjekt?.name||"–", ...s, arbeitsstunden:h.toFixed(2) };
    }).filter(e=>e.start);
    if (!eintraege.length) return;
    setGespeichert(p=>[...p,...eintraege]);
    setStunden({});
    setAnsicht("uebersicht");
  }

  const summaryByMA = useMemo(()=>{
    const map={};
    gespeichert.forEach(e=>{
      if(!map[e.maId]) map[e.maId]={name:e.maName,stunden:0,fahrzeit:0,uebernachtungen:0,spesen:0,eintraege:[]};
      map[e.maId].stunden+=parseFloat(e.arbeitsstunden||0);
      map[e.maId].fahrzeit+=parseFloat(e.fahrzeit||0);
      map[e.maId].uebernachtungen+=e.uebernachtung?1:0;
      map[e.maId].spesen+=parseFloat(e.spesen||0);
      map[e.maId].eintraege.push(e);
    });
    return map;
  },[gespeichert]);

  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, alignItems:"flex-end" }}>
        <div>
          <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:3, textTransform:"uppercase" }}>Vorarbeiter</div>
          <select value={aktVA||""} onChange={e=>{setAktVA(Number(e.target.value));setStunden({});}} style={{ ...inpS, width:210, fontWeight:700 }}>
            {vorarbeiter.map(v=><option key={v.id} value={v.id}>{v.name} ({v.team})</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:3, textTransform:"uppercase" }}>Datum</div>
          <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{ ...inpS, width:160 }} />
        </div>
        {datum && (
          <div style={{ background:col.light, border:`1.5px solid ${col.bg}44`, borderRadius:8, padding:"7px 12px", fontSize:12 }}>
            <span style={{ fontWeight:700, color:col.bg }}>{WOCHENTAGE_LANG[d.getDay()]}</span>
            <span style={{ color:"#6b7280", marginLeft:6 }}>{fmtDate(d)} · KW {getKW(d)}</span>
          </div>
        )}
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <button onClick={()=>setAnsicht("erfassen")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13, background:ansicht==="erfassen"?col.bg:"#fff", color:ansicht==="erfassen"?"#fff":"#374151", fontWeight:600 }}>✏️ Erfassen</button>
          <button onClick={()=>setAnsicht("uebersicht")} style={{ padding:"7px 16px", borderRadius:8, border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13, background:ansicht==="uebersicht"?col.bg:"#fff", color:ansicht==="uebersicht"?"#fff":"#374151", fontWeight:600 }}>📋 Übersicht ({gespeichert.length})</button>
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
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead>
                <tr>{["Mitarbeiter","Rolle","Beginn","Ende","Pause (Min)","Arbeitsstd.","Fahrzeit (h)","Übernachtung","Spesen (€)","Bemerkung"].map(h=><th key={h} style={thS}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {teamMA.map(ma=>{
                  const start=getFeld(ma.id,"start"),end=getFeld(ma.id,"end"),pause=getFeld(ma.id,"pause",0);
                  const netto=calcStunden(start,end,Number(pause));
                  const isVA=ma.rolle==="Vorarbeiter";
                  return (
                    <tr key={ma.id} style={{ borderBottom:"1px solid #f0f0f0", background:isVA?col.light:"#fff" }}>
                      <td style={{ ...tdS, fontWeight:isVA?700:400, borderLeft:`4px solid ${col.bg}`, whiteSpace:"nowrap" }}>{isVA?"★ ":""}{ma.name}</td>
                      <td style={tdS}><Badge color={col.bg}>{ma.rolle}</Badge></td>
                      <td style={{ ...tdS, minWidth:90 }}><input type="time" value={start} onChange={e=>setFeld(ma.id,"start",e.target.value)} style={inpS} /></td>
                      <td style={{ ...tdS, minWidth:90 }}><input type="time" value={end} onChange={e=>setFeld(ma.id,"end",e.target.value)} style={inpS} /></td>
                      <td style={{ ...tdS, minWidth:80 }}><input type="number" min={0} max={120} value={pause} onChange={e=>setFeld(ma.id,"pause",e.target.value)} style={inpS} placeholder="30" /></td>
                      <td style={{ ...tdS, textAlign:"center", fontWeight:700, color:netto>0?col.text:"#9ca3af" }}>{netto>0?netto.toFixed(2)+" h":"–"}</td>
                      <td style={{ ...tdS, minWidth:80 }}><input type="number" min={0} step={0.5} value={getFeld(ma.id,"fahrzeit","")} onChange={e=>setFeld(ma.id,"fahrzeit",e.target.value)} style={inpS} placeholder="0" /></td>
                      <td style={{ ...tdS, textAlign:"center" }}><input type="checkbox" checked={!!getFeld(ma.id,"uebernachtung",false)} onChange={e=>setFeld(ma.id,"uebernachtung",e.target.checked)} style={{ width:18, height:18, cursor:"pointer" }} /></td>
                      <td style={{ ...tdS, minWidth:80 }}><input type="number" min={0} step={0.5} value={getFeld(ma.id,"spesen","")} onChange={e=>setFeld(ma.id,"spesen",e.target.value)} style={inpS} placeholder="0" /></td>
                      <td style={{ ...tdS, minWidth:140 }}><input type="text" value={getFeld(ma.id,"bemerkung","")} onChange={e=>setFeld(ma.id,"bemerkung",e.target.value)} style={inpS} placeholder="z.B. Überstunden…" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:12, background:"#f8fafc", border:"1.5px solid #e5e7eb", borderRadius:8, padding:"10px 14px", display:"flex", gap:24, flexWrap:"wrap", fontSize:12 }}>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Gesamt heute </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.reduce((s,ma)=>s+calcStunden(getFeld(ma.id,"start"),getFeld(ma.id,"end"),Number(getFeld(ma.id,"pause",0))),0).toFixed(2)} h</span></div>
            <div><span style={{ color:"#9ca3af", fontSize:10, fontWeight:600, textTransform:"uppercase" }}>Eingetragen </span><span style={{ fontWeight:800, fontSize:16, color:col.bg }}>{teamMA.filter(ma=>getFeld(ma.id,"start")).length}/{teamMA.length}</span></div>
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10 }}>
            <button onClick={speichern} style={{ padding:"9px 24px", borderRadius:8, background:col.bg, color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>💾 Speichern</button>
            <button onClick={()=>setStunden({})} style={{ padding:"9px 16px", borderRadius:8, background:"#f3f4f6", color:"#374151", border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13 }}>✕ Reset</button>
          </div>
        </>
      )}

      {ansicht==="uebersicht" && (
        <div>
          {!gespeichert.length ? (
            <div style={{ background:"#f9fafb", border:"1.5px solid #e5e7eb", borderRadius:10, padding:32, textAlign:"center", color:"#9ca3af" }}>Noch keine Stundenzettel gespeichert</div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12, marginBottom:18 }}>
                {Object.values(summaryByMA).map(s=>{
                  const ma=mitarbeiter.find(m=>m.name===s.name);
                  const c=ma?getTeamColor(ma.team):{bg:"#6b7280",light:"#f3f4f6",text:"#374151"};
                  return (
                    <div key={s.name} style={{ border:`1.5px solid ${c.bg}`, borderRadius:10, overflow:"hidden" }}>
                      <div style={{ background:c.bg, color:"#fff", padding:"7px 12px", fontWeight:700, fontSize:13 }}>{ma?.rolle==="Vorarbeiter"?"★ ":""}{s.name}</div>
                      <div style={{ padding:"10px 12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px 12px", fontSize:12 }}>
                        <Info label="Arbeitsstunden" value={s.stunden.toFixed(2)+" h"} />
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
                  <thead><tr>{["Datum","Wochentag","KW","Mitarbeiter","Projekt","Beginn","Ende","Pause","Arbeitsstd.","Fahrzeit","Übern.","Spesen","Bemerkung"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...gespeichert].reverse().map((e,i)=>{
                      const ma=mitarbeiter.find(m=>m.id===e.maId);
                      const c=ma?getTeamColor(ma.team):{bg:"#6b7280"};
                      return (
                        <tr key={i} style={{ borderBottom:"1px solid #f0f0f0" }}>
                          <td style={tdS}>{fmtDate(parseDate(e.datum))}</td>
                          <td style={tdS}>{e.wochentag}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>KW {e.kw}</td>
                          <td style={{ ...tdS, borderLeft:`4px solid ${c.bg}`, fontWeight:ma?.rolle==="Vorarbeiter"?700:400 }}>{ma?.rolle==="Vorarbeiter"?"★ ":""}{e.maName}</td>
                          <td style={tdS}>{e.projekt}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.start||"–"}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.end||"–"}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.pause?e.pause+"min":"–"}</td>
                          <td style={{ ...tdS, textAlign:"center", fontWeight:700, color:c.bg }}>{e.arbeitsstunden} h</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.fahrzeit?e.fahrzeit+" h":"–"}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.uebernachtung?"✅":"–"}</td>
                          <td style={{ ...tdS, textAlign:"center" }}>{e.spesen?e.spesen+" €":"–"}</td>
                          <td style={tdS}>{e.bemerkung||"–"}</td>
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
              <span style={{ fontWeight:700, fontSize:14 }}>{p.name}</span>
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
        <thead><tr>{["Name","Rolle","Team","Telefon","FS","Stapler","Schweißer","Urlaub","Krank","Aktuell"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {mitarbeiter.map(ma=>{
            const col=getTeamColor(ma.team);
            const aktProj=projekte.find(p=>p.team===ma.team&&p.status==="laufend");
            return (
              <tr key={ma.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                <td style={{ ...tdS, fontWeight:ma.rolle==="Vorarbeiter"?700:400, borderLeft:`4px solid ${col.bg}` }}>{ma.rolle==="Vorarbeiter"?"★ ":""}{ma.name}</td>
                <td style={tdS}><Badge color={col.bg}>{ma.rolle}</Badge></td>
                <td style={tdS}>{ma.team}</td>
                <td style={tdS}>{ma.tel}</td>
                <td style={{ ...tdS, textAlign:"center" }}>{ma.fuehrerschein?"✅":"❌"}</td>
                <td style={{ ...tdS, textAlign:"center" }}>{ma.stapler?"✅":"❌"}</td>
                <td style={{ ...tdS, textAlign:"center" }}>{ma.schweisser?"✅":"❌"}</td>
                <td style={{ ...tdS, textAlign:"center" }}>{ma.urlaub}d</td>
                <td style={{ ...tdS, textAlign:"center", color:ma.krank>3?"#dc2626":"#374151" }}>{ma.krank}d</td>
                <td style={tdS}>{aktProj?<Badge color={col.bg}>{aktProj.name}</Badge>:<span style={{ color:"#9ca3af" }}>–</span>}</td>
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
        <button onClick={()=>setSeite("antrag")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="antrag"?"#1d4ed8":"#fff", color:seite==="antrag"?"#fff":"#374151" }}>📝 Antrag stellen</button>
        <button onClick={()=>setSeite("freigabe")} style={{ padding:"8px 18px", borderRadius:8, border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13, fontWeight:600, background:seite==="freigabe"?"#1d4ed8":"#fff", color:seite==="freigabe"?"#fff":"#374151" }}>
          ✅ Freigabe {offen.length>0 && <span style={{ background:"#dc2626", color:"#fff", borderRadius:99, padding:"0 7px", fontSize:11, marginLeft:4 }}>{offen.length}</span>}
        </button>
      </div>

      {seite === "antrag" && (
        <div style={{ maxWidth:520 }}>
          <div style={{ background:"#fff", border:"1.5px solid #e5e7eb", borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16, color:"#1e3a5f" }}>Neuer Antrag auf freie Zeit</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Mitarbeiter</div>
              <select value={maId||""} onChange={e=>setMaId(Number(e.target.value))} style={{ ...inpS, fontWeight:600 }}>
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
                <input type="date" value={von} onChange={e=>setVon(e.target.value)} style={inpS} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Bis</div>
                <input type="date" value={bis} onChange={e=>setBis(e.target.value)} style={inpS} />
              </div>
            </div>

            {von && bis && parseDate(bis) >= parseDate(von) && (
              <div style={{ background:col.light, border:`1px solid ${col.bg}33`, borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:col.text }}>
                📅 {fmtDate(parseDate(von))} – {fmtDate(parseDate(bis))} · <strong>{tageAnzahl(von,bis)} Tage</strong>
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:"#9ca3af", fontWeight:600, marginBottom:4, textTransform:"uppercase" }}>Grund (optional)</div>
              <input type="text" value={grund} onChange={e=>setGrund(e.target.value)} style={inpS} placeholder="z.B. Familienurlaub, Arzttermin…" />
            </div>

            <button onClick={einreichen} style={{ width:"100%", padding:"11px", borderRadius:8, background:"#1d4ed8", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:14 }}>
              Antrag einreichen
            </button>
          </div>
        </div>
      )}

      {seite === "freigabe" && (
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
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
                        <span style={{ fontWeight:700, fontSize:14, color:"#1e3a5f" }}>{a.maName}</span>
                        <span style={{ marginLeft:8 }}><Badge color={c.bg}>{a.team}</Badge></span>
                        <span style={{ marginLeft:6 }}><Badge color={ef.badge}>{a.typ}</Badge></span>
                      </div>
                    </div>
                    <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                      <div style={{ fontSize:13 }}>
                        <div style={{ fontWeight:600, color:"#374151" }}>📅 {fmtDate(parseDate(a.dateStart))} – {fmtDate(parseDate(a.dateEnd))}</div>
                        {a.grund && <div style={{ fontSize:12, color:"#6b7280", marginTop:3 }}>💬 {a.grund}</div>}
                        <div style={{ fontSize:11, color:"#9ca3af", marginTop:3 }}>Eingereicht: {fmtDate(parseDate(a.eingereicht))}</div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>entscheiden(a,"genehmigt")} style={{ padding:"8px 16px", borderRadius:8, background:"#16a34a", color:"#fff", border:"none", cursor:"pointer", fontWeight:700, fontSize:13 }}>✓ Genehmigen</button>
                        <button onClick={()=>entscheiden(a,"abgelehnt")} style={{ padding:"8px 16px", borderRadius:8, background:"#fff", color:"#dc2626", border:"1.5px solid #dc2626", cursor:"pointer", fontWeight:700, fontSize:13 }}>✕ Ablehnen</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {erledigt.length > 0 && (
            <>
              <div style={{ fontWeight:700, fontSize:13, color:"#374151", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Bearbeitet</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
                  <thead><tr>{["Mitarbeiter","Team","Art","Zeitraum","Grund","Status"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {erledigt.map(a=>{
                      const c=getTeamColor(a.team);
                      return (
                        <tr key={a.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                          <td style={{ ...tdS, borderLeft:`4px solid ${c.bg}`, fontWeight:600 }}>{a.maName}</td>
                          <td style={tdS}>{a.team}</td>
                          <td style={tdS}><Badge color={EINSATZ_FARBEN[a.typ]?.badge||"#6b7280"}>{a.typ}</Badge></td>
                          <td style={tdS}>{fmtDate(parseDate(a.dateStart))} – {fmtDate(parseDate(a.dateEnd))}</td>
                          <td style={tdS}>{a.grund||"–"}</td>
                          <td style={{ ...tdS, textAlign:"center" }}><Badge color={statusFarbe[a.status]}>{a.status}</Badge></td>
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
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:14, width:"100%", maxWidth:520, boxShadow:"0 10px 40px #0004" }}>
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
const btnGhost = { padding:"10px 16px", borderRadius:8, background:"#f3f4f6", color:"#374151", border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13 };

// ─── VERWALTUNG (Stammdaten anlegen/bearbeiten/löschen) ───────────────────────
function Verwaltung({ projekte, setProjekte, mitarbeiter, setMitarbeiter, fahrzeuge, setFahrzeuge, onReset }) {
  const [sub, setSub] = useState("projekte");
  const [modal, setModal] = useState(null); // { art, data }

  const teamNamen = Object.keys(TEAM_COLORS);
  const vorarbeiterNamen = mitarbeiter.filter(m=>m.rolle==="Vorarbeiter").map(m=>m.name);

  function neueId(prefix, liste) {
    let n = 1;
    while (liste.some(x => x.id === prefix+n)) n++;
    return prefix+n;
  }

  // ── Projekt-Formular ──
  function ProjektForm({ data }) {
    const [f, setF] = useState(data || { id:"", name:"", kunde:"", ort:"", dateStart:isoDate(new Date()), dateEnd:isoDate(new Date()), team:teamNamen[0], status:"geplant", fzg:"", vorarbeiter:"", bemerkung:"" });
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
        <Feld label="Projektname"><input style={inpS} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="z.B. Kranbahn Halle B" /></Feld>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Kunde"><input style={inpS} value={f.kunde} onChange={e=>set("kunde",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Ort"><input style={inpS} value={f.ort} onChange={e=>set("ort",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Start"><input type="date" style={inpS} value={f.dateStart} onChange={e=>set("dateStart",e.target.value)} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Ende"><input type="date" style={inpS} value={f.dateEnd} onChange={e=>set("dateEnd",e.target.value)} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Status"><select style={inpS} value={f.status} onChange={e=>set("status",e.target.value)}>{Object.keys(STATUS_FARBEN).map(s=><option key={s}>{s}</option>)}</select></Feld></div>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Vorarbeiter"><select style={inpS} value={f.vorarbeiter} onChange={e=>set("vorarbeiter",e.target.value)}><option value="">–</option>{vorarbeiterNamen.map(v=><option key={v}>{v}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Fahrzeug"><select style={inpS} value={f.fzg} onChange={e=>set("fzg",e.target.value)}><option value="">–</option>{fahrzeuge.map(fz=><option key={fz.id} value={fz.id}>{fz.kz}</option>)}</select></Feld></div>
        </div>
        <Feld label="Bemerkung"><input style={inpS} value={f.bemerkung} onChange={e=>set("bemerkung",e.target.value)} placeholder="z.B. Anreise Sonntag, Hotel gebucht" /></Feld>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
          <button onClick={()=>setModal(null)} style={btnGhost}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  // ── Mitarbeiter-Formular ──
  function MitarbeiterForm({ data }) {
    const [f, setF] = useState(data || { id:null, name:"", rolle:"Monteur", team:teamNamen[0], tel:"", email:"", fuehrerschein:false, stapler:false, schweisser:false, urlaub:0, krank:0 });
    const set = (k,v) => setF(p=>({...p,[k]:v}));
    function speichern() {
      if (!f.name) return;
      const sauber = { ...f, email:(f.email||"").trim().toLowerCase(), urlaub: Number(f.urlaub)||0, krank: Number(f.krank)||0, fuehrerschein: !!f.fuehrerschein, stapler: !!f.stapler, schweisser: !!f.schweisser };
      if (data) setMitarbeiter(prev => prev.map(m => m.id===data.id ? sauber : m));
      else setMitarbeiter(prev => [...prev, { ...sauber, id: null }]);
      setModal(null);
    }
    const col = getTeamColor(f.team);
    return (
      <Modal titel={data?"Mitarbeiter bearbeiten":"Neuer Mitarbeiter"} onClose={()=>setModal(null)} farbe={col.bg}>
        <Feld label="Name"><input style={inpS} value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Vor- und Nachname" /></Feld>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Rolle"><select style={inpS} value={f.rolle} onChange={e=>set("rolle",e.target.value)}><option>Monteur</option><option>Vorarbeiter</option><option>Bauleiter</option></select></Feld></div>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
        </div>
        <Feld label="Login-E-Mail (für App-Zugang)"><input style={inpS} value={f.email||""} onChange={e=>set("email",e.target.value)} placeholder="z.B. max@firma.de – muss zum Supabase-Login passen" /></Feld>
        <Feld label="Telefon"><input style={inpS} value={f.tel} onChange={e=>set("tel",e.target.value)} placeholder="0171-…" /></Feld>
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
          <div style={{ flex:1 }}><Feld label="Urlaubstage"><input type="number" style={inpS} value={f.urlaub} onChange={e=>set("urlaub",Number(e.target.value))} /></Feld></div>
          <div style={{ flex:1 }}><Feld label="Krankheitstage"><input type="number" style={inpS} value={f.krank} onChange={e=>set("krank",Number(e.target.value))} /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
          <button onClick={()=>setModal(null)} style={btnGhost}>Abbrechen</button>
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
        <Feld label="Kennzeichen"><input style={inpS} value={f.kz} onChange={e=>set("kz",e.target.value)} placeholder="MK-XX 000" /></Feld>
        <Feld label="Fahrzeugtyp"><input style={inpS} value={f.typ} onChange={e=>set("typ",e.target.value)} placeholder="Sprinter, Pritsche…" /></Feld>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{ flex:1 }}><Feld label="Team"><select style={inpS} value={f.team} onChange={e=>set("team",e.target.value)}>{teamNamen.map(t=><option key={t}>{t}</option>)}</select></Feld></div>
          <div style={{ flex:1 }}><Feld label="TÜV (JJJJ-MM)"><input style={inpS} value={f.tuev} onChange={e=>set("tuev",e.target.value)} placeholder="2026-08" /></Feld></div>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <button onClick={speichern} style={btnPrimary(col.bg)}>💾 Speichern</button>
          <button onClick={()=>setModal(null)} style={btnGhost}>Abbrechen</button>
        </div>
      </Modal>
    );
  }

  function loeschen(art, id) {
    if (art==="projekt") setProjekte(prev => prev.filter(p=>p.id!==id));
    if (art==="ma")      setMitarbeiter(prev => prev.filter(m=>m.id!==id));
    if (art==="fzg")     setFahrzeuge(prev => prev.filter(f=>f.id!==id));
  }

  const subTabs = [
    { id:"projekte", label:`🏗 Projekte (${projekte.length})` },
    { id:"mitarbeiter", label:`👷 Mitarbeiter (${mitarbeiter.length})` },
    { id:"fahrzeuge", label:`🚐 Fahrzeuge (${fahrzeuge.length})` },
  ];

  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        {subTabs.map(t=>(
          <button key={t.id} onClick={()=>setSub(t.id)} style={{ padding:"7px 14px", borderRadius:8, border:"1.5px solid #e5e7eb", cursor:"pointer", fontSize:13, fontWeight:600, background:sub===t.id?"#1e3a5f":"#fff", color:sub===t.id?"#fff":"#374151" }}>{t.label}</button>
        ))}
        {onReset && <button onClick={onReset} style={{ marginLeft:"auto", padding:"7px 14px", borderRadius:8, border:"1.5px solid #fca5a5", background:"#fff", color:"#dc2626", cursor:"pointer", fontSize:12 }}>↺ Demo-Daten zurücksetzen</button>}
      </div>

      {sub==="projekte" && (
        <>
          <button onClick={()=>setModal({art:"projekt"})} style={{ ...btnPrimary(), marginBottom:14 }}>+ Neues Projekt</button>
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", width:"100%", fontSize:12 }}>
              <thead><tr>{["Name","Kunde","Ort","Zeitraum","Team","Status","Aktion"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {projekte.map(p=>{
                  const col=getTeamColor(p.team);
                  return (
                    <tr key={p.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                      <td style={{ ...tdS, fontWeight:600, borderLeft:`4px solid ${col.bg}` }}>{p.name}</td>
                      <td style={tdS}>{p.kunde}</td>
                      <td style={tdS}>{p.ort}</td>
                      <td style={tdS}>{fmtDateShort(parseDate(p.dateStart))}–{fmtDateShort(parseDate(p.dateEnd))}</td>
                      <td style={tdS}><Badge color={col.bg}>{p.team}</Badge></td>
                      <td style={tdS}><Badge color={STATUS_FARBEN[p.status]}>{p.status}</Badge></td>
                      <td style={{ ...tdS, whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"projekt",data:p})} style={{ ...btnGhost, padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("projekt",p.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:"#fff", color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
              <thead><tr>{["Name","Rolle","Team","Login-E-Mail","Telefon","Quali.","Aktion"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {mitarbeiter.map(m=>{
                  const col=getTeamColor(m.team);
                  const q=[m.fuehrerschein&&"FS",m.stapler&&"Stapler",m.schweisser&&"Schw."].filter(Boolean).join(", ")||"–";
                  return (
                    <tr key={m.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                      <td style={{ ...tdS, fontWeight:m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter"?700:400, borderLeft:`4px solid ${col.bg}` }}>{m.rolle==="Vorarbeiter"||m.rolle==="Bauleiter"?"★ ":""}{m.name}</td>
                      <td style={tdS}><Badge color={col.bg}>{m.rolle}</Badge></td>
                      <td style={tdS}>{m.team}</td>
                      <td style={{ ...tdS, fontSize:11, color:m.email?"#374151":"#d1d5db" }}>{m.email||"– kein Zugang –"}</td>
                      <td style={tdS}>{m.tel}</td>
                      <td style={{ ...tdS, fontSize:11 }}>{q}</td>
                      <td style={{ ...tdS, whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"ma",data:m})} style={{ ...btnGhost, padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("ma",m.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:"#fff", color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
              <thead><tr>{["Kennzeichen","Typ","Team","TÜV","Aktion"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {fahrzeuge.map(f=>{
                  const col=getTeamColor(f.team);
                  return (
                    <tr key={f.id} style={{ borderBottom:"1px solid #f0f0f0" }}>
                      <td style={{ ...tdS, fontWeight:600, borderLeft:`4px solid ${col.bg}` }}>🚐 {f.kz}</td>
                      <td style={tdS}>{f.typ}</td>
                      <td style={tdS}><Badge color={col.bg}>{f.team}</Badge></td>
                      <td style={tdS}>{f.tuev}</td>
                      <td style={{ ...tdS, whiteSpace:"nowrap" }}>
                        <button onClick={()=>setModal({art:"fzg",data:f})} style={{ ...btnGhost, padding:"4px 10px", marginRight:5 }}>✏️</button>
                        <button onClick={()=>loeschen("fzg",f.id)} style={{ padding:"4px 10px", borderRadius:6, border:"1.5px solid #fca5a5", background:"#fff", color:"#dc2626", cursor:"pointer" }}>🗑</button>
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
    </div>
  );
}

function WarnPanel({ warnungen }) {
  if (!warnungen.length) return <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, padding:"12px 16px", color:"#166534", fontSize:13 }}>✅ Keine Konflikte gefunden</div>;
  return <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{warnungen.map((w,i)=><div key={i} style={{ background:"#fff7ed", border:"1.5px solid #fdba74", borderRadius:8, padding:"10px 14px", color:"#92400e", display:"flex", gap:10, fontSize:13 }}><span style={{ fontSize:18 }}>⚠️</span><div><strong style={{ marginRight:6 }}>{w.typ}:</strong>{w.msg}</div></div>)}</div>;
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
    "Bauleiter":   ["heute","woche","monat","stundenzettel","antraege","projekte","mitarbeiter","fahrzeuge","warnungen"],
    "Vorarbeiter": ["heute","woche","monat","stundenzettel","antraege","projekte","mitarbeiter","fahrzeuge"],
    "Monteur":     ["heute","woche","monat","antraege","projekte","mitarbeiter","fahrzeuge"],
    "Unbekannt":   ["heute","woche","monat"],
  };
  return (rechte[rolle]||rechte["Unbekannt"]).includes(tabId);
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function EinsatzplanungInner({
  projekte, setProjekte, mitarbeiter, setMitarbeiter,
  sonder, setSonder, antraege, setAntraege, fahrzeuge, setFahrzeuge,
  onReset, onLogout, userEmail
}) {
  const { rolle: meineRolle, ma: meinMA } = useMemo(()=>ermittleRolle(userEmail, mitarbeiter), [userEmail, mitarbeiter]);
  const istAdmin = meineRolle==="Admin";
  const istLeitung = istAdmin || meineRolle==="Bauleiter" || meineRolle==="Vorarbeiter";

  const [tab, setTab] = useState("heute");
  const warnungen = useMemo(()=>pruefKonflikte(projekte,sonder,mitarbeiter),[projekte,sonder,mitarbeiter]);

  function resetDaten() { if (onReset) onReset(); }

  const alleTabs = [
    { id:"heute",        label:"📆 Heute" },
    { id:"woche",        label:"📅 Woche" },
    { id:"monat",        label:"🗓 Monat" },
    { id:"stundenzettel",label:"⏱ Stundenzettel" },
    { id:"antraege",     label:`🌴 Anträge${antraege.filter(a=>a.status==="offen").length>0?` (${antraege.filter(a=>a.status==="offen").length})`:""}` },
    { id:"projekte",     label:"🏗 Projekte" },
    { id:"mitarbeiter",  label:"👷 Mitarbeiter" },
    { id:"fahrzeuge",    label:"🚐 Fahrzeuge" },
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
    <div style={{ fontFamily:"'Inter', system-ui, sans-serif", minHeight:"100vh", background:"#f8fafc" }}>
      <div style={{ background:"linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)", padding:"16px 20px", color:"#fff", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ background:"#fff2", borderRadius:10, padding:"6px 10px", fontSize:20 }}>🏗</div>
        <div>
          <div style={{ fontWeight:800, fontSize:17, letterSpacing:-0.5 }}>Einsatzplanung</div>
          <div style={{ fontSize:11, opacity:0.75 }}>Montagefirma · Teams, Projekte & Fahrzeuge</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          {Object.entries(TEAM_COLORS).map(([t,c])=>(
            <span key={t} style={{ background:c.bg+"44", border:`1px solid ${c.bg}88`, borderRadius:6, padding:"2px 8px", fontSize:10, color:"#fff", fontWeight:600 }}>{t}</span>
          ))}
          {userEmail && <span style={{ fontSize:11, color:"#fff", opacity:0.85, marginLeft:8 }}>👤 {userEmail}</span>}
          <span style={{ background:istAdmin?"#16a34a":"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"2px 9px", fontSize:10, color:"#fff", fontWeight:700, marginLeft:2 }}>{meineRolle}</span>
          {onLogout && <button onClick={onLogout} style={{ background:"#fff3", border:"1px solid #fff5", borderRadius:6, padding:"3px 10px", fontSize:11, color:"#fff", fontWeight:600, cursor:"pointer", marginLeft:4 }}>Abmelden</button>}
        </div>
      </div>

      <div style={{ background:"#fff", borderBottom:"1.5px solid #e5e7eb", display:"flex", overflowX:"auto", padding:"0 12px" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"11px 14px", border:"none", background:"none", cursor:"pointer", fontSize:12,
            fontWeight:tab===t.id?700:500, color:tab===t.id?"#1d4ed8":"#6b7280",
            borderBottom:tab===t.id?"2.5px solid #1d4ed8":"2.5px solid transparent",
            whiteSpace:"nowrap", transition:"all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

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
        {tab==="heute"        && darfTab(meineRolle,"heute")        && <Tagesansicht   mitarbeiter={mitarbeiter} projekte={projekte} sonder={sonder} fahrzeuge={fahrzeuge} />}
        {tab==="woche"        && darfTab(meineRolle,"woche")        && <Wochenansicht  mitarbeiter={mitarbeiter} projekte={projekte} sonder={sonder} />}
        {tab==="monat"        && darfTab(meineRolle,"monat")        && <Monatsansicht  mitarbeiter={mitarbeiter} projekte={projekte} sonder={sonder} />}
        {tab==="stundenzettel"&& darfTab(meineRolle,"stundenzettel")&& <Stundenzettel  mitarbeiter={mitarbeiter} projekte={projekte} />}
        {tab==="antraege"     && darfTab(meineRolle,"antraege")     && <Antraege mitarbeiter={mitarbeiter} antraege={antraege} setAntraege={setAntraege} setSonder={setSonder} />}
        {tab==="projekte"     && darfTab(meineRolle,"projekte")     && <ProjektUebersicht projekte={projekte} fahrzeuge={fahrzeuge} />}
        {tab==="mitarbeiter"  && darfTab(meineRolle,"mitarbeiter")  && <MitarbeiterUebersicht mitarbeiter={mitarbeiter} projekte={projekte} />}
        {tab==="fahrzeuge"    && darfTab(meineRolle,"fahrzeuge")    && <FahrzeugUebersicht fahrzeuge={fahrzeuge} projekte={projekte} />}
        {tab==="verwaltung"   && istAdmin                          && <Verwaltung projekte={projekte} setProjekte={setProjekte} mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} fahrzeuge={fahrzeuge} setFahrzeuge={setFahrzeuge} onReset={onReset} />}
        {tab==="warnungen"    && darfTab(meineRolle,"warnungen")    && <WarnPanel warnungen={warnungen} />}
      </div>
    </div>
  );
}
