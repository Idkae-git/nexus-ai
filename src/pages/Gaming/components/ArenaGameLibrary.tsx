import { Icon } from '../../../components/ui/Icon.tsx'
import { GAMING_FILTERS, GAMING_SORTS } from '../../../features/gaming/gaming.constants.ts'
import type { DetectedGame, GameFavorite, GameId, GameLibraryFilter, GameLibrarySortMode } from '../../../features/gaming/gaming.types.ts'
import { ArenaGameCover } from './ArenaGameCover.tsx'

interface ArenaGameLibraryProps {
  favorites: readonly GameFavorite[]
  filter: GameLibraryFilter
  games: readonly DetectedGame[]
  launchingGameId: GameId | null
  onFavorite: (gameId: GameId) => void
  onFilter: (filter: GameLibraryFilter) => void
  onLaunch: (gameId: GameId) => void
  onSearch: (query: string) => void
  onSelect: (gameId: GameId) => void
  onSort: (sort: GameLibrarySortMode) => void
  query: string
  selectedGameId: GameId | null
  sort: GameLibrarySortMode
}

export function ArenaGameLibrary(props: ArenaGameLibraryProps) {
  const favoriteIds = new Set(props.favorites.map((favorite) => favorite.gameId))
  return (
    <section className="arena-library">
      <header><div><span>Your collection</span><h2>Game library</h2></div><strong>{props.games.length} titles</strong></header>
      <div className="arena-library-controls">
        <label><Icon name="search" size={16} /><input onChange={(event) => props.onSearch(event.target.value)} placeholder="Search games, platforms or tags" value={props.query} /></label>
        <div>{GAMING_FILTERS.map((entry) => <button aria-pressed={props.filter === entry.id} className={props.filter === entry.id ? 'is-active' : ''} key={entry.id} onClick={() => props.onFilter(entry.id)} type="button">{entry.label}</button>)}</div>
        <select aria-label="Sort game library" onChange={(event) => props.onSort(event.target.value as GameLibrarySortMode)} value={props.sort}>{GAMING_SORTS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select>
      </div>
      {props.games.length > 0 ? <div className="arena-cover-grid">{props.games.map((game) => <ArenaGameCover favorite={favoriteIds.has(game.id)} game={game} key={game.id} launching={props.launchingGameId === game.id} onFavorite={props.onFavorite} onLaunch={props.onLaunch} onSelect={props.onSelect} selected={props.selectedGameId === game.id} />)}</div> : <div className="arena-library-empty"><Icon name="gaming" size={28} /><strong>No games in this view</strong><p>Connect a supported launcher, run a targeted scan, or adjust the filters.</p></div>}
    </section>
  )
}
