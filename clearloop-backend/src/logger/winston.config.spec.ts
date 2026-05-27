import { winstonConfig, createLogger } from './winston.config';
import * as winston from 'winston';

describe('winstonConfig', () => {
  it('should export a valid config object', () => {
    expect(winstonConfig).toBeDefined();
    expect(winstonConfig).toHaveProperty('transports');
  });

  it('should have exactly 3 transports (console, error file, combined file)', () => {
    expect(winstonConfig.transports).toHaveLength(3);
  });

  it('should include a Console transport', () => {
    const hasConsoleTransport = winstonConfig.transports.some(
      (t) => t instanceof winston.transports.Console,
    );
    expect(hasConsoleTransport).toBe(true);
  });

  it('should include a File transport for error.log', () => {
    const errorFileTransport = winstonConfig.transports.find(
      (t) =>
        t instanceof winston.transports.File &&
        (t as winston.transports.FileTransportInstance).filename === 'logs/error.log',
    ) as winston.transports.FileTransportInstance | undefined;

    expect(errorFileTransport).toBeDefined();
  });

  it('should include a File transport for combined.log', () => {
    const combinedFileTransport = winstonConfig.transports.find(
      (t) =>
        t instanceof winston.transports.File &&
        (t as winston.transports.FileTransportInstance).filename === 'logs/combined.log',
    ) as winston.transports.FileTransportInstance | undefined;

    expect(combinedFileTransport).toBeDefined();
  });

  it('error.log transport should only capture error level', () => {
    const errorFileTransport = winstonConfig.transports.find(
      (t) =>
        t instanceof winston.transports.File &&
        (t as winston.transports.FileTransportInstance).filename === 'logs/error.log',
    ) as winston.transports.FileTransportInstance | undefined;

    expect(errorFileTransport).toBeDefined();
    expect((errorFileTransport as any).level).toBe('error');
  });
});

describe('createLogger()', () => {
  it('should return a logger instance', () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
  });

  it('should return an object with a log method', () => {
    const logger = createLogger();
    expect(typeof (logger as any).log).toBe('function');
  });
});
