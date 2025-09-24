import { startMetricsServer, countRequest, countError } from "./metrics";
import { createServer } from "http";

const PORT = 3000;
startMetricsServer(9100);

const server = createServer((req, res) => {
  countRequest();

  if (req.url === "/error") {
    countError();
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Error");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello, Memecached with Prometheus!");
});

server.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
});
