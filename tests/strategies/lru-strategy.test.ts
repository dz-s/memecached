import { describe, it, expect, beforeEach } from 'vitest'
import { LRUStrategy } from '../../src/strategies/lru-strategy'

describe('LRUStrategy', () => {
  let cache: LRUStrategy<string>

  beforeEach(() => {
    cache = new LRUStrategy<string>(3)
  })

  const createBuffer = (...bytes: number[]) => new Uint8Array(bytes)

  describe('constructor', () => {
    it('should create cache with valid capacity', () => {
      const cache = new LRUStrategy<string>(5)
      expect(cache.size).toBe(0)
    })

    it('should throw error for zero capacity', () => {
      expect(() => new LRUStrategy<string>(0)).toThrow('Capacity must be positive')
    })

    it('should throw error for negative capacity', () => {
      expect(() => new LRUStrategy<string>(-1)).toThrow('Capacity must be positive')
    })
  })

  describe('basic operations', () => {
    it('should return undefined for non-existent key', () => {
      expect(cache.get('key1')).toBeUndefined()
    })

    it('should set and get single value', () => {
      const value = createBuffer(1, 2, 3)
      cache.set('key1', value)
      
      const retrieved = cache.get('key1')
      expect(retrieved).toEqual(value)
      expect(cache.size).toBe(1)
    })

    it('should return separate instances of Uint8Array', () => {
      const value = createBuffer(1, 2, 3)
      cache.set('key1', value)
      
      const retrieved = cache.get('key1')
      expect(retrieved).not.toBe(value) // Different references
      expect(retrieved).toEqual(value) // Same content
    })

    it('should update existing key', () => {
      const value1 = createBuffer(1, 2, 3)
      const value2 = createBuffer(4, 5, 6)
      
      cache.set('key1', value1)
      cache.set('key1', value2)
      
      expect(cache.get('key1')).toEqual(value2)
      expect(cache.size).toBe(1)
    })

    it('should handle has operation', () => {
      expect(cache.has('key1')).toBe(false)
      
      cache.set('key1', createBuffer(1, 2, 3))
      expect(cache.has('key1')).toBe(true)
    })

    it('should delete existing key', () => {
      cache.set('key1', createBuffer(1, 2, 3))
      
      expect(cache.delete('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
      expect(cache.size).toBe(0)
    })

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false)
    })

    it('should clear all entries', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      cache.clear()
      
      expect(cache.size).toBe(0)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
      expect(cache.has('key3')).toBe(false)
    })
  })

  describe('LRU eviction behavior', () => {
    it('should evict least recently used item when at capacity', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      // Cache is now at capacity (3)
      cache.set('key4', createBuffer(4))
      
      // key1 should be evicted (least recently used)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
      expect(cache.size).toBe(3)
    })

    it('should update access order on get', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      // Access key1 to make it most recently used
      cache.get('key1')
      
      // Add key4, key2 should be evicted (now least recently used)
      cache.set('key4', createBuffer(4))
      
      expect(cache.has('key1')).toBe(true) // Still present (recently accessed)
      expect(cache.has('key2')).toBe(false) // Evicted
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
    })

    it('should update access order on set for existing key', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      // Update key1 to make it most recently used
      cache.set('key1', createBuffer(10))
      
      // Add key4, key2 should be evicted
      cache.set('key4', createBuffer(4))
      
      expect(cache.has('key1')).toBe(true) // Still present (recently updated)
      expect(cache.has('key2')).toBe(false) // Evicted
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
    })

    it('should handle multiple evictions correctly', () => {
      const smallCache = new LRUStrategy<string>(2)
      
      smallCache.set('key1', createBuffer(1))
      smallCache.set('key2', createBuffer(2))
      smallCache.set('key3', createBuffer(3)) // key1 evicted
      smallCache.set('key4', createBuffer(4)) // key2 evicted
      
      expect(smallCache.has('key1')).toBe(false)
      expect(smallCache.has('key2')).toBe(false)
      expect(smallCache.has('key3')).toBe(true)
      expect(smallCache.has('key4')).toBe(true)
      expect(smallCache.size).toBe(2)
    })
  })

  describe('complex access patterns', () => {
    it('should handle mixed get and set operations', () => {
      cache.set('a', createBuffer(1))
      cache.set('b', createBuffer(2))
      cache.set('c', createBuffer(3))
      
      // Access pattern: c -> a -> b
      cache.get('c')
      cache.get('a')
      cache.get('b')
      
      // Add new item, 'c' was accessed first so should be least recently used
      // But wait, we accessed them in order c, a, b, so c is actually most recent
      // Let me reconsider: after the gets, the order is b (most recent), a, c (least recent)
      cache.set('d', createBuffer(4))
      
      expect(cache.has('c')).toBe(false) // Should be evicted
      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('d')).toBe(true)
    })

    it('should maintain correct order with interleaved operations', () => {
      cache.set('x', createBuffer(1))
      cache.set('y', createBuffer(2))
      
      cache.get('x') // x becomes most recent
      cache.set('z', createBuffer(3))
      
      // Order should be: z (most recent), x, y (least recent)
      cache.set('w', createBuffer(4)) // y should be evicted
      
      expect(cache.has('x')).toBe(true)
      expect(cache.has('y')).toBe(false)
      expect(cache.has('z')).toBe(true)
      expect(cache.has('w')).toBe(true)
    })

    it('should handle updating same key multiple times', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      // Update key1 multiple times
      cache.set('key1', createBuffer(10))
      cache.set('key1', createBuffer(11))
      
      // Add new key
      cache.set('key4', createBuffer(4))
      
      // key2 should be evicted (least recently used)
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
      expect(cache.get('key1')).toEqual(createBuffer(11))
    })
  })

  describe('edge cases', () => {
    it('should handle single capacity cache', () => {
      const singleCache = new LRUStrategy<string>(1)
      
      singleCache.set('key1', createBuffer(1))
      expect(singleCache.get('key1')).toEqual(createBuffer(1))
      
      singleCache.set('key2', createBuffer(2))
      expect(singleCache.has('key1')).toBe(false)
      expect(singleCache.get('key2')).toEqual(createBuffer(2))
      expect(singleCache.size).toBe(1)
    })

    it('should handle empty buffer', () => {
      const emptyBuffer = new Uint8Array(0)
      cache.set('empty', emptyBuffer)
      
      expect(cache.get('empty')).toEqual(emptyBuffer)
      expect(cache.has('empty')).toBe(true)
    })

    it('should handle deletion from full cache', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      cache.delete('key2')
      expect(cache.size).toBe(2)
      
      // Should be able to add without eviction now
      cache.set('key4', createBuffer(4))
      expect(cache.size).toBe(3)
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
    })

    it('should handle clear on full cache', () => {
      cache.set('key1', createBuffer(1))
      cache.set('key2', createBuffer(2))
      cache.set('key3', createBuffer(3))
      
      cache.clear()
      
      // Should be able to fill up again
      cache.set('a', createBuffer(1))
      cache.set('b', createBuffer(2))
      cache.set('c', createBuffer(3))
      
      expect(cache.size).toBe(3)
      expect(cache.has('a')).toBe(true)
      expect(cache.has('b')).toBe(true)
      expect(cache.has('c')).toBe(true)
    })
  })

  describe('data integrity', () => {
    it('should store different data types correctly', () => {
      const buffer1 = createBuffer(255, 0, 128)
      const buffer2 = createBuffer(1, 2, 3, 4, 5)
      const buffer3 = createBuffer()
      
      cache.set('max', buffer1)
      cache.set('sequence', buffer2)
      cache.set('empty', buffer3)
      
      expect(cache.get('max')).toEqual(buffer1)
      expect(cache.get('sequence')).toEqual(buffer2)
      expect(cache.get('empty')).toEqual(buffer3)
    })

    it('should maintain data after multiple operations', () => {
      const originalData = createBuffer(42, 24, 12)
      cache.set('persistent', originalData)
      
      // Fill cache
      cache.set('temp1', createBuffer(1))
      cache.set('temp2', createBuffer(2))
      
      // Access persistent to keep it alive
      cache.get('persistent')
      
      // Trigger eviction
      cache.set('temp3', createBuffer(3))
      
      // Should still have original data
      expect(cache.get('persistent')).toEqual(originalData)
    })
  })
})
