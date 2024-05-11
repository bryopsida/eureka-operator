#!/usr/bin/env node

import { EurekaOperatorComms, OperatorConfig, EurekaOperator, UbuntuProManager, AptManager, DownloadManager, RebootManager, OperatorCmdHistory, CmdManager } from './lib.mjs'

import { resolve, join } from 'node:path'

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
    beacon: config.beacon
  })

  const ubuntuProManager = new UbuntuProManager({
    logger: console
  })

  const aptManager = new AptManager({
    logger: console
  })

  const downloadManager = new DownloadManager({
    downloadFolder: resolve(join(process.cwd(), 'downloads')),
    logger: console
  })

  const rebootManager = new RebootManager({
    logger: console
  })

  const cmdHistory = new OperatorCmdHistory()

  const cmdManager = new CmdManager({
    logger: console,
    cmdHistory
  })

  const operator = new EurekaOperator({
    configManager,
    ubuntuProManager,
    aptManager,
    downloadManager,
    rebootManager,
    cmdManager,
    comms,
    logger: console
  })

  async function cleanup () {
    rebootManager.cleanup()
    configManager.cleanup()
    await operator.cleanup()
    await comms.close()
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
})
