import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, ChevronRight, Expand, CheckCircle2, Clock, CircleDashed, Star, Sparkles, CircleDot } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const slides = [
  {
    section: "Portada",
    type: "hero",
    kicker: "Ética de la Ciencia de Datos",
    title: "Análisis Ético de TalentOps Copilot",
    emphasis: "Sistema advisory de recomendación de talento, evaluado bajo el marco AI4People.",
    body: "Enrique Ulises Báez Gómez Tagle y Luis Alejandro Guillén Álvarez · Maestría en Ciencia de Datos · Universidad Panamericana.",
    image: "/mascot.svg",
  },
  {
    section: "AI4People",
    type: "card-grid",
    kicker: "Marco teórico",
    title: "Cinco principios rectores (AI4People)",
    emphasis: "Derivados de la tradición biomédica y adaptados a la IA.",
    cards: [
      { title: "Beneficencia", body: "Beneficio neto: reduce tiempos de staffing, visibiliza oportunidades y mantiene la bandera de bienestar." },
      { title: "No maleficencia", body: "Evitar daño: guía los controles de privacidad, seguridad y calidad." },
      { title: "Autonomía", body: "Preservar el criterio humano: guardrails G1–G7 y arquitectura advisory." },
      { title: "Justicia", body: "Distribución equitativa: medición de sesgo por idioma, sin atributos sensibles." },
      { title: "Explicabilidad", body: "Comprensible y auditable: output con must-haves, gaps y red flags." },
    ],
  },
  {
    section: "Preocupaciones",
    type: "table",
    kicker: "Identificación",
    title: "Nueve preocupaciones éticas",
    emphasis: "Cada una anclada al principio AI4People que mejor la fundamenta.",
    headers: ["Preocupación", "Principio", "Justificación"],
    rows: [
      ["Privacidad y datos", "No maleficencia", "CVs y Clockify contienen PII y datos operativos sensibles."],
      ["No discriminación", "Justicia", "Sesgos por idioma/formato/dominio pueden excluir perfiles viables."],
      ["Transparencia", "Explicabilidad", "Evitar la dependencia ciega del score."],
      ["Supervisión humana", "Autonomía", "Riesgo de automation bias si el ranking se toma como decisión."],
      ["Trazabilidad", "Explicabilidad", "Reconstruir qué datos y modelo generaron una recomendación."],
      ["Calidad y confiabilidad", "No maleficencia", "Errores de extracción, drift o timeouts."],
      ["Bienestar laboral", "Beneficencia", "Recomendar sobreasignados normaliza la sobrecarga."],
      ["Limitación de propósito", "Autonomía", "El fit_score podría reutilizarse para desempeño o disciplina."],
      ["Seguridad y acceso", "No maleficencia", "Exposición de CVs, scores o datos de carga."],
    ],
  },
  {
    section: "Metodología",
    type: "cols",
    kicker: "Cómo medimos el riesgo",
    title: "FMEA · RPN y escala de beneficio",
    emphasis: "Escala 1–5 en tres dimensiones; RPN = S × O × D.",
    leftTitle: "Dimensiones FMEA",
    left: [
      "Severidad (S): daño potencial. 1 mínimo … 5 catastrófico.",
      "Ocurrencia (O): probabilidad de ocurrencia. 1 raro … 5 casi seguro.",
      "Detección (D): dificultad de detectar. 1 fácil … 5 muy difícil.",
      "RPN = S × O × D. A mayor RPN, mitigación más prioritaria.",
    ],
    rightTitle: "Niveles y beneficio",
    right: [
      "Nivel por S×O: Bajo 1–4 · Medio 5–9 · Alto 10–14 · Muy alto 15–25.",
      "El nivel del mapa de calor NO incluye detección; el RPN sí.",
      "Escala de beneficio: Muy Alto (10), Alto (7), Moderado (4), Bajo (1).",
      "Ambos se combinan en la matriz beneficio-riesgo.",
    ],
  },
  {
    section: "Mapa de calor",
    type: "heatmap",
    kicker: "Severidad × Ocurrencia",
    title: "Mapa de calor de riesgos éticos",
    emphasis: "Posición de R1–R10 por severidad × ocurrencia (riesgo inherente, sin detección). ✓ = mitigación ya cubierta.",
  },
  {
    section: "Beneficio-Riesgo",
    type: "benefit-risk",
    kicker: "Decisión de despliegue",
    title: "Matriz beneficio-riesgo",
    emphasis: "Muy Alto beneficio × Riesgo moderado → Limitar acceso.",
  },
  {
    section: "Trazabilidad",
    type: "table",
    kicker: "Cadena completa",
    title: "Preocupación → principio → FMEA → mitigación",
    emphasis: "Cobertura actual y mitigación prioritaria por preocupación, según el riesgo cuantificado.",
    headers: ["Preocupación", "FMEA", "RPN", "Nivel", "Estado", "Mitigación prioritaria"],
    rows: [
      ["Privacidad", "R9", "30", "H", "Cubierto", "Pseudonimización en outputs/logs y retención automatizada en operación; monitoreo de campos expuestos."],
      ["No discriminación", "R2, R3", "36", "H", "Parcial", "Canal de corrección de CV; pruebas de sesgo; rúbricas inclusivas."],
      ["Transparencia", "R8", "24", "M", "Parcial", "UI resalta red flags; confirmación explícita por rol."],
      ["Supervisión humana", "R4", "45", "VH", "Cubierto", "Confirmación humana obligatoria en operación; registro reviewer/timestamp."],
      ["Trazabilidad", "R10", "24", "M", "Cubierto", "Change requests; re-ejecución de baseline."],
      ["Calidad", "R1, R7", "16", "M", "Cubierto", "Monitoreo de drift y rollback activos; pruebas adversariales."],
      ["Bienestar laboral", "R6", "32", "VH", "Parcial", "PRIORITARIO: política de carga saludable; autorización >85 %."],
      ["Limitación de propósito", "R5", "40", "H", "Parcial", "Política de no uso secundario; permisos que limiten export."],
      ["Seguridad", "R2, R9", "36", "H", "Parcial", "Clasificación de datos; revisión IAM; cifrado verificado; incident response."],
    ],
  },
  {
    section: "Marco legal",
    type: "table",
    kicker: "Criterios de cumplimiento",
    title: "Leyes aplicables",
    emphasis: "Criterio académico; no sustituye una opinión jurídica.",
    headers: ["Marco", "Relevancia para el proyecto", "Estado"],
    rows: [
      ["LFPDPPP", "Tratamiento de datos personales en CVs y Clockify.", "Implementado base"],
      ["LFPED", "Evitar exclusiones injustas en oportunidades laborales.", "Implementado base"],
      ["LFT", "Condiciones de trabajo y sobreasignación.", "Implementado base"],
      ["GDPR / extranjero", "Candidatos o proveedores fuera de México.", "Implementado base"],
    ],
  },
  {
    section: "Requerimientos",
    type: "table",
    kicker: "Por impacto ético",
    title: "Requerimientos y su estado actual",
    emphasis: "Técnicos, operacionales y organizacionales por impacto.",
    headers: ["Impacto", "Requerimiento clave", "Estado"],
    rows: [
      ["Privacidad", "Acceso S3, pseudonimización en outputs y logs, retención automatizada.", "Implementado"],
      ["Equidad", "Métricas por idioma/seniority/dominio; pruebas de proxies.", "Implementado inicial; ampliar"],
      ["Explicabilidad", "Mostrar must-haves, gaps, red flags y fit_score.", "Implementado; mejorar UI"],
      ["Supervisión humana", "El sistema no avanza candidatos sin confirmación humana.", "Implementado"],
      ["Sobreasignación", "Consulta Clockify y bandera >85 %.", "Implementado; definir acción"],
      ["Confiabilidad", "CI/CD, drift checks, fallback y alertas.", "Implementado"],
      ["Trazabilidad", "Snapshot, model IDs, checksums y logs.", "Implementado"],
      ["Uso secundario", "Permisos que limiten export de scores.", "Definido en alcance; reforzar"],
    ],
  },
  {
    section: "Recomendaciones",
    type: "bullets",
    kicker: "Mitigación priorizada",
    title: "Recomendaciones priorizadas",
    emphasis: "Con los controles del piloto ya operando, lo pendiente es institucionalizarlos y escalarlos de dos áreas a toda la empresa.",
    bullets: [
      "[PRIORITARIO] Definir política de sobreasignación: cuándo bloquear, escalar o autorizar carga >85 % (RPN 32, VH).",
      "Convertir el \"no uso secundario\" del fit_score en política formal, con permisos que limiten su exportación (RPN 40).",
      "Habilitar canal de corrección de CV y monitoreo de equidad por idioma, seniority y dominio (RPN 36).",
      "Formalizar aviso de privacidad para IA y procedimiento ARCO para candidatos externos.",
      "Fortalecer la explicabilidad en la UI: resaltar gaps críticos y mensajes de baja confianza.",
      "Repetir la validación humana (κ) y las pruebas de sesgo al abrir nuevos dominios o lotes.",
      "Escalar por dominio —con gobierno de datos y estándares éticos comunes— hacia las ~22 000 vacantes y candidatos de toda la empresa.",
    ],
    notes: ["Ya implementado en el piloto (DevOps y Data&AI): supervisión humana obligatoria (no avanza sin revisión), privacidad (pseudonimización + retención automatizada), confiabilidad (CI/CD, drift, fallback, alertas) y trazabilidad técnica (snapshot, model IDs, checksums, logs)."],
  },
  {
    section: "Conclusión",
    type: "closing",
    kicker: "Recomendación final",
    title: "Despliegue bajo supervisión controlada",
    emphasis: "Muy Alto beneficio × Riesgo moderado.",
    body: "El sistema ya incorpora controles relevantes de IA responsable. El reto es escalar de un piloto acotado a dos áreas (DevOps y Data&AI) hacia toda la empresa. Implica institucionalizar lo que hoy son decisiones del proyecto —guardrails, privacidad, supervisión humana y trazabilidad— como política corporativa, gobierno de datos y estándares éticos que cubran todas las operaciones y cada decisión de talento, no solo las de estas dos áreas.",
  },
];

