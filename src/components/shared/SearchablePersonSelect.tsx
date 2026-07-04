import { useEffect, useId, useMemo, useRef, useState } from 'react';

interface PersonOption {
  id: string;
  name: string;
}

interface SearchablePersonSelectProps {
  value: string;
  options: PersonOption[];
  onChange: (id: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
  /** Resetează căutarea când se schimbă angajatul selectat */
  resetKey?: string;
}

export function SearchablePersonSelect({
  value,
  options,
  onChange,
  placeholder = 'Caută și selectează…',
  allowEmpty = false,
  emptyLabel = '— Selectați —',
  required = false,
  disabled = false,
  resetKey,
}: SearchablePersonSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    setQuery('');
    setOpen(false);
  }, [resetKey]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery(selected?.name ?? '');
  };

  const showingEmptyLabel = !open && !value && allowEmpty;
  const inputValue = open ? query : selected?.name ?? (showingEmptyLabel ? emptyLabel : '');

  return (
    <div ref={containerRef} className="relative mt-1">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={[
          'w-full rounded-lg border border-corporate-border px-3 py-2 text-sm bg-white pr-8',
          showingEmptyLabel ? 'text-corporate-muted italic' : '',
        ].join(' ')}
        placeholder={!value && !showingEmptyLabel ? placeholder : undefined}
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        disabled={disabled}
        required={required && !value}
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-corporate-muted text-xs"
        aria-hidden
      >
        ▾
      </span>

      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-corporate-border bg-white shadow-lg py-1"
        >
          {allowEmpty && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={[
                  'w-full text-left px-3 py-2 text-sm hover:bg-corporate-surface',
                  !value ? 'bg-corporate-gold-light/40 font-medium' : '',
                ].join(' ')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect('')}
              >
                {emptyLabel}
              </button>
            </li>
          )}
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-corporate-muted">Niciun rezultat</li>
          ) : (
            filteredOptions.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.id}
                  className={[
                    'w-full text-left px-3 py-2 text-sm hover:bg-corporate-surface',
                    value === option.id ? 'bg-corporate-gold-light/40 font-medium' : '',
                  ].join(' ')}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(option.id)}
                >
                  {option.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
