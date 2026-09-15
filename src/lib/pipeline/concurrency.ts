/** Runs `fn` over `items` with at most `limit` in flight at once. Each
 * scene render spawns its own headless Chromium + ffmpeg process — running
 * all of them at once (plain Promise.all) is fine on a beefy dev machine
 * but can pin a small VPS hard enough to make even SSH unresponsive. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
