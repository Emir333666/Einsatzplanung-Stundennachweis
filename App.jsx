import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import EinsatzplanungInner, {
  initProjekte, initMitarbeiter, initFahrzeuge, initSonder
} from "./Einsatzplanung.jsx";

// ─── Umwandlung DB <-> App (snake_case <-> camelCase bei Datumsfeldern) ───────
const toAppProjekt = r => ({ ...r, dateStart: r.date_start, dateEnd: r.date_end, apTel:r.ap_tel, apEmail:r.ap_email, auftragssumme:r.auftragssumme, planStunden:r.plan_stunden, planKosten:r.plan_kosten });
const toDbProjekt  = p => ({
  id:p.id, name:p.name, kunde:p.kunde, ort:p.ort,
  date_start:p.dateStart||null, date_end:p.dateEnd||null,
  team:p.team, status:p.status, fzg:p.fzg, vorarbeiter:p.vorarbeiter, bemerkung:p.bemerkung,
  nummer:p.nummer||null, auftraggeber:p.auftraggeber||null,
  ansprechpartner:p.ansprechpartner||null, ap_tel:p.apTel||null, ap_email:p.apEmail||null,
  land:p.land||null,
  auftragssumme: p.auftragssumme!=null && p.auftragssumme!=="" ? Number(p.auftragssumme) : null,
  plan_stunden: p.planStunden!=null && p.planStunden!=="" ? Number(p.planStunden) : null,
  plan_kosten: p.planKosten!=null && p.planKosten!=="" ? Number(p.planKosten) : null,
  beschreibung:p.beschreibung||null
});
const toAppSonder = r => ({ ...r, dateStart:r.date_start, dateEnd:r.date_end });
const toDbSonder  = s => ({ id:s.id, ma:s.ma, typ:s.typ, date_start:s.dateStart||null, date_end:s.dateEnd||null, bemerkung:s.bemerkung });
const toAppAntrag = r => ({ ...r, dateStart:r.date_start, dateEnd:r.date_end, maName:r.ma_name, eingereicht:r.eingereicht });
const toDbAntrag  = a => ({ id:a.id, ma:a.ma, ma_name:a.maName, team:a.team, typ:a.typ, date_start:a.dateStart||null, date_end:a.dateEnd||null, grund:a.grund, status:a.status, eingereicht:a.eingereicht||null });
const toAppStunde = r => ({ ...r, maId:r.ma_id, maName:r.ma_name, end:r.ende, arbeitsstunden:r.arbeitsstunden, wochentag:r.wochentag });
const toAppUnterkunft = r => ({ ...r, projektId:r.projekt_id, kostenNacht:r.kosten_nacht });
const toDbUnterkunft  = u => ({
  id:u.id, name:u.name, adresse:u.adresse, ansprechpartner:u.ansprechpartner,
  tel:u.tel||null, email:u.email||null,
  checkin:u.checkin||null, checkout:u.checkout||null,
  zimmer: u.zimmer!=null && u.zimmer!=="" ? Number(u.zimmer) : null,
  projekt_id: u.projektId||null, team: u.team||null,
  kosten_nacht: u.kostenNacht!=null && u.kostenNacht!=="" ? Number(u.kostenNacht) : null,
  bemerkung: u.bemerkung||null
});
const toAppBericht = r => ({ ...r, projektId:r.projekt_id, maAnzahl:r.ma_anzahl, fotos:Array.isArray(r.fotos)?r.fotos:[] });
const toDbBericht  = b => ({
  id:b.id, datum:b.datum||null, projekt_id:b.projektId||null, team:b.team||null,
  verfasser:b.verfasser||null, wetter:b.wetter||null, fortschritt:b.fortschritt||null,
  probleme:b.probleme||null, material:b.material||null,
  ma_anzahl: b.maAnzahl!=null && b.maAnzahl!=="" ? Number(b.maAnzahl) : null,
  anwesende: b.anwesende||null,
  leistung: b.leistung!=null && b.leistung!=="" ? Number(b.leistung) : null,
  fotos: b.fotos||[]
});
const toAppWerkzeug = r => ({ ...r, zugeordnetMa:r.zugeordnet_ma, pruefDatum:r.pruef_datum });
const toDbWerkzeug  = w => ({
  id:w.id, name:w.name, typ:w.typ||null, seriennummer:w.seriennummer||null,
  zustand:w.zustand||null,
  zugeordnet_ma: w.zugeordnetMa!=null && w.zugeordnetMa!=="" ? Number(w.zugeordnetMa) : null,
  team:w.team||null, pruef_datum:w.pruefDatum||null, bemerkung:w.bemerkung||null
});
const toDbStunde  = s => ({
  id: s.id,
  ma_id: s.maId, ma_name: s.maName, team: s.team||null,
  datum: s.datum||null, wochentag: s.wochentag||null, kw: s.kw||null,
  projekt: s.projekt||null, start: s.start||null, ende: s.end||null,
  pause: s.pause!=null && s.pause!=="" ? Number(s.pause) : null,
  fahrzeit: s.fahrzeit!=null && s.fahrzeit!=="" ? Number(s.fahrzeit) : null,
  uebernachtung: !!s.uebernachtung,
  spesen: s.spesen!=null && s.spesen!=="" ? Number(s.spesen) : null,
  bemerkung: s.bemerkung||null,
  arbeitsstunden: s.arbeitsstunden!=null && s.arbeitsstunden!=="" ? Number(s.arbeitsstunden) : null
});

