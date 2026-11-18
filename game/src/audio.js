// Sound, all synthesized with WebAudio: no audio files, no network. The engine
// hums with speed, the siren wails when police are near, and every action has a
// short blip, thud or jingle. The context is created on the first user gesture.

export function createAudio() {
  let context = null;
  let master = null;
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenTimer = null;
  let muted = false;
  let noiseBuffer = null;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(context.destination);
      noiseBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, volume, slideTo) {
    if (!ensure()) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + dur);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function noise(dur, volume, filterFreq) {
    if (!ensure()) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(now);
    source.stop(now + dur + 0.02);
  }

  return {
    /** Call from a user gesture (the Start button) so the context is allowed to sound. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    setMuted(value) {
      muted = value;
      if (master) master.gain.value = muted ? 0 : 0.5;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(660, 0.06, 'square', 0.12);
    },
    punch() {
      noise(0.09, 0.35, 900);
      tone(140, 0.09, 'sine', 0.3, 60);
    },
    gunshot() {
      noise(0.12, 0.5, 3200);
      tone(220, 0.08, 'square', 0.2, 55);
    },
    crash() {
      noise(0.28, 0.5, 500);
      tone(90, 0.25, 'sine', 0.35, 40);
    },
    pickup() {
      tone(880, 0.08, 'sine', 0.22);
      tone(1320, 0.12, 'sine', 0.2);
    },
    coin() {
      tone(1046, 0.07, 'sine', 0.2);
      tone(1568, 0.14, 'sine', 0.18);
    },
    jingle() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((freq, i) => {
        setTimeout(() => tone(freq, 0.16, 'triangle', 0.25), i * 110);
      });
    },
    fail() {
      tone(392, 0.18, 'sawtooth', 0.18, 180);
      tone(311, 0.28, 'sawtooth', 0.18, 140);
    },
    /** Continuous engine hum; speed01 is 0..1, on is false on foot or paused. */
    engine(on, speed01) {
      if (!ensure()) return;
      if (!on) {
        if (engineGain) engineGain.gain.setTargetAtTime(0, context.currentTime, 0.08);
        return;
      }
      if (!engineOsc) {
        engineOsc = context.createOscillator();
        engineOsc.type = 'sawtooth';
        engineFilter = context.createBiquadFilter();
        engineFilter.type = 'lowpass';
        engineFilter.frequency.value = 420;
        engineGain = context.createGain();
        engineGain.gain.value = 0;
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
      }
      engineOsc.frequency.setTargetAtTime(52 + speed01 * 130, context.currentTime, 0.06);
      engineGain.gain.setTargetAtTime(0.05 + speed01 * 0.05, context.currentTime, 0.08);
    },
    /** Two-tone siren while police are close; off otherwise. */
    siren(on) {
      if (!ensure()) return;
      if (!on) {
        if (sirenGain) sirenGain.gain.setTargetAtTime(0, context.currentTime, 0.1);
        if (sirenTimer) {
          clearInterval(sirenTimer);
          sirenTimer = null;
        }
        return;
      }
      if (!sirenOsc) {
        sirenOsc = context.createOscillator();
        sirenOsc.type = 'square';
        sirenOsc.frequency.value = 720;
        sirenGain = context.createGain();
        sirenGain.gain.value = 0;
        sirenOsc.connect(sirenGain);
        sirenGain.connect(master);
        sirenOsc.start();
      }
      if (!sirenTimer) {
        let high = false;
        sirenTimer = setInterval(() => {
          if (!sirenOsc) return;
          high = !high;
          sirenOsc.frequency.setTargetAtTime(high ? 960 : 720, context.currentTime, 0.05);
        }, 420);
      }
      sirenGain.gain.setTargetAtTime(0.045, context.currentTime, 0.1);
    },
  };
}
