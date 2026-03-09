type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  route?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, ctx?: LogContext) {
  const entry = { ts: new Date().toISOString(), level, message, ...ctx };
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.info(JSON.stringify(entry));
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
};
