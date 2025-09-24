import express from "express";
import client from "prom-client";
import fs from "fs";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const memoryUsageGauge = new client.Gauge({
  name: "app_memory_usage_percent",
  help: "Memory usage as percent of container limit"
});
register.registerMetric(memoryUsageGauge);

const requestCounter = new client.Counter({
  name: "app_http_requests_total",
  help: "Total number of HTTP requests"
});
register.registerMetric(requestCounter);

const errorCounter = new client.Counter({
  name: "app_errors_total",
  help: "Total number of application errors"
});
register.registerMetric(errorCounter);

export function countRequest() {
  requestCounter.inc();
}

export function countError() {
  errorCounter.inc();
}

//cgroups v1 & v2 support 
function readNumber(path: string): number | null {
  try {
    return Number(fs.readFileSync(path, "utf8").trim());
  } catch {
    return null;
  }
}

const memLimit =
  readNumber("/sys/fs/cgroup/memory/memory.limit_in_bytes") ??
  readNumber("/sys/fs/cgroup/memory.max");

const memUsagePath = fs.existsSync("/sys/fs/cgroup/memory/memory.usage_in_bytes")
  ? "/sys/fs/cgroup/memory/memory.usage_in_bytes"
  : "/sys/fs/cgroup/memory.current";

function getMemoryUsagePercent(): number {
  if (!memLimit || memLimit <= 0 || memLimit > 1e15) {
    return 0;
  }
  const usage = readNumber(memUsagePath) ?? 0;
  return (usage / memLimit) * 100;
}

setInterval(() => {
  const percent = getMemoryUsagePercent();
  memoryUsageGauge.set(percent);
}, 5000);

export function startMetricsServer(port = 9100) {
  const app = express();

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  app.listen(port, () => {
    console.log(`Metrics server running at http://localhost:${port}/metrics`);
  });
}
