import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const candidates = [
  ["python", ["-B", "-m", "py_compile", "sdk/python/angorapay.py"]],
  ["python3", ["-B", "-m", "py_compile", "sdk/python/angorapay.py"]],
  ["py", ["-3", "-B", "-m", "py_compile", "sdk/python/angorapay.py"]],
];

const localPrograms = join(process.env.LOCALAPPDATA || "", "Programs", "Python");
if (existsSync(localPrograms)) {
  for (const entry of readdirSync(localPrograms)) {
    const python = join(localPrograms, entry, "python.exe");
    if (existsSync(python)) {
      candidates.push([python, ["-B", "-m", "py_compile", "sdk/python/angorapay.py"]]);
    }
  }
}

for (const [command, args] of candidates) {
  const probe = spawnSync(command, ["--version"], { encoding: "utf8" });
  const probeOutput = `${probe.stdout || ""}${probe.stderr || ""}`;
  if (probe.error?.code === "ENOENT" || probe.status !== 0 || /Python was not found/i.test(probeOutput)) {
    continue;
  }

  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status === 0) {
    rmSync(join("sdk", "python", "__pycache__"), { recursive: true, force: true });
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

console.warn("Python was not found; skipping Python SDK syntax check in this local environment.");
