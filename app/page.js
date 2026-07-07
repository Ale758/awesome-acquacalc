"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Waves,
  Ruler,
  Droplets,
  Fish,
  FlaskConical,
  Beaker,
  ArrowRightLeft,
  Info,
  AlertTriangle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";

const COLORS = {
  deep: "#0D2B2E",
  glass: "#123A3D",
  glassBorder: "rgba(143, 217, 196, 0.18)",
  mint: "#8FD9C4",
  mintDeep: "#4FA98A",
  wood: "#C98B4E",
  woodDeep: "#A66A32",
  textLight: "#E8F2EF",
  textMuted: "#82A8A1",
  warn: "#E0A458",
};

const TABS = [
  { key: "volume", label: "Volume vasca", icon: Ruler },
  { key: "cambio", label: "Cambio acqua", icon: Droplets },
  { key: "popolazione", label: "Popolazione pesci", icon: Fish },
  { key: "durezza", label: "Durezza GH/KH", icon: FlaskConical },
  { key: "co2", label: "Stima CO2", icon: Beaker },
  { key: "dosaggio", label: "Dosaggio prodotto", icon: ArrowRightLeft },
];

// Genera piccoli suoni "a goccia/bolla" al volo con la Web Audio API, senza
// bisogno di file audio esterni (costo zero, nessun asset da caricare).
function useSound() {
  const ctxRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  function getCtx() {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }

  // Un "tick" morbido, come lo scatto di uno slider/picker in iOS.
  // pitch va da 0 a 1 e alza leggermente la nota man mano che sale il valore.
  function playTick(pitch = 0.5) {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 480 + pitch * 260;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      // Web Audio non disponibile in questo browser: ignora silenziosamente
    }
  }

  // Un piccolo "pop" da bolla, per bottoni e cambi di tab.
  function playPop() {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.13, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Web Audio non disponibile in questo browser: ignora silenziosamente
    }
  }

  // Un piccolo "blub-blub", per la reazione dei pesci quando li tocchi.
  function playBlub(pitch = 0.5) {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const base = 300 + pitch * 200;
      [0, 0.1].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const freq = i === 0 ? base : base * 1.35;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.65, ctx.currentTime + offset + 0.07);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + offset + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.09);
      });
    } catch (e) {
      // Web Audio non disponibile in questo browser: ignora silenziosamente
    }
  }

  return { playTick, playPop, playBlub, muted, setMuted };
}

function NumberField({ label, value, onChange, suffix, step = "any", min, onCommit }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs mb-1" style={{ color: COLORS.textMuted }}>
        {label}
      </span>
      <div className="flex items-stretch">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => onCommit && onCommit()}
          className="w-full rounded-l-md px-3 py-2 outline-none"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${COLORS.glassBorder}`,
            color: COLORS.textLight,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
        {suffix && (
          <span
            className="flex items-center px-3 rounded-r-md text-sm"
            style={{
              backgroundColor: "rgba(143,217,196,0.1)",
              border: `1px solid ${COLORS.glassBorder}`,
              borderLeft: "none",
              color: COLORS.textMuted,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function ResultCard({ label, value, unit, highlight }) {
  return (
    <div
      className="rounded-md px-4 py-3 flex items-baseline justify-between"
      style={{
        backgroundColor: highlight ? "rgba(143,217,196,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${highlight ? COLORS.mintDeep : COLORS.glassBorder}`,
      }}
    >
      <span className="text-sm" style={{ color: COLORS.textMuted }}>
        {label}
      </span>
      <span
        className="text-lg font-semibold"
        style={{ color: highlight ? COLORS.mint : COLORS.textLight, fontFamily: "'IBM Plex Mono', monospace" }}
      >
        {value} <span className="text-xs" style={{ color: COLORS.textMuted }}>{unit}</span>
      </span>
    </div>
  );
}

