import { useSyncExternalStore } from "react";

/**
 * Tiny 8-bit sound board built on WebAudio oscillators — no audio files.
 * On by default; the visitor's choice is remembered in localStorage.
 * Browsers only let audio start after a user gesture, so nothing plays (and
 * no AudioContext exists) until the first pointer or key press on the page.
 */
export type SoundName =
  | "click"
  | "hover"
  | "type"
  | "stamp"
  | "pop"
  | "rustle"
  | "item"
  | "toWinter"
  | "toAutumn"
  | "fanfare"
  | "knock"
  | "meow"
  | "twinkle"
  | "open"
  | "close"
  | "send";

const STORAGE_KEY = "autumnnus:sound";
const MASTER_VOLUME = 0.07;

let enabled = true;
let loaded = false;
let unlocked = false;
const listeners = new Set<() => void>();
const GESTURES = ["pointerdown", "keydown", "touchstart"] as const;

let audio: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

function unlock() {
  unlocked = true;
  GESTURES.forEach((type) => window.removeEventListener(type, unlock, true));
  if (enabled) ensureAudio();
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    enabled = true;
  }
  GESTURES.forEach((type) =>
    window.addEventListener(type, unlock, { capture: true, passive: true }),
  );
}

function ensureAudio(): AudioContext | null {
  if (!audio) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    audio = new Ctor();
    master = audio.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(audio.destination);
  }
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

interface ToneOptions {
  type?: OscillatorType;
  to?: number;
  gain?: number;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  { type = "square", to, gain = 1 }: ToneOptions = {},
) {
  if (!audio || !master) return;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(
  start: number,
  duration: number,
  { gain = 1, from = 1200, to = 4000 }: { gain?: number; from?: number; to?: number } = {},
) {
  if (!audio || !master) return;
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const env = audio.createGain();
  src.buffer = noiseBuffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.001, start + duration);
  src.connect(filter).connect(env).connect(master);
  src.start(start);
  src.stop(start + duration + 0.02);
}

const RECIPES: Record<SoundName, (t: number) => void> = {
  click: (t) => tone(660, t, 0.05, { to: 440 }),
  hover: (t) => tone(1320, t, 0.025, { gain: 0.25 }),
  type: (t) => tone(880 + Math.random() * 280, t, 0.018, { gain: 0.22 }),
  stamp: (t) => {
    tone(190, t, 0.14, { type: "triangle", to: 55, gain: 1.6 });
    noise(t, 0.09, { gain: 0.5, from: 400, to: 120 });
  },
  pop: (t) => tone(520, t, 0.08, { type: "triangle", to: 1040 }),
  rustle: (t) => noise(t, 0.28, { gain: 0.45, from: 1800, to: 5200 }),
  item: (t) => {
    tone(880, t, 0.07);
    tone(1175, t + 0.06, 0.1);
  },
  toWinter: (t) => {
    [784, 659, 523, 392, 330].forEach((f, i) => tone(f, t + i * 0.07, 0.12));
    noise(t, 0.6, { gain: 0.25, from: 6000, to: 900 });
  },
  toAutumn: (t) => {
    [330, 392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.07, 0.12));
    noise(t, 0.5, { gain: 0.2, from: 900, to: 5000 });
  },
  fanfare: (t) =>
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      tone(f, t + i * 0.09, i === 5 ? 0.4 : 0.1),
    ),
  knock: (t) => {
    [0, 0.17].forEach((offset) => {
      tone(130, t + offset, 0.08, { type: "triangle", to: 70, gain: 1.4 });
      noise(t + offset, 0.05, { gain: 0.6, from: 500, to: 200 });
    });
  },
  meow: (t) => {
    tone(620, t, 0.12, { type: "triangle", to: 920, gain: 0.9 });
    tone(920, t + 0.12, 0.26, { type: "triangle", to: 500, gain: 0.9 });
  },
  twinkle: (t) =>
    [1319, 1568, 1976, 2637].forEach((f, i) =>
      tone(f, t + i * 0.06, 0.14, { type: "triangle", gain: 0.7 }),
    ),
  open: (t) =>
    [523, 784, 1047].forEach((f, i) => tone(f, t + i * 0.05, 0.09)),
  close: (t) =>
    [1047, 784, 523].forEach((f, i) => tone(f, t + i * 0.05, 0.09)),
  send: (t) => {
    noise(t, 0.2, { gain: 0.35, from: 700, to: 4200 });
    tone(660, t + 0.05, 0.09, { to: 1320 });
  },
};

export function playSound(name: SoundName) {
  load();
  if (!enabled || !unlocked || typeof window === "undefined") return;
  const ctx = ensureAudio();
  if (!ctx) return;
  RECIPES[name](ctx.currentTime + 0.005);
}

export function setSoundEnabled(next: boolean) {
  load();
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Private mode: the choice just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
  if (next && unlocked) {
    ensureAudio();
    playSound("item");
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  load();
  return enabled;
}

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

/** Call early so the first gesture on the page can unlock audio. */
export function primeSound() {
  load();
}
