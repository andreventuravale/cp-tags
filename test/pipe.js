const { makeSpawnTag } = require("../library");
const assert = require("node:assert");

const $ = makeSpawnTag()

$`find .. | grep -E "/test$" | grep -v "node_modules"`.then(({ stdout }) => {
  assert.deepEqual(stdout, '../cp-tags/test\n')
})
