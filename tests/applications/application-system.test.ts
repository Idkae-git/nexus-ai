import { describe, expect, it, vi } from 'vitest'

import { ApplicationDetector } from '../../electron/modules/applications/application-detector.js'
import type { ApplicationHistory } from '../../electron/modules/applications/application-history.js'
import { ApplicationLauncher } from '../../electron/modules/applications/application-launcher.js'
import { ApplicationManager } from '../../electron/modules/applications/application-manager.js'
import { ApplicationsModule } from '../../electron/modules/applications/application.module.js'
import { ApplicationProcessService, parseTasklist } from '../../electron/modules/applications/application-process.js'
import { ApplicationRegistry, knownApplications } from '../../electron/modules/applications/application.registry.js'
import { expandWindowsEnvironmentPath, normalizeExecutableCandidate, resolvePathCandidate } from '../../electron/modules/applications/application-paths.js'
import { parseRegistryValue } from '../../electron/modules/applications/application-registry-reader.js'
import { CommandRegistry } from '../../src/core/commands/command-registry.js'
import { isFavorite, selectApplications } from '../../src/features/applications/application.selectors.js'
import type {
  ApplicationFavorite,
  ApplicationId,
  ApplicationRecentEntry,
  DetectedApplication,
} from '../../src/features/applications/application.types.js'

const operaDefinition = knownApplications[0]

function detected(overrides: Partial<DetectedApplication> = {}): DetectedApplication {
  return {
    capabilities: operaDefinition.capabilities,
    category: operaDefinition.category,
    defaultArguments: operaDefinition.defaultArguments,
    description: operaDefinition.description,
    executableNames: operaDefinition.executableNames,
    executablePath: 'C:\\Apps\\launcher.exe',
    iconId: operaDefinition.iconId,
    id: operaDefinition.id,
    installDirectory: 'C:\\Apps',
    installStatus: 'installed',
    lastLaunchedAt: null,
    launchCount: 0,
    metadata: {},
    name: operaDefinition.name,
    processNames: operaDefinition.processNames,
    publisher: operaDefinition.publisher,
    runtimeStatus: 'stopped',
    source: 'known-path',
    ...overrides,
  }
}

class MemoryHistory implements ApplicationHistory {
  recent: ApplicationRecentEntry[] = []
  counts = new Map<ApplicationId, { lastLaunchedAt: number | null; launchCount: number }>()

  async listRecent(limit = 30) { return this.recent.slice(0, limit) }
  async usage(applicationId: ApplicationId) { return this.counts.get(applicationId) ?? { lastLaunchedAt: null, launchCount: 0 } }
  async record(entry: ApplicationRecentEntry) {
    this.recent.unshift(entry)
    if (entry.success) {
      const current = await this.usage(entry.applicationId)
      this.counts.set(entry.applicationId, { lastLaunchedAt: entry.timestamp, launchCount: current.launchCount + 1 })
    }
  }
}

describe('ApplicationRegistry and path resolution', () => {
  it('registers ten unique known applications', () => {
    const registry = new ApplicationRegistry()
    expect(registry.list()).toHaveLength(10)
    expect(registry.has('steam')).toBe(true)
    expect(registry.has('unknown')).toBe(false)
  })

  it('rejects duplicate application identifiers', () => {
    expect(() => new ApplicationRegistry([operaDefinition, operaDefinition])).toThrow(/already registered/)
  })

  it('expands environment variables case-insensitively and rejects unresolved candidates', () => {
    expect(expandWindowsEnvironmentPath('%localappdata%\\App\\tool.exe', { LOCALAPPDATA: 'D:\\Local' })).toBe('D:\\Local\\App\\tool.exe')
    expect(resolvePathCandidate('%MISSING%\\tool.exe', {})).toBeNull()
  })

  it('normalizes quoted registry executables and directory values', () => {
    expect(normalizeExecutableCandidate('"C:\\Program Files\\App\\app.exe" "%1"')).toContain('app.exe')
    expect(normalizeExecutableCandidate('C:\\Steam', 'steam.exe')).toContain('Steam\\steam.exe')
  })

  it('parses string registry values', () => {
    expect(parseRegistryValue('    (Default)    REG_SZ    C:\\Apps\\app.exe\r\n')).toBe('C:\\Apps\\app.exe')
  })
})

describe('ApplicationDetector', () => {
  it('prioritizes a verified registry executable over known paths', async () => {
    const registry = new ApplicationRegistry([operaDefinition])
    const detector = new ApplicationDetector({
      applicationRegistry: registry,
      environment: { LOCALAPPDATA: 'C:\\Local' },
      fileExists: async (filePath) => filePath.endsWith('launcher.exe') || filePath.endsWith('opera.exe'),
      processService: new ApplicationProcessService(async () => '"opera.exe","42"'),
      registryReader: { read: async () => 'C:\\Registry\\opera.exe' },
    })
    const [application] = await detector.scan()
    expect(application).toMatchObject({ installStatus: 'installed', runtimeStatus: 'running', source: 'registry' })
    expect(application?.executablePath).toContain('Registry')
  })

  it('returns not-installed when no verified executable exists', async () => {
    const detector = new ApplicationDetector({
      applicationRegistry: new ApplicationRegistry([operaDefinition]),
      environment: {},
      fileExists: async () => false,
      processService: new ApplicationProcessService(async () => ''),
      registryReader: { read: async () => null },
    })
    await expect(detector.scan()).resolves.toMatchObject([{ installStatus: 'not-installed', executablePath: null }])
  })
})

