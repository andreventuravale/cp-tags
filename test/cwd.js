const { join } = require("node:path");
const { makeSpawnTag } = require("../library");
const assert = require("node:assert");

const $ = makeSpawnTag()

$({ cwd: join(__dirname, '..') })`find . | grep -E "/test$" | grep -v "node_modules"`.then(({ stdout }) => {
  assert.deepEqual(stdout, './test\n')
})
