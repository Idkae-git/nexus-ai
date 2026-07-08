import type { NexusCommandContext } from '../commands/command.types'
import type {
    ConfirmationLevel,
    PermissionDecision,
} from './permission.types'

export class PermissionManager {
    evaluate(
        confirmation: ConfirmationLevel,
        context: NexusCommandContext,
    ): PermissionDecision {
        if (context.source === 'remote') {
            return 'deny'
        }

        switch (confirmation) {
            case 'none':
                return 'allow'

            case 'normal':
            case 'sensitive':
            case 'critical':
                return 'confirm'
        }
    }
}