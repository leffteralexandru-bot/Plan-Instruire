import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || iosStandalone;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Card clar pe login: instalează PWA pe ecranul telefonului */
export function InstallOnPhoneCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const ios = isIosDevice();

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Aplicația este pe ecranul principal al telefonului.
      </div>
    );
  }

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        setDeferred(null);
      }
      return;
    }
    if (ios) {
      setShowIosHelp(true);
      return;
    }
    setShowIosHelp(true);
  };

  return (
    <div className="rounded-xl border border-corporate-border bg-corporate-surface/40 px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-corporate-gold">Pe telefon</p>
      <p className="mt-1 text-sm font-medium text-corporate-dark">Instalează pe ecranul principal</p>
      <p className="mt-0.5 text-xs text-corporate-muted">
        Iconiță ca o aplicație — deschidere rapidă, fără link de fiecare dată.
      </p>

      <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={() => void handleInstall()}>
        {deferred ? 'Instalează acum' : ios ? 'Cum instalez pe iPhone' : 'Cum instalez pe telefon'}
      </Button>

      {showIosHelp && (
        <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-corporate-dark">
          {ios ? (
            <>
              <li>Deschide linkul în <strong>Safari</strong> (nu Chrome).</li>
              <li>Jos: butonul <strong>Partajează</strong> (pătrat cu săgeată ↑).</li>
              <li>Alege <strong>Adaugă pe ecranul principal</strong>.</li>
              <li>Confirmă cu <strong>Adaugă</strong>.</li>
            </>
          ) : (
            <>
              <li>Deschide linkul în <strong>Chrome</strong>.</li>
              <li>Sus dreapta: meniul <strong>⋮</strong>.</li>
              <li>
                Alege <strong>Instalează aplicația</strong> sau <strong>Adaugă pe ecranul principal</strong>.
              </li>
            </>
          )}
        </ol>
      )}
    </div>
  );
}
