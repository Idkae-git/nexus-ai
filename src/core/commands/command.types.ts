import type {
  ConfirmationLevel,
  NexusPermission,
} from '../permissions/permission.types.js'

/* ============================================================
 * NEXUS CORE v2
 * Command Type System
 * ============================================================
 */

export type NexusModule =
  | 'global'
  | 'system'
  | 'apps'
  | 'gaming'
  | 'media'
  | 'automation'

export type NexusPlatform =
  | 'windows'
  | 'linux'

export type CommandSource =
  | 'ui'
  | 'ai'
  | 'automation'
  | 'remote'

export interface NexusTarget {
  type: 'local'
}

export interface NexusCommandContext {
  source: CommandSource
  target: NexusTarget
}

/* ============================================================
 * Command Request
 * ============================================================
 */

export interface NexusCommandRequest<
  TPayload = unknown,
> {
  id: string

  command: string

  payload: TPayload

  source: CommandSource

  target: NexusTarget

  createdAt: number
}

/* ============================================================
 * Command Result
 * ============================================================
 */

export type NexusCommandStatus =
  | 'success'
  | 'failed'
  | 'denied'
  | 'confirmation_required'

export interface NexusCommandResult<
  TResult = unknown,
> {
  status: NexusCommandStatus

  requestId?: string

  data?: TResult

  error?: string
}

/* ============================================================
 * Handler
 * ============================================================
 */

export type NexusCommandHandler<
  TPayload = unknown,
  TResult = unknown,
> = (
  payload: TPayload,
  context: NexusCommandContext,
) => Promise<TResult>

/* ============================================================
 * Definition
 * ============================================================
 */

export interface NexusCommand<
  TPayload = unknown,
  TResult = unknown,
> {
  id: string

  module: NexusModule

  description: string

  permission: NexusPermission

  confirmation: ConfirmationLevel

  platforms: NexusPlatform[]

  execute: NexusCommandHandler<
    TPayload,
    TResult
  >
}