import { SpeechStyle } from '../types/alarm';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.voices.length === 0 && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  public generateGreeting(
    style: SpeechStyle,
    timeFormatted: string,
    label: string,
    customQuote?: string
  ): string {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
      timeGreeting = 'Good evening';
    } else if (hour >= 22 || hour < 5) {
      timeGreeting = 'Good night';
    }

    const alarmTitle = label && label.trim() ? label.trim() : 'Wake up';

    switch (style) {
      case 'simple':
        return `${timeGreeting}! It is ${timeFormatted}. Time for ${alarmTitle}!`;

      case 'energetic':
        return `Rise and shine! It is ${timeFormatted}. ${alarmTitle}! Your future is created by what you do today. Let's make today count!`;

      case 'motivational':
        return `${timeGreeting}! It is ${timeFormatted}. Remember: Discipline is the bridge between goals and accomplishment. Time for ${alarmTitle}!`;

      case 'mindful':
        return `${timeGreeting}. The time is now ${timeFormatted}. Take a calm, deep breath. Approach today with clarity, focus, and gratitude.`;

      case 'custom':
        if (customQuote && customQuote.trim()) {
          return customQuote
            .replace(/{greeting}/gi, timeGreeting)
            .replace(/{time}/gi, timeFormatted)
            .replace(/{label}/gi, alarmTitle);
        }
        return `${timeGreeting}! It is ${timeFormatted}. Time for ${alarmTitle}!`;

      default:
        return `${timeGreeting}! It is ${timeFormatted}. Time to wake up!`;
    }
  }

  public speak(
    text: string,
    options: {
      voiceURI?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
    } = {},
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    this.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume !== undefined ? options.volume : 1.0;

    const voices = this.getVoices();
    if (options.voiceURI) {
      const selected = voices.find((v) => v.voiceURI === options.voiceURI);
      if (selected) {
        utterance.voice = selected;
      }
    } else {
      // Default to an English voice if available
      const enVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.default));
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    try {
      this.synth.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public cancel(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
