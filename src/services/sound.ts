import { SoundEffectName } from '../types';

/**
 * Procedural Web Audio Sound Engine written in TypeScript
 */
class SoundEngine {
  private enabled: boolean = true;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private hasInteracted: boolean = false;
  private lastTriggered: Record<string, number> = {};

  constructor() {
    try {
      const saved = localStorage.getItem('idn_snd');
      if (saved !== null) {
        this.enabled = saved !== 'off';
      }
    } catch {
      this.enabled = true;
    }

    this.initInteractionListeners();
  }

  private initContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 0.35;
          this.masterGain.connect(this.ctx.destination);
        }
      } catch (err) {
        console.warn('AudioContext failed:', err);
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private initInteractionListeners(): void {
    const unlock = () => {
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        this.initContext();
      }
    };
    (['click', 'touchstart', 'keydown', 'pointerdown'] as const).forEach((evt) => {
      window.addEventListener(evt, unlock, { once: true, passive: true });
    });
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('idn_snd', this.enabled ? 'on' : 'off');
    } catch {}
    if (this.enabled) {
      this.play('pop');
    }
    return this.enabled;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal: number = 0.35,
    freqTo: number | null = null,
    delay: number = 0
  ): void {
    const c = this.initContext();
    if (!c || !this.masterGain) return;

    const startTime = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    if (freqTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqTo), startTime + duration);
    }

    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  private noise(duration: number, gainVal: number = 0.25, filterFreq: number = 1500, delay: number = 0): void {
    const c = this.initContext();
    if (!c || !this.masterGain) return;

    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = c.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;

    const gain = c.createGain();
    const startTime = c.currentTime + delay;

    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(startTime);
  }

  public play(name: SoundEffectName, minInterval: number = 50): void {
    if (!this.enabled) return;

    const now = performance.now();
    if (this.lastTriggered[name] && now - this.lastTriggered[name] < minInterval) {
      return;
    }
    this.lastTriggered[name] = now;

    try {
      switch (name) {
        case 'pop':
          this.tone(720, 0.08, 'sine', 0.35, 340);
          break;
        case 'bonk':
          this.tone(260, 0.12, 'triangle', 0.5, 80);
          break;
        case 'squeak':
          this.tone(1350, 0.08, 'square', 0.15, 2100);
          break;
        case 'boing':
          this.tone(190, 0.18, 'sine', 0.45, 680);
          this.tone(680, 0.25, 'sine', 0.35, 220, 0.15);
          break;
        case 'blorp':
          this.tone(160, 0.2, 'sawtooth', 0.2, 50);
          break;
        case 'honk':
          this.tone(240, 0.28, 'sawtooth', 0.2);
          this.tone(255, 0.28, 'sawtooth', 0.2);
          break;
        case 'tick':
          this.tone(1600, 0.02, 'square', 0.08);
          break;
        case 'up':
          this.tone(320, 0.22, 'sine', 0.3, 1400);
          break;
        case 'kaching':
          this.tone(1560, 0.1, 'sine', 0.4);
          this.tone(2090, 0.35, 'sine', 0.4, null, 0.09);
          this.noise(0.08, 0.15, 6500, 0.05);
          break;
        case 'sad':
          ([
            [293, 0.25, 0],
            [277, 0.25, 0.26],
            [261, 0.25, 0.52],
            [233, 0.8, 0.78]
          ] as const).forEach(([f, d, a]) => this.tone(f, d, 'sawtooth', 0.18, f * 0.92, a));
          break;
        case 'horn':
          ([440, 554, 659] as const).forEach((f) => this.tone(f, 0.5, 'sawtooth', 0.12, f * 0.9));
          this.noise(0.12, 0.1, 3000);
          break;
        case 'boom':
          this.tone(90, 0.7, 'sine', 0.8, 30);
          this.noise(0.3, 0.35, 250);
          break;
        case 'alarm':
          for (let i = 0; i < 4; i++) {
            this.tone(i % 2 === 0 ? 880 : 660, 0.1, 'square', 0.15, null, i * 0.12);
          }
          break;
        case 'rim':
          this.tone(140, 0.1, 'triangle', 0.6, 70);
          this.tone(115, 0.12, 'triangle', 0.6, 60, 0.15);
          this.noise(0.4, 0.3, 5000, 0.35);
          break;
        case 'fanfare':
          ([523, 659, 784, 1047] as const).forEach((f, i) => {
            this.tone(f, 0.2, 'triangle', 0.35, null, i * 0.08);
          });
          break;
        case 'dun':
          ([
            [196, 0],
            [196, 0.25],
            [165, 0.5]
          ] as const).forEach(([f, a]) => this.tone(f, 0.35, 'sawtooth', 0.22, f * 0.96, a));
          break;
        case 'scratch':
          this.noise(0.35, 0.4, 2500);
          break;
      }
    } catch (e) {
      console.warn('Sound play exception:', e);
    }
  }

  public randomClick(): void {
    const list: SoundEffectName[] = ['pop', 'bonk', 'squeak', 'boing', 'blorp'];
    const chosen = list[Math.floor(Math.random() * list.length)];
    this.play(chosen, 40);
  }
}

export const sound = new SoundEngine();
