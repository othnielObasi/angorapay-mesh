import { runPythonModule } from "./python-tooling.mjs";

runPythonModule("build", [], { cwd: "sdk/python" });
