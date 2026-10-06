export type PaletteKey =
  'terracotta' | 'rosePoudre' | 'ocean' | 'miel' | 'prune' | 'lavande' | 'sauge' | 'brume'

type Hue = [hue: number, chroma: number]
interface Palette {
  label: string
  primary: Hue
  secondary: Hue
  accent: Hue
}

export const PALETTES: Record<PaletteKey, Palette> = {
  terracotta: {
    label: 'Terracotta',
    primary: [38, 0.08],
    secondary: [150, 0.05],
    accent: [80, 0.1],
  },
  rosePoudre: {
    label: 'Rose poudré',
    primary: [10, 0.1],
    secondary: [350, 0.05],
    accent: [60, 0.1],
  },
  ocean: { label: 'Océan', primary: [225, 0.09], secondary: [180, 0.06], accent: [50, 0.1] },
  miel: { label: 'Miel', primary: [78, 0.12], secondary: [140, 0.05], accent: [25, 0.1] },
  prune: { label: 'Prune', primary: [335, 0.09], secondary: [285, 0.05], accent: [75, 0.1] },
  lavande: { label: 'Lavande', primary: [292, 0.1], secondary: [205, 0.06], accent: [30, 0.1] },
  sauge: { label: 'Sauge', primary: [165, 0.07], secondary: [235, 0.06], accent: [55, 0.1] },
  brume: { label: 'Brume', primary: [255, 0.08], secondary: [185, 0.06], accent: [10, 0.09] },
}

export const DEFAULT_PALETTE: PaletteKey = 'terracotta'

export const isPaletteKey = (v: unknown): v is PaletteKey => typeof v === 'string' && v in PALETTES

// [step, lightness, chroma factor]
const STEPS: [number, number, number][] = [
  [50, 0.97, 0.25],
  [100, 0.94, 0.4],
  [200, 0.88, 0.6],
  [300, 0.8, 0.8],
  [400, 0.7, 1],
  [500, 0.6, 1],
  [600, 0.5, 1],
  [700, 0.42, 0.95],
  [800, 0.34, 0.85],
  [900, 0.26, 0.75],
]

const mix = (v: string, pct: number) => `color-mix(in srgb, var(${v}) ${pct}%, transparent)`

/** Page background decoration under the header ("dégradé" in the original design). */
const PAGE_DECOR = `linear-gradient(180deg, ${mix('--primary-400', 16)} 0, ${mix('--secondary-400', 6)} 160px, transparent 300px)`

const STYLE_ID = 'rlb-palette'

/** Overrides the brand scales and tints the sidebar for the chosen palette. */
export function applyPalette(key: PaletteKey): void {
  const pal = PALETTES[key]
  const root = document.documentElement.style
  for (const fam of ['primary', 'secondary', 'accent'] as const) {
    for (const [step, l, k] of STEPS) {
      root.setProperty(
        `--${fam}-${step}`,
        `oklch(${l} ${(pal[fam][1] * k).toFixed(3)} ${pal[fam][0]})`,
      )
    }
  }
  let tag = document.getElementById(STYLE_ID)
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_ID
    document.head.appendChild(tag)
  }
  const [h, c] = pal.primary
  tag.textContent =
    `:root { --page-decor: ${PAGE_DECOR}; --sidebar-bg: oklch(0.27 ${(c * 0.45).toFixed(3)} ${h}); }` +
    `:root.dark { --sidebar-bg: oklch(0.21 ${(c * 0.35).toFixed(3)} ${h}); }`
}
