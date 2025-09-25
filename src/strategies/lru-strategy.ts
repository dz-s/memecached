import { DoublyLinkedNode, CacheStrategy, CacheEntry, CleanupProcedure } from '../types'
import { DoublyLinkedList } from '../data-structures/doubly-linked-list'
import { CacheConfig } from '../config'

import logger from '../logger'


export class LRUStrategy<K> implements CacheStrategy<K>, CleanupProcedure {
    private readonly capacity: number
    private readonly cleanupInterval: number
    private readonly cache = new Map<K, DoublyLinkedNode<K, CacheEntry<string>>>()
    private readonly list = new DoublyLinkedList<K, CacheEntry<string>>()

    private cleanupTimer: NodeJS.Timeout | undefined


    constructor(config: CacheConfig) {
        if (!config.capacity || config.capacity <= 0) throw new Error('Capacity must be positive')
        this.capacity = config.capacity
        this.cleanupInterval = config.cleanupInterval

        if (this.cleanupInterval > 0) {
            this.startCleanupTimer();
        }
    }


    get(key: K): string | null {
        const node = this.cache.get(key)
        if (!node) return null

        const now = Date.now()
        if (node.item.expiresAt !== null && node.item.expiresAt <= now) {
            this.cache.delete(key)
            this.list.remove(node)
            return null
        }

        this.list.moveToFirst(node)
        return node.item.value
    }


    set(key: K, value: string, ttl: number = 0): boolean {

        try {

            const now = Date.now();
            const expiresAt = ttl > 0 ? now + ttl : null

            const item = {
                value,
                expiresAt
            }

            const existingNode = this.cache.get(key)


            if (existingNode) {
                existingNode.item = item
                this.list.moveToFirst(existingNode)
                return true
            }

            const newNode: DoublyLinkedNode<K, CacheEntry<string>> = {
                key,
                item,
                prev: null,
                next: null
            }

            if (this.cache.size >= this.capacity) {
                const removed = this.list.removeLast()
                if (removed) {
                    this.cache.delete(removed.key)
                    //TBD: eviction metric++
                }
            }

            this.list.addFirst(newNode)
            this.cache.set(key, newNode)

            return true

        } catch (error) {
            logger.error(error instanceof Error ? error.stack || error.message : String(error))
            return false
        }

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

    keys(): K[] {
        return Array.from(this.cache.keys())
    }

    startCleanupTimer(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanUp();
        }, this.cleanupInterval)
    }

    cleanUp(): void {
        const now = Date.now()
        const expiredKeys: K[] = [];

        for (const [key, node] of this.cache) {
            if (node.item.expiresAt && node.item.expiresAt < now) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            const node = this.cache.get(key)
            if (node) {
                this.cache.delete(key)
                this.list.remove(node)

                //TBD: expires metric
            }
        }
    }

    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer)
            this.cleanupTimer = undefined
        }
        this.clear()
    }

}
