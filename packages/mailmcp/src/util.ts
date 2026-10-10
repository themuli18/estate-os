// Run fn over items with bounded concurrency, preserving order.
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return out;
}

export function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: { message?: string } | string } }; message?: string };
  const data = e?.response?.data?.error;
  if (typeof data === 'object' && data?.message) return data.message;
  if (typeof data === 'string') return data;
  return e?.message ?? String(err);
}

// Drop null/undefined/empty-array fields to keep tool output compact.
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || (Array.isArray(v) && v.length === 0) || v === '') continue;
    out[k] = v;
  }
  return out as Partial<T>;
}
