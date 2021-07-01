/* eslint-env mocha */

const version = '1.15.2'
const ChunkDumper = require('../index.js')
const chunkDumper = new ChunkDumper(version)
const fs = require('fs').promises
const path = require('path')
const assert = require('assert')
const fsOriginal = require('fs')
const { makeLocalPath } = require('./util')

describe('chunkDumper lib', function () {
  this.timeout(120000)
  before('can start', async () => {
    await chunkDumper.start()
  })

  it('can receive a chunk event', async () => {
    await new Promise(resolve => chunkDumper.on('chunk', () => resolve()))
  })

  it('can save a chunk', async () => {
    const filesPaths = [
      makeLocalPath('chunk.dump'),
      makeLocalPath('chunk.meta'),
      makeLocalPath('chunk_light.dump'),
      makeLocalPath('chunk_light.meta'),
      makeLocalPath('tileEntities.meta')
    ]
    await chunkDumper.saveChunk(...filesPaths)
    for (const file of filesPaths) {
      await fs.access(file, fsOriginal.constants.F_OK)
      await fs.unlink(file)
    }
  })

  it('can save 10 chunks', async () => {
    await chunkDumper.saveChunks(makeLocalPath('chunks'), 10)
    const dirContent = await fs.readdir(makeLocalPath('chunks'))
    assert(dirContent.length >= 40, 'should have at least 40 files')
    for (const file of dirContent) {
      await fs.unlink(makeLocalPath('chunks', file))
    }
    await fs.rmdir(makeLocalPath('chunks'))
  })

  it('can save chunks continuously', async () => {
    chunkDumper.startSavingChunks(makeLocalPath('chunks'))
    await new Promise((resolve) => setTimeout(() => {
      chunkDumper.stopSavingChunks(makeLocalPath('chunks'))
      resolve()
    }, 10000))

    const dirContent = await fs.readdir(makeLocalPath('chunks'))
    assert.notStrictEqual(dirContent.length, 0)
    for (const file of dirContent) {
      await fs.unlink(makeLocalPath('chunks', file))
    }
    await fs.rmdir(path.join(__dirname, 'chunks'))
  })

  after('can stop', async () => {
    await chunkDumper.stop()
  })
})
