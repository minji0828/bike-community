import * as Crypto from 'expo-crypto';

export async function createUuidV4(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);

  // Per RFC 4122, set version to 4 and variant to 10.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}
