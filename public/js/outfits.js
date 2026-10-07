// Original assets are preserved. Animation metadata remains pending validation
// of clean transparent frames, shared cells, anchors and directional sequences.
// Visible silhouette bounds measured from the supplied final avatars.
// Used only for presentation; original PNGs are never resampled or rewritten.
const bounds = [[100,75,760,1803],[103,75,757,1792],[102,70,763,1774],[102,77,760,1754]];
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
