import winston, { type Logger } from 'winston';

const format = winston.format.printf((info) => {
  return `[${info.level.toUpperCase()}]${info['service'] ? ` [${info['service']}] ` : ''}${info.message}`;
});

const defaultLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: format,
  transports: [new winston.transports.Console()]
});

export function getLogger(service?: string): Logger {
  return defaultLogger.child({ service });
}

export type { Logger };
