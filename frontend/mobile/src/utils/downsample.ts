export function downsample<T>(items: T[], maxItems: number) {
  if (maxItems <= 0) return [];
  if (items.length <= maxItems) return items;
  const stride = Math.ceil(items.length / maxItems);
  const out: T[] = [];
  for (let i = 0; i < items.length; i += stride) {
    out.push(items[i]);
  }
  if (out[out.length - 1] !== items[items.length - 1]) {
    out.push(items[items.length - 1]);
  }
  return out;
}
