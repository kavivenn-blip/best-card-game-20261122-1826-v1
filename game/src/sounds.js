// Monsoon Market — sounds, synthesised in the browser. No audio files.
// One job: short WebAudio blips for play, deny, surge, turn and win.

export function makeSounds() {
  let ctx = null;
  let muted = false;

  function ensureContext() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, gain, when = 0) {
    const audio = ensureContext();
    if (!audio || muted) return;
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, audio.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + dur);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(audio.currentTime + when);
    osc.stop(audio.currentTime + when + dur);
  }

  return {
    play(name) {
      if (muted) return;
      switch (name) {
        case 'play':
          tone(520, 0.09, 'triangle', 0.12);
          tone(780, 0.12, 'triangle', 0.1, 0.07);
          break;
        case 'deny':
          tone(160, 0.15, 'square', 0.07);
          break;
        case 'surge':
          tone(392, 0.1, 'triangle', 0.14);
          tone(523, 0.1, 'triangle', 0.14, 0.08);
          tone(659, 0.18, 'triangle', 0.14, 0.16);
          break;
        case 'endturn':
          tone(330, 0.12, 'sine', 0.1);
          break;
        case 'opponent':
          tone(220, 0.12, 'sine', 0.09);
          tone(180, 0.14, 'sine', 0.09, 0.1);
          break;
        case 'start':
          tone(262, 0.12, 'triangle', 0.12);
          tone(392, 0.12, 'triangle', 0.12, 0.1);
          tone(523, 0.2, 'triangle', 0.12, 0.2);
          break;
        case 'win':
          [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.13, i * 0.13));
          break;
        case 'lose':
          [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, 'sine', 0.11, i * 0.15));
          break;
        default:
          break;
      }
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
  };
}
