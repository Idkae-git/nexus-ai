import * as path from 'node:path'

export function expandWindowsEnvironmentPath(candidate: string, environment: NodeJS.ProcessEnv) {
    return candidate.replace(/%([^%]+)%/g, (match, variable: string) => {
        const key = Object.keys(environment).find((name) => name.toLocaleUpperCase() === variable.toLocaleUpperCase())
        return key && environment[key] ? environment[key] : match
    })
}
export function normalizeExecutableCandidate(value: string, appendExecutable?: string) {
    const trimmed = value.trim()
    const quoted = /^"([^"]+\.exe)"/i.exec(trimmed)?.[1]
    const unquoted = /^(.+?\.exe)(?:\s|$)/i.exec(trimmed)?.[1]
    const resolved = quoted ?? unquoted ?? trimmed.replace(/^"|"$/g, '')
    return path.normalize(appendExecutable && !resolved.toLocaleLowerCase().endsWith('.exe')
        ? path.join(resolved, appendExecutable)
        : resolved)
}

export function resolvePathCandidate(candidate: string, environment: NodeJS.ProcessEnv) {
    const expanded = expandWindowsEnvironmentPath(candidate, environment)
    return expanded.includes('%') ? null : path.normalize(expanded)
}
