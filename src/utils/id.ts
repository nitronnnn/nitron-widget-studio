let counter = 0;

/** Короткий уникальный id без внешних зависимостей. */
export function uid(prefix = 'n'): string {
  counter = (counter + 1) % 46656; // 36^3
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36).padStart(3, '0')}${rnd}`;
}
