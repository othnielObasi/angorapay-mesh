import { spawnSync } from "node:child_process";

const candidates = [
  ["python", ["-m", "py_compile", "sdk/python/angorapay.py"]],
  ["python3", ["-m", "py_compile", "sdk/python/angorapay.py"]],
  ["py", ["-3", "-m", "py_compile", "sdk/python/angorapay.py"]],
];

for (const [command, args] of candidates) {
  const probe = spawnSync(command, ["--version"], { encoding: "utf8" });
  const probeOutput = `${probe.stdout || ""}${probe.stderr || ""}`;
  if (probe.error?.code === "ENOENT" || probe.status !== 0 || /Python was not found/i.test(probeOutput)) {
    continue;
  }

  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status === 0) {
    process.exit(0);
  }
  process.exit(result.status ?? 1);
}

console.warn("Python was not found; skipping Python SDK syntax check in this local environment.");
