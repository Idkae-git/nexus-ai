import type {
  CommandSource,
} from '../commands/command.types.js'

/* ============================================================
 * NEXUS CORE
 * Activity System
 * ============================================================
 */

export type NexusActivityStatus =
  | 'requested'
  | 'confirmation_required'
  | 'success'
  | 'failed'
  | 'denied'
  | 'cancelled'

export interface NexusActivityEntry<
  TResult = unknown,
> {
  id: string

  command: string

  source: CommandSource

  status: NexusActivityStatus

  createdAt: number

  completedAt?: number

  durationMs?: number

  result?: TResult

  error?: string
}

export interface ActivityFilter {
  command?: string

  source?: CommandSource

  status?: NexusActivityStatus

  limit?: number
}