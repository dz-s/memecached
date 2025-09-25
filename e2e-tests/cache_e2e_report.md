# Cache Server E2E Test Report

**Date:** 2025-09-25T23:01:03.262Z

## Summary
- Total tests: 8
- Passed: 8
- Failed: 0

## Details
### SET->GET->DELETE works
Stores a value, retrieves it, deletes it, then verifies deletion.
- Status: ✅ Passed
- Avg Latency: 4.8ms
- Command Latencies:
  - Command: "SET seqKey 123" → Response: "STORED" in 11ms
  - Command: "GET seqKey" → Response: "123" in 3ms
  - Command: "DELETE seqKey" → Response: "DELETED" in 2ms
  - Command: "GET seqKey" → Response: "NOT_FOUND" in 3ms

### TTL key expires
Sets a key with TTL, checks value immediately, waits for TTL expiry, then verifies it is gone.
- Status: ✅ Passed
- Avg Latency: 3.0ms
- Command Latencies:
  - Command: "SET ttlKey temp 2000" → Response: "STORED" in 4ms
  - Command: "GET ttlKey" → Response: "temp" in 2ms
  - Command: "GET ttlKey" → Response: "NOT_FOUND" in 3ms

### EXISTS works correctly
Checks if a key exists and verifies deletion changes the EXISTS response.
- Status: ✅ Passed
- Avg Latency: 2.5ms
- Command Latencies:
  - Command: "SET existKey val" → Response: "STORED" in 2ms
  - Command: "EXISTS existKey" → Response: "YES" in 3ms
  - Command: "DELETE existKey" → Response: "DELETED" in 2ms
  - Command: "EXISTS existKey" → Response: "NO" in 3ms

### KEYS returns all keys
Flushes cache, sets multiple keys, then retrieves the list of keys to ensure all are present.
- Status: ✅ Passed
- Avg Latency: 2.3ms
- Command Latencies:
  - Command: "SET a 1" → Response: "STORED" in 2ms
  - Command: "SET b 2" → Response: "STORED" in 2ms
  - Command: "SET c 3" → Response: "STORED" in 2ms
  - Command: "KEYS" → Response: "a;b;c" in 3ms

### Parallel SETs handled
Performs multiple SET commands in parallel and verifies each value.
- Status: ✅ Passed
- Avg Latency: 19.2ms
- Command Latencies:
  - Command: "SET p0 val0" → Response: "STORED" in 3ms
  - Command: "SET p1 val1" → Response: "STORED" in 45ms
  - Command: "SET p2 val2" → Response: "STORED" in 44ms
  - Command: "SET p3 val3" → Response: "STORED" in 44ms
  - Command: "SET p4 val4" → Response: "STORED" in 44ms
  - Command: "GET p0" → Response: "val0" in 3ms
  - Command: "GET p1" → Response: "val1" in 2ms
  - Command: "GET p2" → Response: "val2" in 3ms
  - Command: "GET p3" → Response: "val3" in 2ms
  - Command: "GET p4" → Response: "val4" in 2ms

### Overwrite existing key
Sets a key, overwrites it with a new value, then verifies the latest value is returned.
- Status: ✅ Passed
- Avg Latency: 2.0ms
- Command Latencies:
  - Command: "SET overwriteKey old" → Response: "STORED" in 2ms
  - Command: "SET overwriteKey new" → Response: "STORED" in 2ms
  - Command: "GET overwriteKey" → Response: "new" in 2ms

### Unknown command fails
Sends an unsupported command and expects an error response.
- Status: ✅ Passed
- Avg Latency: 2.0ms
- Command Latencies:
  - Command: "FOOBAR" → Response: "ERROR Failed to parse command" in 2ms

### QUIT works
Sends QUIT command to gracefully close the connection.
- Status: ✅ Passed
- Avg Latency: 2.0ms
- Command Latencies:
  - Command: "QUIT" → Response: "BYE" in 2ms

