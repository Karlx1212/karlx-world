// Original assets are preserved. Animation metadata remains pending validation
// of clean transparent frames, shared cells, anchors and directional sequences.
// Visible silhouette bounds measured from the supplied final avatars.
// Used only for presentation; original PNGs are never resampled or rewritten.
const bounds = [[71,61,793,1798],[61,62,804,1792],[64,33,805,1798],[67,57,800,1712]];
export const outfits = ['01', '02', '03', '04'].map((id, index) => ({
  id,
  idle: `/assets/characters/karlx/outfits/outfit-${id}-idle.png`,
  spriteSheet: `/assets/characters/karlx/outfits/outfit-${id}-sprites.png`,
  animation: null,
  presentation: { width: 864, height: 1821, bounds: bounds[index] },
}));
const storageKey = 'karlx-selected-outfit';
export function readOutfit() {
  try { return outfits.find(outfit => outfit.id === localStorage.getItem(storageKey)) || outfits[0]; }
  catch { return outfits[0]; }
}
export function saveOutfit(outfit) {
  try { localStorage.setItem(storageKey, outfit.id); } catch { /* Selection still works without storage. */ }
}
