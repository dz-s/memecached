# Memecached

A simple TypeScript implementation of an in-memory cache standalone service, built with modern observability and monitoring capabilities.

## ⚡ Tech Stack

- **Node.js** – runtime environment for the cache server
- **TypeScript** – strict type checking and modern TS features
- **Express** – HTTP server and metrics endpoint
- **Prom-client** – Prometheus metrics collection
- **Pino** with **Pino-pretty** – structured logging and pretty-printing
- **Vitest** – unit and integration testing
- **tsx** – run TypeScript directly in development without build step
- **Mocha** for e2e testing

## 🚀 **Quick Start**

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Run tests
npm test

# Build for production
npm run build
npm start


# Start dockerized solution with monitoring stack (configure TBD)**
docker-compose up -d
```

## ⚙️ Configuration

Environment variables with sensible defaults:

```bash
export CACHE_MAX_MEMORY=67108864    # 64MB (default)
export CACHE_PORT=3000              # Default: 3000
export CACHE_HOST=127.0.0.1         # Default: 127.0.0.1
export CACHE_CLEANUP_INTERVAL=60000 # 60 seconds (default)
export EVICTION_POLICY=LRU          # Default: LRU
export CAPACITY=10000               # Maximum number of cache entries (default)
```
## 🌐 **Service Endpoints**

| Service | URL | Purpose |
|---------|-----|---------|
| **Cache Service** | http://localhost:3000 | Main cache API (TCP text-based) |

## 📡 Protocol Commands

### Connect to the server
```bash
telnet localhost 3000

# Set a value with optional TTL in milliseconds
SET key "hello world"           # No TTL
SET user {"name":"John"} 2000  # TTL 2000ms
SET counter 42

# Get a value
GET key

# Delete a key
DELETE key
DEL key   # alias for DELETE

# Check existence
EXISTS key       # Returns YES if exists, NO if not
```

### Management Commands
```bash
KEYS               # List all keys
QUIT               # Close connection
```

## ✨ **Features**

- 🚀 **High-Performance In-Memory Caching**: Fast key-value storage with TTL support
- 📊 **Built-in Monitoring**: Prometheus metrics endpoint for observability
- 📈 **Grafana Integration**: Pre-configured dashboards for visualization
- 🔔 **Alerting**: Alertmanager integration for proactive monitoring
- 🛠️ **TypeScript**: Fully typed for better development experience
- 🐳 **Docker Support**: Complete containerized setup with monitoring stack
- 🔧 **Production Ready (almost 🙂)**: Comprehensive logging and error handling



## 📊 **Statistics & Monitoring**

| Service | URL | Purpose |
|---------|-----|---------|
| **Metrics** | http://localhost:9100/metrics | Prometheus metrics |
| **Prometheus** | http://localhost:9090 | Metrics collection UI |
| **Grafana** | http://localhost:3001 | Dashboards (admin/admin) |
| **Alertmanager** | http://localhost:9093 | Alert management |

## 🧪 **Testing Strategy**

### **Comprehensive Coverage**
- **Unit tests** business logic
- **Integration tests** for protocol handling
- **TTL functionality** testing

## 🚀 **Performance Characteristics**

- **Memory efficient**: Precise size tracking
- **O(1) operations**: Hash map based storage
- **Non-blocking I/O**: Event-driven architecture
- **Minimal overhead**: Direct Map operations, no unnecessary abstractions

## 🔮 **Future Enhancements**

The architecture makes these additions straightforward:
- **Snapshot functionalityr**: When FLUSH command called, load off cache Map to file-based storage.
- **Monitoring**: Prometheus metrics, health checks add
- **Protocol extensions**: HTTP compatibility

---
## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Inspired by Memcached and Redis
- Built with modern TypeScript and Node.js best practices
- Monitoring stack powered by Prometheus ecosystem
---

**Made with ❤️ by [dz-s](https://github.com/dz-s)**

For questions, issues, or feature requests, please [open an issue](https://github.com/dz-s/memecached/issues) on GitHub.
