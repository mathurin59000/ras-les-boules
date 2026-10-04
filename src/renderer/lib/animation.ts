import type { CSSProperties } from 'react'

/** Staggers an `animate-card-in` element: style={appearAfter(240)} */
export const appearAfter = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })
