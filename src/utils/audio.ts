/**
 * Pure Web Audio API Sound Synthesizer for Taiwanese Night Market Game
 * No external audio files needed; ultra-responsive and latency-free.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicEnabled: boolean = false;
  private musicGainNode: GainNode | null = null;
  private musicInterval: number | null = null;
  private sfxGainNode: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.sfxGainNode = this.ctx.createGain();
      this.sfxGainNode.gain.value = 0.7;
      this.sfxGainNode.connect(this.ctx.destination);

      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.value = 0.15;
      this.musicGainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.sfxGainNode && this.ctx) {
      this.sfxGainNode.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (enabled) {
      this.startCarnivalMusic();
    } else {
      this.stopCarnivalMusic();
    }
  }

  public getMusicEnabled() {
    return this.isMusicEnabled;
  }

  // 1. 復古軟木塞手槍: 空腔拔塞音 (Pop!) + 彈回振動
  public playCorkGun() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    // Pop impulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.15);

    // High cavity air noise
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGainNode);
    noise.start(t);
  }

  // 2. 連發BB玩具步槍: 清脆機械碰碰聲 (Sharp crack & metallic snap)
  public playBBRifle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // 3. 磁吸夜市飛鏢: 呼嘯風聲與沉穩落靶聲 (Throw swoosh & solid target thud)
  public playDart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // 4. 霓虹雷射手槍: 科幻夜市電子脈衝音 (Pew-pew high-tech pulse)
  public playLaser() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // 快速裝填音效 (R key)
  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    // Mechanical click 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(450, t);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc1.connect(gain1);
    gain1.connect(this.sfxGainNode);
    osc1.start(t);
    osc1.stop(t + 0.04);

    // Mechanical lock 2 (clack!)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(800, t + 0.1);
    gain2.gain.setValueAtTime(0.4, t + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    osc2.connect(gain2);
    gain2.connect(this.sfxGainNode);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.16);
  }

  // 沒子彈空擊 (Dry Fire)
  public playDryFire() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // 氣球清脆爆裂音效 (Balloon Pop)
  public playBalloonPop(isRainbow: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isRainbow ? 900 : 1400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);
    noise.start(t);

    if (isRainbow) {
      // Add celebratory sparkle chime
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const chime = this.ctx!.createOscillator();
        const chimeGain = this.ctx!.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, t + idx * 0.04);
        chimeGain.gain.setValueAtTime(0.25, t + idx * 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);
        chime.connect(chimeGain);
        chimeGain.connect(this.sfxGainNode!);
        chime.start(t + idx * 0.04);
        chime.stop(t + idx * 0.04 + 0.25);
      });
    }
  }

  // 小鴨中彈搞笑嘎嘎叫 (Duck Quack)
  public playDuckQuack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Modulate pitch down then slight wobble
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.linearRampToValueAtTime(320, t + 0.09);
    osc.frequency.linearRampToValueAtTime(280, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, t);
    filter.Q.setValueAtTime(4, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // 鋼盔特技鴨金屬彈刀聲 (Helmet Hit)
  public playShieldHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // 同心圓木靶金屬鐘聲 (Bullseye Bell Chime)
  public playMetalBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    [1046.5, 2093].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  // 波霸珍珠奶茶補滿彈藥音效 (Boba Slurp & Ammo Refill)
  public playBobaRefill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    // Bubbly slurping sound
    const freqs = [350, 480, 620, 800, 1000];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.3, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.04 + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.09);
    });
  }

  // 炸彈爆破與扣分震動聲 (Bomb Explosion)
  public playBombExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode);
    noise.start(t);
  }

  // 連擊升階樂音 (Ascending Combo Melody)
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
    const index = Math.min(comboCount, scale.length - 1);
    const freq = scale[index];

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // 狂熱模式引爆 (Fever Trigger Fanfare)
  public playFeverTrigger() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n, t + i * 0.06);
      gain.gain.setValueAtTime(0.4, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.3);
    });
  }

  // 夜市彩票機吐票音效 (Ticket Dispenser Motor)
  public playTicketPayout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGainNode);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // 兌換戰利品音效 (Prize Redeemed Fanfare)
  public playPrizeRedeem() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5];
    chords.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGainNode!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  // 玩具互動音效 (Squeak / Cutlet Sizzle)
  public playToySound(toyType: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGainNode) return;

    const t = this.ctx.currentTime;
    if (toyType === 'shiba') {
      // Puppy bark / squeak
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.linearRampToValueAtTime(900, t + 0.06);
      osc.frequency.linearRampToValueAtTime(450, t + 0.14);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(t);
      osc.stop(t + 0.16);
    } else if (toyType === 'chicken') {
      // Crispy sizzle
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGainNode);
      noise.start(t);
    } else {
      // Standard carnival chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGainNode);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  // 溫馨夜市嘉年華背景音樂 (Nostalgic Night Market Carousel Melody)
  public startCarnivalMusic() {
    this.initCtx();
    if (this.musicInterval) return;

    // A cheerful, cozy 8-bar night market waltz in C Major
    const melody = [
      { note: 523.25, dur: 0.25 }, // C5
      { note: 587.33, dur: 0.25 }, // D5
      { note: 659.25, dur: 0.35 }, // E5
      { note: 783.99, dur: 0.35 }, // G5
      { note: 659.25, dur: 0.25 }, // E5
      { note: 523.25, dur: 0.4 },  // C5
      { note: 440.00, dur: 0.25 }, // A4
      { note: 392.00, dur: 0.35 }, // G4
      { note: 440.00, dur: 0.25 }, // A4
      { note: 523.25, dur: 0.5 },  // C5
      { note: 659.25, dur: 0.3 },  // E5
      { note: 587.33, dur: 0.4 },  // D5
    ];

    let noteIdx = 0;
    const playNext = () => {
      if (!this.isMusicEnabled || this.isMuted || !this.ctx || !this.musicGainNode) return;
      const item = melody[noteIdx % melody.length];
      noteIdx++;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle'; // Soft organ / accordion vibe
      osc.frequency.setValueAtTime(item.note, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.dur);

      osc.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(t);
      osc.stop(t + item.dur);
    };

    this.musicInterval = window.setInterval(playNext, 380);
  }

  public stopCarnivalMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundEngine();
