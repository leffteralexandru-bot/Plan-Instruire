interface BrandLogoProps {
  className?: string;
  /** light = logo alb pe fundal închis (ca artgranit.ro); dark = logo negru pe fundal deschis */
  tone?: 'light' | 'dark';
  height?: number;
}

export function BrandLogo({ className = '', tone = 'light', height }: BrandLogoProps) {
  return (
    <img
      src="/brand/artgranit-logo.svg"
      alt="artGRANIT"
      className={[
        'w-auto object-contain',
        tone === 'light' ? 'brightness-0 invert' : '',
        height == null ? 'h-7' : '',
        className,
      ].join(' ')}
      style={height != null ? { height } : undefined}
    />
  );
}
