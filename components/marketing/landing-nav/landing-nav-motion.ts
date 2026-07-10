/**
 * Centralized motion constants for the landing page mega menu.
 * Single source of truth — tweak here to affect all transitions uniformly.
 */

/** Silky deceleration ease: fast start, graceful float to rest. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Panel shell fade + translate open */
export const PANEL_OPEN = {
  duration: 0.24,
  ease: EASE_OUT,
} as const;

/** Panel shell fade + translate close (slightly faster) */
export const PANEL_CLOSE = {
  duration: 0.16,
  ease: EASE_OUT,
} as const;

/** Inner content crossfade when switching Solutions ↔ Resources */
export const CONTENT_SWAP = {
  duration: 0.26,
  ease: EASE_OUT,
} as const;

/** Height morph animated on the container's real `height` (no transform distortion) */
export const HEIGHT_MORPH = {
  duration: 0.34,
  ease: EASE_OUT,
} as const;

/** Direction for content slide: +1 = left-to-right, -1 = right-to-left */
export const SLIDE_AMPLITUDE = 18;
