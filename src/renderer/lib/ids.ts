let uid = 100

/** Keeps generated ids ('t101', 'p102'…) unique across restarts. */
export function seedIds(existing: string[]): void {
  existing.forEach((id) => {
    const m = /^[tp](\d+)$/.exec(id)
    if (m) uid = Math.max(uid, Number(m[1]))
  })
}

export function nextId(prefix: 't' | 'p'): string {
  uid += 1
  return prefix + uid
}
