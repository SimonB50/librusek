interface Pending<V> {
  resolve: (value: V | null) => void;
  reject: (reason: unknown) => void;
}

interface BatcherOptions {
  /** How long (ms) to collect keys before firing a request. */
  delay?: number;
  /** Max keys in a single request - keeps URLs short. */
  maxBatchSize?: number;
}

/**
 * Collects `load(key)` calls made within `delay` ms and resolves them with a single
 * `fetchMany(keys)` call (DataLoader pattern).
 *
 * This is what lets deeply nested components (e.g. every `<Grade>` asking for its own
 * category and teacher) stay independent while still producing one request per resource.
 */
const createBatcher = <K, V>(
  fetchMany: (keys: K[]) => Promise<Map<K, V>>,
  {delay = 10, maxBatchSize = 50}: BatcherOptions = {},
) => {
  let pending = new Map<K, Pending<V>[]>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const run = async (keys: K[], callbacks: Map<K, Pending<V>[]>) => {
    try {
      const result = await fetchMany(keys);
      for (const key of keys)
        for (const cb of callbacks.get(key) ?? []) cb.resolve(result.get(key) ?? null);
    } catch (error) {
      for (const key of keys)
        for (const cb of callbacks.get(key) ?? []) cb.reject(error);
    }
  };

  const flush = () => {
    const batch = pending;
    pending = new Map();
    timer = undefined;
    const keys = [...batch.keys()];
    for (let i = 0; i < keys.length; i += maxBatchSize)
      void run(keys.slice(i, i + maxBatchSize), batch);
  };

  return {
    /** Resolves with the value, or `null` when the remote does not return given key. */
    load: (key: K) => new Promise<V | null>((resolve, reject) => {
      const callbacks = pending.get(key) ?? [];
      callbacks.push({resolve, reject});
      pending.set(key, callbacks);
      if (timer === undefined) timer = setTimeout(flush, delay);
    }),
  };
};

export {createBatcher};
