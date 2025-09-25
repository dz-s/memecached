import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LRUStrategy } from '../../src/strategies/lru-strategy'
import { getConfig } from '../../src/config'

describe('LRUStrategy', () => {
    let cache: LRUStrategy<string>

    beforeEach(() => {
        vi.useFakeTimers()
        cache = new LRUStrategy<string>({
            ...getConfig(),
            capacity: 3,
            cleanupInterval: 0
        })
    })

    afterEach(() => {
        cache.destroy?.()
        vi.useRealTimers()
    })

    describe('constructor', () => {
        it('should create cache with valid capacity', () => {
            const c = new LRUStrategy<string>({
                ...getConfig(),
                capacity: 3,
                cleanupInterval: 0
            })
            expect(c.size).toBe(0)
        })

        it('should throw error for zero capacity', () => {
            expect(() => new LRUStrategy<string>({ ...getConfig(), capacity: 0, cleanupInterval: 0 })).toThrow('Capacity must be positive')
        })

        it('should throw error for negative capacity', () => {
            expect(() => new LRUStrategy<string>({ ...getConfig(), capacity: -1, cleanupInterval: 0 })).toThrow('Capacity must be positive')
        })
    })

    describe('basic operations', () => {
        it('should return null for non existent key', () => {
            expect(cache.get('k1')).toBeNull()
        })

        it('should set and get single value', () => {
            cache.set('k1', 'v1', 0)
            expect(cache.get('k1')).toBe('v1')
            expect(cache.size).toBe(1)
        })

        it('should update existing key', () => {
            cache.set('k1', 'a', 0)
            cache.set('k1', 'b', 0)
            expect(cache.get('k1')).toBe('b')
            expect(cache.size).toBe(1)
        })

        it('should check existence with has', () => {
            expect(cache.has('k1')).toBe(false)
            cache.set('k1', 'x', 0)
            expect(cache.has('k1')).toBe(true)
        })

        it('should delete existing key', () => {
            cache.set('k1', 'a', 0)
            expect(cache.delete('k1')).toBe(true)
            expect(cache.has('k1')).toBe(false)
            expect(cache.size).toBe(0)
        })

        it('should return false when deleting non existent key', () => {
            expect(cache.delete('none')).toBe(false)
        })

        it('should clear all entries', () => {
            cache.set('k1', '1')
            cache.set('k2', '2')
            cache.set('k3', '3')
            cache.clear()
            expect(cache.size).toBe(0)
            expect(cache.has('k1')).toBe(false)
            expect(cache.has('k2')).toBe(false)
            expect(cache.has('k3')).toBe(false)
        })
    })

    describe('LRU eviction', () => {
        it('should evict least recently used item when at capacity', () => {
            cache.set('k1', '1', 0)
            cache.set('k2', '2', 0)
            cache.set('k3', '3', 0)
            cache.set('k4', '4', 0)
            expect(cache.has('k1')).toBe(false)
            expect(cache.has('k2')).toBe(true)
            expect(cache.has('k3')).toBe(true)
            expect(cache.has('k4')).toBe(true)
            expect(cache.size).toBe(3)
        })

        it('should update access order on get', () => {
            cache.set('k1', '1', 0)
            cache.set('k2', '2', 0)
            cache.set('k3', '3', 0)
            cache.get('k1')
            cache.set('k4', '4', 0)
            expect(cache.has('k1')).toBe(true)
            expect(cache.has('k2')).toBe(false)
            expect(cache.has('k3')).toBe(true)
            expect(cache.has('k4')).toBe(true)
        })

        it('should update access order on set for existing key', () => {
            cache.set('k1', '1', 0)
            cache.set('k2', '2', 0)
            cache.set('k3', '3', 0)
            cache.set('k1', '10', 0)
            cache.set('k4', '4', 0)
            expect(cache.has('k1')).toBe(true)
            expect(cache.has('k2')).toBe(false)
            expect(cache.has('k3')).toBe(true)
            expect(cache.has('k4')).toBe(true)
            expect(cache.get('k1')).toBe('10')
        })
    })

    describe('expiration', () => {
        it('should expire a key after provided ttl', () => {
            cache.set('k1', 'v1', 500)
            expect(cache.get('k1')).toBe('v1')
            vi.advanceTimersByTime(600)
            expect(cache.get('k1')).toBeNull()
        })

        it('should not expire when ttl is zero', () => {
            cache.set('k1', 'v1', 0)
            vi.advanceTimersByTime(5000)
            expect(cache.get('k1')).toBe('v1')
        })

        it('should remove expired keys on manual cleanup', () => {
            cache.set('k1', 'v1', 200)
            cache.set('k2', 'v2', 1000)
            vi.advanceTimersByTime(300)
            cache.cleanUp()
            expect(cache.has('k1')).toBe(false)
            expect(cache.has('k2')).toBe(true)
        })
    })

    describe('cleanup timer', () => {
        it('should clean expired keys periodically', () => {
            const timedCache = new LRUStrategy<string>({
                ...getConfig(),
                capacity: 2,
                cleanupInterval: 100
            })
            timedCache.set('a', '1', 200)
            timedCache.set('b', '2', 450)
            expect(timedCache.size).toBe(2)
            vi.advanceTimersByTime(500)
            vi.runOnlyPendingTimers()
            expect(timedCache.size).toBe(0)
            timedCache.destroy()
        })

        it('should stop cleanup after destroy', () => {
            const timedCache = new LRUStrategy<string>({
                ...getConfig(),
                capacity: 2,
                cleanupInterval: 100
            })
            const spy = vi.spyOn(timedCache, 'cleanUp')
            timedCache.set('a', '1', 200)
            timedCache.destroy()
            vi.advanceTimersByTime(500)
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('edge cases', () => {
        it('should handle single capacity cache', () => {
            const singleCache = new LRUStrategy<string>({
                ...getConfig(),
                capacity: 1,
                cleanupInterval: -1
            })
            singleCache.set('k1', 'v1', 0)
            expect(singleCache.get('k1')).toBe('v1')
            singleCache.set('k2', 'v2', 0)
            expect(singleCache.has('k1')).toBe(false)
            expect(singleCache.get('k2')).toBe('v2')
            expect(singleCache.size).toBe(1)
        })

        it('should handle clear on full cache', () => {
            cache.set('k1', '1', 0)
            cache.set('k2', '2', 0)
            cache.set('k3', '3', 0)
            cache.clear()
            cache.set('a', '1', 0)
            cache.set('b', '2', 0)
            cache.set('c', '3', 0)
            expect(cache.size).toBe(3)
            expect(cache.has('a')).toBe(true)
            expect(cache.has('b')).toBe(true)
            expect(cache.has('c')).toBe(true)
        })
    })
})
