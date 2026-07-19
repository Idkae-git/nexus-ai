interface ValveObject {
    [key: string]: string | ValveObject
}

export interface SteamAppManifest {
    appId: string
    installDirectoryName: string
    lastUpdatedAt: number | null
    name: string
    sizeOnDisk: number | null
    stateFlags: number | null
}

function tokenize(input: string) {
    const tokens: string[] = []
    let index = 0
    while (index < input.length) {
        const character = input[index]
        if (/\s/.test(character ?? '')) {
            index += 1
            continue
        }
        if (character === '/' && input[index + 1] === '/') {
            index = input.indexOf('\n', index + 2)
            if (index < 0) break
            continue
        }
        if (character === '{' || character === '}') {
            tokens.push(character)
            index += 1
            continue
        }
        if (character !== '"') throw new Error(`Invalid Valve KeyValues token at position ${index}.`)
        index += 1
        let value = ''
        let closed = false
        while (index < input.length) {
            const current = input[index]
            if (current === '\\' && index + 1 < input.length) {
                const next = input[index + 1]
                value += next === 'n' ? '\n' : next ?? ''
                index += 2
                continue
            }
            if (current === '"') {
                closed = true
                index += 1
                break
            }
            value += current
            index += 1
        }
        if (!closed) throw new Error('Unterminated Valve KeyValues string.')
        tokens.push(value)
    }
    return tokens
}

function parseObject(tokens: readonly string[], startIndex: number, nested: boolean): [ValveObject, number] {
    const result: ValveObject = {}
    let index = startIndex
    while (index < tokens.length) {
        if (tokens[index] === '}') {
            if (!nested) throw new Error('Unexpected closing brace in Valve KeyValues data.')
            return [result, index + 1]
        }
        const key = tokens[index]
        if (!key || key === '{') throw new Error('Expected a Valve KeyValues key.')
        const next = tokens[index + 1]
        if (next === '{') {
            const [child, nextIndex] = parseObject(tokens, index + 2, true)
            result[key] = child
            index = nextIndex
            continue
        }
        if (next === undefined || next === '}') throw new Error(`Missing value for Valve KeyValues key "${key}".`)
        result[key] = next
        index += 2
    }
    if (nested) throw new Error('Unclosed Valve KeyValues object.')
    return [result, index]
}

export function parseValveKeyValues(input: string) {
    const tokens = tokenize(input.replace(/^\uFEFF/, ''))
    if (tokens.length === 0) throw new Error('Valve KeyValues data is empty.')
    return parseObject(tokens, 0, false)[0]
}

function objectValue(value: string | ValveObject | undefined): ValveObject | null {
    return value && typeof value === 'object' ? value : null
}

function stringValue(value: string | ValveObject | undefined): string | null {
    return typeof value === 'string' && value.trim() ? value : null
}

function numberValue(value: string | ValveObject | undefined): number | null {
    const string = stringValue(value)
    if (string === null) return null
    const parsed = Number(string)
    return Number.isFinite(parsed) ? parsed : null
}

function caseInsensitiveValue(object: ValveObject, key: string) {
    const entry = Object.entries(object).find(([candidate]) => candidate.toLocaleLowerCase() === key.toLocaleLowerCase())
    return entry?.[1]
}

export function parseSteamLibraryFolders(input: string) {
    const root = parseValveKeyValues(input)
    const libraries = objectValue(caseInsensitiveValue(root, 'libraryfolders')) ?? root
    const paths = new Set<string>()
    for (const [key, value] of Object.entries(libraries)) {
        if (!/^\d+$/.test(key)) continue
        const libraryPath = typeof value === 'string' ? value : stringValue(value.path)
        if (libraryPath) paths.add(libraryPath.replace(/\\\\/g, '\\'))
    }
    return [...paths]
}

export function parseSteamAppManifest(input: string): SteamAppManifest {
    const root = parseValveKeyValues(input)
    const state = objectValue(caseInsensitiveValue(root, 'AppState'))
    if (!state) throw new Error('Steam manifest does not contain AppState.')
    const appId = stringValue(state.appid)
    const name = stringValue(state.name)
    const installDirectoryName = stringValue(state.installdir)
    if (!appId || !/^\d+$/.test(appId) || !name || !installDirectoryName) {
        throw new Error('Steam manifest is missing a valid appid, name, or installdir.')
    }
    return {
        appId,
        installDirectoryName,
        lastUpdatedAt: numberValue(state.LastUpdated) ?? numberValue(state.lastupdated),
        name,
        sizeOnDisk: numberValue(state.SizeOnDisk) ?? numberValue(state.sizeondisk),
        stateFlags: numberValue(state.StateFlags) ?? numberValue(state.stateflags),
    }
}
