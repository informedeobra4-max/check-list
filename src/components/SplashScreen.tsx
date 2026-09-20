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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Detectar si el dispositivo es táctil (celulares y tablets)
    const hasTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    setIsTouchDevice(Boolean(hasTouch));

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

  const triggerEnter = () => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;

    // Reproducir sonido de tilde inmediatamente
    playCheckmarkSound();

    // Iniciar efecto expansivo
    setIsExiting(true);

    // Concluir transición y pasar a la pantalla principal
    setTimeout(() => {
      onFinish();
    }, 750);
  };

  return (
    <div
      onClick={triggerEnter}
      onTouchStart={(e) => {
        // Prevenir scroll accidental y disparar de inmediato
        e.preventDefault();
        triggerEnter();
      }}
      className={`fixed inset-0 z-[99999] bg-black select-none overflow-hidden flex flex-col items-center justify-between py-10 px-6 cursor-pointer transition-opacity duration-700 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
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

      {/* Bottom prompt instructions */}
      <div
        className={`flex flex-col items-center gap-3 text-center transition-all duration-300 ${
          isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-2xl flex items-center gap-2.5 animate-bounce">
          {/* Finger touch / pointer icon */}
          <svg
            className="w-5 h-5 text-emerald-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            {isTouchDevice ? (
              // Touch hand icon
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
              />
            ) : (
              // Mouse pointer / tap icon
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            )}
          </svg>
          <span className="text-sm sm:text-base font-bold text-white tracking-wide">
            {isTouchDevice ? 'Toca la pantalla para ingresar' : 'Haz clic en la pantalla para ingresar'}
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-500/70 font-mono">
          Sistema de Inspección en Obra
        </p>
      </div>
    </div>
  );
}
