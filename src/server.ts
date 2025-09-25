import * as net from 'net';
import logger from './logger';
import { Protocol } from './protocol';
import { getConfig } from './config';
import { CacheStrategy } from './types';

import { createCache } from './create-cache';
import { countRequest, startMetricsServer } from './metrics';

class CacheServer {
  private server: net.Server;
  private cache: CacheStrategy<string>;
  private protocol: Protocol;
  private config = getConfig();
  private connections: Set<net.Socket> = new Set();

  constructor() {
    this.cache = createCache(this.config.evictionPolicy, getConfig())
    this.protocol = new Protocol(this.cache);
    this.server = net.createServer(this.handleConnection.bind(this));
    
    this.setupGracefulShutdown();
  }

  private handleConnection(socket: net.Socket): void {
    this.connections.add(socket);
    logger.info(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);
    
    let buffer = '';

    socket.on('data', (data: Buffer) => {
      buffer += data.toString();
      
      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const command = line.replace('\r', '').trim();
        if (command) {
          countRequest()
          this.processCommand(socket, command);
        }
      }
    });

    socket.on('close', () => {
      this.connections.delete(socket);
      logger.info(`Connection closed from ${socket.remoteAddress}:${socket.remotePort}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error from ${socket.remoteAddress}:${socket.remotePort}:`, error.message);
      this.connections.delete(socket);
    });
  }

  private processCommand(socket: net.Socket, command: string): void {
    const parsedCommand = this.protocol.parse(command);
    const result = this.protocol.execute(parsedCommand)

    if (result.success && result.data === 'QUIT') {
      socket.write(this.protocol.format(result));
      socket.end();
      return;
    }

    const response = this.protocol.format(result);
    socket.write(response);
  }

  private setupGracefulShutdown(): void {
    const shutdown = () => {
      logger.info('\nShutting down cache server...');
      
      for (const socket of this.connections) {
        socket.end();
      }
      
      this.server.close(() => {
        logger.info('Server closed');
        
        //this.cache.shutdown();
        logger.info('Cache shutdown complete');
        
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  start(): void {
    this.server.listen(this.config.port, '0.0.0.0', () => {
      logger.info(`Cache server listening on ${this.config.host}:${this.config.port}`);
      logger.info(`Max memory: ${Math.round(this.config.maxMemory / 1024 / 1024)}MB`);
      logger.info(`Cleanup interval: ${this.config.cleanupInterval}ms`);
      logger.info('Ready to accept connections...\n');
    });

    this.server.on('error', (error) => {
      logger.error('Server error:', error);
      process.exit(1);
    });
  }
}


startMetricsServer(9100)

const server = new CacheServer();
server.start();