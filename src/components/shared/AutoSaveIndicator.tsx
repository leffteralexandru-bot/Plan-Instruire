import { useAutoSaveGlobalStatus } from '@/context/AutoSaveContext';

function CloudIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M7 18h11a3 3 0 0 0 .4-5.98A4.5 4.5 0 0 0 8.5 8.5 4.5 4.5 0 0 0 7 18z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const LABELS = {
  idle: 'Salvat',
  pending: 'Se salvează…',
  saving: 'Se salvează…',
  saved: 'Salvat',
  error: 'Eroare salvare',
} as const;

/** Indicator mobil — pictogramă cloud (fără text), starea auto-save. */
export function AutoSaveIndicator({ className = '' }: { className?: string }) {
  const status = useAutoSaveGlobalStatus();
  const label = LABELS[status];

  const tone =
    status === 'error'
      ? 'text-red-400'
      : status === 'saved'
        ? 'text-emerald-400'
        : status === 'pending' || status === 'saving'
          ? 'text-corporate-gold animate-pulse'
          : 'text-white/35';

  return (
    <span
      className={['inline-flex items-center justify-center', tone, className].join(' ')}
      title={label}
      aria-label={label}
      role="status"
      aria-live="polite"
    >
      <span className="relative inline-flex h-4 w-4 items-center justify-center @md:h-5 @md:w-5">
        <CloudIcon className="h-4 w-4 @md:h-5 @md:w-5" />
        {status === 'saved' && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon className="h-2 w-2" />
          </span>
        )}
      </span>
    </span>
  );
}

/** Desktop — text discret (opțional lângă footer sau form). */
export function AutoSaveStatusText({ className = '' }: { className?: string }) {
  const status = useAutoSaveGlobalStatus();
  if (status === 'idle') return null;

  return (
    <p
      className={['text-xs text-gray-400', className].join(' ')}
      role="status"
      aria-live="polite"
    >
      {LABELS[status]}
    </p>
  );
}
