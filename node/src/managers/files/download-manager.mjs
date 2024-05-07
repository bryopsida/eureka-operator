import { mkdir, stat, unlink, chmod } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { arch } from 'node:os'
import { createHash } from 'node:crypto'
import { chown, createReadStream, createWriteStream } from 'node:fs'
import { get } from 'node:https'

export class DownloadManager {
  #settings = {}
  #arch
  #logger

  constructor (opts) {
    if (opts == null) throw new Error('opts must be provided!')
    if (opts.downloadFolder == null) throw new Error('opts.downloadFolder must be provided!')
    if (opts.logger != null) this.#logger = opts.logger
    this.#settings.downloadFolder = opts.downloadFolder
    this.#arch = arch()
  }

  async #ensureDownloadFolderExists () {
    try {
      const result = await stat(resolve(this.#settings.downloadFolder))
      if (!result.isDirectory()) await this.#makeDownloadFolder()
    } catch {
      await this.#makeDownloadFolder()
    }
  }

  async #makeDownloadFolder () {
    const resolvedPath = resolve(this.#settings.downloadFolder)
    await mkdir(resolvedPath, {
      recursive: true
    })
    await chmod(resolvedPath, 0o0750)
    await chown(resolvedPath, process.getuid(), 0)
  }

  async ensureFilesAreDownloaded (fileDescriptors) {
    // ensure download file exists
    await this.#ensureDownloadFolderExists()
    for (const fileDescriptor of fileDescriptors) {
      await this.ensureFileIsDownloaded(fileDescriptor)
    }
  }

  async ensureFileIsDownloaded (fileDescriptor) {
    if (fileDescriptor == null) throw new Error('You must provide a file descriptor!')
    if (fileDescriptor.url == null) throw new Error('A file descriptor must have a url property!')
    if (fileDescriptor.fileName == null) throw new Error('A file descriptor must have a fileName property!')
    if (fileDescriptor.hash == null) throw new Error('A file descriptor must provide a hash to verify file integrity!')
    if (fileDescriptor.arch != null && fileDescriptor.arch !== this.#arch) {
      this.#logger.debug(`Skipping download for ${fileDescriptor.url}, arch ${fileDescriptor.arch} != ${this.#arch}`)
      return
    }
    this.#logger?.log(`Ensuring ${fileDescriptor.url} is downloaded`)
    if (await this.#isFileAlreadyDownloaded(fileDescriptor.fileName, fileDescriptor.hash)) return
    this.#logger?.log(`Downloading ${fileDescriptor.url}`)
    await this.#downloadFile(fileDescriptor.url, fileDescriptor.fileName)
    if (!await this.#doesHashMatch(fileDescriptor.fileName, fileDescriptor.hash)) {
      this.#logger?.error(`Downloaded copy of ${fileDescriptor.url}, does match expected sha256 hash ${fileDescriptor.hash}`)
      await this.#deleteFile(fileDescriptor.fileName)
    }
  }

  #getFullPath (fileName) {
    return resolve(join(this.#settings.downloadFolder, fileName))
  }

  async #isFileAlreadyDownloaded (fileName, hash) {
    try {
      const path = this.#getFullPath(fileName)
      const result = await stat(path)
      if (!result.isFile()) return false
      return this.#doesHashMatch(path, hash)
    } catch {
      return false
    }
  }

  async #doesHashMatch (fileName, hashDigest) {
    // assume sha256
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256')
      const stream = createReadStream(fileName)
      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => {
        const hashResult = hash.digest('hex')
        resolve(hashResult === hashDigest)
      })
      stream.on('error', (err) => reject(err))
    })
  }

  async #downloadFile (url, fileName) {
    const dest = this.#getFullPath(fileName)
    return new Promise((resolve, reject) => {
      const file = createWriteStream(dest)
      get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file)
        } else {
          file.close()
          this.#deleteFile(fileName).then(() => {
            reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`))
          }).catch(reject)
        }
      })

      file.on('finish', () => {
        file.close(resolve)
      })

      file.on('error', (err) => {
        this.#deleteFile().then(() => {
          reject(err)
        }).catch(reject)
      })
    })
  }

  async #deleteFile (fileName) {
    const dest = this.#getFullPath(fileName)
    await unlink(dest)
  }
}
