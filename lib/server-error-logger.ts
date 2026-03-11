import fs from "fs";
import path from "path";
import util from "util";

declare global {
  var __serverErrorLoggerInitialized: boolean | undefined;
}

if (typeof window === "undefined") {
  if (globalThis.__serverErrorLoggerInitialized) {
    // already hooked, no-op
  } else {
    globalThis.__serverErrorLoggerInitialized = true;

    const logDir = path.join(process.cwd(), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, "server-errors.txt");
    const logStream = fs.createWriteStream(logPath, { flags: "a" });
    const inspectOptions: util.InspectOptions = {
      depth: 3,
      breakLength: 80,
      sorted: true,
    };

    const formatArgs = (items: unknown[]) =>
      items
        .map((item) =>
          typeof item === "string" ? item : util.inspect(item, inspectOptions),
        )
        .join(" ");

    const writeLog = (level: string, items: unknown[]) => {
      const timestamp = new Date().toISOString();
      const message = formatArgs(items);
      const entry = `${timestamp} [${level}] ${message}\n`;
      logStream.write(entry);
    };

    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      writeLog("ERROR", args);
      originalConsoleError(...args);
    };

    const originalConsoleWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      writeLog("WARN", args);
      originalConsoleWarn(...args);
    };

    const handleProcessEvent = (
      event: "uncaughtException" | "unhandledRejection",
    ) => {
      const handler = (value: unknown) => {
        writeLog(event, [value]);
        originalConsoleError(event, value);
      };
      process.on(event, handler);
    };

    handleProcessEvent("uncaughtException");
    handleProcessEvent("unhandledRejection");

    logStream.on("error", (error) => {
      originalConsoleError("Failed to write to server log", error);
    });
  }
}
