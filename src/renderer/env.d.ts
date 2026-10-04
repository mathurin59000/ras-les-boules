/// <reference types="vite/client" />
import type { RlbApi } from '@shared/types'

declare global {
  const __APP_VERSION__: string
  interface Window {
    rlb: RlbApi
  }
}
