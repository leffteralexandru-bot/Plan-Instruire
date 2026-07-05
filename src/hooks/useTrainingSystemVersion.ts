import { useEffect, useState } from 'react';
import { TRAINING_SYSTEM_UPDATED_EVENT } from '@/lib/trainingSystemStore';

/** Re-render când se modifică sesiunile de re-instruire (localStorage). */
export function useTrainingSystemVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(TRAINING_SYSTEM_UPDATED_EVENT, bump);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'artgranit_re_training_sessions' ||
        e.key === 'artgranit_reinstruire_cereri'
      ) {
        bump();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(TRAINING_SYSTEM_UPDATED_EVENT, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return version;
}
