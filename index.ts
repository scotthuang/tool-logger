import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const HOME = os.homedir();
const LOG_DIR = path.join(HOME, ".openclaw", "workspace", "logs", "tool-logger");
const MAX_DAYS = 3;

// Ensure log directory exists synchronously
function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Get local timezone timestamp (Asia/Shanghai)
function getLocalTimestamp() {
  return new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Get log file path by date (local timezone)
function getLogFilePath() {
  const now = new Date();
  const dateStr = now.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).replace(/\//g, "-");
  return path.join(LOG_DIR, `${dateStr}.log`);
}

// Clean old logs (keep only last 3 days) - synchronous
function cleanOldLogs() {
  try {
    if (!fs.existsSync(LOG_DIR)) return;
    
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const cutoff = now - (MAX_DAYS * msPerDay);
    
    for (const file of files) {
      if (!file.endsWith(".log")) continue;
      const filePath = path.join(LOG_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

// Format length to human readable (k, m, etc)
function formatLength(len) {
  if (len >= 1000000) return `${(len / 1000000).toFixed(1)}m`;
  if (len >= 1000) return `${(len / 1000).toFixed(1)}k`;
  return `${len}`;
}

// Log helper - synchronous
function log(entry) {
  ensureDir();
  cleanOldLogs();
  
  const logFile = getLogFilePath();
  fs.appendFileSync(logFile, entry + "\n");
}

export default {
  id: "tool-logger",
  name: "tool-logger",
  description: "Log all tool inputs and outputs",
  
  register(api) {
    // Register before_tool_call hook
    api.on("before_tool_call", (event, ctx) => {
      const params = event.params || {};
      const timeout = params.timeout ? `${params.timeout}s` : "-";
      const paramsStr = JSON.stringify(params).slice(0, 500);
      const entry = `[${getLocalTimestamp()}] IN  | ${event.toolName} | ${ctx.sessionKey} | ${ctx.agentId || "-"} | ${timeout} | ${paramsStr}`;
      log(entry);
      return ctx;
    }, { name: "tool-logger-before" });
    
    // Register after_tool_call hook
    api.on("after_tool_call", (event, ctx) => {
      // Skip if no duration (duplicate log)
      if (!event.durationMs) return ctx;
      
      let result = event.result || event.error || "";
      const originalLength = typeof result === "string" ? result.length : JSON.stringify(result).length;
      if (typeof result === "string" && result.length > 500) {
        result = result.slice(0, 500) + "...";
      } else if (typeof result !== "string") {
        result = JSON.stringify(result).slice(0, 500);
      }
      const duration = event.durationMs ? `${event.durationMs}ms` : "-";
      const entry = `[${getLocalTimestamp()}] OUT | ${event.toolName} | ${duration} | ${formatLength(originalLength)} | ${JSON.stringify(result).slice(0, 500)}`;
      log(entry);
      return ctx;
    }, { name: "tool-logger-after" });
  }
};
