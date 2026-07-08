import { useEffect } from 'react';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
import { PHONE_LAYOUT_HTML_CLASS } from '@/lib/responsiveLayout';

/** Aplică clasa globală pe `<html>` — scalare tipografie mobil (doar telefon). */
export function PhoneLayoutClassEffect() {
  const phoneLayout = usePhoneLayout();

  useEffect(() => {
    document.documentElement.classList.toggle(PHONE_LAYOUT_HTML_CLASS, phoneLayout);
    return () => {
      document.documentElement.classList.remove(PHONE_LAYOUT_HTML_CLASS);
    };
  }, [phoneLayout]);

  return null;
}
