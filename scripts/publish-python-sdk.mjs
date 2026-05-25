import { runPythonModule } from "./python-tooling.mjs";

runPythonModule("twine", ["upload", "dist/*"], { cwd: "sdk/python" });
