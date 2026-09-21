import React, { useState, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * Genera un sonido de confirmación / tilde afirmativo y claro utilizando Web Audio API nativo.
 * Cero dependencias externas, latencia nula y compatible con políticas de autoplay móvil.
 */
export function playCheckmarkSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // 1. Pop táctil inicial (click mecánico suave)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, now);
    clickOsc.frequency.exponentialRampToValueAtTime(60, now + 0.035);
    clickGain.gain.setValueAtTime(0.25, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.035);

    // 2. Chime afirmativo ascendente (nota 1: A5 880Hz, nota 2: E6 1318.5Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.06); // A5
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16); // E6
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.45, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.55);

    // 3. Brillo armónico superior (E7 2637Hz con decay rápido)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(2637, now + 0.08);
    gain3.gain.setValueAtTime(0.001, now);
    gain3.gain.setValueAtTime(0.2, now + 0.08);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.08);
    osc3.stop(now + 0.35);
  } catch (err) {
    console.warn('Web Audio no disponible:', err);
  }
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Permitir ingreso con teclado (Barra espaciadora o Enter)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerEnter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerEnter = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    // Reproducir sonido de tilde inmediatamente
    playCheckmarkSound();

    // Iniciar efecto expansivo
    setIsExiting(true);

    // Concluir transición y pasar a la pantalla principal
    setTimeout(() => {
      onFinish();
    }, 700);
  };

  return (
    <div
      onClick={triggerEnter}
      onTouchStart={(e) => {
        e.stopPropagation();
        triggerEnter(e);
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={`fixed inset-0 z-[99999] bg-black select-none overflow-hidden flex flex-col items-center justify-between py-10 px-6 cursor-pointer transition-opacity duration-700 pointer-events-auto ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, #061e12 0%, #020b06 45%, #000000 100%)',
        touchAction: 'none'
      }}
      role="button"
      tabIndex={0}
      aria-label="Toca o haz clic para ingresar a Control de Avance"
    >
      {/* Top subtle badge */}
      <div className={`transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-80'}`}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          Control de Avance
        </span>
      </div>

      {/* Central Checkmark with dramatic expansion effect */}
      <div className="relative flex items-center justify-center my-auto">
        {/* Glow ambient circle */}
        <div
          className={`absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none transition-all duration-700 ${
            isExiting ? 'scale-[6] opacity-0' : 'scale-100 opacity-100 animate-pulse'
          }`}
        />

        {/* Green Checkmark Image */}
        <div
          className={`relative z-10 transition-all duration-700 ease-in will-change-transform ${
            isExiting
              ? 'scale-[20] opacity-0 filter brightness-150 drop-shadow-[0_0_100px_rgba(34,197,94,1)]'
              : 'scale-100 opacity-100 filter drop-shadow-[0_0_35px_rgba(34,197,94,0.6)] hover:scale-105 active:scale-95'
          }`}
        >
          <img
            src="/icon.png?v=5"
            alt="Tilde Verde"
            className="w-56 h-56 sm:w-72 sm:h-72 md:w-88 md:h-88 object-contain pointer-events-none"
            loading="eager"
            decoding="sync"
          />
        </div>
      </div>

      {/* Clean Minimalist Bottom - Clutter button removed */}
      <div
        className={`flex flex-col items-center gap-2 text-center transition-all duration-300 ${
          isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-500/50 font-mono">
          Sistema de Inspección en Obra
        </p>
      </div>
    </div>
  );
}
