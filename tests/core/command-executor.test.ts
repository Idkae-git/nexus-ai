import { describe, expect, it } from 'vitest'

import { ActivityService } from '../../src/core/activity/activity-service.js'
import { ActivityStore } from '../../src/core/activity/activity-store.js'
import { CommandExecutor } from '../../src/core/commands/command-executor.js'
import { CommandRegistry } from '../../src/core/commands/command-registry.js'
import type { NexusCommand, NexusCommandRequest } from '../../src/core/commands/command.types.js'
import { PendingCommandStore } from '../../src/core/commands/pending-command-store.js'
import { PermissionManager } from '../../src/core/permissions/permission-manager.js'

interface TestCore {
  activities: ActivityService
  activityStore: ActivityStore
  executor: CommandExecutor
  registry: CommandRegistry
}

function createCore(maxActivities = 1000): TestCore {
  const registry = new CommandRegistry()
  const activityStore = new ActivityStore(maxActivities)
  const activities = new ActivityService(activityStore)
  const executor = new CommandExecutor(
    registry,
    new PermissionManager(),
    new PendingCommandStore(),
    activities,
  )

  return { activities, activityStore, executor, registry }
}

function request(command: string, source: NexusCommandRequest['source'] = 'ui'): NexusCommandRequest<void> {
  return {
    id: crypto.randomUUID(),
    command,
    payload: undefined,
    source,
    target: { type: 'local' },
    createdAt: Date.now(),
  }
}

function command(id: string, confirmation: NexusCommand['confirmation'] = 'none', execute: NexusCommand<void, string>['execute'] = async () => 'done'): NexusCommand<void, string> {
  return {
    id,
    module: 'system',
    description: `Test command ${id}`,
    permission: confirmation === 'none' ? 'system.read' : 'system.power',
    confirmation,
    platforms: ['windows'],
    execute,
  }
}

describe('CommandExecutor activity lifecycle', () => {
  it('records requested before transitioning to success', async () => {
    const core = createCore()
    let resolveCommand: ((value: string) => void) | undefined
    const resultPromise = new Promise<string>((resolve) => {
      resolveCommand = resolve
    })
    core.registry.register(command('system.deferred', 'none', async () => resultPromise))
    const commandRequest = request('system.deferred')

    const execution = core.executor.execute<string>(commandRequest)

    expect(core.activities.get(commandRequest.id)?.status).toBe('requested')
    resolveCommand?.('complete')
    await expect(execution).resolves.toMatchObject({ status: 'success', data: 'complete' })
    expect(core.activities.get(commandRequest.id)).toMatchObject({
      id: commandRequest.id,
      command: commandRequest.command,
      status: 'success',
      result: 'complete',
    })
  })

  it('records requested then confirmation_required', async () => {
    const core = createCore()
    core.registry.register(command('system.critical', 'critical'))
    const commandRequest = request('system.critical')

    await expect(core.executor.execute(commandRequest)).resolves.toMatchObject({
      status: 'confirmation_required',
      requestId: commandRequest.id,
    })
    expect(core.activities.get(commandRequest.id)?.status).toBe('confirmation_required')
  })

  it('updates the existing activity to success after confirmation', async () => {
    const core = createCore()
    core.registry.register(command('system.critical', 'critical'))
    const commandRequest = request('system.critical')
    await core.executor.execute(commandRequest)

    await expect(core.executor.confirm(commandRequest.id)).resolves.toMatchObject({ status: 'success' })
    expect(core.activities.count()).toBe(1)
    expect(core.activities.get(commandRequest.id)?.status).toBe('success')
  })

  it('updates the existing activity to cancelled', async () => {
    const core = createCore()
    core.registry.register(command('system.critical', 'critical'))
    const commandRequest = request('system.critical')
    await core.executor.execute(commandRequest)

    expect(core.executor.cancel(commandRequest.id)).toBe(true)
    expect(core.activities.count()).toBe(1)
    expect(core.activities.get(commandRequest.id)?.status).toBe('cancelled')
  })

  it('records an unknown command as failed', async () => {
    const core = createCore()
    const commandRequest = request('system.unknown')

    await expect(core.executor.execute(commandRequest)).resolves.toMatchObject({ status: 'failed' })
    expect(core.activities.get(commandRequest.id)).toMatchObject({
      status: 'failed',
      error: 'Unknown command "system.unknown"',
    })
  })

  it('records a remote command as denied', async () => {
    const core = createCore()
    core.registry.register(command('system.read'))
    const commandRequest = request('system.read', 'remote')

    await expect(core.executor.execute(commandRequest)).resolves.toMatchObject({ status: 'denied' })
    expect(core.activities.get(commandRequest.id)?.status).toBe('denied')
  })
})

describe('ActivityStore', () => {
  it('enforces its maximum entry limit', () => {
    const store = new ActivityStore(2)

    for (const id of ['one', 'two', 'three']) {
      store.add({ id, command: `system.${id}`, source: 'ui', status: 'requested', createdAt: Date.now() })
    }

    expect(store.count()).toBe(2)
    expect(store.list().map((entry) => entry.id)).toEqual(['three', 'two'])
  })

  it('filters by command, source, status, and limit', () => {
    const store = new ActivityStore()
    store.add({ id: 'one', command: 'system.info', source: 'ui', status: 'success', createdAt: 1 })
    store.add({ id: 'two', command: 'system.info', source: 'automation', status: 'failed', createdAt: 2 })
    store.add({ id: 'three', command: 'system.lock', source: 'ui', status: 'success', createdAt: 3 })

    expect(store.list({ command: 'system.info' })).toHaveLength(2)
    expect(store.list({ source: 'ui', status: 'success' })).toHaveLength(2)
    expect(store.list({ limit: 1 })).toHaveLength(1)
    expect(store.list({ command: 'system.info', source: 'automation', status: 'failed' })[0]?.id).toBe('two')
  })
})
