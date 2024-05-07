import { stat } from 'node:fs/promises'
import { uptime } from 'node:os'

import { executeCommand } from '../../executors/node-proc.mjs'

const REBOOT_REQUIRED_PATH = '/var/run/reboot-required'
const SHUTDOWN_COMMAND = '/usr/sbin/shutdown -r 15 minutes'
const REBOOT_CHECK_INTERVAL = 3600000

export class RebootManager {
  #restartCooldownSeconds
  #notBeforeTime
  #notAfterTime
  #restartCheckInterval

  constructor (opts) {
    if (!opts) throw new Error('opts must be provided!')
    if (opts.logger) {
      this._logger = opts.logger
    }
    this.#restartCooldownSeconds = opts.restartCooldownSeconds ?? 3600 // 1 hour
    this.#notBeforeTime = opts.notBeforeTime ?? 22
    this.#notAfterTime = opts.notAfterTime ?? 5

    this.#restartCheckInterval = setInterval(this.#restartCheck.bind(this), REBOOT_CHECK_INTERVAL)
  }

  async isRebootNeeded () {
    try {
      const statResult = await stat(REBOOT_REQUIRED_PATH)
      return statResult.isFile()
    } catch {
      return false
    }
  }

  async startReboot () {
    // check uptime, do not exceed cooldown
    if (!this.#isOutsideCooldown()) {
      this._logger?.debug(`startReboot was called but we are still inside the cool down period with an uptime of ${uptime()}`)
      return
    }
    if (!this.#isInAllowedWindow()) {
      this._logger?.debug(`startReboot was called but we are not in a valid restart window, restarts can occur before ${this.#notAfterTime}, after ${this.#notBeforeTime}, current = ${new Date().getHours()}`)
      return
    }
    await this.#restart()
  }

  async #restartCheck () {
    if (this.isRebootNeeded()) await this.startReboot()
  }

  async #restart () {
    // trigger a restart
    await executeCommand(SHUTDOWN_COMMAND)
  }

  #isOutsideCooldown () {
    return uptime() >= this.#restartCooldownSeconds
  }

  #isInAllowedWindow () {
    const hours = new Date().getHours()
    return hours > this.#notBeforeTime && hours < this.#notAfterTime
  }

  cleanup () {
    if (this.#restartCheckInterval) {
      clearInterval(this.#restartCheckInterval)
    }
  }
}