function Note({ children, tone = "info" }) {
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return (
    <div
      className="flex gap-2 rounded-md px-3 py-2 mt-4 text-xs leading-relaxed"
      style={{
        backgroundColor: tone === "warn" ? "rgba(224,164,88,0.1)" : "rgba(143,217,196,0.08)",
        color: tone === "warn" ? COLORS.warn : COLORS.textMuted,
        border: `1px solid ${tone === "warn" ? "rgba(224,164,88,0.3)" : COLORS.glassBorder}`,
      }}
    >
      <Icon size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function WaveDivider() {
  return (
    <svg viewBox="0 0 400 24" preserveAspectRatio="none" className="w-full h-4 mb-8" style={{ opacity: 0.5 }}>
      <path
        d="M0 12 Q 25 0, 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12"
        fill="none"
        stroke={COLORS.mintDeep}
        strokeWidth="2"
      />
    </svg>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Inserisci i litri della tua vasca",
      text: "Se non li conosci, apri il tab \"Volume vasca\" qui sotto: li calcoliamo insieme dalle misure.",
    },
    {
      title: "Scegli lo strumento che ti serve",
      text: "Ogni tab è un calcolatore diverso — cambio acqua, popolazione, durezza, CO₂, dosaggio.",
    },
    {
      title: "Inserisci i tuoi valori",
      text: "Il risultato si aggiorna da solo, mentre scrivi: non c'è nessun pulsante \"calcola\" da premere.",
    },
  ];
  return (
    <div
      className="rounded-lg p-5 mb-6"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.glassBorder}` }}
    >
      <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: COLORS.mint }}>
        Come funziona
      </p>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span
              className="shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
              style={{
                width: "22px",
                height: "22px",
                backgroundColor: "rgba(143,217,196,0.15)",
                color: COLORS.mint,
                border: `1px solid ${COLORS.mintDeep}`,
              }}
            >
              {i + 1}
            </span>
            <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
              <span className="font-semibold" style={{ color: COLORS.textLight }}>
                {s.title}.
              </span>{" "}
              {s.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const TIPS = [
  "Il cambio parziale d'acqua rimuove nitrati e sostanze organiche che il filtro da solo non elimina.",
  "Le piante vive assorbono nitrati e producono ossigeno: aiutano a stabilizzare la vasca in modo naturale.",
  "Acclimatare i pesci nuovi lentamente (goccia a goccia) riduce lo stress da shock termico e chimico.",
  "Un acquario appena avviato ha bisogno di 4-6 settimane di ciclo dell'azoto prima di ospitare molti pesci.",
  "La sovralimentazione è una delle cause più comuni di problemi di qualità dell'acqua.",
  "Il KH agisce da tampone e stabilizza il pH: se è troppo basso, il pH può oscillare bruscamente.",
  "Non tutte le piante acquatiche hanno bisogno di CO2 supplementare: molte crescono bene anche solo con luce e fertilizzante liquido.",
  "Pulire il filtro nell'acqua della vasca, non nell'acqua del rubinetto, preserva i batteri utili che vivono nelle spugne.",
  "I pesci che nuotano in banco, come neon e danio, stanno meglio in gruppi di almeno 6 esemplari.",
  "La luce diretta del sole sulla vasca è una delle cause più comuni di fioriture di alghe.",
  "Un substrato scuro spesso fa risaltare meglio i colori dei pesci rispetto a un substrato chiaro.",
  "Un termometro affidabile è più importante di quanto sembri: molte specie tropicali soffrono variazioni anche di pochi gradi.",
  "Il carbone attivo nel filtro va cambiato regolarmente: dopo un po' smette di assorbire e può rilasciare ciò che ha trattenuto.",
  "Testare l'acqua del rubinetto prima di un cambio aiuta a capire cosa stai davvero aggiungendo in vasca.",
  "Le alghe non sono sempre un problema: in piccola quantità fanno parte di un ecosistema equilibrato.",
];

function TipOfTheDay() {
  const tip = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    return TIPS[dayOfYear % TIPS.length];
  }, []);
  return (
    <div
      className="flex gap-3 rounded-lg px-4 py-3 mb-6"
      style={{ backgroundColor: "rgba(201,139,78,0.1)", border: `1px solid rgba(201,139,78,0.3)` }}
    >
      <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: COLORS.wood }} />
      <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
        <span className="font-semibold" style={{ color: COLORS.wood }}>
          Consiglio del giorno.
        </span>{" "}
        {tip}
      </p>
    </div>
  );
}

function ShareButton({ getText, onCopy }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy && onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        onCopy && onCopy();
        setTimeout(() => setCopied(false), 2000);
      } catch (e2) {
        // copia non riuscita: nessun feedback, l'utente può selezionare il testo a mano
      }
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold mt-3"
      style={{
        backgroundColor: copied ? "rgba(143,217,196,0.15)" : "rgba(255,255,255,0.05)",
        color: copied ? COLORS.mint : COLORS.textMuted,
        border: `1px solid ${copied ? COLORS.mintDeep : COLORS.glassBorder}`,
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copiato! Incollalo dove vuoi" : "Copia risultato"}
    </button>
  );
}

const CURIOSITA_PESCI = [
  "I pesci rossi hanno una memoria più lunga di quanto si pensi: alcuni studi parlano di mesi, non di pochi secondi.",
  "I betta possono respirare aria atmosferica grazie a un organo chiamato labirinto.",
  "Alcuni pesci gatto producono suoni sfregando le pinne pettorali contro il corpo.",
  "I pesci non hanno palpebre: dormono a occhi aperti, semplicemente rallentando i movimenti.",
  "I neon tetra cambiano leggermente colore in base a luce e stress: un piccolo indicatore del loro benessere.",
  "Molti pesci d'acquario percepiscono i cambi di pressione atmosferica e diventano più attivi prima di un temporale.",
  "Le lumache d'acquario aiutano contro le alghe sul vetro, ma si riproducono in fretta se non dosate.",
  "Alcuni pesci riconoscono il volto di chi li nutre abitualmente, distinguendolo da un estraneo.",
];

function FishSVG({ color }) {
  return (
    <svg viewBox="0 0 100 50" width="58" height="29">
      {/* coda biforcuta */}
      <path d="M86,25 L100,9 L90,25 L100,41 Z" fill={color} opacity="0.55" />
      {/* corpo */}
      <path
        d="M14,25 C14,11 44,4 61,9 C74,13 83,19 89,25 C83,31 74,37 61,41 C44,46 14,39 14,25 Z"
        fill={color}
        opacity="0.85"
        stroke={COLORS.deep}
        strokeWidth="0.6"
        strokeOpacity="0.25"
      />
      {/* pinna dorsale */}
      <path d="M33,9 L41,0 L49,10 Z" fill={color} opacity="0.6" />
      {/* pinna pettorale */}
      <path d="M38,31 L29,42 L47,34 Z" fill={color} opacity="0.5" />
      {/* occhio */}
      <circle cx="57" cy="19" r="2.6" fill={COLORS.deep} opacity="0.75" />
      <circle cx="57.9" cy="18" r="0.9" fill="#fff" opacity="0.85" />
    </svg>
  );
}

function SwimmingFish({ name, color, swimDuration, swimDelay, topOffset, pitch, playBlub }) {
  const [reacting, setReacting] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);

  function handleClick(e) {
    e.stopPropagation();
    // Non ignoriamo più il tap se il pesce sta già reagendo: resettiamo
    // semplicemente il timer, così ogni tocco dà sempre un feedback immediato
    // (prima, toccare due volte di seguito sembrava "non fare nulla").
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const line = CURIOSITA_PESCI[Math.floor(Math.random() * CURIOSITA_PESCI.length)];
    setMessage(line);
    setReacting(true);
    if (playBlub) playBlub(pitch);
    timeoutRef.current = setTimeout(() => setReacting(false), 2700);
  }

  return (
    <div
      className="aq-fish-wrap"
      style={{
        top: topOffset,
        animationDuration: `${swimDuration}s`,
        animationDelay: `${swimDelay}s`,
        animationPlayState: reacting ? "paused" : "running",
        pointerEvents: "auto",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Tocca ${name}`}
        className={reacting ? "aq-fish-btn aq-fish-startled" : "aq-fish-btn"}
        style={{ pointerEvents: "auto" }}
      >
        <FishSVG color={color} />
      </button>
      {reacting && (
        <div className="aq-fish-caption" style={{ borderColor: color }}>
          <span style={{ color, fontWeight: 700 }}>{name}</span>
          <span style={{ color: COLORS.textMuted }}> — {message}</span>
        </div>
      )}
    </div>
  );
}

