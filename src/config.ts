import { EvictionPolicy } from "./types"

export interface CacheConfig {
  readonly maxMemory: number
  readonly port: number
  readonly host: string
  readonly cleanupInterval: number
  readonly evictionPolicy: EvictionPolicy | string
  readonly capacity: number // number of keys
}

const DEFAULT_CONFIG = {
  maxMemory: 64 * 1024 * 1024, // 64MB
  port: 3000, 
  host: '127.0.0.1',
  cleanupInterval: 60000, // 60 seconds
  evictionPolicy: EvictionPolicy.LRU,
  capacity: 10000
} as const satisfies CacheConfig

export const getConfig = (): CacheConfig => ({
  maxMemory: Number(process.env.CACHE_MAX_MEMORY) || DEFAULT_CONFIG.maxMemory,
  port: Number(process.env.CACHE_PORT) || DEFAULT_CONFIG.port,
  host: process.env.CACHE_HOST || DEFAULT_CONFIG.host,
  cleanupInterval: Number(process.env.CACHE_CLEANUP_INTERVAL) || DEFAULT_CONFIG.cleanupInterval,
  evictionPolicy: process.env.EVICTION_POLICY || DEFAULT_CONFIG.evictionPolicy,
  capacity: Number(process.env.CAPACITY) || DEFAULT_CONFIG.capacity
})

export const validateConfig = (config: CacheConfig): void => {
  const errors: string[] = []
  
  if (config.maxMemory <= 0) {
    errors.push('maxMemory must be greater than 0')
  }
  
  if (config.port <= 0 || config.port > 65535) {
    errors.push('port must be between 1 and 65535')
  }
  
  if (config.cleanupInterval <= 0) {
    errors.push('cleanupInterval must be greater than 0')
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(', ')}`)
  }
}