import { spawn } from 'node:child_process'

export class ExecErrorWrapper extends Error {
  constructor (msg, code, stdOut) {
    super(msg)
    this.exitCode = code
    this.stdout = stdOut
  }
}

export function executeCommand (cmd, id) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const parts = cmd.split(' ')
    spawn(parts[0], parts.slice(1), {
      shell: false,
      uid: id
    })
      .on('error', (err) => {
        return reject(err)
      })
      .on('close', (code) => {
        const data = Buffer.concat(chunks).toString('utf-8')
        if (code !== 0) {
          console.error(`Command exited with status: ${code}`)
          console.error(data)
          return reject(new ExecErrorWrapper('Command exited with non 0 code', code, data))
        }
        return resolve(data)
      }).stdout.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk))
      })
  })
}

export async function executeCommandWithJsonResponse (cmd, id) {
  const result = await executeCommand(cmd, id)
  return JSON.parse(result)
}