const DEFAULT_SESSION = "demo";
const SHOULD_LOG =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "::1" ||
  window.location.search.includes("debug=1");
const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_URL = RAW_SUPABASE_URL?.replace(".supabase.com", ".supabase.co");
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function logEvent(message, payload = null) {
  if (SHOULD_LOG) {
    console.info(`[deck-template] ${message}`, payload || "");
  }
}

function logError(message, payload = null) {
  console.error(`[deck-template] ${message}`, payload || "");
}
if (SHOULD_LOG) {
  logEvent("boot", {
    href: window.location.href,
    hasSupabaseUrl: !!SUPABASE_URL,
    hasPublishableKey: !!SUPABASE_PUBLISHABLE_KEY,
    defaultSession: DEFAULT_SESSION,
  });
  window.addEventListener("error", (event) => {
    logError("window.error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    logError("window.unhandledrejection", {
      reason: event.reason?.message || String(event.reason),
    });
  });
}
let deckClient = null;

function getRouteConfig() {
  const params = new URLSearchParams(window.location.search);
  return {
    isController: params.get("control") === "1",
    session: params.get("session") || DEFAULT_SESSION,
    requestedDebug: params.get("debug") === "1",
  };
}

function createDeckClient() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    logError("createDeckClient skipped", {
      missingUrl: !SUPABASE_URL,
      missingKey: !SUPABASE_PUBLISHABLE_KEY,
    });
    return null;
  }
  if (deckClient) return deckClient;

  deckClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    realtime: {
      params: {
        log_level: "info",
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: "template-deck-auth",
    },
  });
  logEvent("createDeckClient initialized", {});
  return deckClient;
}

