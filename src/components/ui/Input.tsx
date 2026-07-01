import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-corporate-black">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={[
          'w-full rounded-xl border border-corporate-border bg-white px-4 py-2.5 text-sm',
          'placeholder:text-corporate-muted/60 focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25',
          error ? 'border-red-300' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  ),
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className = '', id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-corporate-black">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={[
          'w-full rounded-xl border border-corporate-border bg-white px-4 py-2.5 text-sm min-h-[100px] resize-y',
          'placeholder:text-corporate-muted/60 focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25',
          className,
        ].join(' ')}
        {...props}
      />
    </div>
  ),
);

Textarea.displayName = 'Textarea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, options, className = '', id, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-corporate-black">
          {label}
        </label>
      )}
      <select
        id={id}
        className={[
          'w-full rounded-xl border border-corporate-border bg-white px-4 py-2.5 text-sm',
          'focus:border-corporate-gold focus:outline-none focus:ring-2 focus:ring-corporate-gold/25',
          className,
        ].join(' ')}
        {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
