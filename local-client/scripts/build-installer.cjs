const { existsSync, mkdirSync, readdirSync, statSync } = require('fs')
const { join, resolve } = require('path')
const { homedir } = require('os')
const { spawnSync } = require('child_process')

const root = join(__dirname, '..')
const version = require(join(root, 'package.json')).version || '0.1.0'
const releaseDirName = process.env.M2C_RELEASE_DIR || 'release-manual'
const releaseDir = join(root, releaseDirName)
const appSource = join(releaseDir, 'win-unpacked')
const outputFile = join(releaseDir, `Markdown2Card-Setup-${version}-x64.exe`)
const installerScript = join(root, 'scripts', 'installer.nsi')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: false,
    stdio: 'inherit',
    ...options
  })
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1)
}

function commandName(name) {
  if (process.platform !== 'win32') return name
  if (name === 'npm') return 'npm.cmd'
  if (name === 'where') return 'where.exe'
  return name
}

function findInDir(dir, fileName, depth = 5) {
  if (!existsSync(dir) || depth < 0) return ''
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) return fullPath
    if (entry.isDirectory()) {
      const found = findInDir(fullPath, fileName, depth - 1)
      if (found) return found
    }
  }
  return ''
}

function findMakeNsis() {
  const fromPath = spawnSync(commandName('where'), ['makensis'], { shell: false, encoding: 'utf8' })
  const firstPath = fromPath.stdout?.split(/\r?\n/).find(Boolean)
  if (firstPath && existsSync(firstPath)) return firstPath

  const cacheRoots = [
    join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'electron-builder', 'Cache'),
    join(homedir(), 'AppData', 'Local', 'electron-builder', 'Cache')
  ]
  for (const cacheRoot of cacheRoots) {
    const found = findInDir(cacheRoot, 'makensis.exe')
    if (found) return found
  }
  return ''
}

process.env.M2C_RELEASE_DIR = releaseDirName
run(commandName('node'), [join('scripts', 'package-win.cjs')], { env: process.env })

if (!existsSync(appSource)) {
  console.error(`Missing packaged app source: ${appSource}`)
  process.exit(1)
}

mkdirSync(releaseDir, { recursive: true })
const makensis = findMakeNsis()
if (!makensis) {
  console.error('NSIS makensis.exe was not found. Run electron-builder once or install NSIS, then retry.')
  process.exit(1)
}

run(makensis, [
  '/V2',
  `/DAPP_SOURCE=${resolve(appSource)}`,
  `/DOUT_FILE=${resolve(outputFile)}`,
  `/DAPP_VERSION=${version}`,
  resolve(installerScript)
])

const installer = statSync(outputFile)
if (installer.size < 1024 * 1024) {
  console.error(`Installer looks too small: ${outputFile}`)
  process.exit(1)
}

console.log(`Installer created: ${outputFile}`)
