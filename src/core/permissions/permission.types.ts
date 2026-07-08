export type NexusPermission =
  | 'system.read'
  | 'system.process'
  | 'system.power'
  | 'app.launch'
  | 'app.manage'
  | 'gaming.launch'
  | 'gaming.manage'
  | 'media.control'
  | 'automation.execute'

export type PermissionDecision = 'allow' | 'deny' | 'confirm'

export type ConfirmationLevel =
  | 'none'
  | 'normal'
  | 'sensitive'
  | 'critical'