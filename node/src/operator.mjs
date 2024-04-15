import { OperatorConfig } from './operator-config.mjs'
import { EurekaOperatorComms } from './comms.mjs'

export class EurekaOperator {
  constructor (options) {
    if (!options.configManager) throw new Error('options.configManager must be defined!')
    if (!(options.configManager instanceof OperatorConfig)) throw new Error('expect options.configManager to be a OperatorConfig!')
    if (!options.comms) throw new Error('options.comms must be defined!')
    if (!(options.comms instanceof EurekaOperatorComms)) throw new Error('options.comms must be an instance of EurekaOperatorComms!')
    this.configManager = options.configManager
    this.comms = options.comms
    this.comms.on('message', (msg) => {
      console.log(msg)
    })
  }

  onMessage (msg) {

  }

  async cleanup () {

  }
}
