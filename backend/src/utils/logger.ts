export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  jobName?: string;
  integrationCount?: number;
  brandCount?: number;
  orderCount?: number;
  insightCount?: number;
  upstreamStatusCode?: number;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  errorName?: string;
  errorMessage?: string;
  stack?: string;
  environment?: string;
  port?: number;
  apiVersion?: string;
  attempt?: number;
  remainingRetries?: number;
}

interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
}

const writeLog = (
  level: LogLevel,
  message: string,
  context: LogContext = {}
): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const output = level === 'error' ? console.error : console.log;
  output(JSON.stringify(entry));
};

export const logInfo = (
  message: string,
  context: LogContext = {}
): void => {
  writeLog('info', message, context);
};

export const logWarn = (
  message: string,
  context: LogContext = {}
): void => {
  writeLog('warn', message, context);
};

export const logError = (
  message: string,
  context: LogContext = {}
): void => {
  writeLog('error', message, context);
};

export const getSafePath = (url: string): string => {
  return url.split('?')[0] || '/';
};
