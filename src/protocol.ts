import logger from './logger'
import type { Command, CommandResult } from './types'
import { CacheStrategy } from './types'

export class Protocol {
    constructor(private readonly cache: CacheStrategy<string>) { }

    parse(input: string): Command<string> | null {
        const trimmed = input.trim()
        if (!trimmed) return null

        const [command, ...args] = trimmed.split(/\s+/)
        const cmd = command.toUpperCase()

        switch (cmd) {
            case 'SET': {
                const args = input.trim().split(' ');
                if (args.length < 3) {
                    console.error('SET command requires a key and a value');
                    return null;
                }

                const [, key, value, ttlArg] = args;
                let ttl = 0;

                if (ttlArg !== undefined) {
                    const parsed = Number(ttlArg);
                    if (!Number.isInteger(parsed)) {
                        logger.error(`TTL value "${ttlArg}" is invalid`);
                        return null;
                    }
                    if (parsed >= 0) {
                        ttl = parsed;
                    } else {
                        logger.warn(`TTL value "${ttlArg}" is negative and will be ignored`);
                    }
                }
                return {
                    type: 'SET',
                    key,
                    value,
                    ttl
                };
            }

            case 'GET':
                return args.length === 1 ? { type: 'GET', key: args[0]! } : null

            case 'DEL':
            case 'DELETE':
                return args.length === 1 ? { type: 'DELETE', key: args[0]! } : null

            case 'EXISTS':
                return args.length === 1 ? { type: 'EXISTS', key: args[0]! } : null

            case 'FLUSH':
                return { type: 'FLUSH' }

            case 'KEYS':
                return { type: 'KEYS' }

            case 'STATS':
                return { type: 'STATS' }

            case 'PING':
                return { type: 'PING' }

            case 'QUIT':
                return { type: 'QUIT' }

            default:
                return null
        }
    }

    execute(command: Command<string> | null): CommandResult {

        if (!command) {
            return { success: false, data: null, error: 'Failed to parse command' }
        }
        try {
            switch (command.type) {
                case 'SET': {
                    const success = this.cache.set(command.key, command.value, command.ttl)
                    return {
                        success,
                        data: success ? 'STORED' : 'NOT_STORED',
                        error: success ? undefined : 'Failed to store (possibly too large)',
                    }
                }

                case 'GET': {
                    const value = this.cache.get(command.key)
                    return { success: true, data: value }
                }

                case 'DELETE': {
                    const deleted = this.cache.delete(command.key)
                    return { success: true, data: deleted ? 'DELETED' : 'NOT_FOUND' }
                }

                case 'EXISTS': {
                    const exists = this.cache.has(command.key)
                    return { success: true, data: exists ? 1 : 0 }
                }

                case 'FLUSH':
                    //TBD (snapshot before clear)
                    return { success: true, data: 'OK' }

                case 'KEYS': {
                    const keys = this.cache.keys()
                    return { success: true, data: keys }
                }

                case 'STATS': {
                    //TBD this.cache.getStats()
                    return { success: true, data: null }
                }

                case 'QUIT':
                    return { success: true, data: 'QUIT' }

                default:
                    return { success: false, data: 'ERROR' }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }
        }
    }

    format(result: CommandResult): string {
        if (!result.success) {
            return `ERROR ${result.error}\r\n`
        }

        if (result.data === 'QUIT') {
            return 'BYE\r\n'
        }

        if (result.data === null) {
            return 'NOT_FOUND\r\n'
        }

        if (typeof result.data === 'object') {
            return `VALUE ${JSON.stringify(result.data)}\r\n`
        }

        return `VALUE ${String(result.data)}\r\n`
    }
}