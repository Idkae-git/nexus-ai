import { Icon } from '../../components/ui/Icon.tsx'

interface SettingsPageProps {
  coreStatus: 'connecting' | 'online' | 'offline'
  hostname?: string
}

export function SettingsPage({ coreStatus, hostname }: SettingsPageProps) {
  return (
    <div className="page page-settings">
      <header className="settings-topline">
        <span>THE ARCHITECT</span>
        <small>WORLD 07 / LOCAL PREFERENCES</small>
      </header>

      <div className="settings-minimal-layout">
        <aside className="settings-index">
          <nav aria-label="Settings sections">
            <span>SETTINGS</span>
            <button className="settings-index-active"><Icon name="settings" size={15} /> General</button>
            <button disabled><Icon name="applications" size={15} /> Applications</button>
            <button disabled><Icon name="automation" size={15} /> Automation</button>
            <button disabled><Icon name="activity" size={15} /> Privacy</button>
            <button disabled><Icon name="user" size={15} /> About</button>
          </nav>
          <div className="settings-device-note">
            <i className={`status-orb status-orb-${coreStatus}`} />
            <span><small>THIS DEVICE</small><strong>{hostname ?? 'Unavailable'}</strong></span>
          </div>
        </aside>

        <main className="settings-document">
          <header>
            <span>GENERAL</span>
            <h1>Settings</h1>
            <p>Quiet defaults for how NEXUS behaves on this device.</p>
          </header>

          <section className="settings-group">
            <header><h2>Startup</h2><p>Choose how NEXUS enters your Windows session.</p></header>
            <div className="settings-line">
              <div><strong>Launch at sign in</strong><span>Open NEXUS when your Windows session starts.</span></div>
              <button aria-label="Launch at sign in disabled" className="settings-switch" disabled><i /></button>
            </div>
            <div className="settings-line">
              <div><strong>Start minimized</strong><span>Keep NEXUS in the background until you need it.</span></div>
              <button aria-label="Start minimized disabled" className="settings-switch" disabled><i /></button>
            </div>
          </section>

          <section className="settings-group">
            <header><h2>Experience</h2><p>Adjust the interface without changing its visual language.</p></header>
            <div className="settings-line">
              <div><strong>Motion</strong><span>Use page-specific transitions and ambient motion.</span></div>
              <button className="settings-select" disabled>System preference <Icon name="chevron-right" size={14} /></button>
            </div>
            <div className="settings-line">
              <div><strong>Interface density</strong><span>Control the amount of information visible at once.</span></div>
              <button className="settings-select" disabled>Comfortable <Icon name="chevron-right" size={14} /></button>
            </div>
          </section>

          <section className="settings-group">
            <header><h2>Local data</h2><p>NEXUS keeps command history and preferences on this device.</p></header>
            <div className="settings-line">
              <div><strong>Activity retention</strong><span>Maximum local audit events retained by the Core.</span></div>
              <button className="settings-select" disabled>1,000 events <Icon name="chevron-right" size={14} /></button>
            </div>
          </section>

          <footer className="settings-version-line">
            <span>NEXUS Desktop 0.0.1</span>
            <span><i className={`status-orb status-orb-${coreStatus}`} /> Core {coreStatus}</span>
            <span>Local Windows</span>
          </footer>
        </main>
      </div>
    </div>
  )
}
