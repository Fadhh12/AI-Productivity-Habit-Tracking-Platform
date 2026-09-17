/**
 * Structured JSON logger. Every log line is a single JSON object so it can be
 * ingested by log aggregators (and greppable in plain stdout during dev).
 */
export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface BaseLogFields {
  timestamp?: string;
  context?: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  errorType?: string;
  stack?: string;
  message: string;
  [key: string]: unknown;
}

export interface StructuredLogFields extends BaseLogFields {
  level?: LogLevel;
}

export class StructuredLogger {
  static write(fields: StructuredLogFields): void {
    const entry = {
      timestamp: fields.timestamp ?? new Date().toISOString(),
      level: fields.level ?? 'log',
      ...fields,
    };
    const line = JSON.stringify(entry);
    if (entry.level === 'error') {
      // eslint-disable-next-line no-console
      console.error(line);
    } else {
      // eslint-disable-next-line no-console
      console.log(line);
    }
  }

  static error(fields: BaseLogFields): void {
    this.write({ ...fields, level: 'error' });
  }

  static warn(fields: BaseLogFields): void {
    this.write({ ...fields, level: 'warn' });
  }

  static info(fields: BaseLogFields): void {
    this.write({ ...fields, level: 'log' });
  }
}
