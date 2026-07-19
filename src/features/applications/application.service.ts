import type { NexusCommandRequest } from '../../core/commands/command.types.js'
import type {
  ApplicationClosePayload,
  ApplicationCloseResult,
  ApplicationId,
  ApplicationLaunchPayload,
  ApplicationLaunchResult,
  ApplicationRecentEntry,
  ApplicationRuntimeResult,
  ApplicationScanResult,
  DetectedApplication,
} from './application.types.ts'

function createRequest<TPayload>(command: string, payload: TPayload): NexusCommandRequest<TPayload> {
  return {
    id: crypto.randomUUID(),
    command,
    payload,
    source: 'ui',
    target: { type: 'local' },
    createdAt: Date.now(),
  }
}
async function execute<TPayload, TResult>(command: string, payload: TPayload) {
  if (!window.nexus) throw new Error('The NEXUS application gateway is unavailable.')
  const result = await window.nexus.execute<TPayload, TResult>(createRequest(command, payload))
  if (result.status !== 'success' || result.data === undefined) {
    throw new Error(result.error ?? `${command} failed with status ${result.status}.`)
  }
  return result.data
}

export const applicationService = {
  close(applicationId: ApplicationId) {
    return execute<ApplicationClosePayload, ApplicationCloseResult>('applications.close', { applicationId })
  },
  launch(applicationId: ApplicationId) {
    return execute<ApplicationLaunchPayload, ApplicationLaunchResult>('applications.launch', { applicationId })
  },
  list() {
    return execute<void, DetectedApplication[]>('applications.list', undefined)
  },
  recent() {
    return execute<void, ApplicationRecentEntry[]>('applications.recent.list', undefined)
  },
  refreshRuntimeStatus() {
    return execute<void, ApplicationRuntimeResult[]>('applications.refresh-status', undefined)
  },
  scan() {
    return execute<void, ApplicationScanResult>('applications.scan', undefined)
  },
}
