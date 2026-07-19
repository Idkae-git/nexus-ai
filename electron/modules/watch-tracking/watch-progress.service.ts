import { WATCH_COMPLETION_PERCENT, WATCH_COMPLETION_REMAINING_SECONDS } from '../../../src/features/watch-tracking/watch.constants.js'
import type { WatchProgress, WatchStatus } from '../../../src/features/watch-tracking/watch.types.js'

export function completionStatus(positionSeconds: number, durationSeconds: number | null): WatchStatus {
    if (durationSeconds === null || durationSeconds <= 0) return positionSeconds > 0 ? 'in-progress' : 'unknown'
    const percent = positionSeconds / durationSeconds * 100
    return percent >= WATCH_COMPLETION_PERCENT || durationSeconds - positionSeconds <= WATCH_COMPLETION_REMAINING_SECONDS ? 'completed' : positionSeconds > 0 ? 'in-progress' : 'unknown'
}

export function exactProgress(positionSeconds: number, durationSeconds: number | null, updatedAt: number): WatchProgress {
    return { durationSeconds, percent: durationSeconds && durationSeconds > 0 ? Math.min(100, positionSeconds / durationSeconds * 100) : null, positionSeconds, precision: 'exact', updatedAt }
}
