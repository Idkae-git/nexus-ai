import { createWatchEntry } from '../../watch-history-normalizer.js'
import type { ParsedWatchImport } from '../../watch-import.types.js'

export function parseCsv(text: string) {
    const rows: string[][] = []
    let field = ''
    let row: string[] = []
    let quoted = false
    const value = text.replace(/^\uFEFF/, '')
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index]
        if (quoted) {
            if (character === '"' && value[index + 1] === '"') { field += '"'; index += 1 }
            else if (character === '"') quoted = false
            else field += character
        } else if (character === '"') quoted = true
        else if (character === ',') { row.push(field); field = '' }
        else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
        else field += character
    }
    if (quoted) throw new Error('CSV invalide : guillemet non fermé.')
    if (field.length > 0 || row.length > 0) { row.push(field.replace(/\r$/, '')); rows.push(row) }
    return rows.filter((entry) => entry.some((cell) => cell.trim().length > 0))
}

function parseDate(value: string) {
    const trimmed = value.trim()
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed)
    if (iso) return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    const localized = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2}|\d{4})$/.exec(trimmed)
    if (!localized) return null
    const first = Number(localized[1]); const second = Number(localized[2]); const rawYear = Number(localized[3]); const year = rawYear < 100 ? 2000 + rawYear : rawYear
    const month = first > 12 ? second : first
    const day = first > 12 ? first : second
    const timestamp = Date.UTC(year, month - 1, day)
    const date = new Date(timestamp)
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? timestamp : null
}

const titleHeaders = new Set(['title', 'titre', 'nom du titre'])
const dateHeaders = new Set(['date', 'date de visionnage', 'viewing date'])

export function parseNetflixCsv(text: string, profileName: string, fileName = 'NetflixViewingHistory.csv'): ParsedWatchImport {
    const rows = parseCsv(text)
    if (rows.length === 0) throw new Error('Le fichier Netflix est vide.')
    const columns = rows[0].map((cell) => cell.trim())
    const normalized = columns.map((cell) => cell.toLocaleLowerCase())
    const titleIndex = normalized.findIndex((cell) => titleHeaders.has(cell))
    const dateIndex = normalized.findIndex((cell) => dateHeaders.has(cell))
    if (titleIndex < 0 || dateIndex < 0) throw new Error('CSV Netflix incompatible : colonnes Title/Titre et Date requises.')
    const entries = []
    const errors = []
    for (let index = 1; index < rows.length; index += 1) {
        const title = rows[index]?.[titleIndex]?.trim() ?? ''
        const rawDate = rows[index]?.[dateIndex]?.trim() ?? ''
        const watchedAt = parseDate(rawDate)
        if (!title || watchedAt === null) { errors.push({ line: index + 1, message: !title ? 'Titre manquant.' : 'Date invalide.', rawValue: !title ? null : rawDate }); continue }
        entries.push(createWatchEntry({ automatic: false, mediaType: 'unknown', precision: 'watched-only', profileName, provider: 'netflix-import', sourceFileName: fileName, status: 'unknown', title, watchedAt }))
    }
    return { columns, entries, errors, profileName, provider: 'netflix-import', totalRows: Math.max(0, rows.length - 1), warnings: ['Netflix indique une activité de lecture, pas une progression ni une complétion garanties.'] }
}
