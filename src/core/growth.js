// Home-garden growth between sessions: each plant grows at most one stage per calendar day.
// If the device clock moves backwards nothing happens: no cheating, and nothing ever wilts.
export const MAX_STAGE = 4; // 0 seed · 1 sprout · 2 leafy · 3 bud · 4 bloom

export function dayNumber(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function plantSeed(garden, species, today, extra = {}) {
  const p = { id: (garden.nextId = (garden.nextId || 0) + 1), species, stage: 0, lastGrownDay: today, ...extra };
  garden.plants.push(p);
  return p;
}

/** Grows every plant that has not grown today. Returns the plants that grew. */
export function growOvernight(garden, today) {
  const grown = [];
  for (const p of garden.plants) {
    if (p.stage >= MAX_STAGE) continue;
    if (today > p.lastGrownDay) {
      p.stage++;
      p.lastGrownDay = today;
      grown.push(p);
    }
  }
  return grown;
}
