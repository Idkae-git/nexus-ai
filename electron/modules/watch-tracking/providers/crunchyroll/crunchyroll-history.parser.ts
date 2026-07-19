import { z } from 'zod'

import { createWatchEntry } from '../../watch-history-normalizer.js'
import type { ParsedWatchImport } from '../../watch-import.types.js'
import { parseCsv } from '../netflix/netflix-csv.parser.js'

const entrySchema = z.object({
    episodeNumber: z.number().int().nonnegative().optional(),
    episodeTitle: z.string().min(1).optional(),
    seasonNumber: z.number().int().nonnegative().optional(),
    seriesTitle: z.string().min(1),
    watchedAt: z.string().datetime().optional(),
}).strict()

const crunchyrollSchema = z.object({ entries: z.array(entrySchema), profile: z.string().min(1), provider: z.literal('crunchyroll') }).strict()

export function parseCrunchyrollJson(text: string, fallbackProfile: string, fileName = 'crunchyroll.json'): ParsedWatchImport {
    let raw: unknown
    try { raw = JSON.parse(text.replace(/^\uFEFF/, '')) } catch { throw new Error('JSON Crunchyroll invalide.') }
    const result = crunchyrollSchema.safeParse(raw)
    if (!result.success) throw new Error('Format Crunchyroll incompatible. Utilisez le format NEXUS documenté.')
    const profileName = result.data.profile || fallbackProfile
    const entries = result.data.entries.map((entry) => createWatchEntry({
        automatic: false, confidence: 'high', episodeNumber: entry.episodeNumber ?? null, episodeTitle: entry.episodeTitle ?? null,
        mediaType: 'anime', precision: 'watched-only', profileName, provider: 'crunchyroll-import', seasonNumber: entry.seasonNumber ?? null,
        seriesTitle: entry.seriesTitle, sourceFileName: fileName, status: 'unknown', title: entry.episodeTitle ? `${entry.seriesTitle} · ${entry.episodeTitle}` : entry.seriesTitle,
        watchedAt: entry.watchedAt ? Date.parse(entry.watchedAt) : null,
    }))
    return { columns: ['seriesTitle', 'seasonNumber', 'episodeNumber', 'episodeTitle', 'watchedAt'], entries, errors: [], profileName, provider: 'crunchyroll-import', totalRows: entries.length, warnings: ['Progression exacte inconnue : historique importé explicitement.'] }
}

export function parseCrunchyrollCsv(text: string, profileName: string, fileName = 'crunchyroll.csv'): ParsedWatchImport {
    const rows = parseCsv(text)
    if (rows.length === 0) throw new Error('Le fichier Crunchyroll est vide.')
    const columns = rows[0].map((cell) => cell.trim())
    const lower = columns.map((cell) => cell.toLocaleLowerCase())
    const seriesIndex = lower.indexOf('seriestitle')
    if (seriesIndex < 0) throw new Error('CSV Crunchyroll incompatible : colonne seriesTitle requise.')
    const seasonIndex = lower.indexOf('seasonnumber'); const episodeIndex = lower.indexOf('episodenumber'); const titleIndex = lower.indexOf('episodetitle'); const watchedIndex = lower.indexOf('watchedat')
    const entries = []; const errors = []
    for (let index = 1; index < rows.length; index += 1) {
        const seriesTitle = rows[index]?.[seriesIndex]?.trim() ?? ''
        if (!seriesTitle) { errors.push({ line: index + 1, message: 'seriesTitle manquant.', rawValue: null }); continue }
        const watchedRaw = watchedIndex >= 0 ? rows[index]?.[watchedIndex]?.trim() : ''
        const watchedAt = watchedRaw ? Date.parse(watchedRaw ?? '') : null
        if (watchedRaw && Number.isNaN(watchedAt)) { errors.push({ line: index + 1, message: 'watchedAt invalide.', rawValue: watchedRaw ?? null }); continue }
        const seasonNumber = seasonIndex >= 0 ? Number(rows[index]?.[seasonIndex]) || null : null
        const episodeNumber = episodeIndex >= 0 ? Number(rows[index]?.[episodeIndex]) || null : null
        const episodeTitle = titleIndex >= 0 ? rows[index]?.[titleIndex]?.trim() || null : null
        entries.push(createWatchEntry({ automatic: false, confidence: 'high', episodeNumber, episodeTitle, mediaType: 'anime', precision: 'watched-only', profileName, provider: 'crunchyroll-import', seasonNumber, seriesTitle, sourceFileName: fileName, status: 'unknown', title: episodeTitle ? `${seriesTitle} · ${episodeTitle}` : seriesTitle, watchedAt: watchedAt && !Number.isNaN(watchedAt) ? watchedAt : null }))
    }
    return { columns, entries, errors, profileName, provider: 'crunchyroll-import', totalRows: Math.max(0, rows.length - 1), warnings: ['Progression exacte inconnue : historique importé explicitement.'] }
}
