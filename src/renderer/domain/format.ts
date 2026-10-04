const FR_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
]

/** '2025-12-18' → '18 déc. 2025' */
export function frDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${FR_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Splits 'Camille Petit' into first name and upper-cased last name. */
export function splitName(name: string): { first: string; last: string } {
  const [first = '', ...rest] = name.split(' ')
  return { first, last: rest.join(' ').toUpperCase() }
}
