import { executeCommand, executeCommandWithJsonResponse } from '../../executors/node-proc.mjs'

const PRO_BINARY = '/usr/bin/pro'
const STATUS_CMD = `${PRO_BINARY} status --format=json`
const ATTACH_CMD = `${PRO_BINARY} attach`
export class UbuntuProManager {
  constructor (options) {
    this._attached = false
    this._log = options.logger
  }

  async ensureMachineIsAttached (proToken) {
    if (!await this.#isAttached()) {
      await this.#attach(proToken)
    }
  }

  async #isAttached () {
    if (this._attached) return Promise.resolve(true)
    try {
      this._log?.debug('checking ubuntu pro attachment status')
      const resp = await executeCommandWithJsonResponse(STATUS_CMD, 0)
      this._attached = resp.attached
      this._log?.debug(`ubuntu pro status: ${this._attached}`)
    } catch (err) {
      this._log?.error('error while checking pro attachment: ', err)
      return false
    }
    return this._attached
  }

  async #attach (token) {
    try {
      this._log?.debug('Attaching pro subscription')
      await executeCommand(`${ATTACH_CMD} ${token}`, 0)
      this._log?.debug('Finished attaching pro subscription')
    } catch (err) {
      this._log?.error('Error while attaching subscription: ', err)
    }
  }
}
