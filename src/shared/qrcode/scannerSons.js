/**
 * Sons do scanner via Web Audio API — sem arquivos externos.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = "sine", volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch {
    // Audio não suportado — silencioso
  }
}

/** Beep de sucesso — tom agudo curto */
export function beepOk() {
  playTone(800, 150, "sine", 0.25);
}

/** Beep de erro/bloqueio — tom grave */
export function beepErro() {
  playTone(300, 200, "square", 0.2);
  setTimeout(() => playTone(250, 200, "square", 0.2), 220);
}

/** Beep de pendência/aviso — tom médio */
export function beepAviso() {
  playTone(500, 200, "sine", 0.2);
}

/** Beep de duplicado — tom suave curto */
export function beepDuplicado() {
  playTone(600, 100, "sine", 0.15);
}

/** Beep de QR inválido — tom erro triplo */
export function beepInvalido() {
  playTone(200, 120, "square", 0.2);
  setTimeout(() => playTone(200, 120, "square", 0.2), 150);
  setTimeout(() => playTone(200, 120, "square", 0.2), 300);
}

/** Vibração curta (100ms) */
export function vibrarOk() {
  try { navigator.vibrate?.(100); } catch {}
}

/** Vibração dupla */
export function vibrarErro() {
  try { navigator.vibrate?.([100, 50, 100]); } catch {}
}

/** Vibração longa */
export function vibrarAviso() {
  try { navigator.vibrate?.(200); } catch {}
}

/** Vibração tripla */
export function vibrarInvalido() {
  try { navigator.vibrate?.([80, 40, 80, 40, 80]); } catch {}
}
