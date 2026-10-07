// Original assets are preserved. Animation metadata remains pending validation
// of clean transparent frames, shared cells, anchors and directional sequences.
export const outfits = ['01', '02', '03', '04'].map(id => ({
  id,
  idle: `/assets/characters/karlx/outfits/outfit-${id}-idle.png`,
  spriteSheet: `/assets/characters/karlx/outfits/outfit-${id}-sprites.png`,
  animation: null,
}));
const storageKey = 'karlx-selected-outfit';
export function readOutfit() {
  try { return outfits.find(outfit => outfit.id === localStorage.getItem(storageKey)) || outfits[0]; }
  catch { return outfits[0]; }
}
export function saveOutfit(outfit) {
  try { localStorage.setItem(storageKey, outfit.id); } catch { /* Selection still works without storage. */ }
}