// ─── Login-Bildschirm ────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [fehler, setFehler] = useState("");
  const [laden, setLaden] = useState(false);

  async function anmelden(e) {
    e.preventDefault();
    setFehler(""); setLaden(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLaden(false);
    if (error) setFehler("Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.");
    else onLogin();
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", padding:16 }}>
      <form onSubmit={anmelden} style={{ background:"#fff", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:380, boxShadow:"0 10px 40px #0004" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <img src="/icon-192.png" alt="Baufox" style={{ width:64, height:64, borderRadius:14, boxShadow:"0 4px 12px #ea580c55" }} />
          <div style={{ fontWeight:800, fontSize:26, color:"#1e293b", marginTop:10, letterSpacing:-0.5 }}>Baufox</div>
          <div style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Montage-Steuerung</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:5, textTransform:"uppercase" }}>E-Mail</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            style={{ width:"100%", padding:"11px 12px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} placeholder="name@firma.de" />
        </div>
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:5, textTransform:"uppercase" }}>Passwort</div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required
            style={{ width:"100%", padding:"11px 12px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} placeholder="••••••••" />
        </div>
        {fehler && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"9px 12px", fontSize:13, marginBottom:14 }}>{fehler}</div>}
        <button type="submit" disabled={laden} style={{ width:"100%", padding:"12px", borderRadius:9, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", fontWeight:700, fontSize:15, cursor:"pointer", opacity:laden?0.6:1 }}>
          {laden ? "Anmelden…" : "Anmelden"}
        </button>
      </form>
    </div>
  );
}

// ─── Haupt-App mit Login-Schutz und Cloud-Daten ──────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [pruefe, setPruefe] = useState(true);
  const [laden, setLaden] = useState(false);
  const [bereit, setBereit] = useState(false);

  const [projekte, setProjekteState] = useState([]);
  const [mitarbeiter, setMitarbeiterState] = useState([]);
  const [sonder, setSonderState] = useState([]);
  const [antraege, setAntraegeState] = useState([]);
  const [fahrzeuge, setFahrzeugeState] = useState([]);
  const [stunden, setStundenState] = useState([]);
  const [unterkuenfte, setUnterkuenfteState] = useState([]);
  const [berichte, setBerichteState] = useState([]);
  const [werkzeuge, setWerkzeugeState] = useState([]);

  // Session prüfen
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPruefe(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Daten aus der Cloud laden, sobald eingeloggt
  const ladeDaten = useCallback(async () => {
    setLaden(true);
    const [p, m, f, s, a, st, u, tb, wz] = await Promise.all([
      supabase.from("projekte").select("*"),
      supabase.from("mitarbeiter").select("*"),
      supabase.from("fahrzeuge").select("*"),
      supabase.from("sonder").select("*"),
      supabase.from("antraege").select("*"),
      supabase.from("stunden").select("*"),
      supabase.from("unterkuenfte").select("*"),
      supabase.from("tagesberichte").select("*"),
      supabase.from("werkzeuge").select("*"),
    ]);
    setProjekteState((p.data||[]).map(toAppProjekt));
    setMitarbeiterState(m.data||[]);
    setFahrzeugeState(f.data||[]);
    setSonderState((s.data||[]).map(toAppSonder));
    setAntraegeState((a.data||[]).map(toAppAntrag));
    setStundenState((st.data||[]).map(toAppStunde));
    setUnterkuenfteState((u.data||[]).map(toAppUnterkunft));
    setBerichteState((tb.data||[]).map(toAppBericht));
    setWerkzeugeState((wz.data||[]).map(toAppWerkzeug));
    setLaden(false);
    setBereit(true);
  }, []);

  useEffect(() => { if (session) ladeDaten(); }, [session, ladeDaten]);

  // ── Speicher-Funktionen: schreiben in die Cloud, dann neu laden ──
  // ── Hilfsfunktion: Unterschiede berechnen und gezielt speichern ──
  async function syncTabelle(tabelle, alt, neu, toDb = (x)=>x, idFeld = "id") {
    const altIds = new Set(alt.map(x=>x[idFeld]).filter(v=>v!=null));
    const neuIds = new Set(neu.map(x=>x[idFeld]).filter(v=>v!=null));
    // Gelöschte: waren in alt, sind nicht mehr in neu
    const geloescht = [...altIds].filter(id=>!neuIds.has(id));
    if (geloescht.length) await supabase.from(tabelle).delete().in(idFeld, geloescht);
    // Neue (ohne id) einfügen
    const neueOhneId = neu.filter(x=>x[idFeld]==null).map(x=>{ const d=toDb(x); delete d[idFeld]; return d; });
    if (neueOhneId.length) await supabase.from(tabelle).insert(neueOhneId);
    // Bestehende (mit id) aktualisieren/einfügen
    const mitId = neu.filter(x=>x[idFeld]!=null).map(toDb);
    if (mitId.length) await supabase.from(tabelle).upsert(mitId);
  }

  const setProjekte = async (next) => {
    const arr = typeof next === "function" ? next(projekte) : next;
    setProjekteState(arr);
    await syncTabelle("projekte", projekte, arr, toDbProjekt);
    ladeDaten();
  };
  const setMitarbeiter = async (next) => {
    const arr = typeof next === "function" ? next(mitarbeiter) : next;
    setMitarbeiterState(arr);
    await syncTabelle("mitarbeiter", mitarbeiter, arr, (x)=>{ const {created_at, ...rest}=x; return rest; });
    ladeDaten();
  };
  const setFahrzeuge = async (next) => {
    const arr = typeof next === "function" ? next(fahrzeuge) : next;
    setFahrzeugeState(arr);
    await syncTabelle("fahrzeuge", fahrzeuge, arr, (x)=>({...x}));
    ladeDaten();
  };
  const setSonder = async (next) => {
    const arr = typeof next === "function" ? next(sonder) : next;
    setSonderState(arr);
    await syncTabelle("sonder", sonder, arr, toDbSonder);
    ladeDaten();
  };
  const setAntraege = async (next) => {
    const arr = typeof next === "function" ? next(antraege) : next;
    setAntraegeState(arr);
    await syncTabelle("antraege", antraege, arr, toDbAntrag);
    ladeDaten();
  };
  const setStunden = async (next) => {
    const arr = typeof next === "function" ? next(stunden) : next;
    setStundenState(arr);
    await syncTabelle("stunden", stunden, arr, toDbStunde);
    ladeDaten();
  };
  const setUnterkuenfte = async (next) => {
    const arr = typeof next === "function" ? next(unterkuenfte) : next;
    setUnterkuenfteState(arr);
    await syncTabelle("unterkuenfte", unterkuenfte, arr, toDbUnterkunft);
    ladeDaten();
  };
  const setBerichte = async (next) => {
    const arr = typeof next === "function" ? next(berichte) : next;
    setBerichteState(arr);
    await syncTabelle("tagesberichte", berichte, arr, toDbBericht);
    ladeDaten();
  };
  const setWerkzeuge = async (next) => {
    const arr = typeof next === "function" ? next(werkzeuge) : next;
    setWerkzeugeState(arr);
    await syncTabelle("werkzeuge", werkzeuge, arr, toDbWerkzeug);
    ladeDaten();
  };

  // Demo-Daten in leere Cloud laden (einmalig, falls alles leer ist)
  async function demoLaden() {
    if (!window.confirm("Demo-Daten in die Datenbank laden? Nur sinnvoll, wenn noch nichts erfasst ist.")) return;
    await supabase.from("mitarbeiter").insert(initMitarbeiter.map(({id,...r})=>r));
    await supabase.from("fahrzeuge").insert(initFahrzeuge);
    await supabase.from("projekte").insert(initProjekte.map(toDbProjekt));
    await supabase.from("sonder").insert(initSonder.map(toDbSonder));
    ladeDaten();
  }

  async function abmelden() {
    await supabase.auth.signOut();
    setSession(null); setBereit(false);
  }

  if (pruefe) return <Splash text="Lädt…" />;
  if (!session) return <Login onLogin={()=>{}} />;
  if (laden && !bereit) return <Splash text="Daten werden geladen…" />;

  return (
    <>
      <EinsatzplanungInner
        projekte={projekte} setProjekte={setProjekte}
        mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter}
        sonder={sonder} setSonder={setSonder}
        antraege={antraege} setAntraege={setAntraege}
        fahrzeuge={fahrzeuge} setFahrzeuge={setFahrzeuge}
        stunden={stunden} setStunden={setStunden}
        unterkuenfte={unterkuenfte} setUnterkuenfte={setUnterkuenfte}
        berichte={berichte} setBerichte={setBerichte}
        werkzeuge={werkzeuge} setWerkzeuge={setWerkzeuge}
        onReset={null}
        onLogout={abmelden}
        userEmail={session.user?.email}
      />
    </>
  );
}

function Splash({ text }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f8fafc", fontFamily:"'Inter',system-ui,sans-serif", color:"#6b7280", fontSize:15 }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:10 }}>🏗</div>
        {text}
      </div>
    </div>
  );
}
