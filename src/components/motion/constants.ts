export const easings = {
  premium: [0.16, 1, 0.3, 1] as const, // easeOutQuint - luxury editorial curve
  gentle: [0.25, 1, 0.5, 1] as const,
  standard: [0.4, 0, 0.2, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
};

export const durations = {
  micro: 0.2,
  fast: 0.35,
  normal: 0.6,
  reveal: 0.8,
  cinematic: 1.1,
  slow: 0.9,
};

export const staggers = {
  tight: 0.05,
  normal: 0.08,
  relaxed: 0.12,
};
