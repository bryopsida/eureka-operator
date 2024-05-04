#!/usr/bin/env node
import { mkdir, stat, rm, cp, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

const seaConfig = {
  main: './app.cjs',
  output: './app.blob',
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
  useSnapshot: false
}

const inputFolder = resolve(process.cwd(), 'sea-input-artifact')
try {
  const statResult = await stat(inputFolder)
  if (statResult.isDirectory()) {
    await rm(inputFolder, {
      force: true,
      recursive: true
    })
  }
} catch (_err) {}

await mkdir(inputFolder)

const seaConfigPath = resolve(join(inputFolder, 'sea-config.json'))
await writeFile(seaConfigPath, JSON.stringify(seaConfig), {
  encoding: 'utf8'
})

await cp(resolve(join(process.cwd(), 'dist', 'app.cjs')), resolve(join(inputFolder, 'app.cjs')))
