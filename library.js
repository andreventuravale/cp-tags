const { spawn: nodeSpawn } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const process = require('node:process')

function follow(childProcess) {
	return new Promise((resolve, reject) => {
		let stderr = ''
		let stdout = ''

		const forwardSigint = function () {
			console.log(`forwarding SIGINT to child process: ${childProcess.pid}`)

			childProcess.kill('SIGINT')
		}

		process.on('SIGINT', forwardSigint)

		childProcess.stderr.on('data', (data) => {
			process.stderr.write(data)

			stderr += data
		})

		childProcess.stdout.on('data', (data) => {
			process.stdout.write(data)

			stdout += data
		})

		childProcess.on('close', (code) => {
			process.off('SIGINT', forwardSigint)

			if (code === 0) {
				resolve({ stdout, stderr })
			} else {
				const error = new Error(stderr)

				error.code = code

				reject(error)
			}
		})
	})
}

/**
 * @param {import("node:child_process").spawn} spawn 
 */
module.exports.makeSpawnTag = function makeSpawnTag(spawn = nodeSpawn) {
	const $ = function (tpl, ...tplArgs) {
		if (!Array.isArray(tpl)) {
			return $.bind({
				contextIsSpawnOptions: Symbol.for('contextIsSpawnOptions'),
				...tpl
			})
		}

		const contextIsSpawnOptions = 'contextIsSpawnOptions' in this && this['contextIsSpawnOptions'] === Symbol.for('contextIsSpawnOptions')

		const spawnOptions = contextIsSpawnOptions ? this : {}

		return new Promise((resolve, reject) => {
			const text = tpl
				.map((item) => [item.replace(/\n/g, ' '), tplArgs.shift()])
				.flat()
				.filter(Boolean)
				.join('')

			let expr = text

			const matchVar = /^([\w]+)=('(?:[^']|\\')*'|"(?:[^"]|\\")*"|(?:[^ ]|\\ )+|) */

			const env = {}

			while (matchVar.test(expr)) {
				const [input, name, value] = matchVar.exec(expr)

				env[name] = value

				expr = expr.slice(matchVar.lastIndex + input.length)
			}

			const sep = randomUUID()

			const [cmd, ...cmdArgs] = expr
				.replace(/([^\\]["']|\b) /g, (_, $) => `${$}${sep}`)
				.split(sep)

			console.log('$', text)

			const cp = spawn(cmd, cmdArgs, { ...(contextIsSpawnOptions ? spawnOptions : {}), env: { ...process.env, ...env }, shell: true })

			follow(cp).then(resolve).catch(reject)
		})
	}

	return $
}