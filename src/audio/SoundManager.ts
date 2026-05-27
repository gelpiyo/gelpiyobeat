class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private titleBGM: HTMLAudioElement | null = null;
  private gameBGM: HTMLAudioElement | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (!this.titleBGM) {
      this.titleBGM = new Audio('./assets/audio/bgm_title.mp3');
      this.titleBGM.loop = true;
      this.titleBGM.volume = 0.3;
    }
    if (!this.gameBGM) {
      this.gameBGM = new Audio('./assets/audio/bgm_game.mp3');
      this.gameBGM.loop = true;
      this.gameBGM.volume = 0.3;
    }
  }

  private createEnvelope(attack: number, decay: number, sustain: number, _release: number) {
    if (!this.ctx || !this.masterGain) return null;
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1, now + attack);
    gain.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    return { gain, now };
  }

  playHover() {
    if (!this.ctx) return;
    const env = this.createEnvelope(0.01, 0.05, 0, 0.05);
    if (!env) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, env.now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, env.now + 0.05);
    osc.connect(env.gain);
    osc.start();
    osc.stop(env.now + 0.1);
  }

  playClick() {
    if (!this.ctx) return;
    const env = this.createEnvelope(0.01, 0.1, 0, 0.1);
    if (!env) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, env.now); // A4
    osc.frequency.exponentialRampToValueAtTime(880, env.now + 0.1);
    osc.connect(env.gain);
    osc.start();
    osc.stop(env.now + 0.2);
  }

  playHit(judgment: string) {
    if (!this.ctx) return;
    const env = this.createEnvelope(0.01, 0.1, 0, 0.1);
    if (!env) return;
    const osc = this.ctx.createOscillator();
    env.gain.gain.value = 0.6; // Slightly louder
    
    if (judgment === 'PERFECT') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, env.now);
      osc.frequency.exponentialRampToValueAtTime(2400, env.now + 0.1);
    } else if (judgment === 'GREAT') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, env.now);
      osc.frequency.exponentialRampToValueAtTime(1200, env.now + 0.1);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, env.now);
    }
    
    osc.connect(env.gain);
    osc.start();
    osc.stop(env.now + 0.2);
  }

  playMiss() {
    if (!this.ctx) return;
    const env = this.createEnvelope(0.05, 0.2, 0, 0.2);
    if (!env) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, env.now);
    osc.frequency.exponentialRampToValueAtTime(50, env.now + 0.3);
    osc.connect(env.gain);
    osc.start();
    osc.stop(env.now + 0.4);
  }

  playSkill(skill: string) {
    if (!this.ctx) return;
    const env = this.createEnvelope(0.1, 0.3, 0, 0.5);
    if (!env) return;
    const osc = this.ctx.createOscillator();
    if (skill === 'STOP') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, env.now);
      osc.frequency.exponentialRampToValueAtTime(200, env.now + 0.4);
    } else if (skill === 'SLOW') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, env.now);
      osc.frequency.linearRampToValueAtTime(1000, env.now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(200, env.now + 0.5);
    } else if (skill === 'BOM') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, env.now);
      env.gain.gain.setValueAtTime(1, env.now);
      // Pseudo noise for BOM
      osc.frequency.exponentialRampToValueAtTime(10, env.now + 0.5);
    }
    osc.connect(env.gain);
    osc.start();
    osc.stop(env.now + 0.6);
  }

  stopBGM() {
    if (this.titleBGM) {
      this.titleBGM.pause();
      this.titleBGM.currentTime = 0;
    }
    if (this.gameBGM) {
      this.gameBGM.pause();
      this.gameBGM.currentTime = 0;
    }
  }

  startTitleBGM() {
    this.stopBGM();
    if (this.titleBGM) {
      this.titleBGM.play().catch(e => console.warn('BGM play blocked:', e));
    }
  }

  startGameBGM(_bpm: number) {
    this.stopBGM();
    if (this.gameBGM) {
      this.gameBGM.play().catch(e => console.warn('BGM play blocked:', e));
    }
  }
}

export const soundManager = new SoundManager();
