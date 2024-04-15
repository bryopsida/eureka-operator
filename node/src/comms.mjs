import { Eureka } from '@bryopsida/eureka'
import { EventEmitter } from 'node:events'

export class EurekaOperatorComms extends EventEmitter {
  constructor (opts) {
    if (!opts.beaconInterval) { throw new Error('opts.beaconInterval is required!') }
    if (!opts.id) throw new Error('opts.id is required!')
    if (!opts.password && !opts.passwordProvider) { throw new Error('opts.password or opts.passwordProvider are required!') }
    if (!opts.salt && !opts.saltProvider) { throw new Error('opts.salt or opts.saltProvider are required!') }
    if (!opts.beacon && !opts.beaconProvider) { throw new Error('opts.beacon or opts.beaconProvider are required!') }
    super()
    this.eureka = new Eureka({
      messageInterval: opts.beaconInterval,
      messageData: opts.beacon,
      crypto: {
        salt: opts.salt,
        password: opts.password
      },
      server: {
        port: 51515
      },
      logger: opts.logger
    })
    this.eureka.on('message', (msg) => {
      this.emit('message', msg)
    })
  }

  async close () {
    await this.eureka.close()
  }
}
