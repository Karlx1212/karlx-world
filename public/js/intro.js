import { game } from './game.js';
import { audio } from './audio.js';
import { outfits } from './outfits.js';
import { playerState, selectOutfit } from './player-state.js';

const get = id => document.getElementById(id);
const overlay = get('start');
const canvas = get('world');
const hud = get('hud');
const screens = ['boot', 'welcome', 'player-card', 'connection'];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let phase = 'welcome';
// Observe resource failures immediately, while the visitor can use the welcome.
const prepared = game.ready.then(() => true, () => false);
let generation = 0;
let toastTimer;
let tipTimer;
let messageGeneration = 0;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
function renderOutfit() {
  const selectedOutfit = playerState.outfit;
  const portrait = get('outfit-portrait');
  portrait.src = selectedOutfit.idle;
  portrait.alt = `KARLX, outfit ${selectedOutfit.id}`;
  const { width, height, bounds: [left, top, right, bottom] } = selectedOutfit.presentation;
  const scale = 204 / (bottom - top);
  portrait.style.setProperty('--avatar-width', `${width * scale / 92 * 100}%`);
  portrait.style.setProperty('--avatar-height', `${height * scale / 216 * 100}%`);
  portrait.style.setProperty('--avatar-left', `${(46 - (left + right) * scale / 2) / 92 * 100}%`);
  portrait.style.setProperty('--avatar-top', `${(6 - top * scale) / 216 * 100}%`);
  get('outfit-label').textContent = `KARLX / ${selectedOutfit.id}`;
  get('outfit-class').textContent = selectedOutfit.className;
  get('outfit-ability').textContent = selectedOutfit.ability;
  get('outfit-description').textContent = selectedOutfit.description;
}
function changeOutfit(direction) {
  const index = outfits.indexOf(playerState.outfit);
  selectOutfit(outfits[(index + direction + outfits.length) % outfits.length].key);
  renderOutfit();
}
get('outfit-previous').addEventListener('click', () => changeOutfit(-1));
get('outfit-next').addEventListener('click', () => changeOutfit(1));
renderOutfit();

function screen(id, focusId) {
  phase = id;
  overlay.hidden = false;
  overlay.inert = false;
  overlay.classList.remove('is-leaving');
  for (const name of screens) get(name).hidden = name !== id;
  canvas.inert = true;
  hud.inert = true;
  if (focusId) get(focusId).focus({ preventScroll: true });
}
function notify(message) {
  clearTimeout(toastTimer);
  const toast = get('entry-toast');
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4000);
}
function syncAudioControls() {
  for (const [id, channel, label] of [['music-toggle', 'music', 'música'], ['sound-toggle', 'sounds', 'sonidos']]) {
    const button = get(id);
    const enabled = audio.preferences[channel];
    button.setAttribute('aria-pressed', String(enabled));
    button.title = `${enabled ? 'Desactivar' : 'Activar'} ${label}`;
    const state = channel === 'music' ? (enabled ? 'activada' : 'desactivada') : (enabled ? 'activados' : 'desactivados');
    button.setAttribute('aria-label', `${label === 'música' ? 'Música' : 'Sonidos'}: ${state}`);
    button.querySelector('.audio-state').textContent = enabled ? 'SÍ' : 'NO';
  }
}
for (const [id, channel] of [['music-toggle', 'music'], ['sound-toggle', 'sounds']]) {
  get(id).addEventListener('click', event => {
    audio.unlock(event);
    audio.setEnabled(channel, !audio.preferences[channel]);
  });
}
audio.addEventListener('change', syncAudioControls);
syncAudioControls();
// Only real user gestures unlock future playback; saved preferences alone cannot.
document.addEventListener('pointerdown', event => audio.unlock(event), { capture: true });
document.addEventListener('keydown', event => audio.unlock(event), { capture: true });
document.addEventListener('click', () => audio.play('click'));
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pauseAll(); });

