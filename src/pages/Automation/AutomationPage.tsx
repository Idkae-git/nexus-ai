import { WorkflowCard } from '../../components/automation/WorkflowCard.tsx'
import { WorkflowNode } from '../../components/automation/WorkflowNode.tsx'
import { PcbTraceLayer } from '../../components/automation/PcbTraceLayer.tsx'
import { ActionButton } from '../../components/ui/ActionButton.tsx'
import { Icon } from '../../components/ui/Icon.tsx'

const routineTemplates = [
  { icon: 'moon' as const, title: 'Focus mode', description: 'Quiet apps, set audio and prepare the desktop.' },
  { icon: 'gaming' as const, title: 'Game session', description: 'Open launchers, voice and performance services.' },
  { icon: 'lock' as const, title: 'Leave desk', description: 'Close private apps and secure the local session.' },
]

export function AutomationPage() {
  return (
    <div className="page page-automation">
      <header className="automation-studio-header">
        <div>
          <span>WORLD 06 / VISUAL WORKFLOW ENGINE</span>
          <h1>The Circuit</h1>
          <p>Connect triggers, decisions and secure actions into routines that run locally.</p>
        </div>
        <ActionButton disabled><span>+</span> New workflow</ActionButton>
      </header>

      <section className="workflow-studio">
        <aside className="workflow-palette">
          <header><span>BLOCK LIBRARY</span><small>DRAG TO CANVAS</small></header>
          <div>
            <button disabled><span><Icon name="activity" size={16} /></span><p><strong>Trigger</strong><small>Event or schedule</small></p><b>+</b></button>
            <button disabled><span><Icon name="filter" size={16} /></span><p><strong>Condition</strong><small>Rules and gates</small></p><b>+</b></button>
            <button disabled><span><Icon name="automation" size={16} /></span><p><strong>Action</strong><small>NEXUS command</small></p><b>+</b></button>
            <button disabled><span><Icon name="clock" size={16} /></span><p><strong>Delay</strong><small>Wait or debounce</small></p><b>+</b></button>
          </div>
          <footer><Icon name="lock" size={13} /><span>All actions will respect permissions and confirmation policies.</span></footer>
        </aside>

        <div className="workflow-canvas">
          <header>
            <div><span>UNTITLED WORKFLOW</span><small>AUTOSAVED LOCALLY</small></div>
            <div><button disabled>−</button><span>100%</span><button disabled>+</button></div>
          </header>
          <div className="workflow-canvas-grid">
            <PcbTraceLayer />
            <WorkflowNode className="workflow-node-trigger" description="When NEXUS detects an active game." icon="gaming" label="Game starts" state="TRIGGER" />
            <WorkflowNode className="workflow-node-condition" description="Continue only when Focus mode is off." icon="filter" label="Check context" state="CONDITION" />
            <WorkflowNode className="workflow-node-action-one" description="Open the voice and presence layer." icon="discord" label="Launch Discord" state="ACTION" />
            <WorkflowNode className="workflow-node-action-two" description="Apply the performance profile." icon="cpu" label="Gaming profile" state="ACTION" />
            <div className="workflow-add-node"><span>+</span><small>ADD BLOCK</small></div>
          </div>
          <footer><span><i /> DRAFT</span><span>4 BLOCKS</span><span>3 CONNECTIONS</span></footer>
        </div>
      </section>

      <section className="routine-library">
        <header><div><span>STARTING POINTS</span><h2>Routine templates</h2></div><small>NO LOGIC CONNECTED YET</small></header>
        <div>{routineTemplates.map((routine, index) => <WorkflowCard {...routine} index={index + 1} key={routine.title} />)}</div>
      </section>
    </div>
  )
}
