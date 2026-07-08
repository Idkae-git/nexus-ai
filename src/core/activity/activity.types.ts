import type {
  CommandSource,
  NexusTarget,
} from '../commands/command.types'

export type NexusActivityStatus =
  | 'requested'
  | 'confirmed'
  | 'executing'
  | 'success'
  | 'failed'
  | 'denied'

export interface NexusActivity {
  id: string
  command: string
  source: CommandSource
  target: NexusTarget
  status: NexusActivityStatus
  timestamp: number
  error?: string
}