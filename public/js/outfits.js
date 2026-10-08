// Original assets are preserved. Animation metadata remains pending validation
// of clean transparent frames, shared cells, anchors and directional sequences.
// Visible silhouette bounds measured from the supplied final avatars.
// Used only for presentation; original PNGs are never resampled or rewritten.
const bounds = [[8,42,368,981],[8,42,371,980],[0,42,362,981],[0,42,360,971]];
const widths = [368,371,362,408];
const classes = [
  { className: 'CONTENT CREATOR', ability: 'VIRAL MODE', description: 'Convierte ideas en contenido atractivo, detecta tendencias y conecta con nuevas audiencias.' },
  { className: 'COMMUNITY MANAGER', ability: 'COMMUNITY PULSE', description: 'Construye comunidades, genera conversaciones y transforma seguidores en conexiones reales.' },
  { className: 'EDITORIAL', ability: 'STORY VISION', description: 'Transforma conceptos en historias visuales con identidad, intención y dirección creativa.' },
  { className: 'DISEÑADORA GRÁFICA', ability: 'PIXEL PERFECT', description: 'Convierte ideas en identidades visuales, composiciones y piezas gráficas memorables.' },
];
export const outfits = ['01', '02', '03', '04'].map((id, index) => ({
  id,
  key: `outfit-${id}`,
  ...classes[index],
  idle: `/assets/characters/karlx/outfits/outfit-${id}-idle.png`,
  spriteSheet: `/assets/characters/karlx/outfits/outfit-${id}-sprites.png`,
  animation: null,
  presentation: { width: widths[index], height: 1024, bounds: bounds[index] },
}));
const storageKey = 'karlx-selected-outfit';
export function readOutfit() {
  try { return outfits.find(outfit => outfit.id === localStorage.getItem(storageKey)) || outfits[0]; }
  catch { return outfits[0]; }
}
export function saveOutfit(outfit) {
  try { localStorage.setItem(storageKey, outfit.id); } catch { /* Selection still works without storage. */ }
}
