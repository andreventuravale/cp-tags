const { EventEmitter } = require("node:events")
const { func, when } = require("testdouble")
const { makeTag } = require("./library.js")

const test = (title, t) => {
	console.group(title)

	console.log(t)

	const r = t()

	r
		.then(() => {
			console.info('ok')
		})
		.catch(() => {
			console.error(error)
		})
		.finally(() => {
			console.groupEnd()
		})
}

test("Happy path", () => {
	const spawn = func()

	const ee = new EventEmitter()

	ee.stderr = new EventEmitter()

	ee.stdout = new EventEmitter()

	when(spawn('ls'), { ignoreExtraArgs: true }).thenReturn(ee)

	const $ = makeTag(spawn)

	process.nextTick(() => {
		ee.emit('close', 0)
	})

	return $`ls`
})
