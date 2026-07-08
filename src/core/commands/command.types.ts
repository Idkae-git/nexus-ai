import type {
  ConfirmationLevel,
  NexusPermission,
} from '../permissions/permission.types.js'

export type NexusModule =
  | 'global'
  | 'system'
  | 'apps'
  | 'gaming'
  | 'media'
  | 'automation'

export type NexusPlatform = 'windows' | 'linux'

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

export type NexusCommandHandler<
  TPayload = unknown,
  TResult = unknown,
> = (
  payload: TPayload,
  context: NexusCommandContext,
) => Promise<TResult>

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
  execute: NexusCommandHandler<TPayload, TResult>
}

export interface NexusCommandRequest<TPayload = unknown> {
  id: string
  command: string
  target: NexusTarget
  payload: TPayload
  source: CommandSource
  createdAt: number
}