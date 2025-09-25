import { CacheStrategy, EvictionPolicy } from './types'
import { LRUStrategy } from './strategies/lru-strategy'
import logger from './logger'
import { CacheConfig } from './config'

export function createCache(policy: EvictionPolicy | string, config: CacheConfig): CacheStrategy<string> {
  switch (policy) {
    case EvictionPolicy.LRU:
      return new LRUStrategy<string>(config)
    default:
      logger.warn(`Unknown eviction policy: ${policy}. Falling back to LRU`)
      return new LRUStrategy<string>(config)
  }
}
