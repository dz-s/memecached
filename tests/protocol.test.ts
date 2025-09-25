import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Protocol } from '../src/protocol'
import type { CacheStrategy, Command, CommandResult } from '../src/types'
import logger from '../src/logger'

vi.mock('../src/logger', () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    }
}))

const mockLogger = vi.mocked(logger)

const createMockCache = (): CacheStrategy<string> => {
    const mockSize = { value: 0 }
    return {
        set: vi.fn().mockReturnValue(true),
        get: vi.fn().mockReturnValue('cached_value'),
        delete: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
        has: vi.fn().mockReturnValue(true),
        keys: vi.fn().mockReturnValue(['key1', 'key2']),
        get size() { return mockSize.value }
    }
}

describe('Protocol', () => {
    let protocol: Protocol
    let mockCache: CacheStrategy<string>

    beforeEach(() => {
        vi.clearAllMocks()
        mockCache = createMockCache()
        protocol = new Protocol(mockCache)
    })

    describe('parse method', () => {
        describe('SET command', () => {
            it('should parse SET command with TTL', () => {
                const result = protocol.parse('SET key value 300')
                expect(result).toEqual({
                    type: 'SET',
                    key: 'key',
                    value: 'value',
                    ttl: 300
                } satisfies Command)
            })

            it('should parse SET command without TTL', () => {
                const result = protocol.parse('SET key value')
                expect(result).toEqual({
                    type: 'SET',
                    key: 'key',
                    value: 'value',
                    ttl: 0
                } satisfies Command)
            })

            it('should return null for invalid SET command', () => {
                expect(protocol.parse('SET key')).toBeNull()
                expect(protocol.parse('SET')).toBeNull()
            })

            it('should handle negative TTL by ignoring it', () => {
                const result: any = protocol.parse('SET key value -100')
                expect(result?.type).toEqual('SET')
                expect(result?.ttl).toBe(0)
            })

            it('should return null for invalid TTL', () => {
                expect(protocol.parse('SET key value 3.14')).toBeNull()
            })
        })

        describe('Simple commands', () => {
            it('should parse GET command', () => {
                expect(protocol.parse('GET key')).toEqual({
                    type: 'GET',
                    key: 'key'
                } satisfies Command)
                expect(protocol.parse('GET key extra')).toBeNull()
            })

            it('should parse DELETE commands', () => {
                expect(protocol.parse('DELETE key')).toEqual({
                    type: 'DELETE',
                    key: 'key'
                } satisfies Command)
                expect(protocol.parse('DEL key')).toEqual({
                    type: 'DELETE',
                    key: 'key'
                } satisfies Command)
            })

            it('should parse EXISTS command', () => {
                expect(protocol.parse('EXISTS key')).toEqual({
                    type: 'EXISTS',
                    key: 'key'
                } satisfies Command)
            })

            it('should parse parameterless commands', () => {
                expect(protocol.parse('FLUSH')).toEqual({ type: 'FLUSH' } satisfies Command)
                expect(protocol.parse('KEYS')).toEqual({ type: 'KEYS' } satisfies Command)
                expect(protocol.parse('PING')).toEqual({ type: 'PING' } satisfies Command)
                expect(protocol.parse('QUIT')).toEqual({ type: 'QUIT' } satisfies Command)
            })
        })

        describe('Edge cases', () => {
            it('should return null for empty input', () => {
                expect(protocol.parse('')).toBeNull()
                expect(protocol.parse('   ')).toBeNull()
            })

            it('should return null for unknown commands', () => {
                expect(protocol.parse('UNKNOWN')).toBeNull()
            })

            it('should be case insensitive', () => {
                expect(protocol.parse('get key')).toEqual({ type: 'GET', key: 'key' })
                expect(protocol.parse('Set key value')).toEqual({
                    type: 'SET',
                    key: 'key',
                    value: 'value',
                    ttl: 0
                })
            })

            it('should handle extra whitespace', () => {
                expect(protocol.parse('  GET   key  ')).toEqual({ type: 'GET', key: 'key' })
            })
        })
    })

    describe('execute method', () => {
        describe('Main flows', () => {
            it('should execute SET command successfully', () => {
                const command: Command = { type: 'SET', key: 'key', value: 'value', ttl: 300 }
                const result = protocol.execute(command)

                expect(mockCache.set).toHaveBeenCalledWith('key', 'value', 300)
                expect(result).toEqual({
                    success: true,
                    type: 'SET',
                    data: 'STORED'
                } satisfies CommandResult)
            })

            it('should execute GET command', () => {
                const command: Command = { type: 'GET', key: 'key' }
                const result = protocol.execute(command)

                expect(mockCache.get).toHaveBeenCalledWith('key')
                expect(result).toEqual({
                    success: true,
                    type: 'GET',
                    data: 'cached_value',
                } satisfies CommandResult)
            })

            it('should execute DELETE command', () => {
                const command: Command = { type: 'DELETE', key: 'key' }
                const result = protocol.execute(command)

                expect(mockCache.delete).toHaveBeenCalledWith('key')
                expect(result).toEqual({
                    success: true,
                    type: 'DELETE',
                    data: 'DELETED',
                } satisfies CommandResult)
            })

            it('should execute EXISTS command when key exists', () => {
                const command: Command = { type: 'EXISTS', key: 'key' }
                const result = protocol.execute(command)

                expect(mockCache.has).toHaveBeenCalledWith('key')
                expect(result).toEqual({
                    success: true,
                    type: 'EXISTS',
                    data: 'YES',
                } satisfies CommandResult)
            })

            it('should execute KEYS command', () => {
                const command: Command = { type: 'KEYS' }
                const result = protocol.execute(command)

                expect(mockCache.keys).toHaveBeenCalled()
                expect(result).toEqual({
                    success: true,
                    type: 'KEYS',
                    data: 'key1;key2',
                } satisfies CommandResult)
            })

            it('should execute FLUSH command', () => {
                const command: Command = { type: 'FLUSH' }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: true,
                    type: 'FLUSH',
                    data: 'OK',
                } satisfies CommandResult)
            })

            it('should execute QUIT command', () => {
                const command: Command = { type: 'QUIT' }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: true,
                    type: 'QUIT',
                    data: 'BYE',
                } satisfies CommandResult)
            })
        })

        describe('Failure cases', () => {
            it('should handle SET failure', () => {
                vi.mocked(mockCache.set).mockReturnValue(false)
                const command: Command = { type: 'SET', key: 'key', value: 'value', ttl: 0 }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: false,
                    type: 'SET',
                    data: 'NOT_STORED'
                } satisfies CommandResult)
            })

            it('should handle cache not found cases', () => {
                vi.mocked(mockCache.get).mockReturnValue(null)
                vi.mocked(mockCache.delete).mockReturnValue(false)
                vi.mocked(mockCache.has).mockReturnValue(false)

                expect(protocol.execute({ type: 'GET', key: 'missing' })).toEqual({
                    success: false,
                    type: 'GET',
                    data: 'NOT_FOUND',
                } satisfies CommandResult)

                expect(protocol.execute({ type: 'DELETE', key: 'missing' })).toEqual({
                    success: true,
                    type: 'DELETE',
                    data: 'NOT_FOUND',
                } satisfies CommandResult)

                expect(protocol.execute({ type: 'EXISTS', key: 'missing' })).toEqual({
                    success: true,
                    type: 'EXISTS',
                    data: 'NO',
                } satisfies CommandResult)
            })

            it('should handle empty keys array', () => {
                vi.mocked(mockCache.keys).mockReturnValue([])
                const command: Command = { type: 'KEYS' }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: true,
                    type: 'KEYS',
                    data: '',
                } satisfies CommandResult)
            })

            it('should handle null command', () => {
                const result = protocol.execute(null)
                expect(result).toEqual({
                    success: false,
                    data: null,
                    error: 'Failed to parse command'
                } satisfies CommandResult)
            })

            it('should handle cache errors', () => {
                vi.mocked(mockCache.set).mockImplementation(() => {
                    throw new Error('Cache error')
                })

                const command: Command = { type: 'SET', key: 'key', value: 'value', ttl: 0 }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: false,
                    data: null,
                    error: 'Cache error'
                } satisfies CommandResult)
            })

            it('should handle non-Error exceptions', () => {
                vi.mocked(mockCache.get).mockImplementation(() => {
                    throw 'String error'
                })

                const command: Command = { type: 'GET', key: 'key' }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: false,
                    data: null,
                    error: 'Unknown error'
                } satisfies CommandResult)
            })

            it('should handle unknown command type', () => {
                const command: Command = { type: 'NOT_SUPPORTED' }
                const result = protocol.execute(command)

                expect(result).toEqual({
                    success: false,
                    type: 'NOT_SUPPORTED',
                    data: null,
                    error: 'Failed to parse command'
                } satisfies CommandResult)
            })
        })
    })

    describe('format method', () => {
        it('should format success responses', () => {
            const testCases: Array<{ input: CommandResult; expected: any }> = [
                { input: { success: true, type: 'SET', data: 'STORED' }, expected: 'STORED' },
                { input: { success: true, type: 'GET', data: 'cached_value' }, expected: 'cached_value' },
                { input: { success: false, type: 'GET', data: 'NOT_FOUND' }, expected: 'NOT_FOUND' },
                { input: { success: true, type: 'EXISTS', data: 'YES' }, expected: 'YES' },
                { input: { success: true, type: 'KEYS', data: 'key1;key2' }, expected: 'key1;key2' },
            ]
            testCases.forEach(({ input, expected }) => {
                expect(protocol.format(input)).toBe(expected)
            })
        })

        it('should format error responses', () => {
            const result: CommandResult = {
                success: false,
                data: null,
                error: 'Something went wrong'
            }
            expect(protocol.format(result)).toBe('ERROR Something went wrong')
        })

        it('should handle undefined error', () => {
            const result: CommandResult = { success: false, data: null }
            expect(protocol.format(result)).toBe('ERROR undefined')
        })

        it('should handle empty string data', () => {
            const result: CommandResult = { success: true, type: 'GET', data: '' }
            expect(protocol.format(result)).toBe('')
        })
    })

    describe('Integration tests', () => {
        it('should handle complete SET->GET flow', () => {
            const setCommand = protocol.parse('SET mykey myvalue 600')
            const setResult = protocol.execute(setCommand)
            const setResponse = protocol.format(setResult)
            expect(setResponse).toBe('STORED')

            const getCommand = protocol.parse('GET mykey')
            const getResult = protocol.execute(getCommand)
            const getResponse = protocol.format(getResult)
            expect(getResponse).toBe('cached_value')
        })

        it('should handle DELETE flow', () => {
            const deleteCommand = protocol.parse('DELETE mykey')
            const deleteResult = protocol.execute(deleteCommand)
            const deleteResponse = protocol.format(deleteResult)
            expect(deleteResponse).toBe('DELETED')
        })

        it('should handle invalid command pipeline', () => {
            const invalidCommand = protocol.parse('INVALID_COMMAND')
            const result = protocol.execute(invalidCommand)
            const response = protocol.format(result)
            expect(response).toBe('ERROR Failed to parse command')
        })

        it('should handle SET with invalid TTL pipeline', () => {
            const command = protocol.parse('SET key value not_a_number')
            const result = protocol.execute(command)
            const response = protocol.format(result)
            expect(response).toBe('ERROR Failed to parse command')
        })

        it('should handle cache error pipeline', () => {
            vi.mocked(mockCache.get).mockImplementation(() => {
                throw new Error('Connection lost')
            })
            const command = protocol.parse('GET key')
            const result = protocol.execute(command)
            const response = protocol.format(result)
            expect(response).toBe('ERROR Connection lost')
        })
    })
})
