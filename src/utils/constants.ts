export const DEFAULT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <g stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M200 50 L350 150 L350 300 L200 350 L50 300 L50 150 Z" fill="#6366f1" />
    <path d="M200 50 L200 200" stroke="#f43f5e" />
    <path d="M50 150 L200 200" stroke="#f59e0b" />
    <path d="M350 150 L200 200" stroke="#10b981" />
    <path d="M200 200 L200 350" stroke="#3b82f6" />
    <path d="M50 300 L200 200" stroke="#8b5cf6" />
    <path d="M350 300 L200 200" stroke="#ec4899" />
    <circle cx="200" cy="200" r="80" stroke="#64748b" />
    <circle cx="200" cy="200" r="40" stroke="#94a3b8" />
    <path d="M160 160 L240 240 M240 160 L160 240" stroke="#facc15" />
  </g>
</svg>
`;

export const easeFunctions: Record<string, (t: number) => number> = {
    'linear': (t) => t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => 1 - Math.pow(1 - t, 2),
    'ease-in-out': (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    'ease': (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};
