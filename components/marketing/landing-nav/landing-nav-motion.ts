/** Premium easing — soft deceleration, no bounce */
export const NAV_EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Slightly quicker ease for exits */
export const NAV_EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const NAV_SPRING = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 0.85,
};

export const NAV_SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 380,
  damping: 36,
  mass: 0.7,
};

export const NAV_PANEL_OPEN = {
  duration: 0.38,
  ease: NAV_EASE_OUT,
};

export const NAV_PANEL_CLOSE = {
  duration: 0.28,
  ease: NAV_EASE_IN_OUT,
};

export const NAV_CONTENT_SWITCH = {
  duration: 0.36,
  ease: NAV_EASE_OUT,
};
