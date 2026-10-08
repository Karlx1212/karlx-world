import { outfits, readOutfit, saveOutfit } from './outfits.js';

// One shared identity for the selector and player, restored before either starts.
let selected = readOutfit();
export const playerState = Object.freeze({
  get activeOutfit() { return selected.key; },
  get outfit() { return selected; },
});

export function selectOutfit(key) {
  const outfit = outfits.find(candidate => candidate.key === key);
  if (!outfit) return;
  selected = outfit;
  // Preserve the existing storage key and 01–04 values for returning visitors.
  saveOutfit(outfit);
}
