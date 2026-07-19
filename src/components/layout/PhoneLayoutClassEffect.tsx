import { useEffect, useLayoutEffect } from 'react';
import { usePhoneLayout } from '@/hooks/usePhoneLayout';
import { PHONE_LAYOUT_HTML_CLASS } from '@/lib/responsiveLayout';

/** Aplică clasa globală pe `<html>` — scalare tipografie mobil (doar telefon). */
export function PhoneLayoutClassEffect() {
  const phoneLayout = usePhoneLayout();

  useLayoutEffect(() => {
    document.documentElement.classList.toggle(PHONE_LAYOUT_HTML_CLASS, phoneLayout);
  }, [phoneLayout]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(PHONE_LAYOUT_HTML_CLASS);
    };
  }, []);

  return null;
}
