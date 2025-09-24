import { DoublyLinkedNode, CacheStrategy } from '../types'
import { DoublyLinkedList } from '../data-structures/doubly-linked-list'

export class LRUStrategy<K> implements CacheStrategy<K> {
  private readonly capacity: number
  private readonly cache = new Map<K, DoublyLinkedNode<K, Uint8Array>>()
  private readonly list = new DoublyLinkedList<K, Uint8Array>()
  
  constructor(capacity: number) {
    if (capacity <= 0) throw new Error('Capacity must be positive')
    this.capacity = capacity
  }
  
  get(key: K): Uint8Array | undefined {
    const node = this.cache.get(key)
    if (!node) return undefined
    
    this.list.moveToFirst(node)
    return new Uint8Array(node.value)
  }
  
  set(key: K, value: Uint8Array): void {
    const existingNode = this.cache.get(key)
    
    if (existingNode) {
      existingNode.value = new Uint8Array(value)
      this.list.moveToFirst(existingNode)
      return
    }
    
    if (this.cache.size >= this.capacity) {
      const removed = this.list.removeLast()
      if (removed) {
        this.cache.delete(removed.key)
      }
    }
    
    const newNode: DoublyLinkedNode<K, Uint8Array> = {
      key,
      value: new Uint8Array(value),
      prev: null,
      next: null
    }
    
    this.list.addFirst(newNode)
    this.cache.set(key, newNode)
  }
  
  delete(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) return false
    
    this.list.remove(node)
    this.cache.delete(key)
    return true
  }
  
  clear(): void {
    this.cache.clear()
    this.list['head'] = this.list['tail'] = null
  }
  
  get size(): number {
    return this.cache.size
  }
  
  has(key: K): boolean {
    return this.cache.has(key)
  }
}
