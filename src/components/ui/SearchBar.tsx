import { Icon } from './Icon.tsx'

interface SearchBarProps {
  ariaLabel: string
  className?: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}

export function SearchBar({ ariaLabel, className = '', onChange, placeholder, value }: SearchBarProps) {
  return (
    <label className={`search-shell${className ? ` ${className}` : ''}`}>
      <Icon name="search" size={16} />
      <input
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      {value && (
        <button aria-label={`Clear ${ariaLabel.toLowerCase()}`} onClick={() => onChange('')} type="button">
          <Icon name="close" size={14} />
        </button>
      )}
    </label>
  )
}
