const { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, renameSync, statSync } = require('fs')
const { homedir } = require('os')
const { join } = require('path')
const { spawnSync } = require('child_process')

const root = join(__dirname, '..')
const releaseDir = process.env.M2C_RELEASE_DIR
  ? join(root, process.env.M2C_RELEASE_DIR)
  : join(root, 'release')
const unpackedDir = join(releaseDir, 'win-unpacked')
const stageDir = join(releaseDir, 'app-stage')
const electronRuntimeDir = join(root, 'node_modules', 'electron', 'dist')
const sourceFontDirs = [
  join(root, 'fonts'),
  join(root, 'font')
]
const appExeName = 'Markdown2Card.exe'
const appIconPath = join(root, 'build', 'icon.ico')

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    shell: true,
    stdio: 'inherit'
  })
  return result.status ?? 1
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

function findRcedit() {
  const cacheRoots = [
    join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'electron-builder', 'Cache'),
    join(homedir(), 'AppData', 'Local', 'electron-builder', 'Cache')
  ]
  for (const cacheRoot of cacheRoots) {
    const found = findInDir(cacheRoot, 'rcedit-x64.exe')
    if (found) return found
  }

  const vendorRcedit = join(root, 'node_modules', 'electron-winstaller', 'vendor', 'rcedit.exe')
  return existsSync(vendorRcedit) ? vendorRcedit : ''
}

function patchExecutableIcon(exePath) {
  if (!existsSync(appIconPath)) {
    console.error(`Missing icon file: ${appIconPath}`)
    return 1
  }

  const rcedit = findRcedit()
  if (!rcedit) {
    console.error('rcedit was not found. Run electron-builder once or install electron-winstaller, then retry.')
    return 1
  }

  return run(rcedit, [
    exePath,
    '--set-icon',
    appIconPath,
    '--set-version-string',
    'FileDescription',
    'Markdown2Card',
    '--set-version-string',
    'ProductName',
    'Markdown2Card',
    '--set-version-string',
    'CompanyName',
    'LinshuTech',
    '--set-version-string',
    'OriginalFilename',
    appExeName
  ])
}

function cleanInstallerArtifacts() {
  if (!existsSync(releaseDir)) return
  for (const name of readdirSync(releaseDir)) {
    if (/Setup-.*\.exe$|\.blockmap$|\.nsis\.7z$|^builder-debug\.yml$/.test(name)) {
      rmSync(join(releaseDir, name), { force: true })
    }
  }
}

function copyRequiredAppFiles() {
  cpSync(join(root, 'dist'), join(stageDir, 'dist'), { recursive: true })
  cpSync(join(root, 'electron'), join(stageDir, 'electron'), { recursive: true })
  cpSync(join(root, 'build'), join(stageDir, 'build'), { recursive: true })
  copyFileSync(join(root, 'package.json'), join(stageDir, 'package.json'))
}

function assembleExecutableApp() {
  if (!existsSync(electronRuntimeDir)) return 1

  cleanInstallerArtifacts()
  rmSync(unpackedDir, { recursive: true, force: true })
  rmSync(join(releaseDir, 'win-unpacked.tmp'), { recursive: true, force: true })
  rmSync(stageDir, { recursive: true, force: true })
  mkdirSync(unpackedDir, { recursive: true })
  mkdirSync(stageDir, { recursive: true })

  cpSync(electronRuntimeDir, unpackedDir, { recursive: true })
  const outputFontsDir = join(unpackedDir, 'fonts')
  mkdirSync(outputFontsDir, { recursive: true })
  for (const sourceFontsDir of sourceFontDirs) {
    if (existsSync(sourceFontsDir)) {
      cpSync(sourceFontsDir, outputFontsDir, { recursive: true })
    }
  }
  rmSync(join(unpackedDir, 'resources', 'default_app.asar'), { force: true })

  copyRequiredAppFiles()
  const appAsarPath = join(unpackedDir, 'resources', 'app.asar')
  const asarStatus = run('npx', ['asar', 'pack', stageDir, appAsarPath])
  if (asarStatus !== 0) return asarStatus

  const appExePath = join(unpackedDir, appExeName)
  renameSync(join(unpackedDir, 'electron.exe'), appExePath)
  const iconStatus = patchExecutableIcon(appExePath)
  if (iconStatus !== 0) return iconStatus

  const hasExecutable = existsSync(appExePath)
  const hasAppAsar = existsSync(appAsarPath) && statSync(appAsarPath).size > 1024
  if (!hasExecutable || !hasAppAsar) return 1

  rmSync(stageDir, { recursive: true, force: true })
  cleanInstallerArtifacts()

  return 0
}

const buildStatus = run('npm', ['run', 'build'])
if (buildStatus !== 0) process.exit(buildStatus)

process.exit(assembleExecutableApp())
