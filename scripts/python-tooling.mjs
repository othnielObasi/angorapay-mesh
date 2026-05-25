import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export function findPython() {
  const candidates = [
    ["python", []],
    ["python3", []],
    ["py", ["-3"]],
  ];

  const localPrograms = join(process.env.LOCALAPPDATA || "", "Programs", "Python");
  if (existsSync(localPrograms)) {
    for (const entry of readdirSync(localPrograms)) {
      const python = join(localPrograms, entry, "python.exe");
      if (existsSync(python)) candidates.unshift([python, []]);
    }
  }

  for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, "--version"], { encoding: "utf8" });
    const output = `${probe.stdout || ""}${probe.stderr || ""}`;
    if (probe.error?.code === "ENOENT" || probe.status !== 0 || /Python was not found/i.test(output)) continue;
    return { command, prefix };
  }

  return null;
}

export function runPythonModule(moduleName, args, options = {}) {
  const python = findPython();
  if (!python) {
    console.error("Python was not found. Install Python 3.10+ before building or publishing the Python SDK.");
    process.exit(1);
  }
  const result = spawnSync(python.command, [...python.prefix, "-m", moduleName, ...args], {
    stdio: "inherit",
    ...options,
  });
  process.exit(result.status ?? 1);
}