function fmt(n, digits = 1) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("it-IT", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export default function AcquaCalc() {
  const { playTick, playPop, playBlub, muted, setMuted } = useSound();
  const [tab, setTab] = useState("volume");
  const [litriVasca, setLitriVasca] = useState(60);
  const lastRiempimentoRef = useRef(90);

  const [lung, setLung] = useState("60");
  const [larg, setLarg] = useState("30");
  const [alt, setAlt] = useState("35");
  const [riempimento, setRiempimento] = useState(90);

  const litriLordi = useMemo(() => {
    const l = parseFloat(lung), w = parseFloat(larg), h = parseFloat(alt);
    if (!l || !w || !h) return 0;
    return (l * w * h) / 1000;
  }, [lung, larg, alt]);
  const litriNettiCalcolati = litriLordi * (riempimento / 100);

  const [percCambio, setPercCambio] = useState(25);
  const litriDaCambiare = litriVasca * (percCambio / 100);

  const cmMinConservativo = litriVasca / 2;
  const cmMaxPermissivo = litriVasca / 1;

  const [durezzaValore, setDurezzaValore] = useState("6");
  const [durezzaUnita, setDurezzaUnita] = useState("dGH");
  const durezza = useMemo(() => {
    const v = parseFloat(durezzaValore) || 0;
    let dGH;
    if (durezzaUnita === "dGH") dGH = v;
    else if (durezzaUnita === "ppm") dGH = v / 17.848;
    else dGH = v / 0.17832;
    return { dGH, ppm: dGH * 17.848, mmol: dGH * 0.17832 };
  }, [durezzaValore, durezzaUnita]);

  const [pH, setPH] = useState("6.8");
  const [kh, setKh] = useState("4");
  const co2ppm = useMemo(() => {
    const p = parseFloat(pH), k = parseFloat(kh);
    if (!p || !k) return 0;
    return 3 * k * Math.pow(10, 7 - p);
  }, [pH, kh]);

  const [dosePerLitro, setDosePerLitro] = useState("1");
  const [doseUnita, setDoseUnita] = useState("ml");
  const doseTotale = (parseFloat(dosePerLitro) || 0) * litriVasca;

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at top, ${COLORS.glass} 0%, ${COLORS.deep} 55%)`,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .aq-root { font-family: 'IBM Plex Sans', sans-serif; }
        .aq-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
        @keyframes aq-rise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.35; }
          100% { transform: translateY(-620px) scale(1.4); opacity: 0; }
        }
        .aq-bubble { position: absolute; bottom: -40px; border-radius: 50%; background: rgba(143,217,196,0.35); animation: aq-rise linear infinite; }
        @keyframes aq-swim {
          0% { transform: translate(-15vw, 0px); }
          25% { transform: translate(30vw, -10px); }
          50% { transform: translate(65vw, 6px); }
          75% { transform: translate(95vw, -6px); }
          100% { transform: translate(120vw, 0px); }
        }
        .aq-fish-wrap { position: absolute; top: 18%; left: 0; animation: aq-swim 28s linear infinite; z-index: 30; will-change: transform; }
        .aq-fish-btn {
          background: none;
          border: none;
          /* padding + margin negativo = area di tocco molto più grande (circa 3 volte),
             ma il pesce resta visivamente identico e nella stessa posizione: prima
             il bersaglio era di soli 58x29px in movimento continuo, praticamente
             impossibile da colpire con precisione su schermo touch. */
          padding: 18px;
          margin: -18px;
          cursor: pointer;
          display: inline-block;
          transform-origin: 50% 50%;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        @keyframes aq-fish-startle {
          0% { transform: rotate(0deg) scale(1); }
          15% { transform: rotate(-9deg) scale(1.1); }
          32% { transform: rotate(7deg) scale(1.06); }
          50% { transform: rotate(-5deg) scale(1.04); }
          68% { transform: rotate(3deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
        .aq-fish-startled { animation: aq-fish-startle 0.6s ease-out; }
        @keyframes aq-caption-fade {
          0% { opacity: 0; transform: translateY(4px); }
          12% { opacity: 1; transform: translateY(0); }
          82% { opacity: 1; }
          100% { opacity: 0; }
        }
        .aq-fish-caption {
          position: absolute;
          top: 32px;
          left: 50%;
          margin-left: -100px;
          width: 200px;
          font-size: 11px;
          line-height: 1.4;
          padding: 6px 9px;
          border-radius: 8px;
          background: rgba(13,43,46,0.92);
          border: 1px solid;
          animation: aq-caption-fade 2.7s ease-in-out;
          z-index: 5;
        }
        @media (prefers-reduced-motion: reduce) {
          .aq-bubble { animation: none; display: none; }
          .aq-fish-wrap { animation: none; display: none; }
          .aq-fish-startled { animation: none; }
          .aq-fish-caption { animation: none; }
        }
      `}</style>

      {/* Didi e Gogo — nuotano avanti e indietro senza una vera meta */}
      <SwimmingFish name="Didi" color={COLORS.mint} swimDuration={28} swimDelay={0} topOffset="16%" pitch={0.7} playBlub={playBlub} />
      <SwimmingFish name="Gogo" color={COLORS.wood} swimDuration={34} swimDelay={-9} topOffset="27%" pitch={0.3} playBlub={playBlub} />

      {/* Bolle ambientali */}
      {[
        { left: "6%", size: 8, dur: 14, delay: 0 },
        { left: "18%", size: 5, dur: 11, delay: 3 },
        { left: "31%", size: 10, dur: 17, delay: 1 },
        { left: "47%", size: 6, dur: 13, delay: 5 },
        { left: "62%", size: 9, dur: 16, delay: 2 },
        { left: "78%", size: 5, dur: 12, delay: 6 },
        { left: "90%", size: 7, dur: 15, delay: 4 },
      ].map((b, i) => (
        <span
          key={i}
          className="aq-bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      <div className="aq-root relative max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Waves size={22} style={{ color: COLORS.mint }} />
            <h1 className="aq-display text-4xl" style={{ color: COLORS.textLight, fontWeight: 600 }}>
              AcquaCalc
            </h1>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Attiva suoni" : "Disattiva suoni"}
            className="rounded-full p-2"
            style={{ border: `1px solid ${COLORS.glassBorder}`, color: COLORS.textMuted }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
        <p className="text-sm mb-1 leading-relaxed" style={{ color: COLORS.textMuted }}>
          Sei calcolatori per chi ha (o sta per allestire) un acquario d'acqua dolce: dal volume esatto
          della vasca alla dose giusta di un prodotto, passando per la manutenzione settimanale.
        </p>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: COLORS.textMuted }}>
          Niente da scaricare, niente account — ecco come iniziare:
        </p>

        <TipOfTheDay />

        <WaveDivider />

        <HowItWorks />

        {/* Litri vasca — valore condiviso */}
        <div
          className="rounded-md px-4 py-3 mb-6 flex items-center justify-between gap-4"
          style={{
            backgroundColor: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            boxShadow: "0 4px 18px rgba(0,0,0,0.25)",
          }}
        >
          <span className="text-sm" style={{ color: COLORS.textMuted }}>
            Litri netti della tua vasca
            <span className="block text-xs mt-0.5" style={{ color: COLORS.textMuted, opacity: 0.75 }}>
              usato in Cambio acqua, Popolazione e Dosaggio
            </span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={litriVasca}
              onChange={(e) => setLitriVasca(parseFloat(e.target.value) || 0)}
              onBlur={() => playTick(0.6)}
              className="w-24 text-right rounded-md px-2 py-1 outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: `1px solid ${COLORS.glassBorder}`,
                color: COLORS.mint,
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            />
            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              L
            </span>
          </div>
        </div>

        {/* Tab chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  playPop();
                }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition"
                style={{
                  backgroundColor: active ? COLORS.mint : "rgba(255,255,255,0.05)",
                  color: active ? COLORS.deep : COLORS.textMuted,
                  border: `1px solid ${active ? COLORS.mint : COLORS.glassBorder}`,
                  boxShadow: active ? "0 3px 10px rgba(143,217,196,0.3)" : "none",
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: COLORS.glass,
            border: `1px solid ${COLORS.glassBorder}`,
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          }}
        >
          {tab === "volume" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Volume della vasca
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Il primo numero da cui dipende quasi tutto il resto: quanti litri d'acqua contiene
                davvero la vasca, non solo sulla carta ma al netto di substrato e decorazioni.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <NumberField label="Lunghezza" value={lung} onChange={setLung} suffix="cm" onCommit={() => playTick(0.3)} />
                <NumberField label="Larghezza" value={larg} onChange={setLarg} suffix="cm" onCommit={() => playTick(0.3)} />
                <NumberField label="Altezza" value={alt} onChange={setAlt} suffix="cm" onCommit={() => playTick(0.3)} />
              </div>
              <label className="block mb-4">
                <span className="block text-xs mb-1" style={{ color: COLORS.textMuted }}>
                  Riempimento effettivo (substrato, decor, filo d'acqua non a filo bordo): {riempimento}%
                </span>
                <input
                  type="range"
                  min={70}
                  max={100}
                  value={riempimento}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setRiempimento(val);
                    if (val !== lastRiempimentoRef.current) {
                      playTick((val - 70) / 30);
                      lastRiempimentoRef.current = val;
                    }
                  }}
                  className="w-full"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <ResultCard label="Litri lordi" value={fmt(litriLordi)} unit="L" />
                <ResultCard label="Litri netti stimati" value={fmt(litriNettiCalcolati)} unit="L" highlight />
              </div>
              <button
                onClick={() => {
                  setLitriVasca(Math.round(litriNettiCalcolati));
                  playPop();
                }}
                disabled={!litriNettiCalcolati}
                className="w-full rounded-md py-2 text-sm font-semibold mt-2"
                style={{
                  backgroundColor: litriNettiCalcolati ? COLORS.mint : "rgba(255,255,255,0.08)",
                  color: litriNettiCalcolati ? COLORS.deep : COLORS.textMuted,
                }}
              >
                Usa questo valore negli altri calcolatori
              </button>
              <Note>
                I litri lordi sono il volume geometrico pieno. I litri netti sottraggono substrato, decorazioni e lo spazio non riempito d'acqua fino al bordo — è il numero che conta davvero per popolamento e dosaggi.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() =>
                  `La mia vasca è ${lung}×${larg}×${alt} cm → ${fmt(litriNettiCalcolati)} L netti (calcolato con AcquaCalc)`
                }
              />
            </div>
          )}

          {tab === "cambio" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Cambio parziale d'acqua
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Utile ogni volta che fai manutenzione: scegli la percentuale che vuoi cambiare e
                scopri esattamente quanti litri togliere e rimettere, senza andare a occhio.
              </p>
              <label className="block mb-5">
                <span className="block text-xs mb-2" style={{ color: COLORS.textMuted }}>
                  Percentuale di cambio
                </span>
                <div className="flex gap-2">
                  {[10, 20, 25, 30, 50].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPercCambio(p);
                        playTick(p / 50);
                      }}
                      className="flex-1 rounded-md py-2 text-sm font-semibold"
                      style={{
                        backgroundColor: percCambio === p ? COLORS.mint : "rgba(255,255,255,0.05)",
                        color: percCambio === p ? COLORS.deep : COLORS.textMuted,
                        border: `1px solid ${percCambio === p ? COLORS.mint : COLORS.glassBorder}`,
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </label>
              <ResultCard label={`${percCambio}% di ${fmt(litriVasca, 0)} L`} value={fmt(litriDaCambiare)} unit="L da rimuovere/aggiungere" highlight />
              <Note>
                Un cambio regolare del 20–30% a settimana è una pratica comune per diluire nitrati e rifornire minerali, ma la frequenza ideale dipende dal popolamento e dalla filtrazione della tua vasca.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() =>
                  `Cambio acqua: ${percCambio}% di ${fmt(litriVasca, 0)} L = ${fmt(litriDaCambiare)} L da cambiare (AcquaCalc)`
                }
              />
            </div>
          )}

          {tab === "popolazione" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Popolazione pesci indicativa
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Prima di aggiungere nuovi pesci, una stima di quanto "spazio" hai ancora a disposizione
                nella vasca, in base ai litri netti che hai inserito sopra.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <ResultCard label="Stima prudente (2L/cm)" value={fmt(cmMinConservativo, 0)} unit="cm totali di pesce adulto" />
                <ResultCard label="Stima permissiva (1L/cm)" value={fmt(cmMaxPermissivo, 0)} unit="cm totali di pesce adulto" highlight />
              </div>
              <Note tone="warn">
                Questa è una regola empirica molto approssimativa, pensata solo come punto di partenza per vasche comunitarie ben filtrate. Non tiene conto di comportamento territoriale, forma del pesce, specie che nuotano in gruppo o necessitano di molto più spazio (es. ciclidi, pesci rossi, specie di grossa taglia). Verifica sempre le esigenze specifiche di ogni specie prima di acquistarla.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() =>
                  `Nella mia vasca da ${fmt(litriVasca, 0)} L posso avere indicativamente ${fmt(cmMinConservativo, 0)}–${fmt(cmMaxPermissivo, 0)} cm totali di pesce adulto (stima AcquaCalc)`
                }
              />
            </div>
          )}

          {tab === "durezza" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Conversione durezza dell'acqua
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Il tuo test dà il valore in un'unità, ma la guida di una specie o pianta lo indica in
                un'altra: inserisci quello che hai e converti automaticamente negli altri due.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <NumberField label="Valore misurato" value={durezzaValore} onChange={setDurezzaValore} onCommit={() => playTick(0.5)} />
                <label className="block mb-4">
                  <span className="block text-xs mb-1" style={{ color: COLORS.textMuted }}>
                    Unità
                  </span>
                  <select
                    value={durezzaUnita}
                    onChange={(e) => {
                      setDurezzaUnita(e.target.value);
                      playTick(0.5);
                    }}
                    className="w-full rounded-md px-3 py-2 outline-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: `1px solid ${COLORS.glassBorder}`,
                      color: COLORS.textLight,
                    }}
                  >
                    <option value="dGH" style={{ color: "#000" }}>°dGH (gradi tedeschi)</option>
                    <option value="ppm" style={{ color: "#000" }}>ppm / mg-L CaCO₃</option>
                    <option value="mmol" style={{ color: "#000" }}>mmol/L</option>
                  </select>
                </label>
              </div>
              <div className="space-y-2">
                <ResultCard label="°dGH" value={fmt(durezza.dGH, 2)} unit="gradi tedeschi" highlight={durezzaUnita !== "dGH"} />
                <ResultCard label="ppm CaCO₃" value={fmt(durezza.ppm, 1)} unit="mg/L" highlight={durezzaUnita !== "ppm"} />
                <ResultCard label="mmol/L" value={fmt(durezza.mmol, 3)} unit="mmol/L" highlight={durezzaUnita !== "mmol"} />
              </div>
              <Note>
                1 °dGH = 17,848 ppm (mg/L) di CaCO₃ equivalente = 0,1783 mmol/L. Il GH misura calcio + magnesio insieme: senza un test separato per ciascuno, questa conversione non può distinguerli.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() =>
                  `La mia acqua ha durezza ${fmt(durezza.dGH, 2)} °dGH (${fmt(durezza.ppm, 1)} ppm CaCO₃, ${fmt(durezza.mmol, 3)} mmol/L) — convertito con AcquaCalc`
                }
              />
            </div>
          )}

          {tab === "co2" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Stima CO₂ disciolta
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Se hai un acquario con piante e inietti CO₂, questo ti dà un'idea approssimativa di
                quanta CO₂ è disciolta nell'acqua, partendo dai valori di pH e KH che misuri con un test.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="pH misurato" value={pH} onChange={setPH} step="0.1" onCommit={() => playTick(0.5)} />
                <NumberField label="KH" value={kh} onChange={setKh} suffix="°dKH" onCommit={() => playTick(0.5)} />
              </div>
              <ResultCard label="CO₂ stimata" value={fmt(co2ppm)} unit="ppm (mg/L)" highlight />
              <Note tone="warn">
                Questa è solo una stima matematica (CO₂ ≈ 3 × KH × 10^(7 − pH)), valida solo se il pH è influenzato unicamente dalla CO₂ — in pratica quasi mai vero al 100%, per la presenza di altri acidi o substrati che alterano il pH. Non sostituisce un drop checker o un test diretto della CO₂, soprattutto per la sicurezza dei pesci in caso di sovradosaggio.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() => `Con pH ${pH} e KH ${kh}, la CO₂ stimata nella mia vasca è ${fmt(co2ppm)} ppm (stima AcquaCalc)`}
              />
            </div>
          )}

          {tab === "dosaggio" && (
            <div>
              <h2 className="aq-display text-xl mb-1" style={{ color: COLORS.textLight, fontWeight: 600 }}>
                Dosaggio prodotto per la vasca
              </h2>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                Fertilizzanti, condizionatori o farmaci indicano spesso una dose "per litro" sull'etichetta:
                inseriscila qui e calcola subito la dose totale per la tua vasca, senza fare i conti a mano.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Dose indicata sull'etichetta" value={dosePerLitro} onChange={setDosePerLitro} step="0.01" onCommit={() => playTick(0.5)} />
                <label className="block mb-4">
                  <span className="block text-xs mb-1" style={{ color: COLORS.textMuted }}>
                    per litro, in
                  </span>
                  <select
                    value={doseUnita}
                    onChange={(e) => {
                      setDoseUnita(e.target.value);
                      playTick(0.5);
                    }}
                    className="w-full rounded-md px-3 py-2 outline-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: `1px solid ${COLORS.glassBorder}`,
                      color: COLORS.textLight,
                    }}
                  >
                    <option value="ml" style={{ color: "#000" }}>ml</option>
                    <option value="g" style={{ color: "#000" }}>g</option>
                    <option value="gocce" style={{ color: "#000" }}>gocce</option>
                  </select>
                </label>
              </div>
              <ResultCard label={`Per i tuoi ${fmt(litriVasca, 0)} L`} value={fmt(doseTotale, 2)} unit={doseUnita} highlight />
              <Note>
                Calcola solo la moltiplicazione dose-per-litro × litri della tua vasca. La dose corretta per litro va sempre presa dall'etichetta del tuo prodotto specifico: prodotti diversi (fertilizzanti, condizionatori, farmaci) hanno concentrazioni molto diverse tra loro.
              </Note>
              <ShareButton
                onCopy={playPop}
                getText={() => `Per la mia vasca da ${fmt(litriVasca, 0)} L, la dose di prodotto è ${fmt(doseTotale, 2)} ${doseUnita} (AcquaCalc)`}
              />
            </div>
          )}
        </div>

        {/* FAQ testuali — aiutano Google a indicizzare il sito su domande specifiche */}
        <div className="mt-10">
          <h2 className="aq-display text-2xl mb-4" style={{ color: COLORS.textLight, fontWeight: 600 }}>
            Domande frequenti
          </h2>
          <div className="space-y-2">
            {[
              {
                q: "Quanti pesci posso mettere in un acquario da 100 litri?",
                a: "Con la regola empirica usata in questo sito (indicativa, non una legge scientifica), tra circa 50 e 100 cm totali di pesce adulto, a seconda di quanto vuoi essere prudente. Conta molto anche la specie: pesci territoriali, di grossa taglia o che nuotano in banco hanno esigenze molto diverse dal semplice calcolo dei litri. Usa il tab \"Popolazione pesci\" qui sopra per calcolarlo con i tuoi litri esatti.",
              },
              {
                q: "Come si calcola il volume di un acquario in litri?",
                a: "Si moltiplicano lunghezza × larghezza × altezza in centimetri, e si divide per 1000. Questo dà i litri \"lordi\", cioè il volume geometrico pieno: per i litri netti reali va sottratto lo spazio occupato da substrato, decorazioni e il fatto che l'acqua di solito non arriva fino al bordo. Il tab \"Volume vasca\" qui sopra fa entrambi i calcoli automaticamente.",
              },
              {
                q: "Ogni quanto va fatto il cambio dell'acqua in un acquario?",
                a: "Una pratica comune è un cambio del 20-30% a settimana, ma la frequenza ideale dipende da quanti pesci hai, da quanto filtri e da quanto la vasca ha piante vive che assorbono nitrati. Il tab \"Cambio acqua\" calcola quanti litri togliere per la percentuale che scegli.",
              },
              {
                q: "Cosa sono il GH e il KH in acquariofilia?",
                a: "Il GH (durezza generale) misura calcio e magnesio disciolti nell'acqua; il KH (durezza carbonatica) misura la capacità dell'acqua di resistere a variazioni di pH. Si misurano entrambi con appositi test a goccia o strisce, spesso in unità diverse a seconda del produttore — per questo il tab \"Durezza GH/KH\" converte automaticamente tra °dGH, ppm e mmol/L.",
              },
              {
                q: "Come si stima la CO2 disciolta in un acquario con piante?",
                a: "Partendo da due valori misurati con un test, pH e KH, si può stimare la CO2 disciolta con una formula matematica (CO2 ≈ 3 × KH × 10^(7 − pH)). È solo una stima approssimativa, non un test diretto: per la sicurezza dei pesci resta comunque consigliato un drop checker.",
              },
              {
                q: "AcquaCalc è gratuito?",
                a: "Sì. Tutti i calcoli avvengono direttamente nel browser, non serve creare un account e non ci sono funzioni a pagamento.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="rounded-md px-4 py-3"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.glassBorder}` }}
              >
                <summary
                  className="text-sm font-semibold cursor-pointer"
                  style={{ color: COLORS.textLight }}
                >
                  {item.q}
                </summary>
                <p className="text-xs leading-relaxed mt-2" style={{ color: COLORS.textMuted }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: COLORS.textMuted }}>
          Tutti i calcoli avvengono nel tuo browser. Nessun dato viene salvato o inviato altrove.
        </p>
      </div>
    </div>
  );
}