describe('Application launch and process services', () => {
  it('returns an explicit launch result after a successful spawn', async () => {
    const spawn = vi.fn(async () => undefined)
    const result = await new ApplicationLauncher(spawn).launch(detected())
    expect(spawn).toHaveBeenCalledWith('C:\\Apps\\launcher.exe', [])
    expect(result).toMatchObject({ applicationId: 'opera-gx', success: true })
  })

  it('propagates launch failures', async () => {
    const launcher = new ApplicationLauncher(async () => { throw new Error('access denied') })
    await expect(launcher.launch(detected())).rejects.toThrow('access denied')
  })

  it('rejects non-installed applications before spawning', async () => {
    const spawn = vi.fn(async () => undefined)
    await expect(new ApplicationLauncher(spawn).launch(detected({ executablePath: null, installStatus: 'not-installed' }))).rejects.toThrow(/not installed/)
    expect(spawn).not.toHaveBeenCalled()
  })

  it('parses process names and determines runtime status', () => {
    const processes = parseTasklist('"opera.exe","42","Console","1","10,000 K"\r\n"Code.exe","7"')
    const service = new ApplicationProcessService()
    expect(processes.has('opera.exe')).toBe(true)
    expect(service.status(operaDefinition, processes)).toBe('running')
  })

  it('returns a clear error when closing is unsupported', async () => {
    const processService = new ApplicationProcessService(async () => '"opera.exe","42"')
    await expect(processService.close({
      ...operaDefinition,
      capabilities: { ...operaDefinition.capabilities, close: false },
    })).rejects.toThrow(/not supported/)
  })

  it('closes only registered running process names without force', async () => {
    const run = vi.fn(async (executable: string) => executable === 'tasklist.exe' ? '"opera.exe","42"' : 'SUCCESS')
    const processService = new ApplicationProcessService(run)
    await expect(processService.close(operaDefinition)).resolves.toMatchObject({ closedProcesses: ['opera.exe'], success: true })
    expect(run).toHaveBeenCalledWith('taskkill.exe', ['/IM', 'opera.exe'])
  })
})

describe('Application manager history', () => {
  it('records successful and failed NEXUS launch attempts', async () => {
    const registry = new ApplicationRegistry([operaDefinition])
    const processes = new ApplicationProcessService(async () => '')
    const detector = new ApplicationDetector({
      applicationRegistry: registry,
      environment: { LOCALAPPDATA: 'C:\\Local' },
      fileExists: async () => true,
      processService: processes,
      registryReader: { read: async () => null },
    })
    const history = new MemoryHistory()
    const manager = new ApplicationManager({
      detector,
      history,
      launcher: new ApplicationLauncher(async () => undefined),
      processService: processes,
      registry,
    })
    await manager.launch('opera-gx')
    expect(await manager.recent()).toMatchObject([{ applicationId: 'opera-gx', success: true }])
    expect((await manager.get('opera-gx')).launchCount).toBe(1)
  })

  it('registers the command surface and rejects unknown identifiers', async () => {
    const registry = new ApplicationRegistry([operaDefinition])
    const processes = new ApplicationProcessService(async () => '')
    const detector = new ApplicationDetector({
      applicationRegistry: registry,
      environment: {},
      fileExists: async () => false,
      processService: processes,
      registryReader: { read: async () => null },
    })
    const manager = new ApplicationManager({
      detector,
      history: new MemoryHistory(),
      launcher: new ApplicationLauncher(async () => undefined),
      processService: processes,
      registry,
    })
    const commands = new CommandRegistry()
    new ApplicationsModule(commands, manager).register()
    expect(commands.descriptors().map((command) => command.id)).toHaveLength(8)
    expect(() => commands.get('applications.launch')?.execute(
      { applicationId: 'untrusted' },
      { source: 'ui', target: { type: 'local' } },
    )).toThrow(/known applicationId/)
  })
})

describe('Application search, filters, sorting and favorites', () => {
  const steam = detected({
    category: 'games',
    description: 'Game library',
    executableNames: ['steam.exe'],
    executablePath: 'C:\\Steam\\steam.exe',
    id: 'steam',
    name: 'Steam',
    processNames: ['steam.exe'],
    publisher: 'Valve Corporation',
    runtimeStatus: 'running',
  })
  const applications = [detected(), steam]
  const favorites: ApplicationFavorite[] = [{ applicationId: 'steam', createdAt: 1, order: 0 }]

  it('searches name, publisher, category and description', () => {
    for (const query of ['Steam', 'Valve', 'games', 'library']) {
      expect(selectApplications(applications, { favorites, filter: 'all', query, sortMode: 'name' }).map((app) => app.id)).toEqual(['steam'])
    }
  })

  it('filters running, installed, non-installed and favorites', () => {
    expect(selectApplications(applications, { favorites, filter: 'running', query: '', sortMode: 'name' })).toHaveLength(1)
    expect(selectApplications(applications, { favorites, filter: 'installed', query: '', sortMode: 'name' })).toHaveLength(2)
    expect(selectApplications(applications, { favorites, filter: 'favorites', query: '', sortMode: 'name' })[0]?.id).toBe('steam')
    expect(selectApplications([...applications, detected({ id: 'vlc', installStatus: 'not-installed' })], { favorites, filter: 'not-installed', query: '', sortMode: 'name' })).toHaveLength(1)
  })

  it('sorts favorites and running applications first', () => {
    expect(selectApplications(applications, { favorites, filter: 'all', query: '', sortMode: 'favorites' })[0]?.id).toBe('steam')
    expect(selectApplications(applications, { favorites: [], filter: 'all', query: '', sortMode: 'running' })[0]?.id).toBe('steam')
    expect(isFavorite(favorites, 'steam')).toBe(true)
  })
})
