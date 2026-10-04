/// <reference types="vite/client" />
import type { RlbApi } from '@shared/types'

declare global {
  interface Window {
    rlb: RlbApi
  }
}
