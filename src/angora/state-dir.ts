import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export function angoraStateDir() {
  return (
    process.env.ANGORA_STATE_DIR ||
    process.env.KAIROS_ANGORA_STATE_DIR ||
    (process.env.KAIROS_DATA_DIR ? join(process.env.KAIROS_DATA_DIR, "angora") : join(process.cwd(), ".kairos-angora"))
  );
}

export function ensureAngoraStateDir() {
  const dir = angoraStateDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function stateFile(name: string) {
  return join(ensureAngoraStateDir(), name);
}

export function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonFile(filePath: string, data: unknown) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameWithRetry(tmp, filePath);
}

function renameWithRetry(source: string, target: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      renameSync(source, target);
      return;
    } catch (error: any) {
      lastError = error;
      if (error?.code !== "EPERM" && error?.code !== "EBUSY") break;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25 * (attempt + 1));
    }
  }
  throw lastError;
}
