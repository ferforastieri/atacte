import { getRandomValues } from 'expo-crypto';

// Rejection sampling avoids bias when the alphabet size does not divide 2^32.
export function secureRandomInt(max: number): number {
  if (!Number.isSafeInteger(max) || max < 1 || max > 0x100000000) throw new Error('Intervalo inválido');
  const limit = Math.floor(0x100000000 / max) * max;
  const value = new Uint32Array(1);
  do { getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
