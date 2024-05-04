#!/usr/bin/env node

import { EurekaOperatorComms } from './transports/multicast-comms.mjs'
import { OperatorConfig } from './state/operator-config.mjs'
import { EurekaOperator } from './operator.mjs'
import { UbuntuProManager } from './managers/ubuntu/pro-manager.mjs'
import { AptManager } from './managers/packages/apt-manager.mjs'

if (process.env.EUREKA_UID) {
  const serviceUID = parseInt(process.env.EUREKA_UID)
  console.log(`Dropping permissions and switching to: ${serviceUID}`)
  process.seteuid(serviceUID)
} else {
  console.log(`Retaining permissions of ${process.getuid()}:${process.getgid()}`)
}

const configFilePath = process.env.EUREKA_CONFIG_FILE ?? './config/eureka.config.json'
const configManager = new OperatorConfig({
  configFilePath,
  logger: console
})

configManager.getConfig().then((config) => {
  const comms = new EurekaOperatorComms({
    beaconInterval: config.beaconInterval,
    salt: Buffer.from(config.crypto.salt, 'base64'),
    password: Buffer.from(config.crypto.password, 'base64'),
    id: config.beacon.id,
    beacon: config.beacon,
    logger: console
  })

  const ubuntuProManager = new UbuntuProManager({
    logger: console
  })

  const aptManager = new AptManager({
    logger: console
  })

  const operator = new EurekaOperator({
    configManager,
    ubuntuProManager,
    aptManager,
    comms,
    logger: console
  })

  async function cleanup () {
    configManager.cleanup()
    await operator.cleanup()
    await comms.close()
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
})
