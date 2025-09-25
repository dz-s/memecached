export interface DoublyLinkedNode<K, V> {
  key: K
  item: V
  prev: DoublyLinkedNode<K, V> | null
  next: DoublyLinkedNode<K, V> | null
}

export interface CacheEntry<T>{
    value: T
    expiresAt: number | null
}

export interface CacheStrategy<T> {
  get(key: T): string | null,
  set(key: T, value: any, ttl: number): boolean,
  delete(key: T): boolean,
  clear(): void,
  has(key: T): boolean,
  keys(): T[],
  readonly size: number
}

export interface CleanupProcedure {
    startCleanupTimer(): void
    cleanUp(): void
}

export interface CacheStats {
    size: number,
    maxSize: number,
    hits: number,
    misses: number,
    sets: number,
    deletes: number,
    evictions: number,
    hitRate: number
}

export enum EvictionPolicy {
  LRU = 'LRU'
}


export interface CommandResult {
  readonly type?: string,
  readonly success: boolean
  readonly data: string | null
  readonly error?: string
}

export type Command = 
  | { type: 'SET'; key: string; value: string; ttl: number }
  | { type: 'GET'; key: string }
  | { type: 'DELETE'; key: string }
  | { type: 'EXISTS'; key: string }
  | { type: 'FLUSH' }
  | { type: 'KEYS' }
  | { type: 'PING' }
  | { type: 'QUIT' }
  | { type: 'NOT_SUPPORTED'}