async function boot(run) {
  screen('boot', 'boot-title');
  get('retry').hidden = true;
  get('boot-message').textContent = 'Cargando creatividad...';
  let cancelMinimum;
  // Start the minimum after the existing screen has had a chance to paint.
  const minimum = new Promise(resolve => {
    let timer;
    let firstFrame;
    let secondFrame;
    let finished = false;
    const finish = () => {
      finished = true;
      clearTimeout(timer);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      motion.removeEventListener('change', onMotion);
      resolve();
    };
    const onMotion = () => { if (motion.matches) finish(); };
    cancelMinimum = finish;
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (finished) return;
        if (motion.matches) { finish(); return; }
        timer = setTimeout(finish, 3000);
        motion.addEventListener('change', onMotion);
      });
    });
  });
  const progress = get('boot-progress');
  progress.value = 10;
  const messages = ['Cargando creatividad...', 'Organizando ideas...', 'Renderizando píxeles...', 'Conectando estrategia + creatividad...'];
  let index = 0;
  const interval = setInterval(() => {
    index++;
    progress.value = Math.min(90, progress.value + 20);
    get('boot-message').textContent = messages[index % messages.length];
  }, 450);
  try {
    if (!await prepared) throw new Error('No se pudo preparar el playground.');
    await minimum;
    if (run !== generation) return false;
    progress.value = 100;
    get('boot-message').textContent = 'Todo listo ✓';
    return true;
  } catch {
    if (run !== generation) return false;
    get('boot-message').textContent = 'No se pudo cargar a KARLX. Recargá la página para volver a intentarlo.';
    get('retry').hidden = false;
    get('retry').focus();
    return false;
  } finally {
    clearInterval(interval);
    cancelMinimum();
  }
}
get('retry').addEventListener('click', () => location.reload());
get('quick').addEventListener('click', () => notify('El modo rápido estará disponible muy pronto.'));
get('enter').addEventListener('click', () => {
  if (phase !== 'welcome') return;
  screen('player-card', 'player-title');
  audio.play('window');
});
get('launch').addEventListener('click', () => launch());

async function launch() {
  if (phase !== 'player-card') return;
  const run = ++generation;
  if (!await boot(run) || run !== generation) return;
  game.reveal();
  const arrival = get('world-arrival');
  arrival.classList.remove('fading');
  arrival.hidden = false;
  overlay.classList.add('is-leaving');
  if (!motion.matches) await wait(350);
  if (run !== generation) return;
  overlay.hidden = true;
  overlay.inert = true;
  phase = 'arrival';
  // The menu stays available while the title is displayed.
  hud.inert = false;
  get('back').focus({ preventScroll: true });
  await wait(motion.matches ? 1200 : 2200);
  if (run !== generation) return;
  arrival.classList.add('fading');
  if (!motion.matches) await wait(600);
  if (run !== generation) return;
  arrival.hidden = true;
  showMessage();
}
function showMessage() {
  phase = 'message';
  const phone = get('phone-message');
  const bubbles = [...phone.querySelectorAll('.chat-bubble')];
  bubbles.forEach(bubble => { bubble.hidden = true; });
  get('chat-actions').hidden = true;
  get('chat-typing').hidden = true;
  phone.showModal();
  get('phone-title').focus({ preventScroll: true });
  audio.play('notification');
  revealMessages(bubbles);
}
async function revealMessages(bubbles) {
  const run = ++messageGeneration;
  for (const bubble of bubbles) {
    if (!motion.matches) {
      get('chat-typing').hidden = false;
      await wait(320);
    }
    if (run !== messageGeneration || !get('phone-message').open) return;
    get('chat-typing').hidden = true;
    bubble.hidden = false;
  }
  get('chat-actions').hidden = false;
  if (document.activeElement === get('phone-title')) get('explore').focus({ preventScroll: true });
}
function explore() {
  if (phase !== 'message') return;
  get('phone-message').close();
  phase = 'play';
  canvas.inert = false;
  hud.inert = false;
  game.resume();
  const tip = get('movement-tip');
  tip.hidden = false;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { tip.hidden = true; }, 5000);
}
get('explore').addEventListener('click', explore);
get('phone-message').addEventListener('cancel', event => { event.preventDefault(); explore(); });
get('map').addEventListener('click', () => {
  // Toast lives inside the modal so it remains visible above its backdrop.
  const toast = get('entry-toast');
  get('phone-message').append(toast);
  notify('El mapa de KARLX WORLD estará disponible muy pronto.');
});
get('phone-message').addEventListener('close', () => {
  messageGeneration++;
  document.body.append(get('entry-toast'));
  get('entry-toast').hidden = true;
});
game.events.addEventListener('menu', () => {
  generation++;
  clearTimeout(tipTimer);
  get('movement-tip').hidden = true;
  get('world-arrival').hidden = true;
  if (get('phone-message').open) get('phone-message').close();
  screen('welcome', 'enter');
});

// Focus remains within the introduction; the game and HUD are inert until entry.
document.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  if (!screens.includes(phase)) return;
  const panel = get(phase);
  const buttons = [...panel.querySelectorAll('button:not([hidden]):not(:disabled)'), get('music-toggle'), get('sound-toggle')];
  if (!buttons.length) { event.preventDefault(); return; }
  const first = buttons[0], last = buttons[buttons.length - 1];
  if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});
screen('welcome');
