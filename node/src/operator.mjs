import { UbuntuProManager } from './managers/ubuntu/pro-manager.mjs'
import { OperatorConfig } from './state/operator-config.mjs'
import { EurekaOperatorComms } from './transports/multicast-comms.mjs'
import { AptManager } from './managers/packages/apt-manager.mjs'

export class EurekaOperator {
  constructor (options) {
    if (!options.configManager) throw new Error('options.configManager must be defined!')
    if (!(options.configManager instanceof OperatorConfig)) throw new Error('expect options.configManager to be a OperatorConfig!')

    if (!options.comms) throw new Error('options.comms must be defined!')
    if (!(options.comms instanceof EurekaOperatorComms)) throw new Error('options.comms must be an instance of EurekaOperatorComms!')

    if (!(options.ubuntuProManager)) throw new Error('options.ubuntuProManager must be defined!')
    if (!(options.ubuntuProManager instanceof UbuntuProManager)) throw new Error('options.ubuntuProManager must be an instance of UbuntuProManager!')

    if (!(options.aptManager)) throw new Error('options.aptManager must be defiend!')
    if (!(options.aptManager instanceof AptManager)) throw new Error('options.aptManager must be an instance of AptManager!')

    this.comms = options.comms
    this.configManager = options.configManager
    this.ubuntuProManager = options.ubuntuProManager
    this.aptManager = options.aptManager

    this.comms.on('message', async (msg) => {
      console.log(msg)
      await this.onMessage(msg)
    })
  }

  async onMessage (msg) {
    try {
      if (msg.ubuntu) {
        if (msg.ubuntu.pro) await this.ubuntuProManager.ensureMachineIsAttached(msg.ubuntu.pro)
      }
      if (msg.apt && Array.isArray(msg.apt)) {
        console.log('ensuring packages are installed ', msg.apt)
        await this.aptManager.ensurePackagesAreInstalled(msg.apt)
      }
    } catch (err) {
      console.error('Error while processing msg: ', err)
    }
  }

  async cleanup () {

  }
}
