export type NexusPage =
  | 'overview'
  | 'gaming'
  | 'media'
  | 'applications'
  | 'activity'
  | 'automation'
  | 'settings'

export interface NavigationItem {
  id: NexusPage
  label: string
  path: string
  icon:
    | 'overview'
    | 'gaming'
    | 'media'
    | 'applications'
    | 'activity'
    | 'automation'
    | 'settings'
}
