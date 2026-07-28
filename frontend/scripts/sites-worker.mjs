import { access, copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = resolve(projectDirectory, 'dist')
const hostingConfig = resolve(projectDirectory, '.openai', 'hosting.json')

await mkdir(resolve(outputDirectory, 'server'), { recursive: true })

await copyFile(
  resolve(projectDirectory, 'worker', 'index.js'),
  resolve(outputDirectory, 'server', 'index.js'),
)

try {
  await access(hostingConfig)
  await mkdir(resolve(outputDirectory, '.openai'), { recursive: true })
  await copyFile(
    hostingConfig,
    resolve(outputDirectory, '.openai', 'hosting.json'),
  )
} catch (error) {
  if (error.code !== 'ENOENT') {
    throw error
  }
}
