import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient.js";
import EinsatzplanungInner, {
  initProjekte, initMitarbeiter, initFahrzeuge, initSonder
} from "./Einsatzplanung.jsx";

// ─── Umwandlung DB <-> App (snake_case <-> camelCase bei Datumsfeldern) ───────
const toAppProjekt = r => ({ ...r, dateStart: r.date_start, dateEnd: r.date_end, apTel:r.ap_tel, apEmail:r.ap_email, auftragssumme:r.auftragssumme, planStunden:r.plan_stunden, planKosten:r.plan_kosten, projektleiterId:r.projektleiter_id, bauleiterId:r.bauleiter_id, vertretungId:r.vertretung_id });
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
  mindestlohn: p.mindestlohn!=null && p.mindestlohn!=="" ? Number(p.mindestlohn) : null,
  projektleiter_id: p.projektleiterId!=null && p.projektleiterId!=="" ? Number(p.projektleiterId) : null,
  bauleiter_id: p.bauleiterId!=null && p.bauleiterId!=="" ? Number(p.bauleiterId) : null,
  vertretung_id: p.vertretungId!=null && p.vertretungId!=="" ? Number(p.vertretungId) : null,
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


// ─── Login- / Registrierungs-Bildschirm ──────────────────────────────────────
function Login({ onLogin }) {
  const [modus, setModus] = useState("login");   // "login" | "register" | "beitreten"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [firmaName, setFirmaName] = useState("");
  const [firmenCode, setFirmenCode] = useState("");
  const [fehler, setFehler] = useState("");
  const [hinweis, setHinweis] = useState("");
  const [laden, setLaden] = useState(false);

  const istReg = modus === "register";
  const istBeitritt = modus === "beitreten";

  async function absenden(e) {
    e.preventDefault();
    setFehler(""); setHinweis(""); setLaden(true);

    if (modus === "login") {
      // ── Anmelden (unverändert) ──
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      setLaden(false);
      if (error) setFehler("Anmeldung fehlgeschlagen. E-Mail oder Passwort falsch.");
      else onLogin();
      return;
    }

    if (pw.length < 6) { setLaden(false); setFehler("Das Passwort muss mindestens 6 Zeichen haben."); return; }

    let metaDaten;
    if (istReg) {
      // ── Neue Firma + erster Admin ──
      const name = firmaName.trim();
      if (!name) { setLaden(false); setFehler("Bitte einen Firmennamen eingeben."); return; }
      metaDaten = { firma_name: name };
    } else {
      // ── Mitarbeiter tritt mit Firmencode bei ──
      const code = firmenCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      if (code.length !== 8) { setLaden(false); setFehler("Bitte den 8-stelligen Firmencode eingeben."); return; }
      const { data: gueltig, error: codeFehler } = await supabase.rpc("firmencode_gueltig", { p_code: code });
      if (codeFehler || !gueltig) {
        setLaden(false);
        setFehler("Dieser Firmencode ist ungültig oder die Firma ist nicht aktiv.");
        return;
      }
      metaDaten = { firmencode: code };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: { data: metaDaten }   // <- wird vom DB-Trigger gelesen
    });
    setLaden(false);

    if (error) {
      setFehler(istBeitritt
        ? "Registrierung nicht möglich. Die E-Mail ist evtl. schon vergeben oder das Mitarbeiterlimit der Firma ist erreicht."
        : (error.message || "Registrierung fehlgeschlagen."));
      return;
    }

    if (data.session) {
      onLogin();   // E-Mail-Bestätigung aus -> direkt drin
    } else {
      // E-Mail-Bestätigung an -> erst bestätigen, dann anmelden
      setHinweis("Fast fertig! Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte bestätige deine Adresse und melde dich anschließend an.");
      setModus("login"); setPw(""); setFirmaName(""); setFirmenCode("");
    }
  }

  function wechsel(neu) { setModus(neu); setFehler(""); setHinweis(""); }

  const labelStyle = { fontSize:11, color:"#6b7280", fontWeight:600, marginBottom:5, textTransform:"uppercase" };
  const inputStyle = { width:"100%", padding:"11px 12px", borderRadius:9, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" };
  const linkStyle = { color:"#ea580c", fontWeight:700, cursor:"pointer" };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", padding:16 }}>
      <form onSubmit={absenden} style={{ background:"#fff", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:380, boxShadow:"0 10px 40px #0004" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <img src="/icon-192.png" alt="Baufox" style={{ width:64, height:64, borderRadius:14, boxShadow:"0 4px 12px #ea580c55" }} />
          <div style={{ fontWeight:800, fontSize:26, color:"#1e293b", marginTop:10, letterSpacing:-0.5 }}>Baufox</div>
          <div style={{ fontSize:12, color:"#94a3b8", marginTop:2, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>Montage-Steuerung</div>
        </div>

        {istReg && (
          <div style={{ marginBottom:14 }}>
            <div style={labelStyle}>Firmenname</div>
            <input type="text" value={firmaName} onChange={e=>setFirmaName(e.target.value)} required
              style={inputStyle} placeholder="Mustermann Montage GmbH" />
          </div>
        )}

        {istBeitritt && (
          <div style={{ marginBottom:14 }}>
            <div style={labelStyle}>Firmencode</div>
            <input type="text" value={firmenCode} onChange={e=>setFirmenCode(e.target.value.toUpperCase())} required
              autoCapitalize="characters" autoComplete="off" maxLength={12}
              style={{ ...inputStyle, letterSpacing:2, fontWeight:700 }} placeholder="ABCD-EFGH" />
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Den Code bekommst du von deinem Chef.</div>
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <div style={labelStyle}>E-Mail</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
            style={inputStyle} placeholder="name@firma.de" />
        </div>
        <div style={{ marginBottom:18 }}>
          <div style={labelStyle}>Passwort</div>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)} required
            style={inputStyle} placeholder="••••••••" />
        </div>

        {fehler && <div style={{ background:"#fee2e2", color:"#991b1b", borderRadius:8, padding:"9px 12px", fontSize:13, marginBottom:14 }}>{fehler}</div>}
        {hinweis && <div style={{ background:"#dcfce7", color:"#166534", borderRadius:8, padding:"9px 12px", fontSize:13, marginBottom:14 }}>{hinweis}</div>}

        <button type="submit" disabled={laden} style={{ width:"100%", padding:"12px", borderRadius:9, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", fontWeight:700, fontSize:15, cursor:"pointer", opacity:laden?0.6:1 }}>
          {laden
            ? (modus === "login" ? "Anmelden…" : "Registrieren…")
            : (istReg ? "Firma registrieren" : istBeitritt ? "Mit Firmencode beitreten" : "Anmelden")}
        </button>

        <div style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#6b7280", lineHeight:1.9 }}>
          {modus !== "login" && (
            <div>Schon ein Konto? <span onClick={()=>wechsel("login")} style={linkStyle}>Anmelden</span></div>
          )}
          {modus !== "register" && (
            <div>Neue Firma? <span onClick={()=>wechsel("register")} style={linkStyle}>Firma registrieren</span></div>
          )}
          {modus !== "beitreten" && (
            <div>Mitarbeiter? <span onClick={()=>wechsel("beitreten")} style={linkStyle}>Mit Firmencode beitreten</span></div>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Firmencode-Anzeige (nur für Admins sichtbar) ────────────────────────────
function FirmencodeBox() {
  const [code, setCode] = useState(null);
  const [offen, setOffen] = useState(false);
  const [kopiert, setKopiert] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("mein_firmencode").then(({ data, error }) => {
      if (!error && data) setCode(data);   // Nicht-Admins bekommen null -> Box bleibt unsichtbar
    });
  }, []);

  if (!code) return null;

  const schoen = code.slice(0, 4) + "-" + code.slice(4);

  async function kopieren() {
    try { await navigator.clipboard.writeText(schoen); setKopiert(true); setTimeout(()=>setKopiert(false), 2000); } catch (e) {}
  }

  async function neuErzeugen() {
    if (!window.confirm("Neuen Code erzeugen? Der alte Code funktioniert danach nicht mehr für neue Registrierungen. Bereits angemeldete Mitarbeiter bleiben in deiner Firma.")) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("firmencode_neu");
    setBusy(false);
    if (!error && data) setCode(data);
  }

  return (
    <>
      <button onClick={()=>setOffen(true)} title="Firmencode für Mitarbeiter"
        style={{ position:"fixed", left:12, bottom:12, zIndex:9998, background:"#1e293b", color:"#fff", border:"none", borderRadius:20, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px #0005" }}>
        🔑 Firmencode
      </button>

      {offen && (
        <div onClick={()=>setOffen(false)} style={{ position:"fixed", inset:0, background:"#0008", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:"26px 24px", width:"100%", maxWidth:360, textAlign:"center", fontFamily:"'Inter',system-ui,sans-serif" }}>
            <div style={{ fontWeight:800, fontSize:18, color:"#1e293b" }}>Dein Firmencode</div>
            <div style={{ fontSize:13, color:"#6b7280", marginTop:6 }}>
              Gib diesen Code an deine Mitarbeiter. Sie wählen beim Registrieren „Mit Firmencode beitreten" und landen automatisch in deiner Firma.
            </div>
            <div style={{ fontSize:30, fontWeight:800, letterSpacing:4, color:"#ea580c", margin:"20px 0", fontFamily:"monospace" }}>{schoen}</div>
            <button onClick={kopieren} style={{ width:"100%", padding:"11px", borderRadius:9, background:"linear-gradient(135deg,#ea580c 0%,#f97316 100%)", color:"#fff", border:"none", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {kopiert ? "Kopiert ✓" : "Code kopieren"}
            </button>
            <button onClick={neuErzeugen} disabled={busy} style={{ width:"100%", marginTop:10, padding:"10px", borderRadius:9, background:"#f1f5f9", color:"#334155", border:"none", fontWeight:600, fontSize:13, cursor:"pointer", opacity:busy?0.6:1 }}>
              {busy ? "Erzeuge…" : "Neuen Code erzeugen"}
            </button>
            <div onClick={()=>setOffen(false)} style={{ marginTop:14, fontSize:13, color:"#94a3b8", cursor:"pointer" }}>Schließen</div>
          </div>
        </div>
      )}
    </>
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
  const [teams, setTeamsState] = useState([]);

  // Session prüfen
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setPruefe(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Daten aus der Cloud laden, sobald eingeloggt
  const ladeDaten = useCallback(async () => {
    setLaden(true);
    const [p, m, f, s, a, st, u, tb, wz, tm] = await Promise.all([
      supabase.from("projekte").select("*"),
      supabase.from("mitarbeiter").select("*"),
      supabase.from("fahrzeuge").select("*"),
      supabase.from("sonder").select("*"),
      supabase.from("antraege").select("*"),
      supabase.from("stunden").select("*"),
      supabase.from("unterkuenfte").select("*"),
      supabase.from("tagesberichte").select("*"),
      supabase.from("werkzeuge").select("*"),
      supabase.from("teams").select("*"),
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
    setTeamsState((tm.data||[]).sort((x,y)=>(x.created_at||"").localeCompare(y.created_at||"")));
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
  const setTeams = async (next) => {
    const arr = typeof next === "function" ? next(teams) : next;
    setTeamsState(arr);
    await syncTabelle("teams", teams, arr, (t)=>({ id:t.id, name:t.name }));
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
        teams={teams} setTeams={setTeams}
        onReset={null}
        onLogout={abmelden}
        userEmail={session.user?.email}
      />
      <FirmencodeBox />
    </>
  );
}

function Splash({ text }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#1e293b 0%,#334155 100%)", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/icon-192.png" alt="Baufox" className="splash-logo" style={{ width:72, height:72, borderRadius:16, boxShadow:"0 6px 24px #ea580c66" }} />
        <div style={{ fontWeight:800, fontSize:22, color:"#fff", marginTop:14, letterSpacing:-0.5 }}>Baufox</div>
        <div style={{ fontSize:12, color:"#94a3b8", marginTop:4 }}>{text}</div>
      </div>
    </div>
  );
}
