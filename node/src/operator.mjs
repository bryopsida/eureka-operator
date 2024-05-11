import { UbuntuProManager } from './managers/ubuntu/pro-manager.mjs'
import { OperatorConfig } from './state/operator-config.mjs'
import { EurekaOperatorComms } from './transports/multicast-comms.mjs'
import { AptManager } from './managers/packages/apt-manager.mjs'
import { DownloadManager } from './managers/files/download-manager.mjs'
import { RebootManager } from './managers/ubuntu/reboot-manager.mjs'
import { CmdManager } from './managers/cmd/cmd-manager.mjs'

export class EurekaOperator {
  #messages = []

  #cmdManager

  constructor (options) {
    if (!options.configManager) throw new Error('options.configManager must be defined!')
    if (!(options.configManager instanceof OperatorConfig)) throw new Error('expect options.configManager to be a OperatorConfig!')

    if (!options.comms) throw new Error('options.comms must be defined!')
    if (!(options.comms instanceof EurekaOperatorComms)) throw new Error('options.comms must be an instance of EurekaOperatorComms!')

    if (!(options.ubuntuProManager)) throw new Error('options.ubuntuProManager must be defined!')
    if (!(options.ubuntuProManager instanceof UbuntuProManager)) throw new Error('options.ubuntuProManager must be an instance of UbuntuProManager!')

    if (!(options.aptManager)) throw new Error('options.aptManager must be defiend!')
    if (!(options.aptManager instanceof AptManager)) throw new Error('options.aptManager must be an instance of AptManager!')

    if (!options.downloadManager) throw new Error('options.downloadManager must be defined!')
    if (!(options.downloadManager instanceof DownloadManager)) throw new Error('options.downloadManager must be an instance of DownloadManager!')

    if (!options.rebootManager) throw new Error('options.rebootManager must be defined!')
    if (!(options.rebootManager instanceof RebootManager)) throw new Error('options.rebootManager must be an instance of RebootManager!')

    if (!options.cmdManager) throw new Error('options.cmdManager must be provided!')
    if (!(options.cmdManager instanceof CmdManager)) throw new Error('options.cmdManager must be an instance of CmdManager!')

    this.comms = options.comms
    this.configManager = options.configManager
    this.ubuntuProManager = options.ubuntuProManager
    this.aptManager = options.aptManager
    this.downloadManager = options.downloadManager
    this.rebootManager = options.rebootManager
    this.#cmdManager = options.cmdManager

    this.comms.on('message', async (msg) => {
      await this.onMessage(msg)
    })

    this.msgProcessInterval = setInterval(this.emptyMessageQueue.bind(this), 1000)
  }

  async emptyMessageQueue () {
    const messages = this.#messages
    this.#messages = []
    for (const msg of messages) {
      await this.processMessage(msg)
    }
  }

  async processMessage (msg) {
    try {
      if (msg.ubuntu) {
        if (msg.ubuntu.pro) await this.ubuntuProManager.ensureMachineIsAttached(msg.ubuntu.pro)
      }
      if (msg.apt && Array.isArray(msg.apt)) {
        console.log('ensuring packages are installed ', msg.apt)
        await this.aptManager.ensurePackagesAreInstalled(msg.apt)
      }
      if (msg.downloads && Array.isArray(msg.downloads)) {
        await this.downloadManager.ensureFilesAreDownloaded(msg.downloads)
      }
      if (msg.cmds && Array.isArray(msg.cmds)) {
        await this.#cmdManager.ensureCommandsHaveBeenProcessed(msg.cmds)
      }
    } catch (err) {
      console.error('Error while processing msg: ', err)
    }
  }

  async onMessage (msg) {
    this.#messages.push(msg)
  }

  async cleanup () {
    if (this.msgProcessInterval) {
      clearInterval(this.msgProcessInterval)
    }
  }
}
