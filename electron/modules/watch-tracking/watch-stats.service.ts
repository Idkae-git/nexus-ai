import type { WatchEntry, WatchStats } from '../../../src/features/watch-tracking/watch.types.js'

export function calculateWatchStats(entries: readonly WatchEntry[]): WatchStats {
    const stats: WatchStats = { activityWithoutDuration: 0, animeEntries: 0, completedEntries: 0, episodes: 0, estimatedDurationSeconds: 0, exactDurationSeconds: 0, movies: 0, sourceCounts: {}, totalEntries: entries.length }
    for (const entry of entries) {
        if (entry.mediaType === 'movie') stats.movies += 1
        if (entry.mediaType === 'episode') stats.episodes += 1
        if (entry.mediaType === 'anime') stats.animeEntries += 1
        if (entry.status === 'completed') stats.completedEntries += 1
        stats.sourceCounts[entry.primaryProvider] = (stats.sourceCounts[entry.primaryProvider] ?? 0) + 1
        const duration = entry.progress.positionSeconds
        if (duration === null) stats.activityWithoutDuration += 1
        else if (entry.progress.precision === 'exact') stats.exactDurationSeconds += duration
        else if (entry.progress.precision === 'estimated') stats.estimatedDurationSeconds += duration
        else stats.activityWithoutDuration += 1
    }
    return stats
}
