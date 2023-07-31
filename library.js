const { spawn: nodeSpawn } = require('node:child_process')
const { randomUUID } = require('node:crypto')
const process = require('node:process')

function follow(childProcess) {
	return new Promise((resolve, reject) => {
		let stderr = ''
		let stdout = ''

		childProcess.stderr.on('data', (data) => {
			process.stderr.write(data)

			stderr += data
		})

		childProcess.stdout.on('data', (data) => {
			process.stdout.write(data)

			stdout += data
		})

		childProcess.on('error', (error) => {
			reject(error)
		})

		childProcess.on('close', (code) => {
			if (code === 0) {
				resolve({ stdout, stderr })
			} else {
				const error = new Error(stdout + stderr)

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
	return async function (tpl, ...tplArgs) {
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

		const cp = spawn(cmd, cmdArgs, { env: { ...process.env, ...env }, shell: true })

		const resp = await follow(cp)

		return resp
	}
}