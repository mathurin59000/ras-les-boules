// Kept free of React/store imports so the store can use it without a cycle.
export const MATCH_CARD_LABELS = {
  duel: 'Duel',
  lignes: 'Lignes',
  compacte: 'Compacte',
  ticket: 'Ticket',
}

export type MatchCardVariant = keyof typeof MATCH_CARD_LABELS

export const DEFAULT_MATCH_CARD: MatchCardVariant = 'compacte'

export const isMatchCardVariant = (v: unknown): v is MatchCardVariant =>
  typeof v === 'string' && v in MATCH_CARD_LABELS
