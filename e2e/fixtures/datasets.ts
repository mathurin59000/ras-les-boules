export interface Dataset {
  name: string
  /** [first name, last name, rating] */
  players: [string, string, number][]
  rounds: number
  handicap: boolean
  /** exemptions expected over the whole tournament */
  byes: number
  /** rematches tolerated by the asynchronous pairing (same bounds as tournament-sim.test.ts) */
  maxRematches: number
}

const names = [
  ['Léa', 'Martin'],
  ['Hugo', 'Bernard'],
  ['Sam', 'Durand'],
  ['Inès', 'Robert'],
  ['Tom', 'Petit'],
  ['Clara', 'Vidal'],
  ['Noé', 'Faure'],
  ['Zoé', 'Roux'],
]

const roster = (n: number, step: number): Dataset['players'] =>
  names.slice(0, n).map(([f, l], i) => [f, l, 1900 - i * step])

export const DATASETS: Dataset[] = [
  {
    name: '6 joueurs / 3 tours',
    players: roster(6, 120),
    rounds: 3,
    handicap: false,
    byes: 0,
    maxRematches: 2,
  },
  {
    name: '7 joueurs / 3 tours (exemptions)',
    players: roster(7, 90),
    rounds: 3,
    handicap: false,
    byes: 3,
    maxRematches: 2,
  },
  {
    name: '8 joueurs / 4 tours + handicap',
    players: roster(8, 150),
    rounds: 4,
    handicap: true,
    byes: 0,
    maxRematches: 0,
  },
]
