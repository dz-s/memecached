export interface DoublyLinkedNode<K, V> {
  key: K
  value: V
  prev: DoublyLinkedNode<K, V> | null
  next: DoublyLinkedNode<K, V> | null
}

export interface CacheStrategy<K> {
  get(key: K): Uint8Array | undefined
  set(key: K, value: Uint8Array): void
  delete(key: K): boolean
  clear(): void
  has(key: K): boolean
  readonly size: number
}

export enum EvictionPolicy {
  LRU = 'LRU'
}
