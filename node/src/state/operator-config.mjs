import { EventEmitter } from 'node:events'
import { resolve, dirname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { watch, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { randomBytes, randomUUID } from 'node:crypto'

export class OperatorConfig extends EventEmitter {
  constructor (opts) {
    if (!opts) throw new Error('OperatorConfig constructor requires an opts object!')
    if (!opts.configFilePath) throw new Error('OperatorConfig constructor requires opts.configFilePath to be provided!')
    super()
    this._configFilePath = resolve(opts.configFilePath)
    // check if the file exists
    if (!this.doesConfigFileExists(this._configFilePath)) {
      const config = this.generateConfig()
      this.saveConfig(config)
    }
    this._configContents = readFileSync(this._configFilePath)
    const parsedContents = JSON.parse(this._configContents)
    this.emit('config-change', parsedContents)

    // start watching the file
    this._watch = watch(this._configFilePath, {
      encoding: 'utf8'
    }, this._fileChanged.bind(this))
  }

  /**
   *
   * @returns {boolean} true is config file exists
   */
  doesConfigFileExists (path) {
    try {
      const result = statSync(path)
      if (!result) return false
      return result.isFile()
    } catch (_err) {
      return false
    }
  }

  /**
   * Generate a default configuration object
   */
  generateConfig () {
    const password = randomBytes(32).toString('base64')
    const salt = randomBytes(16).toString('base64')
    const id = `eureka-op-${randomUUID()}`
    const port = 515151
    const multicastGroup = '240.0.0.1'
    return {
      server: {
        port,
        multicastGroups: [multicastGroup]
      },
      crypto: {
        salt,
        password
      },
      beaconInterval: 60000,
      beacon: {
        id
      }
    }
  }

  /**
   * Write the configuration to disk
   * @param {any} config
   */
  saveConfig (config) {
    const directoryPath = dirname(this._configFilePath)
    if (!this.doesConfigFileExists(directoryPath)) {
      mkdirSync(directoryPath, {
        recursive: true
      })
    }
    writeFileSync(this._configFilePath, JSON.stringify(config, null, 2), {
      encoding: 'utf8'
    })
  }

  async getConfig () {
    const contents = await readFile(this._configFilePath, {
      encoding: 'utf8'
    })
    try {
      const parsedContents = JSON.parse(this._configContents)
      if (this._configContents !== contents) {
        this._configContents = contents
        this.emit('config-change', parsedContents)
      }
      return parsedContents
    } catch (err) {
      this.emit('parse-error', err)
      throw err
    }
  }

  async _fileChanged (evtType) {
    if (evtType === 'changed') {
      await this.getConfig()
    }
  }

  cleanup () {
    this._watch.close()
  }
}
