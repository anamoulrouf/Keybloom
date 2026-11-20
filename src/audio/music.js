// Generative garden music (no audio files). 66 BPM in F major pentatonic: a warm pad and a soft
// marimba melody that changes every 4 bars, plus layers that join as the Bloom Chain grows:
//   5 → strings · 10 → bells · 20 → birdsong chorus · 30 → bass "garden orchestra".
// A mistake fades the layers out over ~2 s (never a sad sound), so kids want the song back.
// Bus layout adapted from Gridforge's synth (master/music/sfx/ambience → compressor) plus reverb.
import { mulberry32 } from '../core/rng.js';

const BPM = 66;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
// F major: F=65 (F4). Chords cycle every 2 bars: I – vi – IV – V
const CHORDS = [
  { root: 53, tones: [65, 69, 72] },  // F  (F A C)
  { root: 50, tones: [62, 65, 69] },  // Dm (D F A)
  { root: 46, tones: [58, 62, 65] },  // Bb (Bb D F)
  { root: 48, tones: [60, 64, 67] },  // C  (C E G)
];
const PENTA = [65, 67, 69, 72, 74, 77, 79, 81, 84, 86]; // F G A C D across two octaves
const RHYTHMS = [
  [0, 3, 4, 6], [0, 2, 5], [1, 4, 6, 7], [0, 4], [0, 3, 6], [2, 4, 5, 7], [0, 1, 4],
];
export const LAYER_THRESHOLDS = [5, 10, 20, 30];

