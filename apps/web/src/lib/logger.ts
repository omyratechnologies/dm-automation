const PREFIXES = ["🔵", "✅", "🔄", "💾", "📊", "📤", "🚫", "❌", "🔴", "🔍", "✨", "📥"];

function stripPrefix(msg: string): string {
  for (const p of PREFIXES) {
    if (msg.startsWith(p)) return msg.slice(p.length).trim();
  }
  return msg;
}

function log(level: string, message: string, meta?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    level,
    time: new Date().toISOString(),
    msg: stripPrefix(message),
  };
  if (meta && Object.keys(meta).length) entry.meta = meta;
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
