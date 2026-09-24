import { SoundId } from '../types/alarm';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isLooping = false;
  private loopTimer: number | null = null;
  private activeNodes: (AudioNode | { stop?: () => void })[] = [];
  private masterGain: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Play a tiny inaudible ping to satisfy browser gesture requirements
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Plays a single iteration of a sound preset
   */
  private playPattern(soundId: SoundId, volume: number): number {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), now);
    master.connect(ctx.destination);
    this.masterGain = master;

    let cycleDurationMs = 2000;

    switch (soundId) {
      case 'digital-beep': {
        cycleDurationMs = 1500;
        // 4 rapid double beeps
        const beeps = [0, 0.2, 0.5, 0.7];
        beeps.forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1046.5, now + offset); // C6
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + offset);
          osc.stop(now + offset + 0.15);
          this.activeNodes.push(osc);
        });
        break;
      }

      case 'gentle-chime': {
        cycleDurationMs = 2800;
        // Warm crystalline arpeggio: C5, E5, G5, B5, C6
        const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
        notes.forEach((freq, idx) => {
          const offset = idx * 0.18;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + offset);

          // Second subtle overtone
          const harmonic = ctx.createOscillator();
          const harmGain = ctx.createGain();
          harmonic.type = 'triangle';
          harmonic.frequency.setValueAtTime(freq * 2, now + offset);
          harmGain.gain.setValueAtTime(0.08, now + offset);
          harmGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.8);
          harmonic.connect(harmGain);
          harmGain.connect(master);
          harmonic.start(now + offset);
          harmonic.stop(now + offset + 0.9);
          this.activeNodes.push(harmonic);

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.28, now + offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.6);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + offset);
          osc.stop(now + offset + 1.7);
          this.activeNodes.push(osc);
        });
        break;
      }

      case 'zen-bell': {
        cycleDurationMs = 3500;
        // Tibetan singing bowl resonant chord: 216Hz, 432Hz, 648Hz
        const partials = [
          { freq: 216, gain: 0.35, decay: 3.2 },
          { freq: 432, gain: 0.22, decay: 2.8 },
          { freq: 648, gain: 0.15, decay: 2.2 },
          { freq: 864, gain: 0.08, decay: 1.8 },
        ];

        partials.forEach((p) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(p.freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(p.gain, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + p.decay + 0.1);
          this.activeNodes.push(osc);
        });
        break;
      }

      case 'morning-marimba': {
        cycleDurationMs = 2400;
        // Cheerful wooden marimba motif
        const pattern = [
          { f: 440, t: 0 },
          { f: 554.37, t: 0.15 },
          { f: 659.25, t: 0.3 },
          { f: 880, t: 0.45 },
          { f: 739.99, t: 0.75 },
          { f: 880, t: 0.95 },
        ];

        pattern.forEach((note) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, now + note.t);

          gain.gain.setValueAtTime(0, now + note.t);
          gain.gain.linearRampToValueAtTime(0.35, now + note.t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + 0.5);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + note.t);
          osc.stop(now + note.t + 0.55);
          this.activeNodes.push(osc);
        });
        break;
      }

      case 'radar-pulse': {
        cycleDurationMs = 1800;
        // Futuristic double ping sweep
        [0, 0.4].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1400, now + offset + 0.25);

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.4);

          osc.connect(gain);
          gain.connect(master);
          osc.start(now + offset);
          osc.stop(now + offset + 0.45);
          this.activeNodes.push(osc);
        });
        break;
      }
    }

    return cycleDurationMs;
  }

  /**
   * Start looping the alarm sound until stopAlarm() is called
   */
  public startAlarm(soundId: SoundId, volume = 0.8): void {
    this.stopAlarm();
    this.isLooping = true;

    const playLoop = () => {
      if (!this.isLooping) return;
      const durationMs = this.playPattern(soundId, volume);
      this.loopTimer = window.setTimeout(playLoop, durationMs + 200);
    };

    playLoop();
  }

  /**
   * Plays a single test sample of the sound (does not loop)
   */
  public previewSound(soundId: SoundId, volume = 0.8): void {
    this.stopAlarm();
    this.playPattern(soundId, volume);
  }

  /**
   * Stops looping and all active audio nodes immediately
   */
  public stopAlarm(): void {
    this.isLooping = false;
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        if ('disconnect' in node && typeof node.disconnect === 'function') {
          node.disconnect();
        }
      } catch {
        // node might already be stopped
      }
    });
    this.activeNodes = [];

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // already disconnected
      }
      this.masterGain = null;
    }
  }

  public updateVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), this.ctx.currentTime);
    }
  }
}

export const audioSynthesizer = new AudioSynthesizer();
