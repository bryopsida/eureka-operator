import { executeCommand } from '../../executors/node-proc.mjs'

const DPKG_PATH = '/usr/bin/dpkg'
const APT_GET_PATH = '/usr/bin/apt-get'

export class AptManager {
  #packageStatusCache = {}

  constructor (options) {
    if (options.logger) {
      this._logger = options.logger
    }
  }

  ensureRepositoryExists (repoInfo) {
    throw new Error('Not implemented')
  }

  async ensurePackagesAreInstalled (packageList) {
    for (const pkg of packageList) {
      if (!await this.#isPackageInstalled(pkg)) await this.#installPackage(pkg)
    }
  }

  isRestartNeeded () {

  }

  async #isPackageInstalled (packageName) {
    if (this.#packageStatusCache[packageName] === true) return Promise.resolve(true)
    try {
      this._logger?.log(`Checking if ${packageName} is installed`)
      const execResult = await executeCommand(`${DPKG_PATH} -s ${packageName}`)
      const isInstalled = execResult.indexOf('Status: install ok installed') !== -1
      this._logger?.log(`Determined package ${packageName} installation status = ${isInstalled}`)
      this.#packageStatusCache[packageName] = isInstalled
      return isInstalled
    } catch {
      return false
    }
  }

  async #installPackage (packageName) {
    this._logger?.log(`Installing package ${packageName}`)
    await executeCommand(`${APT_GET_PATH} install -y ${packageName}`, 0)
    this._logger?.log(`Finished installing package ${packageName}`)
    this.#packageStatusCache[packageName] = true
  }
}
