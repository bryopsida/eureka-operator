import { Eureka } from '@bryopsida/eureka'
import {EventEmitter} from 'node:events'

export class EurekaOperatorComms extends EventEmitter {
  constructor (opts) {
    if (!opts.beaconInterval) throw new Error('opts.beaconInterval is required!')
    if (!opts.id) throw new Error('opts.id is required!')
    if (!opts.password && !opts.passwordProvider) throw new Error('opts.password or opts.passwordProvider are required!')
    if (!opts.salt && !opts.saltProvider) throw new Error('opts.salt or opts.saltProvider are required!')
    super()
    this._eureka = new Eureka({
      
    })
  }
}
