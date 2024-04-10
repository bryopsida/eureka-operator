import { EventEmitter } from 'node:events'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { watch, readFileSync } from 'node:fs'

export class OperatorConfig extends EventEmitter {
  constructor (opts) {
    if (!opts) throw new Error('OperatorConfig constructor requires an opts object!')
    if (!opts.configFilePath) throw new Error('OperatorConfig constructor requires opts.configFilePath to be provided!')
    super()
    this._configFilePath = resolve(opts.configFilePath)
    this._configContents = readFileSync(this._configFilePath)
    const parsedContents = JSON.parse(this._configContents)
    this.emit('config-change', parsedContents)

    // start watching the file
    this._watch = watch(this._configFilePath, {
      encoding: 'utf8'
    }, this._fileChanged.bind(this))
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
