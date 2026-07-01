interface BrandNameProps {
  className?: string;
  /** Pe fundal închis — tot alb, ca pe artgranit.ro */
  onDark?: boolean;
  artClassName?: string;
  granitClassName?: string;
}

/** Wordmark text artGRANIT — art + GRANIT; pe header/footer întunecat: tot alb */
export function BrandName({
  className = '',
  onDark = false,
  artClassName,
  granitClassName,
}: BrandNameProps) {
  const art = artClassName ?? (onDark ? 'text-white' : 'font-normal');
  const granit = granitClassName ?? (onDark ? 'text-white font-semibold' : 'font-semibold');

  return (
    <span className={className}>
      <span className={art}>art</span>
      <span className={granit}>GRANIT</span>
    </span>
  );
}
