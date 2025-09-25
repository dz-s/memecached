const net = require('net');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let client;
let buffer = '';
const queue = [];

function sendCommand(command, timeout = 2000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const timer = setTimeout(() => reject(new Error(`Timeout for: ${command}`)), timeout);
        queue.push({
            resolve: (msg) => {
                clearTimeout(timer);
                const latency = Date.now() - start;
                resolve({ msg: msg.trim(), latency });
            },
            reject: (err) => { clearTimeout(timer); reject(err); }
        });
        client.write(command + '\n');
    });
}

function handleData(data) {
    buffer += data.toString();
    let parts = buffer.split('\n');
    buffer = parts.pop();
    for (const part of parts) {
        if (queue.length > 0) {
            const { resolve } = queue.shift();
            resolve(part);
        }
    }
}

const results = [];
function recordResult(name, description, fn) {
    return async function () {
        try {
            const commandResults = [];
            await fn(commandResults);
            const totalLatency = commandResults.reduce((a, c) => a + c.latency, 0);
            const avgLatency = commandResults.length ? (totalLatency / commandResults.length).toFixed(1) : 0;
            results.push({ name, status: 'passed', latency: avgLatency, description, commands: commandResults });
        } catch (err) {
            results.push({ name, status: 'failed', error: err.message, description });
            throw err;
        }
    };
}

