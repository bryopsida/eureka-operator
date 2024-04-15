#!/usr/bin/env node

import { EurekaOperatorComms } from './src/comms.mjs'
import { OperatorConfig } from './src/operator-config.mjs'
import { EurekaOperator } from './src/operator.mjs'

const configFilePath = process.env.EUREKA_CONFIG_FILE ?? './config/eureka.config.json'
const configManager = new OperatorConfig({
  configFilePath,
  logger: console
})

const config = await configManager.getConfig()
const comms = new EurekaOperatorComms({
  beaconInterval: config.beaconInterval,
  salt: Buffer.from(config.crypto.salt, 'base64'),
  password: Buffer.from(config.crypto.password, 'base64'),
  id: config.beacon.id,
  beacon: config.beacon,
  logger: console
})

const operator = new EurekaOperator({
  configManager,
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
