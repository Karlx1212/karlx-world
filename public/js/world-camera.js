// Preserve approved arrival framing, then follow directly within real bounds.
// Only very tall viewports need a small, constant legacy arrival correction.
export function cameraAxis(position, visible, fraction, min, max, legacyMax, arrival = fraction===.5?700:640) {
  if (visible >= max-min) return min;
  const initialTarget=arrival-visible*fraction;
  const correction=Math.max(0,Math.min(legacyMax-visible,initialTarget))-initialTarget;
  return Math.max(min,Math.min(max-visible,position-visible*fraction+correction));
}
