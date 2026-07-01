interface BrandLogoProps {
  className?: string;
  /** light = logo alb pe fundal închis (ca artgranit.ro); dark = logo negru pe fundal deschis */
  tone?: 'light' | 'dark';
  height?: number;
}

export function BrandLogo({ className = '', tone = 'light', height = 28 }: BrandLogoProps) {
  return (
    <img
      src="/brand/artgranit-logo.svg"
      alt="artGRANIT"
      className={[
        'w-auto object-contain',
        tone === 'light' ? 'brightness-0 invert' : '',
        className,
      ].join(' ')}
      style={{ height }}
    />
  );
}