describe('Cache Server E2E Advanced', function () {
    this.timeout(40000);

    before((done) => {
        client = net.createConnection({ port: 3000 }, done);
        client.on('data', handleData);
        client.on('error', done);
    });

    after(() => {
        client.end();
        const total = results.length;
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = total - passed;
        let md = `# Cache Server E2E Test Report\n\n`;
        md += `**Date:** ${new Date().toISOString()}\n\n`;
        md += `## Summary\n- Total tests: ${total}\n- Passed: ${passed}\n- Failed: ${failed}\n\n`;
        md += `## Details\n`;
        results.forEach((r) => {
            md += `### ${r.name}\n`;
            md += `${r.description}\n`;
            if (r.status === 'passed') {
                md += `- Status: ✅ Passed\n`;
                if (r.latency !== undefined) md += `- Avg Latency: ${r.latency}ms\n`;
                if (r.commands) {
                    md += `- Command Latencies:\n`;
                    r.commands.forEach((c) => {
                        md += `  - Command: "${c.command}" → Response: "${c.msg}" in ${c.latency}ms\n`;
                    });
                }
            } else {
                md += `- Status: ❌ Failed — ${r.error}\n`;
            }
            md += `\n`;
        });
        const reportPath = path.join(__dirname, './cache_e2e_report.md');
        fs.writeFileSync(reportPath, md);
        console.log(`E2E report written to ${reportPath}`);
    });

    it('SET, GET, DELETE sequence', recordResult(
        'SET->GET->DELETE works',
        'Stores a value, retrieves it, deletes it, then verifies deletion.',
        async (commandResults) => {
            let r = await sendCommand('SET seqKey 123'); commandResults.push({ command: 'SET seqKey 123', ...r });
            assert.strictEqual(r.msg, 'STORED');
            r = await sendCommand('GET seqKey'); commandResults.push({ command: 'GET seqKey', ...r });
            assert.strictEqual(r.msg, '123');
            r = await sendCommand('DELETE seqKey'); commandResults.push({ command: 'DELETE seqKey', ...r });
            assert.strictEqual(r.msg, 'DELETED');
            r = await sendCommand('GET seqKey'); commandResults.push({ command: 'GET seqKey', ...r });
            assert.strictEqual(r.msg, 'NOT_FOUND');
        }
    ));

    it('TTL expiration', recordResult(
        'TTL key expires',
        'Sets a key with TTL, checks value immediately, waits for TTL expiry, then verifies it is gone.',
        async (commandResults) => {
            let r = await sendCommand('SET ttlKey temp 2000'); commandResults.push({ command: 'SET ttlKey temp 2000', ...r });
            assert.strictEqual(r.msg, 'STORED');
            r = await sendCommand('GET ttlKey'); commandResults.push({ command: 'GET ttlKey', ...r });
            assert.strictEqual(r.msg, 'temp');
            await new Promise(r => setTimeout(r, 3000));
            r = await sendCommand('GET ttlKey'); commandResults.push({ command: 'GET ttlKey', ...r });
            assert.strictEqual(r.msg, 'NOT_FOUND');
        }
    ));

    it('EXISTS check', recordResult(
        'EXISTS works correctly',
        'Checks if a key exists and verifies deletion changes the EXISTS response.',
        async (commandResults) => {
            let r = await sendCommand('SET existKey val'); commandResults.push({ command: 'SET existKey val', ...r });
            assert.strictEqual(r.msg, 'STORED');
            r = await sendCommand('EXISTS existKey'); commandResults.push({ command: 'EXISTS existKey', ...r });
            assert.strictEqual(r.msg, 'YES');
            r = await sendCommand('DELETE existKey'); commandResults.push({ command: 'DELETE existKey', ...r });
            assert.strictEqual(r.msg, 'DELETED');
            r = await sendCommand('EXISTS existKey'); commandResults.push({ command: 'EXISTS existKey', ...r });
            assert.strictEqual(r.msg, 'NO');
        }
    ));

    it('Multiple SETs and KEYS', recordResult(
        'KEYS returns all keys',
        'Flushes cache, sets multiple keys, then retrieves the list of keys to ensure all are present.',
        async (commandResults) => {
            await sendCommand('FLUSH');
            let r = await sendCommand('SET a 1'); commandResults.push({ command: 'SET a 1', ...r });
            r = await sendCommand('SET b 2'); commandResults.push({ command: 'SET b 2', ...r });
            r = await sendCommand('SET c 3'); commandResults.push({ command: 'SET c 3', ...r });
            r = await sendCommand('KEYS'); commandResults.push({ command: 'KEYS', ...r });
            assert.match(r.msg, /a/);
            assert.match(r.msg, /b/);
            assert.match(r.msg, /c/);
        }
    ));

    it('Parallel SETs', recordResult(
        'Parallel SETs handled',
        'Performs multiple SET commands in parallel and verifies each value.',
        async (commandResults) => {
            await sendCommand('FLUSH');
            const commands = [];
            for (let i = 0; i < 5; i++) commands.push(sendCommand(`SET p${i} val${i}`));
            const responses = await Promise.all(commands);
            responses.forEach((r, i) => {
                commandResults.push({ command: `SET p${i} val${i}`, ...r });
                assert.strictEqual(r.msg, 'STORED');
            });
            for (let i = 0; i < 5; i++) {
                let r = await sendCommand(`GET p${i}`); commandResults.push({ command: `GET p${i}`, ...r });
                assert.strictEqual(r.msg, `val${i}`);
            }
        }
    ));

    it('Overwrite value', recordResult(
        'Overwrite existing key',
        'Sets a key, overwrites it with a new value, then verifies the latest value is returned.',
        async (commandResults) => {
            let r = await sendCommand('SET overwriteKey old'); commandResults.push({ command: 'SET overwriteKey old', ...r });
            assert.strictEqual(r.msg, 'STORED');
            r = await sendCommand('SET overwriteKey new'); commandResults.push({ command: 'SET overwriteKey new', ...r });
            assert.strictEqual(r.msg, 'STORED');
            r = await sendCommand('GET overwriteKey'); commandResults.push({ command: 'GET overwriteKey', ...r });
            assert.strictEqual(r.msg, 'new');
        }
    ));

    it('NOT_SUPPORTED returns ERROR', recordResult(
        'Unknown command fails',
        'Sends an unsupported command and expects an error response.',
        async (commandResults) => {
            let r = await sendCommand('FOOBAR'); commandResults.push({ command: 'FOOBAR', ...r });
            assert.match(r.msg, /^ERROR/);
        }
    ));

    it('QUIT returns BYE', recordResult(
        'QUIT works',
        'Sends QUIT command to gracefully close the connection.',
        async (commandResults) => {
            let r = await sendCommand('QUIT'); commandResults.push({ command: 'QUIT', ...r });
            assert.strictEqual(r.msg, 'BYE');
        }
    ));
});
