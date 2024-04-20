// create folder for
import { mkdir, stat, rm, cp, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { platform } from 'node:os'
import { execSync } from 'node:child_process'

const seaConfig = {
  main: resolve(join('dist', 'app.cjs')),
  output: resolve(join('build', 'app.blob')),
  disableExperimentalSEAWarning: true,
  useCodeCache: false,
  useSnapshot: false
}

const os = platform()
const buildFolder = resolve(process.cwd(), 'build')
const statResult = await stat(buildFolder)
if (statResult.isDirectory()) {
  await rm(buildFolder, {
    force: true,
    recursive: true
  })
}
await mkdir(resolve(join(process.cwd(), 'build')))

const seaConfigPath = resolve(join('build', 'sea-config.json'))
await writeFile(seaConfigPath, JSON.stringify(seaConfig), {
  encoding: 'utf8'
})

execSync(`node --experimental-sea-config ${seaConfigPath}`)

const pathToNode = resolve(process.argv[0])
let nodeDest = join(buildFolder, 'eureka-operator')

if (os === 'win32') {
  nodeDest += '.exe'
}

await cp(pathToNode, nodeDest)

if (os === 'win32') {
  const cmd = `signtool remove /s ${nodeDest}`
  execSync(cmd)
} else if (os === 'darwin') {
  const cmd = `codesign --remove-signature ${nodeDest}`
  execSync(cmd)
}

const blobPath = seaConfig.output

if (os === 'darwin') {
  execSync(`npx postject ${nodeDest} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`)
  execSync(`codesign --sign - ${nodeDest}`)
} else if (os === 'win32') {
  execSync(`npx postject ${nodeDest} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`)
  execSync(`signtool sign /fd SHA256 ${nodeDest}`)
} else {
  execSync(`npx postject ${nodeDest} NODE_SEA_BLOB ${blobPath} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`)
}