export function createAudio() {
  let ctx = null;
  let master, music, sfx, nature, reverb, wet;
  const layerGains = [];
  const settings = { master: 0.8, music: 0.5, sfx: 0.7, nature: 0.45, natureOn: true, muted: false };
  let timer = null;
  let nextBarTime = 0;
  let barIndex = 0;
  let phrase = [];
  let rng = mulberry32(Date.now() % 100000);
  let chain = 0;
  let keyStep = 0;
  let natureNodes = null;
  let birdTimer = null;
  let quiet = false; // Islamic Life chapter: no music or melodic notes, only nature and soft clicks

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    music = ctx.createGain();
    sfx = ctx.createGain();
    nature = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.8);
    wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb.connect(wet).connect(master);
    music.connect(master);
    music.connect(reverb);
    sfx.connect(master);
    sfx.connect(reverb);
    nature.connect(master);
    master.connect(comp).connect(ctx.destination);
    for (let i = 0; i < LAYER_THRESHOLDS.length; i++) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(music);
      layerGains.push(g);
    }
    apply();
    return ctx;
  }

  function apply() {
    if (!ctx) return;
    const t = ctx.currentTime;
    master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.05);
    music.gain.setTargetAtTime(quiet ? 0 : settings.music * 0.9, t, quiet ? 0.5 : 0.1); // ≈1.5 s fade
    sfx.gain.setTargetAtTime(settings.sfx, t, 0.05);
    nature.gain.setTargetAtTime(settings.natureOn ? settings.nature : 0, t, 0.3);
  }

  // ── instruments ────────────────────────────────────────────────────────────
  function env(g, t, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  function marimba(freq, t, vel, dest) {
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const o1 = ctx.createOscillator();
    o1.type = 'sine';
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 4;
    const g2 = ctx.createGain();
    g2.gain.value = 0.12;
    o1.connect(g);
    o2.connect(g2).connect(g);
    g.connect(lp).connect(dest);
    env(g, t, 0.006, vel, 0.9);
    o1.start(t); o2.start(t);
    o1.stop(t + 1.1); o2.stop(t + 1.1);
  }

  function pad(freqs, t, dur, level, dest, type = 'triangle', cutoff = 900, attack = 1.4) {
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    g.connect(lp).connect(dest);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.setValueAtTime(level, t + dur - 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    for (const fq of freqs) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = fq;
        o.detune.value = det;
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.8);
      }
    }
  }

  function bell(freq, t, vel, dest) {
    const g = ctx.createGain();
    const o1 = ctx.createOscillator();
    o1.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.frequency.value = freq * 2.76;
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o1.connect(g);
    o2.connect(g2).connect(g);
    g.connect(dest);
    env(g, t, 0.004, vel, 1.8);
    o1.start(t); o2.start(t);
    o1.stop(t + 2); o2.stop(t + 2);
  }

  function chirp(t, dest, vel = 0.05) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const base = 2400 + Math.random() * 1400;
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.07);
    o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.14);
    o.connect(g).connect(dest);
    env(g, t, 0.01, vel, 0.14);
    o.start(t);
    o.stop(t + 0.2);
  }

  function noiseBuffer(seconds) {
    const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  // ── sequencer ──────────────────────────────────────────────────────────────
  function newPhrase() {
    const notes = [];
    let idx = 2 + Math.floor(rng() * 4);
    for (let bar = 0; bar < 4; bar++) {
      const rhythm = RHYTHMS[Math.floor(rng() * RHYTHMS.length)];
      for (const pos of rhythm) {
        if (rng() < 0.18) continue; // breathing space
        idx = Math.max(0, Math.min(PENTA.length - 1, idx + Math.round((rng() - 0.5) * 4)));
        notes.push({ bar, pos, note: PENTA[idx] });
      }
    }
    return notes;
  }

  function chordAt(bar) {
    return CHORDS[Math.floor(bar / 2) % CHORDS.length];
  }

  function scheduleBar(t, bar) {
    if (bar % 4 === 0) phrase = newPhrase();
    const chord = chordAt(bar);
    if (bar % 2 === 0) {
      pad([midi(chord.tones[0] - 12), midi(chord.tones[1] - 12), midi(chord.tones[2] - 12)], t, BAR * 2, 0.045, music);
      // strings layer (chain ≥5)
      pad(chord.tones.map((m) => midi(m)), t, BAR * 2, 0.03, layerGains[0], 'sawtooth', 1300, 2);
    }
    for (const n of phrase.filter((p) => p.bar === bar % 4)) {
      marimba(midi(n.note), t + (n.pos * BEAT) / 2, 0.11, music);
    }
    // bells layer (chain ≥10): gentle arpeggio
    for (let i = 0; i < 4; i++) {
      if (rng() < 0.35) continue;
      bell(midi(chord.tones[i % 3] + 12), t + i * BEAT + BEAT / 2, 0.035, layerGains[1]);
    }
    // birdsong chorus (chain ≥20)
    for (let i = 0; i < 3; i++) if (rng() < 0.6) chirp(t + rng() * BAR, layerGains[2], 0.04);
    // bass (chain ≥30)
    marimba(midi(chord.root), t, 0.12, layerGains[3]);
    marimba(midi(chord.root + 7), t + BEAT * 2, 0.08, layerGains[3]);
  }

  function pump() {
    if (!ctx) return;
    while (nextBarTime < ctx.currentTime + 0.6) {
      scheduleBar(nextBarTime, barIndex);
      nextBarTime += BAR;
      barIndex++;
    }
  }

  function currentChord() {
    if (!ctx) return CHORDS[0];
    const elapsed = Math.max(0, ctx.currentTime - (nextBarTime - BAR));
    const bar = barIndex - 1 + (elapsed >= BAR ? 1 : 0);
    return chordAt(Math.max(0, bar));
  }

  // ── nature ambience ────────────────────────────────────────────────────────
  function startNature() {
    if (natureNodes) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(4);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const g = ctx.createGain();
    g.gain.value = 0.06;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(lp.frequency);
    src.connect(lp).connect(g).connect(nature);
    src.start();
    lfo.start();
    natureNodes = { src, lfo };
    const birds = () => {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) chirp(t + i * 0.16, nature, 0.03);
      birdTimer = setTimeout(birds, 4000 + Math.random() * 6000);
    };
    birdTimer = setTimeout(birds, 2500);
  }

  /** A short wooden click (no pitch), used in quiet mode. */
  function click(peak, freq) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.05);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 4;
    const g = ctx.createGain();
    src.connect(bp).connect(g).connect(sfx);
    env(g, t, 0.002, peak, 0.04);
    src.start(t);
  }

  return {
    LAYER_THRESHOLDS,
    settings,

    /** Must be called from a user gesture (browser audio rule). */
    start() {
      if (!ensure()) return false;
      if (ctx.state === 'suspended') ctx.resume();
      if (!timer) {
        nextBarTime = ctx.currentTime + 0.15;
        master.gain.setValueAtTime(0.0001, ctx.currentTime);
        master.gain.linearRampToValueAtTime(settings.muted ? 0 : settings.master, ctx.currentTime + 3); // 3 s fade-in
        pump();
        timer = setInterval(pump, 120);
        startNature();
      }
      return true;
    },

    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    started: () => !!timer,

    set(partial) {
      Object.assign(settings, partial);
      apply();
    },

    /** Quiet mode: music fades out, typing makes a soft click instead of a note, no bells. */
    setQuiet(on) {
      quiet = !!on;
      apply();
    },
    isQuiet: () => quiet,

    /** Bloom chain drives the music layers. */
    setChain(n) {
      const prev = chain;
      chain = n;
      if (!ctx) return;
      const t = ctx.currentTime;
      LAYER_THRESHOLDS.forEach((th, i) => {
        const on = n >= th;
        const was = prev >= th;
        if (on && !was) layerGains[i].gain.setTargetAtTime(1, t, 0.5);
        if (!on && was) layerGains[i].gain.setTargetAtTime(0, t, 0.6); // ≈2 s gentle fade
      });
    },
    layerLevels: () => layerGains.map((g) => g.gain.value),

    /** Correct key: a marimba note from the current chord, stepping upward like an arpeggio. */
    keyNote() {
      if (!ctx) return;
      if (quiet) return click(0.07, 1900);
      const chord = currentChord();
      const tones = [...chord.tones, ...chord.tones.map((m) => m + 12)];
      const m = tones[keyStep % tones.length];
      keyStep++;
      marimba(midi(m), ctx.currentTime, 0.16, sfx);
    },
    resetKeyStep() { keyStep = 0; },

    /** Wrong key: a soft wooden "tok", no buzzer. */
    tok() {
      if (!ctx) return;
      if (quiet) return click(0.11, 650);
      const t = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(0.08);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 700;
      bp.Q.value = 3;
      const g = ctx.createGain();
      src.connect(bp).connect(g).connect(sfx);
      env(g, t, 0.003, 0.16, 0.07);
      src.start(t);
    },

    /** Word complete: a soft pop plus a chime on the chord. */
    pop() {
      if (!ctx) return;
      if (quiet) return click(0.08, 1200);
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(380, t);
      o.frequency.exponentialRampToValueAtTime(820, t + 0.09);
      o.connect(g).connect(sfx);
      env(g, t, 0.005, 0.1, 0.12);
      o.start(t);
      o.stop(t + 0.2);
      const chord = currentChord();
      bell(midi(chord.tones[2] + 12), t + 0.05, 0.06, sfx);
      keyStep = 0;
    },

    /** Bloom wave / celebration: a rising arpeggio. */
    sparkle(n = 8) {
      if (!ctx || quiet) return;
      const t = ctx.currentTime;
      const chord = currentChord();
      for (let i = 0; i < n; i++) {
        const m = chord.tones[i % 3] + 12 * Math.floor(i / 3);
        bell(midi(m + 12), t + i * 0.07, 0.05, sfx);
      }
    },

    chime() {
      if (!ctx || quiet) return;
      const t = ctx.currentTime;
      bell(midi(77), t, 0.06, sfx);
      bell(midi(84), t + 0.12, 0.05, sfx);
    },
  };
}

function impulse(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return b;
}
