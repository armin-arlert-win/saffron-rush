// audio.js — all sound is synthesized with WebAudio: no audio files, no network.
// Every effect is a short oscillator or filtered-noise burst. Audio starts lazily
// on the first player input, so headless runs and silent browsers never break.

let ctx = null;
let muted = false;

function ensureContext() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch (err) {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = ensureContext();
  if (!ac || muted) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + dur + 0.02);
  } catch (err) {
    // Sound is decoration; a failure must never stop the game.
  }
}

function noiseBurst(dur, vol, filterFreq) {
  const ac = ensureContext();
  if (!ac || muted) return;
  try {
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
  } catch (err) {
    // Sound is decoration; a failure must never stop the game.
  }
}

export const audio = {
  unlock() {
    const ac = ensureContext();
    if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
  },
  chop() {
    noiseBurst(0.08, 0.5, 1800);
  },
  pickup() {
    tone(520, 0.07, 'sine', 0.25);
  },
  place() {
    tone(340, 0.08, 'triangle', 0.3);
  },
  sizzle() {
    noiseBurst(0.35, 0.18, 4200);
  },
  ding() {
    tone(880, 0.14, 'sine', 0.35);
    tone(1318, 0.2, 'sine', 0.3, 0.09);
  },
  error() {
    tone(160, 0.22, 'square', 0.2);
  },
  tick() {
    tone(980, 0.05, 'square', 0.12);
  },
  burn() {
    tone(220, 0.3, 'sawtooth', 0.22);
    tone(180, 0.35, 'sawtooth', 0.18, 0.08);
  },
  setMuted(value) {
    muted = value;
  },
};
