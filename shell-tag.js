import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import process from 'node:process'

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
				const error = new Error(stderr)

				error.code = code

				reject(error)
			}
		})
	})
}

export async function $(tpl, ...tplArgs) {
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

	const [cmd, ...cmdArgs] = expr.replace(/([^\\]["']|\b) /g, (_, $) => `${$}${sep}`).split(sep)

	console.log('$', text)

	console.table({
		cmd,
		args: cmdArgs,
		env
	})

	const cp = spawn(cmd, cmdArgs, { shell: 'bash', env: { ...process.env, ...env } })

	const resp = await follow(cp)

	return resp
}
