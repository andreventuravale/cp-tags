const { join } = require("node:path");
const { makeSpawnTag } = require("../library");

const $ = makeSpawnTag();

$({ cwd: join(__dirname, "..") })`find . &`;

process.kill(process.pid, "SIGINT");
