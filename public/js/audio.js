const STORAGE_KEY = 'karlx-world-audio';
const defaults = { music: false, sounds: false };
function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { music: saved?.music === true, sounds: saved?.sounds === true };
  } catch { return { ...defaults }; }
}

// No assets are registered yet. Future zones can register their own audio cues.
export class AudioManager extends EventTarget {
  constructor() {
    super();
    this.preferences = readPreferences();
    this.assets = new Map();
    this.unlocked = false;
    this.currentMusic = null;
  }
  unlock(event) {
    if (event?.isTrusted && ['click', 'pointerdown', 'keydown'].includes(event.type)) this.unlocked = true;
  }
  setEnabled(channel, enabled) {
    if (!(channel in defaults)) return;
    this.preferences[channel] = Boolean(enabled);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences)); } catch { /* Private browsers may block storage. */ }
    if (!enabled) {
      for (const asset of this.assets.values()) {
        if (asset.channel === channel) { asset.element.pause(); asset.element.currentTime = 0; }
      }
    }
    this.dispatchEvent(new Event('change'));
  }
  register(name, src, { channel = 'sounds', loop = false, volume = 0.15 } = {}) {
    if (!(channel in defaults) || !src) return;
    const element = new Audio();
    element.preload = 'none';
    element.src = src;
    element.loop = loop;
    element.volume = Math.max(0, Math.min(volume, 0.35));
    element.addEventListener('error', () => this.dispatchEvent(new Event('unavailable')));
    this.assets.set(name, { channel, element });
  }
  async play(name) {
    const asset = this.assets.get(name);
    if (!asset || !this.unlocked || !this.preferences[asset.channel]) return false;
    if (asset.channel === 'music' && this.currentMusic && this.currentMusic !== asset.element) this.currentMusic.pause();
    try {
      if (asset.channel === 'sounds') asset.element.currentTime = 0;
      await asset.element.play();
      if (asset.channel === 'music') this.currentMusic = asset.element;
      return true;
    } catch { return false; }
  }
  pauseAll() { for (const { element } of this.assets.values()) element.pause(); }
}
export const audio = new AudioManager();