function getDeckChannelName(session) {
  return `deck-control:${session}`;
}

function makeDeckState(index, session) {
  const slide = slides[index];
  return {
    index,
    total: slides.length,
    section: slide.section,
    title: slide.title,
    session,
    updatedAt: Date.now(),
  };
}

function DeckPresentation({ session, supabase }) {
  const [index, setIndex] = useState(() => {
    const hash = parseInt(window.location.hash.replace("#", ""), 10);
    return hash >= 1 && hash <= slides.length ? hash - 1 : 0;
  });
  const slide = slides[index];
  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index]);
  const indexRef = useRef(index);
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  const next = useCallback(() => setIndex((current) => Math.min(current + 1, slides.length - 1)), []);
  const prev = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

  useEffect(() => { window.location.hash = index + 1; }, [index]);
  useEffect(() => { indexRef.current = index; }, [index]);

  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    const sendState = () => {
      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "deck-state",
          payload: makeDeckState(indexRef.current, session),
        });
        logEvent("presentation.sendState", {
          session,
          index: indexRef.current,
        });
      } catch (error) {
        logError("presentation.sendState.error", { error: error?.message || String(error) });
      }
    };

      const channel = supabase
      .channel(getDeckChannelName(session), { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "deck-command" }, ({ payload }) => {
        logEvent("presentation.deck-command", { command: payload?.command });
        if (payload?.command === "next") next();
        if (payload?.command === "prev") prev();
        if (payload?.command === "first") setIndex(0);
        if (payload?.command === "last") setIndex(slides.length - 1);
        if (payload?.command === "goto" && Number.isInteger(payload.index)) {
          setIndex(Math.max(0, Math.min(payload.index, slides.length - 1)));
        }
      })
      .on("broadcast", { event: "state-request" }, sendState)
      .subscribe((status, error) => {
        logEvent("presentation.channel.status", { status });
        if (error) logError("presentation.channel.error", { error: error?.message || String(error) });
        isSubscribedRef.current = status === "SUBSCRIBED";
        if (status === "SUBSCRIBED") sendState();
      });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [session, supabase, next, prev]);

  useEffect(() => {
    if (!isSubscribedRef.current) return;
    try {
      channelRef.current?.send({
        type: "broadcast",
        event: "deck-state",
        payload: makeDeckState(index, session),
      });
      logEvent("presentation.index", { index, session });
    } catch (error) {
      logError("presentation.index.error", { error: error?.message || String(error) });
    }
  }, [index, session]);

  const touchRef = useRef(null);
  const handleTouchStart = (e) => { touchRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchRef.current === null) return;
    const diff = touchRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    touchRef.current = null;
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
      if (e.key === "Home") { e.preventDefault(); setIndex(0); }
      if (e.key === "End") { e.preventDefault(); setIndex(slides.length - 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const RenderSlide = ({
    hero: HeroSlide,
    bullets: BulletsSlide,
    "card-grid": CardGridSlide,
    cols: ColumnSplitSlide,
    table: TableSlide,
    "architecture-map": ArchitectureMapSlide,
    heatmap: RiskHeatmapSlide,
    "benefit-risk": BenefitRiskSlide,
    timeline: TimelineSlide,
    closing: ClosingSlide,
  }[slide.type] || HeroSlide);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#172235] font-sans text-white" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#172235]" />
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute right-[-12rem] top-10 h-[34rem] w-[34rem] rounded-full bg-cyan-500/14 blur-[120px]" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-blue-700/20 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_30%),linear-gradient(180deg,rgba(11,18,32,0.35),rgba(11,18,32,0.72))]" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(226,242,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(226,242,255,.7)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <aside className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-1.5 xl:flex">
        {slides.map((item, i) => (
          <button
            key={item.section + i}
            onClick={() => setIndex(i)}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl border text-xs font-black transition ${
              i === index
                ? "border-[#38BDF8]/60 bg-[#38BDF8]/30 text-white shadow-[0_0_28px_rgba(56,189,248,0.35)]"
                : "border-white/10 bg-white/[0.04] text-white/35 hover:border-[#38BDF8]/40 hover:text-white/80"
            }`}
          >
            {String(i + 1).padStart(2, "0")}
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-black/80 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              {item.section}
            </span>
          </button>
        ))}
      </aside>

      <div className="absolute left-0 top-0 z-30 h-1 w-full bg-white/5">
        <motion.div className="h-full bg-gradient-to-r from-[#38BDF8] via-[#0EA5E9] to-[#2563EB]" animate={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={index}
          className="relative z-10 h-screen"
          initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -40, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mx-auto grid h-full w-full max-w-[1920px] grid-rows-[auto_1fr_auto] gap-4 px-6 py-4 md:px-10 lg:px-20 xl:pl-24 xl:pr-24">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/mascot.svg"
                  alt="TalentOps Copilot"
                  className="h-11 w-11 rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-1 shadow-[0_0_28px_rgba(56,189,248,0.20)]"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.34em] text-cyan-100/75">TalentOps Copilot</p>
                  <p className="text-sm text-slate-300/55">{slide.section}</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200/70 md:flex">
                <CircleDot className="h-4 w-4 text-cyan-300" />
                Ética de la Ciencia de Datos · Universidad Panamericana
              </div>
            </header>
            <main className="grid min-h-0 items-center">
              <RenderSlide slide={slide} />
            </main>
            <footer className="text-center text-sm text-slate-300/45">
              Ética de la Ciencia de Datos · Enrique U. Báez Gómez Tagle &amp; Luis Alejandro Guillén Álvarez · Maestría en Ciencia de Datos, Universidad Panamericana
            </footer>
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-3">
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 backdrop-blur-xl transition hover:border-[#38BDF8]/40 hover:text-white"
        >
          <Expand size={18} />
        </button>
        <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/60 backdrop-blur-xl">
          {index + 1} / {slides.length}
        </div>
        <button
          onClick={prev}
          disabled={index === 0}
          aria-label="Slide anterior"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 backdrop-blur-xl transition hover:border-[#38BDF8]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          disabled={index === slides.length - 1}
          aria-label="Siguiente slide"
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#0EA5E9]/30 bg-[#0EA5E9]/20 text-white shadow-[0_0_28px_rgba(14,165,233,0.25)] backdrop-blur-xl transition hover:bg-[#0EA5E9]/30 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-6 z-30 hidden max-w-sm rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/50 backdrop-blur-xl md:block">
        Actual: <span className="text-cyan-300">{slide.section}</span>
      </div>
    </div>
  );
}

function DeckController({ session, supabase }) {
  const [connectionStatus, setConnectionStatus] = useState(supabase ? "CONNECTING" : "CONFIG_MISSING");
  const [deckState, setDeckState] = useState(null);
  const channelRef = useRef(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel(getDeckChannelName(session), { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "deck-state" }, ({ payload }) => {
        logEvent("controller.deck-state", { index: payload?.index, session: payload?.session });
        setDeckState(payload);
      })
      .subscribe((status, error) => {
        setConnectionStatus(status);
        logEvent("controller.channel.status", { status });
        if (error) logError("controller.channel.error", { error: error?.message || String(error) });
        isSubscribedRef.current = status === "SUBSCRIBED";
        if (status === "SUBSCRIBED") {
          logEvent("controller.requesting-state", { session });
          channel.send({
            type: "broadcast",
            event: "state-request",
            payload: { requestedAt: Date.now(), session },
          });
        }
      });

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [session, supabase]);

  const sendCommand = useCallback(
    (command, payload = {}) => {
      if (!isSubscribedRef.current) return;
      try {
        logEvent("controller.sendCommand", { command, session });
        channelRef.current?.send({
          type: "broadcast",
          event: "deck-command",
          payload: { command, ...payload, sentAt: Date.now(), session },
        });
      } catch (error) {
        logError("controller.sendCommand.error", {
          command,
          error: error?.message || String(error),
        });
      }
    },
    [session],
  );

  const currentIndex = Math.max(0, Math.min(deckState?.index ?? 0, slides.length - 1));
  const connected = connectionStatus === "SUBSCRIBED";

  return (
    <div className="relative min-h-screen bg-[#172235] p-6 text-white">
      <div className="mx-auto flex h-full max-w-3xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Remote controller</p>
            <h1 className="mt-1 text-2xl font-bold">Deck Control</h1>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              connected ? "border-cyan-300/40 bg-cyan-300/12 text-cyan-200" : "border-white/10 bg-white/[0.08] text-white/60"
            }`}
          >
            {connected ? "Connected" : "Connecting"}
          </span>
        </header>

        <section className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-sm text-white/70">Session</p>
          <p className="mt-1 text-lg font-mono text-white">{session}</p>
          <p className="mt-3 text-sm text-white/70">Current slide</p>
          <p className="mt-1 text-2xl font-bold">
            {String(currentIndex + 1).padStart(2, "0")} / {slides.length}
          </p>
          <p className="mt-3 text-sm text-white/75">{deckState?.section || "Waiting for state..."}</p>
          <p className="text-sm text-white/65">{deckState?.title || "Open the main deck on the same session."}</p>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => sendCommand("prev")}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 font-bold hover:border-[#38BDF8]/40 hover:text-cyan-200"
            aria-label="Previous slide"
          >
            <ChevronLeft className="mr-2 inline h-5 w-5" /> Previous
          </button>
          <button
            onClick={() => sendCommand("next")}
            className="rounded-xl border border-[#0EA5E9]/30 bg-[#0EA5E9]/20 px-5 py-4 font-bold hover:bg-[#0EA5E9]/30 hover:text-cyan-200"
            aria-label="Next slide"
          >
            Next <ChevronRight className="ml-2 inline h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slides.map((slide, i) => (
            <button
              key={slide.section + i}
              onClick={() => sendCommand("goto", { index: i })}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                i === currentIndex
                  ? "border-[#38BDF8]/60 bg-[#38BDF8]/30 text-white"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:border-[#38BDF8]/40 hover:text-white"
              }`}
              aria-label={`Go to slide ${i + 1}: ${slide.section}`}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const routeConfig = useMemo(() => getRouteConfig(), []);
  const supabase = useMemo(() => createDeckClient(), []);
  useEffect(() => {
    logEvent("route-config", {
      isController: routeConfig.isController,
      session: routeConfig.session,
      requestedDebug: routeConfig.requestedDebug,
      supabaseClientReady: !!supabase,
    });
  }, [routeConfig.isController, routeConfig.requestedDebug, routeConfig.session, supabase]);

  if (routeConfig.isController) {
    return <DeckController session={routeConfig.session} supabase={supabase} />;
  }

  return <DeckPresentation session={routeConfig.session} supabase={supabase} />;
}

function SectionTitle({ slide }) {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-6 text-sm uppercase tracking-[0.28em] text-white/60">{slide.kicker}</p>
      <h1 className="text-3xl font-bold leading-[1.05] md:text-4xl lg:text-5xl">
        {slide.title}
      </h1>
      <p className="mt-6 text-xl text-white/80 md:text-2xl">{slide.emphasis}</p>
      {slide.body && <p className="mt-6 max-w-3xl text-lg leading-7 text-white/60">{slide.body}</p>}
    </div>
  );
}

function Mascot({ className = "" }) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{ y: [0, -22, -10, -22, 0], rotate: [-1.5, 1.5, 0, 1.5, -1.5] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        className="absolute -inset-8 rounded-full bg-cyan-400/20 blur-3xl"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.85, 1.15, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative h-28 w-28 rounded-[2.2rem] border border-cyan-200/25 bg-gradient-to-br from-slate-100 via-sky-100 to-cyan-200 shadow-[0_0_70px_rgba(56,189,248,0.35)]">
        <div className="absolute left-1/2 top-3 h-3 w-10 -translate-x-1/2 rounded-full bg-slate-900/20" />
        <motion.div
          className="absolute left-6 top-11 h-5 w-4 rounded-full bg-slate-950"
          animate={{ scaleY: [1, 1, 0.08, 1, 1, 1, 0.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.4, 0.45, 0.65, 0.75, 0.8, 0.85] }}
        />
        <motion.div
          className="absolute right-6 top-11 h-5 w-4 rounded-full bg-slate-950"
          animate={{ scaleY: [1, 1, 0.08, 1, 1, 1, 0.08, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.4, 0.45, 0.65, 0.75, 0.8, 0.85] }}
        />
        <div className="absolute bottom-5 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-slate-900/30" />
        <motion.div
          className="absolute -right-3 top-9 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-200/30 bg-sky-300 text-slate-900 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
          animate={{ scale: [1, 1.25, 1], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function HeroSlide({ slide }) {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="mb-6 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h1 className="text-4xl font-black leading-[1.02] text-white md:text-5xl lg:text-6xl">{slide.title}</h1>
        <p className="mt-6 bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-2xl font-black text-transparent md:text-3xl">{slide.emphasis}</p>
        <p className="mt-6 max-w-2xl text-lg leading-7 text-slate-200/70">{slide.body}</p>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {["AI4People", "FMEA · RPN", "Beneficio–Riesgo"].map((t) => (
            <span key={t} className="rounded-full border border-cyan-200/25 bg-cyan-300/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.12)]">{t}</span>
          ))}
        </div>
      </div>
      <div className="relative hidden min-h-[380px] items-center justify-center lg:flex">
        <motion.div
          className="absolute h-[26rem] w-[26rem] rounded-full border border-cyan-200/15 bg-cyan-300/5 shadow-[inset_0_0_90px_rgba(56,189,248,0.14)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute h-[18rem] w-[18rem] rounded-full border border-sky-200/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <Mascot className="scale-125" />
      </div>
    </section>
  );
}

function BulletsSlide({ slide }) {
  const count = slide.bullets?.length || 0;
  return (
    <section>
      <div className="mb-6">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-3xl font-black leading-[1.02] text-white md:text-4xl">{slide.title}</h2>
        <p className="mt-4 text-lg text-white/60">{slide.emphasis}</p>
      </div>
      <div className={`grid gap-3 ${count > 5 ? "md:grid-cols-2" : "max-w-4xl"}`}>
        {slide.bullets?.map((item, i) => (
          <motion.div
            key={item}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3.5 backdrop-blur-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">{i + 1}</span>
            <span className="text-sm leading-6 text-white/80">{item}</span>
          </motion.div>
        ))}
      </div>
      {slide.notes && (
        <div className="mt-5 rounded-xl border border-[#38BDF8]/15 bg-[#38BDF8]/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300/80">Notas</p>
          <ul className="mt-2 space-y-1 text-sm text-white/65">
            {slide.notes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function CardGridSlide({ slide }) {
  return (
    <section>
      <SectionTitle slide={slide} />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slide.cards?.map((card, i) => (
          <motion.article
            key={card.title}
            className="rounded-xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
          >
            {card.image && (
              <img
                src={card.image}
                alt={card.title}
                className="mb-4 h-28 w-full rounded-lg object-cover"
              />
            )}
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#38BDF8]/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200">
              <CheckCircle2 size={14} />
              {card.title}
            </div>
            <p className="text-base leading-7 text-white/75">{card.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function ColumnSplitSlide({ slide }) {
  return (
    <section>
      <div className="mb-6">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-3xl font-black leading-[1.02] text-white md:text-4xl">{slide.title}</h2>
        <p className="mt-4 text-lg text-white/60">{slide.emphasis}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div className="rounded-xl border border-[#38BDF8]/15 bg-gradient-to-b from-[#38BDF8]/10 to-white/[0.04] p-6 backdrop-blur-xl" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {slide.leftTitle && (
            <div className="mb-4 inline-flex rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
              {slide.leftTitle}
            </div>
          )}
          <ul className="space-y-3 text-sm leading-7 text-white/80">
            {slide.left.map((item, i) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div className="rounded-xl border border-cyan-300/15 bg-gradient-to-b from-cyan-500/10 to-white/[0.04] p-6 backdrop-blur-xl" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          {slide.rightTitle && (
            <div className="mb-4 inline-flex rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-cyan-200">
              {slide.rightTitle}
            </div>
          )}
          <ul className="space-y-3 text-sm leading-7 text-white/80">
            {slide.right.map((item, i) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-[10px] font-bold text-cyan-300">{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function ArchitectureMapSlide({ slide }) {
  return (
    <section>
      <div className="mb-6">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-3xl font-black leading-[1.02] text-white md:text-4xl">{slide.title}</h2>
        <p className="mt-4 text-lg text-white/60">{slide.emphasis}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        {slide.lanes.map((lane, i) => (
          <motion.div
            key={lane.label}
            className="relative rounded-xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            {i < slide.lanes.length - 1 && (
              <div className="absolute -right-3 top-1/2 z-10 hidden h-px w-6 bg-gradient-to-r from-[#38BDF8] to-cyan-300 lg:block" />
            )}
            <div className="mb-4 rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/15 px-3 py-2 text-center text-xs font-black uppercase tracking-wider text-cyan-200">
              {lane.label}
            </div>
            <div className="space-y-2">
              {lane.items.map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-xs leading-5 text-white/78">
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 text-sm text-white/65 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">Exact data comes from DocumentDB.</div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">Semantic context comes from OpenSearch/KB.</div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">Approved actions run through Step Functions.</div>
      </div>
    </section>
  );
}

function TimelineSlide({ slide }) {
  return (
    <section>
      <div className="mb-7">
        <p className="mb-4 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-3xl font-black leading-[1.02] text-white md:text-4xl">{slide.title}</h2>
        <p className="mt-4 text-lg text-white/60">{slide.emphasis}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {slide.steps.map((step, i) => (
          <motion.div
            key={step.label}
            className="relative rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-black text-cyan-300">
                {i + 1}
              </span>
              {i < slide.steps.length - 1 && (
                <span className="hidden h-px flex-1 bg-gradient-to-r from-[#38BDF8] to-transparent md:block" />
              )}
            </div>
            <h3 className="text-base font-black text-white">{step.label}</h3>
            <p className="mt-2 text-sm leading-6 text-white/65">{step.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// --- Shared risk/benefit color language (mirrors the LaTeX artifacts) ---
const RISK_COLORS = { VH: "#C00000", H: "#DC5032", M: "#E6AA00", L: "#388E3C" };
const RISK_TEXT = { VH: "#ffffff", H: "#ffffff", M: "#1a1205", L: "#ffffff" };
const BR_COLORS = { open: "#0070C0", limit: "#388E3C", screen: "#D28200", no: "#C00000" };
const BR_LABELS = { open: "Publicar", limit: "Limitar", screen: "Eval.", no: "No" };

function statusMeta(value) {
  const v = String(value).toLowerCase();
  const done = /(implementado|definido)/.test(v);
  const future = /futuro/.test(v);
  const caveat = /(falta|parcial|ampliar|mejorar|formaliz|institucionaliz|definir|reforzar|voluntario|pendiente)/.test(v);
  if (future && !done) return { cls: "border-slate-300/20 bg-slate-300/10 text-slate-200", Icon: CircleDashed };
  if (done && caveat) return { cls: "border-amber-300/25 bg-amber-300/10 text-amber-200", Icon: Clock };
  if (done) return { cls: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", Icon: CheckCircle2 };
  if (caveat) return { cls: "border-amber-300/25 bg-amber-300/10 text-amber-200", Icon: Clock };
  return { cls: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200", Icon: CheckCircle2 };
}

function NivelPill({ value }) {
  const key = String(value).trim().toUpperCase();
  const bg = RISK_COLORS[key];
  if (!bg) return <span className="text-white/75">{value}</span>;
  return (
    <span
      className="inline-flex min-w-[2.2rem] justify-center rounded-md px-2 py-1 text-xs font-black"
      style={{ backgroundColor: bg, color: RISK_TEXT[key] }}
    >
      {key}
    </span>
  );
}

function TableSlide({ slide }) {
  const centered = new Set(["#", "S", "O", "D", "RPN", "FMEA", "Nivel", "Estado"]);
  return (
    <section>
      <div className="mb-5">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-2xl font-black leading-[1.05] text-white md:text-3xl lg:text-4xl">{slide.title}</h2>
        <p className="mt-3 text-base text-white/60 md:text-lg">{slide.emphasis}</p>
      </div>
      <div className="overflow-auto rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.06]">
              {slide.headers?.map((h, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/50 ${centered.has(h) ? "text-center" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slide.rows?.map((row, ri) => (
              <tr key={ri} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                {row.map((cell, ci) => {
                  const header = slide.headers?.[ci];
                  const isCentered = centered.has(header);
                  let content;
                  if (header === "Estado") {
                    const { cls, Icon } = statusMeta(cell);
                    content = (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
                        <Icon size={12} />
                        {cell}
                      </span>
                    );
                  } else if (header === "Nivel") {
                    content = <NivelPill value={cell} />;
                  } else if (header === "RPN") {
                    content = <span className="font-black text-cyan-300">{cell}</span>;
                  } else if (header === "#" || header === "FMEA") {
                    content = <span className="font-mono text-xs font-bold text-white/80">{cell}</span>;
                  } else if (ci === 0) {
                    content = <span className="font-semibold text-white/90">{cell}</span>;
                  } else {
                    content = <span className="text-white/70">{cell}</span>;
                  }
                  return (
                    <td key={ci} className={`px-4 py-2.5 align-top ${isCentered ? "text-center" : ""}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// --- Risk heat map (5x5 Severidad x Ocurrencia), mirrors the LaTeX matrix ---
const HEATMAP_ROWS = [
  { sev: "Catastrófica (5)", cells: [{ l: "M" }, { l: "H", risks: [{ c: "R5" }, { c: "R9", done: true }] }, { l: "VH", risks: [{ c: "R4", done: true }] }, { l: "VH" }, { l: "VH" }] },
  { sev: "Mayor (4)", cells: [{ l: "L" }, { l: "M", risks: [{ c: "R1", done: true }, { c: "R8" }, { c: "R10", done: true }] }, { l: "H", risks: [{ c: "R2" }] }, { l: "VH", risks: [{ c: "R6" }] }, { l: "VH" }] },
  { sev: "Moderada (3)", cells: [{ l: "L" }, { l: "M", risks: [{ c: "R7", done: true }] }, { l: "M", risks: [{ c: "R3" }] }, { l: "H" }, { l: "VH" }] },
  { sev: "Menor (2)", cells: [{ l: "L" }, { l: "L" }, { l: "M" }, { l: "M" }, { l: "H" }] },
  { sev: "Mínima (1)", cells: [{ l: "L" }, { l: "L" }, { l: "L" }, { l: "L" }, { l: "M" }] },
];
const OCC_HEADERS = ["Rara (1)", "Improbable (2)", "Posible (3)", "Probable (4)", "C. Segura (5)"];

function HeatCell({ cell }) {
  return (
    <div
      className="flex min-h-[3.2rem] flex-col items-center justify-center rounded-md px-1 text-center"
      style={{ backgroundColor: RISK_COLORS[cell.l], color: RISK_TEXT[cell.l] }}
    >
      <span className="text-sm font-black leading-none">{cell.l}</span>
      {cell.risks && (
        <span className="mt-1 text-[10px] font-bold leading-tight opacity-95">
          {cell.risks.map((r) => (r.done ? `${r.c} ✓` : r.c)).join(", ")}
        </span>
      )}
    </div>
  );
}

function RiskHeatmapSlide({ slide }) {
  return (
    <section>
      <div className="mb-5">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-2xl font-black leading-[1.05] text-white md:text-3xl lg:text-4xl">{slide.title}</h2>
        <p className="mt-3 text-base text-white/60 md:text-lg">{slide.emphasis}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="flex gap-2">
            <span
              className="hidden text-[10px] font-bold uppercase tracking-widest text-white/45 sm:block"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Severidad →
            </span>
            <div className="flex-1">
              <div className="grid grid-cols-[6.5rem_repeat(5,1fr)] gap-1.5">
                <div />
                {OCC_HEADERS.map((h) => (
                  <div key={h} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-white/45">{h}</div>
                ))}
                {HEATMAP_ROWS.map((row) => (
                  <Fragment key={row.sev}>
                    <div className="flex items-center justify-end pr-2 text-right text-[10px] font-bold uppercase tracking-wide text-white/45">{row.sev}</div>
                    {row.cells.map((cell, ci) => (
                      <HeatCell key={ci} cell={cell} />
                    ))}
                  </Fragment>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-white/45">Ocurrencia →</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Leyenda (S×O)</p>
            <div className="space-y-1.5">
              {[["VH", "Muy alto (≥15)"], ["H", "Alto (10–14)"], ["M", "Medio (5–9)"], ["L", "Bajo (1–4)"]].map(([k, label]) => (
                <div key={k} className="flex items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex h-5 w-7 items-center justify-center rounded text-[10px] font-black" style={{ backgroundColor: RISK_COLORS[k], color: RISK_TEXT[k] }}>{k}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#C00000]/30 bg-[#C00000]/10 p-4 text-sm">
            <p className="font-bold text-white">Prioritario pendiente (VH)</p>
            <p className="mt-1 text-white/70">R6 sobreasignación (RPN 32): falta política de carga.</p>
            <p className="mt-2 text-white/60">R4 automation bias y R9 PII ya cubiertos. Nivel H pendiente: R5 uso secundario (RPN 40).</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Benefit-risk matrix (4x4), mirrors the LaTeX matrix with the star position ---
const BR_ROWS = [
  { ben: "Muy Alto", cells: [{ k: "open" }, { k: "limit", star: true }, { k: "screen" }, { k: "no" }] },
  { ben: "Alto", cells: [{ k: "open" }, { k: "limit" }, { k: "screen" }, { k: "no" }] },
  { ben: "Moderado", cells: [{ k: "open" }, { k: "screen" }, { k: "no" }, { k: "no" }] },
  { ben: "Bajo", cells: [{ k: "screen" }, { k: "no" }, { k: "no" }, { k: "no" }] },
];
const BR_RISK_HEADERS = ["Bajo", "Moderado", "Alto", "Muy Alto"];

function BRCell({ cell }) {
  return (
    <div
      className="relative flex min-h-[3rem] items-center justify-center rounded-md px-1 text-center text-xs font-bold text-white"
      style={{ backgroundColor: BR_COLORS[cell.k] }}
    >
      {cell.star && <Star size={12} className="mr-1 shrink-0" fill="currentColor" />}
      {BR_LABELS[cell.k]}
    </div>
  );
}

function BenefitRiskSlide({ slide }) {
  return (
    <section>
      <div className="mb-5">
        <p className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
        <h2 className="text-2xl font-black leading-[1.05] text-white md:text-3xl lg:text-4xl">{slide.title}</h2>
        <p className="mt-3 text-base text-white/60 md:text-lg">{slide.emphasis}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
          <div className="grid grid-cols-[7rem_repeat(4,1fr)] gap-1.5">
            <div className="flex items-end pb-1 text-[10px] font-bold uppercase tracking-wide text-white/45">Beneficio \ Riesgo</div>
            {BR_RISK_HEADERS.map((h) => (
              <div key={h} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wide text-white/45">{h}</div>
            ))}
            {BR_ROWS.map((row) => (
              <Fragment key={row.ben}>
                <div className="flex items-center justify-end pr-2 text-right text-[11px] font-bold text-white/55">{row.ben}</div>
                {row.cells.map((cell, ci) => (
                  <BRCell key={ci} cell={cell} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">Acciones</p>
            <div className="space-y-1.5">
              {[["open", "Publicar/Desplegar"], ["limit", "Limitar acceso"], ["screen", "Evaluación adicional"], ["no", "No desplegar"]].map(([k, label]) => (
                <div key={k} className="flex items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex h-5 w-7 items-center justify-center rounded text-white" style={{ backgroundColor: BR_COLORS[k] }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#388E3C]/35 bg-[#388E3C]/12 p-4 text-sm">
            <p className="flex items-center gap-1.5 font-bold text-white"><Star size={13} fill="currentColor" /> Posición de TalentOps Copilot</p>
            <p className="mt-1 text-white/75">Muy Alto beneficio × Riesgo moderado → <span className="font-bold text-white">Limitar acceso</span>.</p>
            <p className="mt-2 text-white/60">Si no se formaliza la confirmación de revisión humana, el riesgo escala a Alto y la celda se mueve a “Evaluación adicional”.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingSlide({ slide }) {
  return (
    <section className="mx-auto max-w-5xl text-center">
      <p className="mb-6 text-sm uppercase tracking-[0.28em] text-cyan-300/80">{slide.kicker}</p>
      <h2 className="text-3xl font-black leading-[1.02] text-white md:text-4xl lg:text-5xl">{slide.title}</h2>
      <p className="mt-6 bg-gradient-to-r from-cyan-200 via-[#0EA5E9] to-cyan-200 bg-clip-text text-xl font-black text-transparent md:text-2xl">{slide.emphasis}</p>
      <p className="mx-auto mt-8 max-w-3xl text-lg leading-7 text-white/65">{slide.body}</p>
    </section>
  );
}

