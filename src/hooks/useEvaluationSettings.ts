import { useEffect, useState } from 'react';
import {
  EVALUATION_SETTINGS_CHANGED_EVENT,
  getEvaluationSettings,
  type EvaluationSettings,
} from '@/lib/evaluationSettings';

export function useEvaluationSettings(): EvaluationSettings {
  const [settings, setSettings] = useState(getEvaluationSettings);

  useEffect(() => {
    const refresh = () => setSettings(getEvaluationSettings());
    window.addEventListener(EVALUATION_SETTINGS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(EVALUATION_SETTINGS_CHANGED_EVENT, refresh);
  }, []);

  return settings;
}
